# Integration Guide: Citation Court

## 1. Network & Deployment Reference
- **Network**: GenLayer Studionet (Chain ID: `61999`)
- **RPC Endpoint**: `https://studio.genlayer.com/api`
- **Explorer Base**: `https://explorer-studio.genlayer.com/address/`
- **CitationCourt Address**: `0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5`
- **CitedBoard Consumer Address**: `0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4`

---

## 2. Receipt Semantics & Success Rules
A write transaction is successful on GenLayer Studionet if and only if:
1. `receipt.status_name === "ACCEPTED"`
2. `receipt.result_name === "MAJORITY_AGREE"` (or `consensus_data.leader_receipt[0].execution_result === "SUCCESS"`)

> [!NOTE]
> Write calls do not return execution payloads in the transaction receipt. Applications must read contract state back using view calls once the transaction receipt is confirmed.

---

## 3. Public Write Methods

### A. `lodge_claim(claim: str, source_url: str) -> str`
Lodges a new single-fact claim along with its supporting URL.
- **Parameters**:
  - `claim` (string, 20 to 400 characters stripped).
  - `source_url` (string, maximum 300 characters, https scheme, port 443 or omitted, no userinfo, no private IP literals).
- **Return Value**: Incremental string decimal claim ID (e.g. `"1"`, `"2"`).
- **Latency**: ~3-5 seconds.

### B. `judge_claim(claim_id: str) -> str`
Triggers multi-validator web retrieval and LLM evaluation under the Equivalence Principle.
- **Parameters**:
  - `claim_id` (string): ID of a previously lodged claim.
- **Permissions**: Anyone may call.
- **Rules**:
  - Unknown ID -> `gl.vm.UserError("unknown claim id")`.
  - Already judged (`verdict != UNREADABLE`) -> `gl.vm.UserError("claim already judged")`.
  - Attempts $\ge 3$ -> `gl.vm.UserError("attempt limit reached")`.
- **Latency**: ~12-16 seconds.

---

## 4. Public View Methods & Sample Read-Backs

### `get_claim(claim_id: str) -> str`
Returns the JSON record of the claim or empty string if not found.
```json
{
  "author": "0x06cd2B6279B28A3E82D6b97A35a1bB170a9654bF",
  "claim": "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.",
  "id": "1",
  "schema_version": "1",
  "seq": "1",
  "url": "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md"
}
```

### `get_ruling(claim_id: str) -> str`
Returns the consensus ruling record or empty string if unjudged.
```json
{
  "attempts": 1,
  "claim_id": "1",
  "schema_version": "1",
  "verdict": "SUPPORTS"
}
```

### `list_recent(limit: int = 10) -> str`
Returns a JSON list of recent claim IDs (capped at 20, newest first).
```json
["7", "6", "5", "4", "3", "2", "1"]
```

### `list_by_author(author: str, limit: int = 10) -> str`
Returns a JSON list of claim IDs submitted by the given address.
```json
["2", "1"]
```

### `latest_by_author(author: str) -> str`
Returns the most recent claim ID for the given address, or empty string.

### `get_stats() -> str`
Returns aggregate platform statistics.
```json
{
  "contradicts": 2,
  "not_addressed": 2,
  "supports": 1,
  "total_claims": 7,
  "total_judgments": 8,
  "unreadable": 3
}
```

---

## 5. User Error Messages
All client errors are raised as `gl.vm.UserError` with exact strings:
- `"claim must be string"`
- `"claim length below minimum 20 characters"`
- `"claim length exceeds maximum 400 characters"`
- `"url must be string"`
- `"url length exceeds limit"`
- `"url contains whitespace"`
- `"url scheme must be https"`
- `"url hostname missing"`
- `"url contains userinfo"`
- `"url port must be 443 or omitted"`
- `"url hostname cannot be localhost"`
- `"url host cannot be private or reserved IP"`
- `"unknown claim id"`
- `"claim already judged"`
- `"attempt limit reached"`

---

## 6. JavaScript Client Example (`genlayer-js`)
```javascript
import { createClient, chains, createAccount } from 'genlayer-js';

const client = createClient({
  chain: chains.studionet,
  account: createAccount(),
});

const courtAddress = "0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5";

// 1. Lodge claim
const lodgeTx = await client.writeContract({
  address: courtAddress,
  functionName: 'lodge_claim',
  args: [
    "Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.",
    "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md"
  ],
});
await client.waitForTransactionReceipt({ hash: lodgeTx, retries: 120, interval: 3000 });

// 2. Read recent
const recent = JSON.parse(await client.readContract({
  address: courtAddress,
  functionName: 'list_recent',
  args: [1],
}));
const claimId = recent[0];

// 3. Request judgment
const judgeTx = await client.writeContract({
  address: courtAddress,
  functionName: 'judge_claim',
  args: [claimId],
});
await client.waitForTransactionReceipt({ hash: judgeTx, retries: 120, interval: 3000 });

// 4. Read back ruling
const ruling = JSON.parse(await client.readContract({
  address: courtAddress,
  functionName: 'get_ruling',
  args: [claimId],
}));
console.log("Verdict:", ruling.verdict); // "SUPPORTS"
```

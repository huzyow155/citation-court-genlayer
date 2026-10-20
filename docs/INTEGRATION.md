# Integration Guide: Citation Court

Status: Preview
Target Chain: GenLayer Studionet (Chain ID: `61999`)
RPC Endpoint: `https://studio.genlayer.com/api`
Explorer URL: `https://explorer-studio.genlayer.com`

---

## 1. Network and Deployment Reference

| Contract | Address | Version | Description |
| :--- | :--- | :--- | :--- |
| **CitationCourtV2** | `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe` | `2.0.0` (Milestone 1) | Multi-source corroboration engine (up to 3 sources, LLM-free deterministic combiner) |
| **CitationCourt** (V1) | `0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5` | `1.0.0` (Preview Baseline) | Single-source verification baseline |
| **CitedBoard** | `0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4` | `1.0.0` | Sample consumer contract demonstrating citation verification gating |

---

## 2. Receipt Semantics and Success Rules

A write transaction is accepted by consensus validators on GenLayer Studionet if and only if:
1. `receipt.status_name === "ACCEPTED"` or `receipt.status_name === "FINALIZED"`
2. `receipt.result_name === "MAJORITY_AGREE"`
3. `receipt.consensus_data.leader_receipt[0].execution_result === "SUCCESS"`
4. State is read back via contract view methods.

> [!NOTE]
> Write calls do not return execution payloads in the transaction receipt. Applications must read contract state back using view calls once the transaction receipt is confirmed.

---

## 3. Public Write Methods (V2)

### A. `lodge_claim(claim: str, source_url: str) -> str`
Lodges a new claim along with its primary source URL (index 0).
- **Parameters**:
  - `claim` (string, 20 to 400 characters stripped).
  - `source_url` (string, maximum 300 characters, https scheme, port 443 or omitted, no userinfo, no private IP literals).
- **Return Value**: Incremental string decimal claim ID (e.g. `"1"`, `"2"`).
- **Permissions**: Anyone may call.

### B. `add_source(claim_id: str, source_url: str) -> str`
Appends an additional independent source URL to an existing claim (up to 3 sources total).
- **Parameters**:
  - `claim_id` (string): ID of a previously lodged claim.
  - `source_url` (string): Valid HTTPS URL passing deduplication checks against existing sources.
- **Return Value**: String index of the newly added source (e.g. `"1"`, `"2"`).
- **Permissions**: Only the original claim author (`gl.message.sender_address`).
- **User Errors**:
  - `"unknown claim id"`: Claim ID not found.
  - `"only the claim author can add sources"`: Caller does not match claim author.
  - `"source limit reached"`: Claim already has 3 registered sources.
  - `"duplicate source"`: URL matches an existing source after scheme/host lowercasing, trailing slash removal, and fragment stripping.

### C. `judge_source(claim_id: str, index: int) -> str`
Triggers multi-validator consensus web retrieval and evaluation for the specified source index.
- **Parameters**:
  - `claim_id` (string): Target claim ID.
  - `index` (integer): Index of the source URL to evaluate (`0`, `1`, or `2`).
- **Return Value**: Consensus verdict (`"SUPPORTS"`, `"CONTRADICTS"`, `"NOT_ADDRESSED"`, or `"UNREADABLE"`).
- **Permissions**: Anyone may call.
- **User Errors**:
  - `"unknown claim id"`: Claim ID not found.
  - `"invalid source index"`: Index out of bounds or negative.
  - `"claim already judged"`: Source index already holds a final verdict.
  - `"attempt limit reached"`: Source has been retried 3 times with `UNREADABLE`.

### D. `judge_claim(claim_id: str) -> str`
Backward-compatible alias for `judge_source(claim_id, 0)`.

---

## 4. Public View Methods (V2)

### A. `is_corroborated(claim_id: str, min_supports: int) -> str`
Determines whether a claim is corroborated according to consumer requirements.
- **Parameters**:
  - `claim_id` (string): Claim ID.
  - `min_supports` (integer): Minimum number of independent supporting sources required (parameter is bounded to range 1..3).
- **Return Value**: `"true"` if `contradicts == 0` and `supports >= min_supports`, otherwise `"false"`.
- **Note**: If any contradictory source is recorded, `is_corroborated` always returns `"false"`.

### B. `get_corroboration(claim_id: str) -> str`
Returns a canonical JSON string containing the full corroboration status:
```json
{
  "claim_id": "1",
  "contradicts": 0,
  "judged_count": 2,
  "label": "CORROBORATED",
  "not_addressed": 0,
  "supports": 2,
  "total_sources": 2,
  "unreadable": 0
}
```

### C. `get_sources(claim_id: str) -> str`
Returns a JSON array of all registered source URLs for a claim:
```json
[
  "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md",
  "https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md"
]
```

### D. `get_source_ruling(claim_id: str, index: int) -> str`
Returns the JSON ruling for a specific source index:
```json
{
  "attempts": "1",
  "claim_id": "1",
  "index": "0",
  "schema_version": "2",
  "url": "https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md",
  "verdict": "SUPPORTS"
}
```

### E. Standard Views
- `get_claim(claim_id: str) -> str`: Returns claim metadata record.
- `get_ruling(claim_id: str) -> str`: Returns ruling for source index 0 (backward-compatible).
- `list_recent(limit: int = 10) -> str`: Returns list of recent claim IDs (up to 20).
- `list_by_author(author: str, limit: int = 10) -> str`: Returns claim IDs by author.
- `latest_by_author(author: str) -> str`: Returns newest claim ID for author.
- `get_stats() -> str`: Returns aggregate protocol statistics.

---

## 5. Consumer Integration Pattern (Reading Corroboration)

A consumer dApp or cross-contract reader queries `is_corroborated` before acting on user claims:

```javascript
import { createClient, chains, createAccount } from 'genlayer-js';

const client = createClient({
  chain: chains.studionet,
  account: createAccount(),
});

const CITATION_COURT_V2_ADDRESS = "0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe";

// Check if claim 1 has at least 2 independent supporting sources and 0 contradictions
const isCorroborated = await client.readContract({
  address: CITATION_COURT_V2_ADDRESS,
  functionName: 'is_corroborated',
  args: ["1", 2],
});

if (isCorroborated === "true") {
  console.log("Claim 1 is verified with multi-source corroboration.");
} else {
  // Read detailed breakdown
  const statusRaw = await client.readContract({
    address: CITATION_COURT_V2_ADDRESS,
    functionName: 'get_corroboration',
    args: ["1"],
  });
  const status = JSON.parse(statusRaw);
  console.log("Corroboration label:", status.label); // e.g. "SINGLE_SOURCE", "DISPUTED", "UNSUPPORTED"
}
```

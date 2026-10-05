# Citation Court (`citation-court-genlayer`)

> Multi-validator citation and claim-evidence verification intelligent contract on GenLayer Studionet.

## Status: Preview

## Overview
**Citation Court** is an Intelligent Contract on GenLayer that answers a single crucial question: **Does the web page behind a given hyperlink actually substantiate the claim?**

In contemporary digital media and AI systems, fake, hallucinated, and phantom citations are pervasive. Anyone can publish a confident factual statement accompanied by a hyperlink, creating an appearance of credibility even when the cited source is entirely silent or directly contrary to the assertion.

Citation Court introduces a decentralized, multi-validator adjudication protocol:
1. Anyone lodges a claim text (20-400 characters) paired with an HTTPS source URL.
2. Independent GenLayer validators retrieve the target web page via non-deterministic HTTP fetching (`gl.nondet.web.get`).
3. HTML is deterministically stripped of scripts, styles, and tags, and normalized.
4. For long pages (>8000 characters), deterministic keyword-density windowing extracts the most relevant semantic contexts up to 6000 characters in their original document order.
5. Independent validator LLMs evaluate the claim against the page context.
6. **Verbatim Grounding Downgrade**: If an LLM returns `SUPPORTS` or `CONTRADICTS`, the contract verifies that the accompanying quote is at least 25 characters long and is a literal substring of the full cleaned source page. If ungrounded or fabricated, the verdict is deterministically downgraded to `NOT_ADDRESSED`.
7. Validators achieve consensus on exactly **one canonical enum**: `SUPPORTS`, `CONTRADICTS`, `NOT_ADDRESSED`, or `UNREADABLE`.

---

## Why GenLayer
Evaluating claim citations requires:
- **Real-time web retrieval** of arbitrary external web pages.
- **Semantic natural language understanding** to evaluate evidence against claims.

On traditional deterministic blockchains, contracts cannot make outbound HTTP calls or run natural language reasoning. On a centralized server, verification can be silently compromised or censored. On GenLayer, multiple independent validators execute both web retrieval and LLM evaluation under the Equivalence Principle (`gl.eq_principle.strict_eq`), producing decentralized, verifiable rulings directly queryable on-chain.

---

## Non-Goals
- **No Source Reliability Assessment:** The contract does not determine whether the source website is reputable; it only checks the claim-to-source relationship.
- **No Real-World Ground Truth Oracle:** It does not determine if an assertion is true in the external world, only whether the cited page says what is claimed.
- **No PDF, Paywalled, or JavaScript-Rendered Pages:** The contract evaluates static HTTP/HTTPS text and HTML.
- **No Permanent Page Archival:** Source page bodies are evaluated dynamically and are not stored in on-chain state.
- **No Supporting Quote Storage:** The supporting quote is used purely for validator-side grounding and is deliberately excluded from persistent state and consensus strings.

---

## Deployed Address & Studionet Explorer
- **Network**: GenLayer Studionet (Chain ID: `61999`)
- **RPC URL**: `https://studio.genlayer.com/api`
- **CitationCourt Address**: `0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5`
- **Studionet Explorer**: [https://explorer-studio.genlayer.com/address/0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5](https://explorer-studio.genlayer.com/address/0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5)
- **CitedBoard Consumer Address**: `0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4`
- **Consumer Explorer**: [https://explorer-studio.genlayer.com/address/0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4](https://explorer-studio.genlayer.com/address/0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4)

---

## Verified Transactions & Latency

| Scenario | Claim ID | Verdict | Status | Consensus Result | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Contract Deploy** | - | - | ACCEPTED | MAJORITY_AGREE | - |
| **Case A (Supports)** | 1 | `SUPPORTS` | ACCEPTED | MAJORITY_AGREE | 15.12s |
| **Case B (Contradicts)** | 2 | `CONTRADICTS` | ACCEPTED | MAJORITY_AGREE | 15.52s |
| **Case C (Not Addressed)** | 3 | `NOT_ADDRESSED` | ACCEPTED | MAJORITY_AGREE | 15.32s |
| **Case D (Near-Miss Trap)** | 4 | `CONTRADICTS` | ACCEPTED | MAJORITY_AGREE | 12.06s |
| **Case E (Prompt Injection)**| 5 | `NOT_ADDRESSED` | ACCEPTED | MAJORITY_AGREE | 15.40s |
| **Case F (404 Unreadable)** | 6 | `UNREADABLE` | ACCEPTED | MAJORITY_AGREE | 12.08s |
| **Case F (Re-judge Attempt)**| 6 | `UNREADABLE` | ACCEPTED | MAJORITY_AGREE | 8.85s |
| **Case G (Short Page <200)** | 7 | `UNREADABLE` | ACCEPTED | MAJORITY_AGREE | 9.42s |
| **Consumer Cross-Contract** | 1 | `POSTED` | ACCEPTED | MAJORITY_AGREE | 4.10s |

Average consensus judgment latency: **~13.2s**.

---

## Test Suite & Star Test
The project includes a 3-layer test suite with 21 unit tests:
```bash
python -m unittest discover tests
```
- **Layer 1 (Pure Functions & Star Test)**: Validates text normalization, HTML cleaning, keyword-density windowing, structured URL parsing, and the **Star Test** (proves that fabricated quotes are downgraded to `NOT_ADDRESSED` while naive baselines fail).
- **Layer 2 (Mocked Simulator)**: Tests all contract error conditions, permission checks, SSRF injection resistance, 404 attempt accounting, and discovery view limits.
- **Layer 3 (Consensus Dynamics)**: Validates that heterogeneous validator models converge to the exact same canonical enum.

---

## Known Limitations
1. **Dynamic / Client-Side Rendered Web Pages:** Pages relying exclusively on client-side JavaScript execution (SPAs) will yield raw script/template markup or minimal text (<200 chars), resulting in `UNREADABLE`.
2. **Volatile Web Content:** If a target URL changes between validator execution windows, validators may fetch divergent text, leading to `MAJORITY_DISAGREE`.
3. **Paywalled / Bot-Protected Content:** Sites enforcing Cloudflare CAPTCHAs, CloudFront blocks, or subscription paywalls will return HTTP 403/401 and resolve as `UNREADABLE`.

---

## Step-by-Step Deploy to Studionet
```bash
# 1. Install dependencies
npm install

# 2. Run test suite
python -m unittest discover tests

# 3. Deploy and execute on-chain evidence
node scripts/deploy/deploy_core.js
node scripts/deploy/run_live_evidence.js
node scripts/deploy/deploy_consumer.js
```

---

## License
MIT License. Copyright (c) 2026 huzyow155.

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
6. **Normalized Grounding Downgrade**: If an LLM returns `SUPPORTS` or `CONTRADICTS`, the contract verifies that the accompanying quote is at least 25 characters long and appears contiguously in the full cleaned source text after normalizing case, whitespace, and typographic punctuation. If ungrounded or fabricated, the verdict is deterministically downgraded to `NOT_ADDRESSED`.
7. Validators achieve consensus on exactly **one canonical enum**: `SUPPORTS`, `CONTRADICTS`, `NOT_ADDRESSED`, or `UNREADABLE`.

### Milestone 1: Multi-Source Corroboration (V2)
While V1 judges a claim against exactly one source URL, **CitationCourtV2** introduces multi-source corroboration:
- A claim author can register up to 3 independent source URLs.
- Each source is judged independently via multi-validator consensus using the unchanged evaluation pipeline.
- An LLM-free deterministic pure function (`_combine`) synthesizes individual verdicts into an overall corroboration standing:
  - `CORROBORATED`: >= 2 supporting sources and 0 contradictions.
  - `SINGLE_SOURCE`: Exactly 1 supporting source and 0 contradictions.
  - `DISPUTED`: At least 1 supporting source and at least 1 contradictory source.
  - `CONTRADICTED`: At least 1 contradictory source and 0 supporting sources.
  - `UNSUPPORTED`: Judged sources yielded only `NOT_ADDRESSED` and/or `UNREADABLE`.
  - `UNJUDGED`: No sources have been evaluated yet.
- Downstream contracts query `is_corroborated(claim_id, min_supports)`: strictly returns `"true"` only if `contradicts == 0` and `supports >= min_supports` (bounded range 1..3).

---

## Why GenLayer
Evaluating claim citations requires:
- **Real-time web retrieval** of arbitrary external web pages.
- **Semantic natural language understanding** to evaluate evidence against claims.

On traditional deterministic blockchains, contracts cannot make outbound HTTP calls or run natural language reasoning. On a centralized server, verification can be silently altered or censored. On GenLayer, multiple independent validators execute both web retrieval and LLM evaluation under the Equivalence Principle (`gl.eq_principle.strict_eq`), producing decentralized, verifiable rulings directly queryable on-chain.

---

## Non-Goals
- **No Source Reliability Assessment:** The contract does not determine whether the source website is reputable; it only checks the claim-to-source relationship.
- **No Real-World Ground Truth Oracle:** It does not determine if an assertion is true in the external world, only whether the cited page says what is claimed.
- **No PDF, Paywalled, or JavaScript-Rendered Pages:** The contract evaluates static HTTP/HTTPS text and HTML.
- **No Permanent Page Archival:** Source page bodies are evaluated dynamically and are not stored in on-chain state.
- **No Supporting Quote Storage:** The supporting quote is used purely for validator-side grounding and is deliberately excluded from persistent state and consensus strings.

---

## Deployed Addresses & Studionet Explorers

| Contract | Address | Studionet Explorer Link | Status / Version |
| :--- | :--- | :--- | :--- |
| **CitationCourtV2** | `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe` | [View V2 on Explorer](https://explorer-studio.genlayer.com/address/0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe) | Milestone 1 (2.0.0, Multi-Source Corroboration) |
| **CitationCourt** (V1) | `0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5` | [View V1 on Explorer](https://explorer-studio.genlayer.com/address/0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5) | Preview Baseline (1.0.0, Single-Source) |
| **CitedBoard** | `0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4` | [View CitedBoard on Explorer](https://explorer-studio.genlayer.com/address/0x339dA01705d57f0d6AD917f0eC4950f8a8f95CC4) | Consumer Reference Contract |

---

## Public Methods Summary

### Write Methods
- `lodge_claim(claim: str, source_url: str) -> str`: Lodges a claim with initial source URL (index 0).
- `add_source(claim_id: str, source_url: str) -> str`: Adds up to 2 corroborating URLs (claim author only, duplicate rejected).
- `judge_source(claim_id: str, index: int) -> str`: Triggers multi-validator consensus for a specific source index.
- `judge_claim(claim_id: str) -> str`: V1-compatible alias for `judge_source(claim_id, 0)`.

### View Methods
- `is_corroborated(claim_id: str, min_supports: int) -> str`: Returns `"true"` if contradicts == 0 and supports >= min_supports (clamped 1..3).
- `get_corroboration(claim_id: str) -> str`: Returns canonical JSON with label, per-verdict counts, and source totals.
- `get_sources(claim_id: str) -> str`: Returns JSON array of registered source URLs.
- `get_source_ruling(claim_id: str, index: int) -> str`: Returns ruling record for a specific source index.
- `get_claim(claim_id: str) -> str`: Returns claim metadata record.
- `get_ruling(claim_id: str) -> str`: Returns ruling for source index 0.
- `list_recent(limit: int = 10) -> str`: Lists recent claim IDs.
- `list_by_author(author: str, limit: int = 10) -> str`: Lists claim IDs by author.
- `latest_by_author(author: str) -> str`: Returns newest claim ID for author.
- `get_stats() -> str`: Returns protocol statistics.

---

## Test Suite & Star Test
The project includes a 3-layer automated test suite with 32 unit tests:
```bash
python -m unittest discover tests -v
```
- **Layer 1 (Pure Functions, Parity & Star Test - 13 tests)**: Validates text normalization, HTML cleaning, keyword-density windowing, structured URL parsing, the **Star Test** (fabricated quotes downgraded to `NOT_ADDRESSED`), exhaustive 85-combination parity check between contract and harness `_combine`, and 200-cycle seeded random fuzzing sequences.
- **Layer 2 (Mocked Simulator - 16 tests)**: Tests all 7 protocol user errors (`unknown claim id`, `claim already judged`, `attempt limit reached`, `only the claim author can add sources`, `source limit reached`, `duplicate source`, `invalid source index`), duplicate URL detection across case/slashes/fragments, multi-source corroboration state transitions, and view limits.
- **Layer 3 (Consensus Dynamics - 3 tests)**: Validates that heterogeneous validator models converge to the exact same canonical enum.

---

## Known Limitations
1. **Grounding Limitation and Adversarial Text:** The grounding check verifies that a passage appears contiguously in the source text after normalization of case, whitespace, and typographic punctuation; it does NOT verify whether the source text is reliable, truthful, free of adversarial injections, or semantically related to the claim. If an adversarial page contains an injected assertion and the model quotes that passage, grounding will succeed. Defending against prompt injection relies strictly on framing untrusted data inside structured delimiters and LLM instruction-following.
2. **Client-Side Rendered Web Pages:** Pages relying exclusively on client-side JavaScript execution (SPAs) will yield raw script/template markup or minimal text (<200 chars), resulting in `UNREADABLE`.
3. **Volatile Web Content:** If a target URL changes between validator execution windows, validators may fetch divergent text, leading to `MAJORITY_DISAGREE`.
4. **Paywalled / Bot-Protected Content:** Sites enforcing Cloudflare CAPTCHAs, CloudFront blocks, or subscription paywalls will return HTTP 403/401 and resolve as `UNREADABLE`.
5. **Layer 2/3 Test Execution:** Layer 2 and Layer 3 tests run against a pure-Python simulator and do not execute under GenVM.

---

## Step-by-Step Deploy to Studionet
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
python -m unittest discover tests

# 3. Deploy CitationCourtV2 and run on-chain verification
node scripts/deploy/deploy_and_verify_v2.js

# 4. Generate Milestone report
node scripts/m1_report.mjs
```

---

## License
MIT License. Copyright (c) 2026 huzyow155.

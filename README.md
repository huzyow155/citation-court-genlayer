# Citation Court (`citation-court-genlayer`)

> Multi-validator citation and claim-evidence verification intelligent contract on GenLayer Studionet.

## Status: Preview

## Overview
**Citation Court** is an Intelligent Contract running on GenLayer that evaluates whether an online source link actually substantiates a stated claim.

In modern information ecosystems, false citations, phantom references, and hallucinated citations are rampant. Authors and AI generators frequently cite URLs that do not mention the claimed fact or directly contradict it.

Citation Court solves this by having independent GenLayer validators:
1. Fetch the actual web page via non-deterministic HTTP retrieval.
2. Clean HTML content deterministically.
3. Extract relevant semantic contexts using deterministic keyword-density windowing.
4. Evaluate claim-to-source alignment via an LLM judge.
5. **Enforce verbatim grounding**: Downgrade ungrounded or fabricated quotes to `NOT_ADDRESSED`.
6. Reach consensus on a single canonical enum: `SUPPORTS`, `CONTRADICTS`, `NOT_ADDRESSED`, or `UNREADABLE`.

---

## Non-Goals
To maintain clear boundaries and predictable validator execution:
- **No Source Reliability Assessment:** The contract does not rank whether a publication is trustworthy or authoritative; it exclusively evaluates the claim-to-text relationship.
- **No Real-World Ground Truth Oracle:** It does not decide if an assertion is true in reality, only whether the cited document states it.
- **No PDF, Paywall, or JavaScript Execution:** Only HTTP/HTTPS static text/HTML pages are supported.
- **No Image or Media Analysis:** Media content is ignored.
- **No Permanent Page Archival:** Full page contents are not stored in contract state.

---

## Deployed Address & Studionet Explorer
- **Network:** GenLayer Studionet (Chain ID: 61999)
- **RPC:** `https://studio.genlayer.com/api`
- **Contract Address:** TBD (Milestone 2)
- **Studionet Explorer:** `https://explorer-studio.genlayer.com/address/<TBD>`

---

## Repository Structure
- `contracts/`: Intelligent Contract sources (`CitationCourt.py`).
- `fixtures/`: Test documents used for reproducible validator verification.
- `scripts/`: Deployment, validation, secret scanning, and banned-word checking scripts.
- `tests/`: Multi-layer test suite (pure unit tests, simulator tests, consensus agreement tests).
- `docs/`: Technical specifications (`PRIOR_ART.md`, `DESIGN.md`, `RUNTIME_NOTES.md`, `INTEGRATION.md`, `VERIFICATION.md`).

---

## License
MIT License. Copyright (c) 2026 huzyow155.

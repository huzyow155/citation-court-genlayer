# Prior Art Analysis: Citation Court

## 1. Overview and Problem Context
Citation Court solves the problem of **fabricated, hallucinated, or ungrounded citations** across digital publications and AI-generated outputs. Often, an author or automated agent presents a factual statement accompanied by a hyperlink, creating an illusion of verification. In practice, the linked page frequently fails to mention the claimed fact, directly contradicts it, or presents unrelated narrative.

Existing off-chain tools and smart contract paradigms address portions of this verification challenge, but Citation Court introduces a distinct decentralized consensus model.

---

## 2. Search Methodology & Verified Links

### Search Queries Executed:
1. `site:github.com "genlayer" "fact" OR "oracle" OR "claim"`
2. `site:github.com "genlayer" contracts "gl.Contract"`
3. `site:github.com/yeagerai "genlayer" OR "contracts" OR "examples"`
4. `site:github.com/genlayerlabs "web.get" OR "strict_eq" OR "contracts"`
5. `"CiteCheck" OR "RefLens" OR "GhostCite" arxiv citation hallucination`

### Verification of Candidate Links (HTTP Status & Titles):
- **`https://github.com/genlayerlabs/genlayer-project-boilerplate`**: HTTP 200 (GenLayer official boilerplate with contracts, web retrieval, and testing suite).
- **`https://docs.genlayer.com`**: HTTP 200 (Title: *GenLayer — The Adjudication Layer for the Agentic Economy*).
- **`https://arxiv.org/abs/2605.27700`**: HTTP 200 (Title: *[2605.27700] CiteCheck: Retrieval-Grounded Detection of LLM Citation Hallucinations in Scientific Text*).
- **`https://arxiv.org/abs/2602.06718`**: HTTP 200 (Title: *[2602.06718] GhostCite: A Large-Scale Analysis of Citation Validity in the Age of Large Language Models*).
- *(Note: Hallucinated / invalid links `https://github.com/genlayer-community/evidence-claim-escrow`, `https://github.com/genlayer-community/canon`, `https://arxiv.org/abs/2510.14920`, and DOI `10.1609/aaai.v40i1.refllens` returned HTTP 404 or mismatched titles and have been completely removed from this documentation).*

---

## 3. Related Prior Art

### A. Academic Literature
1. **CiteCheck (arXiv:2605.27700)**:
   - Evaluates LLM citation faithfulness against scholarly documents via centralized retrieval and metadata checking.
   - Outputs soft evaluation scores for offline review.
2. **GhostCite (arXiv:2602.06718)**:
   - Empirical study demonstrating that language models frequently invent citations prioritizing plausible formatting over true document presence.
3. **Evidence Extraction Systems (Off-chain)**:
   - Certain off-chain pipelines attempt span extraction for human review; however, specific quote-verification claims for "RefLens" remain unconfirmed in verified peer-reviewed venues.

### B. GenLayer Ecosystem Prior Art
In the official GenLayer repositories (`genlayerlabs/genlayer-project-boilerplate`), example contracts (such as `contracts/football_bets.py`) demonstrate web-based resolution:
- The contract fetches web URLs via `gl.nondet.web.get(resolution_url)` and resolves bets by prompting an LLM to extract game winners and scores.
- **Key Distinction**: It relies directly on the LLM's returned decision fields without requiring verbatim quote containment, substring validation, or length-gated mechanical downgrade.

---

## 4. Honest Comparison Matrix: What Is New vs. What Is Not

| Dimension | Academic Systems (CiteCheck) | Official GenLayer Boilerplate (`football_bets.py`) | Citation Court (This Project) |
| :--- | :--- | :--- | :--- |
| **Execution Environment** | Centralized server / local script | GenLayer GenVM (Python) | GenLayer GenVM (Python) *(Not new)* |
| **Autonomous Web Retrieval** | Centralized crawler / API | `gl.nondet.web.get(url)` | `gl.nondet.web.get(url)` with structured URL validation |
| **Consensus Mechanism** | None (single process) | Equivalence principle on raw data | `gl.eq_principle.strict_eq` on a single canonical enum *(Not new)* |
| **Verbatim Quote Grounding** | Offline metadata check | None | **Mandatory verbatim quote substring check (`_ground()`)** *(New on-chain)* |
| **Deterministic Downgrade Gate** | Soft scores in report | None | **Code mechanically forces `NOT_ADDRESSED` on missing quote** *(New on-chain)* |
| **Deterministic Long-Page Windowing** | Centralized chunking | None / direct truncation | **Deterministic keyword-density windowing preserving document order** |
| **On-Chain Composability** | None | Bet settlement | Synchronous cross-contract view queries for dependent dApps |

### What Is NOT New:
- Web retrieval (`gl.nondet.web.get`) and LLM inference (`gl.nondet.exec_prompt`) are platform features of GenLayer GenVM.
- Consensus via `gl.eq_principle.strict_eq` is standard GenLayer architecture.

### What IS Novel in Citation Court:
The **deterministic on-chain downgrade rule (`_ground`)**:
Rather than trusting the model's reported verdict, contract code enforces that the candidate quote is at least 25 characters long and is a verbatim substring of the cleaned source text. If a model hallucinates an affirmative verdict with a fabricated quote, the code deterministically downgrades the verdict to `NOT_ADDRESSED`. Independent validators compare only this single canonical enum, preventing quote discrepancies from fracturing consensus.

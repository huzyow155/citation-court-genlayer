# Prior Art Analysis: Citation Court

## 1. Overview and Problem Context
Citation Court addresses the problem of **fabricated, hallucinated, or ungrounded citations** across digital publications and AI-generated outputs. Often, an author or automated agent presents a factual statement accompanied by a hyperlink, creating an illusion of verification. In practice, the linked page frequently fails to mention the claimed fact, directly contradicts it, or presents unrelated narrative.

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

---

## 3. Related Prior Art: Detailed Comparison

### A. Academic Literature: CiteCheck & GhostCite
1. **CiteCheck: Retrieval-Grounded Detection of LLM Citation Hallucinations (arXiv:2605.27700)**:
   - **What it does**: Focuses on scientific bibliographies. It cross-references generated paper titles, authors, and venues against scholarly databases (e.g. arXiv, Semantic Scholar, CrossRef) to detect if a cited work is real and whether metadata fields match.
   - **How it differs from Citation Court**:
     - *Scope*: CiteCheck verifies bibliographic existence and metadata fidelity (did this paper exist? are the authors correct?), whereas Citation Court evaluates semantic claim-to-source alignment for arbitrary web links (does the text of this specific page actually substantiate this single-fact claim?).
     - *Execution*: CiteCheck is an off-chain Python/API evaluation tool that outputs diagnostic scores for offline reporting. Citation Court is an on-chain intelligent contract executing inside GenVM validators with direct consensus on state transitions.
     - *Enforcement*: CiteCheck provides diagnostic labels (Exact, Minor, Major discrepancy); Citation Court uses an unyielding deterministic code gate that mechanically downgrades ungrounded model outputs to `NOT_ADDRESSED`.

2. **GhostCite: Large-Scale Analysis of Citation Validity (arXiv:2602.06718)**:
   - **What it does**: An empirical measurement study analyzing millions of citations produced by various LLMs to quantify how often models invent plausible-looking references that do not exist in reality.
   - **How it differs from Citation Court**: GhostCite is an observational diagnostic study characterizing the hallucination phenomenon; Citation Court is an active on-chain adjudication protocol designed to prevent ungrounded claims from being accepted by smart contracts.

### B. GenLayer Ecosystem Prior Art
In the official GenLayer repositories (`genlayerlabs/genlayer-project-boilerplate`), example contracts (such as `contracts/football_bets.py`) demonstrate web-based resolution:
- The contract fetches web URLs via `gl.nondet.web.get(resolution_url)` and resolves bets by prompting an LLM to extract game winners and scores.
- **Key Distinction**: It relies directly on the LLM's returned decision fields without requiring verbatim quote containment, substring validation, or length-gated mechanical downgrade.

---

## 4. Honest Comparison Matrix: What Is New vs. What Is Not

| Dimension | CiteCheck (arXiv:2605.27700) | GhostCite (arXiv:2602.06718) | Official GenLayer Boilerplate (`football_bets.py`) | Citation Court (This Project) |
| :--- | :--- | :--- | :--- | :--- |
| **Execution Environment** | Centralized script / API | Centralized benchmark | GenLayer GenVM (Python) | GenLayer GenVM (Python) *(Not new)* |
| **Autonomous Web Retrieval** | Scholarly database APIs | None (offline corpus) | `gl.nondet.web.get(url)` | `gl.nondet.web.get(url)` with structured URL validation |
| **Consensus Mechanism** | None | None | Equivalence principle on raw data | `gl.eq_principle.strict_eq` on a single canonical enum *(Not new)* |
| **Core Verification Focus** | Paper existence & metadata accuracy | Empirical measurement of hallucination rate | Extracting winner/score from web | Semantic claim-to-text substantiation |
| **Verbatim Quote Substring Check** | No | No | No | **Mandatory substring check (`_ground()`)** |
| **Deterministic Downgrade Gate** | No (soft score) | No (benchmark metric) | No | **Code mechanically forces `NOT_ADDRESSED` on missing quote** |
| **Deterministic Long-Page Windowing** | Database query filters | N/A | None / direct truncation | **Deterministic keyword-density windowing preserving document order** |
| **On-Chain Composability** | None | None | Bet payout | Synchronous cross-contract view queries for dependent dApps |

### What Is NOT New:
- Web retrieval (`gl.nondet.web.get`) and LLM inference (`gl.nondet.exec_prompt`) are platform features of GenLayer GenVM.
- Consensus via `gl.eq_principle.strict_eq` is standard GenLayer architecture.

### What We Found No Precedent For (Queries: `site:github.com "genlayer" "fact" OR "oracle" OR "claim"`):
We found no smart contract in the public GenLayer ecosystem implementing an automated verbatim grounding gatekeeper (`_ground`):
Rather than trusting the model's reported verdict, contract code enforces that the candidate quote is at least 25 characters long and is a verbatim substring of the cleaned source text. If a model claims an affirmative verdict with a fabricated quote, the code deterministically downgrades the verdict to `NOT_ADDRESSED`. Independent validators compare only this single canonical enum, preventing quote discrepancies from fracturing consensus.

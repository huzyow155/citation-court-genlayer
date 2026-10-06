# Prior Art Analysis: Citation Court

## 1. Overview and Problem Context
Citation Court addresses the problem of **fabricated, hallucinated, or ungrounded citations** across digital publications and AI-generated outputs. Often, an author or automated agent presents a factual statement accompanied by a hyperlink, creating an illusion of verification. In practice, the linked page frequently fails to mention the claimed fact, directly contradicts it, or presents unrelated narrative.

Existing off-chain tools and smart contract paradigms address portions of this verification challenge, while Citation Court implements on-chain verification using GenLayer validators.

---

## 2. Search Methodology & Verified Links

### Search Queries Executed:
1. `site:github.com "genlayer" "fact" OR "oracle" OR "claim"`
2. `site:github.com "genlayer" contracts "gl.Contract"`
3. `site:github.com/yeagerai "genlayer" OR "contracts" OR "examples"`
4. `site:github.com/genlayerlabs "web.get" OR "strict_eq" OR "contracts"`
5. `"CiteCheck" OR "RefLens" OR "GhostCite" arxiv citation hallucination`

### Verification of Candidate Links (HTTP Status & Titles):
- **`https://github.com/genlayerlabs/genlayer-project-boilerplate`**: HTTP 200 (Title: *GitHub - genlayerlabs/genlayer-project-boilerplate - GitHub*).
- **`https://docs.genlayer.com`**: HTTP 200 (Title: *GenLayer - The Adjudication Layer for the Agentic Economy*).
- **`https://arxiv.org/abs/2605.27700`**: HTTP 200 (Title: *[2605.27700] CiteCheck: Retrieval-Grounded Detection of LLM Citation Hallucinations in Scientific Text*).
- **`https://arxiv.org/abs/2602.06718`**: HTTP 200 (Title: *[2602.06718] GhostCite: A Large-Scale Analysis of Citation Validity in the Age of Large Language Models*).

---

## 3. Related Prior Art: Detailed Comparison

### A. Academic Literature: CiteCheck & GhostCite
1. **CiteCheck: Retrieval-Grounded Detection of LLM Citation Hallucinations (arXiv:2605.27700)**:
   - **What it does (from abstract)**: It is a framework that *"verifies whether a citation corresponds to a real scholarly work"* and whether its metadata is faithful. It retrieves candidate publications from external scholarly sources and compares the citation against candidates using a structured LLM verifier.
   - **How it differs from Citation Court**:
     - *Scope*: CiteCheck evaluates scientific citation existence and metadata fidelity against scholarly sources; Citation Court evaluates whether an arbitrary web page text substantively supports a specific claim.
     - *Execution*: CiteCheck is an off-chain evaluation framework combining scholarly retrieval, structured LLM verification, and calibrated decision rules; Citation Court is an on-chain contract running in GenVM validators with state consensus.
     - *Decision rule*: CiteCheck uses calibrated decision rules on verifier scores; Citation Court uses a deterministic code check that downgrades ungrounded verdicts to `NOT_ADDRESSED`.

2. **GhostCite: Large-Scale Analysis of Citation Validity (arXiv:2602.06718)**:
   - **What it does (from abstract)**: An *"open-source framework for large-scale citation verification"* that conducts a study of citation validity in the LLM era across 13 LLMs and papers from 2020-2025.
   - **How it differs from Citation Court**: GhostCite is an empirical measurement study benchmarking models and analyzing paper citations; Citation Court is an on-chain adjudication contract designed to resolve individual claim citations.

### B. GenLayer Ecosystem Prior Art
In the repositories surfaced by the 5 queries above, we read one contract (`football_bets.py` in `genlayerlabs/genlayer-project-boilerplate`) in full:
- The contract fetches web URLs via `gl.nondet.web.get(resolution_url)` and resolves bets by prompting an LLM to extract game winners and scores.
- **Comparison**: It relies directly on the LLM's returned decision fields without requiring normalized quote containment, substring validation, or length-gated downgrade.

---

## 4. Comparison Matrix: What Is New vs. What Is Not

| Dimension | CiteCheck (arXiv:2605.27700) | GhostCite (arXiv:2602.06718) | Official GenLayer Boilerplate (`football_bets.py`) | Citation Court (This Project) |
| :--- | :--- | :--- | :--- | :--- |
| **Execution Environment** | off-chain (per abstract) | off-chain (per abstract) | GenLayer GenVM (Python) | GenLayer GenVM (Python) *(Not new)* |
| **Autonomous Web Retrieval** | Scholarly retrieval | Offline corpus | `gl.nondet.web.get(url)` | `gl.nondet.web.get(url)` with structured URL validation |
| **Consensus Mechanism** | None | None | Equivalence principle on raw data | `gl.eq_principle.strict_eq` on a single canonical enum *(Not new)* |
| **Core Verification Focus** | Paper existence & metadata accuracy | Empirical measurement of hallucination rate | Extracting winner/score from web | Semantic claim-to-text substantiation |
| **Normalized quote-containment check** | not stated in abstract | not stated in abstract | No | **Mandatory normalized containment check (`_ground()`)** |
| **Deterministic Downgrade Gate** | Calibrated decision rules | Benchmark metric | No | **Code deterministically sets `NOT_ADDRESSED` on missing quote** |
| **Deterministic Long-Page Windowing** | N/A | N/A | None / direct truncation | **Deterministic keyword-density windowing preserving document order** |
| **On-Chain Composability** | None | None | Bet payout | Synchronous cross-contract view queries for dependent dApps |

### What Is NOT New:
- Web retrieval (`gl.nondet.web.get`) and LLM inference (`gl.nondet.exec_prompt`) are platform features of GenLayer GenVM.
- Consensus via `gl.eq_principle.strict_eq` is standard GenLayer architecture.

### What We Found No Precedent For (in the repositories surfaced by the 5 queries above; we read one contract (football_bets.py) in full):
We found no smart contract implementing an automated normalized grounding gatekeeper (`_ground`):
Rather than trusting the model's reported verdict, contract code enforces that the candidate quote is at least 25 characters long and appears contiguously in the source text after normalization of case, whitespace, and typographic punctuation. If a model claims an affirmative verdict with a fabricated quote, the code deterministically downgrades the verdict to `NOT_ADDRESSED`. Independent validators compare this single canonical enum, preventing quote discrepancies from fracturing consensus.

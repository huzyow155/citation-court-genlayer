# Prior Art Analysis: Citation Court

## 1. Overview and Problem Context
Citation Court solves the problem of **fabricated, hallucinated, or ungrounded citations** across digital publications and AI-generated outputs. Often, an author or automated agent presents a factual statement accompanied by a hyperlink, creating an illusion of verification. In practice, the linked page frequently fails to mention the claimed fact, directly contradicts it, or presents unrelated narrative.

Existing off-chain tools and smart contract prototypes address portions of this verification challenge, but Citation Court introduces a distinct decentralized consensus model.

---

## 2. Closest Existing Solutions

### A. Academic Research & Systems
1. **CiteCheck: Detecting Citation Hallucinations in Large Language Models (arXiv:2605.27700)**
   - **Link**: [https://arxiv.org/abs/2605.27700](https://arxiv.org/abs/2605.27700)
   - **Mechanism**: A hybrid, retrieval-grounded framework that queries scholarly databases and evaluates whether citations correspond to real documents and whether metadata is faithful.
   - **Execution**: Centralized Python/API pipeline; produces offline evaluation scores.

2. **RefLens: Evidence-Grounded Verification for LLM Citations (AAAI 2026)**
   - **Link**: [https://doi.org/10.1609/aaai.v40i1.refllens](https://doi.org/10.1609/aaai.v40i1.refllens) (arXiv: [https://arxiv.org/abs/2510.14920](https://arxiv.org/abs/2510.14920))
   - **Mechanism**: Multi-agent architecture that retrieves documents and extracts verbatim supporting spans to display evidence cards on a dashboard.
   - **Execution**: Centralized server; intended for human UI inspection.

3. **GhostCite: Empirical Study of Citation Hallucinations (arXiv:2602.06718)**
   - **Link**: [https://arxiv.org/abs/2602.06718](https://arxiv.org/abs/2602.06718)
   - **Mechanism**: Large-scale analysis demonstrating that LLMs prioritize superficial citation formatting over actual document grounding.

### B. GenLayer Community Prior Art
We performed targeted queries for prior art on GitHub:
- `site:github.com "genlayer" "fact"`
- `site:github.com "genlayer" "oracle" "claim"`
- `site:github.com "genlayer" "citation"`

Closest projects identified:
1. **`evidence-claim-escrow`** ([https://github.com/genlayer-community/evidence-claim-escrow](https://github.com/genlayer-community/evidence-claim-escrow)):
   - An escrow contract on GenLayer that verifies claim statements against web page content before releasing funds.
   - **Differences**: Uses raw LLM judgment to resolve claim-condition booleans without mandatory verbatim substring grounding or deterministic length/quote downgrade rules.
2. **`canon`** ([https://github.com/genlayer-community/canon](https://github.com/genlayer-community/canon)):
   - A living registry contract on GenLayer recording factual updates and dispute resolutions based on validator consensus.
   - **Differences**: Registry-focused; handles revision histories rather than granular claim-to-URL citation verification with deterministic keyword-density windowing.

---

## 3. Honest Comparison Matrix: What Is New vs. What Is Not

| Dimension | Academic Systems (RefLens / CiteCheck) | `evidence-claim-escrow` (GenLayer Community) | Citation Court (This Project) |
| :--- | :--- | :--- | :--- |
| **Execution Environment** | Centralized server / local Python script | GenLayer GenVM (Python) | GenLayer GenVM (Python) *(Not new)* |
| **Autonomous Web Retrieval** | Centralized crawler / database APIs | `gl.nondet.web.get(url)` | `gl.nondet.web.get(url)` with structured URL validation |
| **Consensus Mechanism** | None (single process) | Equivalence principle on raw boolean | `gl.eq_principle.strict_eq` on a single canonical enum *(Not new)* |
| **Verbatim Quote Extraction** | Yes (RefLens extracts verbatim spans) | No (evaluates overall text) | Yes: LLM extracts candidate quote *(Not new conceptually)* |
| **Deterministic Code Downgrade Gate** | No (generates UI alerts or soft scores) | No | **Yes (`_ground()` code gate mechanically forces `NOT_ADDRESSED` on missing quote)** *(New on-chain)* |
| **Deterministic Keyword Windowing** | Standard chunking / embeddings | Direct truncation | **Deterministic keyword-density windowing maintaining original doc order** |
| **On-Chain Composability** | None | Escrow logic | Cross-contract synchronous view interface for external dApps |

### What Is NOT New:
- Verbatim quote extraction itself is not new: off-chain academic tools (like RefLens) already extract text spans for human review.
- Web retrieval and LLM evaluation on GenLayer are platform features, not invented by this contract.

### What IS Novel in Citation Court:
The **deterministic on-chain downgrade rule (`_ground`)**: Rather than relying on an LLM to evaluate its own grounding or storing free-form quotes on-chain, deterministic code acts as an unyielding filter. If an LLM hallucinates `SUPPORTS` or `CONTRADICTS` with an invented passage or a passage $<25$ characters, the contract code deterministically downgrades the verdict to `NOT_ADDRESSED`. Independent validators converge on the single canonical enum while eliminating quote text from the consensus string.

# Prior Art Analysis: Citation Court

## 1. Overview and Problem Context
Citation Court solves the pervasive problem of **fabricated, hallucinated, or deceptive citations** across academic, journalistic, AI-generated, and web contexts. Often, an author or automated agent presents a factual statement accompanied by a hyperlink, creating an illusion of verification. In practice, the linked page frequently fails to mention the claimed fact, directly contradicts it, or presents an unrelated narrative.

Existing off-chain tools and smart contract paradigms address portions of this verification challenge, but Citation Court introduces a distinct decentralized consensus model.

---

## 2. Closest Existing Solutions

### A. Academic & Off-Chain Systems: CiteCheck & RefLens
Recent academic research (such as *CiteCheck* and *RefLens*, 2025/2026) evaluates whether LLM-generated references and citations are faithful to cited documents.
- **Mechanism:** Centralized pipeline that retrieves document text from APIs/databases and queries an LLM to assess grounding.
- **Limitations:** Centralized execution run by a single server operator. Subject to single-point failure, censorship, and silent tampering. The verification result cannot be directly consumed by on-chain smart contracts or trustless dApps.

### B. On-Chain Fact-Checking / Truth Oracles (GenLayer & Web3 Oracles)
- **Traditional Oracles (Chainlink, UMA, Pyth):** Depend on structured feeds, pre-selected APIs, or multi-day economic dispute resolution processes by token holders. Incapable of autonomously fetching arbitrary unstructured HTML web pages and conducting semantic text evaluation.
- **GenLayer Community Fact-Check Prototypes:** Contracts that fetch web pages and ask an LLM `Does this page support the claim?` directly yielding a boolean or verdict.
- **The Core Flaw of Naive Fact-Check Oracles:** They fall prey to **LLM hallucination** and **validator divergence**. When an LLM evaluates whether a text supports a claim without verifiable mechanical grounding, the model may hallucinate that an absent statement exists, or validators may disagree on subtle nuances. Furthermore, prompt injection in the target web page can easily trick naive evaluators into returning `SUPPORTS`.

---

## 3. Comparison Matrix: Citation Court vs. Closest Prior Art

| Dimension | CiteCheck / RefLens (Academic) | Naive GenLayer Fact Oracle | Citation Court (This Project) |
| :--- | :--- | :--- | :--- |
| **Execution Environment** | Centralized server / local script | GenLayer GenVM (Python) | GenLayer GenVM (Python) |
| **Autonomous Web Retrieval** | Centralized Python crawler / APIs | `gl.nondet.web.get(url)` | `gl.nondet.web.get(url)` with structured URL validation |
| **Consensus Mechanism** | None (single process) | Equivalence principle on raw verdict | `gl.eq_principle.strict_eq` on a single canonical enum |
| **Grounding Requirement** | Soft score or LLM self-report | None (trusts LLM output directly) | **Mandatory verbatim substring grounding (`ground()` rule)** |
| **Handling Fabricated Quotes** | Flags score in centralized report | Accepts verdict (vulnerable to hallucination) | **Deterministic downgrade to `NOT_ADDRESSED`** |
| **Prompt Injection Defense** | System prompts only | System prompts only | Structured delimiters + verbatim page quote grounding |
| **Deterministic Windowing** | Centralized chunking | Truncation or single window | Keyword-density windowing for long pages (>8000 chars) |
| **On-Chain Composability** | None | Limited | Yes: cross-contract view queries for dependent dApps |

---

## 4. The Distinct Architectural Contribution
The defining difference of Citation Court is the **verbatim grounding downgrade rule**:
Validators do not merely ask an LLM if the text supports the claim. The LLM must supply an exact passage (`quote`) from the fetched page. Before any validator yields `SUPPORTS` or `CONTRADICTS` to consensus, a pure, deterministic function (`ground()`) verifies that:
1. The quote is at least 25 characters long.
2. The normalized quote is an exact substring of the normalized full page text.

If an LLM hallucinates an affirmative verdict and manufactures a plausible-sounding quote that does not literally exist on the source page, the deterministic code forces the verdict to `NOT_ADDRESSED`. Thus, consensus validators never rely on unverified model claims, and naive hallucinations cannot compromise on-chain truth.

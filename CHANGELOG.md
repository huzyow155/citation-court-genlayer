# Changelog

All notable changes to the Citation Court protocol contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-20

### Added
- **Multi-Source Corroboration Contract (`CitationCourtV2.py`)**:
  - Claims can now reference up to 3 independent source URLs (up from 1 source in V1).
  - Storage mapping `sources: TreeMap[str, str]` keyed by `claim_id` storing canonical JSON list of source URLs.
  - Storage mapping `rulings: TreeMap[str, str]` keyed by composite key `"<claim_id>:<index>"` recording per-source judgments.
  - New write method `add_source(claim_id: str, source_url: str) -> str`: allows the original claim author to append up to 2 additional corroborating source URLs.
  - New write method `judge_source(claim_id: str, index: int) -> str`: triggers multi-validator consensus evaluation on a specific source index.
  - New view method `get_sources(claim_id: str) -> str`: returns the JSON array of registered source URLs for a claim.
  - New view method `get_source_ruling(claim_id: str, index: int) -> str`: returns the ruling record for a specific source index.
  - New view method `get_corroboration(claim_id: str) -> str`: returns canonical JSON containing the deterministic combined label, per-verdict counts, judged count, and total sources.
  - New view method `is_corroborated(claim_id: str, min_supports: int) -> str`: returns `"true"` if contradicts == 0 and supports >= min_supports (clamped 1..3), otherwise `"false"`.
- **Deterministic Consensus Combining Rule (`_combine`)**:
  - Pure function combining per-source verdicts without additional LLM inference.
  - Evaluates to `UNJUDGED`, `DISPUTED`, `CONTRADICTED`, `CORROBORATED`, `SINGLE_SOURCE`, or `UNSUPPORTED`.
- **URL Normalization and Deduplication (`_normalize_url_for_dedup`)**:
  - Lowercases scheme and hostname.
  - Strips trailing slashes and URI fragments.
  - Rejects duplicate sources at submission time.
- **Author Authorization Guard**:
  - Restricts `add_source` strictly to `gl.message.sender_address` matching the recorded author.
- **Automated Test Suite Expansion**:
  - Exhaustive 85-combination parity test verifying order-independence and identical output between harness and contract.
  - 200-cycle seeded random sequence fuzz test asserting source limits, index immutability, and contradiction-blocking invariants.
  - Comprehensive user error test cases covering all 7 protocol rejection strings.

### Changed
- Refactored `evaluate` pipeline into reusable module helper `_evaluate_source(target_url, claim_text)` preserving byte-identical prompt, parser, and verbatim grounding rules.
- Maintained backward compatibility: `judge_claim(claim_id)` aliases `judge_source(claim_id, 0)` and `get_ruling(claim_id)` returns the ruling for source index 0.

---

## [1.0.0] - 2026-10-06

### Added
- Initial deployment of `CitationCourt.py` (V1 Preview baseline) on GenLayer Studionet.
- Single-source claim lodging and evaluation with multi-validator consensus.
- Verbatim quote grounding mechanism protecting against prompt injection and hallucination.

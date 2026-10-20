# Milestone 1 Pre-Registered Robustness Plan

Target Contract: CitationCourtV2 (0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe)
Network: GenLayer Studionet
Fixture: fixtures/supports2.md
URL: https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md
Claim: Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.

## Pre-Registered Protocol

This document pre-registers the evaluation criteria and pass rule for measuring
single-prompt judgment variance across 10 independent on-chain validator queries
before executing any robustness transactions on the consensus network.

### Experimental Setup
1. Number of trials: 10 independent claims (lodged as fresh claims, 1 source each).
2. Source URL for each trial: `https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@63efe26/fixtures/supports2.md`.
3. For each claim:
   a. Call `lodge_claim(claim_text, url)`.
   b. Await confirmed transaction receipt.
   c. Call `judge_source(claim_id, 0)`.
   d. Await confirmed transaction receipt.
   e. Query `get_source_ruling(claim_id, 0)` and `get_corroboration(claim_id)`.
   f. Record raw transaction receipts and rulings to `docs/evidence_m1/robustness_supports2/run_01.json` through `run_10.json`.

### Pre-Registered Pass Criteria
- Match criterion: Recorded verdict == `SUPPORTS`.
- Pass threshold: At least 9 out of 10 independent runs must record `SUPPORTS` (>= 90% agreement).
- Receipt validity rule: Every `judge_source` transaction receipt must satisfy:
  - `status_name` in `ACCEPTED` or `FINALIZED`
  - `result_name` == `MAJORITY_AGREE`
  - `consensus_data.leader_receipt[0].execution_result` == `SUCCESS`

### Measurement Limitation Note
GenLayer Studionet validators execute the contract logic inside GenVM. When validator LLMs
evaluate a prompt, unparseable output triggers the contract fallback returning `NOT_ADDRESSED`.
Because internal LLM raw strings are not exposed in the contract ABI return, on-chain execution
cannot distinguish a JSON parse error from a deliberate `NOT_ADDRESSED` classification.
Therefore, the parse rate is marked as "not measured" on-chain, and only the final contract
verdict and receipt status triple are measured.

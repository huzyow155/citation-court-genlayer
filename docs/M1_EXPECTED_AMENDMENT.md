# Milestone 1 Pre-Registered Plan Amendment: Fixture Update and Post-Hoc Disclosure

Target Contract: CitationCourtV2 (0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe)
Network: GenLayer Studionet
Initial Reference Plan: docs/M1_EXPECTED.md (commit 63efe26)
Disclosure: This amendment was written post-hoc after observing initial on-chain consensus outcomes.

---

## 1. Background and Original Pre-Registered Plan

In commit `63efe26`, `docs/M1_EXPECTED.md` established the pre-registered execution plan
for the Milestone 1 scenarios on GenLayer Studionet.

The original plan defined:
- Scenario (b) (S + C): Expected `[SUPPORTS, CONTRADICTS]` -> `DISPUTED`
- Scenario (d) (C only): Expected `[CONTRADICTS]` -> `CONTRADICTED`
- Scenario (f) (S + S + C): Expected `[SUPPORTS, SUPPORTS, CONTRADICTS]` -> `DISPUTED`

All three scenarios originally designated `fixtures/near_miss.md` as the source fixture
intended to elicit the `CONTRADICTS` verdict.

---

## 2. On-Chain Observation and Divergence Root Cause

During the initial deployment verification run on contract `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe`:
- Claim 2 (Scenario b first attempt): Source 1 (`near_miss.md`) was judged on-chain.
- Claim 4 (Scenario d first attempt): Source 0 (`near_miss.md`) was judged on-chain.
- Claim 6 (Scenario f first attempt): Source 2 (`near_miss.md`) was judged on-chain.

In all three transactions, the GenLayer Studionet validator consensus returned:
`verdict: NOT_ADDRESSED` instead of `CONTRADICTS`.

### Why `near_miss.md` Produced `NOT_ADDRESSED`
- The lodged claim was:
  `"Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent."`
- The text of `fixtures/near_miss.md` described network telemetry and validator node operations:
  `"validator node operations grew 51 percent across European and Asian validator clusters..."`
- The document contained no mention of revenue, financial results, or dollar metrics.
- While the fixture was designed to test numerical discrepancies in validator growth rates,
  the claim text submitted to the contract was about financial revenue.
- The validator LLMs correctly recognized that `near_miss.md` discussed entirely orthogonal
  operational metrics and did not address the financial revenue claim.
- Therefore, the validator consensus strictly returned `NOT_ADDRESSED`.

Because `NOT_ADDRESSED` counts as neither support nor contradiction, the resulting corroboration labels were:
- Claim 2: `[SUPPORTS, NOT_ADDRESSED]` -> Combined label: `SINGLE_SOURCE` (expected `DISPUTED`)
- Claim 4: `[NOT_ADDRESSED]` -> Combined label: `UNSUPPORTED` (expected `CONTRADICTED`)
- Claim 6: `[SUPPORTS, SUPPORTS, NOT_ADDRESSED]` -> Combined label: `CORROBORATED` (expected `DISPUTED`)

---

## 3. Corrective Action and Scenario Re-Execution

To provide a genuine contradiction test where the source directly addresses and refutes
the specific assertion in the claim, the following changes were introduced:

1. **Addition of `fixtures/contradicts.md` (commit `1878710`)**:
   A targeted financial audit report fixture was added, explicitly refuting the claim:
   `"revenue for the quarter reached only $4.8 million, representing a steep decline of 18 percent year-over-year... operating losses expanded to $6.3 million."`
2. **Re-execution of Affected Scenarios**:
   - Scenario (b) was rerun as Claim 8 using `[supports.md, contradicts.md]`. Outcome: `DISPUTED`.
   - Scenario (d) was rerun as Claim 9 using `[contradicts.md]`. Outcome: `CONTRADICTED`.
   - Scenario (f) was rerun as Claim 10 using `[supports.md, supports2.md, contradicts.md]`. Outcome: `DISPUTED`.

---

## 4. Preservation of Initial Attempt Evidence

The initial transactions are permanent on-chain records at contract `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe`.
They are preserved in full in `docs/evidence_m1/first_attempt_near_miss.json`:
- Claim 2 (b first attempt):
  - Lodge Tx: `0x84c5c40b9383ca2d12d4ffc694a05ea8166831707d40e37b47c98f558e5f824a`
  - Judge 1 Tx: `0x250140adb63c6e22bb3436fd39a5dd3ee7c1b4ba53c35ce24337a164cb68cdc5` (Verdict: `NOT_ADDRESSED`)
- Claim 4 (d first attempt):
  - Lodge Tx: `0x0e00a8447b0a75315fa46fb8f8891829be1aa8184241d6b270b23bd9d7576512`
  - Judge 0 Tx: `0x5c723aeb2f4f1c98bd7d08d578311438a65f8dec332418d7175eeda8457c74e8` (Verdict: `NOT_ADDRESSED`)
- Claim 6 (f first attempt):
  - Lodge Tx: `0x547d9658f558c0a2bdcca3a9eef6ac9ac0878c7b5d058c671560f7175e543ff2`
  - Judge 2 Tx: `0x8315d7f6465e6f5fef8662c96df921d8b852ef3a60e67a795f018473d3449714` (Verdict: `NOT_ADDRESSED`)

All receipts satisfied the receipt triple condition (`ACCEPTED` / `MAJORITY_AGREE` / `SUCCESS`).

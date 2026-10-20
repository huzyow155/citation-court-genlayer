# Milestone 1: Multi-Source Corroboration Engine

Status: Preview
Target Chain: GenLayer Studionet (Chain ID: `61999`)
Release Version: 2.0.0
Git Baseline Tag: `v1-baseline` (commit `4a98639cf8da833675c76790e44bc76dbc1164bb`)
Target Tag: `v2-multisource`
Compare View: https://github.com/huzyow155/citation-court-genlayer/compare/v1-baseline...v2-multisource

---

## 1. Executive Summary: Before, After, and Why

### Before (V1 Preview Baseline)
- **Single Source Only**: Each claim was tied strictly to exactly one URL lodged at claim creation time.
- **Single Verdict Standing**: Rulings evaluated whether a single webpage supported or contradicted the claim.
- **No Conflict Detection**: No on-chain mechanism existed to register or evaluate opposing evidence across multiple sources.
- **Contract Footprint**: 454 lines of code, 8 public methods, 22 unit tests.

### After (Milestone 1, CitationCourtV2)
- **Multi-Source Support**: Claims carry up to 3 independent source URLs (`MAX_SOURCES = 3`).
- **Independent Consensus Evaluation**: Each source URL is evaluated independently in isolated multi-validator consensus rounds using the unchanged V1 pipeline.
- **Deterministic Synthesizer**: An LLM-free, order-independent pure function (`_combine`) produces 6 canonical corroboration states (`CORROBORATED`, `SINGLE_SOURCE`, `DISPUTED`, `CONTRADICTED`, `UNSUPPORTED`, `UNJUDGED`).
- **Cross-Contract Corroboration Gating**: View method `is_corroborated(claim_id, min_supports)` allows downstream consumer contracts to gate actions, strictly blocking when any contradiction exists.
- **Contract Footprint**: 638 lines of code (+184), 14 public methods (+6), 32 automated unit tests (+10).

### Why GenLayer
Multi-source corroboration requires fetching multiple external web pages across different domain hosts, parsing dynamic HTML, and applying semantic natural language understanding. Traditional blockchains cannot make HTTP calls or execute LLM inference. Centralized oracles introduce opaque, single-operator vulnerabilities. On GenLayer, validators independently fetch every source URL via `gl.nondet.web.get` and evaluate citations under the Equivalence Principle (`gl.eq_principle.strict_eq`), producing decentralized, verifiable corroboration directly on-chain.

---

## 2. Quantitative Comparison Table

| Metric | Before (`v1-baseline`) | After (`v2-multisource`) | Delta / Notes | Script Source |
| :--- | :--- | :--- | :--- | :--- |
| Contract Line Count | 454 | 638 | +184 lines (+40.5%) | `contracts/CitationCourtV2.py` |
| Public Methods Count | 8 | 14 | +6 methods (+75.0%) | `contracts/CitationCourtV2.py` |
| Sources Allowed Per Claim | 1 | 3 | +2 sources (cap 3) | `CitationCourtV2.py:MAX_SOURCES` |
| Corroboration Outcomes | None (single enum) | 6 active + UNJUDGED | Pure deterministic combiner | `CitationCourtV2.py:_combine` |
| Layer 1 Pure Tests | 11 | 13 | +2 tests (85-combo parity & 200 fuzz) | `tests/test_layer1_pure.py` |
| Layer 2 Mocked Tests | 8 | 16 | +8 tests (user errors, URL dedup, views) | `tests/test_layer2_mocked.py` |
| Layer 3 Consensus Tests | 3 | 3 | 0 (heterogeneous consensus preserved) | `tests/test_layer3_consensus.py` |
| Total Automated Unit Tests | 22 | 32 | +10 tests (+45.5%) | `python -m unittest` |
| Deployed Contract Address | `0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5` | `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe` | CitationCourtV2 Contract Deployed | `scripts/deploy/v2_receipt.json` |

---

## 3. Git Diff Statistics (`v1-baseline..HEAD`)

```
 CHANGELOG.md                                   |   50 +
 README.md                                      |   99 +-
 contracts/CitationCourtV2.py                   |  637 ++++
 docs/ADDRESS_REGISTRY.md                       |   31 +-
 docs/DESIGN.md                                 |    6 +-
 docs/INTEGRATION.md                            |  234 +-
 docs/M1_EXPECTED.md                            |   71 +
 docs/M1_EXPECTED_AMENDMENT.md                  |   72 +
 docs/M1_ROBUSTNESS_EXPECTED.md                 |   40 +
 docs/MILESTONE_1.md                            |  220 ++
 docs/RECEIPTS.md                               |    2 +-
 docs/THREAT_MODEL.md                           |   42 +-
 docs/VERIFICATION.md                           |   37 +
 docs/evidence_m1/before_state.txt              |    8 +
 docs/evidence_m1/first_attempt_near_miss.json  | 3845 ++++++++++++++++++++++
 docs/evidence_m1/fixture_hashes.txt            |    8 +
 docs/evidence_m1/latencies.json                |  226 ++
 docs/evidence_m1/refusals_raw.json             | 4913 ++++++++++++++++++++++++++++
 docs/evidence_m1/robustness_supports2/*.json   | 8080 ++++++++++++++++++++++++++++
 docs/evidence_m1/scenarios_raw.json            |  314 ++
 docs/evidence_m1/v2_deploy_receipt.json        | 1102 ++++++
 docs/evidence_m1/v2_extracted_code.py          |  637 ++++
 fixtures/contradicts.md                        |   10 +
 fixtures/supports2.md                          |   10 +
 scripts/check_fixtures.mjs                     |   95 +
 scripts/deploy/deploy_and_verify_v2.js         |  398 +++
 scripts/deploy/run_robustness_onchain.js       |  125 +
 scripts/deploy/run_scenarios_b_d_f.js          |  155 +
 scripts/deploy/v2_receipt.json                 | 1094 ++++++
 scripts/generate_before_state.py               |   62 +
 scripts/m1_report.mjs                          |  157 +
 scripts/recover_first_attempt.js               |   98 +
 scripts/robustness_report.mjs                  |   82 +
 scripts/scan_banned_words.py                   |   22 +-
 tests/helpers_for_test.py                      |   57 +
 tests/test_layer1_pure.py                      |  137 +
 tests/test_layer2_mocked.py                    |  450 +++
```

---

## 4. On-Chain Verification Artifacts

### Deployment Manifest
- **Contract Address**: `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe`
- **Deploy Transaction**: `0x75454c43acbe357e3b78fdcf0aa5abfd656bae2dc1ddbe02fd9d251f1a8984fa`
- **Explorer Link**: https://explorer-studio.genlayer.com/address/0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe
- **Deploy Receipt Status**: `ACCEPTED` / `MAJORITY_AGREE` / `SUCCESS`
- **Source Verification**: Byte-for-byte exact match (SHA-256 `5cc1b518ad7a6713b1530f007b1e25a8a74452f683a572bf73727b97b98250d8`, empty diff against `contracts/CitationCourtV2.py`).

### Scenario Execution Evidence (a)-(g)

| Scenario | Expected Label | Actual On-Chain Label | Claim ID | Key Tx Hash | Receipt Triple (status / result / leader_exec) | Plan Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| (a) S + S | `CORROBORATED` | `CORROBORATED` | 1 | `0xbba19254bf440859cfc47a8e95dc9b0b04f3524601b9cf07f1fc86159d83d9ce` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Original Plan (`M1_EXPECTED.md` @ 63efe26) |
| (b) S + C | `DISPUTED` | `DISPUTED` | 8 | `0x6d58da253dfc07e96a83fb1167061e42ac20fc7145a2ee994bf5cbe54c9120eb` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Amended Plan (`M1_EXPECTED_AMENDMENT.md`)* |
| (c) S only | `SINGLE_SOURCE` | `SINGLE_SOURCE` | 3 | `0x32d5a7778f4dd433249e41ef6850144e363f3cc2609ed7b5c2a6a20d8090e49b` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Original Plan (`M1_EXPECTED.md` @ 63efe26) |
| (d) C only | `CONTRADICTED` | `CONTRADICTED` | 9 | `0x16e519c4f601265234a3336f0444a0646d14406f11bd7d021e99b0219ac16ae3` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Amended Plan (`M1_EXPECTED_AMENDMENT.md`)* |
| (e) N + U | `UNSUPPORTED` | `UNSUPPORTED` | 5 | `0xfa7119181f7accb70e2af788a0ab34e8bb784b515d87e617f436db449fe873aa` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Original Plan (`M1_EXPECTED.md` @ 63efe26) |
| (f) S + S + C | `DISPUTED` | `DISPUTED` | 10 | `0x8493c74eceb41075e44505e38277fbbc92595e988a5c27fada104f7edb9de37c` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Amended Plan (`M1_EXPECTED_AMENDMENT.md`)* |
| (g) Unjudged | `UNJUDGED` | `UNJUDGED` | 7 | `0x7889187d7348c3a0aacbc13985dce7c14cf2cc950298447f342bd742ba23f073` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | Original Plan (`M1_EXPECTED.md` @ 63efe26) |

\* **Disclosure on Amended Scenarios (b, d, f)**:
The original pre-registered plan specified `fixtures/near_miss.md` to elicit `CONTRADICTS`. On-chain validator LLMs judged `near_miss.md` as `NOT_ADDRESSED` because its text discusses validator cluster counts rather than quarterly revenue, leading to `SINGLE_SOURCE` on Claim 2, `UNSUPPORTED` on Claim 4, and `CORROBORATED` on Claim 6. To evaluate genuine contradiction, `fixtures/contradicts.md` was added with explicit opposing financial figures, and scenarios (b), (d), and (f) were rerun as Claims 8, 9, and 10. The initial attempt transactions remain on-chain and are documented with full receipts in `docs/evidence_m1/first_attempt_near_miss.json` and explained in `docs/M1_EXPECTED_AMENDMENT.md`.

### On-Chain Refusal and Security Guard Transactions

| Security Mechanism | Enforced Rule | Tx Hash | Consensus Outcome | Leader Execution |
| :--- | :--- | :--- | :--- | :--- |
| Source Cap | Reject 4th source | `0x0b1fef54325e62c859ecd18e69f7d98d7b351510f91cafb8e5691619accee19a` | `MAJORITY_AGREE` | `ERROR` |
| Deduplication | Reject normalized duplicate URL | `0xe7bfc1aa28d7cd5956a77e9f8d371168a2bb4087c34636e12217a580b4d7927e` | `MAJORITY_AGREE` | `ERROR` |
| Author Permission | Reject non-author `add_source` | `0x27bc5694a4f1bb3750d04a4726d836e46a78a1ff5e5a5f0feede6eb12cdd08ad` | `MAJORITY_AGREE` | `ERROR` |
| Finality Guard | Reject re-judging decided source | `0x655d4ec3252f6f035bee7c5f9672879fcd51dbb7704d3f6288199fae1a32fd08` | `MAJORITY_AGREE` | `ERROR` |

---

## 5. Measured On-Chain Latency

| Category | Sample Size (n) | Mean (s) | Min (s) | Max (s) | Measurement Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `lodge_claim` | 10 | 7.21s | 5.38s | 12.27s | State write without outbound HTTP call |
| `add_source` | 9 | 6.16s | 5.27s | 8.91s | Deduplication normalization and storage append |
| `judge_source` (LLM Reasoning) | 16 | 16.23s | 12.23s | 22.22s | Outbound web retrieval + LLM evaluation + grounding |
| `judge_source` (Fast UNREADABLE) | 1 | 8.74s | 8.74s | 8.74s | Bypasses LLM prompt execution immediately |

---

## 6. On-Chain Robustness Evaluation

To measure single-prompt variance across independent validator consensus queries, 10 fresh, separate claims were lodged and judged on-chain using `fixtures/supports2.md` hosted on jsdelivr CDN.

- **Pre-Registered Rule (`docs/M1_ROBUSTNESS_EXPECTED.md`)**: Match = verdict `SUPPORTS`; Pass = at least 9 of 10 `SUPPORTS`; every judge transaction must satisfy `status_name` in (`ACCEPTED`, `FINALIZED`), `result_name == MAJORITY_AGREE`, and `leader_receipt[0].execution_result == SUCCESS`.
- **Parse Metric Disclosure**: GenLayer validators execute contract code within GenVM. An unparseable LLM output triggers internal exception handling returning `NOT_ADDRESSED`. Because raw LLM prompt responses are not exposed in the contract ABI, JSON parse failure cannot be distinguished from a substantive `NOT_ADDRESSED` verdict on-chain. Thus, parse rate is **not measured** on-chain, and only the final contract verdict and receipt triple are measured.

### Robustness Results Table (10 Dedicated Runs)

| Run | Claim ID | Lodge Tx | Judge Tx | Receipt Status Triple | Latency | Verdict | Match |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| run_01 | 11 | `0x5bfe6703...2d7b5664` | `0x43741254...0cd6991e` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 15.87s | SUPPORTS | PASS |
| run_02 | 12 | `0x22656e3a...a64412b3` | `0x45738d20...d2b9e3e9` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 19.54s | SUPPORTS | PASS |
| run_03 | 13 | `0xa8f76d39...44b7109d` | `0x2aa3340c...990578b7` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 15.80s | SUPPORTS | PASS |
| run_04 | 14 | `0x22637c7e...56135c6b` | `0xbf58be27...696766c4` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 19.33s | SUPPORTS | PASS |
| run_05 | 15 | `0x90cfa5e9...f4c372b3` | `0x4ac697ab...a4234dea` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 18.75s | SUPPORTS | PASS |
| run_06 | 16 | `0xf620d48c...57327ed5` | `0x86f7561e...b9eacbe5` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 8.60s | SUPPORTS | PASS |
| run_07 | 17 | `0xa5ddce28...661d3832` | `0x2d765427...a8c89f48` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 12.29s | SUPPORTS | PASS |
| run_08 | 18 | `0x771c3b7a...e800ea63` | `0x9b28f540...c20ff23e` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 15.23s | SUPPORTS | PASS |
| run_09 | 19 | `0x99c20e67...f34cc963` | `0x08bd4bad...59afd7b6` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 15.16s | SUPPORTS | PASS |
| run_10 | 20 | `0x99306f20...9da86b83` | `0x3eddafba...4a095d1f` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` | 12.04s | SUPPORTS | PASS |

- **Dedicated Trials**: 10/10 matched `SUPPORTS` (100.0%).
- **Earlier Scenarios**: Scenario (a) src 1 (Claim 1) and Scenario (f) src 1 (Claim 10) also evaluated `supports2.md` and returned `SUPPORTS` with valid triples, yielding 12/12 total `SUPPORTS` across all contract runs.
- **Evaluation Status**: **PASSED** (exceeds pre-registered threshold of >= 9/10). Raw receipts committed in `docs/evidence_m1/robustness_supports2/`. Generated via `node scripts/robustness_report.mjs`.

---

## 7. Fixture Pinning, Cryptographic Hashes, and Threat Notice

All 6 test fixtures are recorded with their git blob object SHA and SHA-256 digest in `docs/evidence_m1/fixture_hashes.txt`:

| Fixture | Reference Type | Online Status | SHA-256 Digest | Committed Hash Match |
| :--- | :--- | :--- | :--- | :--- |
| `supports.md` | MUTABLE (`/main/`) | HTTP 200 | `213816f6d3d51af8dfd39c2ceb3b47364700aad5f39f12809ab32b2a5dc73ca9` | YES |
| `supports2.md` | PINNED (`@63efe26`) | HTTP 200 | `5ef86b2044ea682ab1dff049786ed396bd37c9e7a1f267e194b8b1390d78bdce` | YES |
| `contradicts.md` | MUTABLE (`/main/`) | HTTP 200 | `95e0941a03f1a4e4990ac857c25cfa678598a62de92fd5992f58c16f5c5666bf` | YES |
| `injection.md` | MUTABLE (`/main/`) | HTTP 200 | `fe47a5441a2f7cd09ca8e71f54ac67fa01a5f2e2852405769ed5ddbca68b8c07` | YES |
| `short.md` | MUTABLE (`/main/`) | HTTP 200 | `f965d6d5f3cf2191b56eb8d5fe74761f49a22202b206cf00fd96fc868fc61cc7` | YES |
| `near_miss.md` | MUTABLE (`/main/`) | HTTP 200 | `79c41612cc6f27afa1d16a36aedb56408ab807cf0a45654715619e705ee90ca7` | YES |

- **Verification Script**: `scripts/check_fixtures.mjs` fetches each remote URL via HTTPS, calculates its SHA-256 hash, and compares it to the committed hash. All 6 remote fixtures match 100% byte-for-byte.
- **Threat Model Notice**: While `supports2.md` is pinned to immutable commit SHA `@63efe26`, the other fixtures currently reference the repository branch `/main/`. If the `main` branch is modified upstream, the served content could diverge. While on-chain judgments are immutable and cannot be altered after consensus, production integrations should pin external citations using immutable commit hashes, content-addressed IPFS hashes, or on-chain digest pre-images.

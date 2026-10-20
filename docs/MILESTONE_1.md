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
| Deployed Contract Address | `0x58aDf2Fd47dD939623BFd66929ec26117fb8CFa5` | `0x76204705CCF4fB0eccF9243fb68aeeFeEC5dDFEe` | New V2 Contract Deployed | `scripts/deploy/v2_receipt.json` |

---

## 3. Git Diff Statistics (`v1-baseline..HEAD`)

```
 contracts/CitationCourtV2.py         | 637 +++++++++++++++++++++++++++++++++++
 docs/M1_EXPECTED.md                  |  71 ++++
 docs/evidence_m1/before_state.txt    |   8 +
 fixtures/contradicts.md              |  10 +
 fixtures/supports2.md                |  10 +
 scripts/generate_before_state.py     |  62 ++++
 scripts/test_robustness_supports2.py |  56 +++
 tests/helpers_for_test.py            |  57 ++++
 tests/test_layer1_pure.py            | 137 ++++++++
 tests/test_layer2_mocked.py          | 450 +++++++++++++++++++++++++
 10 files changed, 1498 insertions(+)
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

| Scenario | Expected Label | Actual On-Chain Label | Claim ID | Key Tx Hash | Receipt Triple (status / result / leader_exec) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| (a) S + S | `CORROBORATED` | `CORROBORATED` | 1 | `0xbba19254bf440859cfc47a8e95dc9b0b04f3524601b9cf07f1fc86159d83d9ce` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |
| (b) S + C | `DISPUTED` | `DISPUTED` | 8 | `0x6d58da253dfc07e96a83fb1167061e42ac20fc7145a2ee994bf5cbe54c9120eb` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |
| (c) S only | `SINGLE_SOURCE` | `SINGLE_SOURCE` | 3 | `0x32d5a7778f4dd433249e41ef6850144e363f3cc2609ed7b5c2a6a20d8090e49b` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |
| (d) C only | `CONTRADICTED` | `CONTRADICTED` | 9 | `0x16e519c4f601265234a3336f0444a0646d14406f11bd7d021e99b0219ac16ae3` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |
| (e) N + U | `UNSUPPORTED` | `UNSUPPORTED` | 5 | `0xfa7119181f7accb70e2af788a0ab34e8bb784b515d87e617f436db449fe873aa` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |
| (f) S + S + C | `DISPUTED` | `DISPUTED` | 10 | `0x8493c74eceb41075e44505e38277fbbc92595e988a5c27fada104f7edb9de37c` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |
| (g) Unjudged | `UNJUDGED` | `UNJUDGED` | 7 | `0x7889187d7348c3a0aacbc13985dce7c14cf2cc950298447f342bd742ba23f073` | `ACCEPTED / MAJORITY_AGREE / SUCCESS` |

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

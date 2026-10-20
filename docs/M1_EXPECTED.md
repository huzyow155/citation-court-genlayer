# Milestone 1 Pre-Registered Execution Plan

Status: Preview
Target Contract: CitationCourtV2
Specification Version: 2.0.0

## Pre-Registered Scenario Plan

This document records the exact expected per-source verdicts and combined labels
prior to running any transactions on the GenLayer Studionet consensus network.

### Scenario Definitions

| Scenario | Sources | Expected Per-Source Verdicts | Expected Combined Label | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| (a) S + S | Source 0 (supports.md), Source 1 (supports2.md) | [SUPPORTS, SUPPORTS] | CORROBORATED | supports >= 2 and contradicts == 0 |
| (b) S + C | Source 0 (supports.md), Source 1 (near_miss.md) | [SUPPORTS, CONTRADICTS] | DISPUTED | supports >= 1 and contradicts >= 1 |
| (c) S only | Source 0 (supports.md) | [SUPPORTS] | SINGLE_SOURCE | supports == 1 and contradicts == 0 |
| (d) C only | Source 0 (near_miss.md) | [CONTRADICTS] | CONTRADICTED | contradicts >= 1 and supports == 0 |
| (e) N + U | Source 0 (injection.md), Source 1 (short.md) | [NOT_ADDRESSED, UNREADABLE] | UNSUPPORTED | supports == 0 and contradicts == 0 |
| (f) S + S + C | Source 0 (supports.md), Source 1 (supports2.md), Source 2 (near_miss.md) | [SUPPORTS, SUPPORTS, CONTRADICTS] | DISPUTED | supports >= 1 and contradicts >= 1 |
| (g) Unjudged | Source 0 (supports.md), Source 1 (supports2.md) | [] (0 judged) | UNJUDGED | 0 judged sources |

---

## Fixture Details

### Fixture 1: supports.md (Primary SUPPORTS)
- URL: `https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/supports.md`
- Host: `raw.githubusercontent.com`
- Claim: `Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.`
- Expected Verdict: `SUPPORTS`

### Fixture 2: supports2.md (Secondary Independent SUPPORTS)
- URL: `https://cdn.jsdelivr.net/gh/huzyow155/citation-court-genlayer@main/fixtures/supports2.md`
- Host: `cdn.jsdelivr.net` (independent CDN host, different from primary fixture host)
- Claim: `Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.`
- SHA-256: `5ef86b2044ea682ab1dff049786ed396bd37c9e7a1f267e194b8b1390d78bdce`
- Expected Verdict: `SUPPORTS`

### Fixture 3: near_miss.md (CONTRADICTS)
- URL: `https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/near_miss.md`
- Host: `raw.githubusercontent.com`
- Claim: `Project Nova quarterly revenue reached $14.2 million representing an increase of 42 percent.`
- Expected Verdict: `CONTRADICTS`

### Fixture 4: short.md (UNREADABLE)
- URL: `https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/short.md`
- Host: `raw.githubusercontent.com`
- Content Length: 29 characters (< MIN_PAGE_CHARS = 200)
- Expected Verdict: `UNREADABLE`

### Fixture 5: injection.md (NOT_ADDRESSED)
- URL: `https://raw.githubusercontent.com/huzyow155/citation-court-genlayer/main/fixtures/injection.md`
- Host: `raw.githubusercontent.com`
- Claim: `Project Nova achieved 100 percent net profit margins.`
- Expected Verdict: `NOT_ADDRESSED`

---

## Refusal and User Error Cases

The following contract execution failures are pre-registered and must be rejected with the exact error string:

1. `unknown claim id`: Call `add_source` or `judge_source` on nonexistent claim ID `999`.
2. `only the claim author can add sources`: Call `add_source` from an address that did not lodge the claim.
3. `source limit reached`: Call `add_source` when 3 sources already exist on the claim.
4. `duplicate source`: Call `add_source` with an existing URL, varying casing, trailing slashes, or URL fragments.
5. `invalid source index`: Call `judge_source` with index `-1`, index `>= len(sources)`, or non-integer index.
6. `claim already judged`: Call `judge_source` on a source index that already holds a final verdict.
7. `attempt limit reached`: Call `judge_source` after 3 consecutive `UNREADABLE` outcomes on that source index.

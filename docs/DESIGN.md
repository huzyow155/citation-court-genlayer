# System Design & Architecture: Citation Court

## 1. Architectural Philosophy: The Equivalence Principle & Consensus
In GenLayer's decentralized execution model, multiple independent validator nodes execute smart contract code in sandboxed GenVM instances. For non-deterministic actions (such as fetching external web pages via HTTP or querying LLMs), different validators run varied LLM engines (e.g. Grok, GPT-5.4, Gemini, GLM, MiniMax).

If a smart contract attempts to reach consensus on free-text explanations, reasoning chains, or raw JSON dictionaries, minor differences in phrasing, whitespace, or secondary attributes will trigger `MAJORITY_DISAGREE`.

### The Consensus Primitive
Citation Court solves this by formulating the consensus function passed to `gl.eq_principle.strict_eq` to return **strictly one canonical enum string**:
- `SUPPORTS`
- `CONTRADICTS`
- `NOT_ADDRESSED`
- `UNREADABLE`

Every supporting passage or intermediate text extracted by an LLM is evaluated inside the validator node and **deliberately excluded from consensus comparison**.

---

## 2. Normalized Grounding Rule (`_ground`)
To prevent hallucinated citations and phantom references, Citation Court implements a deterministic gatekeeper.

### What Grounding Actually Checks

Rather than an unnormalized literal byte match, grounding checks whether the candidate passage appears as a contiguous sequence in the page text **after normalization of case, whitespace, and typographic punctuation**.

```python
def _normalize_text(text: str) -> str:
    """Normalize string: lowercase, collapse whitespace, map typographic quotes/dashes to ASCII."""
    if not text:
        return ""
    # Map typographic quotes and dashes
    s = str(text)
    s = s.replace("\u2018", "'").replace("\u2019", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    # Lowercase and collapse whitespace
    return " ".join(s.lower().split())


def _ground(verdict: str, quote: str, clean_page_text: str) -> str:
    """Verbatim grounding check. Downgrades ungrounded verdicts to NOT_ADDRESSED."""
    if verdict not in (VERDICT_SUPPORTS, VERDICT_CONTRADICTS):
        return verdict

    norm_quote = _normalize_text(quote).strip("\"'")
    norm_page = _normalize_text(clean_page_text)

    if len(norm_quote) < MIN_QUOTE_LEN:
        return VERDICT_NOT_ADDRESSED

    if norm_quote not in norm_page:
        return VERDICT_NOT_ADDRESSED

    return verdict
```

### Exact Normalization Transformations & Constants:
1. **Typographic Single Quote Normalization**: Maps Unicode curly single quotes `\u2018` (‘) and `\u2019` (’) to ASCII `'`.
2. **Typographic Double Quote Normalization**: Maps Unicode curly double quotes `\u201c` (“) and `\u201d` (”) to ASCII `"`.
3. **Typographic Dash Normalization**: Maps Unicode en-dash `\u2013` (–) and em-dash `\u2014` (—) to ASCII `-`.
4. **Case-Folding**: Converts all characters to lowercase via `.lower()`.
5. **Whitespace Collapsing**: Splits by whitespace tokens and rejoins with a single space (`" ".join(s.lower().split())`), collapsing spaces, tabs, and newlines.
6. **Outer Quotation Trimming**: Removes surrounding single and double quotation marks from the candidate quote via `.strip("\"'")`.
7. **Minimum Length Threshold**: `MIN_QUOTE_LEN = 25`. Any normalized quote under 25 characters is considered insufficient evidence and downgraded to `NOT_ADDRESSED`.
8. **Normalized Substring Containment**: Enforces `norm_quote in norm_page` (a passage appearing contiguously in the page text after normalization of case, whitespace, and typographic punctuation).

*(Note on contract source comments/prompts: Comments and system prompts inside `contracts/CitationCourt.py` instruct the LLM to supply a "verbatim quote" to deter generative rewriting, but the contract verification code executes the normalized containment check documented above).*

> [!WARNING]
> **Grounding Boundary & Limitation**: Grounding verifies that a passage appears contiguously in the page text after normalization of case, whitespace, and typographic punctuation; it does NOT prove the source text is reliable, truthful, free of malicious injections, or semantically relevant to the claim. If an adversarial page deliberately embeds a fake assertion ("Claim X is fully confirmed") and the model quotes that passage, grounding will succeed because the passage is present on the page. Defense against prompt injection relies strictly on framing untrusted data inside structured delimiters and LLM instruction-following.

---

## 3. Long Page Windowing Strategy (`_extract_windows`)
Web pages can exceed the context window or token budget of validator LLMs. Truncating the page from the beginning often misses the relevant section, while arbitrary chunking can yield validator divergence.

Citation Court implements **deterministic keyword-density windowing**:
1. If the cleaned page text exceeds `MAX_CLEAN_TEXT_LEN` (8000 characters), it is split into ~400-character windows (`WINDOW_SIZE = 400`).
2. Deduplicated keywords of length $\ge 4$ are extracted from the claim.
3. Each window is scored based on the count of deduplicated claim keywords it contains.
4. Top-scoring windows are accumulated up to `MAX_WINDOWS_TOTAL_LEN` (6000 characters).
5. Crucially, the selected windows are sorted back into their **original document order** before being joined with ` ... `.
6. Grounding is always verified against the **full cleaned page text**, ensuring that even if an excerpt spans a boundary, the source document confirms it.

---

## 4. Structured URL Defense
To prevent server-side request forgery (SSRF) and validator denial-of-service, all URLs submitted to `lodge_claim` are validated using `urllib.parse.urlsplit` and `ipaddress.ip_address`:
- Scheme must be strictly `https`.
- Hostname must be present and cannot be `localhost`.
- Userinfo (`user:pass@host`) is strictly disallowed to prevent credential-spoofing phishing attacks.
- Port must be omitted or explicitly `443`.
- Hostnames matching IPv4/IPv6 literals are inspected: loopback, private RFC1918, link-local, reserved, and unspecified IP ranges are rejected with specific `UserError` messages.
- Embedded whitespace is prohibited.

---

## 5. Storage Architecture (All `TreeMap[str, str]`)
Persistent state is strictly stored as canonical JSON strings in GenLayer `TreeMap[str, str]` structures:
- `claims`: Maps `claim_id -> {id, claim, url, author, seq, schema_version}`.
- `rulings`: Maps `claim_id -> {claim_id, verdict, attempts, schema_version}`.
- `by_author`: Maps `author_hex_lower -> JSON list of claim_ids` (newest first, capped at 50).
- `meta`: Holds metadata counters:
  - `next_id`: Decimal counter string for predictable auto-incrementing IDs.
  - `recent`: JSON array of recent claim IDs (capped at 50).
  - `stats`: Canonical JSON object tracking counts for `total_claims`, `total_judgments`, `supports`, `contradicts`, `not_addressed`, and `unreadable`.
    - Counting semantics: `total_claims` counts claims lodged via `lodge_claim`. `total_judgments` and individual verdict counters count judgment executions via `judge_claim`. Re-judging an unreadable claim (e.g. Case F) records an additional judgment, incrementing `total_judgments` and `unreadable` again. The invariant `total_judgments == supports + contradicts + not_addressed + unreadable` holds at all times.

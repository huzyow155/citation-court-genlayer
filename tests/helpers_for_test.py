import json
import hashlib
import html as html_lib
import re
import urllib.parse
import ipaddress

SCHEMA_VERSION = "1"
MAX_CLAIM_LEN = 400
MIN_CLAIM_LEN = 20
MAX_URL_LEN = 300
MIN_PAGE_CHARS = 200
MIN_QUOTE_LEN = 25
WINDOW_SIZE = 400
MAX_WINDOWS_TOTAL_LEN = 6000
MAX_CLEAN_TEXT_LEN = 8000
MAX_ATTEMPTS = 3
MAX_DISCOVERY_LIMIT = 20
DEFAULT_DISCOVERY_LIMIT = 10

VERDICT_SUPPORTS = "SUPPORTS"
VERDICT_CONTRADICTS = "CONTRADICTS"
VERDICT_NOT_ADDRESSED = "NOT_ADDRESSED"
VERDICT_UNREADABLE = "UNREADABLE"
VALID_VERDICTS = (VERDICT_SUPPORTS, VERDICT_CONTRADICTS, VERDICT_NOT_ADDRESSED, VERDICT_UNREADABLE)


class UserError(Exception):
    pass


def _canonical_json(data) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def _normalize_text(text: str) -> str:
    if not text:
        return ""
    s = str(text)
    s = s.replace("\u2018", "'").replace("\u2019", "'")
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    return " ".join(s.lower().split())


def _clean_html(html: str) -> str:
    if not html:
        return ""
    cleaned = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    cleaned = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", cleaned)
    cleaned = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", cleaned)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+([.,;:!?])", r"\1", cleaned)
    unescaped = html_lib.unescape(cleaned)
    return " ".join(unescaped.split())


def _extract_windows(page_text: str, claim: str) -> str:
    if len(page_text) <= MAX_CLEAN_TEXT_LEN:
        return page_text

    claim_words = set(re.findall(r"[a-zA-Z0-9]{4,}", claim.lower()))
    if not claim_words:
        claim_words = set(re.findall(r"\w+", claim.lower()))

    windows = []
    text_len = len(page_text)
    idx = 0
    while idx < text_len:
        end = min(idx + WINDOW_SIZE, text_len)
        chunk = page_text[idx:end]
        windows.append((len(windows), chunk))
        idx = end

    scored = []
    for order_idx, chunk in windows:
        chunk_lower = chunk.lower()
        score = sum(1 for kw in claim_words if kw in chunk_lower)
        scored.append((score, order_idx, chunk))

    scored.sort(key=lambda x: (-x[0], x[1]))

    selected = []
    total_len = 0
    for score, order_idx, chunk in scored:
        if total_len + len(chunk) > MAX_WINDOWS_TOTAL_LEN and selected:
            break
        selected.append((order_idx, chunk))
        total_len += len(chunk)

    selected.sort(key=lambda x: x[0])
    return " ... ".join(chunk for _, chunk in selected)


def _ground(verdict: str, quote: str, clean_page_text: str) -> str:
    if verdict not in (VERDICT_SUPPORTS, VERDICT_CONTRADICTS):
        return verdict

    norm_quote = _normalize_text(quote).strip("\"'")
    norm_page = _normalize_text(clean_page_text)

    if len(norm_quote) < MIN_QUOTE_LEN:
        return VERDICT_NOT_ADDRESSED

    if norm_quote not in norm_page:
        return VERDICT_NOT_ADDRESSED

    return verdict


def _validate_url(url: str) -> None:
    if not isinstance(url, str):
        raise UserError("url must be string")
    if len(url) > MAX_URL_LEN:
        raise UserError("url length exceeds limit")
    if any(c.isspace() for c in url):
        raise UserError("url contains whitespace")

    parsed = urllib.parse.urlsplit(url)

    if parsed.scheme.lower() != "https":
        raise UserError("url scheme must be https")

    if not parsed.hostname:
        raise UserError("url hostname missing")

    if parsed.username or parsed.password:
        raise UserError("url contains userinfo")

    if parsed.port is not None and parsed.port != 443:
        raise UserError("url port must be 443 or omitted")

    host_lower = parsed.hostname.lower()
    if host_lower == "localhost":
        raise UserError("url hostname cannot be localhost")

    try:
        ip = ipaddress.ip_address(host_lower)
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved or ip.is_unspecified:
            raise UserError("url host cannot be private or reserved IP")
    except ValueError:
        pass


def _validate_claim(claim: str) -> str:
    if not isinstance(claim, str):
        raise UserError("claim must be string")
    stripped = claim.strip()
    if len(stripped) < MIN_CLAIM_LEN:
        raise UserError("claim length below minimum 20 characters")
    if len(stripped) > MAX_CLAIM_LEN:
        raise UserError("claim length exceeds maximum 400 characters")
    return stripped


def _parse_model_output(raw_output) -> tuple[str, str]:
    if isinstance(raw_output, dict):
        v = str(raw_output.get("verdict", "")).strip().upper()
        q = str(raw_output.get("quote", "")).strip()
        return (v if v in VALID_VERDICTS else VERDICT_NOT_ADDRESSED, q)

    text = str(raw_output).strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        obj = json.loads(text.strip())
        if isinstance(obj, dict):
            v = str(obj.get("verdict", "")).strip().upper()
            q = str(obj.get("quote", "")).strip()
            return (v if v in VALID_VERDICTS else VERDICT_NOT_ADDRESSED, q)
    except Exception:
        pass

    v_match = re.search(r'"verdict"\s*:\s*"([A-Z_]+)"', text, re.IGNORECASE)
    q_match = re.search(r'"quote"\s*:\s*"([^"]*)"', text)
    v = v_match.group(1).upper() if v_match else VERDICT_NOT_ADDRESSED
    q = q_match.group(1) if q_match else ""
    return (v if v in VALID_VERDICTS else VERDICT_NOT_ADDRESSED, q)

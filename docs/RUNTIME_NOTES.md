# Runtime Notes & Verification (Milestone 0)

## Overview
This document records the exact runtime characteristics of GenLayer Studio (`studionet`, chain ID `61999`, RPC `https://studio.genlayer.com/api`) probed on-chain using `contracts/Probe.py`.

---

## 1. Header and Module Imports
The official verified GenLayer header:
```python
# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *
```

### Probed Module Behaviors:
- `import hashlib` succeeds inside methods and constructors. SHA-256 digests compute deterministically.
- `import re` succeeds and executes standard regular expression operations.
- `import urllib.parse` (`urlsplit`) succeeds inside methods, correctly parsing schemes, hosts, ports, paths, and userinfo.
- `import ipaddress` (`ip_address`) succeeds inside methods, properly identifying loopback, private, link-local, and reserved IPv4/IPv6 addresses.
- `gl.vm.UserError` is verified present and is the standard exception class for expected user errors.

---

## 2. Sender Accessor & View Returns
- `gl.message.sender_address` returns an `Address` instance.
- Address can be converted to hex via `.as_hex` (checksummed hex) or `str(sender)`.
- View methods returning `str` execute synchronously and can return stringified JSON payloads.
- Single-letter / lowercase conversions should use `.as_hex.lower()` for indexed lookups.

---

## 3. Web Retrieval & Validator Non-Determinism (`gl.nondet.web.get`)
- `gl.nondet.web.get(url)` returns a response object with `.status` (int) and `.body` (bytes).
- Decoding `.body` using `.decode("utf-8")` or `.decode("utf-8", errors="replace")` handles arbitrary remote web content safely.
- **Probe Results on Studionet**:
  - `https://raw.githubusercontent.com/.../supports.md`: Returned HTTP `200`, length `1258` bytes.
  - `https://example.com`: Returned HTTP `200`, length `577` bytes.
  - Non-existent 404 URL: Returned HTTP `404`.
  - Dynamic / changing pages (like `en.wikipedia.org/wiki/Special:Random`): Returns HTTP 200, but because the URL returns different content per validator, hashing or comparing raw byte lengths across validators causes `MAJORITY_DISAGREE`.
  - **Key Architectural Takeaway**: The consensus function passed to `gl.eq_principle.strict_eq` must return **strictly one canonical enum** (`SUPPORTS`, `CONTRADICTS`, `NOT_ADDRESSED`, or `UNREADABLE`). Validators must never include raw byte counts, timestamps, or free text in the consensus string.

---

## 4. LLM Prompt Execution (`gl.nondet.exec_prompt`)
- `gl.nondet.exec_prompt(prompt)` returns a string (type `str`).
- Validators run independent LLM backends (e.g. Grok-4.3, GPT-5.4, Gemini-3-Flash, GLM-5.1, MiniMax-M3).
- To guarantee strict equality across diverse model engines, deterministic Python post-processing must convert the model's small output into a canonical decision before passing it to `gl.eq_principle.strict_eq`.

---

## 5. Measured Probe Artifacts
- **Network**: GenLayer Studionet (Chain ID: 61999)
- **Probe Contract Address**: `0xC5da3E1C809df4635738F6d6065c5629EFF7190C`
- **Deploy Tx Hash**: `0x849659f8a73ad2c5626f7b6b55217fbb8bd33bdece97e936924e9a00bed1e1b6`
- **Deploy Status**: `ACCEPTED` (`MAJORITY_AGREE`)
- **Sender Address**: `0x88e9a06a57ebb9D7Bf3A7137e14D268EB6dd916D`
- **Hashlib Test**: `49cd3cefe6f6`
- **UserError Verification**: Verified `gl.vm.UserError`

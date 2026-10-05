# Frontend UI & Integration Specification: Citation Court

## Overview
This document specifies the required frontend views, state machines, and UX patterns enabled by the `CitationCourt` intelligent contract.

---

## 1. Primary Screens and Views

### A. Lodge-A-Claim View
- **Input Fields**:
  - `Claim Text`: Single-fact proposition (textarea, 20-400 characters, real-time character counter).
  - `Source Link`: Hyperlink to supporting web page (input URL, strictly `https://`, port 443 or omitted, no private IPs).
- **Client Validation**: Real-time URL format check and character count bounds matching contract rules.
- **Contract Call**: `CitationCourt.lodge_claim(claim, source_url)`.
- **Feedback**: Displays newly allocated integer claim ID (e.g. `Claim #4 lodged successfully!`).

### B. Claim & Judgment Details View (`/claim/:id`)
- **Header**: Claim ID, Author Address, lodging sequence.
- **Card Content**:
  - Full claim text in blockquote format.
  - Source URL with external link icon.
  - Status Badge:
    - `Unjudged` (Yellow)
    - `Supports` (Green)
    - `Contradicts` (Red)
    - `Not Addressed` (Slate/Neutral)
    - `Unreadable` (Orange)
- **Interactive Action**:
  - "Judge Now" button (active if unjudged or previous judgment was `UNREADABLE` and attempts < 3).
  - Multi-validator Consensus Waiting Spinner: shows estimated latency (~12-16s) and status updates while `waitForTransactionReceipt` polls.
  - Attempt counter display (`Attempt X of 3`).

### C. Recent Claims Feed (`/feed`)
- **Query**: `CitationCourt.list_recent(limit=20)`.
- **Display**: Paginated or infinite-scrolling card feed of recent claims, each displaying current verdict badge and direct link to claim details.

### D. Author Profile & History (`/author/:address`)
- **Queries**:
  - `CitationCourt.latest_by_author(address)`
  - `CitationCourt.list_by_author(address, limit=20)`
- **Display**: Author's total claims, historical verdict breakdown, and list of claims submitted by that wallet.

### E. Analytics & Verdict Dashboard (`/analytics`)
- **Query**: `CitationCourt.get_stats()`.
- **Metrics**:
  - Total Claims Lodged
  - Total Consensus Judgments Run
  - Verdict breakdown donut/pie chart: `% Supports`, `% Contradicts`, `% Not Addressed`, `% Unreadable`.

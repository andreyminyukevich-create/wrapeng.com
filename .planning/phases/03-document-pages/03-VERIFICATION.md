---
phase: 03-document-pages
verified: 2026-03-25T16:30:00Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "board.html links to both document pages using ?calc_id= and users can navigate there"
    status: partial
    reason: "board.html context-menu handlers goAct() and goWorkOrder() correctly build URLs with calc_id. However work-order.html uses .single() on the primary calculations fetch (line 827) and on delivery_acts (line 837). The QueryBuilder.single() in api.js sets a ?single=1 query param and unwraps array[0] client-side — it does NOT throw on missing rows, so the behaviour is safe, but the pitfall noted in STATE.md ('QueryBuilder.single() behaviour is unclear') was explicitly avoided in acceptance-act.html (Plan 03-01) yet silently violated in work-order.html (Plan 03-02). This is an inconsistency, not a crash, but it diverges from the established pattern and the stated key-decision."
    artifacts:
      - path: "work-order.html"
        issue: ".single() used on calculations (line 827) and delivery_acts (line 837) despite plan key-decision to avoid it; acceptance-act.html correctly avoids .single() on the same table"
    missing:
      - "Replace .single() calls in work-order.html with .eq('id', calcId) array fetch + [0] unwrap — consistent with acceptance-act.html pattern and the documented pitfall avoidance"
human_verification:
  - test: "Open acceptance-act.html?calc_id=<real-id> in browser after login"
    expected: "All four cards render (vehicle, acceptance data, equipment checklist, photo zones) with real data from the database; no placeholder text visible on screen"
    why_human: "Cannot run a live browser session; requires a real calc_id with an acceptance_act row in the database"
  - test: "Click Print on acceptance-act.html"
    expected: "Browser print dialog shows A4 layout: studio name header, AKT PRIEMKI heading, all data cards, signature line; nav sidebar and subheader buttons are hidden"
    why_human: "Print layout requires visual inspection in a real browser"
  - test: "Open work-order.html?calc_id=<real-id with delivery act and outsource record>"
    expected: "Seven cards render: vehicle, services, executors, materials, payment breakdown, outsourcing record, and status history timeline"
    why_human: "Cannot verify composite data fetch without a live database session"
  - test: "Click Print on work-order.html"
    expected: "Browser print dialog shows A4 table layout, studio name, ZAKAZ-NARYAD heading, structured service/payment tables, signature lines; nav hidden"
    why_human: "Print layout requires visual inspection in a real browser"
---

# Phase 3: Document Pages Verification Report

**Phase Goal:** Users can open a printable acceptance act or work order for any calculation directly from the board, see all captured data on a well-structured A4-ready page, and print it from the browser.
**Verified:** 2026-03-25T16:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Opening `acceptance-act.html?calc_id=X` renders all acceptance fields — no stub text | VERIFIED | 760-line file; `renderActCard()` renders mileage, fuel, damages, client_agreed, notes, equipment JSONB checklist, photo_checks JSONB checklist; all "missing data" paths show explicit "Не указано" — no placeholder text |
| 2 | Print on acceptance-act.html produces A4 doc: studio name, structured fields, signature line, nav hidden | VERIFIED | `@media print` at line 188 hides `.page-subheader`, `#navSidebar`; shows `.print-header` (studio name, "АКТ ПРИЁМКИ", car name, date) and `.signature-line` (two parties); `break-inside: avoid` on `.card` |
| 3 | Opening `work-order.html?calc_id=X` renders composite doc: services, executors, materials, payment, outsourcing | VERIFIED | 954-line file; seven render functions cover all sections; `parseServices()` handles 3 JSONB shapes; `parseMaterials()` dual-source; `renderPaymentCard()` with mixed breakdown; `renderOutsourceCard()` with return notes |
| 4 | Print on work-order.html produces A4 doc: table layout, studio name, nav hidden | VERIFIED | `@media print` at line 244 hides nav, subheader; shows `.print-header` (studio name, "ЗАКАЗ-НАРЯД", car, date) and `.signature-line`; `break-inside: avoid`; table font 9pt |
| 5 | Both pages show chronological status history timeline at the bottom | VERIFIED | `renderTimelineCard(history)` in acceptance-act.html (line 519) and `renderHistoryCard(history)` in work-order.html (line 767) both consume `status_history` ordered by `created_at asc`, with from/to status pills, timestamp, and comment |

**Score: 5/5 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `acceptance-act.html` | Full document page replacing stub | VERIFIED | 760 lines; auth check, 3 API fetches, 4 rendered cards, print CSS, timeline |
| `work-order.html` | Full composite document page replacing stub | VERIFIED | 954 lines; auth check, Promise.all for 4 parallel fetches, 7 rendered cards, print CSS, timeline |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `board.html` | `acceptance-act.html` | `goAct()` context-menu buttons | WIRED | Lines 1118, 1167, 1174 — URL built as `acceptance-act.html?calc_id=${calc.id}` |
| `board.html` | `work-order.html` | `goWorkOrder()` context-menu buttons | WIRED | Lines 1119, 1197, 1198, 1204, 1210 — URL built as `work-order.html?calc_id=${calc.id}` |
| `acceptance-act.html` | `calculations` table | `sb.from('calculations').select('*').eq('id', calcId)` | WIRED | Line 632 — array fetch, `calcArr[0]` unwrap; follows stated pattern |
| `acceptance-act.html` | `acceptance_acts` table | `sb.from('acceptance_acts').select('*').eq('calc_id', calcId)` | WIRED | Line 651 |
| `acceptance-act.html` | `status_history` table | `sb.from('status_history').select('*').eq('calc_id', calcId).order(...)` | WIRED | Line 662 |
| `work-order.html` | `calculations` table | `sb.from('calculations').select('*').eq('id', calcId).single()` | WIRED (with caveat) | Line 827 — uses `.single()` contrary to pitfall avoidance pattern from acceptance-act.html; functional because api.js QueryBuilder handles `.single()` safely |
| `work-order.html` | `delivery_acts` table | `sb.from('delivery_acts').select('*').eq('calc_id', calcId).single()` | WIRED (with caveat) | Line 837 — same `.single()` inconsistency |
| `work-order.html` | `outsource_records` table | `Promise.all` parallel fetch | WIRED | Line 838 |
| `work-order.html` | `status_history` table | `Promise.all` parallel fetch with `.order()` | WIRED | Line 839 |
| `work-order.html` | `work_assignments` table | `Promise.all` parallel fetch | WIRED | Line 840 |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `acceptance-act.html` | `calc`, `act`, `history` | `sb.from('calculations')`, `sb.from('acceptance_acts')`, `sb.from('status_history')` | DB queries via API | FLOWING |
| `work-order.html` | `calc`, `delivery`, `outsources`, `history`, `assignments` | `sb.from(...)` calls via `loadPage()` | DB queries via API | FLOWING |

Both pages use `.textContent` throughout — no `innerHTML` with user data. XSS-safe DOM construction confirmed.

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — pages require a running backend at `/api` and a live Supabase session; cannot test without a server. UI rendering is routed to human verification above.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DOC-01 | 03-01-PLAN.md | acceptance-act.html — full page showing acceptance act data, loaded via ?calc_id= | SATISFIED | acceptance-act.html: 760 lines; URL param read at line 722; all acceptance fields rendered in `renderActCard()` |
| DOC-02 | 03-01-PLAN.md | acceptance-act.html print layout — A4, studio name header, structured fields, signature line | SATISFIED | `@media print` block lines 188-203; `.print-header` with studio name and document title; `.signature-line` with two parties |
| DOC-03 | 03-02-PLAN.md | work-order.html — full page showing services, materials, executors, pricing, payment, loaded via ?calc_id= | SATISFIED | work-order.html: 954 lines; all seven data sections rendered; URL param read at line 903 |
| DOC-04 | 03-02-PLAN.md | work-order.html print layout — A4, structured table layout, studio name | SATISFIED | `@media print` block lines 244-264; `.print-header`; `.signature-line`; `table { font-size: 9pt }` |
| DOC-05 | 03-01-PLAN.md + 03-02-PLAN.md | Status history timeline on both document pages — chronological list of transitions | SATISFIED | `renderTimelineCard()` in acceptance-act.html; `renderHistoryCard()` in work-order.html — both ordered by `created_at asc` |

**All 5 phase requirements satisfied. No orphaned requirements.**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `acceptance-act.html` | 241 | `escapeHtml` imported from formatters.js but never called — unused import | Info | Dead import; no functional impact; all user content already handled safely via `.textContent` |
| `acceptance-act.html` | 241-242 | `fmtMoney` and `showToast` imported but never called — unused imports | Info | Dead imports; no functional impact |
| `work-order.html` | 827 | `.single()` on primary `calculations` fetch — contradicts the explicit key-decision in 03-01 PLAN and STATE.md pitfall note | Warning | Diverges from established pattern; QueryBuilder.single() is functional (api.js line 87 safely unwraps array[0]) but plan said to avoid it |
| `work-order.html` | 837 | `.single()` on `delivery_acts` fetch — same inconsistency | Warning | Same as above; if backend returns an array for delivery_acts, result.data[0] is used correctly; no crash |

---

## Human Verification Required

### 1. Acceptance Act — Live Data Rendering

**Test:** Log in, open `acceptance-act.html?calc_id=<UUID of a calculation with an acceptance_act record>` in a browser.
**Expected:** Four cards visible — vehicle info, acceptance data (mileage, fuel level, damages, client-agreed badge), equipment checklist with checkmarks/crosses, photo zone checklist. No placeholder text. Car name appears in subheader subtitle.
**Why human:** Requires a live database session and a real calc_id with associated acceptance_act row.

### 2. Acceptance Act — Print Output

**Test:** On the loaded acceptance-act.html, click "Печать" button.
**Expected:** Browser print dialog shows: studio name at top, "АКТ ПРИЁМКИ АВТОМОБИЛЯ" heading, car name, date; all data cards; signature line "Представитель студии ___" / "Клиент ___" at bottom. Navigation sidebar and subheader are hidden.
**Why human:** Print layout requires visual inspection in a real browser print dialog.

### 3. Work Order — Full Composite Rendering

**Test:** Open `work-order.html?calc_id=<UUID of a calculation that went through outsourcing and delivery>`.
**Expected:** Seven cards rendered: vehicle info, services list with prices, executors with salary, materials, payment breakdown (with mixed method detail if applicable), outsourcing record with contractor name, status history timeline.
**Why human:** Requires a live database session with a calc_id that has records in delivery_acts, outsource_records, work_assignments, and status_history.

### 4. Work Order — Print Output

**Test:** On loaded work-order.html, click "Печать".
**Expected:** "ЗАКАЗ-НАРЯД" heading with studio name, all cards rendered in A4 format, service tables legible, nav hidden, signature line present.
**Why human:** Print layout requires visual inspection.

---

## Gaps Summary

The phase goal is substantively achieved: both document pages exist as full, non-stub implementations with all required data sections, print layouts, and status history timelines. All five DOC requirements are satisfied. Board navigation to both pages is wired.

One notable inconsistency was found: `work-order.html` uses `.single()` on the `calculations` and `delivery_acts` fetches (lines 827, 837), while `acceptance-act.html` deliberately avoids `.single()` — consistent with the explicit key-decision documented in the 03-01 PLAN and the STATE.md pitfall note. The QueryBuilder implementation in `api.js` handles `.single()` safely (line 87), so this is not a functional crash but a pattern inconsistency that should be corrected for maintainability.

Three unused imports in `acceptance-act.html` (`escapeHtml`, `fmtMoney`, `showToast`) have no functional impact since all user-origin strings are rendered via `.textContent`.

Overall verification status: **gaps_found** — one structural inconsistency in `work-order.html` warrants a targeted fix.

---

_Verified: 2026-03-25T16:30:00Z_
_Verifier: Claude (gsd-verifier)_

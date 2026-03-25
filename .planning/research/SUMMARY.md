# Project Research Summary

**Project:** Keep1R CRM — Workshop Pipeline Milestone
**Domain:** Auto service / detailing studio CRM (status-machine kanban, legal documents, payment tracking)
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

Keep1R is a vanilla HTML/JS + PostgreSQL CRM for detailing studios. The workshop pipeline milestone adds 6 status-transition forms, 3 new database tables, an outsourcing workflow, and two printable legal documents (acceptance act and work order) to an existing kanban board. The existing codebase is the authoritative source for all implementation patterns — there is no framework, no build toolchain, and no package manager. Every new feature must follow the exact patterns already established in `board.html`: modal overlays with `<div class="modal">`, procedural JS save handlers, `api.js` QueryBuilder for CRUD, and `window.print()` with `@media print` CSS for document output.

The recommended approach is database-first: create the 3 new tables (`acceptance_acts`, `outsource_records`, `delivery_acts`) before touching any UI, because all 6 transition modals, both document pages, and the payment extension depend on those tables existing. Build the transition modals in dependency order — acceptance modal first (establishes the two-step sub-table INSERT + status PATCH pattern), outsourcing modal second (introduces the new board column and status), then extend the existing delivery modal for 5-method payment. Document pages come last because they aggregate data that can only be populated once the modals are working.

The top risk is data integrity across a two-step save that the server cannot transact atomically: if the sub-table INSERT succeeds but the status PATCH fails, the pipeline shows a stale status with a dangling record. A close second is the divergence between `calculations.final_price` (queried by cashflow/income pages) and the new `delivery_acts.total_amount`. Both must be solved at the SQL migration stage — not retrofitted in JS. A third structural risk is the board's `loadBoard()` pattern being called after every mutation: adding 6 more transition modals without a `_loading` guard creates visible tablet lag and potential double-submit races.

## Key Findings

### Recommended Stack

The stack is fixed by project constraint: vanilla ES6+ modules, hand-rolled modal CSS, `api.js` QueryBuilder, and `window.print()` for document output. No new CDN dependencies are needed or permitted. All recommended technologies are already present in the codebase; the milestone requires zero new libraries.

**Core technologies:**
- **Vanilla ES6+ with `<script type="module">`**: all page logic — matches every existing file, `import` already in use
- **Existing `.modal` / `.modal.active` CSS system**: status-transition overlays — full styled modal infrastructure already present in `board.html`
- **`api.js` QueryBuilder (`sb.from(table)`)**: CRUD for 3 new tables — identical pattern to all existing tables
- **`window.print()` + `@media print` CSS**: printable acceptance act and work order — browser-native, vector output, no CDN dependency (preferred over jsPDF/html2canvas for legal documents)
- **PostgreSQL JSONB**: payment breakdown storage in `delivery_acts` — avoids 5 nullable numeric columns, easy to query, already used in `calculation_data`
- **New module `pipeline-forms.js`**: extract all 6 transition modal open/save handlers from `board.html` — follows `booking-popup.js` precedent; board.html is already 1400+ lines

See `.planning/research/STACK.md` for full rationale and rejected alternatives.

### Expected Features

**Must have (table stakes):**
- Acceptance act (акт приёмки) with mileage, damage checklist, equipment checklist, photo-done checkboxes, client consent — studios are legally required to produce this document
- Transition-gated status moves — modal fires on drag or button click for every status change that requires data capture
- Work order (заказ-наряд) as a printable page — legal requirement, clients expect a printed sheet at pickup
- Master assignment tied to status transition (accepted → in_progress) — "who is doing this?" must be captured at transition time
- Delivery form with 5-method payment capture (cash, card/transfer, bank + VAT%, debt, mixed) — current modal only supports 3 methods; missing methods corrupt cashflow data
- Cancellation with required reason text — supports lost-revenue analysis
- Printable acceptance act and work order — print stylesheet on both document pages

**Should have (competitive differentiators):**
- Outsourcing status as a first-class board column with contractor record — most CRMs have no concept of "car sent to third party"; two subtypes (car leaves / contractor arrives)
- Mixed payment form with per-method amount breakdown — generic CRMs offer 2-3 methods; debt ("в долг") enables deferred-payment tracking
- Acceptance act auto-populated from existing calculation — inherits car data, services, price from the calculation record
- Outsourcing return loop (outsourced → in_progress) with "returned from contractor" note
- Time-in-status aging indicators on kanban cards (warn > 24h, alert > 72h)

**Defer (v2+):**
- Photo upload to server — requires backend changes not in this repo
- Electronic signature — legal status unclear in Russian context; use "client agreed" checkbox instead
- Push/email notifications on status change — requires notification infrastructure
- Mandatory field enforcement — wait for studio adoption feedback before blocking transitions
- 1C / accounting integration
- Customer-facing status portal

See `.planning/research/FEATURES.md` for full feature dependency graph and MVP priority order.

### Architecture Approach

The new features integrate into two zones: `board.html` gains 6 new transition modal blocks (consistent with the existing `modalDone`/`modalDeliver` pattern), and `acceptance-act.html` / `work-order.html` graduate from stubs to full document pages. All transition forms stay inside `board.html` as overlays — never as separate pages — to preserve board context. The server exposes no business-logic endpoints; all orchestration lives in page JS.

**Major components:**
1. **board.html transition modal system** — 6 `<div class="modal">` overlays; each follows the pattern: `openModal*(calcId)` → form fill → `btnXxxSave` handler writes sub-table record first, then calls `updateStatus()`, then closes + toasts + reloads board
2. **`pipeline-forms.js` module** — extracted open/close/save functions for all 6 modals; imported by `board.html` via `<script src="pipeline-forms.js">`; prevents board.html growing beyond manageable size
3. **`acceptance-act.html` (document page)** — loads `calculations` + `acceptance_acts` by `?calc_id=`, renders printable A4 form, `window.print()` button; `@media print` CSS hides nav from day one
4. **`work-order.html` (document page)** — aggregates `calculations` + `work_assignments` + `delivery_acts` + `outsource_records`; most complex page, built last
5. **PostgreSQL migrations** (`migrations/001_workshop_pipeline.sql`) — 3 new tables (`acceptance_acts`, `outsource_records`, `delivery_acts`) + `outsourced` added to status enum; everything depends on these

See `.planning/research/ARCHITECTURE.md` for data flow diagrams, two-step save pattern code, and full anti-pattern catalogue.

### Critical Pitfalls

1. **Illegal status transitions (Pitfall 1)** — `updateStatus()` does not validate current status; duplicate acceptance acts or split payment records result. Prevention: add a client-side `from_status` guard before every transition modal INSERT; consider a DB trigger or check constraint.

2. **Divergent `final_price` / `total_amount` (Pitfall 3)** — `calculations.final_price` is queried by cashflow and income pages; the new `delivery_acts` table introduces a second amount field. Prevention: define the canonical source in the SQL migration; always write the sum total back to `calculations.final_price` in the same save handler that writes `delivery_acts`.

3. **`loadBoard()` on every mutation without a `_loading` guard (Pitfall 2)** — 6 new transition modals each call `loadBoard()`; on a tablet with 100+ orders this causes 300-600 ms freezes and double-submit races on fast taps. Prevention: add a module-level `_loading` flag in Phase 1 before any new modals are wired up.

4. **Print layout broken at the last minute (Pitfall 4)** — `body { min-height: 100svh }` and sticky nav elements break A4 print in Safari (primary tablet browser). Prevention: build the `@media print` CSS skeleton in the first commit of each document page, not as a finishing step.

5. **`outsourced` missing from `ACTIVE_KEYS` / `normalizeStatus()` (Pitfalls 5 & 6)** — a one-line miss causes all outsourced cards to vanish from the default "active" board filter. Prevention: add `outsourced` to `ACTIVE_KEYS`, `COLUMNS`, `STATUS_COLORS`, and `normalizeStatus()` in a single atomic commit.

See `.planning/research/PITFALLS.md` for 13 pitfalls with phase-specific warnings and warning signs.

## Implications for Roadmap

Based on research, the build order is dictated by hard dependencies: tables before modals, modals before document pages. All 4 research files converge on the same 3-phase structure.

### Phase 1: Foundation — Database, Board Infrastructure, Transition Modal Scaffolding

**Rationale:** Everything depends on the 3 new tables existing. The `outsourced` column must be added atomically with all board constants (`ACTIVE_KEYS`, `COLUMNS`, `normalizeStatus`). Critical structural fixes (`_loading` guard, ESC handler generalisation, modal-scoped `calcId` variable) must land before any individual modals are built — retrofitting them across 6 modals is expensive. The two-step INSERT + PATCH save pattern must be proven once (via `modalAccept`) before being repeated.
**Delivers:** SQL migration deployed; `outsourced` column visible on board; `modalAccept` (scheduled → accepted) working end-to-end with acceptance_acts record written; board `_loading` guard in place; ESC handler refactored to use `modal-dialog` class query.
**Addresses (from FEATURES.md):** SQL migrations, acceptance act data capture, outsourcing status column.
**Avoids (from PITFALLS.md):** Pitfall 1 (state machine guard), Pitfall 2 (`_loading` race), Pitfall 5 (ACTIVE_KEYS miss), Pitfall 6 (normalizeStatus miss), Pitfall 7 (stale activeCalcId), Pitfall 9 (hidden input serialisation), Pitfall 13 (ESC handler).

### Phase 2: Pipeline Transitions — Remaining Modals and Payment Extension

**Rationale:** With the pattern established in Phase 1, the remaining modals are variations. The payment extension is the highest-risk individual item (Pitfall 3 — divergent final_price); it must be resolved in this phase with a clear data contract decided before any form JS is written.
**Delivers:** `modalOutsource` (in_progress → outsourced) + outsourcing return modal; `modalAssign` (accepted → in_progress, replacing navigate-away); `modalCancel` (any → cancelled with reason); extended `modalDeliver` with 5-method payment breakdown writing to `delivery_acts` and mirroring sum to `calculations.final_price`.
**Uses (from STACK.md):** JSONB payment_breakdown column, `lockButton()` for all save handlers, `type="number"` for НДС field.
**Avoids (from PITFALLS.md):** Pitfall 3 (payment data contract), Pitfall 8 (QueryBuilder.in() stub — fix or bypass before loading multi-calc data), Pitfall 11 (НДС NaN).

### Phase 3: Document Pages — Acceptance Act and Work Order

**Rationale:** Both document pages depend on data that only exists after Phase 1 and Phase 2 modals are operational. `acceptance-act.html` is simpler (one table); `work-order.html` aggregates 4 tables and must include outsource records in the print layout. Print CSS must be skeleton-first in every commit.
**Delivers:** `acceptance-act.html` — full document page with `@media print`, loads from `?calc_id`, print button; `work-order.html` — composite document aggregating calculations + work_assignments + delivery_acts + outsource_records, print layout with outsourcing section.
**Avoids (from PITFALLS.md):** Pitfall 4 (print layout built first), Pitfall 10 (outsource_records included in work-order query).

### Phase Ordering Rationale

- SQL migrations must be the first deliverable — all 6 modals and both document pages fail without the tables.
- Structural board fixes (`_loading`, ESC, modal-scoped calcId) must precede new modals — 6 modals added without these fixes multiply the bug surface.
- `modalAccept` establishes the two-step save pattern; building it first means the remaining 5 modals are lower-risk repetitions.
- Payment data contract must be locked in Phase 2 before delivery form JS is written — changing it post-implementation requires touching cashflow.html and income.html.
- Document pages are built last because they are read-only aggregators; they cannot be tested until the write-side (modals) is working.

### Research Flags

Phases with well-documented patterns (skip additional research):
- **Phase 1 (modals, migrations):** All patterns directly observed in codebase; no research needed — STACK.md and ARCHITECTURE.md have concrete code examples.
- **Phase 3 (print pages):** `@media print` + `window.print()` is standard CSS; browser compatibility for target devices (iOS Safari, Android Chrome) is well-understood.

Phases likely needing attention during planning (not full research, but careful design decisions):
- **Phase 2 (payment extension):** The data contract between `delivery_acts` and `calculations.final_price` needs an explicit decision before coding; the existing QueryBuilder.in() stub (Pitfall 8) needs resolution before multi-ID queries are used.
- **Phase 1 (state machine guard):** The allowed transition matrix should be documented as a const in board.html during planning — this is a design decision, not a research question, but it has downstream consequences for every modal.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations derived from direct codebase inspection; zero new libraries introduced; no web search needed |
| Features | HIGH | Table stakes and anti-features derived from PROJECT.md requirements and existing code; Russian legal document requirements (акт приёмки, заказ-наряд) are well-established domain knowledge |
| Architecture | HIGH | All patterns are copies or extensions of existing `board.html` code (lines 704–1410 inspected); component boundaries match existing file structure |
| Pitfalls | HIGH | All 13 pitfalls grounded in direct code evidence (line numbers cited); no speculative pitfalls; WebSearch unavailability had no impact |

**Overall confidence:** HIGH

### Gaps to Address

- **QueryBuilder.in() stub (Pitfall 8):** The `in()` method in `api.js` only applies the first value. This is a known bug that will silently cause partial data loads if any Phase 2 or Phase 3 code queries multiple `calculation_id`s. Decision needed during Phase 2 planning: fix the QueryBuilder method, or design queries to avoid multi-ID lookups (e.g., load per-calc on demand).
- **JSONB payment_breakdown query compatibility:** The JSONB column recommendation for `delivery_acts` is a design decision with MEDIUM confidence — it is idiomatic PostgreSQL but requires confirming the generic QueryBuilder can filter/select JSONB fields via the existing REST API. If not, individual typed columns may be needed. Validate with a migration test before building the delivery form.
- **`acceptance_acts` uniqueness constraint:** The state machine guard (Pitfall 1) partially relies on application-layer logic since the server does not expose transactions. Whether a UNIQUE constraint on `(calc_id)` is appropriate for `acceptance_acts` (one act per order) should be decided in Phase 1 migration design — a duplicate-prevention constraint is simpler than application-layer upsert logic.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `/board.html` — status constants, modal pattern, drag-drop routing, drawer actions, `COLUMNS`, `ACTIVE_KEYS`, `normalizeStatus`, `updateStatus`, `loadBoard`, `buildDrawerActions` (lines 704–1410)
- `/api.js` — QueryBuilder implementation including `in()` stub at line 67
- `/ui.js`, `/dom.js`, `/formatters.js`, `/errors.js`, `/studio-context.js` — available utility exports
- `/assign-work.html` — master assignment form pattern
- `/calculator-pdf.js` — jsPDF usage (contrasted with print-CSS approach for legal documents)
- `/.planning/PROJECT.md` — milestone requirements, constraints, anti-features, out-of-scope items
- `/.planning/codebase/STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md` — project constraint documentation

### Secondary (MEDIUM confidence)
- Russian auto service domain knowledge — legal requirements for акт приёмки and заказ-наряд are legally mandated documents in Russian auto service regulation; standard in the domain

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*

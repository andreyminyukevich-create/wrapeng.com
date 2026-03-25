# Roadmap: Keep1R CRM — Workshop Pipeline

**Project:** Keep1R CRM — Workshop Pipeline
**Milestone:** Workshop Pipeline v1
**Created:** 2026-03-25
**Granularity:** standard
**Requirements:** 19 v1 requirements

---

## Phases

- [ ] **Phase 1: Foundation** - Database migrations, board infrastructure fixes, and acceptance modal (proves the two-step save pattern)
- [ ] **Phase 2: Pipeline Transitions** - Remaining 5 transition modals completing the full status machine
- [ ] **Phase 3: Document Pages** - Full acceptance act and work order pages with print layouts and status history
- [ ] **Phase 4: Calculations Hub** - Separate calculations list page, "В воронку продаж"/"В воронку цеха" routing with data capture forms

---

## Phase Details

### Phase 1: Foundation
**Goal**: The database schema supports all new pipeline data and the board reliably handles the full status machine including the new outsourced column — with one working modal (acceptance) proving the two-step save pattern end-to-end.
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02, DB-03, DB-04, BOARD-01, BOARD-02, BOARD-03, BOARD-04, FORM-01
**Success Criteria** (what must be TRUE):
  1. A developer can apply the SQL migration and all three new tables (`acceptance_acts`, `outsource_records`, `delivery_acts`) plus status history tracking exist in the database with correct columns and constraints
  2. The board shows an "Аутсорсинг" (outsourced) column between "В работе" and "Готово" with cards visible and drag-and-drop routing working — outsourced cards do not vanish from the active board view
  3. Dragging or clicking a "scheduled" card to "accepted" opens the acceptance modal, the user fills in mileage, damage checkboxes, equipment checklist, and client-agreed checkbox, clicks Save, and the card moves to the accepted column with an `acceptance_acts` record written to the database
  4. Only permitted status transitions are reachable from the board — attempting an illegal transition (e.g. scheduled directly to done) is blocked client-side before any modal opens
  5. Rapidly saving a modal multiple times does not cause duplicate board reloads or double-submit race conditions (the `_loading` guard prevents concurrent `loadBoard()` calls)
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — SQL migration (4 tables) + outsourced column config + loadBoard guard
- [x] 01-02-PLAN.md — Transition guards + status history hook + acceptance modal
**UI hint**: yes

### Phase 2: Pipeline Transitions
**Goal**: Every status transition in the workshop pipeline has a corresponding modal form so that no transition happens without capturing the required data — contractor info, assignment, check results, payment breakdown, cancellation reason, and outsourcing return notes are all recorded in the database.
**Depends on**: Phase 1
**Requirements**: FORM-02, FORM-03, FORM-04, FORM-05, FORM-06
**Success Criteria** (what must be TRUE):
  1. An `in_progress` card can be sent to outsourcing via a modal that captures contractor name, work type, deadline, and outsource type (car leaves vs. contractor arrives), writing a record to `outsource_records` and moving the card to the outsourced column
  2. An outsourced card can be returned to `in_progress` via a return modal that records the return date and condition notes on the existing `outsource_records` row
  3. A `done` card can be delivered via the delivery modal with 5 payment method options (cash, card/transfer, bank transfer with manual VAT%, deferred/debt, mixed per-method amounts) — the total is written to `delivery_acts` and mirrored back to `calculations.final_price`
  4. Any card can be cancelled from any status using a cancel modal that requires selecting a reason category and optionally entering a comment — the card moves to the cancelled column
  5. The `in_progress` transition from accepted captures master assignment (who is doing the work) via a modal — the user does not have to navigate away to `assign-work.html` for the primary transition
**Plans**: 2 plans
Plans:
- [x] 02-01-PLAN.md — Outsource, return, and cancel modals + board.html rewiring
- [x] 02-02-PLAN.md — Done and delivery modal migration with 5-method payment + board.html cleanup
**UI hint**: yes

### Phase 3: Document Pages
**Goal**: Users can open a printable acceptance act or work order for any calculation directly from the board, see all captured data on a well-structured A4-ready page, and print it from the browser.
**Depends on**: Phase 2
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. Opening `acceptance-act.html?calc_id=X` loads and renders all acceptance act fields (mileage, damage description, equipment checklist, photo-done checkboxes, client agreed status, notes) for that calculation — the page content is visible without any stub or placeholder text
  2. Clicking Print on the acceptance act page produces a clean A4-formatted document in the browser print dialog: studio name in the header, all structured fields, a signature line — navigation and action buttons are hidden in the print view
  3. Opening `work-order.html?calc_id=X` renders a composite document aggregating services list, assigned executors, materials, payment breakdown (from delivery act), and outsourcing records if the car was outsourced during the job
  4. Clicking Print on the work order page produces a clean A4-formatted document with a structured table layout, studio name, and all job details — navigation is hidden in print view
  5. Both document pages show a chronological status history timeline at the bottom listing all transitions for the calculation (who changed what status, when, and any comment)
**Plans**: TBD
**UI hint**: yes

### Phase 4: Calculations Hub
**Goal**: Calculations exist as independent entities. Users see a list of recent calculations, and can route each one into the sales funnel (with client data) or workshop pipeline (with client + vehicle data) via dedicated forms.
**Depends on**: Phase 1
**Requirements**: TBD
**Success Criteria** (what must be TRUE):
  1. "Расчёты" nav button opens a list page showing the last ~30 saved calculations (not the calculator form)
  2. "Новый расчёт" opens the calculator form for a fresh calculation
  3. Each calculation card has "В воронку продаж" button — opens a form requiring client info (phone, name, source, etc.) before creating a lead
  4. Each calculation card has "В воронку цеха" button — opens a form requiring client info + vehicle details (VIN, plate number, etc.) before creating a workshop order
  5. Calculations auto-save on any change, even without being routed to a funnel
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-03-25 |
| 2. Pipeline Transitions | 1/2 | In Progress|  |
| 3. Document Pages | 0/? | Not started | - |
| 4. Calculations Hub | 0/? | Not started | - |

---

*Roadmap created: 2026-03-25*
*Last updated: 2026-03-25 after Phase 2 planning*

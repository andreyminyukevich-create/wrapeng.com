---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-25T16:17:14.001Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 6
  completed_plans: 6
---

# Project State: Keep1R CRM — Workshop Pipeline

## Project Reference

**Core Value:** Every status transition captures structured data — nothing lost, accountability fixed, documents generated.
**Current Focus:** Phase 03 — document-pages

---

## Current Position

Phase: 4
Plan: Not started

### Progress Bar

```
Phase 1: Foundation          [ ] Not started
Phase 2: Pipeline Transitions [ ] Not started
Phase 3: Document Pages      [ ] Not started

Overall: 0/3 phases complete
```

---

## Performance Metrics

**Plans completed:** 0
**Plans total:** TBD (phases not yet planned)
**Requirements mapped:** 19/19
**Requirements completed:** 0/19

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale | Phase |
|----------|-----------|-------|
| 3-phase structure (Foundation → Transitions → Documents) | Hard dependency chain: tables before modals, modals before document pages | Roadmap |
| Acceptance modal (FORM-01) in Phase 1 rather than Phase 2 | Proves the two-step INSERT+PATCH pattern before building 5 more modals | Roadmap |
| All transition forms stay as modals in board.html | Preserves board context; consistent with existing modalDone/modalDeliver pattern | Research |
| `pipeline-forms.js` module for modal logic | board.html already 1400+ lines; follows booking-popup.js precedent | Research |
| JSONB for payment_breakdown in delivery_acts | Avoids 5 nullable columns; already used for calculation_data | Research |
| Browser print (@media print) not server-side PDF | Zero new dependencies; covers 95% of studio need for legal documents | Research |
| outsourced->in_progress drag: check _dragStatus before generic in_progress redirect | Prevents assign-work.html routing when returning from outsource | 02 |
| saveCancel uses _historyComment (no sub-table) | cancel reason stored in status_history.comment, simpler than cancellations table | 02 |
| Phase 02-pipeline-transitions P01 metrics: 15 min, 2 tasks, 2 files | — | 02 |
| status='done' (not 'waiting') for done transition | Fixes pre-existing bug; normalizeStatus maps waiting->done for backward compat | 02 |
| JSONB payment_breakdown for delivery_acts single-method | Stored as {method: total}, mixed stores all 4 sub-amounts — consistent JSONB shape | 02 |
| Phase 03-document-pages P01 | 2 | 1 tasks | 1 files |
| Phase 03-document-pages P02 | 8 | 1 tasks | 1 files |
| JSONB shape parsed via layered approach (array, .services[], Object.entries) for work-order.html | Robust against unknown API schema shapes | 03 |
| Print header + signature line hidden on screen (display:none), shown via @media print | Zero screen layout impact, clean A4 output | 03 |

### Critical Pitfalls to Avoid

1. **Two-step save race** — sub-table INSERT must succeed before status PATCH; if PATCH fails, user can retry without duplicate (check for existing record or use upsert)
2. **`calculations.final_price` divergence** — delivery modal must mirror `delivery_acts.total_amount` back to `calculations.final_price` in the same handler
3. **`_loading` guard** — add to `loadBoard()` before any new modals are wired up (BOARD-03 in Phase 1)
4. **`outsourced` in ACTIVE_KEYS** — must be added atomically with COLUMNS, STATUS_COLORS, and normalizeStatus() in a single commit
5. **Print CSS skeleton first** — add @media print skeleton in the first commit of each document page, not as a finishing step
6. **QueryBuilder.in() stub** — the `in()` method only applies the first value; design Phase 3 queries to avoid multi-ID lookups or fix the method

### Open Questions

- Should `acceptance_acts` have a UNIQUE constraint on `(calc_id)`? A duplicate-prevention constraint is simpler than application-layer upsert logic. Decide during Phase 1 migration design.
- Does the generic QueryBuilder support JSONB field filtering/selection? Validate with a migration test before building the delivery form in Phase 2.
- Data contract: where is `cancellation_reason` stored? In a `cancellations` sub-table or as a field on `calculations`? Decide before building FORM-05 in Phase 2.

### Technical Context

- Stack: Vanilla HTML/JS (no frameworks), REST API port 3001, PostgreSQL
- API: `sb.from('table').select/insert/update/delete` via QueryBuilder in api.js
- All pages use `studio-context.js` to get `studio_id` via `/api/studio-members/me`
- board.html already has 6 statuses: scheduled, accepted, in_progress, done, delivered, cancelled
- acceptance-act.html and work-order.html exist as stubs (copies of dashboard.html)
- Server code is not in this repo — only SQL migrations and frontend

---

## Session Continuity

**Last action:** Completed 03-document-pages 03-02-PLAN.md (2026-03-25)
**Next action:** Phase 03 complete — all document pages implemented

### To resume:

1. Check this file for current phase and plan
2. Check ROADMAP.md for phase structure and success criteria
3. Check REQUIREMENTS.md traceability for what is mapped and what is complete
4. Check the active plan file if one exists

---

*State initialized: 2026-03-25*
*Last updated: 2026-03-25 after 03-02-PLAN.md execution*

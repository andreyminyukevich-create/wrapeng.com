---
phase: 02-pipeline-transitions
plan: 01
subsystem: pipeline-forms
tags: [modals, outsourcing, cancellation, board, pipeline]
dependency_graph:
  requires: [01-01 (acceptance_acts table), 01-03 (outsource_records table), pipeline-forms.js base IIFE]
  provides: [openModalOutsource, openModalReturn, openModalCancel, board.html rewired transitions]
  affects: [board.html onDrop, board.html drawer buttons, pipeline-forms.js public API]
tech_stack:
  added: []
  patterns: [Two-step INSERT+PATCH for outsource, UPDATE with .is() null filter for return, _historyComment for cancel audit trail]
key_files:
  created: []
  modified:
    - pipeline-forms.js
    - board.html
decisions:
  - "outsourced→in_progress drag guard checks _dragStatus before generic in_progress redirect to avoid routing to assign-work.html"
  - "saveCancel uses _historyComment in updateStatus (no sub-table) — cancel reason stored in status_history.comment"
  - "saveReturn uses .is('returned_at', null) to target only the active outsource record, preventing stale record updates"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 02 Plan 01: Pipeline Transitions — Outsource, Return, Cancel Modals — Summary

**One-liner:** Three new pipeline modals (outsource, return-from-outsource, cancel) added to pipeline-forms.js with board.html fully rewired to route all transitions through modal forms instead of direct status changes or native dialogs.

## What Was Built

Extended `pipeline-forms.js` IIFE with three new modal flows following the established acceptance modal pattern:

- **openModalOutsource** (FORM-02): Captures contractor name, work type, deadline, outsource type (car_leaves / contractor_arrives), and notes. Two-step: INSERT into `outsource_records` → PATCH status to `outsourced`.
- **openModalReturn** (FORM-06): Captures return date (pre-filled to today) and condition notes. UPDATE `outsource_records` with `.is('returned_at', null)` guard → PATCH status to `in_progress`.
- **openModalCancel** (FORM-05): Captures reason from 4-option select (no_show, refused, scheduling, other) and optional comment. Passes `[reason] comment` as `_historyComment` to `updateStatus` for audit trail in status_history.

Rewired `board.html`:
- `onDrop`: Added outsource, return (with `_dragStatus === 'outsourced'` guard before generic in_progress), and cancel modal triggers. Guard ordering is critical.
- Drawer `in_progress`: `Na autsorsing` button now calls `openModalOutsource` instead of `move()`.
- Drawer `outsourced`: `Vernut' v rabotu` button now calls `openModalReturn` instead of `move()`.
- `doCancel`: Replaced async `confirmAction` + `updateStatus` chain with synchronous `openModalCancel` call.
- ESC handler: Expanded modal ID array to include `modalOutsource`, `modalReturn`, `modalCancel`.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add outsource, return, cancel modals to pipeline-forms.js | 0260f5a | pipeline-forms.js |
| 2 | Rewire board.html drawer buttons and onDrop | a45eaf5 | board.html |

## Verification Results

1. `grep -c 'PipelineForms.openModal' board.html` → 8 (exceeds required 6) — PASS
2. `window.PipelineForms` exports all 4 functions — PASS
3. `move('outsourced'` in board.html → 0 occurrences — PASS
4. `confirmAction.*Отменить` in board.html → 0 occurrences — PASS
5. ESC handler includes modalOutsource, modalReturn, modalCancel — PASS

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all modals are fully wired to their respective API calls and status updates.

## Self-Check: PASSED

- pipeline-forms.js modified: FOUND
- board.html modified: FOUND
- Commit 0260f5a exists: FOUND
- Commit a45eaf5 exists: FOUND

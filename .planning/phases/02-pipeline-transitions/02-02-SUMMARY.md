---
phase: 02-pipeline-transitions
plan: 02
subsystem: board/pipeline-forms
tags: [modal, done, delivery, payment, materials, migration]
dependency_graph:
  requires: [02-01]
  provides: [FORM-03, FORM-04]
  affects: [board.html, pipeline-forms.js]
tech_stack:
  added: []
  patterns: [IIFE modal injection, JSONB payment_breakdown, button-lock guard, two-step save INSERT+PATCH]
key_files:
  created: []
  modified:
    - pipeline-forms.js
    - board.html
decisions:
  - status='done' (not 'waiting') for done transition — fixes pre-existing bug in board.html
  - normalizeStatus maps 'waiting'→'done' for backward compatibility with old DB records
  - _fmt() local copy avoids dependency on board.html module-scoped fmt()
  - JSONB payment_breakdown stores mixed-method splits; single-method also stored as {method: total}
  - delivery_acts INSERT must succeed before updateStatus PATCH — error aborts with toast
metrics:
  duration_minutes: 25
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 02: Done and Delivery Modals Summary

**One-liner:** Done modal with checker/remarks fields + delivery modal with 5 payment methods (incl. mixed JSONB breakdown and VAT%) migrated from board.html into pipeline-forms.js.

## What Was Built

### Task 1 — pipeline-forms.js: Done and Delivery Modals

Added two full-featured modals to the pipeline-forms.js IIFE, completing the FORM-03 and FORM-04 requirements:

**FORM-03 (Done/Check Modal):**
- `_fmt()` local formatting utility (mirrors board.html's `fmt()` — avoids module scope dependency)
- `extractMaterials(calcData)` — migrated from board.html; extracts plan material costs from calculation_data JSONB
- `loadDoneMaterials(calcId)` — migrated from board.html; fetches calculation_data + fact_materials, renders editable fact inputs with plan totals
- `updateDoneTotals()` — migrated from board.html; live delta calculation (surplus/savings display)
- New fields in DONE_HTML: `doneCheckedBy` (who verified), `doneRemarks` (defects), `doneNotes` (extra notes)
- `saveDone()` uses `window._updateStatus(_doneCalcId, 'done', extra)` — CRITICAL fix: 'done' not 'waiting'
- History comment built from checker name, remarks, notes before calling updateStatus

**FORM-04 (Delivery Modal):**
- `PAYMENT_METHODS` constant with 5 entries: cash, card, transfer, deferred, mixed
- `DELIVER_HTML` with dynamic payment select, conditional VAT% block (transfer only), mixed breakdown block (4 sub-inputs)
- `updateMixedTotal()` — live sum of mixed payment inputs
- `injectDeliver()` — populates select from PAYMENT_METHODS, binds change handler for VAT/mixed visibility
- `gatherDeliverForm()` — collects method, totalAmount, vatPercent, paymentBreakdown JSONB, deliveredBy, notes
- `saveDeliver()` — two-step: INSERT delivery_acts first, then `_updateStatus('delivered', { final_price: payload.total_amount })`
- `window.PipelineForms` updated to export all 6 functions including `openModalDone` and `openModalDeliver`

### Task 2 — board.html: Legacy Cleanup

Removed all legacy done/deliver code from board.html:
- Removed `<div class="modal" id="modalDone">` HTML block
- Removed `<div class="modal" id="modalDeliver">` HTML block
- Removed `function openModalDone`, `extractMaterials`, `loadDoneMaterials`, `updateDoneTotals`, `openModalDeliver`
- Removed `let _donePlanItems = []` state variable
- Removed `btnDoneSave` and `btnDeliverSave` event bindings from `bindEvents()`
- Removed dead `} else if (status === 'waiting') {` drawer section
- Added `if (status === 'waiting') return 'done';` to `normalizeStatus()` for backward compatibility
- Rewired `doDone` and `doDeliver` in drawer handlers to `PipelineForms.openModalDone/openModalDeliver`
- Rewired `onDrop` done/delivered transitions to `PipelineForms.openModalDone/openModalDeliver`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both modals fully wired with real data sources and API persistence.

## Self-Check: PASSED

- pipeline-forms.js exists and contains all 6 exported functions: CONFIRMED
- board.html contains no legacy modal HTML or functions: CONFIRMED
- Commits d7be61d (pipeline-forms.js) and 14fb9b7 (board.html): CONFIRMED
- `window.PipelineForms` exports openModalDone and openModalDeliver: CONFIRMED
- `delivery_acts` insert and `final_price` mirror in saveDeliver: CONFIRMED
- `normalizeStatus('waiting') === 'done'` mapping: CONFIRMED

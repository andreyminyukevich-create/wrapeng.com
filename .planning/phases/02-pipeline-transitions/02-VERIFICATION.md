---
phase: 02-pipeline-transitions
verified: 2026-03-25T12:00:00Z
status: gaps_found
score: 4/5 success criteria verified
gaps:
  - truth: "The in_progress transition from accepted captures master assignment via a modal — the user does not have to navigate away to assign-work.html for the primary transition"
    status: failed
    reason: "No assignment modal exists in pipeline-forms.js. The onDrop handler for toStatus === 'in_progress' (non-outsourced) still redirects to window.location.href = 'assign-work.html?calc_id=...'. The drawer 'Взять в работу' button also redirects to assign-work.html. No openModalAssign function was created in either plan."
    artifacts:
      - path: "pipeline-forms.js"
        issue: "No openModalAssign or assignment modal HTML — function is completely absent"
      - path: "board.html"
        issue: "Line 719: window.location.href = assign-work.html still used for generic in_progress drag. Line 1176: drawer 'Взять в работу' button also redirects to assign-work.html."
    missing:
      - "openModalAssign(calcId, carName) function in pipeline-forms.js"
      - "Assignment modal HTML template with at minimum a 'responsible person' name field"
      - "onDrop in_progress branch (non-outsourced) rewired to PipelineForms.openModalAssign"
      - "Drawer 'Взять в работу' button rewired to PipelineForms.openModalAssign"
      - "window.PipelineForms export extended to include openModalAssign"
human_verification:
  - test: "Open board.html in browser, drag an accepted card to in_progress column"
    expected: "A modal opens capturing the responsible master's name before the card moves"
    why_human: "Current code redirects to assign-work.html — confirms the gap is user-visible but exact UX impact cannot be automated-tested"
  - test: "Drag an in_progress card to the outsourced column, fill in the outsource modal, save"
    expected: "Card moves to outsourced column, outsource_records row exists in DB with contractor details"
    why_human: "Requires live Supabase connection to verify DB write"
  - test: "Drag an outsourced card back to in_progress, fill in return modal, save"
    expected: "Card moves to in_progress, outsource_records row updated with returned_at date and return_notes"
    why_human: "Requires live Supabase connection to verify DB UPDATE with .is('returned_at', null) guard"
  - test: "Open delivery modal, select 'Смешанная оплата', enter amounts in each sub-field"
    expected: "Mixed total auto-updates live. Selecting 'Безналичный р/с' shows the VAT% input. Other methods hide both blocks."
    why_human: "Dynamic UI interaction cannot be verified statically"
---

# Phase 2: Pipeline Transitions — Verification Report

**Phase Goal:** Every status transition in the workshop pipeline has a corresponding modal form so that no transition happens without capturing the required data — contractor info, assignment, check results, payment breakdown, cancellation reason, and outsourcing return notes are all recorded in the database.

**Verified:** 2026-03-25
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An in_progress card can be sent to outsourcing via a modal capturing contractor name, work type, deadline, and outsource type — writes to outsource_records, moves card to outsourced column | VERIFIED | `openModalOutsource` exists at line 261 of pipeline-forms.js; INSERT into `outsource_records` at line 286; two-step PATCH to 'outsourced' at line 300; board.html onDrop line 722 routes `toStatus === 'outsourced'` to the modal |
| 2 | An outsourced card can be returned to in_progress via a return modal recording return date and condition notes on the existing outsource_records row | VERIFIED | `openModalReturn` at line 352; UPDATE `outsource_records` with `.is('returned_at', null)` guard at lines 374-379; board.html onDrop line 714 checks `_dragStatus === 'outsourced'` before the generic in_progress branch, routing to the return modal |
| 3 | A done card can be delivered via delivery modal with 5 payment methods — writes to delivery_acts and mirrors total to calculations.final_price | VERIFIED | `PAYMENT_METHODS` array at line 728 has all 5 entries (cash, card, transfer, deferred, mixed); `saveDeliver` at line 885 inserts into `delivery_acts` at line 896; mirrors `final_price: payload.total_amount` at line 910; `deliverVatBlock` and `deliverMixedBlock` conditional UI exists |
| 4 | Any card can be cancelled from any status using a cancel modal requiring a reason category and optional comment | VERIFIED | `openModalCancel` at line 458; `CANCEL_REASONS` array at line 404 with 4 entries (no_show, refused, scheduling, other); `saveCancel` at line 469 validates reason required, builds `[reason] comment` string, passes as `_historyComment` to `_updateStatus`; `doCancel` in board.html (line 1135) calls `PipelineForms.openModalCancel` |
| 5 | The in_progress transition from accepted captures master assignment via a modal — user does not navigate away to assign-work.html for the primary transition | FAILED | No `openModalAssign` exists in pipeline-forms.js (0 lines match). board.html onDrop line 719: `window.location.href = assign-work.html?calc_id=...` for generic in_progress. Drawer 'Взять в работу' button (line 1176) also redirects to assign-work.html. The assignment transition is a page redirect, not a modal. |

**Score: 4/5 truths verified**

---

### Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `pipeline-forms.js` | Outsource, return, cancel modals (openModalOutsource, openModalReturn, openModalCancel) | Yes (924 lines) | Yes — all 3 functions present with full HTML templates, gather/inject/open/save functions | Yes — window.PipelineForms at line 923 exports all; board.html loads file at line 444 | VERIFIED |
| `pipeline-forms.js` | Done and delivery modals (openModalDone, openModalDeliver) | Yes | Yes — openModalDone at line 669, openModalDeliver at line 865; extractMaterials, loadDoneMaterials, updateDoneTotals all migrated | Yes — exported in window.PipelineForms; board.html doDone/doDeliver/onDrop all route through PipelineForms | VERIFIED |
| `board.html` | Drawer rewiring and onDrop updates | Yes (1319 lines) | Yes — 12 PipelineForms.openModal references confirmed | Yes — pipeline-forms.js loaded via script tag at line 444; window globals exposed at lines 1294-1299 | VERIFIED |
| `pipeline-forms.js` | Assignment modal (openModalAssign) | No | Absent — function does not exist | N/A — not exported, not referenced | MISSING |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| pipeline-forms.js | board.html | window.PipelineForms API | WIRED | Line 923: `window.PipelineForms = { openModalAccept, openModalOutsource, openModalReturn, openModalCancel, openModalDone, openModalDeliver }` — 6 functions exported |
| pipeline-forms.js | outsource_records | window._sb.from('outsource_records') | WIRED | Line 286: INSERT on save outsource; Lines 374-379: UPDATE with .is('returned_at', null) on save return |
| board.html onDrop | pipeline-forms.js | PipelineForms.openModalOutsource/Return/Cancel | WIRED | Lines 714-735: all 6 modal-requiring transitions route through PipelineForms; outsourced return guard at line 714 precedes generic in_progress at line 718 |
| pipeline-forms.js saveDeliver | delivery_acts table | sb.from('delivery_acts').insert | WIRED | Line 896: `window._sb.from('delivery_acts').insert({...payload})` |
| pipeline-forms.js saveDeliver | calculations.final_price | updateStatus extra parameter | WIRED | Line 910: `_updateStatus(_deliverCalcId, 'delivered', { final_price: payload.total_amount, delivery_note: payload.notes })` |
| pipeline-forms.js openModalDone | window._updateStatus | updateStatus call with status 'done' | WIRED | Line 712: `window._updateStatus(_doneCalcId, 'done', extra)` — confirmed 'done' not 'waiting' |
| board.html (assignment) | pipeline-forms.js openModalAssign | PipelineForms.openModalAssign | NOT WIRED | onDrop line 719 redirects to assign-work.html; no openModalAssign exists |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| pipeline-forms.js loadDoneMaterials | _donePlanItems, fact_materials | window._sb.from('calculations').select('calculation_data, fact_materials').eq('id', calcId).single() at line 608 | Yes — queries real DB row | FLOWING |
| pipeline-forms.js saveOutsource | contractor_name, work_type, etc. | gatherOutsourceForm() collects from DOM inputs | Yes — user-entered, inserted to outsource_records | FLOWING |
| pipeline-forms.js saveDeliver | payment_breakdown, total_amount | gatherDeliverForm() collects from DOM inputs | Yes — JSONB built from actual user input, inserted to delivery_acts | FLOWING |
| pipeline-forms.js saveCancel | _historyComment | cancelReason + cancelComment DOM values | Yes — passed to updateStatus as _historyComment for status_history.comment | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for API/DB operations (requires live Supabase connection). Client-side structure verified statically.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pipeline-forms.js exports 6 modal functions | grep 'window.PipelineForms' pipeline-forms.js | All 6 functions in export | PASS |
| board.html has no legacy openModalDone/Deliver functions | grep 'function openModalDone\|function openModalDeliver' board.html | No output | PASS |
| board.html legacy modalDone/Deliver HTML removed | grep 'id="modalDone"\|id="modalDeliver"' board.html | No output | PASS |
| Old direct move('outsourced') removed | grep "move\('outsourced'" board.html | No output | PASS |
| Old confirmAction for cancel removed | grep 'confirmAction.*Отменить' board.html | No output (remaining confirmAction is doRestore, not doCancel) | PASS |
| ESC handler covers all 6 modals | grep 'modalOutsource.*modalReturn.*modalCancel' board.html | Line 1273 confirmed | PASS |
| normalizeStatus maps waiting to done | grep "waiting.*return.*done\|if.*waiting.*done" board.html | Line 527: if (status === 'waiting') return 'done' | PASS |
| Assignment modal in pipeline-forms.js | grep 'openModalAssign' pipeline-forms.js | No output | FAIL |
| onDrop in_progress routes to modal not redirect | grep "openModalAssign.*_dragCalcId" board.html | No output — still redirects to assign-work.html (line 719) | FAIL |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| FORM-02 | 02-01-PLAN.md | Outsourcing modal (in_progress→outsourced) — contractor name, work type, deadline, outsource type, notes | SATISFIED | openModalOutsource fully implemented; two-step INSERT outsource_records + PATCH status |
| FORM-03 | 02-02-PLAN.md | Check/done modal — checked by name, remarks/defects, notes | SATISFIED | openModalDone with doneCheckedBy, doneRemarks, doneNotes fields; transitions to 'done' not 'waiting' |
| FORM-04 | 02-02-PLAN.md | Delivery modal — 5 payment methods, total amount, delivery notes | SATISFIED | PAYMENT_METHODS array has 5 entries; dynamic VAT/mixed UI; INSERT delivery_acts; mirror to final_price |
| FORM-05 | 02-01-PLAN.md | Cancel modal (any→cancelled) — reason category + comment | SATISFIED | openModalCancel with CANCEL_REASONS (4 options); reason validation; _historyComment built |
| FORM-06 | 02-01-PLAN.md | Return from outsourcing modal — return date, condition notes | SATISFIED | openModalReturn with returnDate pre-filled to today; UPDATE outsource_records with .is('returned_at', null) |

**All 5 claimed requirement IDs (FORM-02 through FORM-06) are satisfied.**

**Gap with ROADMAP Success Criterion 5:** SC5 requires a modal for the `in_progress` assignment transition. This was not mapped to any requirement ID in REQUIREMENTS.md and was not claimed by either plan. The plans only claimed FORM-02 through FORM-06. The research document (02-RESEARCH.md line 31) mentioned creating an assignment modal for "FORM-05 (accepted -> in_progress)" but this conflated two different things — FORM-05 in the requirements is the cancel modal, not an assignment modal. No requirement ID covers the assignment modal. This is a gap in ROADMAP success criterion coverage, not a requirement regression.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| board.html | 719 | `window.location.href = 'assign-work.html?calc_id=...'` in onDrop for in_progress | Warning | Drag-to-in_progress navigates away instead of opening a modal; contradicts ROADMAP SC5 |
| board.html | 1176 | Drawer 'Взять в работу' button redirects to assign-work.html | Warning | Consistent with onDrop behavior but contradicts SC5 |

No placeholder implementations, TODO comments in production paths, empty handlers, or stub returns were found in pipeline-forms.js or board.html.

---

### Human Verification Required

#### 1. Outsource flow end-to-end

**Test:** Drag an `in_progress` card to the Аутсорсинг column.
**Expected:** Modal opens. Fill in contractor, work type, deadline, type. Click Отправить. Card moves to outsourced column. Verify in Supabase that `outsource_records` has a new row with the entered data.
**Why human:** Requires live Supabase DB connection and browser interaction.

#### 2. Return from outsource flow

**Test:** Drag an `outsourced` card to the В работе column.
**Expected:** Return modal opens (not the assignment redirect). Fill in return date and notes. Click Вернуть в работу. Card moves to in_progress. Verify in Supabase that the corresponding `outsource_records` row has `returned_at` and `return_notes` updated, and no new row was created.
**Why human:** Requires live Supabase DB connection; also confirms the `.is('returned_at', null)` guard works correctly.

#### 3. Delivery with mixed payment

**Test:** Drag a `done` card to the Выдано column (or use drawer). Select "Смешанная оплата". Enter amounts in Наличные, Карта, Безналичный р/с, Долг fields.
**Expected:** "Итого: X ₽" updates live as amounts are entered. Click Выдать. Verify `delivery_acts` has a row with `payment_breakdown` JSONB containing the per-method breakdown, and `calculations.final_price` is updated.
**Why human:** Dynamic UI interaction + Supabase write verification.

#### 4. Cancel reason enforcement

**Test:** Click "Отменить заказ" on any card. Click Отменить заказ button without selecting a reason.
**Expected:** Warning toast "Выберите причину отмены" appears. Card does not move. Select a reason and save — card moves to Отказ column.
**Why human:** Toast behavior and form validation flow require browser interaction.

---

### Gaps Summary

One gap blocks complete goal achievement: **Success Criterion 5 is unmet**. The ROADMAP states the `in_progress` transition should open a modal capturing master assignment so the user does not navigate away to `assign-work.html`. In the current codebase, dragging a card from `accepted` to `in_progress` (or clicking "Взять в работу" in the drawer) redirects to `assign-work.html` — no modal intercepts this transition.

This gap was not covered by any PLAN requirement (FORM-02 through FORM-06 map to outsource, done, delivery, cancel, and return — not assignment). However, it is explicitly stated in the ROADMAP success criteria for Phase 2. A corrective plan must add `openModalAssign` to pipeline-forms.js and rewire the `in_progress` transition in both `onDrop` and the drawer.

All 5 claimed requirement IDs (FORM-02, FORM-03, FORM-04, FORM-05, FORM-06) are fully satisfied by the implementation. The remaining gap is a missing deliverable relative to ROADMAP SC5, not a regression in what was planned.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_

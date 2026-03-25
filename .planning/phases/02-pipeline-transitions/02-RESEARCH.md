# Phase 2: Pipeline Transitions - Research

**Researched:** 2026-03-25
**Domain:** Vanilla JS modal forms for Kanban board status transitions
**Confidence:** HIGH (all findings verified from direct source code inspection of Phase 1 deliverables)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FORM-02 | Outsourcing modal (in_progress -> outsourced) -- contractor name, work type, deadline, outsource type, notes | `outsource_records` table exists with all columns; two-step INSERT+PATCH pattern proven in Phase 1; drawer already has "На аутсорсинг" button at line 1232 that does a direct `move()` -- replace with modal |
| FORM-03 | Check/done modal (in_progress/outsourced -> done) -- checked by name, remarks, notes | Existing `modalDone` at line 443 transitions to `waiting` status (not `done`). This modal needs to be **replaced or extended** to capture check data and write to the DB. Current modalDone only captures fact_materials. Target status should be `done` per ALLOWED_TRANSITIONS matrix. |
| FORM-04 | Delivery modal (done -> delivered) -- 5 payment methods with breakdown, total, VAT, notes | Existing `modalDeliver` at line 474 is minimal (price + payment select + note). Must be **replaced** with full 5-method payment form. `delivery_acts` table ready with `payment_breakdown` JSONB and `total_amount`. Must mirror to `calculations.final_price`. |
| FORM-05 | Cancel modal (any -> cancelled) -- reason category + comment | Currently drawer's `doCancel` at line 1182 uses native `confirmAction()` with no data capture. Must replace with modal capturing reason + comment. `status_history.comment` can store the reason, OR a new `cancellation_reason` field on calculations. See Open Question 1. |
| FORM-06 | Return from outsourcing modal (outsourced -> in_progress) -- return date, condition notes | `outsource_records` table has `returned_at` and `return_notes` columns. Must UPDATE existing record, not INSERT new one. Drawer at line 1239 has "Вернуть в работу" button doing direct `move()` -- replace with modal. |
</phase_requirements>

---

## Summary

Phase 2 builds 5 modal forms in `pipeline-forms.js`, extending the IIFE module created in Phase 1. All database tables already exist from Phase 1's SQL migration. The primary work is: (1) HTML templates for each modal, (2) gather/save functions following the established two-step INSERT+PATCH pattern, (3) rewiring board.html's drawer buttons and onDrop handler to open the new modals instead of doing direct `move()` calls or `confirmAction()`.

Three of the five modals are new (outsource, cancel, return-from-outsource). Two modals **replace existing board.html modals** that are too simple for the requirements: `modalDone` (currently only captures fact_materials, transitions to `waiting` instead of `done`) and `modalDeliver` (currently has 3 payment options, needs 5 with per-method breakdown). The planner must decide whether to modify the existing modals in-place in board.html or migrate them into `pipeline-forms.js` for consistency. Recommendation: migrate both into `pipeline-forms.js` to keep all pipeline modal logic in one module.

A critical discovery: the current `modalDone` save handler (line 1433) transitions to status `waiting`, not `done`. However, `waiting` is NOT in the `ALLOWED_TRANSITIONS` matrix, is NOT in the `COLUMNS` array, and has no column on the board. Cards that reach `waiting` status effectively vanish from the board columns. The Phase 2 plan must resolve this: either add `waiting` as a legitimate status (between `done` and `delivered`), or change the done modal to transition directly to `done` and remove `waiting` references. Per the ALLOWED_TRANSITIONS matrix, `done -> delivered` is the correct flow, meaning `waiting` was likely a legacy intermediate state that should be replaced by `done`.

**Primary recommendation:** Add all 5 modals to `pipeline-forms.js`. Migrate existing `modalDone` and `modalDeliver` HTML + logic from board.html into pipeline-forms.js. For FORM-05 (accepted -> in_progress), create a simple master assignment modal that captures only the responsible person's name -- the full assign-work.html page remains available via drawer button for detailed per-service executor assignment.

---

## Standard Stack

### Core (same as Phase 1 -- no new dependencies)
| Component | Location | Purpose |
|-----------|----------|---------|
| `pipeline-forms.js` | Root, loaded before module script | All modal HTML templates, open/save functions (IIFE) |
| `api.js` -- `QueryBuilder` | `sb.from().insert/update/eq/single` | All DB operations |
| `ui.js` -- `showToast`, `lockButton` | Module export | User feedback, button disable during async |
| Window globals | `_sb`, `_boardCtx`, `_updateStatus`, `_loadBoard`, `_showToast`, `_closeModal` | Cross-scope bridge from board.html module to pipeline-forms.js IIFE |
| `.modal` CSS classes | board.html lines 350-387 | Modal overlay, content panel, form-group, modal-footer |

### No New Dependencies
Phase 2 adds zero new files or libraries. All work extends `pipeline-forms.js` and modifies `board.html`.

---

## Architecture Patterns

### Pattern 1: Extending pipeline-forms.js IIFE

**What:** Each new modal follows the same structure as `openModalAccept`: inject HTML on first call, bind events, expose via `window.PipelineForms`.

**Established API surface (from Phase 1):**
```javascript
window.PipelineForms = { openModalAccept };
```

**Phase 2 extended API:**
```javascript
window.PipelineForms = {
  openModalAccept,       // Phase 1 (existing)
  openModalOutsource,    // FORM-02
  openModalDone,         // FORM-03 (replaces board.html openModalDone)
  openModalDeliver,      // FORM-04 (replaces board.html openModalDeliver)
  openModalCancel,       // FORM-05
  openModalReturn,       // FORM-06
  openModalAssign,       // FORM-05 (accepted -> in_progress master assignment)
};
```

**Template for each modal:**
```javascript
let _outsourceCalcId = null;

const OUTSOURCE_HTML = `
<div class="modal" id="modalOutsource">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">На аутсорсинг</div>
    <div class="modal-car" id="outsourceCarName"></div>
    <!-- form fields -->
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnOutsourceCancel">Отмена</button>
      <button class="btn btn-primary" id="btnOutsourceSave">Отправить</button>
    </div>
  </div>
</div>
`;

function injectOutsource() {
  if (document.getElementById('modalOutsource')) return;
  document.body.insertAdjacentHTML('beforeend', OUTSOURCE_HTML);
  document.getElementById('btnOutsourceCancel').addEventListener('click', () => {
    window._closeModal('modalOutsource');
  });
  document.getElementById('btnOutsourceSave').addEventListener('click', saveOutsource);
  document.getElementById('modalOutsource').addEventListener('click', e => {
    if (e.target.id === 'modalOutsource') window._closeModal('modalOutsource');
  });
}

function openModalOutsource(calcId, carName) {
  injectOutsource();
  _outsourceCalcId = calcId;
  document.getElementById('outsourceCarName').textContent = carName;
  // reset form fields...
  document.getElementById('modalOutsource').classList.add('active');
}
```

### Pattern 2: Two-Step Save (INSERT sub-table then PATCH status)

**Proven in Phase 1 acceptance modal.** Same pattern for outsource and delivery modals.

```javascript
async function saveOutsource() {
  const sb = window._sb;
  const ctx = window._boardCtx;
  const btn = document.getElementById('btnOutsourceSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';
  try {
    const payload = gatherOutsourceForm();
    // Step 1: INSERT outsource_records
    const { error: insertErr } = await sb
      .from('outsource_records')
      .insert({ calc_id: _outsourceCalcId, studio_id: ctx.studioId, ...payload });
    if (insertErr) {
      console.error('[pipeline] outsource insert:', insertErr);
      window._showToast('error', 'Ошибка сохранения');
      return;
    }
    // Step 2: PATCH status
    const ok = await window._updateStatus(_outsourceCalcId, 'outsourced');
    if (ok) {
      window._closeModal('modalOutsource');
      window._showToast('success', 'Отправлено на аутсорсинг');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}
```

### Pattern 3: UPDATE Existing Record (return from outsource)

**Different from other modals:** FORM-06 must UPDATE an existing `outsource_records` row, not INSERT a new one. The most recent record for the calc_id should be updated with `returned_at` and `return_notes`.

```javascript
async function saveReturn() {
  const sb = window._sb;
  const ctx = window._boardCtx;
  // ... button lock ...
  try {
    const returnDate = document.getElementById('returnDate').value || new Date().toISOString();
    const returnNotes = document.getElementById('returnNotes').value.trim() || null;

    // UPDATE the most recent outsource_records row for this calc_id
    const { error: updateErr } = await sb
      .from('outsource_records')
      .update({ returned_at: returnDate, return_notes: returnNotes })
      .eq('calc_id', _returnCalcId)
      .eq('studio_id', ctx.studioId);
    if (updateErr) {
      console.error('[pipeline] return update:', updateErr);
      window._showToast('error', 'Ошибка сохранения');
      return;
    }
    // PATCH status back to in_progress
    const ok = await window._updateStatus(_returnCalcId, 'in_progress');
    if (ok) {
      window._closeModal('modalReturn');
      window._showToast('success', 'Авто возвращено в работу');
      window._loadBoard();
    }
  } finally { /* unlock */ }
}
```

**Important:** The `.update().eq('calc_id', ...).eq('studio_id', ...)` will update ALL outsource_records for this calc. If a car can be outsourced multiple times, the filter needs to target only the row where `returned_at IS NULL`. The QueryBuilder has `.is(col, val)` method (line 66 in api.js) which can be used: `.is('returned_at', null)`.

### Pattern 4: Delivery Modal with 5 Payment Methods

**What:** The delivery modal needs dynamic UI that shows/hides fields based on selected payment method. Payment methods: cash, card/transfer, bank transfer (with VAT% input), deferred (debt), mixed (per-method amounts).

**payment_breakdown JSONB structure:**
```javascript
// For "mixed" payment
{
  cash: 10000,
  card: 15000,
  transfer: 0,
  deferred: 5000
}

// For single method
{
  cash: 30000
}
```

**Key interaction:** When payment method is "mixed", show breakdown inputs for each sub-method. When "transfer" (bank transfer), show VAT% input. The total must auto-calculate and match `total_amount`.

**Mirror to calculations.final_price:** After delivery_acts INSERT succeeds, the status PATCH must include `{ final_price: totalAmount }` in the extra parameter:
```javascript
const ok = await window._updateStatus(calcId, 'delivered', { final_price: totalAmount });
```

### Pattern 5: Cancel Modal -- Simple Form, No Sub-Table

**What:** Cancel modal captures reason category (select) and free-text comment. Unlike other modals, there may be no dedicated sub-table -- cancellation data goes into `status_history.comment`.

**Reason categories:**
```javascript
const CANCEL_REASONS = [
  { value: 'no_show',     label: 'Клиент не приехал' },
  { value: 'refused',     label: 'Клиент отказался' },
  { value: 'scheduling',  label: 'Конфликт расписания' },
  { value: 'other',       label: 'Другое' },
];
```

**Save pattern (no sub-table INSERT, just PATCH with history comment):**
```javascript
async function saveCancel() {
  const reason = document.getElementById('cancelReason').value;
  const comment = document.getElementById('cancelComment').value.trim();
  const fullComment = `[${reason}] ${comment}`.trim();

  const ok = await window._updateStatus(_cancelCalcId, 'cancelled', {
    _historyComment: fullComment,
  });
  if (ok) {
    window._closeModal('modalCancel');
    window._showToast('success', 'Заказ отменён');
    window._loadBoard();
  }
}
```

**Note:** `updateStatus` already supports `_historyComment` in the `extra` parameter (board.html line 593-594). It strips the field before sending to DB and passes it to the status_history INSERT. This is the cleanest approach -- no new table needed.

### Pattern 6: Master Assignment Modal (accepted -> in_progress)

**What:** A simplified modal that captures who is responsible for the work, without the full assign-work.html complexity. The full assignment page remains available via drawer button.

**Scope decision:** The assign-work.html page has 1293 lines of complex logic: per-service executor assignment, calendar booking, role-based filtering, salary calculation. The Phase 2 modal should NOT replicate this. It should capture the minimum: a text field or dropdown for the responsible person's name, and optionally a start date.

**Key change:** The board.html `onDrop` handler at line 773-775 currently redirects to assign-work.html. This must be replaced with `PipelineForms.openModalAssign(calcId, carName)`. The full assign-work.html link stays in the drawer as "Назначить ответственных".

**Implementation approach:**
```javascript
async function saveAssign() {
  const responsibleName = document.getElementById('assignResponsible').value.trim();
  if (!responsibleName) {
    window._showToast('warning', 'Укажите ответственного');
    return;
  }
  // No sub-table insert -- store in calculations.assigned_to or work_assignments
  // Option A: simple field on calculations
  const ok = await window._updateStatus(_assignCalcId, 'in_progress', {
    work_assigned: true,
    assigned_to: responsibleName,
  });
  if (ok) {
    window._closeModal('modalAssign');
    window._showToast('success', 'Взято в работу');
    window._loadBoard();
  }
}
```

**Alternative:** Load the executors list via API and present a dropdown. This adds complexity but is more consistent. The decision is at planner's discretion -- either a free text input or an API-loaded dropdown.

### Anti-Patterns to Avoid

- **Duplicating updateStatus logic in pipeline-forms.js:** Always use `window._updateStatus()`. It already handles status_history recording.
- **Using `innerHTML` for user-supplied data:** All car names, contractor names, notes must use `.textContent`. Existing pattern confirmed.
- **Forgetting to add new modal IDs to the ESC handler:** Line 1481 has a hardcoded array `['modalDone', 'modalDeliver', 'modalAccept']`. New modals must be added here. If modals are migrated to pipeline-forms.js, the ESC handler approach may need updating.
- **Leaving stale modalDone/modalDeliver HTML in board.html after migration:** If modal HTML moves to pipeline-forms.js, the old `<div>` elements (lines 443-499) must be removed to avoid ID conflicts.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button lock during save | Custom disabled/text swap | Use pattern from Phase 1 `saveAcceptance` (manual lock/unlock) or `lockButton()` from ui.js | Consistent UX |
| Toast notifications | Custom popup | `window._showToast(type, text)` | Already exposed |
| Modal close | Custom logic | `window._closeModal(id)` | Already exposed at line 1507 |
| Status update + history | Raw API calls | `window._updateStatus(calcId, status, extra)` | Already handles status_history INSERT (line 606-617) |
| Board reload | Manual DOM refresh | `window._loadBoard()` | Has `_loading` guard |
| Confirm dialog | Alert/prompt | `confirmAction()` from ui.js | Returns Promise, but for Phase 2, cancel modal replaces this usage |

---

## Common Pitfalls

### Pitfall 1: modalDone Transitions to `waiting` Not `done`

**What goes wrong:** The existing `modalDone` save handler (line 1433) sets status to `waiting`. But `waiting` has no column in the COLUMNS array. Cards vanish from the board.

**Why it happens:** `waiting` was likely intended as a staging area between work completion and delivery. But the COLUMNS array was updated without adding a `waiting` column, or it was intentionally hidden. The ALLOWED_TRANSITIONS matrix has `done -> delivered` but no `waiting` state.

**How to avoid:** Phase 2 must resolve this. Two options:
1. **Change `modalDone` to transition to `done`** (matches ALLOWED_TRANSITIONS and COLUMNS). This is the cleaner approach.
2. **Add `waiting` to COLUMNS** and update ALLOWED_TRANSITIONS to include `waiting -> delivered`.

**Recommendation:** Option 1. The `done` column already exists on the board, labeled "Proверено" (Checked). The done modal should transition to `done`. Remove all `waiting` references from board.html.

### Pitfall 2: Migrating modalDone/modalDeliver Breaks Existing Event Bindings

**What goes wrong:** The `bindEvents()` function (line 1418-1454) binds click handlers to `btnDoneSave`, `btnDeliverSave`, etc. If these modals are moved to pipeline-forms.js (lazy-injected), the `bindEvents()` calls will fail because the DOM elements don't exist at bind time.

**Why it happens:** `bindEvents()` runs once during `initPage()`. pipeline-forms.js injects HTML lazily on first `open()` call.

**How to avoid:** Remove the Done/Deliver event bindings from `bindEvents()`. Instead, bind events in the `inject*()` function inside pipeline-forms.js (same pattern as Phase 1's `injectAccept()`). The ESC handler at line 1481 needs to be updated to include all new modal IDs.

### Pitfall 3: Return Modal Updates ALL outsource_records for a calc

**What goes wrong:** `sb.from('outsource_records').update({...}).eq('calc_id', calcId)` updates every row for that calc. If a car was outsourced twice (out -> return -> out again), both records get the return date.

**Why it happens:** The `outsource_records` table has no UNIQUE constraint on `calc_id` -- a car can be outsourced multiple times.

**How to avoid:** Filter to the row where `returned_at IS NULL`:
```javascript
await sb.from('outsource_records')
  .update({ returned_at: date, return_notes: notes })
  .eq('calc_id', calcId)
  .eq('studio_id', ctx.studioId)
  .is('returned_at', null);
```
Verify that `QueryBuilder.is()` sends the correct filter parameter. From api.js line 66: `.is(col, val)` pushes `[col, 'is', val]` which serializes as `filter[returned_at][is]=null`. The backend must support IS NULL filters.

### Pitfall 4: Delivery Modal Must Mirror total_amount to calculations.final_price

**What goes wrong:** delivery_acts has the canonical payment data, but reports/board cards read `calculations.final_price`. If not mirrored, the board shows stale prices.

**Why it happens:** Two sources of truth.

**How to avoid:** In the delivery save handler, pass `final_price` in the updateStatus extra parameter:
```javascript
const ok = await window._updateStatus(calcId, 'delivered', {
  final_price: totalAmount,
  delivery_note: notes,
});
```
This is already the pattern in the current `modalDeliver` save (line 1448).

### Pitfall 5: ESC Handler and New Modal IDs

**What goes wrong:** Pressing ESC doesn't close new modals.

**Why it happens:** The ESC handler at line 1481 has a hardcoded array: `['modalDone', 'modalDeliver', 'modalAccept']`. New modal IDs are not listed.

**How to avoid:** Either:
- Update the array to include all new IDs: `['modalDone', 'modalDeliver', 'modalAccept', 'modalOutsource', 'modalReturn', 'modalCancel', 'modalAssign']`
- Or change to a generic approach: `document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'))`

### Pitfall 6: onDrop Handler Needs outsourced and cancelled Transitions

**What goes wrong:** Dragging a card to `outsourced` column currently falls through to the direct `updateStatus` call at line 787 because there's no `if (toStatus === 'outsourced')` check. No modal opens.

**Why it happens:** Phase 1 added the outsourced column to ALLOWED_TRANSITIONS but did not wire up the modal for it (that's Phase 2 work).

**How to avoid:** Add modal-triggering conditions for `outsourced` and `cancelled` in onDrop:
```javascript
if (toStatus === 'outsourced') {
  PipelineForms.openModalOutsource(_dragCalcId, carName);
  return;
}
if (toStatus === 'cancelled') {
  PipelineForms.openModalCancel(_dragCalcId, carName);
  return;
}
```

Also handle `in_progress` from `outsourced` (return modal):
```javascript
if (toStatus === 'in_progress' && _dragStatus === 'outsourced') {
  PipelineForms.openModalReturn(_dragCalcId, carName);
  return;
}
if (toStatus === 'in_progress' && _dragStatus === 'accepted') {
  PipelineForms.openModalAssign(_dragCalcId, carName);
  return;
}
```

---

## Code Examples

### Verified Window Globals Available to pipeline-forms.js

```javascript
// Source: board.html lines 1501-1507 (verified)
window._boardCtx = studioCtx;       // { studioId, user, role, ... }
window._updateStatus = updateStatus; // async (calcId, status, extra) => bool
window._loadBoard = loadBoard;       // async () => void (has _loading guard)
window._sb = sb;                     // QueryBuilder factory: sb.from('table').insert/update/eq
window._showToast = showToast;       // (type, text) => void
window._closeModal = id => document.getElementById(id)?.classList.remove('active');
```

### updateStatus Extra Parameter with History Comment

```javascript
// Source: board.html lines 591-618 (verified)
// The extra object can contain _historyComment which is stripped before DB write
// and passed to status_history.comment
async function updateStatus(calcId, status, extra = {}) {
  const historyComment = extra._historyComment || null;
  delete extra._historyComment;
  // PATCH calculations with remaining extra fields...
  // INSERT status_history with comment...
}
```

### QueryBuilder .is() for NULL Filtering

```javascript
// Source: api.js line 66 (verified)
// .is(col, val) pushes [col, 'is', val] to filters
sb.from('outsource_records')
  .update({ returned_at: new Date().toISOString(), return_notes: 'Работа завершена' })
  .eq('calc_id', calcId)
  .is('returned_at', null);
// Generates: PATCH /api/table/outsource_records?filter[calc_id][eq]=...&filter[returned_at][is]=null
```

### Existing Drawer Buttons That Need Rewiring

```javascript
// Source: board.html lines 1228-1242 (verified)

// in_progress drawer -- line 1232:
btn('На аутсорсинг', () => move('outsourced', 'Статус → Аутсорсинг'))
// MUST CHANGE TO: open modal

// outsourced drawer -- line 1239:
btn('Вернуть в работу', () => move('in_progress', 'Возвращено в работу'))
// MUST CHANGE TO: open return modal

// accepted drawer -- line 1225:
btn('Взять в работу', () => { closeDrawer(); window.location.href = `assign-work.html?...`; })
// MUST CHANGE TO: open assign modal

// All statuses -- doCancel at line 1182:
// Uses confirmAction() native confirm
// MUST CHANGE TO: open cancel modal
```

---

## Board.html Edit Points for Phase 2

| What to Change | Line(s) | Action |
|----------------|---------|--------|
| `onDrop()` -- add modal triggers for outsourced, cancelled, in_progress transitions | 768-793 | Add `if` blocks for `toStatus === 'outsourced'`, `'cancelled'`, and conditional `'in_progress'` |
| Drawer `in_progress` status -- "На аутсорсинг" button | 1232 | Replace `move()` with `closeDrawer(); PipelineForms.openModalOutsource(...)` |
| Drawer `outsourced` status -- "Вернуть в работу" button | 1239 | Replace `move()` with `closeDrawer(); PipelineForms.openModalReturn(...)` |
| Drawer `accepted` status -- "Взять в работу" button | 1225 | Replace redirect with `closeDrawer(); PipelineForms.openModalAssign(...)` |
| Drawer `doCancel` function | 1182-1187 | Replace `confirmAction()` with `closeDrawer(); PipelineForms.openModalCancel(...)` |
| Drawer `doDeliver` function | 1200-1203 | Replace `openModalDeliver(...)` with `PipelineForms.openModalDeliver(...)` |
| Drawer `doDone` function | 1196-1198 | Replace `openModalDone(...)` with `PipelineForms.openModalDone(...)` |
| `modalDone` HTML | 443-471 | Remove from board.html (migrated to pipeline-forms.js) |
| `modalDeliver` HTML | 474-499 | Remove from board.html (migrated to pipeline-forms.js) |
| `openModalDone` function | 1294-1298 | Remove from board.html (migrated to pipeline-forms.js) |
| `openModalDeliver` function | 1405-1411 | Remove from board.html (migrated to pipeline-forms.js) |
| `bindEvents()` -- Done/Deliver handlers | 1423-1454 | Remove (events now bound in pipeline-forms.js inject functions) |
| `loadDoneMaterials`, `extractMaterials`, `updateDoneTotals`, `_donePlanItems` | 1301-1402 | Migrate to pipeline-forms.js (needed by the done modal) |
| ESC handler modal ID array | 1481 | Add new modal IDs |
| `<script src="pipeline-forms.js">` | 503 | Already loaded -- no change needed |

---

## Database Tables (Already Created in Phase 1)

### Tables Used by Phase 2 Modals

| Table | Used By | Operation | Key Columns |
|-------|---------|-----------|-------------|
| `outsource_records` | FORM-02 (outsource), FORM-06 (return) | INSERT new record; UPDATE on return | `contractor_name`, `work_type`, `deadline`, `outsource_type`, `notes`, `returned_at`, `return_notes` |
| `delivery_acts` | FORM-04 (delivery) | INSERT new record | `payment_method`, `payment_breakdown` (JSONB), `total_amount`, `vat_percent`, `notes`, `delivered_by` |
| `status_history` | FORM-05 (cancel), all transitions | INSERT via `updateStatus` (automatic) | `from_status`, `to_status`, `changed_by`, `comment` |
| `calculations` | All modals | PATCH via `updateStatus` | `status`, `final_price`, `work_assigned`, `assigned_to` |

### No New Migration Needed

All tables exist. The only possible schema question is whether `calculations` has an `assigned_to` column for the master assignment modal (FORM-05). If not, the assignment can be stored as a `work_assignments` record instead.

---

## Open Questions

1. **Where is cancellation data stored?**
   - What we know: `status_history` has a `comment` field. `updateStatus` already supports `_historyComment` in extra. There is no `cancellations` table or `cancellation_reason` column on `calculations`.
   - What's unclear: Should cancel reason be a structured field (queryable) or just free text in status_history?
   - Recommendation: Use `_historyComment` with format `[reason_key] Free text comment`. This requires no schema changes. If structured querying is needed later, a migration can add a `cancellation_reason` column to `calculations` or a dedicated table. For v1, status_history comment is sufficient.
   - Confidence: HIGH -- `_historyComment` mechanism verified in updateStatus source.

2. **Does `calculations` have an `assigned_to` column?**
   - What we know: Line 1139 of assign-work.html sets `work_assigned: true` on calculations. There is no `assigned_to` column visible in the code.
   - What's unclear: The actual schema of `calculations` table (not in this repo).
   - Recommendation: For the simple assign modal, either (a) just set `work_assigned: true` and store responsible name as a `_historyComment`, or (b) pass `assigned_to: name` in the updateStatus extra and let the backend handle unknown fields gracefully. Test with a quick API call.
   - Confidence: MEDIUM -- cannot verify calculations schema without backend access.

3. **Does `QueryBuilder.is('returned_at', null)` work correctly with the backend?**
   - What we know: The `.is()` method exists in api.js line 66. It pushes `[col, 'is', val]`. The serialized filter would be `filter[returned_at][is]=`.
   - What's unclear: Whether the backend REST API correctly handles IS NULL filters via this parameter format.
   - Recommendation: Test with a simple query before relying on it in the return modal. If it doesn't work, use a workaround: fetch the outsource record with `.eq('calc_id', calcId)`, find the row with `returned_at === null` client-side, then update by `.eq('id', row.id)`.
   - Confidence: MEDIUM -- method exists but backend behavior unverified.

4. **What happens to the `waiting` status cards currently in the database?**
   - What we know: `modalDone` transitions to `waiting`. Some cards may already have `waiting` status in the DB.
   - What's unclear: How many, if any.
   - Recommendation: The normalizeStatus function (line 580-588) can map `waiting` to `done` for display purposes: add `if (status === 'waiting') return 'done';`. This preserves backward compatibility while the done modal now transitions to `done` instead.

---

## Environment Availability

Step 2.6: SKIPPED -- Phase 2 is purely frontend code changes (pipeline-forms.js and board.html). No external dependencies required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None -- no automated test infrastructure |
| Config file | None |
| Quick run command | Manual browser testing (open board.html) |
| Full suite command | Manual QA checklist below |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | How to Verify | Automated? |
|--------|----------|-----------|---------------|-----------|
| FORM-02 | Outsource modal opens from drawer "На аутсорсинг" + drag to outsourced column | Manual | Click button / drag card, verify modal appears with form fields | Manual-only |
| FORM-02 | Outsource modal saves to outsource_records | Manual | Fill form, save, query `SELECT * FROM outsource_records WHERE calc_id = '...'` | Manual-only |
| FORM-02 | Card moves to outsourced column after save | Manual | Verify card appears in Аутсорсинг column | Manual-only |
| FORM-03 | Done modal captures checked_by, remarks | Manual | Fill form, save, verify data stored (in status_history or fact_materials) | Manual-only |
| FORM-03 | Done modal transitions to `done` status (not `waiting`) | Manual | Save, verify card in Проверено column, query `calculations.status = 'done'` | Manual-only |
| FORM-04 | Delivery modal shows 5 payment methods | Manual | Open modal, verify all 5 options in dropdown | Manual-only |
| FORM-04 | Mixed payment shows per-method breakdown inputs | Manual | Select "Смешанная", verify sub-inputs appear | Manual-only |
| FORM-04 | Delivery saves to delivery_acts with payment_breakdown JSONB | Manual | Save, query DB for delivery_acts row | Manual-only |
| FORM-04 | Total mirrored to calculations.final_price | Manual | After save, query `calculations.final_price` | Manual-only |
| FORM-05 | Cancel modal opens from any status drawer | Manual | Open drawer for each status, click cancel, verify modal | Manual-only |
| FORM-05 | Cancel modal captures reason + comment | Manual | Fill form, save, query status_history.comment for formatted reason | Manual-only |
| FORM-05 | Card moves to cancelled column | Manual | Verify card in Запись отменена column | Manual-only |
| FORM-06 | Return modal opens from outsourced drawer "Вернуть в работу" | Manual | Click button, verify modal appears | Manual-only |
| FORM-06 | Return modal UPDATES outsource_records (returned_at, return_notes) | Manual | Save, query DB for updated row | Manual-only |
| FORM-06 | Card returns to in_progress column | Manual | Verify card in В работе column | Manual-only |

### Wave 0 Gaps

None -- no automated test infrastructure exists in this project. Manual QA is the established convention.

---

## Sources

### Primary (HIGH confidence)
- `board.html` -- direct source inspection of all 1524 lines, all line numbers verified
- `pipeline-forms.js` -- Phase 1 implementation verified (192 lines, IIFE pattern, window.PipelineForms API)
- `api.js` -- QueryBuilder implementation verified, `.is()`, `.update()`, `.insert()` methods confirmed
- `ui.js` -- `showToast`, `lockButton`, `confirmAction` exports verified
- `assign-work.html` -- full page structure understood (1293 lines, complex executor assignment)
- `migrations/001_workshop_pipeline.sql` -- all 4 tables verified, column names confirmed
- `.planning/REQUIREMENTS.md` -- FORM-02 through FORM-06 specifications
- `.planning/STATE.md` -- accumulated context and pitfalls

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies To | Compliance |
|-----------|-----------|------------|
| Vanilla HTML/JS -- no frameworks | All new modal code | Compliant -- pipeline-forms.js is IIFE, no framework |
| Server code not in repo -- only SQL migrations and frontend | Phase 2 work | No new migrations needed; frontend only |
| New forms must fit existing board.html design (modals, card styles) | All new modals | Compliant -- reuses `.modal`, `.form-group`, `.modal-footer` CSS classes |
| All forms must work on mobile | All new modals | `max-height:90vh;overflow-y:auto` on modal-content; existing responsive CSS |
| `escapeHtml()` / `.textContent` for user-generated content | Modal rendering | All car names, contractor names via `.textContent` |
| Prefer `const` over `let` | All new JS | Enforced |
| 2-space indentation | All new code | Enforced |
| Section dividers `// -- Section ----` | pipeline-forms.js | Required |
| camelCase for functions, UPPER_SNAKE for constants | All new code | Required |
| `{ data, error }` destructuring for API calls | pipeline-forms.js | Required |
| `console.error('[context] message', error)` for errors | pipeline-forms.js | Required -- use `[pipeline]` prefix |

---

## Metadata

**Confidence breakdown:**
- Modal architecture: HIGH -- Phase 1 pattern proven and verified in source
- Drawer/onDrop rewiring: HIGH -- all line numbers and current behavior verified
- Database operations: HIGH -- table schemas verified from migration file
- `waiting` status resolution: HIGH -- inconsistency clearly identified in source
- `QueryBuilder.is()` for NULL filter: MEDIUM -- method exists but backend behavior unverified
- `calculations.assigned_to` column: MEDIUM -- cannot verify server schema

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable vanilla JS project, no dependency drift)

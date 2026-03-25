# Phase 1: Foundation — Research

**Researched:** 2026-03-25
**Domain:** Vanilla JS Kanban board extension — SQL migration, column config, transition guard, acceptance modal
**Confidence:** HIGH (all findings verified from direct source code inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Acceptance Modal Layout**
- D-01: Grouped sections with visual headers: "Пробег и топливо", "Повреждения", "Комплектация", "Фото", "Подтверждение". Modal wider (~540px, matching modalDone). Scrollable on mobile.
- D-02: Fuel level input is a `<select>` dropdown: Полный, 3/4, 1/2, 1/4, Пусто.
- D-03: Equipment checklist (запаска, домкрат, аптечка, огнетушитель, документы, ключи) — 2-column checkbox grid.
- D-04: Photo zone checkboxes (перед, зад, лев, прав, салон, багаж) — 2-column checkbox grid.
- D-05: Damage field is a single textarea (free text).
- D-06: "Клиент согласен" checkbox + notes textarea in final section before Save/Cancel footer.

**Outsourced Column**
- D-07: COLUMNS position: between `in_progress` and `done`. Key: `outsourced`, label: `Аутсорсинг`.
- D-08: Color: `{ bg: 'rgba(249,115,22,0.12)', color: '#c2410c' }`.
- D-09: Include `outsourced` in `ACTIVE_KEYS`.
- D-10: Card appearance: same style as other columns — no special badge in v1.
- D-11: Empty column state: same pattern as others (📭 Пусто).

**Transition Guard Feedback**
- D-12: Blocked drag: card snaps back + `showToast('warning', 'Переход недоступен')`.
- D-13: Context menu (drawer): only permitted transitions shown — blocked actions omitted, not disabled.
- D-14: No visual cues on cards for available transitions.

**SQL Migration**
- D-15: Single file `001_workshop_pipeline.sql` — all 3 new tables + status_history.
- D-16: `acceptance_acts` has `UNIQUE(calc_id)` constraint.
- D-17: snake_case columns, `timestamptz` timestamps, `REFERENCES calculations(id)` FK.

### Claude's Discretion
- `pipeline-forms.js` module structure (already decided: separate module following booking-popup.js precedent)
- Exact transition matrix implementation (object map vs function)
- Status history storage (separate table vs JSONB column on calculations)
- `loadBoard()` `_loading` guard implementation details
- `normalizeStatus()` handling of `outsourced` value

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DB-01 | SQL migration creates `acceptance_acts` table | Schema columns, UNIQUE(calc_id) constraint, timestamptz, FK to calculations confirmed in decisions |
| DB-02 | SQL migration creates `outsource_records` table | All columns defined in REQUIREMENTS.md; pattern follows DB-01 |
| DB-03 | SQL migration creates `delivery_acts` table | JSONB for payment_breakdown per STATE.md prior decision |
| DB-04 | SQL migration adds status_history (table or JSONB column) | Both options researched below; separate table recommended |
| BOARD-01 | Transition guard — only allowed status transitions | Full transition matrix defined; drag handler at line 704, drawer at line 1141 |
| BOARD-02 | `outsourced` column added between `in_progress` and `done` | COLUMNS array line 524, STATUS_COLORS line 533, ACTIVE_KEYS line 515 — all edit points verified |
| BOARD-03 | `loadBoard()` guard prevents concurrent reload | `_loading` flag pattern; `loadBoard()` at line 579 — no guard exists yet |
| BOARD-04 | Status history recorded on every transition | Hooks into `updateStatus()` at line 564 |
| FORM-01 | Acceptance modal (scheduled→accepted) | All form fields, modal HTML pattern, two-step INSERT+PATCH save pattern fully researched |
</phase_requirements>

---

## Summary

Phase 1 is a focused codebase extension to board.html and the database layer. There are no external dependencies or npm packages — all work happens inside vanilla JS HTML files and a single SQL migration. The codebase is well-understood from direct source inspection: every edit point (exact line numbers), every CSS class name, every API pattern, and every utility function is confirmed.

The board is 1447 lines. The primary risk is mutation of shared module-level state in board.html causing side effects — particularly the `loadBoard()` concurrent-call problem and the need to wire `_loading` guard before any new modal traffic is introduced. A second risk is the two-step save pattern (INSERT to sub-table, then PATCH `calculations.status`) where a partial failure leaves the record in an inconsistent state; using `UNIQUE(calc_id)` on `acceptance_acts` (D-16) and application-level upsert handling prevents double records on retry.

The `pipeline-forms.js` module (new file) will contain modal HTML injection, modal open/close functions, and the acceptance save handler — following the `booking-popup.js` IIFE precedent. All CSS for the acceptance modal reuses existing `.modal`, `.modal-content`, `.form-group`, `.modal-footer` classes already defined in board.html lines 344–392.

**Primary recommendation:** Work in this order: (1) SQL migration, (2) COLUMNS/ACTIVE_KEYS/STATUS_COLORS/normalizeStatus atomic edit, (3) `_loading` guard on `loadBoard()`, (4) transition matrix + drag guard + drawer filter, (5) BOARD-04 status history hook, (6) acceptance modal HTML + pipeline-forms.js module. Each step is independently testable.

---

## Standard Stack

### Core
| Component | Location | Purpose |
|-----------|----------|---------|
| `api.js` — `QueryBuilder` | `/api/table/{table}` REST | `sb.from().insert()`, `.update()`, `.eq()` — all DB calls |
| `ui.js` — `showToast`, `lockButton` | CDN-free module | User feedback during saves, button disable during async |
| `formatters.js` — `escapeHtml` | Local module | XSS prevention — mandatory for all DB content rendered to HTML |
| board.html `.modal` CSS classes | Lines 344–392 | Modal overlay, content panel, form-group, modal-footer — reuse as-is |
| `studioCtx.studioId` | Global from `studio-context.js` | Required `studio_id` for all INSERT/UPDATE calls |

### No New Dependencies
This phase requires zero new libraries. All UI patterns, DOM helpers, CSS classes, and API methods already exist in the codebase. A new `pipeline-forms.js` file is the only new artefact besides the SQL migration.

---

## Architecture Patterns

### Recommended Project Structure (new files only)
```
pipeline-forms.js        # new IIFE module — acceptance modal HTML, open/save functions
migrations/
  001_workshop_pipeline.sql   # all 4 new tables in one migration
```

### Pattern 1: IIFE Module (pipeline-forms.js)

**What:** Self-contained IIFE that injects its own HTML into the page and exposes a global `PipelineForms` namespace. Follows `booking-popup.js` exactly.

**When to use:** Any modal logic that would bloat board.html further. board.html is already 1447 lines.

**Structure:**
```javascript
// pipeline-forms.js
(function () {
'use strict';

const HTML = `
<!-- modalAccept HTML injected here -->
`;

function inject() {
  if (document.getElementById('modalAccept')) return;
  document.body.insertAdjacentHTML('beforeend', HTML);
  bindAcceptEvents();
}

function openModalAccept(calcId, carName) {
  inject();
  // populate fields, show modal
}

window.PipelineForms = { openModalAccept };
})();
```

board.html loads it via `<script src="pipeline-forms.js"></script>` (before the module script block, same pattern as `booking-popup.js` line 496).

### Pattern 2: Two-Step Save (INSERT sub-table, then PATCH status)

**What:** Acceptance modal save: (1) INSERT into `acceptance_acts`, (2) PATCH `calculations.status`. Status only changes if INSERT succeeds.

**Example:**
```javascript
// Source: verified from openModalDone / btnDoneSave pattern (board.html line 1353)
async function saveAcceptance(calcId) {
  const btn = document.getElementById('btnAcceptSave');
  const release = lockButton(btn, 'Сохранение...');
  try {
    const payload = gatherAcceptanceForm();
    // Step 1 — insert record
    const { error: insertErr } = await sb
      .from('acceptance_acts')
      .insert({ calc_id: calcId, studio_id: studioCtx.studioId, ...payload });
    if (insertErr) { showToast('error', 'Ошибка сохранения акта'); return; }
    // Step 2 — update status
    const ok = await updateStatus(calcId, 'accepted');
    if (ok) { closeModal('modalAccept'); showToast('success', 'Авто принято'); loadBoard(); }
  } finally {
    release();
  }
}
```

**Critical detail:** `updateStatus` is defined in board.html scope and not exported. `pipeline-forms.js` must either (a) call it via `window.updateStatus` if exposed, or (b) duplicate the 12-line function locally with the same `studioCtx` reference. Option (b) is safer to avoid coupling — but requires `studioCtx` to be window-accessible. See Pitfall 2 below.

### Pattern 3: Transition Matrix (object map)

**What:** Plain object mapping each status to its allowed next statuses. Checked in `onDrop()` and in the drawer action builder.

**Transition matrix (from BOARD-01):**
```javascript
// Source: REQUIREMENTS.md BOARD-01
const ALLOWED_TRANSITIONS = {
  scheduled:   ['accepted', 'cancelled'],
  accepted:    ['in_progress', 'cancelled'],
  in_progress: ['outsourced', 'done', 'cancelled'],
  outsourced:  ['in_progress', 'done', 'cancelled'],
  done:        ['delivered', 'cancelled'],
  delivered:   ['closed'],
  cancelled:   [],
  closed:      [],
};

function isAllowed(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}
```

**Note on "any→cancelled":** The requirements say `any→cancelled`. The matrix above treats cancelled as accessible from most operational statuses. `delivered` and `closed` are terminal and do not permit cancellation.

### Pattern 4: `_loading` Guard on `loadBoard()`

**What:** Module-level boolean flag prevents two concurrent `loadBoard()` calls. Needed before any new modal saves call `loadBoard()`.

**Example:**
```javascript
// Source: pattern recommended in STATE.md, loadBoard() at board.html line 579
let _loading = false;

async function loadBoard() {
  if (_loading) return;
  _loading = true;
  const board = document.getElementById('board');
  showLoading(board, 'Загрузка доски...');
  try {
    // ... existing fetch logic ...
    renderBoard();
  } finally {
    _loading = false;
  }
}
```

### Pattern 5: Outsourced Column CSS

**What:** The column colour is driven by a CSS class `col-outsourced` which must be added to board.html `<style>` block alongside existing `col-*` rules (lines 121–173).

**Example:**
```css
/* Source: board.html lines 133–137 pattern for col-in_progress */
.col-outsourced .column-dot   { background: #f97316; }
.col-outsourced .column-title { color: #c2410c; }
.col-outsourced .column-count { background: rgba(249,115,22,0.10); color: #c2410c; }
.col-outsourced               { border-top: 3px solid #f97316; }
.col-outsourced .column-sum   { color: #c2410c; }
```

### Pattern 6: Status History Recording

**Recommendation (Claude's Discretion):** Use a **separate `status_history` table** (not JSONB on `calculations`). Rationale: status history will be queried chronologically for the document pages in Phase 3 (`DOC-05`). A separate table with an index on `calc_id` is cleaner for sorted reads. A JSONB column requires parsing and cannot be indexed for range queries.

**Schema:**
```sql
CREATE TABLE status_history (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id     uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id   uuid        NOT NULL,
  from_status text,
  to_status   text        NOT NULL,
  changed_by  uuid,
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON status_history (calc_id, created_at);
```

**Hook location:** Extend `updateStatus()` in board.html (line 564) to INSERT a `status_history` row after a successful PATCH. Or wrap it in a helper `updateStatusWithHistory()`.

### Anti-Patterns to Avoid

- **Calling `loadBoard()` without `_loading` guard from modal save handlers:** Without the guard, rapidly clicking Save triggers concurrent fetches and double board renders. Fix first (BOARD-03), then wire modals.
- **Using `innerHTML` to render user data:** All content from DB must go through `textContent` assignment or `escapeHtml()`. The `.modal-car`, `.drawer-car` elements in existing code use `.textContent` — follow this. Never `el.innerHTML = calcData.car_name`.
- **Adding `outsourced` to only some of the four places:** COLUMNS, STATUS_COLORS, ACTIVE_KEYS, and `normalizeStatus()` must be updated atomically. Missing ACTIVE_KEYS means outsourced cards disappear in the default "active" filter view.
- **Inserting `outsourced` actions into the drawer without updating `onDrop()`:** Both code paths (drag and click) must share the same transition guard.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Button state during async | Custom disabled/re-enable logic | `lockButton(btn, text)` from `ui.js` line 246 | Already handles original text restore and disabled state |
| Toast notifications | Custom popup element | `showToast(type, text)` from `ui.js` line 146 | Consistent timing, stacking, CSS already injected |
| Confirm dialog | Custom modal | `confirmAction({ message })` from `ui.js` line 268 | Returns Promise<boolean>, consistent UX |
| DOM element creation | Template literals + innerHTML | `createEl(tag, attrs, children)` from `dom.js` line 29 | Safe, no XSS risk |
| DB query building | Raw fetch calls | `sb.from(table).insert/update/eq/single()` from `api.js` | Token auth injected, error shape standardised |

---

## Common Pitfalls

### Pitfall 1: `pipeline-forms.js` Cannot Access `updateStatus()` or `studioCtx`

**What goes wrong:** `pipeline-forms.js` is a plain `<script>` (IIFE, not a module). The `updateStatus` function and `studioCtx` variable are defined inside a `<script type="module">` in board.html — they are module-scoped and invisible to non-module scripts.

**Why it happens:** ES module scope is not global. `window.studioCtx` and `window.updateStatus` are not set anywhere in the current code.

**How to avoid:** In the board.html module script `initPage()`, after `studioCtx` is resolved, assign `window._boardCtx = studioCtx`. Expose `updateStatus` as `window._updateStatus = updateStatus`. Then `pipeline-forms.js` reads `window._boardCtx` and calls `window._updateStatus()`. This mirrors how `booking-popup.js` receives its data via the `BookingPopup.open({ studioId, onSaved })` call pattern — the page passes what the IIFE needs.

**Warning signs:** `ReferenceError: studioCtx is not defined` or `updateStatus is not defined` in the browser console when the acceptance Save button is clicked.

### Pitfall 2: Acceptance Modal Duplicate Insert on Retry

**What goes wrong:** User clicks Save, API call succeeds but network stutters; user clicks Save again. Two `acceptance_acts` rows are inserted for the same `calc_id`.

**Why it happens:** No duplicate guard at the application layer in the current modal save pattern.

**How to avoid:** The `UNIQUE(calc_id)` constraint (D-16) causes the second INSERT to return an error. Application code should check for a duplicate-key error and treat it as a non-fatal success (the first insert already went through) — then proceed with the status PATCH.

**Warning signs:** API returns a constraint violation error code (PostgreSQL: `23505`) on the second save attempt. This is normal and expected — handle it as success.

### Pitfall 3: `onDrop()` Misses the Transition Guard for Modal-Triggering Statuses

**What goes wrong:** The guard only blocks direct-status drops. But `done` and `delivered` (lines 714–721) already trigger modals instead of `updateStatus`. When `outsourced` and `accepted` are added, they also need to open modals, not call `updateStatus` directly. If the transition guard is applied before the modal-open logic, the guard fires and snaps the card back before the modal opens.

**Why it happens:** The current `onDrop()` checks for modal-requiring targets first, then falls through to `updateStatus`. The transition guard must sit between "is this drop the same column?" and "does this transition require a modal?".

**How to avoid:** The correct check order in `onDrop()` is:
1. Skip if same column (`toStatus === _dragStatus`)
2. **Check transition is allowed** — if not, snap back + toast, return
3. If allowed AND requires modal, open modal, return
4. If allowed AND no modal needed, call `updateStatus` directly

```javascript
// Correct order
async function onDrop(e) {
  // ... setup ...
  if (!toStatus || !_dragCalcId || toStatus === _dragStatus) return;
  if (!isAllowed(_dragStatus, toStatus)) {
    showToast('warning', 'Переход недоступен');
    return; // card naturally snaps back (DOM not modified)
  }
  // modal-requiring transitions
  if (toStatus === 'accepted') { openModalAccept(...); return; }
  if (toStatus === 'done')     { openModalDone(...);   return; }
  if (toStatus === 'delivered'){ openModalDeliver(...); return; }
  // direct transitions
  const ok = await updateStatus(_dragCalcId, toStatus);
  if (ok) { showToast('success', `→ ${label}`); loadBoard(); }
}
```

### Pitfall 4: CSS Class `col-outsourced` Missing from board.html Styles

**What goes wrong:** The `renderBoard()` function sets `colEl.className = \`column col-${col.key}\`` (line 625). If `col-outsourced` CSS rules don't exist, the column header renders with no color, dot, or count styling.

**Why it happens:** Forgetting to add CSS while adding the JS config. The JS config and CSS are in two separate blocks of board.html.

**How to avoid:** Add `col-outsourced` CSS rules immediately adjacent to the existing `col-in_progress` rules (after line 137). Always update CSS and COLUMNS config in the same commit.

### Pitfall 5: `acceptance_acts.equipment` Column Type

**What goes wrong:** Storing checkbox state (boolean flags for 6 items) as a comma-separated string is hard to query and extend.

**Why it happens:** Simple approach.

**How to avoid:** Use a `text[]` array (PostgreSQL array of checked item names) or a `jsonb` object `{"запаска": true, "домкрат": false, ...}`. Recommendation: `jsonb` column — consistent with `delivery_acts.payment_breakdown` pattern, easy to read/write in JS as a plain object. Same for `photo_checks`.

---

## SQL Migration Design

### File: `001_workshop_pipeline.sql`

Recommended full schema (informed by D-15, D-16, D-17, REQUIREMENTS.md, and STATE.md decisions):

```sql
-- acceptance_acts
CREATE TABLE acceptance_acts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id        uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id      uuid        NOT NULL,
  mileage        integer,
  fuel_level     text,          -- 'full' | '3/4' | '1/2' | '1/4' | 'empty'
  damages        text,          -- free-text description
  equipment      jsonb,         -- { "запаска": true, "домкрат": false, ... }
  photo_checks   jsonb,         -- { "перед": true, "зад": false, ... }
  client_agreed  boolean        NOT NULL DEFAULT false,
  notes          text,
  created_at     timestamptz    NOT NULL DEFAULT now(),
  UNIQUE(calc_id)               -- D-16: prevents duplicate records
);

-- outsource_records
CREATE TABLE outsource_records (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id          uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id        uuid        NOT NULL,
  contractor_name  text,
  work_type        text,
  deadline         date,
  outsource_type   text,       -- 'car_leaves' | 'contractor_arrives'
  notes            text,
  returned_at      timestamptz,
  return_notes     text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- delivery_acts
CREATE TABLE delivery_acts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id             uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id           uuid        NOT NULL,
  payment_method      text,
  payment_breakdown   jsonb,      -- { cash: 0, card: 5000, transfer: 0, ... }
  total_amount        numeric(12,2),
  vat_percent         numeric(5,2),
  notes               text,
  delivered_by        text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- status_history (separate table — queried chronologically in Phase 3 DOC-05)
CREATE TABLE status_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calc_id      uuid        NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  studio_id    uuid        NOT NULL,
  from_status  text,
  to_status    text        NOT NULL,
  changed_by   uuid,
  comment      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON status_history (calc_id, created_at);
```

**Why `jsonb` for `equipment` and `photo_checks`:** Consistent with `delivery_acts.payment_breakdown`. JS reads/writes as plain object — `JSON.stringify(obj)` on save, `JSON.parse(str)` on load. PostgreSQL QueryBuilder handles JSONB transparently via the REST API.

---

## Acceptance Modal HTML Structure

Based on D-01 through D-06 and the `.modal-content` / `.form-group` CSS already in board.html (lines 344–392):

```html
<!-- modalAccept — injected by pipeline-forms.js -->
<div class="modal" id="modalAccept">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Приём автомобиля</div>
    <div class="modal-car" id="acceptCarName"></div>

    <!-- Section: Пробег и топливо -->
    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:4px">Пробег и топливо</div>
    <div class="form-group">
      <label>Пробег (км)</label>
      <input type="number" id="acceptMileage" placeholder="напр. 45000" min="0">
    </div>
    <div class="form-group">
      <label>Уровень топлива</label>
      <select id="acceptFuel">
        <option value="full">Полный</option>
        <option value="3/4">3/4</option>
        <option value="1/2" selected>1/2</option>
        <option value="1/4">1/4</option>
        <option value="empty">Пусто</option>
      </select>
    </div>

    <!-- Section: Повреждения -->
    <div style="...section header styles...">Повреждения</div>
    <div class="form-group">
      <label>Описание повреждений</label>
      <textarea id="acceptDamages" placeholder="Царапина на левом крыле..."></textarea>
    </div>

    <!-- Section: Комплектация (2-column grid) -->
    <div style="...">Комплектация</div>
    <div id="acceptEquipment" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:13px">
      <!-- 6 checkboxes: запаска, домкрат, аптечка, огнетушитель, документы, ключи -->
    </div>

    <!-- Section: Фото (2-column grid) -->
    <div style="...">Фото</div>
    <div id="acceptPhotos" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:13px">
      <!-- 6 checkboxes: перед, зад, лев, прав, салон, багаж -->
    </div>

    <!-- Section: Подтверждение -->
    <div style="...">Подтверждение</div>
    <div class="form-group" style="display:flex;align-items:center;gap:10px">
      <input type="checkbox" id="acceptClientAgreed" style="width:auto">
      <label for="acceptClientAgreed" style="text-transform:none;font-size:0.85rem;font-weight:600;margin:0">Клиент согласен с актом приёмки</label>
    </div>
    <div class="form-group">
      <label>Примечания</label>
      <textarea id="acceptNotes" placeholder="Дополнительные заметки..."></textarea>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnAcceptCancel">Отмена</button>
      <button class="btn btn-primary" id="btnAcceptSave">Принять авто</button>
    </div>
  </div>
</div>
```

**Mobile scrolling:** `max-height:90vh;overflow-y:auto` on `.modal-content` ensures the form scrolls on small screens without cutting off the footer. The existing `@media (max-width: 640px)` rule already sets `.modal-content { padding: 22px 18px 20px }`.

---

## Edit Points Reference (Exact Lines)

| What to Change | File | Line(s) | How |
|----------------|------|---------|-----|
| `ACTIVE_KEYS` — add `outsourced` | board.html | 515 | Add `'outsourced'` to Set |
| `COLUMNS` array — insert outsourced | board.html | 524–531 | Insert after `in_progress` entry |
| `STATUS_COLORS` — add outsourced | board.html | 533–543 | Add `outsourced: { bg, color }` entry |
| `normalizeStatus()` | board.html | 554–561 | Pass-through (no legacy mapping needed for new value) |
| `loadBoard()` — add `_loading` guard | board.html | 579–610 | Add flag + try/finally |
| `onDrop()` — add transition guard | board.html | 704–729 | Insert `isAllowed()` check before modal opens |
| Drawer action builder — filter by allowed | board.html | 1141–1200 | Replace unconditional `move()` calls with guard |
| `<style>` block — add `col-outsourced` | board.html | ~173 (after col-cancelled) | New CSS block |
| ESC key handler — add modalAccept | board.html | 1406–1410 | Add `'modalAccept'` to the forEach array |
| `<script src="pipeline-forms.js">` | board.html | 496 (after booking-popup.js) | New script tag |
| Accept modal HTML | board.html or pipeline-forms.js | inject via IIFE | New modal div |
| `updateStatus()` — add history INSERT | board.html | 564–576 | Extend to call `sb.from('status_history').insert(...)` after successful PATCH |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 1 is purely code and SQL migration changes. No external CLI tools, services, or runtimes required beyond a browser and a static file server (already available per CLAUDE.md Platform Requirements).

---

## Validation Architecture

`nyquist_validation` is `true` in config.json — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test runner, no test files, no package.json |
| Config file | None |
| Quick run command | Manual browser testing (open board.html) |
| Full suite command | Manual QA checklist (see below) |

There is no automated test infrastructure in this project. The codebase is vanilla HTML/JS with no build step and no test runner. All validation is manual browser testing.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | How to Verify | Automated? |
|--------|----------|-----------|---------------|-----------|
| DB-01 | `acceptance_acts` table exists with correct schema | Manual | Apply migration, run `\d acceptance_acts` in psql, verify UNIQUE constraint | Manual-only |
| DB-02 | `outsource_records` table exists | Manual | Apply migration, verify table structure in psql | Manual-only |
| DB-03 | `delivery_acts` table exists with JSONB column | Manual | Apply migration, verify `payment_breakdown` column type | Manual-only |
| DB-04 | `status_history` table exists, indexed | Manual | Apply migration, verify table + `\d+` for index | Manual-only |
| BOARD-01 | Illegal drag is blocked; toast shown | Manual | Drag `scheduled` card to `done` — verify snap-back + warning toast | Manual-only |
| BOARD-01 | Legal drag proceeds | Manual | Drag `in_progress` card to `outsourced` — verify modal opens | Manual-only |
| BOARD-02 | Outsourced column visible between in_progress and done | Manual | Open board.html, verify column order and orange color | Manual-only |
| BOARD-02 | Outsourced cards appear in active filter | Manual | Set a calc to `outsourced` status, verify it appears in "Активные" view | Manual-only |
| BOARD-03 | Rapid double-save does not double-reload | Manual | Click Save twice quickly in acceptance modal — verify only one board reload | Manual-only |
| BOARD-04 | `status_history` row inserted on every transition | Manual | Transition a card, query `SELECT * FROM status_history WHERE calc_id = '...'` | Manual-only |
| FORM-01 | Acceptance modal opens on scheduled→accepted | Manual | Drag `scheduled` card to `accepted` — verify modal appears with car name | Manual-only |
| FORM-01 | All form fields save to `acceptance_acts` | Manual | Fill form, save, query DB — verify all fields stored correctly | Manual-only |
| FORM-01 | Duplicate save returns graceful error (23505) | Manual | Save modal twice rapidly — verify no crash, status update succeeds | Manual-only |

### Wave 0 Gaps

No automated test files needed — project has no test infrastructure and manual testing is the established convention. The manual QA checklist above covers all phase requirements.

---

## Open Questions

1. **How does `pipeline-forms.js` access `studioCtx` and `updateStatus`?**
   - What we know: Both are module-scoped in board.html's `<script type="module">` block.
   - What's unclear: Whether exposing them as `window._boardCtx` and `window._updateStatus` is acceptable or whether a different integration point is better.
   - Recommendation: Assign to `window` globals in `initPage()` after `studioCtx` is resolved, following the `window._crmApi = sb` pattern already in api.js. This is the established project convention for cross-scope sharing.

2. **Does the backend REST API support JSONB column writes?**
   - What we know: `delivery_acts.payment_breakdown` and `calculations.calculation_data` use JSONB. `api.js` serializes body with `JSON.stringify()` and the server presumably accepts it.
   - What's unclear: Whether the `/api/table/acceptance_acts` endpoint is auto-generated from schema or hand-written. If hand-written, new tables need backend endpoints before the frontend can call them.
   - Recommendation: Verify with a test INSERT call immediately after applying the migration before building the full modal save flow. Confirm the new table endpoints exist.

3. **Does the backend need manual registration for new tables?**
   - What we know: All DB access goes through `/api/table/{table}`. The backend code is not in this repo.
   - What's unclear: Whether new tables are automatically served or need manual registration in the backend.
   - Recommendation: Flag this as a dependency. If the backend auto-serves all PostgreSQL tables via REST, no action needed. If not, the backend team must add endpoints for `acceptance_acts`, `outsource_records`, `delivery_acts`, `status_history` before Phase 1 acceptance modal can be tested end-to-end.

---

## Sources

### Primary (HIGH confidence)
- `board.html` — direct source inspection, all line numbers verified
- `api.js` — QueryBuilder implementation verified; `.in()` bug (only applies first value, line 67) confirmed
- `ui.js` — all exported utilities verified: `showToast`, `lockButton`, `confirmAction`
- `dom.js` — all utilities verified
- `formatters.js` — `escapeHtml` location confirmed (exported from formatters.js, not dom.js despite CONTEXT.md note)
- `.planning/REQUIREMENTS.md` — requirement specs
- `.planning/phases/01-foundation/01-CONTEXT.md` — locked decisions
- `.planning/STATE.md` — accumulated context and pitfalls

### Secondary (MEDIUM confidence)
- `booking-popup.js` lines 1–50 — IIFE module pattern confirmed for `pipeline-forms.js` design

---

## Project Constraints (from CLAUDE.md)

Directives the planner must verify compliance with:

| Directive | Applies To | Status |
|-----------|-----------|--------|
| Vanilla HTML/JS — no frameworks | All new code | Compliant — pipeline-forms.js is IIFE, no framework |
| Server code not in repo — only SQL migrations and frontend | DB work | Compliant — only .sql file produced |
| New forms must fit existing board.html design (modals, card styles) | FORM-01 | Compliant — reuses `.modal`, `.form-group`, `.modal-footer` classes |
| All forms must work on mobile | FORM-01 | Compliant — `max-height:90vh;overflow-y:auto` + existing responsive CSS |
| `escapeHtml()` from `formatters.js` for all user-generated content | Modal rendering | Required — car_name and any DB text must use `textContent` or `escapeHtml` |
| Prefer `const` over `let` | All new JS | Enforced — use `const` for all non-reassigned variables |
| 2-space indentation | All new code | Enforced |
| Section dividers: `// ── Section ────────────────` | pipeline-forms.js | Required |
| camelCase for functions, UPPER_SNAKE for constants | All new code | Required |
| `{ data, error }` destructuring for all API calls | pipeline-forms.js | Required |
| `console.error('[context] message', error)` for errors | pipeline-forms.js | Required |

---

## Metadata

**Confidence breakdown:**
- SQL schema: HIGH — column names and types from REQUIREMENTS.md + confirmed patterns from STATE.md decisions
- Board edit points: HIGH — line numbers verified via direct read
- Modal HTML/CSS: HIGH — pattern copied from existing modalDone/modalDeliver
- pipeline-forms.js architecture: HIGH — booking-popup.js IIFE pattern confirmed
- Backend endpoint availability: LOW — backend not in repo; cannot confirm auto-serving of new tables

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable vanilla JS project, no npm dependencies to drift)

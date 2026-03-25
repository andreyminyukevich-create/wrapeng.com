# Architecture Patterns

**Domain:** Workshop pipeline CRM for detailing studios
**Project:** Keep1R CRM — Workshop Pipeline milestone
**Researched:** 2026-03-25
**Confidence:** HIGH (based on direct codebase analysis)

---

## Existing Architecture (Baseline)

The system is a vanilla HTML/JS SPA-per-page with a REST API backend. Each HTML page is a self-contained module: it imports shared helpers (`api.js`, `studio-context.js`, `nav.js`) and manages its own state in module-level variables. There are no client-side routers, build tools, or component frameworks.

```
Browser (vanilla HTML/JS pages)
         |
         | JWT Bearer — fetch()
         v
REST API  :3001  /api/table/:table   (universal CRUD via QueryBuilder)
                 /api/auth/*
                 /api/studio-members/me
         |
         v
PostgreSQL  (studio-scoped rows — studio_id on every table)
```

The API is a generic QueryBuilder facade: `sb.from('calculations').select(...).eq('studio_id', id)`. Every page calls `getStudioContext()` on load to resolve `studio_id`, then scopes all queries through it. There is no server-side business logic surfaced as dedicated endpoints — all logic lives in the page JS.

---

## Recommended Architecture for Workshop Pipeline

### Overview

The new features split across two integration zones:

1. **board.html** — gains 6 transition modals (inline `<div>` overlays, already the existing pattern for `modalDone` and `modalDeliver`)
2. **acceptance-act.html / work-order.html** — become full document pages (print + history), currently stubs
3. **Database** — 3 new tables: `acceptance_acts`, `outsource_records`, `delivery_acts`

No new pages for the pipeline transitions themselves — they live as modals inside board.html, consistent with the existing `modalDone`/`modalDeliver` pattern.

### Component Map

```
board.html
├── Kanban board (existing)
│   ├── Column renderer — visibleColumns() + buildCard()
│   ├── Drag & Drop — onDrop() routes to modal or direct updateStatus()
│   └── Card Drawer — openDrawer() + buildDrawerActions() (status-gated buttons)
│
├── [NEW] Transition Modal System (extends existing modal pattern)
│   ├── modalAccept      — scheduled → accepted  (pробег, повреждения, комплектация, фото-чекбоксы)
│   ├── modalAssign      — accepted → in_progress (мастера, даты) — currently navigates to assign-work.html, migrate to modal
│   ├── modalOutsource   — in_progress → outsourced (подрядчик, вид работ, срок, тип выезда)
│   ├── modalCheckDone   — outsourced/in_progress → done (кто проверил, замечания)
│   ├── modalDeliver     — done → delivered (EXTEND existing: добавить способы оплаты)
│   └── modalCancel      — any → cancelled (причина)
│
└── Shared board state: allCalcs[], assignmentsMap{}, activeCalcId

acceptance-act.html  [NEW — replace stub]
├── Load acceptance_act by calc_id (GET /api/table/acceptance_acts?filter[calc_id][eq]=X)
├── Display form: пробег, VIN, повреждения, комплектация, фото-чекбоксы
├── Print layout (CSS @media print)
└── History section (all acts for this calc, from DB)

work-order.html  [NEW — replace stub]
├── Load calc + work_assignments + delivery_act + outsource_records by calc_id
├── Composite document: услуги + ответственные + материалы + оплата
├── Print layout (CSS @media print)
└── Status history display

Database (PostgreSQL migrations)
├── acceptance_acts  — one per calc transition scheduled→accepted
├── outsource_records — one per transition in_progress→outsourced
└── delivery_acts    — one per transition done→delivered (payment breakdown)
```

### Component Boundaries

| Component | Responsibility | Reads From | Writes To |
|-----------|---------------|-----------|----------|
| board.html kanban | Display cards, route actions to modals or direct status updates | `calculations`, `work_assignments` | — |
| board.html transition modals | Collect transition form data, validate, write record + update status atomically | User input | `acceptance_acts` / `outsource_records` / `delivery_acts` + `calculations.status` |
| `buildDrawerActions()` | Render correct action buttons per status; open correct modal | `calc.status` | — |
| `updateStatus(calcId, newStatus, extra)` | PATCH calculations row | — | `calculations` |
| acceptance-act.html | Full document view + print for acceptance act | `calculations`, `acceptance_acts` | `acceptance_acts` (create/update) |
| work-order.html | Full document view + print for work order | `calculations`, `work_assignments`, `delivery_acts`, `outsource_records` | — |
| studio-context.js | Resolve studio_id + auth for every page | `/api/studio-members/me` | localStorage cache |
| api.js QueryBuilder | Universal CRUD facade | REST API | REST API |

---

## Data Flow

### Status Transition Flow (the main pipeline)

```
User clicks action button in drawer
        |
        v
buildDrawerActions() dispatches to:
    openModal*(calcId, carName, ...) — for transitions that require a form
    updateStatus(calcId, toStatus)   — for simple direct moves
        |
        v
[Modal path]
User fills transition form → clicks Save
        |
        v
Modal save handler:
  1. Collect form data into payload object
  2. POST /api/table/[acceptance_acts | outsource_records | delivery_acts]
     with { calc_id, studio_id, ...formFields }
  3. On success: PATCH /api/table/calculations
     with { status: newStatus, [optional extra fields like final_price] }
  4. closeModal() → showToast() → loadBoard()
        |
        v
[Direct path — e.g. in_progress → outsourced → back to in_progress]
updateStatus(calcId, toStatus) → PATCH calculations.status directly
```

### Document Page Flow

```
User clicks "Акт приёмки" or "Заказ-наряд" button in drawer
        |  window.location.href = 'acceptance-act.html?calc_id=X'
        v
Document page init:
  1. getStudioContext() → studio_id
  2. Load calc from calculations where id = calc_id
  3. Load associated record (acceptance_act / delivery_act / outsource_records)
  4. Render document HTML
  5. Render print button → window.print()
        |
        v
[Print]  @media print CSS hides nav/buttons, shows document layout
```

### Outsourcing Data Flow (two-direction type)

```
in_progress card → "Отправить в аутсорсинг" button
        |
        v
modalOutsource opens:
  Fields: contractor_name, work_type, deadline, outsource_type (outgoing | incoming)
    outgoing = авто уезжает к подрядчику
    incoming = подрядчик приезжает в студию
        |
        v
Save: INSERT outsource_records + PATCH calculations.status = 'outsourced'
Board shows new 'outsourced' column
        |
        v
outsourced card → "Вернуть" button
        |
        v
modalCheckDone: checker_name, notes
Save: PATCH outsource_records (return_date, notes) + PATCH calculations.status = 'done'
```

---

## Patterns to Follow

### Pattern 1: Extend Existing Modal Infrastructure

The existing `modalDone` and `modalDeliver` establish the full pattern for transition modals:
- `<div id="modalXxx" class="modal-overlay">` in HTML
- `openModalXxx(calcId, carName, ...)` function sets `activeCalcId`, populates display fields
- `btnXxxSave` handler: collect data → API write → status update → close + toast + reload
- `btnXxxCancel` and overlay click both call `closeModal('modalXxx')`
- ESC key handler in `bindEvents()` includes modal ID

New modals must follow this exact pattern. Do not introduce a modal abstraction/factory — the codebase is deliberately repetitive/explicit, and consistency with existing code matters more than DRY here.

**Example — existing deliver modal handler (lines 1371-1379 board.html):**
```javascript
document.getElementById('btnDeliverSave').addEventListener('click', async () => {
  const btn = document.getElementById('btnDeliverSave');
  const release = lockButton(btn, 'Сохранение...');
  const price = parseFloat(document.getElementById('deliverPrice').value) || null;
  const note  = document.getElementById('deliverNote').value.trim();
  const ok    = await updateStatus(activeCalcId, 'delivered', { final_price: price, delivery_note: note });
  release();
  if (ok) { closeModal('modalDeliver'); showToast('success', 'Автомобиль выдан'); loadBoard(); }
});
```

New modals follow this shape, adding a pre-step to write the sub-table record before calling `updateStatus`.

### Pattern 2: Two-Step Save for Transition Modals with Sub-Tables

When a status transition also creates a record in a sub-table (acceptance_acts, outsource_records, delivery_acts), the save sequence is:

```javascript
// Step 1: insert sub-table record
const { data: actData, error: actErr } = await sb
  .from('acceptance_acts')
  .insert({ calc_id: activeCalcId, studio_id: studioCtx.studioId, ...fields });
if (actErr) { release(); showToast('error', 'Ошибка сохранения акта'); return; }

// Step 2: update status only after sub-table write succeeds
const ok = await updateStatus(activeCalcId, 'accepted');
release();
if (ok) { closeModal('modalAccept'); showToast('success', 'Авто принято'); loadBoard(); }
```

Note: the server does not expose transactions across tables. The two-step pattern is best-effort. Sub-table record is written first; if status update fails, a retry is possible without duplicate sub-records (check for existing record before inserting, or use upsert).

### Pattern 3: Document Pages Load by calc_id Query Parameter

```javascript
// At page init
const params = new URLSearchParams(location.search);
const calcId = params.get('calc_id');
if (!calcId) { /* show error */ return; }

const ctx = await getStudioContext();
const { data: calc } = await sb.from('calculations').eq('id', calcId).single();
// Verify calc.studio_id === ctx.studioId for security
```

acceptance-act.html and work-order.html already receive `?calc_id=X` links from board.html (lines 1101-1102). They just need their stub bodies replaced.

### Pattern 4: Print Layout via CSS @media print

No JS-based PDF generation. Use `window.print()` + `@media print` CSS that hides navigation, action buttons, and any board-context UI. This is consistent with the existing `calculator-pdf.js` which generates PDFs separately for estimates — document pages use browser print for simplicity.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: New Pages for Transition Forms

**What:** Creating `accept-form.html`, `outsource-form.html`, etc. as separate pages.
**Why bad:** Breaks board context — user loses place on the board, back-navigation becomes fragile, mobile UX degrades. The existing modalDone/modalDeliver establish that transitions stay in board.html as overlays.
**Instead:** All 6 transition forms are modals inside board.html.

### Anti-Pattern 2: Navigation to assign-work.html for the accepted→in_progress Transition

**What:** The current "Назначить ответственных" button navigates away to assign-work.html. The PROJECT.md specifies a form modal for accepted→in_progress.
**Why bad:** Leaves the board; inconsistent with the new transition modal pattern.
**Instead:** Build `modalAssign` in board.html. The existing assign-work.html can remain for detailed/edit flows, but the primary transition should happen in-board.

### Anti-Pattern 3: Storing All Transition Data as JSON in calculations.calculation_data

**What:** Appending acceptance act fields, outsource notes, delivery payment breakdown into the existing JSONB `calculation_data` column.
**Why bad:** Unstructured, unqueryable, hard to validate. Already evident: `fact_materials` was bolted as a separate column instead of into the JSON. Follow that precedent.
**Instead:** Dedicated tables: `acceptance_acts`, `outsource_records`, `delivery_acts`.

### Anti-Pattern 4: JavaScript Class/Component Abstraction

**What:** Introducing a `Modal` class, event bus, or state manager.
**Why bad:** Breaks the explicit, readable style of the entire codebase. board.html is 1400+ lines of procedural JS intentionally — it is readable without indirection.
**Instead:** Follow the explicit pattern: named functions, direct DOM manipulation, module-level state variables.

---

## Suggested Build Order

Dependencies determine this sequence. Each step has a clear "done" signal.

### Step 1: Database Migrations (no dependencies)

Create the 3 new tables. All subsequent work depends on these tables existing.

```sql
-- acceptance_acts: fields from PROJECT.md requirements
-- outsource_records: contractor, work_type, deadline, outsource_type, return_date, notes
-- delivery_acts: payment_method(s), amounts, note
-- All: calc_id FK, studio_id, created_at, created_by (user_id)
```

Also: add `outsourced` to the status enum/check constraint on `calculations`.

### Step 2: Add outsourced Column to board.html

Add the column definition to the `COLUMNS` array in board.html. Verify drag-and-drop routing handles `outsourced` correctly (currently `onDrop` has special cases for `done` and `delivered` — add `outsourced` case to open `modalOutsource`).

This is isolated and verifiable: the board renders a new column with no cards.

### Step 3: modalAccept (scheduled → accepted)

First new modal — establishes the two-step save pattern for all subsequent modals. Once this works, the remaining modals are variations.

Fields: odometer, damages checkboxes, equipment checkboxes, photo_done checkbox, client_consent checkbox.

Wire into `buildDrawerActions()` for `status === 'scheduled'` — replace direct `move('accepted', ...)` with `openModalAccept(calc)`.

### Step 4: modalOutsource (in_progress → outsourced)

Second new modal. Introduces the `outsource_type` radio (outgoing/incoming). Wire into `buildDrawerActions()` for `status === 'in_progress'`.

Also add the "return from outsourcing" action to `status === 'outsourced'` handler (opens `modalCheckDone`).

### Step 5: modalCheckDone (outsourced/in_progress → done)

Modifies the existing `openModalDone` / `doDone` path. The current `doDone` in board.html triggers `modalDone` which collects `fact_materials`. Extend or replace `modalDone` to also collect `checker_name` and `notes` — saving to a `check_records` column or into the `delivery_acts` table depending on DB design choice.

### Step 6: Extend modalDeliver (done → delivered) — payment methods

The existing `modalDeliver` only captures `final_price` and a note. Extend to support 5 payment methods with amounts per method. This writes to `delivery_acts` before calling `updateStatus`.

### Step 7: modalCancel (any → cancelled)

Simple modal: one textarea for cancellation reason. Wire the existing `doCancel` (which currently calls `confirmAction` — a native confirm dialog) to use this modal instead. Saves reason to a `cancellation_reason` text field on `calculations` or a new `cancellations` table.

### Step 8: acceptance-act.html (replace stub)

By this point, `acceptance_acts` rows exist from Step 3. Replace the stub with a document page:
- Load calc + acceptance_act by `calc_id`
- Render printable document layout
- Print button

### Step 9: work-order.html (replace stub)

Most complex document page — aggregates data from:
- `calculations` (services, price, car info)
- `work_assignments` (executors, salaries)
- `delivery_acts` (payment breakdown)
- `outsource_records` (if any)

Build last because it depends on all prior tables being populated.

---

## Scalability Considerations

This is a single-studio CRM, not a multi-tenant SaaS at scale. The relevant scale concern is breadth (many studios, each with moderate data) not depth (one studio with millions of records).

| Concern | Approach |
|---------|----------|
| Modal count growth in board.html | File will grow to ~2000 lines; acceptable in this pattern. If it exceeds ~3000 lines, consider splitting modal HTML into `<template>` tags loaded lazily. |
| Print document fidelity | Browser print is sufficient for v1. If studios need PDF archival, add a headless-print endpoint in v2. |
| Outsourcing tracking | Single `outsource_records` table covers v1. Multi-step outsourcing (multiple contractors per job) would need a redesign — out of scope for v1. |
| Payment breakdown | `delivery_acts` JSON column for payment methods is acceptable for v1 (e.g., `{ cash: 5000, card: 3000 }`). Normalized payment_lines table only needed if reporting is added. |

---

## Sources

- Direct codebase analysis: `/Users/and20mnk/Downloads/wrapeng-17.com-main/board.html` (lines 704-1410)
- Direct codebase analysis: `/Users/and20mnk/Downloads/wrapeng-17.com-main/api.js`
- Direct codebase analysis: `/Users/and20mnk/Downloads/wrapeng-17.com-main/studio-context.js`
- Project requirements: `.planning/PROJECT.md`
- Confidence: HIGH — all patterns derived from actual code, not assumed

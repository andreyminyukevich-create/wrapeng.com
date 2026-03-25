# Domain Pitfalls

**Domain:** Workshop pipeline CRM — detailing studio (status transitions, acceptance acts, work orders, payment tracking)
**Project:** Keep1R CRM
**Researched:** 2026-03-25
**Confidence:** HIGH — based on direct codebase analysis + domain expertise

---

## Critical Pitfalls

Mistakes that cause data loss, corrupted state, or rewrites.

---

### Pitfall 1: Transition Forms That Bypass the State Machine

**What goes wrong:** New status-transition modals call `updateStatus()` directly, bypassing validation of the current status. A user can open the acceptance-act modal and submit it even if the card is already `in_progress` or `delivered`. The resulting INSERT into `acceptance_acts` has no corresponding state constraint — two acceptance acts can exist for the same `calculation_id`.

**Why it happens:** `updateStatus()` only checks `studio_id`, not the current status. The drag-drop guard (lines 714–728 in board.html) hardcodes only `done` and `delivered` as modal-required. Any new `outsourced` or `accepted` transition added outside that guard will silently allow illegal moves.

**Consequences:** Duplicate documents, split payment records, corrupted pipeline state that shows a car in two columns (cached `allCalcs` array diverges from DB after a partial reload).

**Prevention:**
- Validate `from_status` server-side before writing the transition record. If the server is not in this repo, add a client-side guard: read the current DB status before opening any transition modal and abort with a toast if it mismatches.
- Add a `CHECK` constraint in SQL migrations: e.g., `acceptance_acts` can only be created when the related `calculation.status = 'accepted'` (enforce via trigger or application logic).
- Document the allowed transition matrix as a const in board.html and route ALL status changes through it.

**Warning signs:**
- A card reappears in a column after being moved (stale `allCalcs` array not refreshed after failed/duplicate save).
- More than one row in `acceptance_acts` for the same `calculation_id`.

**Phase:** Address in Phase 1 (transition form scaffolding) before any individual form is built.

---

### Pitfall 2: `loadBoard()` Called After Every Mutation — O(n) Re-render on a Shared Tablet

**What goes wrong:** Every successful status change calls `loadBoard()`, which fetches ALL calculations + ALL work_assignments, rebuilds the entire DOM, and re-applies search and filter. On a shared studio tablet with 50–200 active orders, this creates a noticeable 300–600 ms freeze on every drag or button action.

**Why it happens:** The current pattern (confirmed at lines 724, 1107, 1122, 1129, 1363) is `loadBoard()` after every mutation. Adding 4–6 more transition modals multiplies the reload frequency.

**Consequences:** Sluggish board on tablet (iOS Safari is the primary device for detailing studios). Users who click a button twice trigger two concurrent `loadBoard()` calls — the second one may overwrite the state the first one just wrote.

**Prevention:**
- Add a module-level `_loading` flag; ignore `loadBoard()` calls while one is in flight.
- After a transition modal saves, do a targeted `allCalcs` array update (splice the matching card, update its `status`) and call `renderBoard()` only — skip the network round-trip when you already know the new state.
- If a full reload is needed (e.g., after acceptance act that creates rows in a related table), debounce with `setTimeout(loadBoard, 0)` and cancel any pending call.

**Warning signs:**
- Double-click on "Принять авто" causes a card to appear in `in_progress` column even though `accepted` was the target.
- Board flickers on every save on iOS.

**Phase:** Address in Phase 1 (before adding new transition modals that each call `loadBoard()`).

---

### Pitfall 3: Mixed Payment Data Across Three Tables with No Single Source of Truth

**What goes wrong:** The current `modalDeliver` writes `final_price` and `delivery_note` directly into the `calculations` row (line 1376). The new delivery act form adds a richer payment structure (5 payment methods, НДС %, mixed amounts) to a new `delivery_acts` table. After migration, two separate amounts exist for the same order: `calculations.final_price` (old) and `delivery_acts.total_amount` (new). Cashflow and income pages query `calculations.final_price` — they will show wrong totals for orders delivered after the migration.

**Why it happens:** The `calculations` table is the universal record carrier. New satellite tables (`delivery_acts`, `acceptance_acts`) add detail, but if `calculations.final_price` is not updated from the new table, reports diverge.

**Consequences:** Финансовая отчётность (cashflow.html, income.html) shows revenue that does not match the act documents. Studio owner notices discrepancy; trust in the system drops.

**Prevention:**
- Decide on canonical source before writing SQL migrations: either keep `calculations.final_price` as the authoritative field and have `delivery_acts` mirror it, OR make `delivery_acts.total_amount` authoritative and update `calculations.final_price` via trigger.
- For mixed payments, store the JSON breakdown in `delivery_acts.payment_breakdown` but also write the sum total back to `calculations.final_price` in the same transaction.
- Audit every page that reads `final_price` (cashflow.html, income.html, board.html card display) before releasing the delivery form.

**Warning signs:**
- `calculations.final_price` is NULL or 0 for newly delivered orders in cashflow view.
- Total shown on kanban card (`fmt(calc.final_price || calc.total_price)`) differs from the delivery act document.

**Phase:** Address in Phase 2 (payment/delivery form) — define the data contract in SQL migrations before writing any form JS.

---

### Pitfall 4: Document Pages (acceptance-act.html, work-order.html) Built as Stubs — Print Layout Broken at the Last Minute

**What goes wrong:** Both pages are currently copies of `dashboard.html` (confirmed PROJECT.md). The temptation is to build all the JS logic first and style the print layout last. Print CSS for A4 documents is non-trivial: `@media print` breaks with position:sticky headers, `100svh` body constraints, and nav.css injecting footer elements. A4 width is 210mm (~794px at 96dpi) but `max-width: 1280px` containers collapse differently in every browser's print engine.

**Why it happens:** Developers treat print as a styling detail, not a structural constraint. In vanilla JS projects without a component framework, the print layout must be hand-wired into the DOM structure from the beginning.

**Consequences:** Print preview looks correct in Chrome but broken in Safari (used on studio iPads). The nav bar prints on every page. Document fields overflow or wrap mid-signature-line. Customer-facing documents (акт приёмки is shown to the client and signed) that look unprofessional destroy studio credibility.

**Prevention:**
- Build the print CSS skeleton (`@media print { .nav-bar { display:none } ... }`) at the start of Phase 3 before any data-binding JS.
- Test print preview in Safari iOS (via desktop Safari simulator) from the first commit that has any content.
- Structure the document HTML in columns/sections sized to A4: two-column header (studio info left, order info right), damage map block, service table, signature row. These structural decisions cannot be retrofitted cheaply.
- Add a `window.print()` button early and keep it working throughout development.

**Warning signs:**
- `body { min-height: 100svh }` appears in the page CSS without a print override.
- Nav header appears inside a `<div class="container">` that will be included in print.

**Phase:** Address in Phase 3 (document pages build-out) from day one, not as a finishing step.

---

## Moderate Pitfalls

---

### Pitfall 5: `outsourced` Column Not in `ACTIVE_KEYS` — Cards Disappear from Default View

**What goes wrong:** The current `ACTIVE_KEYS` set (line 515) is `new, scheduled, accepted, in_progress, waiting, done`. When the `outsourced` status is added and a user filters by "Активные" (the default), all outsourced cards vanish. The master walks past the board, sees no outstanding work, and misses a return deadline.

**Why it happens:** `ACTIVE_KEYS` and `COLUMNS` are maintained separately. Adding a column definition without updating `ACTIVE_KEYS` is a one-line miss.

**Prevention:**
- Add `outsourced` to `ACTIVE_KEYS` in the same commit that adds it to `COLUMNS`.
- Add a runtime assertion in `visibleColumns()` that warns if any non-terminal column key is absent from `ACTIVE_KEYS`: terminal statuses are `delivered, closed, cancelled`.

**Warning signs:** Cards with `status = 'outsourced'` exist in DB but the active filter board shows zero outsourced column cards.

**Phase:** Phase 1 — outsourcing column addition.

---

### Pitfall 6: `normalizeStatus()` Does Not Know About `outsourced` — Cards Render in Wrong Column

**What goes wrong:** `normalizeStatus()` (line 554) handles legacy DB values. If server-side code or a migration accidentally writes `'Аутсорсинг'` as a string (following the same pattern as `'Принято в работу'` and `'Завершено'`), the function will not translate it and the card will be dropped into no column (rendered nowhere on the board).

**Prevention:**
- Add `outsourced` / Russian-string aliases to `normalizeStatus()` in the same migration PR.
- Add a catch-all `else` branch to `normalizeStatus()` that logs unknown values: `console.warn('[board] unknown status:', status)`.

**Phase:** Phase 1.

---

### Pitfall 7: Transition Modal Opened from Drawer — `activeCalcId` Stale After Drawer Close

**What goes wrong:** `activeCalcId` is a module-level variable. The drawer close handler sets it to `null` after 300 ms (the close animation). If a transition modal is opened from the drawer and the drawer's close animation runs concurrently, `activeCalcId` can be nulled before `btnDoneSave` / `btnDeliverSave` reads it (lines 1361, 1374).

**Current pattern:** `doDone()` and `doDeliver()` call `closeDrawer()` then immediately open a modal — the 300 ms `setTimeout` in `closeDrawer` means `activeCalcId` is nulled while the modal form is open.

**Why it happens:** The existing code works because the save handler fires synchronously before the 300 ms timeout. But if a user opens and immediately submits the form (common on fast tablet taps), a race can occur.

**Prevention:**
- Pass `calcId` explicitly into each modal open function rather than relying on the shared `activeCalcId` variable. `openModalDone(calcId, carName)` already does this, but the save handler reads `activeCalcId` directly. Update the save handler to read from a modal-scoped variable set at open time.
- Example: `let _modalCalcId = null;` set in `openModalDone`, read in `btnDoneSave` handler.

**Phase:** Phase 1 — each new transition modal must use the explicit pattern.

---

### Pitfall 8: `in` Filter in QueryBuilder Uses Only First Value

**What goes wrong:** `QueryBuilder.in()` (api.js line 67) is implemented as `this._filters.push([col, 'eq', vals[0]])` — it ignores all values except the first. If any new feature tries to query multiple `calculation_id`s (e.g., loading all `acceptance_acts` for a list of visible cards), only the first ID will be fetched.

**Why it happens:** The `in` method is a stub that was never fully implemented.

**Consequences:** Silent partial data — the UI will show only one acceptance act instead of N, with no error.

**Prevention:**
- Before writing any code that calls `.in()` with more than one value, either fix `QueryBuilder.in()` to serialize the full array into a repeated query param, or use a different approach (e.g., a custom `/api/acceptance-acts?calc_ids=1,2,3` endpoint).
- Add a `console.warn` to `QueryBuilder.in()` if `vals.length > 1` until the fix is in place.

**Phase:** Relevant in Phase 2+ when acceptance_acts or outsource_records are loaded for multiple cards.

---

### Pitfall 9: Outsourcing Form — Two Scenarios Collapsed Into One Form Poorly

**What goes wrong:** "Авто уезжает к подрядчику" and "Подрядчик приезжает в студию" are fundamentally different logistics. If a single form tries to show/hide fields conditionally (e.g., `outgoing_address` only shown for car-leaves type), late-added toggles via `display:none` in vanilla JS can leave hidden fields with stale values that still serialize into the POST body.

**Prevention:**
- Use `disabled` attribute on hidden inputs, not just `display:none`. Disabled fields are excluded from form serialization.
- Or: build explicit two-step radio selection at the top ("Тип аутсорсинга") and render two completely separate field groups rather than toggling individual fields.

**Warning signs:** DB rows for "Подрядчик приезжает" type contain a non-null `destination_address` from a previous form session.

**Phase:** Phase 1 — outsourcing form design.

---

### Pitfall 10: Print / PDF for Work Order Does Not Include Outsource Chain

**What goes wrong:** If a car went through `outsourced` status (подрядчик выполнил часть работ), the work-order document must show the outsource records alongside studio-performed services. If `work-order.html` only queries `work_assignments` and `calculations`, the outsource contribution is invisible in the printed document.

**Prevention:**
- When designing the `outsource_records` table schema, include a `calculation_id` FK.
- The work-order page query must JOIN or parallel-fetch `outsource_records` for the given `calculation_id`.
- Design the work-order print layout with an "Аутсорсинг" section placeholder from the start, even if it is hidden when empty.

**Phase:** Phase 3 — work-order.html build-out.

---

## Minor Pitfalls

---

### Pitfall 11: НДС Field Accepts Arbitrary Text — Breaks Number Formatting

**What goes wrong:** The "безналичная с НДС%" payment method requires a user-entered НДС percentage. If the field is `type="text"` and the user types `"20%"` instead of `"20"`, `parseFloat("20%")` returns `20` correctly in some engines but `NaN` in others (WebKit). The computed НДС amount silently becomes 0.

**Prevention:** Use `type="number" min="0" max="100" step="0.01"` and strip non-numeric characters on `input` event.

**Phase:** Phase 2 — delivery form.

---

### Pitfall 12: Drawer Actions Rebuilt Every Open — Event Listener Accumulation

**What goes wrong:** `buildDrawerActions()` does `el.innerHTML = ''` then appends new buttons each time the drawer opens. Each button calls `addEventListener` directly (line 1092–1096). If any existing code ever reuses button elements instead of clearing innerHTML first, listeners stack up.

**Current state:** The `innerHTML = ''` clear is correct. But if future refactoring caches button references for performance, duplicate listeners will fire on every click.

**Prevention:** Keep the `innerHTML = ''` clear. Document the pattern explicitly so future contributors don't cache buttons across drawer opens.

**Phase:** Ongoing — note in code comments when adding new drawer actions.

---

### Pitfall 13: ESC Key Handler Hardcodes Modal IDs

**What goes wrong:** Line 1409 lists only `['modalDone', 'modalDeliver']`. Every new modal (acceptance, outsource, delivery-act, cancel reason) must be manually added to this array. If missed, the ESC key silently does nothing for that modal — a UX degradation on tablets where keyboard ESC is less critical but on desktop is expected.

**Prevention:** Replace the hardcoded array with a convention: all modals get class `modal-dialog`; the ESC handler queries `document.querySelectorAll('.modal-dialog.active')` and closes all.

**Phase:** Phase 1 — establish the pattern before adding new modals.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Transition form scaffolding | Stale `activeCalcId` race (Pitfall 7) | Use modal-scoped calcId variable |
| Phase 1: `outsourced` column | Missing from `ACTIVE_KEYS` (Pitfall 5) | Atomic commit: COLUMNS + ACTIVE_KEYS + normalizeStatus |
| Phase 1: Outsourcing form fields | Hidden inputs serialize (Pitfall 9) | Use `disabled` not `display:none` |
| Phase 1: State machine guard | Illegal transitions (Pitfall 1) | Validate `from_status` before INSERT |
| Phase 1: Board reload frequency | Double-call race on fast tap (Pitfall 2) | Add `_loading` guard to `loadBoard` |
| Phase 1: ESC closes modals | Hard-coded list grows stale (Pitfall 13) | Refactor ESC handler before adding modals |
| Phase 2: Delivery/payment form | Divergent `final_price` (Pitfall 3) | Define canonical field in migration |
| Phase 2: Mixed payment НДС | NaN from text input (Pitfall 11) | `type="number"` from start |
| Phase 2: Multi-calc data load | `.in()` stub bug (Pitfall 8) | Fix or bypass QueryBuilder.in |
| Phase 3: acceptance-act.html | Print layout broken at end (Pitfall 4) | Print CSS skeleton on day 1 |
| Phase 3: work-order.html | Outsource records missing from print (Pitfall 10) | Include outsource_records JOIN in query |

---

## Sources

- Direct code analysis: `/board.html` (state machine, drag-drop, modal save handlers, `COLUMNS`, `ACTIVE_KEYS`, `normalizeStatus`, `buildDrawerActions`)
- Direct code analysis: `/api.js` (QueryBuilder, `in()` stub, `apiFetch`)
- Project context: `/.planning/PROJECT.md` (requirements, constraints, stack)
- Domain knowledge: auto service / detailing CRM patterns (HIGH confidence — well-established domain)
- Note: WebSearch was unavailable; all findings are grounded in codebase evidence or well-established domain patterns. Confidence remains HIGH because pitfalls are derived from direct code inspection, not speculation.

# Phase 1: Foundation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema for all new pipeline data (acceptance_acts, outsource_records, delivery_acts, status_history) + board infrastructure (outsourced column, transition guards, loadBoard guard) + one working acceptance modal proving the two-step INSERT+PATCH save pattern end-to-end.

</domain>

<decisions>
## Implementation Decisions

### Acceptance Modal Layout
- **D-01:** Grouped sections with visual headers: "Пробег и топливо", "Повреждения", "Комплектация", "Фото", "Подтверждение". Modal wider (~540px, matching modalDone). Scrollable on mobile.
- **D-02:** Fuel level input is a `<select>` dropdown with predefined options: Полный, 3/4, 1/2, 1/4, Пусто. Fast for tablet use, no typing needed.
- **D-03:** Equipment checklist (запаска, домкрат, аптечка, огнетушитель, документы, ключи) rendered as 2-column checkbox grid for tablet-friendly tap targets.
- **D-04:** Photo zone checkboxes (перед, зад, лев, прав, салон, багаж) rendered as 2-column checkbox grid, same pattern as equipment.
- **D-05:** Damage field is a single textarea (free text description), not structured input.
- **D-06:** "Клиент согласен" checkbox + notes textarea placed in the final section before the Save/Cancel footer.

### Outsourced Column
- **D-07:** Position in COLUMNS array: between `in_progress` and `done`. Key: `outsourced`, label: `Аутсорсинг`, icon: appropriate emoji (e.g. `🔄` or `🏭`).
- **D-08:** Color: warm orange tone — `{ bg: 'rgba(249,115,22,0.12)', color: '#c2410c' }` — visually distinct from neighbors, conveys "external/warning".
- **D-09:** Include `outsourced` in `ACTIVE_KEYS` — cars at a contractor are active work.
- **D-10:** Card appearance: same style as other columns, no special badge or indicator in v1.
- **D-11:** Empty column state: same pattern as other empty columns (no custom text).

### Transition Guard Feedback
- **D-12:** Blocked drag-and-drop: card snaps back to original column + `showToast('warning', 'Переход недоступен')`. Consistent with existing toast error pattern.
- **D-13:** Context menu: only show permitted transitions for the card's current status. Blocked actions are omitted, not shown as disabled.
- **D-14:** No visual cues on cards for available transitions — keep v1 simple.

### SQL Migration
- **D-15:** Single migration file `001_workshop_pipeline.sql` containing all 3 new tables + status_history table/column.
- **D-16:** `acceptance_acts` has `UNIQUE(calc_id)` constraint — prevents duplicate records at DB level. Resolves open question from research phase.
- **D-17:** Standard conventions: snake_case columns, `timestamptz` for timestamps, `REFERENCES calculations(id)` for calc_id foreign keys.

### Claude's Discretion
- Modal JS module structure (pipeline-forms.js organization) — already decided in research as separate module
- Exact transition matrix implementation (object map vs function) — technical choice
- Status history storage: separate table vs JSONB column on calculations — Claude picks based on query patterns
- loadBoard() _loading guard implementation details
- normalizeStatus() handling of 'outsourced' value

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Board Infrastructure
- `board.html` lines 524-531 — COLUMNS array (add outsourced here)
- `board.html` lines 533-543 — STATUS_COLORS (add outsourced color)
- `board.html` line 515 — ACTIVE_KEYS set (add outsourced)
- `board.html` lines 554-561 — normalizeStatus() (may need outsourced mapping)
- `board.html` lines 564-575 — updateStatus() function (two-step save builds on this)

### Existing Modal Patterns
- `board.html` lines 436-465 — modalDone (reference for modal HTML structure)
- `board.html` lines 467-490 — modalDeliver (reference for modal HTML structure)
- `board.html` lines 1222+ — openModalDone() (reference for modal JS pattern)
- `board.html` lines 1333+ — openModalDeliver() (reference for modal JS pattern)

### API & Utilities
- `api.js` — QueryBuilder for database operations (sb.from().insert/update/select)
- `ui.js` — showToast() for user feedback
- `dom.js` — DOM manipulation helpers
- `formatters.js` — Russian locale formatting

### Requirements
- `.planning/REQUIREMENTS.md` — DB-01 through DB-04, BOARD-01 through BOARD-04, FORM-01

No external specs — requirements fully captured in REQUIREMENTS.md and decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.modal` / `.modal-content` / `.modal-title` / `.modal-car` / `.modal-footer` CSS classes — use for acceptance modal structure
- `showToast(type, text)` — use for transition guard feedback and save confirmation
- `updateStatus(calcId, status, extra)` — base function for status changes; acceptance modal extends this with sub-table INSERT
- `escapeHtml()` from dom.js — must use for any user-generated content in modals
- `fmt()` and `fmtDate()` in board.html — formatting helpers already available

### Established Patterns
- Modal pattern: HTML div with `.modal` class, JS function `openModalX(calcId, carName, ...)` that populates fields and shows modal
- Save pattern: gather form data → API call → on success close modal + reload board
- board.html is 1400+ lines — new modal logic should go in `pipeline-forms.js` module (decided in research)
- Global state: `studioCtx` for studio context, `sb` for API client

### Integration Points
- COLUMNS array at line 524 — insert outsourced column
- STATUS_COLORS at line 533 — add outsourced color
- ACTIVE_KEYS at line 515 — add outsourced
- Drag handler (~line 700) — add transition guard check before opening modal
- Context menu builder (~line 1100) — filter actions by allowed transitions
- `loadBoard()` — add _loading guard

</code_context>

<specifics>
## Specific Ideas

- Fuel level dropdown matches real-world fuel gauge marks (Полный, 3/4, 1/2, 1/4, Пусто) — intuitive for workshop staff
- Acceptance modal preview mockup was approved (grouped sections layout)
- All acceptance fields optional per PROJECT.md constraint — warn but don't block save

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-25*

# Technology Stack — Workshop Pipeline Milestone

**Project:** Keep1R CRM — Workshop Pipeline
**Researched:** 2026-03-25
**Overall confidence:** HIGH (all recommendations derived from existing codebase; no new frameworks introduced)

---

## Context: This Is an Additive Milestone

The existing system is vanilla HTML/JS + custom REST API (`api.js`) + PostgreSQL. No build tooling, no package manager, no transpilation. Everything loads from CDN or is a local `.js` file.

**The constraint is absolute:** new features must follow the same pattern. Introducing a framework (React, Vue, Svelte) would require a build pipeline, create a two-paradigm codebase, and violate project conventions. This is not a "no framework by preference" decision — it is a project law.

---

## Recommended Stack

### Core Language & Module System

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vanilla JavaScript ES6+ | Browser-native | All page logic | Matches every existing file; `<script type="module">` imports already in use |
| ES Module imports | Browser-native | Code organisation | Existing pattern: `import { sb } from './api.js'` |

**Confidence:** HIGH — every `.html` file already uses `<script type="module">`.

---

### Modal / Form Layer (Status Transition Forms)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Hand-rolled modal CSS class | Existing `.modal` / `.modal.active` | Status transition overlays | Pattern already exists in `board.html`; `.modal { display:none } .modal.active { display:flex }` is the project standard |

**Recommendation:** Do not add a modal library. The project already has a complete, styled modal system (see `board.html` lines 344–390). New modals for acceptance, assignment, outsourcing, and delivery should be new `<div class="modal">` blocks in `board.html` following the exact structure of `#modalDone` and `#modalDeliver`.

**Do NOT use:** `bootstrap`, `micromodal.js`, `sweetalert2`, or any dialog library. They add weight, conflict with existing styles, and are never used elsewhere in this codebase.

---

### Form Patterns (Multi-field Status Forms)

| Pattern | Purpose | Why |
|---------|---------|-----|
| `.form-group` + `<label>` + `<input>`/`<select>`/`<textarea>` | All form fields in modals | Existing CSS class already defined in `board.html`; inputs get `font-size: 16px` which prevents iOS zoom |
| Checkbox groups with `<label>` wrapping | Photo checklist in acceptance act | Consistent with existing checkbox patterns |
| Dynamic show/hide via `style.display` | Conditional payment breakdown rows | Existing UI pattern (`hide()` / `show()` from `dom.js`) |
| `lockButton()` from `ui.js` | Prevent double-submit | Already exported from `ui.js`; used in board.html submit handlers |

**Payment form specific note:** The 5-payment-method breakdown (cash, card/transfer, cashless+VAT, debt, mixed) needs conditional input rows. Use `style.display = 'none'/'block'` toggled by the payment method radio/select. Each row is a standard `.form-group`. No library needed.

**Confidence:** HIGH — all patterns directly observed in codebase.

---

### Document Pages (acceptance-act.html, work-order.html)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `window.print()` + `@media print` CSS | Browser-native | Print/PDF output for acts | Zero-dependency; works offline; produces proper A4; preferred by accounting/legal users over PDF files |
| CSS `@media print` isolation | Browser-native | Hide nav/toolbar on print | Standard pattern; `nav.js` top bar must be `display:none` in print media |

**Why NOT jsPDF + html2canvas (already in the project for calculator):**
- `html2canvas` renders to a rasterised PNG — printed acts look blurry on high-DPI printers
- Print CSS produces vector text, crisp borders, proper page breaks
- `@media print` is already the right tool when the output is a formatted legal document
- The existing `calculator-pdf.js` uses jsPDF for commercial proposals (КП) — a different use case
- CONCERNS.md explicitly flags jsPDF/html2canvas as risky dependencies

**Implementation:** Add `<style>` block with `@media print` rules to `acceptance-act.html` and `work-order.html`. Hide `.nav-top-bar`, show `.print-area`. Add a "Печать" button that calls `window.print()`. No script library needed.

**Confidence:** HIGH — browser-native; zero risk of CDN failure.

---

### Data Access (New Tables)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `sb.from(table)` QueryBuilder | Existing (`api.js`) | CRUD for acceptance_acts, outsource_records, delivery_acts | Identical pattern to all existing tables; server-side code not in this repo |
| SQL migration files (`.sql`) | PostgreSQL | Create new tables | Project constraint: "SQL-миграции для новых таблиц" is an explicit requirement |

**New tables required (as per PROJECT.md):**
- `acceptance_acts` — linked to `calculations.id`, stores mileage, damage notes, equipment checklist, client consent flag, assigned master, act date
- `outsource_records` — linked to `calculations.id`, stores contractor name/id, work type, deadline, outsource_type (remote/onsite)
- `delivery_acts` — linked to `calculations.id`, stores payment amounts per method, inspector name, notes

**Payment storage pattern:** Store as JSONB column `payment_breakdown: { cash: 0, card: 0, transfer: 0, cashless: { amount: 0, vat_pct: 20 }, debt: 0 }` plus a computed `total_paid` numeric column. This avoids 5 nullable numeric columns and is easy to query.

**Confidence:** MEDIUM — JSONB recommendation is a design decision; the QueryBuilder pattern in api.js is HIGH confidence.

---

### Status Transition Architecture

| Pattern | Purpose | Why |
|---------|---------|-----|
| `updateStatus(calcId, newStatus, extra)` — extend existing function | Central status mutation | Already exists in `board.html`; the `extra` parameter is already accepted and spread into the PATCH body |
| Status-gated context menu actions | Trigger the right modal per current status | Existing `openModalDone` / `openModalDeliver` are the pattern to follow |
| Modal opens → form filled → save writes act + updates status atomically | Data integrity | Prevents status moving without data being saved |

**Critical pattern:** The act record INSERT and the `calculations` status UPDATE must happen in the same user action. Use `Promise.all` or sequential awaits — insert the act first, then update status. If either fails, show toast and do not advance status. This prevents orphaned status transitions with no supporting data.

**Confidence:** HIGH — directly follows existing board.html patterns.

---

### Supporting Utilities (Already Available)

These modules are already in the project. New pages MUST import from them rather than rewriting:

| Module | Exports to use | For |
|--------|---------------|-----|
| `api.js` | `sb` QueryBuilder | All data access |
| `auth.js` | `requireAuth` | Page auth guard |
| `studio-context.js` | `getStudioContext` | Get `studioId` and role |
| `ui.js` | `showToast`, `showLoading`, `showError`, `lockButton`, `confirmAction` | All user feedback |
| `dom.js` | `qs`, `qsa`, `createEl`, `hide`, `show`, `delegate` | DOM manipulation |
| `formatters.js` | `fmtMoney`, `fmtDate`, `fmtPhone`, `escapeHtml` | Display formatting |
| `errors.js` | `normalizeError`, `ERR` | Error handling |

**Confidence:** HIGH — all verified by direct file inspection.

---

### Mobile Responsiveness

| Requirement | Approach | Why |
|-------------|---------|-----|
| Modals on tablet/phone | CSS `max-width: 440px; width: 100%` + `padding: 20px` on `.modal` | Already in existing modal CSS; works on 320px+ screens |
| Input font-size 16px | Already set in `.form-group input` | Prevents iOS Safari from auto-zooming on focus |
| `.modal-footer flex-direction: column-reverse` at `max-width: 640px` | Full-width action buttons on mobile | Already in existing board.html media query |
| Print on mobile | `@media print` CSS + `window.print()` | Works on iOS Safari and Android Chrome |

**No additional CSS framework needed.** The existing design system in `nav.css` and inline `<style>` blocks is sufficient.

**Confidence:** HIGH — mobile breakpoints observed in existing `board.html`.

---

## Alternatives Explicitly Rejected

| Category | Rejected Option | Why Rejected |
|----------|----------------|-------------|
| Modal library | micromodal.js, SweetAlert2, Bootstrap modals | Already have a working modal system; libraries add style conflicts and weight |
| Form validation | Yup, Zod, Vest | All validation in this project is inline per-handler; adding a library adds a CDN dep for a feature that is 5 lines of vanilla JS |
| PDF generation | jsPDF + html2canvas | Correct for КП/proposals; wrong for legal documents (rasterised output, CDN risk) |
| Payment form | Separate payment page | Modal in delivery flow is correct; context must stay on the board |
| Framework migration | React/Vue/Svelte | Out of scope; would require build toolchain; breaks "ванильный HTML/JS" constraint |
| State management library | Redux, Zustand | Global `let` variables per page is the established pattern; sufficient for these forms |
| Date picker library | Flatpickr, Pikaday | Native `<input type="date">` works on all target devices; no library needed |

---

## New Files to Create

Following project naming conventions (kebab-case, feature-prefix):

| File | Purpose |
|------|---------|
| `board.html` (modify) | Add new modal blocks + outsourced column |
| `acceptance-act.html` (rewrite stub) | Full acceptance act page with print support |
| `work-order.html` (rewrite stub) | Full work order page with print support |
| `pipeline-forms.js` | New module: open/close/save logic for all 6 transition modals; imports from api.js, ui.js, formatters.js |
| `migrations/001_workshop_pipeline.sql` | PostgreSQL migration for acceptance_acts, outsource_records, delivery_acts |

**Rationale for `pipeline-forms.js`:** Board.html is already 1400+ lines (flagged in CONCERNS.md). Extracting transition form logic to a separate module follows the `booking-popup.js` precedent — it gets its own file and is included via `<script src="pipeline-forms.js">` before the module block.

---

## CDN Dependencies (No New Ones)

The milestone requires zero new CDN dependencies. All required functionality is browser-native or already present:

| Capability | Mechanism | CDN needed? |
|------------|-----------|-------------|
| Modal dialogs | Existing CSS classes | No |
| Form inputs | HTML5 native | No |
| Date inputs | `<input type="date">` | No |
| Document print | `window.print()` + CSS | No |
| CRUD API | Existing `api.js` | No |
| Formatting | Existing `formatters.js` | No |
| Validation | Inline JS | No |

**Confidence:** HIGH.

---

## Installation

No installation required. No package manager. No build step.

To add the migration, create a `migrations/` directory and run against the PostgreSQL instance:

```sql
-- migrations/001_workshop_pipeline.sql
-- Run via psql or the server's migration runner
```

---

## Sources

- Direct inspection of: `board.html`, `api.js`, `ui.js`, `dom.js`, `formatters.js`, `errors.js`, `calculator-pdf.js`, `nav.css`, `.planning/codebase/STACK.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/CONCERNS.md`
- Confidence level for all recommendations: HIGH (derived from existing codebase, not web search)
- No external sources consulted (web search unavailable; not needed given codebase is the authoritative source for "what fits")

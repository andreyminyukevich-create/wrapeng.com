# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 01-foundation
**Areas discussed:** Acceptance modal UX, Outsourced column behavior, Transition guard feedback

---

## Acceptance Modal UX

### Modal Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped sections | Split into visual groups with section headers, wider modal (~540px), scrollable | :heavy_check_mark: |
| Flat scrollable list | All fields in single flat list, no headers. Simpler but harder to scan | |
| Collapsible accordion | Each section expand/collapse. Compact but adds interaction overhead | |

**User's choice:** Grouped sections
**Notes:** User selected after reviewing ASCII mockup preview showing all 5 sections.

### Fuel Level Input

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown select | Predefined: Полный, 3/4, 1/2, 1/4, Пусто. Fast on tablet | :heavy_check_mark: |
| Numeric input (0-100%) | Free text number. More precise but slower on tablet | |
| You decide | Claude picks | |

**User's choice:** Dropdown select
**Notes:** None

---

## Outsourced Column Behavior

**User's choice:** Delegated to Claude's judgment
**Notes:** User requested Claude use best judgment on all technical decisions. Decisions made:
- Position between in_progress and done
- Orange color scheme for visual distinction
- Included in ACTIVE_KEYS
- Standard card appearance, no special badge
- Standard empty state

---

## Transition Guard Feedback

**User's choice:** Delegated to Claude's judgment
**Notes:** User requested Claude use best judgment. Decisions made:
- Toast warning on blocked drag (card snaps back)
- Context menu omits blocked transitions (not shown disabled)
- No visual cues on cards for v1

---

## SQL Migration Structure

**User's choice:** Delegated to Claude's judgment (area not selected for discussion)
**Notes:** Single migration file, UNIQUE constraint on acceptance_acts(calc_id), standard naming conventions.

---

## Claude's Discretion

- Pipeline-forms.js module structure (decided in research phase)
- Transition matrix implementation approach
- Status history storage mechanism
- loadBoard() guard implementation
- normalizeStatus() outsourced handling

## Deferred Ideas

None — discussion stayed within phase scope

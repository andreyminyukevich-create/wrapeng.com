---
plan: 04-01
status: complete
started: 2026-03-25
completed: 2026-03-25
---

## Summary

Created calculations.html — a new list page showing recent calculations with filter tabs and funnel routing modals.

## What Was Built

### calculations.html (617 lines)
- **List page** showing last 50 calculations as responsive card grid (3→2→1 columns)
- **Filter tabs**: Все / Черновики / В работе / Завершённые
- **Card content**: car name, price, status badge, date, action buttons
- **Sales funnel modal**: captures client name, phone (required), source, comment → updates status to `scheduled`
- **Workshop funnel modal**: captures client name, phone (required), VIN, plate number, source, comment → updates status to `scheduled`
- **Funnel buttons** only shown on draft calculations (not yet routed)
- "Новый расчёт" button links to calculator.html
- Full auth + studio context check
- Modal CSS matching board.html design system

### nav.js update
- "Расчёты" nav link changed from calculator.html → calculations.html

## Key Files

- `calculations.html` — new file
- `nav.js` — line 33 href updated

## Commits
- `93a8f11` feat(04-01): create calculations.html list page with funnel routing modals
- `ca550c0` feat(04-01): update nav to point Расчёты to calculations.html list page

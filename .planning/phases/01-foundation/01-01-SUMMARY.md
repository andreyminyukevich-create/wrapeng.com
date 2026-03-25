---
phase: 01-foundation
plan: 01
status: complete
started: 2026-03-25
completed: 2026-03-25
---

## Summary

Created the database foundation and board infrastructure for the workshop pipeline.

## What Was Built

1. **SQL Migration** (`migrations/001_workshop_pipeline.sql`) — 4 new tables:
   - `acceptance_acts` — vehicle acceptance records with equipment/photo JSONB, UNIQUE(calc_id)
   - `outsource_records` — outsourcing tracking with contractor info and return timestamps
   - `delivery_acts` — delivery/payment records with JSONB payment breakdown
   - `status_history` — transition audit log with composite index on (calc_id, created_at)

2. **Outsourced Column** (`board.html`) — new "Аутсорсинг" column:
   - Positioned between "В работе" and "Проверено" in COLUMNS array
   - Orange color theme (#f97316 / #c2410c) in STATUS_COLORS and CSS
   - Included in ACTIVE_KEYS for active filter visibility

3. **loadBoard() Guard** (`board.html`) — `_loading` flag prevents concurrent API calls with try/finally cleanup

## Key Files

### Created
- `migrations/001_workshop_pipeline.sql`

### Modified
- `board.html` — ACTIVE_KEYS, COLUMNS, STATUS_COLORS, CSS, loadBoard() guard

## Deviations

None — all changes match plan specifications exactly.

## Self-Check: PASSED
- [x] 4 CREATE TABLE statements in migration
- [x] UNIQUE(calc_id) on acceptance_acts
- [x] CREATE INDEX on status_history
- [x] Outsourced column in COLUMNS between in_progress and done
- [x] Outsourced in ACTIVE_KEYS
- [x] STATUS_COLORS has outsourced entry
- [x] CSS rules for .col-outsourced
- [x] _loading guard in loadBoard()

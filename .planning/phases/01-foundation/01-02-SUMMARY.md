---
phase: 01-foundation
plan: 02
status: complete
started: 2026-03-25
completed: 2026-03-25
---

## Summary

Added transition guards, status history recording, and acceptance modal to complete the board's pipeline foundation.

## What Was Built

1. **Transition Guards** (`board.html`) — ALLOWED_TRANSITIONS matrix with isAllowed() check in onDrop() and drawer menus. Illegal transitions show "Переход недоступен" toast.

2. **Status History** (`board.html`) — updateStatus() inserts into status_history table after every successful status PATCH (fire-and-forget).

3. **Acceptance Modal** (`pipeline-forms.js`) — IIFE module with 5-section form (mileage/fuel, damages, equipment, photos, confirmation). Two-step save: INSERT acceptance_acts then PATCH status. Duplicate key (23505) handled gracefully.

4. **Drawer Updates** (`board.html`) — outsourced status actions, scheduled->accepted opens modal, accepted->in_progress redirects to assign-work.html.

5. **Window Globals** (`board.html`) — _boardCtx, _updateStatus, _loadBoard, _sb, _showToast exposed for pipeline-forms.js cross-scope access.

## Additional Work (Outside Plan)

- Fixed calculator-persistence.js duplicate `const sb` declaration (pre-existing bug)
- Added outsourced to calculations CHECK constraint on server
- Added 4 pipeline tables to API ALLOWED whitelist
- Generated 727 demo cards with realistic services data

## Key Files

### Created
- `pipeline-forms.js`

### Modified
- `board.html`

## Deviations

- showToast required window._showToast bridge (ES module not accessible from IIFE)
- accepted->in_progress redirects to assign-work.html instead of direct status change (user requirement)

## Self-Check: PASSED
- [x] ALLOWED_TRANSITIONS with all 8 status keys
- [x] onDrop() checks isAllowed() before any action
- [x] status_history insert in updateStatus()
- [x] Window globals exposed
- [x] pipeline-forms.js with acceptance modal
- [x] Duplicate save handled (23505)
- [x] Outsourced drawer actions
- [x] ESC handler includes modalAccept

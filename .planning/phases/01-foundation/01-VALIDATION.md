---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — vanilla HTML/JS project with no test runner |
| **Config file** | None |
| **Quick run command** | Manual browser testing (open board.html) |
| **Full suite command** | Manual QA checklist (see Per-Task Verification Map) |
| **Estimated runtime** | ~5 minutes manual QA |

---

## Sampling Rate

- **After every task commit:** Open board.html, verify no JS console errors
- **After every plan wave:** Run full manual QA checklist below
- **Before `/gsd:verify-work`:** Full checklist must pass
- **Max feedback latency:** N/A (manual testing)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Verification Command / Steps | Status |
|---------|------|------|-------------|-----------|------------------------------|--------|
| 01-01-01 | 01 | 1 | DB-01 | manual | Apply migration, `\d acceptance_acts` in psql — verify columns and UNIQUE constraint | ⬜ pending |
| 01-01-02 | 01 | 1 | DB-02 | manual | Apply migration, `\d outsource_records` in psql — verify columns | ⬜ pending |
| 01-01-03 | 01 | 1 | DB-03 | manual | Apply migration, `\d delivery_acts` — verify `payment_breakdown` JSONB column | ⬜ pending |
| 01-01-04 | 01 | 1 | DB-04 | manual | Apply migration, `\d status_history` — verify table + index exists | ⬜ pending |
| 01-02-01 | 02 | 1 | BOARD-02 | manual | Open board.html — outsourced column visible between "В работе" and "Готово" with orange color | ⬜ pending |
| 01-02-02 | 02 | 1 | BOARD-01 | manual | Drag `scheduled` to `done` — verify snap-back + warning toast | ⬜ pending |
| 01-02-03 | 02 | 1 | BOARD-03 | manual | Click Save twice quickly — verify no duplicate board reload | ⬜ pending |
| 01-02-04 | 02 | 1 | BOARD-04 | manual | Transition card, query `SELECT * FROM status_history WHERE calc_id = '...'` | ⬜ pending |
| 01-03-01 | 03 | 2 | FORM-01 | manual | Drag `scheduled` to `accepted` — modal opens with car name | ⬜ pending |
| 01-03-02 | 03 | 2 | FORM-01 | manual | Fill all fields, save — query `acceptance_acts` table, verify data | ⬜ pending |
| 01-03-03 | 03 | 2 | FORM-01 | manual | Save modal twice rapidly — verify graceful handling, no duplicate records | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no automated test framework needed. Project convention is manual browser testing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SQL migration applies cleanly | DB-01..04 | Database schema — no test runner | Apply migration file via psql, inspect table structures |
| Outsourced column renders correctly | BOARD-02 | Visual/DOM verification | Open board.html, check column order and CSS color |
| Transition guard blocks illegal drops | BOARD-01 | UI interaction testing | Drag card to illegal target, verify snap-back + toast |
| Double-save prevention | BOARD-03 | Race condition timing | Click Save rapidly, verify single board reload in Network tab |
| Acceptance modal full flow | FORM-01 | End-to-end form + DB write | Fill form → save → verify DB record + card column move |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps documented
- [ ] Sampling continuity: every wave followed by full QA checklist
- [ ] No automated gaps (project has no test infra — all manual)
- [ ] Feedback latency acceptable for manual testing
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

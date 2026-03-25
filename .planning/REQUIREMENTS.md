# Requirements: Keep1R CRM — Workshop Pipeline

**Defined:** 2026-03-25
**Core Value:** Every status transition captures structured data — nothing lost, accountability fixed, documents generated.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Database & Infrastructure

- [ ] **DB-01**: SQL migration creates `acceptance_acts` table (calc_id, studio_id, mileage, fuel_level, damages, equipment, photo_checks, client_agreed, notes, created_at)
- [ ] **DB-02**: SQL migration creates `outsource_records` table (calc_id, studio_id, contractor_name, work_type, deadline, outsource_type, notes, returned_at, return_notes, created_at)
- [ ] **DB-03**: SQL migration creates `delivery_acts` table (calc_id, studio_id, payment_method, payment_breakdown JSONB, total_amount, vat_percent, notes, delivered_by, created_at)
- [ ] **DB-04**: SQL migration adds `status_history` JSONB column to `calculations` or creates `status_history` table (calc_id, from_status, to_status, changed_by, comment, created_at)

### Board Infrastructure

- [ ] **BOARD-01**: Transition guard — only allowed status transitions are permitted (matrix: scheduled→accepted, accepted→in_progress, in_progress→outsourced, in_progress→done, outsourced→done, outsourced→in_progress, done→delivered, any→cancelled)
- [ ] **BOARD-02**: `outsourced` column added to board between `in_progress` and `done`
- [ ] **BOARD-03**: `loadBoard()` guard prevents concurrent reload calls (_loading flag)
- [ ] **BOARD-04**: Status history recorded on every transition (who, when, from, to, comment)

### Transition Forms (Modals in board.html)

- [ ] **FORM-01**: Acceptance modal (scheduled→accepted) — mileage, fuel level, damage description, equipment checklist (запаска, домкрат, аптечка, огнетушитель, документы, ключи), photo zone checkboxes, client agreed checkbox, notes
- [x] **FORM-02**: Outsourcing modal (in_progress→outsourced) — contractor name, work type, deadline date, outsource type (car leaves / contractor arrives), notes
- [x] **FORM-03**: Check/done modal (in_progress/outsourced→done) — checked by (name), remarks/defects textarea, notes
- [x] **FORM-04**: Delivery modal (done→delivered) — 5 payment methods: cash, card/transfer, bank transfer (with VAT% input), deferred (debt), mixed (per-method amounts). Total amount, delivery notes
- [x] **FORM-05**: Cancel modal (any→cancelled) — cancel reason (select: client no-show, client refused, scheduling conflict, other), comment textarea
- [x] **FORM-06**: Return from outsourcing modal (outsourced→in_progress) — return date, return notes, condition remarks

### Document Pages

- [ ] **DOC-01**: acceptance-act.html — full page showing acceptance act data for a calculation, loaded via ?calc_id=, with all acceptance fields rendered
- [ ] **DOC-02**: acceptance-act.html print layout — @media print CSS for A4 output, studio name header, structured fields, signature line
- [ ] **DOC-03**: work-order.html — full page showing work order: services list, materials, executors, pricing, payment info, loaded via ?calc_id=
- [ ] **DOC-04**: work-order.html print layout — @media print CSS for A4 output, studio name, structured table layout
- [ ] **DOC-05**: Status history timeline on both document pages — chronological list of all status transitions for the calculation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Photo & Signatures

- **PHOTO-01**: Actual photo upload per zone in acceptance act
- **PHOTO-02**: Canvas-based electronic signature on acceptance/delivery acts
- **PHOTO-03**: Photo gallery viewer on document pages

### Notifications

- **NOTIF-01**: Push notification when status changes
- **NOTIF-02**: Email notification to client on delivery ready

### Integrations

- **INTEG-01**: 1C export for delivery acts and payments
- **INTEG-02**: SMS notification to client

### Advanced Features

- **ADV-01**: Admin can configure required fields per transition in settings
- **ADV-02**: Time-in-status aging indicators (warning colors on cards)
- **ADV-03**: Outsourcing contractor directory (saved contractors list)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Photo upload | Server storage not available in this repo, checkbox tracking sufficient for v1 |
| Electronic signature Canvas | Legal ambiguity in Russian context, checkbox "client agreed" covers workflow |
| Push/email notifications | Requires notification infrastructure not in scope |
| 1C/accounting integration | Different project, different API |
| Multi-step wizard forms | Single scrollable form is faster for tablet use |
| Mandatory field enforcement | v1 adoption — warn but don't block |
| PDF generation (server-side) | Browser print via @media print covers 95% of need |
| Customer portal | Different product, different auth model |
| Real-time websocket updates | Refresh-on-save sufficient for small teams |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| DB-03 | Phase 1 | Pending |
| DB-04 | Phase 1 | Pending |
| BOARD-01 | Phase 1 | Pending |
| BOARD-02 | Phase 1 | Pending |
| BOARD-03 | Phase 1 | Pending |
| BOARD-04 | Phase 1 | Pending |
| FORM-01 | Phase 1 | Pending |
| FORM-02 | Phase 2 | Complete |
| FORM-03 | Phase 2 | Complete |
| FORM-04 | Phase 2 | Complete |
| FORM-05 | Phase 2 | Complete |
| FORM-06 | Phase 2 | Complete |
| DOC-01 | Phase 3 | Pending |
| DOC-02 | Phase 3 | Pending |
| DOC-03 | Phase 3 | Pending |
| DOC-04 | Phase 3 | Pending |
| DOC-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation — traceability complete*

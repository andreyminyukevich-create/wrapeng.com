# Feature Landscape

**Domain:** Auto service / detailing studio CRM — workshop pipeline
**Researched:** 2026-03-25
**Milestone context:** Adding workshop pipeline to existing Keep1R CRM (board.html with 6 statuses, existing drag-drop, modals)

---

## Table Stakes

Features users expect in an auto service CRM workshop pipeline. Missing or broken = studio switches tool or works around the system on paper.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Acceptance act (акт приёмки) with damage checklist | Every auto service writes a paper act — if the CRM doesn't replace the paper, staff continue using paper | Medium | Fields: mileage, fuel level, body damage checkboxes, equipment completeness, schedule note, "client agreed" checkbox. All optional in v1. |
| Transition-gated status moves | Moving a card to "accepted" without capturing any intake data is useless — staff need the form to appear on transition | Medium | Modal fires on drag or button click. Skippable in v1 but must be present. |
| Work order page (заказ-наряд) | Document studios are legally required to have. Clients expect a printed sheet when picking up the car. | Medium | Separate printable page with services, materials, executors, final price, payment method. |
| Master assignment tied to a status | "Who is doing this?" must be answerable at any point. Assigning after accepting is the standard flow. | Low | Already exists as assign-work.html; needs to be reachable from transition form. |
| Delivery form with payment capture | Money changes hands when the car is returned. The CRM must record how: cash, card, bank transfer, or mixed. If it doesn't, the cashflow data is wrong. | Medium | Existing modal has only 3 payment types (cash, card, transfer). Must extend to 5 (+ VAT bank transfer, debt). |
| Cancellation with reason | Cancelled orders need a reason for reporting ("client no-show" vs "client refused"). Without this, studios can't analyze lost revenue. | Low | Any status → cancelled. Reason text field, required. |
| Work completion form with material actuals | Studios track planned vs actual material usage. The "done" transition is the moment to record what was actually consumed. | Medium | Exists in current board (modalDone). Must be preserved and linked to acceptance_acts flow. |
| Status history / timeline on card | "When did this car move to in_progress?" is asked constantly by studio owners and masters for accountability. | Low | Appended to drawer or act pages. Timestamp + who changed it. |
| Printable acceptance act | Clients sign the paper act. Studios file it. If the CRM generates it, it replaces the paper process and earns trust. | Medium | Print stylesheet on acceptance-act.html. |
| Printable work order | Same as above for the delivery document. Legal requirement in Russian auto service. | Medium | Print stylesheet on work-order.html. |

---

## Differentiators

Features that set Keep1R apart from generic CRM tools and generic auto service software. Not expected by default, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Outsourcing status with contractor record | Most auto service CRMs have no concept of "car went to a third party." Detailing studios commonly outsource window tinting, ceramic coating, PPF cutting. Having this as a first-class status prevents workarounds (sticky notes, manual tracking). | Medium | Two subtypes: car leaves to contractor vs contractor comes to studio. Fields: contractor name, work type, deadline, type. |
| Mixed payment form (5 methods including debt) | Generic CRMs offer 2-3 payment types. Detailing studios often sell on trust — "в долг" (deferred payment) is a real business pattern. Capturing it enables debt tracking in cashflow. | Medium | cash + card/transfer + bank (with manual VAT%) + debt + mixed. Mixed requires per-method amounts. |
| Acceptance act linked to existing calculation | Generic workshop software creates acts independent of quotes. Keep1R already has a calculator — the acceptance act should inherit car data, services list, and price from the existing calculation. | Medium | Auto-populate from calculation_data on act creation. |
| Photo checklist as structured checkboxes | Generic tools either require full photo upload (complex) or do nothing. Checkbox-per-zone ("фото сделано: капот, дверь ЛЗ, дверь ЛП...") is a lightweight middle ground that creates an audit trail without storage costs. | Low | Per-zone booleans stored in JSONB. "Real upload" deferred to v2 per project constraints. |
| Outsourcing return loop back to in_progress | Most systems don't model the "car came back from contractor" step. When it does return, it should re-enter in_progress (or done), not appear out of nowhere. | Low | outsourced → in_progress transition with a "returned from contractor" note. |
| Time-in-status display on card | Already partially present (⏱ Xч в статусе). Differentiating when it shows aging indicators (e.g., warn if > 24h in a status). | Low | Color threshold: neutral < 24h, warning 24-72h, alert > 72h. |
| Delivery act as a separate printable document | Going beyond work-order.html to have a formal handover act signed by the client. Adds legal standing. | Medium | Separate delivery_acts table. Linked from work-order or separate page. |

---

## Anti-Features

Features to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Canvas-based electronic signature | Complex to implement correctly (touch + mouse), legal status unclear in Russian context, adds storage complexity | Checkbox "клиент согласен / подпись получена" — covers the workflow need without legal ambiguity |
| Photo upload to server | Storage costs, upload reliability on mobile, backend changes needed (server not in this repo) | Checkbox "фото сделано" per zone — tracks the act without the bytes |
| Push / email notifications on status change | Requires notification infrastructure (FCM, SMTP), separate delivery service, user opt-in UX — all out of scope | Show status visually on board; status history covers accountability |
| 1C / accounting integration | Requires 1C-specific API work, Russian-market legal requirements, different project scope | Export-friendly cashflow data in existing cashflow.html covers the need for most studios |
| Multi-step wizard for acceptance act | Studios with tablets don't want 4-step wizard flows. One scroll-able form is faster. | Single-page modal or full-page form with sections |
| Mandatory fields blocking status transitions | In v1, studios are adopting the system. Blocking them creates frustration and pushes work back to paper. | All fields optional; warn but don't block |
| Automatic invoice/receipt PDF generation | PDF generation requires server-side library (puppeteer, wkhtmltopdf) not available in this frontend-only deployment | Print stylesheet on existing pages — browser print covers 95% of the need |
| Customer portal / client-facing status page | Different product, different auth model, much larger scope | Not applicable to v1 |
| Real-time multi-user updates (websockets) | Adds architecture complexity; small studio teams can coordinate manually or refresh | Reload-on-save pattern already used; good enough for team sizes of 2-10 |

---

## Feature Dependencies

```
acceptance_acts table
  └── acceptance-act.html (full page) requires acceptance_acts to exist
  └── scheduled→accepted transition modal requires acceptance_acts to save to
  └── accepted→in_progress transition can reference acceptance act data

outsource_records table
  └── outsourcing status column on board requires outsource_records table
  └── in_progress→outsourced transition modal writes to outsource_records
  └── outsourced→in_progress transition adds return note to outsource_records

delivery_acts table
  └── done→delivered transition modal writes to delivery_acts
  └── work-order.html shows delivery act data if delivery_acts record exists

Payment methods expansion
  └── delivery modal requires extended payment options (5 methods)
  └── mixed payment requires per-method amount fields (dynamic UI)
  └── cashflow.html may need updated payment_method display strings

work-order.html (full page)
  └── Requires: acceptance_acts (for intake data)
  └── Requires: work_assignments (already exists)
  └── Requires: delivery_acts (for payment/handover data)
  └── Requires: inventory_transactions (already exists, used in drawer)

Print stylesheets
  └── acceptance-act.html and work-order.html both need @media print CSS
  └── Independent of each other but similar pattern to implement together

Status "outsourced" in COLUMNS array
  └── board.html COLUMNS array must be updated
  └── STATUS_COLORS must include outsourced entry
  └── normalizeStatus must handle outsourced
  └── buildDrawerActions must handle outsourced status
  └── ACTIVE_KEYS set must include outsourced
```

---

## MVP Recommendation

Prioritize in this order:

1. **SQL migrations** (acceptance_acts, outsource_records, delivery_acts) — everything else depends on these tables existing
2. **acceptance-act.html full page** — highest-trust document, studios ask "where's the act?" first
3. **Transition modals: scheduled→accepted (acceptance form) and done→delivered (delivery/payment form)** — these are the bookends of the pipeline and the most asked-for transitions
4. **Outsourced status + in_progress→outsourced transition modal** — new column on board, contractor fields
5. **work-order.html full page** — aggregates data already collected; lower complexity than the act
6. **accepted→in_progress and outsourced→in_progress transitions** — simpler forms, fewer fields
7. **Print stylesheets** — last because they are cosmetic, not functional

Defer to v2:
- Photo upload (server not in this repo)
- Electronic signature (legal ambiguity, complexity)
- Notification system
- Mandatory field enforcement (wait for studio feedback after v1 adoption)

---

## Domain Notes (Confidence Assessment)

| Area | Confidence | Basis |
|------|------------|-------|
| Table stakes features | HIGH | Derived directly from existing board.html code, PROJECT.md requirements, and standard Russian auto service document law (акт приёмки, заказ-наряд are legally required) |
| Outsourcing as differentiator | HIGH | PROJECT.md explicitly models two outsourcing types; codebase has no outsourcing concept yet |
| Payment methods (5 types) | HIGH | PROJECT.md specifies these explicitly; existing code has only 3 |
| Anti-features (photo upload, e-sig) | HIGH | PROJECT.md explicitly marks these Out of Scope for v1 with rationale |
| Feature complexity estimates | MEDIUM | Based on codebase analysis (vanilla JS modal patterns, existing form structures); actual effort depends on backend migration success |
| Print stylesheet complexity | MEDIUM | Standard CSS @media print; no server-side PDF needed given the constraint that server code is not in this repo |

## Sources

- `/Users/and20mnk/Downloads/wrapeng-17.com-main/.planning/PROJECT.md` — primary requirements source
- `/Users/and20mnk/Downloads/wrapeng-17.com-main/board.html` — existing pipeline implementation, status constants, modal patterns, drawer actions
- `/Users/and20mnk/Downloads/wrapeng-17.com-main/assign-work.html` — master assignment form pattern
- Codebase analysis: existing tables (calculations, work_assignments, inventory_transactions), existing modal pattern, existing payment options

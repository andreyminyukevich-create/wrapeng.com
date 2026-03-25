# Keep1R CRM — Workshop Pipeline

## What This Is

Доработка CRM-системы для детейлинг-студий: полноценная воронка цеха (workshop pipeline) в board.html с формами переходов между статусами, новым статусом "Аутсорсинг", и реализацией страниц acceptance-act.html (акт приёмки) и work-order.html (заказ-наряд). Целевые пользователи — администраторы и мастера детейлинг-студий.

## Core Value

Каждый переход автомобиля между статусами в цехе сопровождается заполнением формы — данные не теряются, ответственность фиксируется, документы генерируются автоматически.

## Requirements

### Validated

- ✓ Канбан-доска (board.html) с 6 колонками — existing
- ✓ Drag&drop между колонками — existing
- ✓ Карточки расчётов с данными клиента/авто — existing
- ✓ Назначение мастеров (assign-work.html) — existing
- ✓ Контекстное меню карточки с действиями по статусу — existing
- ✓ REST API через /api/table/:table (универсальный CRUD) — existing
- ✓ Аутентификация через JWT + studio_context — existing

### Active

- [ ] Статус "Аутсорсинг" (outsourced) — новая колонка на доске
- [ ] Форма акта приёмки: scheduled→accepted (пробег, повреждения, комплектация, фото-чекбоксы, подпись клиента)
- [ ] Форма назначения: accepted→in_progress (мастера, даты)
- [ ] Форма аутсорсинга: in_progress→outsourced (подрядчик, вид работ, срок, тип — выездной/на выезд)
- [ ] Форма проверки: outsourced/in_progress→done (кто проверил, замечания)
- [ ] Форма выдачи: done→delivered (акт передачи, оплата)
- [ ] Форма отмены: любой→cancelled (причина)
- [ ] acceptance-act.html — полноценная страница акта приёмки (печать, история)
- [ ] work-order.html — полноценная страница заказ-наряда (печать, история)
- [ ] SQL-миграции для новых таблиц (acceptance_acts, outsource_records, delivery_acts)
- [ ] Способы оплаты: наличные, перевод/карта, безналичная (с НДС%), в долг, смешанная

### Out of Scope

- Загрузка фото — v1 только чекбоксы "фото сделано", реальный upload в v2
- Электронная подпись Canvas — v1 только чекбокс "клиент согласен"
- Уведомления (push/email) о смене статуса — v2
- Интеграция с 1С/бухгалтерией — v2
- Мобильное приложение — v2

## Context

- Стек: ванильный HTML/JS (no frameworks), REST API на порту 3001, PostgreSQL
- API универсальный: `sb.from('table').select/insert/update/delete` через QueryBuilder в api.js
- Все страницы используют studio-context.js для получения studio_id через /api/studio-members/me
- board.html уже имеет 6 статусов: scheduled, accepted, in_progress, done, delivered, cancelled
- acceptance-act.html и work-order.html существуют как заглушки (копия dashboard.html)
- Поля акта приёмки все опциональны в v1 (в будущем — настройка обязательности в settings)
- Аутсорсинг бывает двух типов: авто уезжает к подрядчику ИЛИ подрядчик приезжает в студию
- Оплата при выдаче: наличные, перевод/карта, безналичная (с ручным указанием НДС%), в долг, смешанная (суммы по каждому способу)

## Constraints

- **Tech stack**: Ванильный HTML/JS, без фреймворков — весь проект так написан
- **API**: Серверный код не в этом репо — только SQL-миграции и фронтенд
- **Совместимость**: Новые формы должны вписываться в существующий дизайн board.html (модалки, стили карточек)
- **Мобильная верстка**: Все формы должны работать на мобильных (студии часто работают с планшетов)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Формы переходов — модалки в board.html | Контекст доски не теряется при заполнении формы | — Pending |
| acceptance-act/work-order — отдельные страницы | Нужна печать, подробная история, больше места для данных | — Pending |
| Все поля акта приёмки опциональны | Не блокировать процесс, пока студия привыкает к системе | — Pending |
| Аутсорсинг — выбор типа (выездной/на выезд) | Два разных сценария: авто уезжает к подрядчику или подрядчик приезжает | — Pending |
| Оплата — 5 способов включая безнал с НДС | Реальные потребности детейлинг-бизнеса | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*

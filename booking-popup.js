/**
 * booking-popup.js — попап «Записать авто»
 * Поток: Машина → Пост → Услуги + исполнители → Даты
 * BookingPopup.open({ calcId, calcName, calcPrice, studioId, onSaved })
 * BookingPopup.close()
 */
(function () {
'use strict';

// ── CSS ────────────────────────────────────────────────
const CSS = `
#bpOverlay {
  display:none; position:fixed; inset:0; z-index:4000;
  background:rgba(15,23,42,0.55); backdrop-filter:blur(6px);
  align-items:flex-start; justify-content:center;
  padding:24px 16px 40px;
  overflow-y:auto;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;
}
#bpOverlay.active { display:flex; animation:bpFadeIn 0.15s ease; }
@keyframes bpFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes bpSlideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }

#bpBox {
  background:#fff; border-radius:18px;
  border:1px solid rgba(15,23,42,0.08);
  width:100%; max-width:780px;
  display:flex; flex-direction:column;
  box-shadow:0 24px 80px rgba(0,0,0,0.2);
  animation:bpSlideUp 0.18s ease;
}

#bpHead {
  display:flex; align-items:flex-start; justify-content:space-between;
  padding:22px 26px 0; gap:14px; flex-shrink:0;
}
#bpCarTitle { font-size:1.1rem; font-weight:800; color:#0f172a; letter-spacing:-0.3px; }
#bpCarPrice { font-size:0.82rem; color:#64748b; font-weight:600; margin-top:2px; }
#bpCloseBtn {
  background:rgba(100,116,139,0.1); border:none; cursor:pointer;
  width:30px; height:30px; border-radius:50%; font-size:1rem; color:#64748b;
  display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s;
}
#bpCloseBtn:hover { background:rgba(220,38,38,0.1); color:#dc2626; }

/* ── Секции ── */
.bp-section {
  padding:18px 26px 0;
}
.bp-section-title {
  font-size:0.68rem; font-weight:800; text-transform:uppercase;
  letter-spacing:0.07em; color:#94a3b8; margin-bottom:10px;
}
.bp-section-divider {
  height:1px; background:rgba(15,23,42,0.06); margin:6px 0 0;
}

/* ── Машина ── */
.bp-car-tabs { display:flex; gap:6px; margin-bottom:10px; }
.bp-car-tab {
  padding:5px 14px; border-radius:20px; font-size:0.75rem; font-weight:700;
  border:1.5px solid rgba(15,23,42,0.1); background:#f8fafc; color:#64748b;
  cursor:pointer; font-family:inherit; transition:all 0.15s;
}
.bp-car-tab.active { background:#2563eb; color:#fff; border-color:#2563eb; }
.bp-calc-select {
  width:100%; padding:9px 12px;
  background:#f8fafc; border:1.5px solid rgba(15,23,42,0.1);
  border-radius:9px; font-size:0.88rem; font-family:inherit; color:#0f172a;
  outline:none; -webkit-appearance:none; cursor:pointer; transition:border-color 0.15s;
}
.bp-calc-select:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
.bp-manual-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.bp-manual-input {
  width:100%; padding:9px 12px;
  background:#f8fafc; border:1.5px solid rgba(15,23,42,0.1);
  border-radius:9px; font-size:0.88rem; font-family:inherit; color:#0f172a; outline:none;
  transition:border-color 0.15s;
}
.bp-manual-input:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
.bp-manual-input::placeholder { color:#94a3b8; }

/* ── Посты ── */
#bpPosts { display:flex; flex-wrap:wrap; gap:6px; }
.bp-post-btn {
  display:flex; align-items:center; gap:8px; padding:9px 14px;
  border-radius:10px; border:1.5px solid rgba(15,23,42,0.08);
  background:#f8fafc; cursor:pointer; transition:all 0.15s;
  text-align:left; font-family:inherit;
}
.bp-post-btn:hover    { border-color:#2563eb; background:rgba(37,99,235,0.04); }
.bp-post-btn.selected { border-color:#2563eb; background:rgba(37,99,235,0.08); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
.bp-post-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.bp-post-name { font-size:0.83rem; font-weight:700; color:#0f172a; }
.bp-post-type { font-size:0.68rem; color:#94a3b8; font-weight:600; }
.bp-post-cap  { font-size:0.68rem; color:#2563eb; font-weight:700; background:rgba(37,99,235,0.08); padding:1px 7px; border-radius:10px; }
.bp-post-busy { font-size:0.68rem; color:#d97706; font-weight:700; background:rgba(217,119,6,0.08); padding:1px 7px; border-radius:10px; }

/* ── Услуги + исполнители ── */
#bpServices { display:flex; flex-direction:column; gap:6px; }
.bp-svc-row {
  display:flex; align-items:center; gap:10px;
  padding:9px 14px; background:#f8fafc;
  border:1.5px solid rgba(15,23,42,0.07); border-radius:10px;
}
.bp-svc-name {
  font-size:0.83rem; font-weight:700; color:#0f172a; flex:1; min-width:0;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.bp-svc-price {
  font-size:0.75rem; color:#2563eb; font-weight:700; flex-shrink:0;
}
.bp-svc-exec-select {
  padding:5px 10px; border-radius:7px;
  border:1.5px solid rgba(15,23,42,0.10); background:#fff;
  font-size:0.78rem; font-family:inherit; color:#0f172a;
  outline:none; cursor:pointer; min-width:130px; max-width:160px;
  transition:border-color 0.15s;
}
.bp-svc-exec-select:focus { border-color:#2563eb; }
.bp-svc-exec-select.assigned { border-color:#059669; background:rgba(5,150,105,0.05); color:#065f46; }
.bp-svc-exec-select.busy-assigned { border-color:#d97706; background:rgba(217,119,6,0.07); color:#92400e; }
.bp-svc-no-calc {
  padding:12px 14px; background:#f8fafc; border-radius:10px;
  font-size:0.82rem; color:#94a3b8; text-align:center;
}

/* ── Даты ── */
.bp-dates-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.bp-cal-col {}
.bp-month-nav { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.bp-month-nav button {
  width:28px; height:28px; border-radius:7px;
  border:1px solid rgba(15,23,42,0.10); background:#f8fafc;
  cursor:pointer; font-size:0.9rem; color:#0f172a;
  display:flex; align-items:center; justify-content:center; transition:all 0.15s;
}
.bp-month-nav button:hover { background:#e8eef8; }
.bp-month-lbl { font-size:0.82rem; font-weight:700; color:#0f172a; flex:1; text-align:center; }

.bp-cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.bp-day-hdr {
  text-align:center; font-size:0.6rem; font-weight:700;
  text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; padding:3px 0 6px;
}
.bp-day-hdr.we { color:#ef4444; }
.bp-day {
  aspect-ratio:1; border-radius:7px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  font-size:0.75rem; font-weight:600; color:#0f172a;
  cursor:pointer; position:relative; user-select:none;
  border:1.5px solid transparent; transition:background 0.1s, border-color 0.1s; gap:2px;
}
.bp-day:hover:not(.other):not(.past) { background:rgba(37,99,235,0.08); border-color:rgba(37,99,235,0.3); }
.bp-day.other { color:#d1d5db; cursor:default; pointer-events:none; }
.bp-day.past  { color:#d1d5db; cursor:not-allowed; pointer-events:none; }
.bp-day.today { border-color:rgba(37,99,235,0.4); color:#2563eb; font-weight:800; }
.bp-day.we-num { color:#ef4444; }
.bp-day.from, .bp-day.to {
  background:#2563eb !important; color:#fff !important;
  border-color:#2563eb !important;
}
.bp-day.from    { border-radius:7px 0 0 7px; }
.bp-day.to      { border-radius:0 7px 7px 0; }
.bp-day.from.to { border-radius:7px !important; }
.bp-day.between {
  background:rgba(37,99,235,0.13) !important;
  border-color:transparent !important; border-radius:0; color:#1e40af;
}
.bp-day.from .bp-day-num, .bp-day.to .bp-day-num { color:#fff !important; }
.bp-day-num { font-size:0.75rem; font-weight:700; line-height:1; }
.bp-day-dot { width:4px; height:4px; border-radius:50%; background:#f59e0b; }

.bp-pick-hint {
  font-size:0.72rem; color:#64748b; margin:7px 0 8px;
  text-align:center; font-weight:600; min-height:18px;
}
.bp-pick-hint span { color:#2563eb; font-weight:800; }
.bp-dates-display { display:flex; gap:8px; margin-top:0; }
.bp-date-pill {
  flex:1; background:#f8fafc; border:1.5px solid rgba(15,23,42,0.08);
  border-radius:9px; padding:8px 12px; text-align:center; transition:all 0.15s;
}
.bp-date-pill.active { border-color:#2563eb; background:rgba(37,99,235,0.04); }
.bp-date-pill-lbl { font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#94a3b8; margin-bottom:2px; }
.bp-date-pill-val { font-size:0.88rem; font-weight:800; color:#0f172a; }
.bp-date-pill-val.empty { color:#d1d5db; }

.bp-note-col {}
.bp-note-wrap { display:flex; flex-direction:column; gap:0; }
.bp-note-wrap textarea {
  width:100%; padding:9px 12px; background:#f8fafc;
  border:1.5px solid rgba(15,23,42,0.08); border-radius:9px;
  font-size:0.82rem; font-family:inherit; color:#0f172a;
  outline:none; resize:none; transition:border-color 0.15s; min-height:90px;
}
.bp-note-wrap textarea:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }

.bp-conflict {
  margin-top:8px; padding:8px 12px;
  background:rgba(217,119,6,0.07); border:1px solid rgba(217,119,6,0.25);
  border-radius:8px; font-size:0.78rem; color:#92400e; font-weight:600; display:none;
}
.bp-conflict.show { display:block; }

#bpFoot { padding:16px 26px 22px; display:flex; gap:10px; flex-shrink:0; }
.bp-btn-cancel {
  background:rgba(15,23,42,0.05); color:#64748b;
  border:1px solid rgba(15,23,42,0.10); padding:10px 18px;
  border-radius:9px; cursor:pointer; font-size:0.82rem; font-weight:700; font-family:inherit; transition:all 0.15s;
}
.bp-btn-cancel:hover { background:#fee2e2; color:#dc2626; }
.bp-btn-save {
  flex:1; background:#2563eb; color:#fff; border:none; padding:11px 18px;
  border-radius:9px; cursor:pointer; font-size:0.88rem; font-weight:800; font-family:inherit; transition:all 0.15s;
}
.bp-btn-save:hover    { background:#1d4ed8; }
.bp-btn-save:disabled { opacity:0.5; cursor:not-allowed; }
.bp-empty { color:#94a3b8; font-size:0.82rem; padding:8px 0; }

/* Блок предупреждений о занятости */
.bp-exec-warnings {
  margin-top:10px; display:flex; flex-direction:column; gap:5px;
}
.bp-exec-warn-row {
  display:flex; align-items:flex-start; gap:8px; padding:7px 11px;
  background:rgba(217,119,6,0.07); border:1px solid rgba(217,119,6,0.25);
  border-radius:8px; font-size:0.78rem; color:#92400e; font-weight:600;
}
.bp-exec-warn-row.free {
  background:rgba(5,150,105,0.06); border-color:rgba(5,150,105,0.2); color:#065f46;
}
.bp-exec-warn-icon { flex-shrink:0; font-size:0.85rem; }
/* Точки занятости исполнителей на календаре */
.bp-day-dots { display:flex; gap:2px; justify-content:center; }
.bp-day-exec-dot { width:4px; height:4px; border-radius:50%; background:#f59e0b; }
.bp-day-exec-dot.busy-exec { background:#ef4444; }

@media(max-width:640px){
  #bpHead,.bp-section{padding-left:18px;padding-right:18px;}
  .bp-dates-row{grid-template-columns:1fr;}
  .bp-manual-grid{grid-template-columns:1fr;}
  #bpFoot{padding:14px 18px 18px;}
}
`;

(function injectCSS() {
  if (document.getElementById('bpStyles')) return;
  const s = document.createElement('style');
  s.id = 'bpStyles';
  s.textContent = CSS;
  document.head.appendChild(s);
})();

// ── Справочники ────────────────────────────────────────
const POST_TYPE_RU = { box:'Бокс', lift:'Подъёмник', outdoor:'Открытая зона', other:'Другое' };
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const ROLE_RU = { owner:'Владелец', admin:'Администратор', manager:'Менеджер', executor:'Исполнитель', viewer:'Просмотр', wrapper:'Оклейщик', preparer:'Подготовщик', armature:'Арматурщик', detailer:'Детейлер', universal:'Универсал', outsource:'Аутсорсинг' };

function roleRu(r) { return ROLE_RU[r] || r || 'Сотрудник'; }
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseDate(s){ const [y,m,d]=s.split('-'); return new Date(y,m-1,d); }
function formatRu(s) { return parseDate(s).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}); }
function fmt(n)      { return new Intl.NumberFormat('ru-RU').format(n||0); }
function datesOverlap(f1,t1,f2,t2){ return f1<=t2 && t1>=f2; }
function bookingsForPost(pid){ return _bookings.filter(b=>b.post_id===pid); }

// Возвращает бронирования где занят конкретный исполнитель
function bookingsForExec(eid){
  return _bookings.filter(b => b.executor_ids && b.executor_ids.includes(eid));
}

// Проверяет занят ли исполнитель в выбранном диапазоне дат
function execBusyInRange(eid){
  if(!_dateFrom || !_dateTo) return null; // нет дат — не проверяем
  return bookingsForExec(eid).find(b => datesOverlap(_dateFrom, _dateTo, b.date_from, b.date_to)) || null;
}

// Следующая свободная дата исполнителя после его занятости
function execNextFree(eid){
  const busyPeriods = bookingsForExec(eid)
    .map(b => ({ from: b.date_from, to: b.date_to }))
    .sort((a,b) => a.to > b.to ? 1 : -1);
  if(!busyPeriods.length) return null;
  // День ПОСЛЕ последнего дня занятости
  const lastTo = busyPeriods[busyPeriods.length-1].to;
  const next = parseDate(lastTo);
  next.setDate(next.getDate()+1);
  return toISO(next);
}

// ── DOM ────────────────────────────────────────────────
function buildDOM() {
  if (document.getElementById('bpOverlay')) return;
  const div = document.createElement('div');
  div.innerHTML = `
<div id="bpOverlay">
  <div id="bpBox">

    <!-- Шапка -->
    <div id="bpHead">
      <div>
        <div id="bpCarTitle">&#x1F4C5; Записать авто</div>
        <div id="bpCarPrice"></div>
      </div>
      <button id="bpCloseBtn" onclick="BookingPopup.close()">&#x2715;</button>
    </div>

    <!-- 1. Машина -->
    <div class="bp-section" style="padding-top:18px">
      <div class="bp-section-title">&#x1F697; Автомобиль</div>
      <div class="bp-car-tabs">
        <button class="bp-car-tab active" id="bpTabCalc"   onclick="BookingPopup._switchTab('calc')">&#x1F4CB; Из расчётов</button>
        <button class="bp-car-tab"        id="bpTabManual" onclick="BookingPopup._switchTab('manual')">&#x270F;&#xFE0F; Ввести вручную</button>
      </div>
      <div id="bpTabCalcBody">
        <select class="bp-calc-select" id="bpCalcSel" onchange="BookingPopup._onCalcSelect(this.value)">
          <option value="">&#x23F3; Загрузка...</option>
        </select>
      </div>
      <div id="bpTabManualBody" style="display:none">
        <div class="bp-manual-grid">
          <input class="bp-manual-input" id="bpManualBrand" placeholder="Марка и модель">
          <input class="bp-manual-input" id="bpManualPlate" placeholder="Гос. номер">
        </div>
      </div>
    </div>
    <div class="bp-section-divider" style="margin:16px 26px 0"></div>

    <!-- 2. Пост -->
    <div class="bp-section">
      <div class="bp-section-title">&#x1F3D7; Рабочий пост</div>
      <div id="bpPosts"><div class="bp-empty">&#x23F3; Загрузка...</div></div>
    </div>
    <div class="bp-section-divider" style="margin:16px 26px 0"></div>

    <!-- 3. Услуги + исполнители -->
    <div class="bp-section">
      <div class="bp-section-title">&#x1F527; Услуги и исполнители</div>
      <div id="bpServices"><div class="bp-svc-no-calc">Выберите расчёт — увидите список услуг</div></div>
      <div id="bpExecWarnings" class="bp-exec-warnings"></div>
    </div>
    <div class="bp-section-divider" style="margin:16px 26px 0"></div>

    <!-- 4. Даты + комментарий -->
    <div class="bp-section" style="padding-bottom:4px">
      <div class="bp-section-title">&#x1F4C6; Даты и комментарий</div>
      <div class="bp-dates-row">
        <div class="bp-cal-col">
          <div class="bp-month-nav">
            <button onclick="BookingPopup._prevMonth()">&#x2039;</button>
            <span class="bp-month-lbl" id="bpMonthLbl"></span>
            <button onclick="BookingPopup._nextMonth()">&#x203A;</button>
          </div>
          <div class="bp-cal-grid" id="bpCalGrid"></div>
          <div class="bp-pick-hint" id="bpPickHint">Кликните на <span>дату заезда</span></div>
          <div class="bp-dates-display">
            <div class="bp-date-pill" id="bpPillFrom">
              <div class="bp-date-pill-lbl">Заезд</div>
              <div class="bp-date-pill-val empty" id="bpFromLbl">—</div>
            </div>
            <div class="bp-date-pill" id="bpPillTo">
              <div class="bp-date-pill-lbl">Выезд</div>
              <div class="bp-date-pill-val empty" id="bpToLbl">—</div>
            </div>
          </div>
          <div class="bp-conflict" id="bpConflict">&#x26A0;&#xFE0F; На посту в эти даты уже есть запись. Убедитесь что пост вмещает несколько машин.</div>
        </div>
        <div class="bp-note-col">
          <div class="bp-section-title" style="margin-bottom:8px">Комментарий</div>
          <div class="bp-note-wrap">
            <textarea id="bpNote" placeholder="Пожелания, особенности авто, доп. инструкции..."></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Футер -->
    <div id="bpFoot">
      <button class="bp-btn-cancel" onclick="BookingPopup.close()">Отмена</button>
      <button class="bp-btn-save"   id="bpSaveBtn" onclick="BookingPopup._save()">&#x2705; Записать</button>
    </div>

  </div>
</div>`;
  document.body.appendChild(div.firstElementChild);
}

// ── State ──────────────────────────────────────────────
let _studioId=null, _calcId=null, _onSaved=null, _tab='calc';
let _posts=[], _executors=[], _bookings=[], _calcs=[];
let _selectedPost=null;
let _serviceExecs = {}; // { serviceKey: executorId }
let _calcServices = []; // [{ key, name, price }]
let _dateFrom=null, _dateTo=null, _picking='from';
let _viewYear=new Date().getFullYear(), _viewMonth=new Date().getMonth();

// ── Загрузка данных ────────────────────────────────────
async function loadData() {
  const sb = window._crmSb;
  if (!sb || !_studioId) return;

  // Если calcId уже известен — сразу грузим его данные, не ждём весь список
  if (_calcId) {
    const { data: thisCalc } = await sb
      .from('calculations')
      .select('id,car_name,status,final_price,total_price,calculation_data')
      .eq('id', _calcId)
      .single();

    if (thisCalc) {
      // Добавляем в список если ещё нет
      if (!_calcs.find(c => c.id === thisCalc.id)) _calcs.push(thisCalc);
      _calcServices = extractServices(thisCalc);
      _serviceExecs = {};
      renderServices();

      const titleEl = document.getElementById('bpCarTitle');
      const priceEl = document.getElementById('bpCarPrice');
      if (titleEl) titleEl.innerHTML = `&#x1F4C5; ${thisCalc.car_name || 'Авто'}`;
      if (priceEl) priceEl.innerHTML = `&#x20BD; ${fmt(thisCalc.final_price || thisCalc.total_price || 0)}`;
    }
  }

  // Грузим посты, сотрудников и остальные расчёты параллельно
  const [pr, er, br, cr] = await Promise.all([
    sb.from('posts').select('*').eq('studio_id',_studioId).eq('is_active',true).order('created_at'),
    sb.from('executors').select('id,full_name,role').eq('studio_id',_studioId).eq('is_active',true).order('full_name'),
    sb.from('calendar_bookings').select('post_id,date_from,date_to,executor_ids').eq('studio_id',_studioId),
    sb.from('calculations').select('id,car_name,status,final_price,total_price,calculation_data')
      .eq('studio_id',_studioId).in('status',['new','draft'])
      .order('created_at',{ascending:false}).limit(100),
  ]);

  _posts     = pr.data || [];
  _executors = er.data || [];
  _bookings  = br.data || [];
  // Мержим — чтобы текущий расчёт точно был в списке
  const loaded = cr.data || [];
  loaded.forEach(c => { if (!_calcs.find(x => x.id === c.id)) _calcs.push(c); });

  renderCalcSelect();
  renderPosts();
  renderServices(); // перерендер с загруженными исполнителями

  // Выставляем select
  const sel = document.getElementById('bpCalcSel');
  if (sel && _calcId) sel.value = _calcId;
}

// ── Рендер: расчёты ───────────────────────────────────
function renderCalcSelect() {
  const el = document.getElementById('bpCalcSel');
  if (!el) return;
  const STATUS = { new:'Расчёт', draft:'', scheduled:'Дата', in_progress:'В работе' };
  el.innerHTML = '<option value="">— Выберите расчёт —</option>' +
    _calcs.map(c => {
      const st  = STATUS[c.status];
      const pr  = fmt(c.final_price || c.total_price || 0);
      const sel = c.id === _calcId ? ' selected' : '';
      const label = st ? `${c.car_name||'Без названия'} · ${st} · ${pr} &#x20BD;`
                       : `${c.car_name||'Без названия'} · ${pr} &#x20BD;`;
      return `<option value="${c.id}"${sel}>${label}</option>`;
    }).join('');
}

// ── Рендер: посты ─────────────────────────────────────
function renderPosts() {
  const el = document.getElementById('bpPosts');
  if (!el) return;
  if (!_posts.length) {
    el.innerHTML = '<div class="bp-empty">Нет постов. <a href="settings.html" style="color:#2563eb">Добавить в настройках</a></div>';
    return;
  }
  el.innerHTML = _posts.map(p => {
    const sel  = _selectedPost === p.id ? ' selected' : '';
    const cap  = p.capacity || 1;
    const busy = bookingsForPost(p.id).filter(b =>
      _dateFrom && _dateTo ? datesOverlap(_dateFrom, _dateTo, b.date_from, b.date_to) : false
    ).length;
    const full = busy >= cap;
    const badge = cap > 0
      ? `<span class="${full?'bp-post-busy':'bp-post-cap'}">${busy}/${cap}</span>`
      : '';
    return `<button class="bp-post-btn${sel}" onclick="BookingPopup._selectPost('${p.id}')">
      <div class="bp-post-dot" style="background:${p.color||'#2563eb'}"></div>
      <div>
        <div class="bp-post-name">${p.name}</div>
        <div class="bp-post-type">${POST_TYPE_RU[p.type]||p.type||''}</div>
      </div>
      ${badge}
    </button>`;
  }).join('');
}

// ── Рендер: услуги + исполнители ──────────────────────
function renderServices() {
  const el = document.getElementById('bpServices');
  if (!el) return;

  if (!_calcServices.length) {
    el.innerHTML = '<div class="bp-svc-no-calc">Выберите расчёт — увидите список услуг</div>';
    return;
  }

  // Строим опции с пометкой занятости
  const execOptions = '<option value="">— не назначен —</option>' +
    _executors.map(e => {
      const busy = execBusyInRange(e.id);
      let label = `${e.full_name} (${roleRu(e.role)})`;
      if (busy) {
        label += ` — занят до ${formatRu(busy.date_to)}`;
      }
      return `<option value="${e.id}" ${busy ? 'data-busy="1"' : ''}>${label}</option>`;
    }).join('');

  el.innerHTML = _calcServices.map(svc => {
    const assigned = _serviceExecs[svc.key] || '';
    const busy = assigned ? execBusyInRange(assigned) : null;
    const cls = assigned ? (busy ? ' busy-assigned' : ' assigned') : '';
    return `<div class="bp-svc-row">
      <div class="bp-svc-name" title="${svc.name}">${svc.name}</div>
      ${svc.price ? `<div class="bp-svc-price">${fmt(svc.price)} &#x20BD;</div>` : ''}
      <select class="bp-svc-exec-select${cls}" data-svc="${svc.key}"
        onchange="BookingPopup._assignExec('${svc.key}', this.value, this)">
        ${execOptions}
      </select>
    </div>`;
  }).join('');

  // Восстанавливаем выбранных исполнителей
  _calcServices.forEach(svc => {
    const sel = el.querySelector(`select[data-svc="${svc.key}"]`);
    if (sel && _serviceExecs[svc.key]) {
      sel.value = _serviceExecs[svc.key];
    }
  });
}

// ── Предупреждения о занятости исполнителей ───────────
function renderExecWarnings() {
  const el = document.getElementById('bpExecWarnings');
  if (!el) return;
  if (!_dateFrom || !_dateTo || !_executors.length) { el.innerHTML=''; return; }

  // Все исполнители: занятые в выбранном диапазоне
  const warnings = [];
  _executors.forEach(e => {
    const busy = execBusyInRange(e.id);
    if (busy) {
      const freeFrom = execNextFree(e.id);
      warnings.push(`<div class="bp-exec-warn-row">
        <span class="bp-exec-warn-icon">&#x26A0;&#xFE0F;</span>
        <span><b>${e.full_name}</b> занят до <b>${formatRu(busy.date_to)}</b>${freeFrom ? ` · свободен с ${formatRu(freeFrom)}` : ''}</span>
      </div>`);
    }
  });

  el.innerHTML = warnings.join('');
}

// ── Извлечь услуги из calculation_data ────────────────
function extractServices(calc) {
  const services = [];
  if (!calc) return services;

  const d = calc.calculation_data;
  if (!d) return services;

  const seen = new Set();

  function add(key, name, mat, mot) {
    const price = (parseFloat(mat)||0) + (parseFloat(mot)||0);
    if (price > 0 && !seen.has(key)) {
      seen.add(key);
      services.push({ key, name, price });
    }
  }

  // Пакет полной защиты — три отдельных исполнителя
  if (d.package) {
    add('pkg_wrap', 'Оклейка (Полная защита)',          d.package.wrapMat, d.package.wrapMot);
    add('pkg_prep', 'Подготовка (Полная защита)',        d.package.prepMat, d.package.prepMot);
    add('pkg_arm',  'Арматурные работы (Полная защита)', d.package.armMat,  d.package.armMot);
  }

  // Ударная часть — тоже три работы
  if (d.impact) {
    add('impact_wrap', 'Оклейка (Ударная часть)',          d.impact.wrapMat, d.impact.wrapMot);
    add('impact_prep', 'Подготовка (Ударная часть)',        d.impact.prepMat, d.impact.prepMot);
    add('impact_arm',  'Арматурные работы (Ударная часть)', d.impact.armMat,  d.impact.armMot);
  }

  // Детализированные услуги из services_detail
  if (d.services_detail) {
    const groups = {
      arm:  'Бронирование',
      wrap: 'Оклейка',
      det:  'Детейлинг',
      gl:   'Стёкла',
      ms:   'Доп. услуги',
    };
    Object.entries(groups).forEach(([gkey, gname]) => {
      (d.services_detail[gkey] || []).forEach((item, idx) => {
        const name = item.name ? `${gname}: ${item.name}` : gname;
        add(`${gkey}_${idx}`, name, item.mat, item.mot);
      });
    });
  }

  // Базовые блоки без детализации (старый формат)
  if (!d.services_detail) {
    const basic = {
      arm:  'Арматурные работы',
      wrap: 'Оклейка',
      det:  'Детейлинг',
      gl:   'Работы со стёклами',
      ms:   'Доп. услуги',
    };
    Object.entries(basic).forEach(([key, name]) => {
      if (d[key]) add(key, name, d[key].mat, d[key].mot || d[key].motivation);
    });
  }

  // Массив services (совсем старый формат)
  if (d.services && Array.isArray(d.services)) {
    d.services.forEach((srv, idx) => {
      add(`service_${idx}`, srv.name || `Услуга ${idx+1}`, srv.mat, srv.mot || srv.motivation);
    });
  }

  // Fallback
  if (!services.length) {
    services.push({ key:'general', name:'Работы по авто', price: calc.final_price || calc.total_price || 0 });
  }

  return services;
}

// ── Рендер: календарь ─────────────────────────────────
function renderCalendar() {
  const el  = document.getElementById('bpCalGrid');
  const lbl = document.getElementById('bpMonthLbl');
  if (!el || !lbl) return;
  lbl.textContent = `${MONTHS[_viewMonth]} ${_viewYear}`;

  const today = toISO(new Date());
  const DAY_HDR = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  const firstDay = new Date(_viewYear, _viewMonth, 1);
  let startPad = firstDay.getDay();
  startPad = startPad === 0 ? 6 : startPad - 1;
  const gridStart = new Date(_viewYear, _viewMonth, 1 - startPad);

  const lastDay = new Date(_viewYear, _viewMonth + 1, 0);
  let endPad = lastDay.getDay();
  endPad = endPad === 0 ? 0 : 7 - endPad;
  const gridEnd = new Date(_viewYear, _viewMonth + 1, endPad);

  const dates = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) { dates.push(toISO(new Date(cur))); cur.setDate(cur.getDate() + 1); }

  const busyDates = new Set();
  if (_selectedPost) {
    bookingsForPost(_selectedPost).forEach(b => {
      const c = parseDate(b.date_from), e = parseDate(b.date_to);
      while (c <= e) { busyDates.add(toISO(new Date(c))); c.setDate(c.getDate() + 1); }
    });
  }

  let html = DAY_HDR.map((d,i) => `<div class="bp-day-hdr${i>=5?' we':''}">${d}</div>`).join('');

  dates.forEach(ds => {
    const d = parseDate(ds);
    const isOther   = d.getMonth() !== _viewMonth;
    const isPast    = ds < today;
    const isWe      = d.getDay() === 0 || d.getDay() === 6;
    const isToday   = ds === today;
    const isFrom    = ds === _dateFrom;
    const isTo      = ds === _dateTo;
    const isBetween = _dateFrom && _dateTo && ds > _dateFrom && ds < _dateTo;
    const hasDot    = !isOther && busyDates.has(ds);
    // Занятые исполнители в этот день
    const busyExecCount = !isOther ? _executors.filter(e => {
      return bookingsForExec(e.id).some(b => ds >= b.date_from && ds <= b.date_to);
    }).length : 0;

    let cls = 'bp-day';
    if (isOther)     cls += ' other';
    else if (isPast) cls += ' past';
    else {
      if (isWe)      cls += ' we-num';
      if (isToday)   cls += ' today';
      if (isFrom)    cls += ' from';
      if (isTo)      cls += ' to';
      if (isBetween) cls += ' between';
    }

    const click = (!isOther && !isPast) ? `onclick="BookingPopup._pickDate('${ds}')"` : '';
    let dotsHtml = '';
    if (hasDot) dotsHtml += '<div class="bp-day-dot"></div>';
    if (busyExecCount > 0 && !isOther && !isPast) {
      dotsHtml = `<div class="bp-day-dots">${hasDot?'<div class="bp-day-dot"></div>':''}${'<div class="bp-day-exec-dot busy-exec"></div>'.repeat(Math.min(busyExecCount,3))}</div>`;
    }
    html += `<div class="${cls}" ${click}><div class="bp-day-num">${d.getDate()}</div>${dotsHtml}</div>`;
  });

  el.innerHTML = html;

  const fromEl = document.getElementById('bpFromLbl');
  const toEl   = document.getElementById('bpToLbl');
  const hint   = document.getElementById('bpPickHint');
  if (fromEl) { fromEl.textContent = _dateFrom ? formatRu(_dateFrom) : '—'; fromEl.classList.toggle('empty', !_dateFrom); }
  if (toEl)   { toEl.textContent   = _dateTo   ? formatRu(_dateTo)   : '—'; toEl.classList.toggle('empty', !_dateTo); }

  const pf = document.getElementById('bpPillFrom');
  const pt = document.getElementById('bpPillTo');
  if (pf) pf.classList.toggle('active', _picking === 'from' && !_dateTo);
  if (pt) pt.classList.toggle('active', _picking === 'to');

  if (hint) {
    if (!_dateFrom && !_dateTo) hint.innerHTML = 'Кликните на <span>дату заезда</span>';
    else if (_dateFrom && !_dateTo) hint.innerHTML = 'Теперь выберите <span>дату выезда</span>';
    else {
      const days = Math.round((parseDate(_dateTo) - parseDate(_dateFrom)) / 86400000) + 1;
      hint.innerHTML = `<span>${formatRu(_dateFrom)}</span> — <span>${formatRu(_dateTo)}</span> · ${days} дн.`;
    }
  }
  checkConflict();
  renderExecWarnings();
  renderServices(); // обновляем статус занятости в дропдаунах
}

function checkConflict() {
  const el = document.getElementById('bpConflict');
  if (!el) return;
  if (!_selectedPost || !_dateFrom || !_dateTo) { el.classList.remove('show'); return; }
  const cap  = _posts.find(p => p.id === _selectedPost)?.capacity || 1;
  const busy = bookingsForPost(_selectedPost).filter(b => datesOverlap(_dateFrom, _dateTo, b.date_from, b.date_to)).length;
  el.classList.toggle('show', busy >= cap);
}

// ── Вспомогательная: обработка выбора расчёта ─────────
function _onCalcSelectInternal(id) {
  _calcId = id || null;
  const calc = _calcId ? _calcs.find(c => c.id === _calcId) : null;

  const titleEl = document.getElementById('bpCarTitle');
  const priceEl = document.getElementById('bpCarPrice');
  if (titleEl) titleEl.innerHTML = calc ? `&#x1F4C5; ${calc.car_name}` : '&#x1F4C5; Записать авто';
  if (priceEl) priceEl.innerHTML = calc ? `&#x20BD; ${fmt(calc.final_price || calc.total_price || 0)}` : '';

  _serviceExecs  = {};
  _calcServices  = calc ? extractServices(calc) : [];
  renderServices();
}

// ── Public API ─────────────────────────────────────────
window.BookingPopup = {

  open: function({ calcId, calcName, calcPrice, studioId, onSaved } = {}) {
    buildDOM();
    _studioId    = studioId;
    _calcId      = calcId || null;
    _onSaved     = onSaved || null;
    _tab         = 'calc';
    _selectedPost    = null;
    _serviceExecs    = {};
    _calcServices    = [];
    _dateFrom = null; _dateTo = null; _picking = 'from';
    _viewYear = new Date().getFullYear(); _viewMonth = new Date().getMonth();

    const titleEl = document.getElementById('bpCarTitle');
    const priceEl = document.getElementById('bpCarPrice');
    if (titleEl) titleEl.innerHTML = calcName ? `&#x1F4C5; ${calcName}` : '&#x1F4C5; Записать авто';
    if (priceEl) priceEl.innerHTML = calcPrice ? `&#x20BD; ${fmt(calcPrice)}` : '';
    document.getElementById('bpNote').value = '';

    BookingPopup._switchTab('calc');
    document.getElementById('bpOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCalendar();
    loadData();
  },

  close: function() {
    const el = document.getElementById('bpOverlay');
    if (el) el.classList.remove('active');
    document.body.style.overflow = '';
  },

  _switchTab: function(tab) {
    _tab = tab;
    document.getElementById('bpTabCalcBody').style.display   = tab === 'calc'   ? 'block' : 'none';
    document.getElementById('bpTabManualBody').style.display = tab === 'manual' ? 'block' : 'none';
    document.getElementById('bpTabCalc').classList.toggle('active',   tab === 'calc');
    document.getElementById('bpTabManual').classList.toggle('active', tab === 'manual');
    if (tab === 'manual') {
      _calcId = null; _calcServices = []; _serviceExecs = {};
      renderServices();
    }
  },

  _onCalcSelect: function(id) {
    _onCalcSelectInternal(id);
  },

  _selectPost: function(pid) {
    _selectedPost = _selectedPost === pid ? null : pid;
    renderPosts();
    renderCalendar();
  },

  _assignExec: function(svcKey, execId, selectEl) {
    _serviceExecs[svcKey] = execId || null;
    if (selectEl) selectEl.classList.toggle('assigned', !!execId);
  },

  _prevMonth: function() {
    _viewMonth--; if (_viewMonth < 0) { _viewMonth = 11; _viewYear--; }
    renderCalendar();
  },
  _nextMonth: function() {
    _viewMonth++; if (_viewMonth > 11) { _viewMonth = 0; _viewYear++; }
    renderCalendar();
  },

  _pickDate: function(ds) {
    if (!_dateFrom && !_dateTo) {
      _dateFrom = ds; _picking = 'to';
    } else if (_dateFrom && !_dateTo) {
      if (ds === _dateFrom)  { _dateFrom = null; _picking = 'from'; }
      else if (ds < _dateFrom) { _dateFrom = ds; }
      else { _dateTo = ds; _picking = 'from'; }
    } else {
      const diffFrom = Math.abs(parseDate(ds) - parseDate(_dateFrom));
      const diffTo   = Math.abs(parseDate(ds) - parseDate(_dateTo));
      if (diffFrom <= diffTo) {
        if (ds > _dateTo) { _dateFrom = _dateTo; _dateTo = ds; } else _dateFrom = ds;
      } else {
        if (ds < _dateFrom) { _dateTo = _dateFrom; _dateFrom = ds; } else _dateTo = ds;
      }
    }
    renderCalendar();
    renderPosts();
  },

  _save: async function() {
    if (!_dateFrom) { alert('Выберите дату заезда'); return; }
    if (!_dateTo) _dateTo = _dateFrom;

    let carName = '', finalCalcId = null;
    if (_tab === 'calc') {
      if (!_calcId) { alert('Выберите расчёт из списка'); return; }
      finalCalcId = _calcId;
      carName = _calcs.find(c => c.id === _calcId)?.car_name || '';
    } else {
      const brand = document.getElementById('bpManualBrand')?.value.trim() || '';
      const plate = document.getElementById('bpManualPlate')?.value.trim() || '';
      if (!brand) { alert('Введите марку/модель авто'); return; }
      carName = brand + (plate ? ` (${plate})` : '');
    }

    if (!_selectedPost && _posts.length) {
      if (!confirm('Пост не выбран. Продолжить?')) return;
    }

    const btn = document.getElementById('bpSaveBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '&#x23F3; Сохранение...'; }

    const sb   = window._crmSb;
    const note = document.getElementById('bpNote')?.value.trim() || null;

    // Собираем уникальных исполнителей из назначений
    const execIds = [...new Set(Object.values(_serviceExecs).filter(Boolean))];

    // Сохраняем назначения услуг для передачи в booking
    const serviceAssignments = _calcServices.length
      ? _calcServices.map(svc => ({ key: svc.key, name: svc.name, executor_id: _serviceExecs[svc.key] || null }))
      : null;

    const { error: bErr } = await sb.from('calendar_bookings').insert({
      studio_id:    _studioId,
      post_id:      _selectedPost || null,
      calc_id:      finalCalcId,
      car_name:     carName,
      date_from:    _dateFrom,
      date_to:      _dateTo,
      note,
      executor_ids: execIds.length ? execIds : null,
    });

    if (bErr) { console.error(bErr); }
    let ok = !bErr;

    if (ok && finalCalcId) {
      // Сохраняем назначения исполнителей в calculation_data для заказ-наряда
      const calcToUpdate = _calcs.find(c => c.id === finalCalcId);
      const existingData = calcToUpdate?.calculation_data || {};
      const updatedData  = { ...existingData, service_assignments: serviceAssignments };

      await sb.from('calculations').update({
        status:           'scheduled',
        scheduled_from:   _dateFrom,
        scheduled_to:     _dateTo,
        post_id:          _selectedPost || null,
        calculation_data: updatedData,
      }).eq('id', finalCalcId);
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '&#x2705; Записать'; }
    if (ok) { BookingPopup.close(); if (typeof _onSaved === 'function') _onSaved(); }
    else alert('Ошибка сохранения. Проверьте консоль.');
  },
};

document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'bpOverlay') BookingPopup.close();
});

})();

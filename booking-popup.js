/**
 * booking-popup.js — попап «Записать авто»
 * BookingPopup.open({ calcId, calcName, calcPrice, studioId, onSaved })
 * BookingPopup.close()
 */
(function() {
'use strict';

// ── CSS ────────────────────────────────────────────────
const CSS = `
#bpOverlay {
  display:none; position:fixed; inset:0; z-index:4000;
  background:rgba(15,23,42,0.55); backdrop-filter:blur(6px);
  align-items:center; justify-content:center;
  padding:16px;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;
}
#bpOverlay.active { display:flex; animation:bpFadeIn 0.15s ease; }
@keyframes bpFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes bpSlideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }

#bpBox {
  background:#fff; border-radius:18px;
  border:1px solid rgba(15,23,42,0.08);
  width:100%; max-width:880px; max-height:92svh;
  overflow-y:auto; display:flex; flex-direction:column;
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

#bpCarSelect { margin:14px 26px 0; flex-shrink:0; }
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

#bpBody { display:grid; grid-template-columns:1fr 1fr; gap:20px; padding:16px 26px 24px; }
@media(max-width:640px){
  #bpBody{grid-template-columns:1fr;}
  #bpHead,#bpCarSelect{padding-left:18px;padding-right:18px;}
  #bpBody{padding:14px 18px 20px;}
  #bpFoot{padding:0 18px 18px;}
}

.bp-section-title {
  font-size:0.68rem; font-weight:800; text-transform:uppercase;
  letter-spacing:0.07em; color:#94a3b8; margin-bottom:10px;
}

#bpPosts { display:flex; flex-direction:column; gap:6px; margin-bottom:18px; }
.bp-post-btn {
  display:flex; align-items:center; gap:10px; padding:10px 14px;
  border-radius:10px; border:1.5px solid rgba(15,23,42,0.08);
  background:#f8fafc; cursor:pointer; transition:all 0.15s;
  text-align:left; width:100%; font-family:inherit;
}
.bp-post-btn:hover   { border-color:#2563eb; background:rgba(37,99,235,0.04); }
.bp-post-btn.selected{ border-color:#2563eb; background:rgba(37,99,235,0.08); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
.bp-post-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.bp-post-name { font-size:0.85rem; font-weight:700; color:#0f172a; }
.bp-post-type { font-size:0.7rem; color:#94a3b8; font-weight:600; }
.bp-post-cap  { font-size:0.68rem; color:#2563eb; font-weight:700; background:rgba(37,99,235,0.08); padding:1px 7px; border-radius:10px; margin-left:auto; }
.bp-post-busy { font-size:0.68rem; color:#d97706; font-weight:700; background:rgba(217,119,6,0.08); padding:1px 7px; border-radius:10px; margin-left:auto; }

#bpExecutors { display:flex; flex-direction:column; gap:6px; }
.bp-exec-btn {
  display:flex; align-items:center; gap:10px; padding:9px 14px;
  border-radius:10px; border:1.5px solid rgba(15,23,42,0.08);
  background:#f8fafc; cursor:pointer; transition:all 0.15s;
  text-align:left; width:100%; font-family:inherit;
}
.bp-exec-btn:hover   { border-color:#059669; background:rgba(5,150,105,0.04); }
.bp-exec-btn.selected{ border-color:#059669; background:rgba(5,150,105,0.08); box-shadow:0 0 0 3px rgba(5,150,105,0.1); }
.bp-exec-avatar {
  width:28px; height:28px; border-radius:50%;
  background:rgba(37,99,235,0.1); color:#2563eb;
  font-size:0.72rem; font-weight:800;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.bp-exec-name { font-size:0.85rem; font-weight:700; color:#0f172a; }
.bp-exec-role { font-size:0.7rem; color:#94a3b8; font-weight:600; }
.bp-exec-warn { font-size:0.68rem; color:#d97706; font-weight:700; background:rgba(217,119,6,0.08); padding:1px 7px; border-radius:10px; margin-left:auto; }

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

.bp-note-wrap { margin-top:10px; }
.bp-note-wrap textarea {
  width:100%; padding:9px 12px; background:#f8fafc;
  border:1.5px solid rgba(15,23,42,0.08); border-radius:9px;
  font-size:0.82rem; font-family:inherit; color:#0f172a;
  outline:none; resize:none; transition:border-color 0.15s; min-height:52px;
}
.bp-note-wrap textarea:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }

.bp-conflict {
  margin-top:8px; padding:8px 12px;
  background:rgba(217,119,6,0.07); border:1px solid rgba(217,119,6,0.25);
  border-radius:8px; font-size:0.78rem; color:#92400e; font-weight:600; display:none;
}
.bp-conflict.show { display:block; }

#bpFoot { padding:0 26px 22px; display:flex; gap:10px; flex-shrink:0; }
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
`;

(function injectCSS(){
  if (document.getElementById('bpStyles')) return;
  const s = document.createElement('style');
  s.id = 'bpStyles'; s.textContent = CSS;
  document.head.appendChild(s);
})();

// ── Переводы ──────────────────────────────────────────
const POST_TYPE_RU = {
  wrap:'Оклейка/PPF', detailing:'Детейлинг',
  wash:'Мойка', chem:'Химчистка', universal:'Универсальный'
};
const ROLE_RU = {
  owner:'Владелец', manager:'Менеджер', admin:'Администратор',
  wrapper:'Оклейщик', detailer:'Детейлер', preparer:'Подготовщик',
  armature:'Арматурщик', washer:'Мойщик', staff:'Сотрудник',
  universal:'Универсал', detailer:'Детейлер',
};
function roleRu(r){ return ROLE_RU[r] || r || 'Сотрудник'; }

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const STATUS_LABEL = {
  new:'Расчёт', draft:'Первичный', scheduled:'Запись', in_progress:'В работе',
  done:'Готово', delivered:'Выдано'
};

// ── Хелперы — ЛОКАЛЬНОЕ время, не UTC! ────────────────
function toISO(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseDate(s){
  if(!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function formatRu(s){
  if(!s) return '—';
  return parseDate(s).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
}
function fmt(n){ return new Intl.NumberFormat('ru-RU').format(n||0); }
function datesOverlap(f1,t1,f2,t2){ return f1<=t2 && t1>=f2; }
function bookingsForPost(pid){ return _bookings.filter(b=>b.post_id===pid); }
function execBusyInRange(eid){
  if(!_dateFrom||!_dateTo) return false;
  return _bookings.some(b=>{
    if(!b.executor_ids) return false;
    if(!datesOverlap(_dateFrom,_dateTo,b.date_from,b.date_to)) return false;
    return b.executor_ids.includes(eid);
  });
}

// ── DOM ────────────────────────────────────────────────
function buildDOM(){
  if(document.getElementById('bpOverlay')) return;
  const div = document.createElement('div');
  div.innerHTML = `
<div id="bpOverlay">
  <div id="bpBox">
    <div id="bpHead">
      <div>
        <div id="bpCarTitle">📅 Записать авто</div>
        <div id="bpCarPrice"></div>
      </div>
      <button id="bpCloseBtn" onclick="BookingPopup.close()">✕</button>
    </div>
    <div id="bpCarSelect">
      <div class="bp-car-tabs">
        <button class="bp-car-tab active" id="bpTabCalc"   onclick="BookingPopup._switchTab('calc')">📋 Из расчётов</button>
        <button class="bp-car-tab"        id="bpTabManual" onclick="BookingPopup._switchTab('manual')">✏️ Ввести вручную</button>
      </div>
      <div id="bpTabCalcBody">
        <select class="bp-calc-select" id="bpCalcSel" onchange="BookingPopup._onCalcSelect(this.value)">
          <option value="">⏳ Загрузка...</option>
        </select>
      </div>
      <div id="bpTabManualBody" style="display:none">
        <div class="bp-manual-grid">
          <input class="bp-manual-input" id="bpManualBrand" placeholder="Марка и модель">
          <input class="bp-manual-input" id="bpManualPlate" placeholder="Гос. номер">
        </div>
      </div>
    </div>
    <div id="bpBody">
      <div>
        <div class="bp-section-title">Рабочий пост</div>
        <div id="bpPosts"><div class="bp-empty">⏳ Загрузка...</div></div>
        <div class="bp-section-title" style="margin-top:16px">Исполнители</div>
        <div id="bpExecutors"><div class="bp-empty">⏳ Загрузка...</div></div>
      </div>
      <div>
        <div class="bp-section-title">Даты</div>
        <div class="bp-month-nav">
          <button onclick="BookingPopup._prevMonth()">‹</button>
          <span class="bp-month-lbl" id="bpMonthLbl"></span>
          <button onclick="BookingPopup._nextMonth()">›</button>
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
        <div class="bp-note-wrap">
          <textarea id="bpNote" placeholder="Комментарий: пожелания, особенности..."></textarea>
        </div>
        <div class="bp-conflict" id="bpConflict">⚠️ На посту в эти даты уже есть запись. Убедитесь что пост вмещает несколько машин.</div>
      </div>
    </div>
    <div id="bpFoot">
      <button class="bp-btn-cancel" onclick="BookingPopup.close()">Отмена</button>
      <button class="bp-btn-save" id="bpSaveBtn" onclick="BookingPopup._save()">✅ Записать</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(div.firstElementChild);
}

// ── State ──────────────────────────────────────────────
let _studioId=null, _calcId=null, _manualName='', _onSaved=null;
let _posts=[], _executors=[], _bookings=[], _calcs=[];
let _selectedPost=null, _selectedExecs=new Set();
let _dateFrom=null, _dateTo=null, _picking='from';
let _viewYear=new Date().getFullYear(), _viewMonth=new Date().getMonth();
let _tab='calc';

// ── Load ───────────────────────────────────────────────
async function loadData(){
  const sb = window._crmSb;
  if(!sb||!_studioId){ console.error('BookingPopup: нет studioId'); return; }

  const [pr,er,br,cr] = await Promise.all([
    sb.from('posts').select('*').eq('studio_id',_studioId).eq('is_active',true).order('created_at'),
    sb.from('executors').select('id,full_name,role').eq('studio_id',_studioId).eq('is_active',true).order('full_name'),
    sb.from('calendar_bookings').select('*').eq('studio_id',_studioId),
    sb.from('calculations').select('id,car_name,status,final_price,total_price')
      .eq('studio_id',_studioId)
      .in('status',['new','draft'])
      .order('created_at',{ascending:false}),
  ]);

  _posts=pr.data||[]; _executors=er.data||[]; _bookings=br.data||[]; _calcs=cr.data||[];
  renderCalcSelect(); renderPosts(); renderExecutors();
}

function renderCalcSelect(){
  const sel = document.getElementById('bpCalcSel');
  if(!sel) return;
  if(!_calcs.length){ sel.innerHTML='<option value="">Нет расчётов</option>'; return; }
  sel.innerHTML = '<option value="">— Выберите расчёт —</option>' +
    _calcs.map(c=>{
      const st = STATUS_LABEL[c.status]||c.status;
      const pr = fmt(c.final_price||c.total_price||0);
      return `<option value="${c.id}" ${c.id===_calcId?'selected':''}>${c.car_name||'Без названия'} · ${st} · ${pr} ₽</option>`;
    }).join('');
}

function renderPosts(){
  const el = document.getElementById('bpPosts');
  if(!el) return;
  if(!_posts.length){ el.innerHTML='<div class="bp-empty">Нет постов. <a href="settings.html" style="color:#2563eb">Добавить</a></div>'; return; }
  el.innerHTML = _posts.map(p=>{
    const busy = _dateFrom&&_dateTo ? bookingsForPost(p.id).filter(b=>datesOverlap(_dateFrom,_dateTo,b.date_from,b.date_to)).length : 0;
    const cap=p.capacity||1, full=busy>=cap, sel=_selectedPost===p.id?' selected':'';
    const badge = busy>0
      ? `<span class="${full?'bp-post-busy':'bp-post-cap'}">${busy}/${cap} авто</span>`
      : cap>1 ? `<span class="bp-post-cap">до ${cap}</span>` : '';
    return `<button class="bp-post-btn${sel}" onclick="BookingPopup._selectPost('${p.id}')">
      <div class="bp-post-dot" style="background:${p.color||'#2563eb'}"></div>
      <div style="flex:1;min-width:0">
        <div class="bp-post-name">${p.name}</div>
        <div class="bp-post-type">${POST_TYPE_RU[p.type]||p.type}</div>
      </div>${badge}
    </button>`;
  }).join('');
}

function renderExecutors(){
  const el = document.getElementById('bpExecutors');
  if(!el) return;
  if(!_executors.length){ el.innerHTML='<div class="bp-empty">Нет сотрудников. <a href="executors.html" style="color:#2563eb">Добавить</a></div>'; return; }
  el.innerHTML = _executors.map(e=>{
    const busy=execBusyInRange(e.id), sel=_selectedExecs.has(e.id)?' selected':'';
    const ini=(e.full_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<button class="bp-exec-btn${sel}" onclick="BookingPopup._toggleExec('${e.id}')">
      <div class="bp-exec-avatar">${ini}</div>
      <div style="flex:1;min-width:0">
        <div class="bp-exec-name">${e.full_name}</div>
        <div class="bp-exec-role">${roleRu(e.role)}</div>
      </div>${busy?'<span class="bp-exec-warn">⚠️ Занят</span>':''}
    </button>`;
  }).join('');
}

function renderCalendar(){
  const el=document.getElementById('bpCalGrid'), lbl=document.getElementById('bpMonthLbl');
  if(!el||!lbl) return;
  lbl.textContent=`${MONTHS[_viewMonth]} ${_viewYear}`;

  const today=toISO(new Date());
  const DAY_HDR=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  // Первый день месяца, конвертим воскресенье(0) → 6, остальные -1
  const firstDay=new Date(_viewYear,_viewMonth,1);
  let startPad=firstDay.getDay();
  startPad = startPad===0 ? 6 : startPad-1;
  const gridStart=new Date(_viewYear,_viewMonth,1-startPad);

  const lastDay=new Date(_viewYear,_viewMonth+1,0);
  let endPad=lastDay.getDay();
  endPad = endPad===0 ? 0 : 7-endPad;
  const gridEnd=new Date(_viewYear,_viewMonth+1,endPad);

  const dates=[];
  const cur=new Date(gridStart);
  while(cur<=gridEnd){ dates.push(toISO(new Date(cur))); cur.setDate(cur.getDate()+1); }

  // Занятые дни поста
  const busyDates=new Set();
  if(_selectedPost){
    bookingsForPost(_selectedPost).forEach(b=>{
      const c=parseDate(b.date_from), e=parseDate(b.date_to);
      while(c<=e){ busyDates.add(toISO(new Date(c))); c.setDate(c.getDate()+1); }
    });
  }

  let html=DAY_HDR.map((d,i)=>`<div class="bp-day-hdr${i>=5?' we':''}">${d}</div>`).join('');

  dates.forEach(ds=>{
    const d=parseDate(ds);
    const isOther   = d.getMonth()!==_viewMonth;
    const isPast    = ds<today;
    const isWe      = d.getDay()===0||d.getDay()===6;
    const isToday   = ds===today;
    const isFrom    = ds===_dateFrom;
    const isTo      = ds===_dateTo;
    const isBetween = _dateFrom&&_dateTo&&ds>_dateFrom&&ds<_dateTo;
    const hasDot    = !isOther&&busyDates.has(ds);

    let cls='bp-day';
    if(isOther)      cls+=' other';
    else if(isPast)  cls+=' past';
    else{
      if(isWe)       cls+=' we-num';
      if(isToday)    cls+=' today';
      if(isFrom)     cls+=' from';
      if(isTo)       cls+=' to';
      if(isBetween)  cls+=' between';
    }

    const click=(!isOther&&!isPast)?`onclick="BookingPopup._pickDate('${ds}')"`: '';
    html+=`<div class="${cls}" ${click}><div class="bp-day-num">${d.getDate()}</div>${hasDot?'<div class="bp-day-dot"></div>':''}</div>`;
  });

  el.innerHTML=html;

  // Подписи
  const fromEl=document.getElementById('bpFromLbl'), toEl=document.getElementById('bpToLbl');
  const hint=document.getElementById('bpPickHint');
  if(fromEl){ fromEl.textContent=_dateFrom?formatRu(_dateFrom):'—'; fromEl.classList.toggle('empty',!_dateFrom); }
  if(toEl)  { toEl.textContent=_dateTo?formatRu(_dateTo):'—';       toEl.classList.toggle('empty',!_dateTo); }

  const pf=document.getElementById('bpPillFrom'), pt=document.getElementById('bpPillTo');
  if(pf) pf.classList.toggle('active', _picking==='from'&&!_dateTo);
  if(pt) pt.classList.toggle('active', _picking==='to');

  if(hint){
    if(!_dateFrom&&!_dateTo) hint.innerHTML='Кликните на <span>дату заезда</span>';
    else if(_dateFrom&&!_dateTo) hint.innerHTML='Теперь выберите <span>дату выезда</span>';
    else {
      const days=Math.round((parseDate(_dateTo)-parseDate(_dateFrom))/86400000)+1;
      hint.innerHTML=`<span>${formatRu(_dateFrom)}</span> — <span>${formatRu(_dateTo)}</span> · ${days} дн. · кликните чтобы скорректировать`;
    }
  }
  checkConflict();
}

function checkConflict(){
  const el=document.getElementById('bpConflict');
  if(!el) return;
  if(!_selectedPost||!_dateFrom||!_dateTo){ el.classList.remove('show'); return; }
  const cap=_posts.find(p=>p.id===_selectedPost)?.capacity||1;
  const busy=bookingsForPost(_selectedPost).filter(b=>datesOverlap(_dateFrom,_dateTo,b.date_from,b.date_to)).length;
  el.classList.toggle('show',busy>=cap);
}

// ── Public API ─────────────────────────────────────────
window.BookingPopup = {

  open: function({calcId,calcName,calcPrice,studioId,onSaved}={}){
    buildDOM();
    _studioId=studioId; _calcId=calcId||null; _onSaved=onSaved||null;
    _selectedPost=null; _selectedExecs=new Set();
    _dateFrom=null; _dateTo=null; _picking='from'; _tab='calc';
    _viewYear=new Date().getFullYear(); _viewMonth=new Date().getMonth();

    const titleEl=document.getElementById('bpCarTitle');
    const priceEl=document.getElementById('bpCarPrice');
    if(titleEl) titleEl.textContent=calcName?`📅 ${calcName}`:'📅 Записать авто';
    if(priceEl) priceEl.textContent=calcPrice?`КП: ${fmt(calcPrice)} ₽`:'';
    document.getElementById('bpNote').value='';

    BookingPopup._switchTab('calc');
    document.getElementById('bpOverlay').classList.add('active');
    document.body.style.overflow='hidden';
    renderCalendar();
    loadData();
  },

  close: function(){
    const el=document.getElementById('bpOverlay');
    if(el) el.classList.remove('active');
    document.body.style.overflow='';
  },

  _switchTab: function(tab){
    _tab=tab;
    document.getElementById('bpTabCalcBody').style.display   = tab==='calc'?'block':'none';
    document.getElementById('bpTabManualBody').style.display = tab==='manual'?'block':'none';
    document.getElementById('bpTabCalc').classList.toggle('active',   tab==='calc');
    document.getElementById('bpTabManual').classList.toggle('active', tab==='manual');
  },

  _onCalcSelect: function(id){
    _calcId=id||null;
    const c=_calcId?_calcs.find(x=>x.id===_calcId):null;
    const el=document.getElementById('bpCarTitle');
    const pr=document.getElementById('bpCarPrice');
    if(el) el.textContent=c?`📅 ${c.car_name}`:'📅 Записать авто';
    if(pr) pr.textContent=c?`КП: ${fmt(c.final_price||c.total_price||0)} ₽`:'';
  },

  _prevMonth: function(){
    _viewMonth--; if(_viewMonth<0){_viewMonth=11;_viewYear--;} renderCalendar();
  },
  _nextMonth: function(){
    _viewMonth++; if(_viewMonth>11){_viewMonth=0;_viewYear++;} renderCalendar();
  },

  _pickDate: function(ds){
    if(!_dateFrom && !_dateTo){
      // Ничего нет — ставим заезд
      _dateFrom=ds; _picking='to';
    } else if(_dateFrom && !_dateTo){
      // Есть заезд, нет выезда
      if(ds===_dateFrom){ _dateFrom=null; _picking='from'; }
      else if(ds<_dateFrom){ _dateFrom=ds; } // кликнули раньше — сдвигаем заезд
      else { _dateTo=ds; _picking='from'; }
    } else {
      // Оба выбраны — меняем ближайший к клику
      const diffFrom = Math.abs(parseDate(ds)-parseDate(_dateFrom));
      const diffTo   = Math.abs(parseDate(ds)-parseDate(_dateTo));
      if(diffFrom<=diffTo){
        // Меняем заезд
        if(ds>_dateTo){ _dateFrom=_dateTo; _dateTo=ds; } // swap
        else _dateFrom=ds;
      } else {
        // Меняем выезд
        if(ds<_dateFrom){ _dateTo=_dateFrom; _dateFrom=ds; } // swap
        else _dateTo=ds;
      }
    }
    renderCalendar(); renderPosts(); renderExecutors();
  },

  _selectPost: function(pid){
    _selectedPost=_selectedPost===pid?null:pid;
    renderPosts(); renderCalendar();
  },

  _toggleExec: function(eid){
    _selectedExecs.has(eid)?_selectedExecs.delete(eid):_selectedExecs.add(eid);
    renderExecutors();
  },

  _save: async function(){
    if(!_dateFrom){ alert('Выберите дату заезда'); return; }
    if(!_dateTo) _dateTo=_dateFrom;

    let carName='', finalCalcId=null;
    if(_tab==='calc'){
      if(!_calcId){ alert('Выберите расчёт из списка'); return; }
      finalCalcId=_calcId;
      carName=_calcs.find(c=>c.id===_calcId)?.car_name||'';
    } else {
      const brand=document.getElementById('bpManualBrand')?.value.trim()||'';
      const plate=document.getElementById('bpManualPlate')?.value.trim()||'';
      if(!brand){ alert('Введите марку/модель авто'); return; }
      carName=brand+(plate?` (${plate})`:'');
    }

    if(!_selectedPost&&_posts.length){
      if(!confirm('Пост не выбран. Продолжить?')) return;
    }

    const btn=document.getElementById('bpSaveBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ Сохранение...';}

    const sb=window._crmSb;
    const note=document.getElementById('bpNote')?.value.trim()||null;
    const execIds=Array.from(_selectedExecs);
    let ok=true;

    const {error:bErr}=await sb.from('calendar_bookings').insert({
      studio_id:_studioId, post_id:_selectedPost||null, calc_id:finalCalcId,
      car_name:carName, date_from:_dateFrom, date_to:_dateTo,
      note, executor_ids:execIds.length?execIds:null,
    });
    if(bErr){console.error(bErr);ok=false;}

    if(ok&&finalCalcId){
      await sb.from('calculations').update({
        status:'scheduled', scheduled_from:_dateFrom,
        scheduled_to:_dateTo, post_id:_selectedPost||null,
      }).eq('id',finalCalcId);
    }

    if(btn){btn.disabled=false;btn.textContent='✅ Записать';}
    if(ok){ BookingPopup.close(); if(typeof _onSaved==='function') _onSaved(); }
    else alert('❌ Ошибка сохранения. Проверьте консоль.');
  },
};

document.addEventListener('click',function(e){
  if(e.target&&e.target.id==='bpOverlay') BookingPopup.close();
});

})();

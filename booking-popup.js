/**
 * booking-popup.js — попап «Записать авто»
 * Поток: Машина → Услуги (исполнитель + даты на каждую) → Пост → Комментарий
 * BookingPopup.open({ calcId, calcName, calcPrice, studioId, onSaved })
 */
(function () {
'use strict';

function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

const CSS = `
#bpOverlay {
  display:none; position:fixed; inset:0; z-index:4000;
  background:rgba(15,23,42,0.55); backdrop-filter:blur(6px);
  align-items:flex-start; justify-content:center;
  padding:24px 16px 40px; overflow-y:auto;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',Arial,sans-serif;
}
#bpOverlay.active { display:flex; animation:bpFadeIn 0.15s ease; }
@keyframes bpFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes bpSlideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }
#bpBox {
  background:#fff; border-radius:18px; border:1px solid rgba(15,23,42,0.08);
  width:100%; max-width:720px; display:flex; flex-direction:column;
  box-shadow:0 24px 80px rgba(0,0,0,0.2); animation:bpSlideUp 0.18s ease;
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
.bp-section { padding:18px 26px 0; }
.bp-section-title { font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; color:#94a3b8; margin-bottom:10px; }
.bp-section-divider { height:1px; background:rgba(15,23,42,0.06); margin:16px 26px 0; }
.bp-car-tabs { display:flex; gap:6px; margin-bottom:10px; }
.bp-car-tab { padding:5px 14px; border-radius:20px; font-size:0.75rem; font-weight:700; border:1.5px solid rgba(15,23,42,0.1); background:#f8fafc; color:#64748b; cursor:pointer; font-family:inherit; transition:all 0.15s; }
.bp-car-tab.active { background:#2563eb; color:#fff; border-color:#2563eb; }
.bp-calc-select { width:100%; padding:9px 12px; background:#f8fafc; border:1.5px solid rgba(15,23,42,0.1); border-radius:9px; font-size:0.88rem; font-family:inherit; color:#0f172a; outline:none; -webkit-appearance:none; cursor:pointer; transition:border-color 0.15s; }
.bp-calc-select:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
.bp-manual-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.bp-manual-input { width:100%; padding:9px 12px; background:#f8fafc; border:1.5px solid rgba(15,23,42,0.1); border-radius:9px; font-size:0.88rem; font-family:inherit; color:#0f172a; outline:none; transition:border-color 0.15s; }
.bp-manual-input:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
.bp-manual-input::placeholder { color:#94a3b8; }
#bpServices { display:flex; flex-direction:column; gap:6px; }
.bp-svc-item { border:1.5px solid rgba(15,23,42,0.08); border-radius:12px; overflow:hidden; transition:border-color 0.15s; }
.bp-svc-item.has-exec  { border-color:rgba(37,99,235,0.3); }
.bp-svc-item.complete  { border-color:#059669; }
.bp-svc-trigger { display:flex; align-items:center; gap:10px; padding:12px 14px; background:#f8fafc; cursor:pointer; width:100%; font-family:inherit; border:none; text-align:left; transition:background 0.15s; }
.bp-svc-item.open > .bp-svc-trigger { background:#fff; }
.bp-svc-trigger:hover { background:#f1f5f9; }
.bp-svc-status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; background:rgba(15,23,42,0.12); transition:background 0.2s; }
.bp-svc-item.has-exec .bp-svc-status-dot { background:#2563eb; }
.bp-svc-item.complete  .bp-svc-status-dot { background:#059669; }
.bp-svc-trigger-name { font-size:0.85rem; font-weight:700; color:#0f172a; flex:1; }
.bp-svc-trigger-summary { font-size:0.75rem; color:#64748b; font-weight:600; text-align:right; white-space:nowrap; }
.bp-svc-trigger-arrow { font-size:0.75rem; color:#94a3b8; flex-shrink:0; transition:transform 0.2s; }
.bp-svc-item.open .bp-svc-trigger-arrow { transform:rotate(180deg); }
.bp-svc-body { display:none; padding:14px 14px 16px; border-top:1px solid rgba(15,23,42,0.06); background:#fff; }
.bp-svc-item.open .bp-svc-body { display:block; }
.bp-svc-body-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#94a3b8; margin-bottom:8px; }
.bp-exec-cards { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
.bp-exec-card { display:flex; flex-direction:column; gap:1px; padding:8px 12px; border-radius:9px; border:1.5px solid rgba(15,23,42,0.08); background:#f8fafc; cursor:pointer; transition:all 0.15s; font-family:inherit; text-align:left; min-width:120px; }
.bp-exec-card:hover    { border-color:#2563eb; background:rgba(37,99,235,0.04); }
.bp-exec-card.selected { border-color:#2563eb; background:rgba(37,99,235,0.07); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
.bp-exec-card-name { font-size:0.82rem; font-weight:700; color:#0f172a; }
.bp-exec-card-role { font-size:0.70rem; color:#64748b; font-weight:600; }
.bp-svc-date-row { display:flex; align-items:center; gap:6px; margin-bottom:10px; }
.bp-svc-date-btn { flex:1; padding:8px 12px; border-radius:9px; text-align:left; border:1.5px solid rgba(15,23,42,0.08); background:#f8fafc; cursor:pointer; font-family:inherit; transition:all 0.15s; }
.bp-svc-date-btn:hover   { border-color:#2563eb; }
.bp-svc-date-btn.picking { border-color:#2563eb; background:rgba(37,99,235,0.06); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
.bp-svc-date-btn.filled  { border-color:rgba(15,23,42,0.15); background:#fff; }
.bp-svc-date-lbl { font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#94a3b8; margin-bottom:2px; }
.bp-svc-date-val { font-size:0.85rem; font-weight:800; color:#0f172a; }
.bp-svc-date-val.empty { color:#c0ccda; font-weight:600; font-size:0.75rem; }
.bp-svc-date-arrow { color:#cbd5e1; flex-shrink:0; }
.bp-mini-cal { background:#f8fafc; border-radius:10px; padding:10px; }
.bp-mini-nav { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
.bp-mini-nav button { width:24px; height:24px; border-radius:6px; border:1px solid rgba(15,23,42,0.10); background:#fff; cursor:pointer; font-size:0.8rem; color:#0f172a; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.bp-mini-lbl { font-size:0.78rem; font-weight:700; color:#0f172a; flex:1; text-align:center; }
.bp-mini-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.bp-mini-hdr { text-align:center; font-size:0.55rem; font-weight:700; text-transform:uppercase; color:#94a3b8; padding:2px 0 4px; }
.bp-mini-hdr.we { color:#ef4444; }
.bp-mini-day { aspect-ratio:1; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:600; color:#0f172a; cursor:pointer; border:1.5px solid transparent; user-select:none; transition:background 0.1s; }
.bp-mini-day:hover:not(.other):not(.past) { background:rgba(37,99,235,0.1); }
.bp-mini-day.other  { color:#d1d5db; pointer-events:none; }
.bp-mini-day.past   { color:#d1d5db; cursor:not-allowed; pointer-events:none; }
.bp-mini-day.today  { border-color:rgba(37,99,235,0.4); color:#2563eb; font-weight:800; }
.bp-mini-day.we-num { color:#ef4444; }
.bp-mini-day.from, .bp-mini-day.to { background:#2563eb !important; color:#fff !important; border-color:#2563eb !important; }
.bp-mini-day.from    { border-radius:5px 0 0 5px; }
.bp-mini-day.to      { border-radius:0 5px 5px 0; }
.bp-mini-day.from.to { border-radius:5px !important; }
.bp-mini-day.between { background:rgba(37,99,235,0.13) !important; border-radius:0; color:#1e40af; }
.bp-total-dates { display:flex; align-items:center; gap:10px; padding:10px 14px; background:rgba(37,99,235,0.05); border:1.5px solid rgba(37,99,235,0.15); border-radius:10px; margin-top:10px; flex-wrap:wrap; }
.bp-total-dates-lbl { font-size:0.72rem; font-weight:700; color:#2563eb; }
.bp-total-dates-val { font-size:0.88rem; font-weight:800; color:#0f172a; }
.bp-total-dates-days { font-size:0.75rem; color:#64748b; font-weight:600; margin-left:auto; }
#bpPosts { display:flex; flex-wrap:wrap; gap:6px; }
.bp-post-btn { display:flex; align-items:center; gap:8px; padding:9px 14px; border-radius:10px; border:1.5px solid rgba(15,23,42,0.08); background:#f8fafc; cursor:pointer; transition:all 0.15s; font-family:inherit; }
.bp-post-btn:hover    { border-color:#2563eb; background:rgba(37,99,235,0.04); }
.bp-post-btn.selected { border-color:#2563eb; background:rgba(37,99,235,0.08); box-shadow:0 0 0 3px rgba(37,99,235,0.1); }
.bp-post-dot  { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
.bp-post-name { font-size:0.83rem; font-weight:700; color:#0f172a; }
.bp-post-type { font-size:0.68rem; color:#94a3b8; font-weight:600; }
.bp-post-cap  { font-size:0.68rem; color:#2563eb; font-weight:700; background:rgba(37,99,235,0.08); padding:1px 7px; border-radius:10px; }
.bp-post-busy { font-size:0.68rem; color:#d97706; font-weight:700; background:rgba(217,119,6,0.08); padding:1px 7px; border-radius:10px; }
.bp-post-hint { font-size:0.75rem; color:#94a3b8; padding:4px 0 8px; }
.bp-conflict { margin-top:8px; padding:8px 12px; background:rgba(217,119,6,0.07); border:1px solid rgba(217,119,6,0.25); border-radius:8px; font-size:0.78rem; color:#92400e; font-weight:600; display:none; }
.bp-conflict.show { display:block; }
.bp-note-wrap textarea { width:100%; padding:9px 12px; background:#f8fafc; border:1.5px solid rgba(15,23,42,0.08); border-radius:9px; font-size:0.82rem; font-family:inherit; color:#0f172a; outline:none; resize:none; transition:border-color 0.15s; min-height:64px; }
.bp-note-wrap textarea:focus { border-color:#2563eb; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
#bpFoot { padding:16px 26px 22px; display:flex; gap:10px; flex-shrink:0; }
.bp-btn-cancel { background:rgba(15,23,42,0.05); color:#64748b; border:1px solid rgba(15,23,42,0.10); padding:10px 18px; border-radius:9px; cursor:pointer; font-size:0.82rem; font-weight:700; font-family:inherit; transition:all 0.15s; }
.bp-btn-cancel:hover { background:#fee2e2; color:#dc2626; }
.bp-btn-save { flex:1; background:#2563eb; color:#fff; border:none; padding:11px 18px; border-radius:9px; cursor:pointer; font-size:0.88rem; font-weight:800; font-family:inherit; transition:all 0.15s; }
.bp-btn-save:hover    { background:#1d4ed8; }
.bp-btn-save:disabled { opacity:0.5; cursor:not-allowed; }
.bp-empty { color:#94a3b8; font-size:0.82rem; padding:6px 0; }
@media(max-width:640px){
  #bpHead,.bp-section{ padding-left:16px; padding-right:16px; }
  .bp-section-divider{ margin-left:16px; margin-right:16px; }
  #bpFoot{ padding:14px 16px 18px; }
  .bp-manual-grid{ grid-template-columns:1fr; }
}
`;

(function injectCSS() {
  if (document.getElementById('bpStyles')) return;
  const s = document.createElement('style');
  s.id = 'bpStyles'; s.textContent = CSS;
  document.head.appendChild(s);
})();

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const POST_TYPE_RU = { box:'Бокс', lift:'Подъёмник', outdoor:'Открытая зона', other:'Другое' };
const ROLE_RU = { owner:'Владелец', admin:'Администратор', manager:'Менеджер', executor:'Исполнитель', viewer:'Просмотр', wrapper:'Оклейщик', preparer:'Подготовщик', armature:'Арматурщик', detailer:'Детейлер', universal:'Универсал', outsource:'Аутсорсинг' };
const SVC_ROLES = { pkg_wrap:['wrapper','universal'], pkg_prep:['preparer','universal'], pkg_arm_dis:['armature','universal'], pkg_arm_asm:['armature','universal'], impact_wrap:['wrapper','universal'], impact_prep:['preparer','universal'], impact_arm_dis:['armature','universal'], impact_arm_asm:['armature','universal'], arm:['armature','universal'], wrap:['wrapper','universal'], det:['detailer','preparer','universal'], gl:['wrapper','detailer','universal'], ms:null };

function rolesForSvc(key) {
  if (key in SVC_ROLES) return SVC_ROLES[key];
  const prefix = Object.keys(SVC_ROLES).find(k => key.startsWith(k));
  return prefix !== undefined ? SVC_ROLES[prefix] : null;
}
function execsForSvc(key) {
  const roles = rolesForSvc(key);
  if (!roles) return _executors;
  const f = _executors.filter(e => roles.includes(e.role));
  return f.length ? f : _executors;
}
function roleRu(r) { return ROLE_RU[r] || r || 'Сотрудник'; }

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function parseDate(s) { if(!s) return null; const [y,m,d]=s.split('-'); const dt=new Date(+y,+m-1,+d); return isNaN(dt.getTime())?null:dt; }
function formatRu(s)  { const d=parseDate(s); if(!d) return '—'; return d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}); }
function fmt(n)       { return new Intl.NumberFormat('ru-RU').format(n||0); }
function datesOverlap(f1,t1,f2,t2) { return f1<=t2 && t1>=f2; }
function daysBetween(a,b) { const da=parseDate(a),db=parseDate(b); if(!da||!db) return 0; return Math.round((db-da)/86400000)+1; }

function buildDOM() {
  if (document.getElementById('bpOverlay')) return;
  const div = document.createElement('div');
  div.innerHTML = `
<div id="bpOverlay">
  <div id="bpBox">
    <div id="bpHead">
      <div>
        <div id="bpCarTitle">&#x1F4C5; Записать авто</div>
        <div id="bpCarPrice"></div>
      </div>
      <button id="bpCloseBtn" onclick="BookingPopup.close()">&#x2715;</button>
    </div>
    <div class="bp-section" style="padding-top:18px">
      <div class="bp-section-title">&#x1F697; Автомобиль</div>
      <div class="bp-car-tabs">
        <button class="bp-car-tab active" id="bpTabCalc"   onclick="BookingPopup._switchTab('calc')">&#x1F4CB; Из расчётов</button>
        <button class="bp-car-tab"        id="bpTabManual" onclick="BookingPopup._switchTab('manual')">&#x270F; Ввести вручную</button>
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
    <div class="bp-section-divider"></div>
    <div class="bp-section">
      <div class="bp-section-title">&#x1F527; Услуги &#x2014; исполнитель и даты</div>
      <div id="bpServices"><div class="bp-empty">Выберите расчёт &#x2014; увидите список услуг</div></div>
      <div id="bpTotalDates" style="display:none" class="bp-total-dates">
        <span class="bp-total-dates-lbl">&#x1F4C6; Тачка на посту:</span>
        <span class="bp-total-dates-val" id="bpTotalDatesVal">&#x2014;</span>
        <span class="bp-total-dates-days" id="bpTotalDaysCnt"></span>
      </div>
    </div>
    <div class="bp-section-divider"></div>
    <div class="bp-section">
      <div class="bp-section-title">&#x1F3D7; Рабочий пост</div>
      <div id="bpPostHint" class="bp-post-hint">Сначала заполните услуги &#x2014; увидите свободные посты</div>
      <div id="bpPosts" style="display:none"></div>
      <div class="bp-conflict" id="bpConflict">&#x26A0;&#xFE0F; На посту в эти даты уже есть запись. Убедитесь что пост вмещает несколько машин.</div>
    </div>
    <div class="bp-section-divider"></div>
    <div class="bp-section" style="padding-bottom:4px">
      <div class="bp-section-title">&#x1F4DD; Комментарий</div>
      <div class="bp-note-wrap">
        <textarea id="bpNote" placeholder="Пожелания, особенности авто, доп. инструкции..."></textarea>
      </div>
    </div>
    <div id="bpFoot">
      <button class="bp-btn-cancel" onclick="BookingPopup.close()">Отмена</button>
      <button class="bp-btn-save" id="bpSaveBtn" onclick="BookingPopup._save()">&#x2705; Записать</button>
    </div>
  </div>
</div>`;
  document.body.appendChild(div.firstElementChild);
}

let _studioId=null, _calcId=null, _onSaved=null, _tab='calc';
let _posts=[], _executors=[], _bookings=[], _calcs=[];
let _calcServices=[], _selectedPost=null;
let _svcState={}, _openSvc=null;

async function loadData() {
  const sb = window._crmSb;
  if (!sb || !_studioId) return;
  if (_calcId) {
    const { data: c } = await sb.from('calculations').select('id,car_name,status,final_price,total_price,calculation_data').eq('id',_calcId).single();
    if (c) {
      if (!_calcs.find(x=>x.id===c.id)) _calcs.push(c);
      _calcServices = extractServices(c);
      initSvcState();
      renderServices();
      const te=document.getElementById('bpCarTitle'), pe=document.getElementById('bpCarPrice');
      if (te) te.innerHTML=`&#x1F4C5; ${esc(c.car_name||'Авто')}`;
      if (pe) pe.innerHTML=`&#x20BD; ${fmt(c.final_price||c.total_price||0)}`;
    }
  }
  const [pr,er,br,cr] = await Promise.all([
    sb.from('posts').select('*').eq('studio_id',_studioId).eq('is_active',true).order('created_at'),
    sb.from('executors').select('id,full_name,role').eq('studio_id',_studioId).eq('is_active',true).order('full_name'),
    sb.from('calendar_bookings').select('post_id,date_from,date_to,executor_ids').eq('studio_id',_studioId),
    sb.from('calculations').select('id,car_name,status,final_price,total_price,calculation_data').eq('studio_id',_studioId).in('status',['new','draft']).order('created_at',{ascending:false}).limit(100),
  ]);
  _posts=pr.data||[]; _executors=er.data||[]; _bookings=br.data||[];
  (cr.data||[]).forEach(c=>{ if(!_calcs.find(x=>x.id===c.id)) _calcs.push(c); });
  renderCalcSelect();
  renderServices();
  renderPosts();
  const sel=document.getElementById('bpCalcSel');
  if (sel&&_calcId) sel.value=_calcId;
}

function initSvcState() {
  const now=new Date();
  _svcState={};
  _calcServices.forEach(svc=>{
    _svcState[svc.key]={ executor_id:null, date_from:null, date_to:null, picking:'from', viewYear:now.getFullYear(), viewMonth:now.getMonth() };
  });
}

function extractServices(calc) {
  const services=[], seen=new Set();
  if (!calc) return services;
  const d=calc.calculation_data;
  if (!d) return services;
  function add(key,name,mat,mot) {
    const price=(parseFloat(mat)||0)+(parseFloat(mot)||0);
    if (price>0&&!seen.has(key)){ seen.add(key); services.push({key,name,price}); }
  }
  if (d.package) {
    add('pkg_prep',    'Подготовка',              d.package.prepMat, d.package.prepMot);
    add('pkg_arm_dis', 'Арматурные работы: Разбор', d.package.armMat,  d.package.armMot);
    add('pkg_wrap',    'Оклейка',                  d.package.wrapMat, d.package.wrapMot);
    add('pkg_arm_asm', 'Арматурные работы: Сборка', d.package.armMat,  d.package.armMot);
  }
  if (d.impact) {
    add('impact_prep',    'Подготовка (Ударная часть)',               d.impact.prepMat, d.impact.prepMot);
    add('impact_arm_dis', 'Арматурные работы: Разбор (Ударная часть)', d.impact.armMat,  d.impact.armMot);
    add('impact_wrap',    'Оклейка (Ударная часть)',                   d.impact.wrapMat, d.impact.wrapMot);
    add('impact_arm_asm', 'Арматурные работы: Сборка (Ударная часть)', d.impact.armMat,  d.impact.armMot);
  }
  if (d.services_detail) {
    const groups={arm:'Бронирование',wrap:'Оклейка',det:'Детейлинг',gl:'Стёкла',ms:'Доп. услуги'};
    Object.entries(groups).forEach(([gk,gn])=>{
      (d.services_detail[gk]||[]).forEach((item,idx)=>{ add(`${gk}_${idx}`,item.name?`${gn}: ${item.name}`:gn,item.mat,item.mot); });
    });
  }
  if (!d.services_detail) {
    const basic={arm:'Арматурные работы',wrap:'Оклейка',det:'Детейлинг',gl:'Стёкла',ms:'Доп. услуги'};
    Object.entries(basic).forEach(([k,n])=>{ if(d[k]) add(k,n,d[k].mat,d[k].mot||d[k].motivation); });
  }
  if (d.services&&Array.isArray(d.services)) {
    d.services.forEach((srv,idx)=>add(`service_${idx}`,srv.name||`Услуга ${idx+1}`,srv.mat,srv.mot||srv.motivation));
  }
  if (!services.length) services.push({key:'general',name:'Работы по авто',price:calc.final_price||calc.total_price||0});
  return services;
}

function renderCalcSelect() {
  const el=document.getElementById('bpCalcSel');
  if (!el) return;
  el.innerHTML='<option value="">— Выберите расчёт —</option>'+
    _calcs.map(c=>`<option value="${c.id}"${c.id===_calcId?' selected':''}>${c.car_name||'Без названия'} · ${fmt(c.final_price||c.total_price||0)} &#x20BD;</option>`).join('');
}

function renderServices() {
  const el=document.getElementById('bpServices');
  if (!el) return;
  if (!_calcServices.length) { el.innerHTML='<div class="bp-empty">Выберите расчёт — увидите список услуг</div>'; return; }
  el.innerHTML=_calcServices.map(svc=>{
    const st=_svcState[svc.key]||{};
    const exec=st.executor_id?_executors.find(e=>e.id===st.executor_id):null;
    const isOpen=_openSvc===svc.key;
    const complete=exec&&st.date_from&&st.date_to;
    const statusCls=complete?'complete':(exec?'has-exec':'');
    const summary=complete?`${exec.full_name.split(' ')[0]} · ${formatRu(st.date_from)}–${formatRu(st.date_to)}`:(exec?exec.full_name.split(' ')[0]:'');
    return `<div class="bp-svc-item ${statusCls} ${isOpen?'open':''}" id="svcItem_${svc.key}">
      <button class="bp-svc-trigger" onclick="BookingPopup._toggleSvc('${svc.key}')">
        <div class="bp-svc-status-dot"></div>
        <div class="bp-svc-trigger-name">${svc.name}</div>
        <div class="bp-svc-trigger-summary">${summary||fmt(svc.price)+' &#x20BD;'}</div>
        <div class="bp-svc-trigger-arrow">&#x25BE;</div>
      </button>
      ${isOpen?renderSvcBody(svc):''}
    </div>`;
  }).join('');
  renderTotalDates();
}

function renderSvcBody(svc) {
  const st=_svcState[svc.key]||{};
  const execs=execsForSvc(svc.key);
  const roles=rolesForSvc(svc.key);
  const roleHint=roles?roles.map(r=>ROLE_RU[r]||r).filter((v,i,a)=>a.indexOf(v)===i).join(', '):'Любой';
  const execCards=execs.map(e=>{
    const sel=st.executor_id===e.id?' selected':'';
    return `<button class="bp-exec-card${sel}" onclick="BookingPopup._assignExec('${svc.key}','${e.id}')">
      <div class="bp-exec-card-name">${e.full_name}</div>
      <div class="bp-exec-card-role">${roleRu(e.role)}</div>
    </button>`;
  }).join('');
  return `<div class="bp-svc-body">
    <div class="bp-svc-body-label">Исполнитель <span style="color:#94a3b8;font-weight:500;text-transform:none">(${roleHint})</span></div>
    <div class="bp-exec-cards">${execCards}</div>
    ${st.executor_id?`
    <div class="bp-svc-body-label">Даты работы</div>
    <div class="bp-svc-date-row">
      <button class="bp-svc-date-btn ${st.picking==='from'?'picking':(st.date_from?'filled':'')}"
        onclick="BookingPopup._setSvcPicking('${svc.key}','from')">
        <div class="bp-svc-date-lbl">&#x1F4CD; Начало</div>
        <div class="bp-svc-date-val ${st.date_from?'':'empty'}">${st.date_from?formatRu(st.date_from):'выберите дату'}</div>
      </button>
      <div class="bp-svc-date-arrow">&#x2192;</div>
      <button class="bp-svc-date-btn ${st.picking==='to'?'picking':(st.date_to?'filled':'')}"
        onclick="BookingPopup._setSvcPicking('${svc.key}','to')">
        <div class="bp-svc-date-lbl">&#x1F3C1; Конец</div>
        <div class="bp-svc-date-val ${st.date_to?'':'empty'}">${st.date_to?formatRu(st.date_to):'выберите дату'}</div>
      </button>
    </div>
    ${renderMiniCal(svc.key)}`:''}
  </div>`;
}

function renderMiniCal(svcKey) {
  const st=_svcState[svcKey], today=toISO(new Date());
  const DAY_HDR=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const firstDay=new Date(st.viewYear,st.viewMonth,1);
  let sp=firstDay.getDay(); sp=sp===0?6:sp-1;
  const gs=new Date(st.viewYear,st.viewMonth,1-sp);
  const ld=new Date(st.viewYear,st.viewMonth+1,0);
  let ep=ld.getDay(); ep=ep===0?0:7-ep;
  const ge=new Date(st.viewYear,st.viewMonth+1,ep);
  const dates=[]; const cur=new Date(gs);
  while(cur<=ge){ dates.push(toISO(new Date(cur))); cur.setDate(cur.getDate()+1); }
  let html=`<div class="bp-mini-cal"><div class="bp-mini-nav">
    <button onclick="BookingPopup._miniPrev('${svcKey}')">&#x2039;</button>
    <span class="bp-mini-lbl">${MONTHS[st.viewMonth]} ${st.viewYear}</span>
    <button onclick="BookingPopup._miniNext('${svcKey}')">&#x203A;</button>
  </div><div class="bp-mini-grid">`;
  html+=DAY_HDR.map((d,i)=>`<div class="bp-mini-hdr${i>=5?' we':''}">${d}</div>`).join('');
  dates.forEach(ds=>{
    const d=parseDate(ds);
    const isOther=d.getMonth()!==st.viewMonth, isPast=ds<today;
    const isWe=d.getDay()===0||d.getDay()===6;
    let cls='bp-mini-day';
    if(isOther) cls+=' other';
    else if(isPast) cls+=' past';
    else {
      if(isWe) cls+=' we-num';
      if(ds===today) cls+=' today';
      if(ds===st.date_from) cls+=' from';
      if(ds===st.date_to)   cls+=' to';
      if(st.date_from&&st.date_to&&ds>st.date_from&&ds<st.date_to) cls+=' between';
    }
    const click=(!isOther&&!isPast)?`onclick="BookingPopup._svcPickDate('${svcKey}','${ds}')"`:'' ;
    html+=`<div class="${cls}" ${click}>${d.getDate()}</div>`;
  });
  html+=`</div></div>`;
  return html;
}

function calcTotalDates() {
  const froms=[], tos=[];
  _calcServices.forEach(svc=>{ const st=_svcState[svc.key]; if(st&&st.date_from) froms.push(st.date_from); if(st&&st.date_to) tos.push(st.date_to); });
  if (!froms.length) return {from:null,to:null};
  return {from:froms.sort()[0], to:tos.sort().reverse()[0]};
}

function renderTotalDates() {
  const wrap=document.getElementById('bpTotalDates');
  const val=document.getElementById('bpTotalDatesVal');
  const cnt=document.getElementById('bpTotalDaysCnt');
  if (!wrap) return;
  const {from,to}=calcTotalDates();
  if (!from||!to){ wrap.style.display='none'; renderPosts(); return; }
  wrap.style.display='flex';
  val.textContent=`${formatRu(from)} — ${formatRu(to)}`;
  const days=daysBetween(from,to);
  cnt.textContent=`${days} ${days===1?'день':days<5?'дня':'дней'}`;
  renderPosts();
}

function renderPosts() {
  const hint=document.getElementById('bpPostHint');
  const el=document.getElementById('bpPosts');
  if (!el) return;
  const {from,to}=calcTotalDates();
  if (!from||!to){ if(hint) hint.style.display='block'; el.style.display='none'; return; }
  if(hint) hint.style.display='none';
  el.style.display='flex';
  if (!_posts.length){ el.innerHTML='<div class="bp-empty">Нет постов. <a href="settings.html" style="color:#2563eb">Добавить</a></div>'; return; }
  el.innerHTML=_posts.map(p=>{
    const sel=_selectedPost===p.id?' selected':'';
    const cap=p.capacity||1;
    const busy=_bookings.filter(b=>b.post_id===p.id&&datesOverlap(from,to,b.date_from,b.date_to)).length;
    const full=busy>=cap;
    return `<button class="bp-post-btn${sel}" onclick="BookingPopup._selectPost('${p.id}')">
      <div class="bp-post-dot" style="background:${p.color||'#2563eb'}"></div>
      <div><div class="bp-post-name">${p.name}</div><div class="bp-post-type">${POST_TYPE_RU[p.type]||p.type||''}</div></div>
      <span class="${full?'bp-post-busy':'bp-post-cap'}">${busy}/${cap}</span>
    </button>`;
  }).join('');
  const conf=document.getElementById('bpConflict');
  if(conf&&_selectedPost){ const cap=_posts.find(p=>p.id===_selectedPost)?.capacity||1; const busy=_bookings.filter(b=>b.post_id===_selectedPost&&datesOverlap(from,to,b.date_from,b.date_to)).length; conf.classList.toggle('show',busy>=cap); }
  else if(conf) conf.classList.remove('show');
}

window.BookingPopup = {
  open: function({calcId,calcName,calcPrice,studioId,onSaved}={}) {
    buildDOM();
    _studioId=studioId; _calcId=calcId||null; _onSaved=onSaved||null; _tab='calc';
    _selectedPost=null; _calcServices=[]; _svcState={}; _openSvc=null;
    const te=document.getElementById('bpCarTitle'), pe=document.getElementById('bpCarPrice');
    if(te) te.innerHTML=calcName?`&#x1F4C5; ${calcName}`:'&#x1F4C5; Записать авто';
    if(pe) pe.innerHTML=calcPrice?`&#x20BD; ${fmt(calcPrice)}`:'';
    document.getElementById('bpNote').value='';
    document.getElementById('bpTotalDates').style.display='none';
    BookingPopup._switchTab('calc');
    document.getElementById('bpOverlay').classList.add('active');
    document.body.style.overflow='hidden';
    loadData();
  },
  close: function() {
    const el=document.getElementById('bpOverlay');
    if(el) el.classList.remove('active');
    document.body.style.overflow='';
  },
  _switchTab: function(tab) {
    _tab=tab;
    document.getElementById('bpTabCalcBody').style.display=tab==='calc'?'block':'none';
    document.getElementById('bpTabManualBody').style.display=tab==='manual'?'block':'none';
    document.getElementById('bpTabCalc').classList.toggle('active',tab==='calc');
    document.getElementById('bpTabManual').classList.toggle('active',tab==='manual');
    if(tab==='manual'){ _calcId=null; _calcServices=[]; _svcState={}; renderServices(); }
  },
  _onCalcSelect: function(id) {
    _calcId=id||null;
    const calc=_calcId?_calcs.find(c=>c.id===_calcId):null;
    const te=document.getElementById('bpCarTitle'), pe=document.getElementById('bpCarPrice');
    if(te) te.innerHTML=calc?`&#x1F4C5; ${esc(calc.car_name)}`:'&#x1F4C5; Записать авто';
    if(pe) pe.innerHTML=calc?`&#x20BD; ${fmt(calc.final_price||calc.total_price||0)}`:'';
    _calcServices=calc?extractServices(calc):[]; _svcState={}; _openSvc=null;
    initSvcState(); renderServices(); renderPosts();
  },
  _toggleSvc: function(key) {
    _openSvc=_openSvc===key?null:key;
    renderServices();
    if(_openSvc) setTimeout(()=>{ const el=document.getElementById(`svcItem_${key}`); if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'}); },50);
  },
  _assignExec: function(svcKey,execId) {
    const st=_svcState[svcKey]; if(!st) return;
    st.executor_id=st.executor_id===execId?null:execId;
    if(st.executor_id&&!st.date_from) st.picking='from';
    renderServices();
  },
  _setSvcPicking: function(svcKey,mode) {
    const st=_svcState[svcKey]; if(st){ st.picking=mode; renderServices(); }
  },
  _svcPickDate: function(svcKey,ds) {
    const st=_svcState[svcKey]; if(!st) return;
    if(st.picking==='from'){
      st.date_from=ds;
      if(st.date_to&&ds>st.date_to) st.date_to=null;
      st.picking='to';
    } else {
      if(ds<st.date_from){ st.date_from=ds; st.date_to=null; }
      else { st.date_to=ds; st.picking='from'; }
    }
    renderServices();
  },
  _miniPrev: function(svcKey) {
    const st=_svcState[svcKey]; if(!st) return;
    st.viewMonth--; if(st.viewMonth<0){ st.viewMonth=11; st.viewYear--; }
    renderServices();
  },
  _miniNext: function(svcKey) {
    const st=_svcState[svcKey]; if(!st) return;
    st.viewMonth++; if(st.viewMonth>11){ st.viewMonth=0; st.viewYear++; }
    renderServices();
  },
  _selectPost: function(pid) {
    _selectedPost=_selectedPost===pid?null:pid;
    renderPosts();
  },
  _save: async function() {
    const {from,to}=calcTotalDates();
    if(!from){ alert('Заполните даты хотя бы для одной услуги'); return; }
    let carName='', finalCalcId=null;
    if(_tab==='calc'){
      if(!_calcId){ alert('Выберите расчёт'); return; }
      finalCalcId=_calcId;
      carName=_calcs.find(c=>c.id===_calcId)?.car_name||'';
    } else {
      const brand=document.getElementById('bpManualBrand')?.value.trim()||'';
      const plate=document.getElementById('bpManualPlate')?.value.trim()||'';
      if(!brand){ alert('Введите марку/модель авто'); return; }
      carName=brand+(plate?` (${plate})`:'');
    }
    if(!_selectedPost&&_posts.length){ if(!confirm('Пост не выбран. Продолжить?')) return; }
    const btn=document.getElementById('bpSaveBtn');
    if(btn){ btn.disabled=true; btn.innerHTML='&#x23F3; Сохранение...'; }
    const sb=window._crmSb;
    const note=document.getElementById('bpNote')?.value.trim()||null;
    const execIds=[...new Set(_calcServices.map(s=>_svcState[s.key]?.executor_id).filter(Boolean))];
    const serviceAssignments=_calcServices.map(s=>({ key:s.key, name:s.name, executor_id:_svcState[s.key]?.executor_id||null, date_from:_svcState[s.key]?.date_from||null, date_to:_svcState[s.key]?.date_to||null }));
    const {error:bErr}=await sb.from('calendar_bookings').insert({ studio_id:_studioId, post_id:_selectedPost||null, calc_id:finalCalcId, car_name:carName, date_from:from, date_to:to, note, executor_ids:execIds.length?execIds:null });
    if(!bErr&&finalCalcId){
      const calc=_calcs.find(c=>c.id===finalCalcId);
      await sb.from('calculations').update({ status:'scheduled', scheduled_from:from, scheduled_to:to, post_id:_selectedPost||null, calculation_data:{...(calc?.calculation_data||{}),service_assignments:serviceAssignments} }).eq('id',finalCalcId);
    }
    if(btn){ btn.disabled=false; btn.innerHTML='&#x2705; Записать'; }
    if(!bErr){ BookingPopup.close(); if(typeof _onSaved==='function') _onSaved(); }
    else{ console.error(bErr); alert('Ошибка сохранения. Проверьте консоль.'); }
  },
};

document.addEventListener('click',function(e){ if(e.target&&e.target.id==='bpOverlay') BookingPopup.close(); });

})();

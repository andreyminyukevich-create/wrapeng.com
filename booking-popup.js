/**
 * booking-popup.js — попап «Записать авто»
 * Переиспользуется из: board.html, calendar.html, nav (кнопка «Записать»)
 *
 * API:
 *   BookingPopup.open({ calcId, calcName, calcPrice, studioId, onSaved })
 *   BookingPopup.close()
 */

(function() {
'use strict';

// ── Стили ──────────────────────────────────────────────
const CSS = `
#bpOverlay {
  display: none; position: fixed; inset: 0; z-index: 4000;
  background: rgba(15,23,42,0.55); backdrop-filter: blur(6px);
  align-items: center; justify-content: center;
  padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
}
#bpOverlay.active { display: flex; animation: bpFadeIn 0.15s ease; }
@keyframes bpFadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes bpSlideUp { from { transform:translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }

#bpBox {
  background: #fff; border-radius: 18px;
  border: 1px solid rgba(15,23,42,0.08);
  width: 100%; max-width: 860px;
  max-height: 92svh; overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0,0,0,0.2);
  animation: bpSlideUp 0.18s ease;
  display: flex; flex-direction: column;
}

/* Шапка */
#bpHead {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 22px 26px 0; gap: 14px; flex-shrink: 0;
}
#bpCarName {
  font-size: 1.1rem; font-weight: 800;
  color: #0f172a; letter-spacing: -0.3px;
}
#bpCarPrice {
  font-size: 0.82rem; color: #64748b; font-weight: 600; margin-top: 2px;
}
#bpCloseBtn {
  background: rgba(100,116,139,0.1); border: none; cursor: pointer;
  width: 30px; height: 30px; border-radius: 50%; font-size: 1rem;
  color: #64748b; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}
#bpCloseBtn:hover { background: rgba(220,38,38,0.1); color: #dc2626; }

/* Тело */
#bpBody {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 20px; padding: 20px 26px 24px;
}
@media (max-width: 640px) {
  #bpBody { grid-template-columns: 1fr; }
  #bpHead { padding: 18px 18px 0; }
  #bpBody { padding: 16px 18px 20px; }
}

/* Левая колонка — посты + исполнители */
.bp-section-title {
  font-size: 0.68rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 10px;
}

/* Посты */
#bpPosts { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.bp-post-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  border: 1.5px solid rgba(15,23,42,0.08);
  background: #f8fafc; cursor: pointer;
  transition: all 0.15s; text-align: left; width: 100%;
  font-family: inherit;
}
.bp-post-btn:hover { border-color: #2563eb; background: rgba(37,99,235,0.04); }
.bp-post-btn.selected { border-color: #2563eb; background: rgba(37,99,235,0.06); }
.bp-post-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.bp-post-name { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.bp-post-type { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
.bp-post-cap  { font-size: 0.68rem; color: #2563eb; font-weight: 700;
  background: rgba(37,99,235,0.08); padding: 1px 6px; border-radius: 10px;
  margin-left: auto; }
.bp-post-busy { font-size: 0.68rem; color: #d97706; font-weight: 700;
  background: rgba(217,119,6,0.08); padding: 1px 6px; border-radius: 10px;
  margin-left: auto; }

/* Исполнители */
#bpExecutors { display: flex; flex-direction: column; gap: 6px; }
.bp-exec-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; border-radius: 10px;
  border: 1.5px solid rgba(15,23,42,0.08);
  background: #f8fafc; cursor: pointer;
  transition: all 0.15s; text-align: left; width: 100%;
  font-family: inherit;
}
.bp-exec-btn:hover { border-color: #059669; background: rgba(5,150,105,0.04); }
.bp-exec-btn.selected { border-color: #059669; background: rgba(5,150,105,0.06); }
.bp-exec-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(37,99,235,0.1); color: #2563eb;
  font-size: 0.72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.bp-exec-name { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.bp-exec-role { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
.bp-exec-warn { font-size: 0.68rem; color: #d97706; font-weight: 700;
  background: rgba(217,119,6,0.08); padding: 1px 6px; border-radius: 10px;
  margin-left: auto; }

/* Правая колонка — мини-календарь выбора дат */
#bpCalRight {}

.bp-month-nav {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
}
.bp-month-nav button {
  width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid rgba(15,23,42,0.10); background: #f8fafc;
  cursor: pointer; font-size: 0.9rem; color: #0f172a;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.bp-month-nav button:hover { background: #e8eef8; }
.bp-month-lbl { font-size: 0.82rem; font-weight: 700; color: #0f172a; flex: 1; text-align: center; }

.bp-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;
}
.bp-day-hdr {
  text-align: center; font-size: 0.6rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: #94a3b8; padding: 3px 0 6px;
}
.bp-day-hdr.we { color: #f87171; }

.bp-day {
  aspect-ratio: 1; border-radius: 7px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 600; color: #0f172a;
  cursor: pointer; position: relative;
  border: 1.5px solid transparent;
  transition: all 0.12s; user-select: none;
  gap: 1px;
}
.bp-day:hover:not(.other):not(.past) { background: rgba(37,99,235,0.08); border-color: #2563eb; }
.bp-day.other   { color: #cbd5e1; cursor: default; }
.bp-day.past    { color: #cbd5e1; cursor: not-allowed; }
.bp-day.today   { border-color: rgba(37,99,235,0.3); color: #2563eb; font-weight: 800; }
.bp-day.from    { background: #2563eb; color: #fff; border-color: #2563eb; border-radius: 7px 0 0 7px; }
.bp-day.to      { background: #2563eb; color: #fff; border-color: #2563eb; border-radius: 0 7px 7px 0; }
.bp-day.from.to { border-radius: 7px; }
.bp-day.between { background: rgba(37,99,235,0.12); border-color: transparent; border-radius: 0; }
.bp-day.we-num  { color: #ef4444; }
.bp-day.from .bp-day-num, .bp-day.to .bp-day-num { color: #fff; }

.bp-day-num { font-size: 0.75rem; font-weight: 700; line-height: 1; }
.bp-day-dot { width: 4px; height: 4px; border-radius: 50%; background: #f59e0b; }

/* Выбранные даты — отображение */
.bp-dates-display {
  display: flex; gap: 8px; margin-top: 12px;
}
.bp-date-pill {
  flex: 1; background: #f8fafc; border: 1.5px solid rgba(15,23,42,0.08);
  border-radius: 9px; padding: 8px 12px; text-align: center;
}
.bp-date-pill-lbl { font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 2px; }
.bp-date-pill-val { font-size: 0.88rem; font-weight: 800; color: #0f172a; }
.bp-date-pill-val.empty { color: #cbd5e1; }

/* Заметка */
.bp-note-wrap { margin-top: 12px; }
.bp-note-wrap textarea {
  width: 100%; padding: 9px 12px;
  background: #f8fafc; border: 1.5px solid rgba(15,23,42,0.08);
  border-radius: 9px; font-size: 0.82rem; font-family: inherit;
  color: #0f172a; outline: none; resize: none;
  transition: border-color 0.15s;
  min-height: 60px;
}
.bp-note-wrap textarea:focus {
  border-color: #2563eb; background: #fff;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}

/* Конфликт */
.bp-conflict {
  margin-top: 10px; padding: 8px 12px;
  background: rgba(217,119,6,0.07);
  border: 1px solid rgba(217,119,6,0.25);
  border-radius: 8px; font-size: 0.78rem;
  color: #92400e; font-weight: 600;
  display: none;
}
.bp-conflict.show { display: block; }

/* Футер */
#bpFoot {
  padding: 0 26px 22px;
  display: flex; gap: 10px; align-items: center;
  flex-shrink: 0;
}
@media (max-width: 640px) { #bpFoot { padding: 0 18px 18px; } }
#bpFoot .bp-btn-cancel {
  background: rgba(15,23,42,0.05); color: #64748b;
  border: 1px solid rgba(15,23,42,0.10);
  padding: 10px 18px; border-radius: 9px; cursor: pointer;
  font-size: 0.82rem; font-weight: 700; font-family: inherit;
  transition: all 0.15s;
}
#bpFoot .bp-btn-cancel:hover { background: #fee2e2; color: #dc2626; }
#bpFoot .bp-btn-save {
  flex: 1; background: #2563eb; color: #fff;
  border: none; padding: 11px 18px;
  border-radius: 9px; cursor: pointer;
  font-size: 0.88rem; font-weight: 800; font-family: inherit;
  transition: all 0.15s;
}
#bpFoot .bp-btn-save:hover { background: #1d4ed8; }
#bpFoot .bp-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.bp-empty { color: #94a3b8; font-size: 0.82rem; padding: 10px 0; }
`;

// ── Inject styles once ─────────────────────────────────
(function injectCSS() {
  if (document.getElementById('bpStyles')) return;
  const s = document.createElement('style');
  s.id = 'bpStyles';
  s.textContent = CSS;
  document.head.appendChild(s);
})();

// ── HTML skeleton ──────────────────────────────────────
function buildDOM() {
  if (document.getElementById('bpOverlay')) return;
  const div = document.createElement('div');
  div.innerHTML = `
    <div id="bpOverlay">
      <div id="bpBox">
        <div id="bpHead">
          <div>
            <div id="bpCarName">📅 Записать авто</div>
            <div id="bpCarPrice"></div>
          </div>
          <button id="bpCloseBtn" onclick="BookingPopup.close()">✕</button>
        </div>
        <div id="bpBody">
          <!-- Левая колонка -->
          <div id="bpLeft">
            <div class="bp-section-title">Рабочий пост</div>
            <div id="bpPosts"><div class="bp-empty">⏳ Загрузка постов...</div></div>

            <div class="bp-section-title" style="margin-top:16px">Исполнители</div>
            <div id="bpExecutors"><div class="bp-empty">⏳ Загрузка...</div></div>
          </div>
          <!-- Правая колонка -->
          <div id="bpCalRight">
            <div class="bp-section-title">Выберите даты</div>
            <div class="bp-month-nav">
              <button onclick="BookingPopup._prevMonth()">‹</button>
              <span class="bp-month-lbl" id="bpMonthLbl"></span>
              <button onclick="BookingPopup._nextMonth()">›</button>
            </div>
            <div class="bp-cal-grid" id="bpCalGrid"></div>
            <div class="bp-dates-display">
              <div class="bp-date-pill">
                <div class="bp-date-pill-lbl">Заезд</div>
                <div class="bp-date-pill-val empty" id="bpFromLbl">—</div>
              </div>
              <div class="bp-date-pill">
                <div class="bp-date-pill-lbl">Выезд</div>
                <div class="bp-date-pill-val empty" id="bpToLbl">—</div>
              </div>
            </div>
            <div class="bp-note-wrap">
              <textarea id="bpNote" placeholder="Комментарий: пожелания, особенности..."></textarea>
            </div>
            <div class="bp-conflict" id="bpConflict">⚠️ На выбранном посту в эти даты уже есть запись. Убедитесь, что пост вмещает несколько машин.</div>
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
let _studioId   = null;
let _calcId     = null;
let _onSaved    = null;
let _posts      = [];
let _executors  = [];
let _bookings   = [];
let _selectedPost = null;
let _selectedExecs = new Set();
let _dateFrom   = null; // 'YYYY-MM-DD'
let _dateTo     = null;
let _picking    = 'from'; // 'from' | 'to'
let _viewYear   = new Date().getFullYear();
let _viewMonth  = new Date().getMonth();

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const POST_TYPE_LABEL = {
  wrap:'Оклейка/PPF', detailing:'Детейлинг',
  wash:'Мойка', chem:'Химчистка', universal:'Универсальный'
};

// ── Helpers ────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('ru-RU').format(n || 0);
}
function toISO(d) {
  return d.toISOString().slice(0,10);
}
function parseDate(s) {
  if (!s) return null;
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function formatRu(s) {
  if (!s) return '—';
  const d = parseDate(s);
  return d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}
function datesOverlap(from1, to1, from2, to2) {
  return from1 <= to2 && to1 >= from2;
}
function bookingsForPost(postId) {
  return _bookings.filter(b => b.post_id === postId);
}
function execBusyInRange(execId) {
  if (!_dateFrom || !_dateTo) return false;
  // Ищем в calendar_bookings.executors
  return _bookings.some(b => {
    if (!b.executor_ids) return false;
    if (!datesOverlap(_dateFrom, _dateTo, b.date_from, b.date_to)) return false;
    return (b.executor_ids || []).includes(execId);
  });
}

// ── Load data ──────────────────────────────────────────
async function loadData() {
  const sb = window._crmSb;
  if (!sb) return;

  const [postsRes, execRes, bookRes] = await Promise.all([
    sb.from('posts').select('*').eq('studio_id', _studioId).eq('is_active', true).order('created_at'),
    sb.from('executors').select('id, name, role, is_active').eq('studio_id', _studioId).eq('is_active', true).order('name'),
    sb.from('calendar_bookings').select('*').eq('studio_id', _studioId),
  ]);

  _posts     = postsRes.data || [];
  _executors = execRes.data  || [];
  _bookings  = bookRes.data  || [];

  renderPosts();
  renderExecutors();
}

// ── Render posts ───────────────────────────────────────
function renderPosts() {
  const el = document.getElementById('bpPosts');
  if (!el) return;
  if (!_posts.length) {
    el.innerHTML = '<div class="bp-empty">Нет постов. <a href="settings.html" style="color:#2563eb">Добавьте в настройках</a></div>';
    return;
  }
  el.innerHTML = _posts.map(p => {
    // Проверяем занятость
    const busy = _dateFrom && _dateTo
      ? bookingsForPost(p.id).filter(b => datesOverlap(_dateFrom, _dateTo, b.date_from, b.date_to)).length
      : 0;
    const cap = p.capacity || 1;
    const isFull = busy >= cap;
    const sel = _selectedPost === p.id ? ' selected' : '';
    const busyBadge = busy > 0
      ? `<span class="${isFull ? 'bp-post-busy' : 'bp-post-cap'}">${busy}/${cap} авто</span>`
      : (cap > 1 ? `<span class="bp-post-cap">до ${cap} авто</span>` : '');
    return `<button class="bp-post-btn${sel}" onclick="BookingPopup._selectPost('${p.id}')">
      <div class="bp-post-dot" style="background:${p.color||'#2563eb'}"></div>
      <div>
        <div class="bp-post-name">${p.name}</div>
        <div class="bp-post-type">${POST_TYPE_LABEL[p.type]||p.type}</div>
      </div>
      ${busyBadge}
    </button>`;
  }).join('');
}

// ── Render executors ───────────────────────────────────
function renderExecutors() {
  const el = document.getElementById('bpExecutors');
  if (!el) return;
  if (!_executors.length) {
    el.innerHTML = '<div class="bp-empty">Нет сотрудников. <a href="executors.html" style="color:#2563eb">Добавьте</a></div>';
    return;
  }
  el.innerHTML = _executors.map(e => {
    const busy = execBusyInRange(e.id);
    const sel  = _selectedExecs.has(e.id) ? ' selected' : '';
    const initials = (e.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<button class="bp-exec-btn${sel}" onclick="BookingPopup._toggleExec('${e.id}')">
      <div class="bp-exec-avatar">${initials}</div>
      <div>
        <div class="bp-exec-name">${e.name}</div>
        <div class="bp-exec-role">${e.role||'Сотрудник'}</div>
      </div>
      ${busy ? '<span class="bp-exec-warn">⚠️ Занят</span>' : ''}
    </button>`;
  }).join('');
}

// ── Render calendar ────────────────────────────────────
function renderCalendar() {
  const el = document.getElementById('bpCalGrid');
  const lbl = document.getElementById('bpMonthLbl');
  if (!el || !lbl) return;

  lbl.textContent = `${MONTHS[_viewMonth]} ${_viewYear}`;

  const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const today = toISO(new Date());

  const firstDay = new Date(_viewYear, _viewMonth, 1);
  const lastDay  = new Date(_viewYear, _viewMonth + 1, 0);
  let startPad = firstDay.getDay();
  startPad = startPad === 0 ? 6 : startPad - 1;
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startPad);
  let endPad = lastDay.getDay();
  endPad = endPad === 0 ? 0 : 7 - endPad;
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(gridEnd.getDate() + endPad);

  const dates = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) { dates.push(toISO(new Date(cur))); cur.setDate(cur.getDate()+1); }

  // Занятые дни выбранного поста
  const busyDates = new Set();
  if (_selectedPost) {
    bookingsForPost(_selectedPost).forEach(b => {
      const c = new Date(parseDate(b.date_from));
      const e = parseDate(b.date_to);
      while (c <= e) { busyDates.add(toISO(new Date(c))); c.setDate(c.getDate()+1); }
    });
  }

  let html = DAY_NAMES.map((d,i) =>
    `<div class="bp-day-hdr${i>=5?' we':''}">${d}</div>`
  ).join('');

  dates.forEach(ds => {
    const d = parseDate(ds);
    const isOther = d.getMonth() !== _viewMonth;
    const isPast  = ds < today;
    const isWe    = d.getDay() === 0 || d.getDay() === 6;
    const isToday = ds === today;
    const isFrom  = ds === _dateFrom;
    const isTo    = ds === _dateTo;
    const isBetween = _dateFrom && _dateTo && ds > _dateFrom && ds < _dateTo;
    const hasDot  = busyDates.has(ds);

    let cls = 'bp-day';
    if (isOther)   cls += ' other';
    else if (isPast) cls += ' past';
    else {
      if (isWe)      cls += ' we-num';
      if (isToday)   cls += ' today';
      if (isFrom)    cls += ' from';
      if (isTo)      cls += ' to';
      if (isBetween) cls += ' between';
    }

    const dot = hasDot && !isOther ? '<div class="bp-day-dot"></div>' : '';
    const click = (!isOther && !isPast)
      ? `onclick="BookingPopup._pickDate('${ds}')"`
      : '';

    html += `<div class="${cls}" ${click}>
      <div class="bp-day-num">${d.getDate()}</div>${dot}
    </div>`;
  });

  el.innerHTML = html;

  // Обновить подписи дат
  const fromEl = document.getElementById('bpFromLbl');
  const toEl   = document.getElementById('bpToLbl');
  if (fromEl) {
    fromEl.textContent = _dateFrom ? formatRu(_dateFrom) : '—';
    fromEl.classList.toggle('empty', !_dateFrom);
  }
  if (toEl) {
    toEl.textContent = _dateTo ? formatRu(_dateTo) : '—';
    toEl.classList.toggle('empty', !_dateTo);
  }

  // Конфликт
  checkConflict();
}

function checkConflict() {
  const el = document.getElementById('bpConflict');
  if (!el) return;
  if (!_selectedPost || !_dateFrom || !_dateTo) { el.classList.remove('show'); return; }
  const cap  = (_posts.find(p => p.id === _selectedPost)?.capacity) || 1;
  const busy = bookingsForPost(_selectedPost)
    .filter(b => datesOverlap(_dateFrom, _dateTo, b.date_from, b.date_to)).length;
  el.classList.toggle('show', busy >= cap);
}

// ── Public API ─────────────────────────────────────────
window.BookingPopup = {

  open: function({ calcId, calcName, calcPrice, studioId, onSaved }) {
    buildDOM();
    _studioId  = studioId;
    _calcId    = calcId;
    _onSaved   = onSaved || null;
    _selectedPost  = null;
    _selectedExecs = new Set();
    _dateFrom  = null;
    _dateTo    = null;
    _picking   = 'from';
    _viewYear  = new Date().getFullYear();
    _viewMonth = new Date().getMonth();

    const nameEl  = document.getElementById('bpCarName');
    const priceEl = document.getElementById('bpCarPrice');
    const noteEl  = document.getElementById('bpNote');
    if (nameEl)  nameEl.textContent  = calcName ? `📅 ${calcName}` : '📅 Записать авто';
    if (priceEl) priceEl.textContent = calcPrice ? `КП: ${fmt(calcPrice)}` : '';
    if (noteEl)  noteEl.value = '';

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

  _prevMonth: function() {
    _viewMonth--;
    if (_viewMonth < 0) { _viewMonth = 11; _viewYear--; }
    renderCalendar();
  },

  _nextMonth: function() {
    _viewMonth++;
    if (_viewMonth > 11) { _viewMonth = 0; _viewYear++; }
    renderCalendar();
  },

  _pickDate: function(ds) {
    if (_picking === 'from') {
      _dateFrom = ds;
      _dateTo   = null;
      _picking  = 'to';
    } else {
      if (ds < _dateFrom) {
        // Кликнули раньше from — начинаем заново
        _dateFrom = ds;
        _dateTo   = null;
        _picking  = 'to';
      } else {
        _dateTo  = ds;
        _picking = 'from'; // готово
      }
    }
    renderCalendar();
    renderPosts(); // пересчитать занятость
    renderExecutors();
  },

  _selectPost: function(postId) {
    _selectedPost = (_selectedPost === postId) ? null : postId;
    renderPosts();
    checkConflict();
    renderCalendar(); // перерисовать точки занятости
  },

  _toggleExec: function(execId) {
    if (_selectedExecs.has(execId)) _selectedExecs.delete(execId);
    else _selectedExecs.add(execId);
    renderExecutors();
  },

  _save: async function() {
    if (!_dateFrom) { alert('Выберите дату заезда'); return; }
    if (!_dateTo)   { _dateTo = _dateFrom; } // однодневный
    if (!_selectedPost && _posts.length > 0) {
      if (!confirm('Пост не выбран. Записать без поста?')) return;
    }

    const btn = document.getElementById('bpSaveBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Сохранение...'; }

    const sb = window._crmSb;
    const note = document.getElementById('bpNote')?.value.trim() || null;
    const execIds = Array.from(_selectedExecs);

    let ok = true;

    // 1. Запись в calendar_bookings
    if (_calcId) {
      const calcRes = await sb.from('calculations')
        .select('car_name, final_price, total_price')
        .eq('id', _calcId).single();
      const calc = calcRes.data || {};

      const { error: bErr } = await sb.from('calendar_bookings').insert({
        studio_id:    _studioId,
        post_id:      _selectedPost || null,
        calc_id:      _calcId,
        car_name:     calc.car_name || '',
        date_from:    _dateFrom,
        date_to:      _dateTo,
        note:         note,
        executor_ids: execIds.length ? execIds : null,
      });
      if (bErr) { console.error(bErr); ok = false; }
    }

    // 2. Обновить статус расчёта → scheduled
    if (ok && _calcId) {
      const { error: cErr } = await sb.from('calculations').update({
        status:         'scheduled',
        scheduled_from: _dateFrom,
        scheduled_to:   _dateTo,
        post_id:        _selectedPost || null,
      }).eq('id', _calcId);
      if (cErr) { console.error(cErr); ok = false; }
    }

    if (btn) { btn.disabled = false; btn.textContent = '✅ Записать'; }

    if (ok) {
      BookingPopup.close();
      if (typeof _onSaved === 'function') _onSaved();
    } else {
      alert('❌ Ошибка при сохранении. Проверьте консоль.');
    }
  },
};

// Закрытие по клику на оверлей
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'bpOverlay') BookingPopup.close();
});

})();

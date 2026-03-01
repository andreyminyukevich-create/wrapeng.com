<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Распределение работ — Keep1R CRM</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<link rel="stylesheet" href="nav.css">
<script src="nav.js"></script>
<style>
:root {
  --font:       -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  --bg:         #eef2f9;
  --surface:    #ffffff;
  --border:     rgba(15,23,42,0.08);
  --text:       #0f172a;
  --muted:      #64748b;
  --dim:        #94a3b8;
  --primary:    #2563eb;
  --primary-dk: #1d4ed8;
  --success:    #059669;
  --success-bg: rgba(5,150,105,0.07);
  --danger:     #dc2626;
  --danger-bg:  rgba(220,38,38,0.07);
  --warning:    #d97706;
  --warning-bg: rgba(217,119,6,0.07);
  --radius:     14px;
  --radius-sm:  9px;
  --shadow:     0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  background: var(--bg);
  color: var(--text);
  min-height: 100svh;
}

/* ── Субшапка ────────────────────────────────────── */
.page-subheader {
  display: flex;
  align-items: center;
  padding: 11px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.page-subheader-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.page-subheader-title {
  font-size: 0.92rem;
  font-weight: 700;
  white-space: nowrap;
}
.car-subtitle {
  font-size: 0.82rem;
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  background: rgba(37,99,235,0.07);
  border: 1px solid rgba(37,99,235,0.18);
  cursor: pointer;
  font-family: var(--font);
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-back:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

/* ── Контент ─────────────────────────────────────── */
.container {
  max-width: 820px;
  margin: 0 auto;
  padding: 22px 18px 48px;
}

/* ── Карточки ────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px 22px;
  margin-bottom: 14px;
  box-shadow: var(--shadow);
}
.card-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 7px;
  letter-spacing: -0.1px;
}

/* ── Admin sale block ────────────────────────────── */
.admin-sale-block {
  background: var(--surface);
  border: 1px solid rgba(217,119,6,0.22);
  border-radius: var(--radius);
  padding: 16px 20px;
  margin-bottom: 14px;
  box-shadow: var(--shadow);
}

.admin-sale-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text);
  user-select: none;
}
.toggle-switch input[type="checkbox"] {
  width: 17px; height: 17px;
  accent-color: var(--warning);
  cursor: pointer;
  flex-shrink: 0;
}

.admin-details {
  display: none;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(217,119,6,0.15);
  align-items: flex-end;
}
.admin-details.active { display: flex; }

/* ── Form group ──────────────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-group label {
  font-size: 0.67rem;
  color: var(--muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.form-group input,
.form-group select {
  padding: 9px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 16px;
  font-family: var(--font);
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
  -webkit-appearance: none;
}
.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
  background: var(--surface);
}

/* ── Work list ───────────────────────────────────── */
.work-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.work-item {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  transition: border-color 0.15s;
}
.work-item:hover { border-color: rgba(37,99,235,0.2); }

.work-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
  flex-wrap: wrap;
}
.work-service-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--text);
}
.work-base-salary {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--success);
  background: var(--success-bg);
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
  border: 1px solid rgba(5,150,105,0.18);
}

/* ── Executor rows ───────────────────────────────── */
.executor-rows { display: flex; flex-direction: column; gap: 8px; }

.executor-row { width: 100%; }

.executor-input-group { display: flex; flex-direction: column; gap: 5px; }

.executor-mode-switcher { display: flex; gap: 4px; }

.mode-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted);
  transition: all 0.15s;
  font-family: var(--font);
  white-space: nowrap;
}
.mode-btn:hover { color: var(--text); }
.mode-btn.active { background: var(--primary); border-color: var(--primary); color: #fff; }

/* Строка: [дропдаун/инпут] [сумма] [×] */
.executor-fields-row {
  display: grid;
  grid-template-columns: 1fr 130px 34px;
  gap: 7px;
  align-items: center;
}

.executor-select-wrap select,
.executor-manual-wrap .manual-name-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 16px;
  font-family: var(--font);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
}
.executor-select-wrap select:focus,
.executor-manual-wrap .manual-name-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}
.executor-select-wrap, .executor-manual-wrap { min-width: 0; }

.salary-input {
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 16px;
  font-family: var(--font);
  font-weight: 700;
  width: 100%;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.salary-input:focus {
  border-color: var(--success);
  box-shadow: 0 0 0 3px rgba(5,150,105,0.08);
}

.btn-remove-exec {
  background: var(--danger-bg);
  border: 1px solid rgba(220,38,38,0.15);
  color: var(--danger);
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  width: 34px;
  flex-shrink: 0;
  font-family: var(--font);
}
.btn-remove-exec:hover { background: var(--danger); color: #fff; border-color: var(--danger); }

.executor-manual-save {
  display: flex;
  align-items: center;
  padding-left: 1px;
}
.save-to-list-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--success);
  cursor: pointer;
  user-select: none;
}
.save-to-list-label input[type="checkbox"] {
  accent-color: var(--success);
  width: 13px; height: 13px;
  cursor: pointer;
}

.add-executor-btn {
  margin-top: 8px;
  font-size: 0.75rem;
  padding: 6px 12px;
  color: var(--primary);
  background: rgba(37,99,235,0.05);
  border: 1px dashed rgba(37,99,235,0.28);
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
  font-weight: 700;
  font-family: var(--font);
}
.add-executor-btn:hover { background: rgba(37,99,235,0.10); border-color: var(--primary); }

/* ── Dates header ── */
.dates-header-card {
  background: #fff; border-radius: var(--radius); border: 1px solid var(--border);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 14px 18px; margin-bottom: 14px;
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
}
.dates-header-item { display: flex; flex-direction: column; gap: 3px; }
.dates-header-label { font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.dates-header-value { font-size: 0.92rem; font-weight: 700; color: var(--text); }
#expectedCheckout {
  border: 1.5px solid var(--border); border-radius: 8px; padding: 6px 10px;
  font-size: 0.88rem; font-weight: 600; font-family: var(--font); color: var(--text);
  background: #f8fafc; cursor: pointer; outline: none;
}
#expectedCheckout:focus { border-color: var(--primary); background: #fff; }
.executor-dates-row {
  display: flex; align-items: center; gap: 8px; padding: 6px 0 0; flex-wrap: wrap;
}
.dates-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); white-space: nowrap; }
.dates-sep   { color: var(--muted); font-size: 0.85rem; }
.exec-date-from, .exec-date-to {
  border: 1.5px solid var(--border); border-radius: 7px; padding: 4px 8px;
  font-size: 0.82rem; font-family: var(--font); color: var(--text);
  background: #f8fafc; cursor: pointer; outline: none; flex: 1; min-width: 120px; max-width: 150px;
}
.exec-date-from:focus, .exec-date-to:focus { border-color: var(--primary); background: #fff; }

/* ── Добавить работу вручную ─────────────────────── */
.add-work-row {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 10px;
}
.add-work-row input {
  padding: 9px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 16px;
  font-family: var(--font);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -webkit-appearance: none;
}
.add-work-row input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
}

/* ── Итого ───────────────────────────────────────── */
.summary-block {
  background: var(--success-bg);
  border: 1px solid rgba(5,150,105,0.2);
  border-radius: 12px;
  padding: 18px 20px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  gap: 20px;
}
.summary-row + .summary-row { border-top: 1px solid rgba(5,150,105,0.12); }
.summary-label { color: var(--muted); font-size: 0.85rem; font-weight: 600; white-space: nowrap; }
.summary-value { font-weight: 700; font-size: 0.92rem; }
.summary-total-value {
  color: var(--success);
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -1px;
  text-align: right;
  line-height: 1.1;
  min-width: 0;
  word-break: break-word;
}

/* ── Кнопки ──────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
.btn-primary   { background: var(--primary); color: #fff; }
.btn-primary:hover   { background: var(--primary-dk); }
.btn-success   { background: var(--success); color: #fff; font-size: 0.92rem; padding: 12px 24px; }
.btn-success:hover   { background: #047857; }
.btn-secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--bg); color: var(--text); }
.btn-sm { padding: 7px 14px; font-size: 0.78rem; }

/* ── Состояния ───────────────────────────────────── */
.loading {
  text-align: center;
  padding: 60px;
  color: var(--muted);
  font-size: 0.9rem;
}

/* ── Адаптив ─────────────────────────────────────── */
@media (max-width: 640px) {
  .container { padding: 16px 14px 40px; }
  .card { padding: 16px 16px; }

  .executor-fields-row { grid-template-columns: 1fr 100px 34px; }

  .add-work-row { grid-template-columns: 1fr; }

  .admin-details { flex-direction: column; align-items: stretch; }
  .admin-details .form-group { width: 100%; }

  .summary-total-value { font-size: 1.5rem; }
  .work-item { padding: 14px 14px; }
  .work-item-header { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 480px) {
  .executor-fields-row { grid-template-columns: 1fr; gap: 8px; }
  .btn-remove-exec { width: 100%; height: 40px; }
  .btn-success { width: 100%; justify-content: center; }
  .summary-row { flex-direction: column; align-items: flex-start; gap: 2px; }
  .summary-total-value { align-self: flex-end; }
}
</style>
</head>
<body>

<div class="container">
  <!-- Субшапка -->
  <div class="page-subheader">
    <div class="page-subheader-left">
      <button class="btn-back" onclick="goBack()">← В работе</button>
      <div class="page-subheader-title">👥 Распределение работ</div>
      <div class="car-subtitle" id="carSubtitle">Загрузка...</div>
    </div>
  </div>

  <div id="mainContent">
    <div class="loading">⏳ Загрузка расчёта...</div>
  </div>
</div>

<script src="footer.js"></script>
<script>
(function() {
'use strict';

window.goBack = function() {
  const referrer = document.referrer;
  if (referrer && referrer.includes('board.html')) {
    window.location.href = 'board.html';
  } else {
    window.location.href = 'dashboard.html';
  }
};

window.showSavedBanner = function(calcId, count) {
  // Hide save button, show success banner
  const btn = document.getElementById('btnSave');
  if (btn) btn.style.display = 'none';

  const banner = document.getElementById('savedBanner');
  if (banner) {
    document.getElementById('savedCount').textContent = count;
    document.getElementById('woLink').href = 'work-order.html?calc_id=' + calcId;
    banner.style.display = 'flex';
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const SUPABASE_URL     = 'https://hdghijgrrnzmntistdvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window._crmSb = sb;

let currentUser   = null;
let currentStudio = null;
let calculation   = null;
let executors     = [];
let calcId        = null;

const SERVICE_NAMES = {
  pkg_wrap:    'Оклейка (Полная защита)',
  pkg_prep:    'Подготовка (Полная защита)',
  pkg_arm:     'Арматурные работы (Полная защита)',
  impact_wrap: 'Оклейка (Ударная часть)',
  impact_prep: 'Подготовка (Ударная часть)',
  impact_arm:  'Арматурные работы (Ударная часть)',
  arm:  'Арматурные работы',
  wrap: 'Оклейка',
  det:  'Детейлинг',
  gl:   'Полировка/Химчистка',
  ms:   'Прочие услуги'
};

function fmt(n) {
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = 'welcome.html'; return false; }
  currentUser = session.user;
  return true;
}

async function getStudio() {
  const { data, error } = await sb
    .from('studio_members')
    .select('studio_id, role')
    .eq('user_id', currentUser.id)
    .eq('is_active', true)
    .single();
  if (error || !data) { alert('❌ Студия не найдена'); return false; }
  currentStudio = data;
  return true;
}

async function loadExecutors() {
  const { data, error } = await sb
    .from('executors')
    .select('id, full_name, role, is_admin')
    .eq('studio_id', currentStudio.studio_id)
    .eq('is_active', true)
    .order('full_name');
  if (error) { console.error('Executors error:', error); return; }
  executors = data || [];
}

function executorSelect(selectedId = '') {
  const opts = executors.map(e =>
    `<option value="${e.id}" ${e.id === selectedId ? 'selected' : ''}>${e.full_name} (${roleRu(e.role)})</option>`
  ).join('');
  return `<select><option value="">— Выбрать исполнителя —</option>${opts}</select>`;
}

function roleRu(r) {
  const m = { wrapper: 'Оклейщик', preparer: 'Детейлер', armature: 'Арматурщик', detailer: 'Детейлер', universal: 'Универсал' };
  return m[r] || r;
}

function adminExecutorSelect(selectedId = '') {
  const admins = executors.filter(e => e.is_admin);
  if (admins.length === 0) return '<span style="color:var(--muted);font-size:0.82rem">Нет продавцов. Добавьте в Исполнителях.</span>';
  const opts = admins.map(e =>
    `<option value="${e.id}" ${e.id === selectedId ? 'selected' : ''}>${e.full_name}</option>`
  ).join('');
  return `<select id="adminExecutorId"><option value="">— Выбрать продавца —</option>${opts}</select>`;
}

function extractServices(calcData) {
  const services = [];
  const d = calcData;
  const seen = new Set();

  function addIfHasMot(key, name, mot) {
    const m = parseFloat(mot) || 0;
    if (m > 0 && !seen.has(key)) {
      seen.add(key);
      services.push({ key, name, baseSalary: m });
    }
  }

  if (d.package) {
    addIfHasMot('pkg_wrap', SERVICE_NAMES.pkg_wrap, d.package.wrapMot);
    addIfHasMot('pkg_prep', SERVICE_NAMES.pkg_prep, d.package.prepMot);
    addIfHasMot('pkg_arm',  SERVICE_NAMES.pkg_arm,  d.package.armMot);
  }
  if (d.impact) {
    addIfHasMot('impact_wrap', SERVICE_NAMES.impact_wrap, d.impact.wrapMot);
    addIfHasMot('impact_prep', SERVICE_NAMES.impact_prep, d.impact.prepMot);
    addIfHasMot('impact_arm',  SERVICE_NAMES.impact_arm,  d.impact.armMot);
  }
  if (d.services_detail) {
    const groups = { arm: 'Бронирование', det: 'Детейлинг', gl: 'Стёкла', ms: 'Доп. услуги', wrap: 'Оклейка' };
    Object.entries(groups).forEach(([key, groupName]) => {
      (d.services_detail[key] || []).forEach((item, idx) => {
        const m = parseFloat(item.mot) || 0;
        if (m > 0) {
          const k = `${key}_${idx}`;
          if (!seen.has(k)) { seen.add(k); services.push({ key: k, name: item.name || groupName, baseSalary: m }); }
        }
      });
    });
  }
  if (!d.services_detail) {
    ['arm','wrap','det','gl','ms'].forEach(key => {
      if (d[key]) addIfHasMot(key, SERVICE_NAMES[key] || key, d[key].mot || d[key].motivation);
    });
  }
  if (d.services && Array.isArray(d.services)) {
    d.services.forEach((srv, idx) => {
      const m = parseFloat(srv.mot || srv.motivation) || 0;
      if (m > 0) addIfHasMot(`service_${idx}`, srv.name || `Услуга ${idx + 1}`, m);
    });
  }

  return services;
}

let workItemCounter = 0;

function renderWorkItem(service, existingAssignments = []) {
  const id = `work_${workItemCounter++}`;

  // ── БАГ-ФИX ──────────────────────────────────────────────────────
  // Существующие назначения хранят service_name, а не service_key.
  // Фильтруем по service_name, а service_key используем только как
  // data-атрибут для будущих расширений.
  const matched = existingAssignments.filter(a =>
    a.service_name === service.name ||
    a.service_key  === service.key          // fallback для старых записей
  );
  // ─────────────────────────────────────────────────────────────────

  const execRowsHtml = matched.length > 0
    ? matched.map((a, i) => renderExecutorRow(`${id}_exec_${i}`, a.executor_id || '', a.salary, a.executor_name || '', a.work_date_from || '', a.work_date_to || '')).join('')
    : renderExecutorRow(`${id}_exec_0`, '', service.baseSalary);

  return `
    <div class="work-item" data-service-key="${service.key}" data-service-name="${service.name}">
      <div class="work-item-header">
        <span class="work-service-name">${service.name}</span>
        <span class="work-base-salary">Мотивация: ${fmt(service.baseSalary)}</span>
      </div>
      <div class="executor-rows" id="${id}_rows">
        ${execRowsHtml}
      </div>
      <button class="add-executor-btn" onclick="addExecutorRow('${id}_rows', ${service.baseSalary})">
        ➕ Добавить исполнителя
      </button>
    </div>
  `;
}

function renderExecutorRow(id, executorId = '', salary = 0, manualName = '', dateFrom = '', dateTo = '') {
  const isManual = !executorId && !!manualName;
  // Default dates: from checkin to expected checkout
  const checkinRaw = calculation?.checkin_date || calculation?.scheduled_from || '';
  const checkoutRaw = document.getElementById('expectedCheckout')?.value || calculation?.expected_checkout || calculation?.scheduled_to || '';
  const defFrom = dateFrom || checkinRaw;
  const defTo   = dateTo   || checkoutRaw;
  return `
    <div class="executor-row" id="${id}">
      <div class="executor-input-group">
        <div class="executor-mode-switcher">
          <button class="mode-btn ${!isManual ? 'active' : ''}" onclick="setExecutorMode('${id}', 'select')">📋 Из справочника</button>
          <button class="mode-btn ${isManual ? 'active' : ''}" onclick="setExecutorMode('${id}', 'manual')">✏️ Вручную</button>
        </div>
        <div class="executor-fields-row">
          <div class="executor-select-wrap" style="display:${isManual ? 'none' : 'block'}">
            ${executorSelect(executorId)}
          </div>
          <div class="executor-manual-wrap" style="display:${isManual ? 'block' : 'none'}">
            <input type="text" class="manual-name-input" value="${manualName}" placeholder="ФИО исполнителя" autocomplete="off">
          </div>
          <input type="number" value="${salary ? Math.round(salary) : ''}" placeholder="Сумма" step="1" class="salary-input">
          <button class="btn-remove-exec" onclick="removeExecutorRow('${id}')" title="Удалить">✕</button>
        </div>
        <div class="executor-dates-row">
          <span class="dates-label">Даты работы:</span>
          <input type="date" class="exec-date-from" value="${defFrom}" title="Начало работы">
          <span class="dates-sep">—</span>
          <input type="date" class="exec-date-to" value="${defTo}" title="Конец работы">
        </div>
        <div class="executor-manual-save" style="display:${isManual ? 'flex' : 'none'}">
          <label class="save-to-list-label">
            <input type="checkbox" class="save-to-list" checked>
            <span>Сохранить в справочник</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

window.refreshDefaultDates = function() {
  // When expected checkout changes, update empty date fields
  const checkout = document.getElementById('expectedCheckout')?.value || '';
  if (!checkout) return;
  document.querySelectorAll('.exec-date-to').forEach(el => {
    if (!el.value) el.value = checkout;
  });
};

window.setExecutorMode = function(rowId, mode) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const selectWrap = row.querySelector('.executor-select-wrap');
  const manualWrap = row.querySelector('.executor-manual-wrap');
  const manualSave = row.querySelector('.executor-manual-save');
  const btns = row.querySelectorAll('.mode-btn');
  if (mode === 'manual') {
    selectWrap.style.display = 'none';
    manualWrap.style.display = 'block';
    manualSave.style.display = 'flex';
    btns[0].classList.remove('active');
    btns[1].classList.add('active');
  } else {
    selectWrap.style.display = 'block';
    manualWrap.style.display = 'none';
    manualSave.style.display = 'none';
    btns[0].classList.add('active');
    btns[1].classList.remove('active');
  }
};

window.addExecutorRow = function(containerId, defaultSalary = 0) {
  const id = `exec_${Date.now()}`;
  const row = document.createElement('div');
  row.innerHTML = renderExecutorRow(id, '', defaultSalary);
  document.getElementById(containerId).appendChild(row.firstElementChild);
  updateSummary();
};

window.removeExecutorRow = function(rowId) {
  const el = document.getElementById(rowId);
  if (el) el.remove();
  updateSummary();
};

function updateSummary() {
  let total = 0, count = 0;
  document.querySelectorAll('.executor-row').forEach(row => {
    const sal  = parseFloat(row.querySelector('input[type="number"]')?.value) || 0;
    const exec = row.querySelector('select')?.value;
    if (exec || sal > 0) { total += sal; count++; }
  });
  document.getElementById('summaryCount').textContent = count;
  document.getElementById('summaryTotal').textContent = fmt(total) + '';
}

window.toggleAdminSale = function() {
  const isChecked = document.getElementById('isAdminSale').checked;
  document.getElementById('adminDetails').classList.toggle('active', isChecked);
  calcAdminSalary();
};

window.setAdminMode = function(mode) {
  const selectWrap = document.getElementById('adminSelectWrap');
  const manualWrap = document.getElementById('adminManualWrap');
  const btnSelect  = document.getElementById('adminModeSelect');
  const btnManual  = document.getElementById('adminModeManual');
  if (mode === 'manual') {
    selectWrap.style.display = 'none';
    manualWrap.style.display = 'block';
    btnSelect.classList.remove('active');
    btnManual.classList.add('active');
  } else {
    selectWrap.style.display = 'block';
    manualWrap.style.display = 'none';
    btnSelect.classList.add('active');
    btnManual.classList.remove('active');
  }
};

function calcAdminSalary() {
  if (!document.getElementById('isAdminSale')?.checked) return;
  const pct      = parseFloat(document.getElementById('adminPercent')?.value) || 0;
  const adminSal = Math.round((calculation?.total_price || 0) * pct / 100);
  const el       = document.getElementById('adminSalaryCalc');
  if (el) el.textContent = `ЗП продавца: ${fmt(adminSal)}`;
}

window.addManualWork = function() {
  const name   = document.getElementById('manualServiceName').value.trim();
  const salary = parseFloat(document.getElementById('manualSalary').value) || 0;
  if (!name) { alert('Введите название работы'); return; }

  const service = { key: `manual_${Date.now()}`, name, baseSalary: salary };
  const item = document.createElement('div');
  item.innerHTML = renderWorkItem(service);

  let workList = document.getElementById('workList');
  if (!workList) {
    const card = document.querySelector('.card');
    const div  = document.createElement('div');
    div.className = 'work-list'; div.id = 'workList';
    card.appendChild(div);
    div.appendChild(item.firstElementChild);
  } else {
    workList.appendChild(item.firstElementChild);
  }

  item.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updateSummary);
    el.addEventListener('input', updateSummary);
  });

  document.getElementById('manualServiceName').value = '';
  document.getElementById('manualSalary').value = '';
  updateSummary();
};

window.saveAssignments = async function() {
  const assignments = [];

  // Admin sale
  const isAdminSale = document.getElementById('isAdminSale')?.checked;
  if (isAdminSale) {
    const isManualMode = document.getElementById('adminManualWrap')?.style.display !== 'none';
    const pct          = parseFloat(document.getElementById('adminPercent')?.value) || 0;
    const adminSal     = Math.round((calculation.total_price || 0) * pct / 100);
    let adminExecId = null, adminExecName = '';

    if (isManualMode) {
      adminExecName = document.getElementById('adminManualName')?.value?.trim();
      const saveToList = document.getElementById('adminSaveToList')?.checked;
      if (adminExecName && saveToList) {
        const { data: savedAdmin } = await sb.from('executors').insert({
          studio_id: currentStudio.studio_id,
          full_name: adminExecName,
          role: 'universal', is_active: true, is_admin: true
        }).select().single();
        if (savedAdmin) { adminExecId = savedAdmin.id; executors.push(savedAdmin); }
      }
    } else {
      adminExecId = document.getElementById('adminExecutorId')?.value;
      adminExecName = executors.find(e => e.id === adminExecId)?.full_name || '';
    }

    if ((adminExecId || adminExecName) && adminSal > 0) {
      assignments.push({
        studio_id: currentStudio.studio_id, calculation_id: calcId,
        car_name: calculation.car_name,
        service_name: 'Продажа (% от чека)',
        executor_id: adminExecId || null, executor_name: adminExecName,
        salary: adminSal, is_admin_sale: true, admin_percent: pct,
        status: 'pending', payment_month: new Date().toISOString().slice(0, 7)
      });
    }
  }

  // Work items
  const newExecutorsToSave = [];

  document.querySelectorAll('.work-item').forEach(item => {
    const serviceName = item.dataset.serviceName;

    item.querySelectorAll('.executor-row').forEach(row => {
      const isManualMode = row.querySelector('.executor-manual-wrap')?.style.display !== 'none';
      let execId = null, execName = '', saveToList = false;

      if (isManualMode) {
        execName = row.querySelector('.manual-name-input')?.value?.trim();
        saveToList = row.querySelector('.save-to-list')?.checked;
        if (!execName) return;
        if (saveToList) newExecutorsToSave.push(execName);
      } else {
        execId = row.querySelector('select')?.value;
        if (!execId) return;
        execName = executors.find(e => e.id === execId)?.full_name || '';
      }

      const salary = parseFloat(row.querySelector('.salary-input')?.value) || 0;
      if (salary <= 0) return;

      const workDateFrom = row.querySelector('.exec-date-from')?.value || null;
      const workDateTo   = row.querySelector('.exec-date-to')?.value   || null;
      if (!workDateFrom || !workDateTo) {
        alert('❌ Укажите даты работы для исполнителя: ' + (execName || 'без имени'));
        return;
      }
      assignments.push({
        studio_id: currentStudio.studio_id, calculation_id: calcId,
        car_name: calculation.car_name,
        service_name: serviceName,
        executor_id: execId || null, executor_name: execName,
        salary, is_admin_sale: false, status: 'pending',
        payment_month: new Date().toISOString().slice(0, 7),
        work_date_from: workDateFrom,
        work_date_to:   workDateTo,
      });
    });
  });

  if (assignments.length === 0) { alert('❌ Не назначено ни одного исполнителя с суммой!'); return; }

  try {
    if (newExecutorsToSave.length > 0) {
      const uniqueNames = [...new Set(newExecutorsToSave)];
      const { data: savedExecs, error: execError } = await sb.from('executors').insert(
        uniqueNames.map(name => ({ studio_id: currentStudio.studio_id, full_name: name, role: 'universal', is_active: true, is_admin: false }))
      ).select();
      if (!execError && savedExecs) {
        savedExecs.forEach(saved => {
          assignments.forEach(a => { if (a.executor_name === saved.full_name && !a.executor_id) a.executor_id = saved.id; });
        });
        executors.push(...savedExecs);
      }
    }

    await sb.from('work_assignments').delete().eq('calculation_id', calcId);
    const { error } = await sb.from('work_assignments').insert(assignments);
    if (error) { console.error('Save error:', error); alert('❌ Ошибка сохранения: ' + error.message); return; }

    const expectedCheckout = document.getElementById('expectedCheckout')?.value || null;
    await sb.from('calculations').update({
      work_assigned: true,
      status: 'in_progress',
      ...(expectedCheckout ? { expected_checkout: expectedCheckout } : {})
    }).eq('id', calcId);

    showSavedBanner(calcId, assignments.length);
  } catch (e) {
    console.error('Error:', e);
    alert('❌ Ошибка сохранения');
  }
};

function renderContent(services, existingAssignments = []) {
  const carName = calculation.car_name || 'Без названия';
  document.getElementById('carSubtitle').textContent = carName;

  // Fill checkin date if available
  const checkinDate = calculation.checkin_date || calculation.scheduled_from || '';
  if (checkinDate) {
    const el = document.getElementById('dateCheckinVal');
    if (el) el.textContent = new Date(checkinDate).toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric'});
  }
  // Default expected checkout = checkin + 5 days or scheduled_to
  const defaultCheckout = calculation.expected_checkout || calculation.scheduled_to || '';
  const checkoutEl = document.getElementById('expectedCheckout');
  if (checkoutEl && defaultCheckout) checkoutEl.value = defaultCheckout;

  // Ищем существующую admin-sale запись
  const adminSaleRecord = existingAssignments.find(a => a.is_admin_sale);
  const adminChecked    = !!adminSaleRecord;
  const adminPercent    = adminSaleRecord?.admin_percent || 3;
  const adminExecId     = adminSaleRecord?.executor_id || '';

  let html = '';

  // Dates header
  const checkinStr = calculation.checkin_date || calculation.scheduled_from || '';
  const fmtD = d => d ? new Date(d).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
  html += `
    <div class="dates-header-card">
      <div class="dates-header-item">
        <span class="dates-header-label">Дата заезда</span>
        <span class="dates-header-value" id="dateCheckinVal">${fmtD(checkinStr)}</span>
      </div>
      <span style="color:var(--muted);font-size:1.2rem;align-self:center">→</span>
      <div class="dates-header-item">
        <span class="dates-header-label">Планируемый выезд</span>
        <input type="date" id="expectedCheckout"
          value="${calculation.expected_checkout || calculation.scheduled_to || ''}"
          onchange="refreshDefaultDates()"
          placeholder="Выберите дату">
      </div>
    </div>
  `;

  // Admin sale
  html += \`
    <div class="admin-sale-block">\`
      <div class="admin-sale-row">
        <label class="toggle-switch">
          <input type="checkbox" id="isAdminSale" onchange="toggleAdminSale()" ${adminChecked ? 'checked' : ''}>
          <span>👔 Продажу сделал администратор</span>
        </label>
        <div class="admin-details${adminChecked ? ' active' : ''}" id="adminDetails">
          <div class="form-group">
            <label>Режим</label>
            <div style="display:flex;gap:5px">
              <button class="mode-btn active" id="adminModeSelect" onclick="setAdminMode('select')">📋 Из списка</button>
              <button class="mode-btn" id="adminModeManual" onclick="setAdminMode('manual')">✏️ Вручную</button>
            </div>
          </div>
          <div class="form-group" id="adminSelectWrap">
            <label>Продавец</label>
            ${adminExecutorSelect(adminExecId)}
          </div>
          <div class="form-group" id="adminManualWrap" style="display:none">
            <label>ФИО продавца</label>
            <input type="text" id="adminManualName" placeholder="Иванов Иван Иванович" style="width:220px" autocomplete="off">
            <label class="save-to-list-label" style="margin-top:4px">
              <input type="checkbox" id="adminSaveToList" checked>
              <span>Сохранить в справочник</span>
            </label>
          </div>
          <div class="form-group">
            <label>% от чека</label>
            <input type="number" id="adminPercent" value="${adminPercent}" min="0" max="100" step="0.5" style="width:100px">
          </div>
          <div style="font-size:0.8rem;color:var(--muted);line-height:1.5">
            Чек: ${fmt(calculation.total_price)}<br>
            <strong id="adminSalaryCalc" style="color:var(--warning)"></strong>
          </div>
        </div>
      </div>
    </div>
  `;

  // Non-admin assignments (фильтруем admin_sale из списка)
  const workAssignments = existingAssignments.filter(a => !a.is_admin_sale);

  // Services
  if (services.length > 0) {
    html += `
      <div class="card">
        <div class="card-title">🔧 Услуги из расчёта</div>
        <div class="work-list" id="workList">
          ${services.map(s => renderWorkItem(s, workAssignments)).join('')}
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="card">
        <div class="card-title">🔧 Услуги из расчёта</div>
        <div style="padding:20px;color:var(--muted);text-align:center;font-size:0.85rem">
          В расчёте нет услуг с мотивацией. Добавьте услуги вручную ниже.
        </div>
      </div>
    `;
  }

  // Manual work
  html += `
    <div class="card">
      <div class="card-title">➕ Добавить работу вручную</div>
      <div class="add-work-row">
        <input type="text" id="manualServiceName" placeholder="Название работы (напр: Мойка, Полировка)" autocomplete="off">
        <input type="number" id="manualSalary" placeholder="Сумма" min="0" step="1">
      </div>
      <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="addManualWork()">➕ Добавить</button>
    </div>
  `;

  // Summary + Save
  html += `
    <div class="card">
      <div class="card-title">📊 Итого к выплате</div>
      <div class="summary-block">
        <div class="summary-row">
          <span class="summary-label">Исполнителей назначено</span>
          <span class="summary-value" id="summaryCount">0</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">💰 Итого ЗП</span>
          <span class="summary-total-value" id="summaryTotal">0</span>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="window.history.back()">← Отмена</button>
        <button class="btn btn-success" id="btnSave" onclick="saveAssignments()">💾 Сохранить распределение</button>
      </div>

      <!-- Баннер после сохранения -->
      <div id="savedBanner" style="display:none;margin-top:16px;padding:16px 20px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="font-size:1.2rem">✅</div>
        <div style="flex:1">
          <div style="font-weight:800;color:#065f46;font-size:0.95rem">Сохранено! Назначено <span id="savedCount">0</span> записей.</div>
          <div style="font-size:0.8rem;color:#059669;margin-top:2px">Статус заказа переведён в «Принято в работу»</div>
        </div>
        <a id="woLink" href="#" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:#0f172a;color:#fff;border-radius:9px;font-size:0.85rem;font-weight:700;text-decoration:none">🖨️ Скачать заказ-наряд</a>
        <a href="board.html" style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:#f1f5f9;color:#0f172a;border-radius:9px;font-size:0.85rem;font-weight:700;text-decoration:none;border:1px solid rgba(15,23,42,0.10)">← На доску</a>
      </div>
    </div>
  `;

  document.getElementById('mainContent').innerHTML = html;

  // Слушатели на изменения
  document.querySelectorAll('.executor-row input, .executor-row select').forEach(el => {
    el.addEventListener('change', updateSummary);
    el.addEventListener('input', updateSummary);
  });

  document.getElementById('adminPercent')?.addEventListener('input', calcAdminSalary);
  calcAdminSalary();
  updateSummary();
}

async function init() {
  initNav({ actionHref: 'board.html', actionLabel: '← В работе' });
  if (!await checkAuth()) return;
  if (!await getStudio()) return;

  const params = new URLSearchParams(window.location.search);
  calcId = params.get('calc_id');

  if (!calcId) {
    document.getElementById('mainContent').innerHTML = '<div class="loading">❌ Не указан ID расчёта</div>';
    return;
  }

  const { data: calcData, error: calcError } = await sb
    .from('calculations')
    .select('*, calendar_bookings(date_from, date_to)')
    .eq('id', calcId)
    .single();

  if (calcError || !calcData) {
    document.getElementById('mainContent').innerHTML = '<div class="loading">❌ Расчёт не найден</div>';
    return;
  }

  calculation = calcData;
  await loadExecutors();

  // Загружаем существующие назначения
  const { data: existingData } = await sb
    .from('work_assignments')
    .select('*')
    .eq('calculation_id', calcId);

  const services = extractServices(calcData.calculation_data || {});
  renderContent(services, existingData || []);
}

init();

})();
</script>

</body>
</html>

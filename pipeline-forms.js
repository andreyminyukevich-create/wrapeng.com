// pipeline-forms.js
// Модальные формы воронки цеха — приём, аутсорсинг, проверка, выдача, отмена
// Phase 1: acceptance modal (scheduled -> accepted)
// Phase 2: done modal (FORM-03) + delivery modal (FORM-04)
(function () {
'use strict';

// ── Локальная утилита форматирования числа ────────────────────────
function _fmt(n) {
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

let _acceptCalcId = null;

// ── HTML шаблон модала приёмки ────────────────────────────────────
const ACCEPT_HTML = `
<div class="modal" id="modalAccept">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Приём автомобиля</div>
    <div class="modal-car" id="acceptCarName"></div>

    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:4px">Пробег и топливо</div>
    <div class="form-group">
      <label>Пробег (км)</label>
      <input type="number" id="acceptMileage" placeholder="напр. 45000" min="0">
    </div>
    <div class="form-group">
      <label>Уровень топлива</label>
      <select id="acceptFuel">
        <option value="">— выберите —</option>
        <option value="full">Полный</option>
        <option value="3/4">3/4</option>
        <option value="1/2">1/2</option>
        <option value="1/4">1/4</option>
        <option value="empty">Пусто</option>
      </select>
    </div>

    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:12px">Повреждения</div>
    <div class="form-group">
      <label>Описание повреждений</label>
      <textarea id="acceptDamages" rows="3" placeholder="Царапина на левом крыле, вмятина на заднем бампере..."></textarea>
    </div>

    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:12px">Комплектация</div>
    <div id="acceptEquipment" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:13px"></div>

    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:12px">Фото</div>
    <div id="acceptPhotos" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:13px"></div>

    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:12px">Подтверждение</div>
    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:10px">
      <input type="checkbox" id="acceptClientAgreed" style="width:auto;min-width:18px;min-height:18px">
      <span style="font-size:0.85rem;font-weight:600">Клиент согласен с актом приёмки</span>
    </label>
    <div class="form-group">
      <label>Примечания</label>
      <textarea id="acceptNotes" rows="2" placeholder="Дополнительные заметки..."></textarea>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnAcceptCancel">Отмена</button>
      <button class="btn btn-primary" id="btnAcceptSave">Принять авто</button>
    </div>
  </div>
</div>
`;

const EQUIPMENT_ITEMS = ['Запаска', 'Домкрат', 'Аптечка', 'Огнетушитель', 'Документы', 'Ключи'];
const PHOTO_ZONES = ['Перед', 'Зад', 'Лев', 'Прав', 'Салон', 'Багаж'];

// ── Инъекция HTML ─────────────────────────────────────────────────
function injectAccept() {
  if (document.getElementById('modalAccept')) return;
  document.body.insertAdjacentHTML('beforeend', ACCEPT_HTML);

  // Populate equipment checkboxes
  const eqContainer = document.getElementById('acceptEquipment');
  EQUIPMENT_ITEMS.forEach(item => {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer';
    label.innerHTML = `<input type="checkbox" data-key="${item.toLowerCase()}" style="width:auto"> ${item}`;
    eqContainer.appendChild(label);
  });

  // Populate photo zone checkboxes
  const phContainer = document.getElementById('acceptPhotos');
  PHOTO_ZONES.forEach(zone => {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer';
    label.innerHTML = `<input type="checkbox" data-key="${zone.toLowerCase()}" style="width:auto"> ${zone}`;
    phContainer.appendChild(label);
  });

  // Bind events
  document.getElementById('btnAcceptCancel').addEventListener('click', () => {
    document.getElementById('modalAccept').classList.remove('active');
  });
  document.getElementById('btnAcceptSave').addEventListener('click', saveAcceptance);
  document.getElementById('modalAccept').addEventListener('click', e => {
    if (e.target === document.getElementById('modalAccept')) {
      document.getElementById('modalAccept').classList.remove('active');
    }
  });
}

// ── Сбор данных формы ─────────────────────────────────────────────
function gatherAcceptanceForm() {
  const equipment = {};
  document.querySelectorAll('#acceptEquipment input[type=checkbox]').forEach(cb => {
    equipment[cb.dataset.key] = cb.checked;
  });

  const photo_checks = {};
  document.querySelectorAll('#acceptPhotos input[type=checkbox]').forEach(cb => {
    photo_checks[cb.dataset.key] = cb.checked;
  });

  return {
    mileage: parseInt(document.getElementById('acceptMileage').value, 10) || null,
    fuel_level: document.getElementById('acceptFuel').value || null,
    damages: document.getElementById('acceptDamages').value.trim() || null,
    equipment,
    photo_checks,
    client_agreed: document.getElementById('acceptClientAgreed').checked,
    notes: document.getElementById('acceptNotes').value.trim() || null,
  };
}

// ── Открытие модала ───────────────────────────────────────────────
function openModalAccept(calcId, carName) {
  injectAccept();
  _acceptCalcId = calcId;

  // Set car name (textContent for XSS protection)
  document.getElementById('acceptCarName').textContent = carName;

  // Reset form fields
  document.getElementById('acceptMileage').value = '';
  document.getElementById('acceptFuel').selectedIndex = 0;
  document.getElementById('acceptDamages').value = '';
  document.getElementById('acceptClientAgreed').checked = false;
  document.getElementById('acceptNotes').value = '';
  document.querySelectorAll('#acceptEquipment input[type=checkbox], #acceptPhotos input[type=checkbox]').forEach(cb => {
    cb.checked = false;
  });

  document.getElementById('modalAccept').classList.add('active');
}

// ── Сохранение ────────────────────────────────────────────────────
async function saveAcceptance() {
  const sb = window._sb;
  const ctx = window._boardCtx;
  const btn = document.getElementById('btnAcceptSave');

  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';

  try {
    const payload = gatherAcceptanceForm();

    // Step 1: INSERT acceptance_acts
    const { error: insertErr } = await sb
      .from('acceptance_acts')
      .insert({
        calc_id: _acceptCalcId,
        studio_id: ctx.studioId,
        ...payload,
      });

    // Handle duplicate key (23505) as success — record already exists
    if (insertErr) {
      const isDuplicate = insertErr.code === '23505' || (insertErr.message && insertErr.message.includes('duplicate'));
      if (!isDuplicate) {
        console.error('[pipeline] acceptance insert:', insertErr);
        window._showToast('error', 'Ошибка сохранения акта приёмки');
        return;
      }
    }

    // Step 2: PATCH status via board's updateStatus
    const ok = await window._updateStatus(_acceptCalcId, 'accepted');
    if (ok) {
      document.getElementById('modalAccept').classList.remove('active');
      window._showToast('success', 'Авто принято');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// -- Модал аутсорсинга --------------------------------------------

let _outsourceCalcId = null;

const OUTSOURCE_HTML = `
<div class="modal" id="modalOutsource">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">На аутсорсинг</div>
    <div class="modal-car" id="outsourceCarName"></div>
    <div class="form-group">
      <label>Подрядчик</label>
      <input type="text" id="outsourceContractor" placeholder="Название компании или ФИО">
    </div>
    <div class="form-group">
      <label>Вид работ</label>
      <input type="text" id="outsourceWorkType" placeholder="напр. Покраска бампера">
    </div>
    <div class="form-group">
      <label>Срок выполнения</label>
      <input type="date" id="outsourceDeadline">
    </div>
    <div class="form-group">
      <label>Тип аутсорсинга</label>
      <select id="outsourceType">
        <option value="car_leaves">Авто уезжает к подрядчику</option>
        <option value="contractor_arrives">Подрядчик приезжает в студию</option>
      </select>
    </div>
    <div class="form-group">
      <label>Примечания</label>
      <textarea id="outsourceNotes" rows="2" placeholder="Дополнительная информация..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnOutsourceCancel">Отмена</button>
      <button class="btn btn-primary" id="btnOutsourceSave">Отправить</button>
    </div>
  </div>
</div>
`;

function injectOutsource() {
  if (document.getElementById('modalOutsource')) return;
  document.body.insertAdjacentHTML('beforeend', OUTSOURCE_HTML);

  document.getElementById('btnOutsourceCancel').addEventListener('click', () => {
    document.getElementById('modalOutsource').classList.remove('active');
  });
  document.getElementById('btnOutsourceSave').addEventListener('click', saveOutsource);
  document.getElementById('modalOutsource').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOutsource')) {
      document.getElementById('modalOutsource').classList.remove('active');
    }
  });
}

function gatherOutsourceForm() {
  return {
    contractor_name: document.getElementById('outsourceContractor').value.trim() || null,
    work_type: document.getElementById('outsourceWorkType').value.trim() || null,
    deadline: document.getElementById('outsourceDeadline').value || null,
    outsource_type: document.getElementById('outsourceType').value,
    notes: document.getElementById('outsourceNotes').value.trim() || null,
  };
}

function openModalOutsource(calcId, carName) {
  injectOutsource();
  _outsourceCalcId = calcId;

  document.getElementById('outsourceCarName').textContent = carName;

  // Reset form fields
  document.getElementById('outsourceContractor').value = '';
  document.getElementById('outsourceWorkType').value = '';
  document.getElementById('outsourceDeadline').value = '';
  document.getElementById('outsourceType').selectedIndex = 0;
  document.getElementById('outsourceNotes').value = '';

  document.getElementById('modalOutsource').classList.add('active');
}

async function saveOutsource() {
  const btn = document.getElementById('btnOutsourceSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';

  try {
    // Step 1: INSERT into outsource_records
    const { error: insertErr } = await window._sb
      .from('outsource_records')
      .insert({
        calc_id: _outsourceCalcId,
        studio_id: window._boardCtx.studioId,
        ...gatherOutsourceForm(),
      });

    if (insertErr) {
      console.error('[pipeline] outsource insert:', insertErr);
      window._showToast('error', 'Ошибка сохранения');
      return;
    }

    // Step 2: PATCH status
    const ok = await window._updateStatus(_outsourceCalcId, 'outsourced');
    if (ok) {
      window._closeModal('modalOutsource');
      window._showToast('success', 'Отправлено на аутсорсинг');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// -- Модал возврата -----------------------------------------------

let _returnCalcId = null;

const RETURN_HTML = `
<div class="modal" id="modalReturn">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Возврат из аутсорсинга</div>
    <div class="modal-car" id="returnCarName"></div>
    <div class="form-group">
      <label>Дата возврата</label>
      <input type="date" id="returnDate">
    </div>
    <div class="form-group">
      <label>Состояние / замечания</label>
      <textarea id="returnNotes" rows="3" placeholder="Состояние автомобиля при возврате, замечания по работе подрядчика..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnReturnCancel">Отмена</button>
      <button class="btn btn-primary" id="btnReturnSave">Вернуть в работу</button>
    </div>
  </div>
</div>
`;

function injectReturn() {
  if (document.getElementById('modalReturn')) return;
  document.body.insertAdjacentHTML('beforeend', RETURN_HTML);

  document.getElementById('btnReturnCancel').addEventListener('click', () => {
    document.getElementById('modalReturn').classList.remove('active');
  });
  document.getElementById('btnReturnSave').addEventListener('click', saveReturn);
  document.getElementById('modalReturn').addEventListener('click', e => {
    if (e.target === document.getElementById('modalReturn')) {
      document.getElementById('modalReturn').classList.remove('active');
    }
  });
}

function openModalReturn(calcId, carName) {
  injectReturn();
  _returnCalcId = calcId;

  document.getElementById('returnCarName').textContent = carName;
  document.getElementById('returnDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('returnNotes').value = '';

  document.getElementById('modalReturn').classList.add('active');
}

async function saveReturn() {
  const btn = document.getElementById('btnReturnSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';

  try {
    const returnDate = document.getElementById('returnDate').value || new Date().toISOString();
    const returnNotes = document.getElementById('returnNotes').value.trim() || null;

    // UPDATE outsource_records — target only the active (unreturned) record
    const { error: updateErr } = await window._sb
      .from('outsource_records')
      .update({ returned_at: returnDate, return_notes: returnNotes })
      .eq('calc_id', _returnCalcId)
      .eq('studio_id', window._boardCtx.studioId)
      .is('returned_at', null);

    if (updateErr) {
      console.error('[pipeline] outsource return update:', updateErr);
      window._showToast('error', 'Ошибка сохранения');
      return;
    }

    // PATCH status back to in_progress
    const ok = await window._updateStatus(_returnCalcId, 'in_progress');
    if (ok) {
      window._closeModal('modalReturn');
      window._showToast('success', 'Авто возвращено в работу');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// -- Модал отмены -------------------------------------------------

let _cancelCalcId = null;

const CANCEL_REASONS = [
  { value: 'no_show',    label: 'Клиент не приехал' },
  { value: 'refused',    label: 'Клиент отказался' },
  { value: 'scheduling', label: 'Конфликт расписания' },
  { value: 'other',      label: 'Другое' },
];

const CANCEL_HTML = `
<div class="modal" id="modalCancel">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Отмена заказа</div>
    <div class="modal-car" id="cancelCarName"></div>
    <div class="form-group">
      <label>Причина отмены</label>
      <select id="cancelReason">
        <option value="">— выберите причину —</option>
      </select>
    </div>
    <div class="form-group">
      <label>Комментарий</label>
      <textarea id="cancelComment" rows="3" placeholder="Подробности..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnCancelModalClose">Отмена</button>
      <button class="btn" style="background:var(--danger);color:#fff" id="btnCancelSave">Отменить заказ</button>
    </div>
  </div>
</div>
`;

function injectCancel() {
  if (document.getElementById('modalCancel')) return;
  document.body.insertAdjacentHTML('beforeend', CANCEL_HTML);

  // Populate reason options dynamically
  const sel = document.getElementById('cancelReason');
  CANCEL_REASONS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.value;
    opt.textContent = r.label;
    sel.appendChild(opt);
  });

  document.getElementById('btnCancelModalClose').addEventListener('click', () => {
    document.getElementById('modalCancel').classList.remove('active');
  });
  document.getElementById('btnCancelSave').addEventListener('click', saveCancel);
  document.getElementById('modalCancel').addEventListener('click', e => {
    if (e.target === document.getElementById('modalCancel')) {
      document.getElementById('modalCancel').classList.remove('active');
    }
  });
}

function openModalCancel(calcId, carName) {
  injectCancel();
  _cancelCalcId = calcId;

  document.getElementById('cancelCarName').textContent = carName;
  document.getElementById('cancelReason').selectedIndex = 0;
  document.getElementById('cancelComment').value = '';

  document.getElementById('modalCancel').classList.add('active');
}

async function saveCancel() {
  const btn = document.getElementById('btnCancelSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';

  try {
    const reason = document.getElementById('cancelReason').value;
    if (!reason) {
      window._showToast('warning', 'Выберите причину отмены');
      return;
    }

    const comment = document.getElementById('cancelComment').value.trim();
    const fullComment = comment ? '[' + reason + '] ' + comment : '[' + reason + ']';

    const ok = await window._updateStatus(_cancelCalcId, 'cancelled', { _historyComment: fullComment });
    if (ok) {
      window._closeModal('modalCancel');
      window._showToast('success', 'Заказ отменён');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// -- Модал проверки (done) ----------------------------------------

let _doneCalcId = null;
let _donePlanItems = [];

const DONE_HTML = `
<div class="modal" id="modalDone">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Работа выполнена</div>
    <div class="modal-car" id="doneCarName"></div>

    <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:4px">Проверка</div>
    <div class="form-group">
      <label>Кто проверил</label>
      <input type="text" id="doneCheckedBy" placeholder="ФИО проверяющего">
    </div>
    <div class="form-group">
      <label>Замечания / дефекты</label>
      <textarea id="doneRemarks" rows="2" placeholder="Замечания по качеству работы..."></textarea>
    </div>

    <div id="doneMaterialsBlock" style="margin-bottom:16px">
      <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:10px;margin-top:12px">Расход материалов</div>
      <div id="doneMaterialsLoading" style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:12px 0">Загрузка...</div>
      <div id="doneMaterialsRows" style="display:none">
        <div style="display:grid;grid-template-columns:1fr 110px 110px;gap:6px;margin-bottom:6px;padding:0 2px">
          <div style="font-size:0.67rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted)">Услуга</div>
          <div style="font-size:0.67rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);text-align:right">План</div>
          <div style="font-size:0.67rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7c3aed;text-align:right">Факт</div>
        </div>
        <div id="doneMaterialsList" style="display:flex;flex-direction:column;gap:5px"></div>
        <div style="display:grid;grid-template-columns:1fr 110px 110px;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
          <div style="font-size:0.8rem;font-weight:700;color:var(--text)">Итого</div>
          <div id="donePlanTotal" style="font-size:0.88rem;font-weight:700;color:var(--text-muted);text-align:right">—</div>
          <div id="doneFactTotal" style="font-size:0.88rem;font-weight:700;color:#7c3aed;text-align:right">—</div>
        </div>
        <div id="doneDelta" style="margin-top:6px;font-size:0.78rem;text-align:right;color:var(--text-muted)"></div>
      </div>
      <div id="doneMaterialsEmpty" style="display:none;color:var(--text-muted);font-size:0.82rem;padding:8px 0">В расчёте нет плановых материалов.</div>
    </div>

    <div class="form-group">
      <label>Примечания</label>
      <textarea id="doneNotes" rows="2" placeholder="Дополнительные заметки..."></textarea>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnDoneCancel">Отмена</button>
      <button class="btn" style="background:var(--purple);color:#fff" id="btnDoneSave">Завершить</button>
    </div>
  </div>
</div>
`;

function injectDone() {
  if (document.getElementById('modalDone')) return;
  document.body.insertAdjacentHTML('beforeend', DONE_HTML);

  document.getElementById('btnDoneCancel').addEventListener('click', () => {
    document.getElementById('modalDone').classList.remove('active');
  });
  document.getElementById('btnDoneSave').addEventListener('click', saveDone);
  document.getElementById('modalDone').addEventListener('click', e => {
    if (e.target === document.getElementById('modalDone')) {
      document.getElementById('modalDone').classList.remove('active');
    }
  });
}

function extractMaterials(calcData) {
  const items = [];
  const d     = calcData || {};
  const seen  = new Set();

  function add(key, name, mat) {
    const m = parseFloat(mat) || 0;
    if (m > 0 && !seen.has(key)) { seen.add(key); items.push({ key, name, plan: m }); }
  }

  if (d.package) {
    add('pkg_wrap', 'Оклейка (Полная защита кузова)', d.package.wrapMat);
    add('pkg_prep', 'Подготовка (Полная защита)',     d.package.prepMat);
    add('pkg_arm',  'Бронирование (Полная защита)',   d.package.armMat);
  }
  if (d.impact) {
    add('impact_wrap', 'Оклейка (Ударная часть)',     d.impact.wrapMat);
    add('impact_prep', 'Подготовка (Ударная часть)',  d.impact.prepMat);
    add('impact_arm',  'Бронирование (Ударная часть)', d.impact.armMat);
  }
  if (d.services_detail) {
    const gn = { arm: 'Бронирование', det: 'Детейлинг', gl: 'Стёкла', ms: 'Доп. услуги', wrap: 'Оклейка' };
    Object.entries(gn).forEach(([key, gName]) => {
      (d.services_detail[key] || []).forEach((item, idx) => {
        const m = parseFloat(item.mat) || 0;
        if (m > 0) add(`${key}_${idx}`, item.name || gName, m);
      });
    });
  }
  return items;
}

async function loadDoneMaterials(calcId) {
  const loading = document.getElementById('doneMaterialsLoading');
  const rows    = document.getElementById('doneMaterialsRows');
  const empty   = document.getElementById('doneMaterialsEmpty');
  const list    = document.getElementById('doneMaterialsList');

  loading.style.display = 'block';
  rows.style.display    = 'none';
  empty.style.display   = 'none';

  const { data } = await window._sb
    .from('calculations')
    .select('calculation_data, fact_materials')
    .eq('id', calcId).single();

  const items    = extractMaterials(data?.calculation_data || {});
  const existing = data?.fact_materials || {};

  loading.style.display = 'none';
  _donePlanItems = items;

  if (!items.length) { empty.style.display = 'block'; return; }

  rows.style.display = 'block';
  list.innerHTML = '';

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 110px 110px;gap:6px;align-items:center';

    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-size:0.8rem;color:var(--text);font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    nameEl.title = item.name;
    nameEl.textContent = item.name;

    const planEl = document.createElement('div');
    planEl.style.cssText = 'font-size:0.82rem;color:var(--text-muted);text-align:right;font-weight:600';
    planEl.textContent = _fmt(item.plan);

    const factWrap = document.createElement('div');
    const factInput = document.createElement('input');
    factInput.type  = 'number'; factInput.min = '0'; factInput.step = '1';
    factInput.dataset.key = item.key;
    factInput.value = String(existing[item.key] !== undefined ? existing[item.key] : item.plan);
    factInput.style.cssText = 'width:100%;padding:5px 8px;background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.25);border-radius:6px;font-size:0.82rem;font-weight:700;color:#7c3aed;outline:none;text-align:right;font-family:var(--font)';
    factInput.addEventListener('input', updateDoneTotals);
    factWrap.appendChild(factInput);

    row.append(nameEl, planEl, factWrap);
    frag.appendChild(row);
  });
  list.appendChild(frag);
  updateDoneTotals();
}

function updateDoneTotals() {
  let planSum = 0, factSum = 0;
  _donePlanItems.forEach(item => { planSum += item.plan; });
  document.querySelectorAll('#doneMaterialsList input[data-key]').forEach(inp => {
    factSum += parseFloat(inp.value) || 0;
  });
  document.getElementById('donePlanTotal').textContent = _fmt(planSum);
  document.getElementById('doneFactTotal').textContent = _fmt(factSum);
  const delta = factSum - planSum;
  const deltaEl = document.getElementById('doneDelta');
  if (delta === 0)      { deltaEl.textContent = 'Факт совпал с планом'; deltaEl.style.color = 'var(--text-muted)'; }
  else if (delta > 0)   { deltaEl.textContent = `Перерасход: +${_fmt(delta)}`; deltaEl.style.color = 'var(--danger)'; }
  else                  { deltaEl.textContent = `Экономия: ${_fmt(Math.abs(delta))}`; deltaEl.style.color = 'var(--success)'; }
}

function openModalDone(calcId, carName) {
  injectDone();
  _doneCalcId = calcId;

  document.getElementById('doneCarName').textContent = carName;
  document.getElementById('doneCheckedBy').value = '';
  document.getElementById('doneRemarks').value = '';
  document.getElementById('doneNotes').value = '';
  loadDoneMaterials(calcId);

  document.getElementById('modalDone').classList.add('active');
}

async function saveDone() {
  const btn = document.getElementById('btnDoneSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';

  try {
    // Gather fact_materials from inputs
    const factMaterials = {};
    document.querySelectorAll('#doneMaterialsList input[data-key]').forEach(inp => {
      factMaterials[inp.dataset.key] = parseFloat(inp.value) || 0;
    });

    // Gather check data
    const checkedBy = document.getElementById('doneCheckedBy').value.trim();
    const remarks   = document.getElementById('doneRemarks').value.trim();
    const notes     = document.getElementById('doneNotes').value.trim();

    // Build extra object
    const extra = {};
    if (Object.keys(factMaterials).length > 0) extra.fact_materials = factMaterials;

    // Build history comment with check info
    const parts = [];
    if (checkedBy) parts.push('Проверил: ' + checkedBy);
    if (remarks)   parts.push('Замечания: ' + remarks);
    if (notes)     parts.push(notes);
    if (parts.length) extra._historyComment = parts.join('; ');

    // CRITICAL: Use status 'done' NOT 'waiting'
    const ok = await window._updateStatus(_doneCalcId, 'done', extra);
    if (ok) {
      document.getElementById('modalDone').classList.remove('active');
      window._showToast('success', 'Работа завершена');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// -- Модал выдачи (deliver) ----------------------------------------

let _deliverCalcId = null;

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'Наличные' },
  { value: 'card',     label: 'Карта / перевод' },
  { value: 'transfer', label: 'Безналичный р/с' },
  { value: 'deferred', label: 'Отложенная оплата (долг)' },
  { value: 'mixed',    label: 'Смешанная оплата' },
];

const DELIVER_HTML = `
<div class="modal" id="modalDeliver">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Выдать клиенту</div>
    <div class="modal-car" id="deliverCarName"></div>

    <div class="form-group">
      <label>Итоговая сумма</label>
      <input type="number" id="deliverPrice" placeholder="Итого к оплате" min="0">
    </div>

    <div class="form-group">
      <label>Форма оплаты</label>
      <select id="deliverPayment"></select>
    </div>

    <div id="deliverVatBlock" style="display:none">
      <div class="form-group">
        <label>НДС %</label>
        <input type="number" id="deliverVat" placeholder="напр. 20" min="0" max="100" step="0.01">
      </div>
    </div>

    <div id="deliverMixedBlock" style="display:none">
      <div style="font-size:0.69rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);margin-bottom:8px;margin-top:4px">Разбивка по методам</div>
      <div class="form-group">
        <label>Наличные</label>
        <input type="number" id="mixedCash" placeholder="0" min="0" class="mixed-input">
      </div>
      <div class="form-group">
        <label>Карта / перевод</label>
        <input type="number" id="mixedCard" placeholder="0" min="0" class="mixed-input">
      </div>
      <div class="form-group">
        <label>Безналичный р/с</label>
        <input type="number" id="mixedTransfer" placeholder="0" min="0" class="mixed-input">
      </div>
      <div class="form-group">
        <label>Долг</label>
        <input type="number" id="mixedDeferred" placeholder="0" min="0" class="mixed-input">
      </div>
      <div id="mixedTotal" style="font-size:0.82rem;font-weight:700;color:var(--text);text-align:right;margin-top:4px"></div>
    </div>

    <div class="form-group">
      <label>Кто выдал</label>
      <input type="text" id="deliverBy" placeholder="ФИО">
    </div>

    <div class="form-group">
      <label>Комментарий</label>
      <textarea id="deliverNote" rows="2" placeholder="Пожелания, замечания..."></textarea>
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnDeliverCancel">Отмена</button>
      <button class="btn" style="background:var(--success);color:#fff" id="btnDeliverSave">Выдать</button>
    </div>
  </div>
</div>
`;

function updateMixedTotal() {
  const cash     = parseFloat(document.getElementById('mixedCash').value) || 0;
  const card     = parseFloat(document.getElementById('mixedCard').value) || 0;
  const transfer = parseFloat(document.getElementById('mixedTransfer').value) || 0;
  const deferred = parseFloat(document.getElementById('mixedDeferred').value) || 0;
  const total    = cash + card + transfer + deferred;
  document.getElementById('mixedTotal').textContent = 'Итого: ' + _fmt(total);
}

function injectDeliver() {
  if (document.getElementById('modalDeliver')) return;
  document.body.insertAdjacentHTML('beforeend', DELIVER_HTML);

  // Populate payment method select dynamically from PAYMENT_METHODS
  const sel = document.getElementById('deliverPayment');
  PAYMENT_METHODS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    sel.appendChild(opt);
  });

  // Bind payment method change handler to show/hide VAT and mixed blocks
  sel.addEventListener('change', function () {
    const val = this.value;
    document.getElementById('deliverVatBlock').style.display   = val === 'transfer' ? 'block' : 'none';
    document.getElementById('deliverMixedBlock').style.display = val === 'mixed'    ? 'block' : 'none';
  });

  // Bind mixed-input change handlers to update mixedTotal
  document.querySelectorAll('.mixed-input').forEach(inp => {
    inp.addEventListener('input', updateMixedTotal);
  });

  document.getElementById('btnDeliverCancel').addEventListener('click', () => {
    document.getElementById('modalDeliver').classList.remove('active');
  });
  document.getElementById('btnDeliverSave').addEventListener('click', saveDeliver);
  document.getElementById('modalDeliver').addEventListener('click', e => {
    if (e.target === document.getElementById('modalDeliver')) {
      document.getElementById('modalDeliver').classList.remove('active');
    }
  });
}

function gatherDeliverForm() {
  const method      = document.getElementById('deliverPayment').value;
  const totalAmount = parseFloat(document.getElementById('deliverPrice').value) || 0;
  const vatPercent  = method === 'transfer' ? (parseFloat(document.getElementById('deliverVat').value) || null) : null;
  const notes       = document.getElementById('deliverNote').value.trim() || null;
  const deliveredBy = document.getElementById('deliverBy').value.trim() || null;

  let paymentBreakdown = {};
  if (method === 'mixed') {
    paymentBreakdown = {
      cash:     parseFloat(document.getElementById('mixedCash').value) || 0,
      card:     parseFloat(document.getElementById('mixedCard').value) || 0,
      transfer: parseFloat(document.getElementById('mixedTransfer').value) || 0,
      deferred: parseFloat(document.getElementById('mixedDeferred').value) || 0,
    };
  } else {
    paymentBreakdown = { [method]: totalAmount };
  }

  return { payment_method: method, payment_breakdown: paymentBreakdown, total_amount: totalAmount, vat_percent: vatPercent, notes, delivered_by: deliveredBy };
}

function openModalDeliver(calcId, carName, price) {
  injectDeliver();
  _deliverCalcId = calcId;

  document.getElementById('deliverCarName').textContent = carName;
  document.getElementById('deliverPrice').value = price;
  document.getElementById('deliverPayment').selectedIndex = 0;
  document.getElementById('deliverVatBlock').style.display   = 'none';
  document.getElementById('deliverMixedBlock').style.display = 'none';
  document.getElementById('mixedCash').value     = '';
  document.getElementById('mixedCard').value     = '';
  document.getElementById('mixedTransfer').value = '';
  document.getElementById('mixedDeferred').value = '';
  document.getElementById('mixedTotal').textContent = '';
  document.getElementById('deliverBy').value   = '';
  document.getElementById('deliverNote').value = '';

  document.getElementById('modalDeliver').classList.add('active');
}

async function saveDeliver() {
  const btn = document.getElementById('btnDeliverSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';

  try {
    const payload = gatherDeliverForm();

    // Step 1: INSERT delivery_acts
    const { error: insertErr } = await window._sb
      .from('delivery_acts')
      .insert({
        calc_id:  _deliverCalcId,
        studio_id: window._boardCtx.studioId,
        ...payload,
      });

    if (insertErr) {
      console.error('[pipeline] delivery insert:', insertErr);
      window._showToast('error', 'Ошибка сохранения акта выдачи');
      return;
    }

    // Step 2: CRITICAL — mirror total to final_price and patch status to 'delivered'
    const ok = await window._updateStatus(_deliverCalcId, 'delivered', { final_price: payload.total_amount, delivery_note: payload.notes });
    if (ok) {
      document.getElementById('modalDeliver').classList.remove('active');
      window._showToast('success', 'Автомобиль выдан');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// -- Модал назначения (assign / in_progress) ──────────────────────

let _assignCalcId = null;

const ASSIGN_HTML = `
<div class="modal" id="modalAssign">
  <div class="modal-content" style="max-width:540px;max-height:90vh;overflow-y:auto">
    <div class="modal-title">Взять в работу</div>
    <div class="modal-car" id="assignCarName"></div>
    <div class="form-group">
      <label>Ответственный мастер</label>
      <input type="text" id="assignMaster" placeholder="ФИО мастера">
    </div>
    <div class="form-group">
      <label>Комментарий</label>
      <textarea id="assignComment" rows="2" placeholder="Примечания к работе..."></textarea>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="btnAssignCancel">Отмена</button>
      <button class="btn btn-primary" id="btnAssignSave">Взять в работу</button>
    </div>
  </div>
</div>
`;

function injectAssign() {
  if (document.getElementById('modalAssign')) return;
  document.body.insertAdjacentHTML('beforeend', ASSIGN_HTML);
  document.getElementById('btnAssignCancel').addEventListener('click', () => window._closeModal('modalAssign'));
  document.getElementById('btnAssignSave').addEventListener('click', saveAssign);
  document.getElementById('modalAssign').addEventListener('click', e => {
    if (e.target.id === 'modalAssign') window._closeModal('modalAssign');
  });
}

function openModalAssign(calcId, carName) {
  injectAssign();
  _assignCalcId = calcId;
  document.getElementById('assignCarName').textContent = carName || '';
  document.getElementById('assignMaster').value = '';
  document.getElementById('assignComment').value = '';
  document.getElementById('modalAssign').classList.add('active');
}

async function saveAssign() {
  const btn = document.getElementById('btnAssignSave');
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Сохранение...';
  try {
    const master = document.getElementById('assignMaster').value.trim();
    const comment = document.getElementById('assignComment').value.trim();
    if (!master) {
      window._showToast('warning', 'Укажите ответственного мастера');
      return;
    }
    const parts = ['Мастер: ' + master];
    if (comment) parts.push(comment);
    const extra = { _historyComment: parts.join('; '), assigned_master: master };
    const ok = await window._updateStatus(_assignCalcId, 'in_progress', extra);
    if (ok) {
      window._closeModal('modalAssign');
      window._showToast('success', 'Взято в работу');
      window._loadBoard();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

// ── Публичный API ─────────────────────────────────────────────────
window.PipelineForms = { openModalAccept, openModalOutsource, openModalReturn, openModalCancel, openModalDone, openModalDeliver, openModalAssign };
})();

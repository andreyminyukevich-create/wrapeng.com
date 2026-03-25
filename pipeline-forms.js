// pipeline-forms.js
// Модальные формы воронки цеха — приём, аутсорсинг, проверка, выдача, отмена
// Phase 1: acceptance modal (scheduled -> accepted)
(function () {
'use strict';

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

// ── Публичный API ─────────────────────────────────────────────────
window.PipelineForms = { openModalAccept, openModalOutsource, openModalReturn, openModalCancel };
})();

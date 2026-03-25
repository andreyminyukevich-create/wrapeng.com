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

// ── Публичный API ─────────────────────────────────────────────────
window.PipelineForms = { openModalAccept };
})();

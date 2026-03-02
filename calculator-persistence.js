/**
 * calculator-ui.js
 * UI-логика: инициализация, биндинги, форматирование
 * Зависит от: calculator-data.js, calculator-engine.js, calculator-render.js,
 *             calculator-persistence.js, calculator-pdf.js
 */

// ── Аккордеоны (event delegation) ────────────────────────────────
document.addEventListener('click', function(e) {
  const h2 = e.target.closest('h2.collapsible');
  if (!h2) return;
  const card    = h2.closest('.card');
  if (!card) return;
  const content = card.querySelector('.card-content');
  if (!content) return;
  h2.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
});

// ── Тема ──────────────────────────────────────────────────────────
function initTheme() {
  document.body.setAttribute('data-theme', 'light');
  qa('.toggle-btn').forEach(b () => {
    b.addEventListener('click', () => {
      const r = b.querySelector('input[type=radio]');
      if (r) {
        r.checked = true;
        qa('.toggle-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderAll();
      }
    });
  });
}

// ── Скидки ───────────────────────────────────────────────────────
function initDiscounts() {
  qa('.discount-btn').forEach(b () => {
    b.addEventListener('click', () => {
      disc = parseInt(b.dataset.discount) || 0;
      qa('.discount-btn').forEach(x => x.classList.toggle('active', parseInt(x.dataset.discount) === disc));
      q('#customDiscount').value = '';
      renderAll();
    });
  });

  q('#customDiscount')?.addEventListener('input', e () => {
    disc = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    qa('.discount-btn').forEach(b => b.classList.remove('active'));
    renderAll();
  });
}

// ── Бренды / Модели ───────────────────────────────────────────────
function fillBrands() {
  const s = q('#brand');
  if (s.options.length > 2) {
    const yearInput = q('#year');
    if (yearInput && !yearInput.value) yearInput.value = '2026';
    return;
  }
  s.innerHTML = '<option value="">Выберите бренд</option><option value="manual">Ввести вручную</option>';
  Object.keys(carDB).sort().forEach(b () => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    s.appendChild(o);
  });
  const yearInput = q('#year');
  if (yearInput && !yearInput.value) yearInput.value = '2026';
}

function fillModels(brandValue) {
  const m  = q('#model');
  const bm = q('#brandManual');
  m.innerHTML = '<option value="">Выберите модель</option><option value="manual">Ввести вручную</option>';

  if (brandValue && carDB[brandValue]) {
    bm.classList.add('invis');
    carDB[brandValue].forEach(md () => {
      const o = document.createElement('option');
      o.value = md; o.textContent = md;
      m.appendChild(o);
    });
  } else if (brandValue === 'manual') {
    bm.classList.remove('invis');
    m.innerHTML = '<option value="manual">Ввести вручную</option>';
    q('#modelManual')?.classList.remove('invis');
  }
}

function onBrandChange() {
  fillModels(q('#brand').value);
  renderAll();
}

function onModelChange() {
  const m = q('#model').value;
  q('#modelManual')?.classList.toggle('invis', m !== 'manual');
  renderAll();
}

// ── Форматирование ────────────────────────────────────────────────
function formatYearInput(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 4) val = val.slice(0, 4);
  input.value = val;
}

function formatNumberInput(input) {
  const val = parseFloat(input.value);
  if (!isNaN(val) && val >= 0) input.value = val.toFixed(2);
}

function setDefaultMarkups() {
  ['#pkgMarkup','#impactMarkup','#armMarkup','#wrapMarkup','#detMarkup','#glMarkup','#miscMarkup'].forEach(id () => {
    const field = q(id);
    if (field) field.value = 40;
  });
}

// ── Состояние страницы ────────────────────────────────────────────
function initPageState() {
  const isTelegram = window.TelegramWebviewProxy !== undefined || navigator.userAgent.includes('Telegram');
  if (isTelegram) {
    const warning = q('#telegramWarning');
    if (warning) warning.style.display = 'block';
  }
}

// ── Зоны инициализации ────────────────────────────────────────────
function initUI() {
  initTheme();

  initDiscounts();

}

function initDataSources() {
  fillBrands();

  q('#brand')?.addEventListener('change', onBrandChange);
  q('#model')?.addEventListener('change', onModelChange);
}

function initRender() {
  renderServiceList('#armContent',  armServices,    'arm');
  renderWrapContent();

  renderPartialLists();

  renderServiceList('#detContent',  detailServices, 'det');
  renderServiceList('#glContent',   glassServices,  'gl');
  renderServiceList('#miscContent', miscServices,   'misc');
  initServiceToggles();

  setDefaultMarkups();

  initChart();

  renderAll();
}

function initBindings() {
  // Добавление строк
  const addRowBindings = [
    { sel: '#btnAddPkgCost',    action: () => addCostRow('pkg') },
    { sel: '#btnAddImpactCost', action: () => addCostRow('impact') },
    { sel: '#btnAddArm',        action: () => { addDynRow('#armDyn',  'arm');  initServiceToggles(); } },
    { sel: '#btnAddArmCost',    action: () => addCostRow('arm') },
    { sel: '#btnAddWrap',       action: () => { addDynRow('#wrapDyn', 'wrap'); initServiceToggles(); } },
    { sel: '#btnAddWrapCost',   action: () => addCostRow('wrap') },
    { sel: '#btnAddDet',        action: () => { addDynRow('#detDyn',  'det');  initServiceToggles(); } },
    { sel: '#btnAddDetCost',    action: () => addCostRow('det') },
    { sel: '#btnAddGl',         action: () => { addDynRow('#glDyn',   'gl');   initServiceToggles(); } },
    { sel: '#btnAddGlCost',     action: () => addCostRow('gl') },
    { sel: '#btnAddMisc',       action: () => { addDynRow('#miscDyn', 'misc'); initServiceToggles(); } },
    { sel: '#btnAddMiscCost',   action: () => addCostRow('misc') },
  ];
  addRowBindings.forEach(({ sel, action }) => q(sel)?.addEventListener('click', action));

  // Форма оплаты
  qa('input[name=payMode]').forEach(r => r.addEventListener('change', () => { renderAll(); scheduleSave(); }));

  // Управляющие кнопки
  q('#btnSaveCalc')?.addEventListener('click', async () => {
    const btn = q('#btnSaveCalc');
    const orig = btn?.textContent;
    if (btn) { btn.textContent = '⏳ Сохранение...'; btn.disabled = true; }
    await saveCalculation();

    if (btn) { btn.textContent = orig; btn.disabled = false; }
  });

  // "Новый расчёт" — сохраняет текущий и сбрасывает форму
  q('#btnReset')?.addEventListener('click', async () => {
    const btn = q('#btnReset');
    if (!confirm('Сохранить текущий расчёт и начать новый?')) return;
    if (btn) { btn.textContent = '⏳ Сохраняем...'; btn.disabled = true; }
    await saveCalculation();

    // Сбрасываем ID чтобы следующий расчёт создался новым
    if (typeof currentCalculationId !== 'undefined') {
      try { window._calcNewMode = true; } catch(e) {}
    }
    location.href = location.pathname; // перезагрузка без ?load=
  });

  // Экспорт PDF — только скачать КП
  q('#btnDownloadKP')?.addEventListener('click', () => {
    prepKP();

    setTimeout(() => exportPDF('#pdfKP', 'Коммерческое_предложение.pdf'), 100);
  });
  q('#btnExportExecutors')?.addEventListener('click', () => {
    prepExecutors();

    setTimeout(() => exportPDF('#pdfExecutors', 'Список_исполнителей.pdf'), 100);
  });
  q('#btnExportExecutorsWithSalary')?.addEventListener('click', () => {
    prepExecutorsWithSalary();

    setTimeout(() => exportPDF('#pdfExecutorsWithSalary', 'Список_исполнителей_ЗП.pdf'), 100);
  });

  // Chips (наценки)
  qa('.chip').forEach(ch () => {
    ch.addEventListener('click', () => {
      const sel    = ch.getAttribute('data-markup-target');
      const ppfIdx = ch.getAttribute('data-ppf-markup');
      const pvcIdx = ch.getAttribute('data-pvc-markup');
      if (sel) {
        const tgt = q(sel);
        if (tgt) { tgt.value = ch.textContent.trim(); renderAll(); }
      } else if (ppfIdx !== null) {
        const inp = ch.closest('.service-item')?.querySelector('.ppf-part-markup');
        if (inp) { inp.value = ch.textContent.trim(); renderAll(); }
      } else if (pvcIdx !== null) {
        const inp = ch.closest('.service-item')?.querySelector('.pvc-part-markup');
        if (inp) { inp.value = ch.textContent.trim(); renderAll(); }
      }
    });
  });

  // Глобальные input-события
  document.addEventListener('input', e () => {
    if (e.target.id === 'year') { formatYearInput(e.target); renderAll(); scheduleSave(); return; }
    if (e.target.id && e.target.id.includes('salary')) e.target.dataset.manuallySet = 'true';
    if (e.target.matches('input[type="number"]')) {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val < 0) e.target.value = '';
    }
    if (e.target.matches('input, select')) { renderAll(); scheduleSave(); }
  });

  document.addEventListener('blur', e () => {
    if (e.target.matches('input[type="number"]') && e.target.value !== '') {
      formatNumberInput(e.target); renderAll(); scheduleSave();

    }
  }, true);
}

async function initAuthAndAccess() {
  return await checkAuth();

}

// ── Точка входа ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const hasAccess = await initAuthAndAccess;
  if (!hasAccess) return;

  initPageState();

  initUI();

  initDataSources();

  initRender();

  initBindings();

  await loadCalculationFromUrl();

});

// ── Глобальный экспорт для inline handlers ────────────────────────
window.fillModels    = fillModels;
window.onBrandChange = onBrandChange;
window.onModelChange = onModelChange;
window.renderAll = renderAll;

// ── Брендинг КП ─────────────────────────────────────────────────────
// isTrial      — true = пробный/нет подписки → Keep1R-брендинг
// studioSettings — объект settings из таблицы studios
// studioName   — studios.name (основное название студии)
window.applyKPBranding = function(isTrial, studioSettings = {}, studioName = '') {
  const headerEl = document.getElementById('kpBrandHeader');
  const footerEl = document.getElementById('kpBrandFooter');
  if (!headerEl) return;

  // Для триала — ничего не меняем, Keep1R-брендинг остаётся из HTML
  if (isTrial) return;

  // Для платной подписки — берём данные студии
  const phone   = studioSettings.kp_phone   || studioSettings.phone   || '';
  const website = studioSettings.kp_website || studioSettings.website || '';
  // Название: сначала kp_name из настроек, потом основное название студии
  const name    = studioSettings.kp_name   || studioName || '';
  const logo    = studioSettings.kp_logo   || null;

  if (logo) {
    // ── С логотипом ──
    headerEl.innerHTML = `
      <div style="max-height:60px;max-width:180px;overflow:hidden">
        <img src="${logo}" alt="logo"
          style="max-height:60px;max-width:180px;object-fit:contain;display:block">
      </div>
      <div style="text-align:right;font-size:8px;color:#475569;line-height:1.9">
        ${name    ? `<div style="font-weight:800;font-size:9px;color:#0f172a">${esc(name)}</div>` : ''}
        ${phone   ? `<div>📞 ${esc(phone)}</div>`   : ''}
        ${website ? `<div>🌐 ${esc(website)}</div>` : ''}
      </div>
    `;
  } else if (name) {
    // ── Без логотипа, но есть название ──
    headerEl.innerHTML = `
      <div style="font-size:22px;font-weight:900;letter-spacing:-1px;color:#0f172a">${esc(name)}</div>
      <div style="text-align:right;font-size:8px;color:#475569;line-height:1.9">
        ${phone   ? `<div>📞 ${esc(phone)}</div>`   : ''}
        ${website ? `<div>🌐 ${esc(website)}</div>` : ''}
      </div>
    `;
  } else {
    // ── Совсем ничего не настроено — ставим заглушку ──
    headerEl.innerHTML = `
      <div style="font-size:14px;font-weight:700;color:#94a3b8;font-style:italic">
        Настройте брендинг в разделе «Настройки»
      </div>
    `;
  }

  // Футер для платной студии — убираем Keep1R, ставим контакты студии
  if (footerEl) {
    footerEl.innerHTML = `
      <div style="font-size:7.5px;color:#94a3b8;display:flex;justify-content:space-between;align-items:center;width:100%">
        <span style="color:#cbd5e1">Создано в Keep1R CRM</span>
        <span style="display:flex;gap:14px;white-space:nowrap">
          ${name    ? `<span style="font-weight:700;color:#475569">${esc(name)}</span>` : ''}
          ${phone   ? `<span>${esc(phone)}</span>`   : ''}
          ${website ? `<span>${esc(website)}</span>` : ''}
        </span>
      </div>
    `;
  }
};

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

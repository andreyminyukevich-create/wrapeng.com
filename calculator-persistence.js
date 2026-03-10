/**
 * calculator-persistence.js
 * Аутентификация, автосохранение, загрузка расчёта из URL.
 * Зависит от: calculator-engine.js (collectAll, markups, taxCoef, r100)
 *             calculator-ui.js (collectFormData, q, qa, addDynRow, addCostRow, initServiceToggles)
 *
 * ИСПРАВЛЕНО v1.1:
 *  - Paywall реально блокирует калькулятор (checkAccess вызывается из checkAuth)
 *  - collectFormData сохраняет все чекбоксы услуг, PPF/PVC поля, wrap поля
 *  - loadCalculationFromUrl восстанавливает чекбоксы и wrap-поля
 *  - Используется window._crmSb как приоритетный Supabase-клиент
 */

// ── Supabase клиент: берём единый экземпляр, созданный в supabase.js через nav.js ──
// Fallback на локальный sb (calculator.html) если _crmSb ещё не готов.
function getSb() {
  return window._crmSb ?? window.sb ?? null;
}

// ── Авторизация через единый getStudioContext ────────────────────
// Вся логика подписки, ролей и кэша — в studio-context.js.
// calculator-persistence.js только читает результат.
async function checkAuth() {
  // Если studio-context.js не подключён (dev/preview) — пропускаем
  if (typeof window.getStudioContext !== 'function') {
    console.warn('[persistence] getStudioContext not found — skipping auth check');
    return true;
  }

  try {
    const ctx = await window.getStudioContext();

    // Нет сессии — редирект на логин
    if (!ctx) {
      window.location.href = 'welcome.html';
      return false;
    }

    // Заполняем глобальные переменные калькулятора
    currentUser = ctx.user;
    currentProfile = {
      id:            ctx.user.id,
      studio_name:   ctx.studio?.name                     || 'Студия',
      studio_id:     ctx.studioId                         || null,
      role:          ctx.role                             || 'staff',
      is_paid:       ctx.hasAccess,
      trial_ends_at: ctx.studio?.subscription_expires_at  || null,
      settings:      ctx.studio?.settings                 || {},
    };

    displayUserInfo();

    // ── Paywall ─────────────────────────────────────────────────
    if (!ctx.hasAccess) {
      const trialExpired = ctx.subscriptionStatus === 'expired';
      if (typeof window.showPaywall === 'function') {
        window.showPaywall(trialExpired);
      } else {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;' +
          'font-family:system-ui;flex-direction:column;gap:16px;">' +
          '<div style="font-size:2rem">🔒</div>' +
          '<div style="font-size:1.1rem;font-weight:700">Требуется подписка</div>' +
          '<a href="https://t.me/keeper_wrap" style="color:#2563eb">Написать для оформления →</a>' +
          '</div>';
      }
      return false;
    }

    return true;
  } catch (e) {
    console.error('[persistence] checkAuth error:', e);
    return true; // при сетевой ошибке не блокируем
  }
}

// ── Показать информацию о студии ─────────────────────────────────
function displayUserInfo() {
  const userInfo = document.getElementById('user-info');
  if (!userInfo || !currentProfile) return;

  let statusText = '';
  if (currentProfile.is_paid) {
    statusText = '✅ Оплачен';
  } else if (currentProfile.trial_ends_at) {
    const now   = new Date();
    const end   = new Date(currentProfile.trial_ends_at);
    const hours = Math.floor((end - now) / (1000 * 60 * 60));
    statusText  = hours > 0 ? `🕐 Триал: ${hours}ч` : '⚠️ Истёк';
  }

  userInfo.innerHTML =
    `<div>${currentProfile.studio_name || 'Студия'}</div>` +
    `<div style="font-size:0.75rem">${statusText}</div>`;
  userInfo.style.display = 'block';
}

function goToDashboard() {
  window.location.href = 'dashboard.html';
}

// ═══════════════════════════════════════════
// СБОР ДАННЫХ ФОРМЫ
// ═══════════════════════════════════════════

function collectFormData() {
  const data = {
    // Автомобиль
    car: {
      brand: q('#brandManual')?.classList.contains('invis') ? q('#brand')?.value : q('#brandManual')?.value,
      model: q('#modelManual')?.classList.contains('invis') ? q('#model')?.value : q('#modelManual')?.value,
      year:  q('#year')?.value,
    },

    // Полная защита вкруг
    package: {
      wrapMat: q('#pkgWrapMat')?.value,
      wrapMot: q('#pkgWrapMot')?.value,
      prepMat: q('#pkgPrepMat')?.value,
      prepMot: q('#pkgPrepMot')?.value,
      armMat:  q('#pkgArmMat')?.value,
      armMot:  q('#pkgArmMot')?.value,
      markup:  q('#pkgMarkup')?.value,
      costs:   [],
    },

    // Защита ударной части
    impact: {
      wrapMat: q('#impactWrapMat')?.value,
      wrapMot: q('#impactWrapMot')?.value,
      prepMat: q('#impactPrepMat')?.value,
      prepMot: q('#impactPrepMot')?.value,
      armMat:  q('#impactArmMat')?.value,
      armMot:  q('#impactArmMot')?.value,
      markup:  q('#impactMarkup')?.value,
      costs:   [],
    },

    // PPF / PVC оклейка — чекбоксы и поля
    wrap: {
      ppfClear:        q('#ppfClearChk')?.checked        || false,
      ppfClearComplex: q('#ppfClearComplex')?.checked    || false,
      ppfClearM:       q('#ppfClearM')?.value            || '',
      ppfClearPrice:   q('#ppfClearPrice')?.value        || '',
      ppfClearMot:     q('#ppfClearMot')?.value          || '',

      ppfColor:        q('#ppfColorChk')?.checked        || false,
      ppfColorComplex: q('#ppfColorComplex')?.checked    || false,
      ppfColorM:       q('#ppfColorM')?.value            || '',
      ppfColorPrice:   q('#ppfColorPrice')?.value        || '',
      ppfColorMot:     q('#ppfColorMot')?.value          || '',

      ppfMat:          q('#ppfMatChk')?.checked          || false,
      ppfMatComplex:   q('#ppfMatComplex')?.checked      || false,
      ppfMatM:         q('#ppfMatM')?.value              || '',
      ppfMatPrice:     q('#ppfMatPrice')?.value          || '',
      ppfMatMot:       q('#ppfMatMot')?.value            || '',

      ppfPart:         q('#ppfPartChk')?.checked         || false,

      pvcFull:         q('#pvcFullChk')?.checked         || false,
      pvcFullComplex:  q('#pvcFullComplex')?.checked     || false,
      pvcFullM:        q('#pvcFullM')?.value             || '',
      pvcFullPrice:    q('#pvcFullPrice')?.value         || '',
      pvcFullMot:      q('#pvcFullMot')?.value           || '',

      pvcPart:         q('#pvcPartChk')?.checked         || false,

      markup: q('#wrapMarkup')?.value,
      costs:  [],

      // Частичные элементы PPF — сохраняем по имени
      ppfPartItems: [],
      pvcPartItems: [],
    },

    // Форма оплаты
    paymentMode: q('input[name=payMode]:checked')?.value || 'cash',

    // Скидка
    discount: q('#customDiscount')?.value || '0',

    // Наценки
    markups: {
      pkg:    q('#pkgMarkup')?.value,
      impact: q('#impactMarkup')?.value,
      arm:    q('#armMarkup')?.value,
      wrap:   q('#wrapMarkup')?.value,
      det:    q('#detMarkup')?.value,
      gl:     q('#glMarkup')?.value,
      misc:   q('#miscMarkup')?.value,
    },

    // Состояние чекбоксов фиксированных услуг
    serviceChecks: {
      arm:  [],
      det:  [],
      gl:   [],
      misc: [],
    },
  };

  // ── Доп. затраты пакетов ─────────────────────────────────────
  qa('#pkgCostsContent .cost-row').forEach(row => {
    data.package.costs.push({
      name:  row.querySelector('.pkg-cost-name')?.value,
      value: row.querySelector('.pkg-cost-val')?.value,
    });
  });
  qa('#impactCostsContent .cost-row').forEach(row => {
    data.impact.costs.push({
      name:  row.querySelector('.impact-cost-name')?.value,
      value: row.querySelector('.impact-cost-val')?.value,
    });
  });
  qa('#wrapCostsContent .cost-row').forEach(row => {
    data.wrap.costs.push({
      name:  row.querySelector('.wrap-cost-name')?.value,
      value: row.querySelector('.wrap-cost-val')?.value,
    });
  });

  // ── Частичные PPF-элементы ───────────────────────────────────
  qa('.ppf-part-chk').forEach(chk => {
    const item  = chk.closest('.service-item');
    const label = item?.querySelector('.service-header label')?.textContent?.trim();
    if (!label) return;
    data.wrap.ppfPartItems.push({
      name:    label,
      checked: chk.checked,
      complex: item.querySelector('.ppf-part-complex')?.checked || false,
      m:       item.querySelector('.ppf-part-m')?.value       || '',
      price:   item.querySelector('.ppf-part-price')?.value   || '',
      mot:     item.querySelector('.ppf-part-mot')?.value     || '',
      markup:  item.querySelector('.ppf-part-markup')?.value  || '',
    });
  });

  // ── Частичные PVC-элементы ───────────────────────────────────
  qa('.pvc-part-chk').forEach(chk => {
    const item  = chk.closest('.service-item');
    const label = item?.querySelector('.service-header label')?.textContent?.trim();
    if (!label) return;
    data.wrap.pvcPartItems.push({
      name:    label,
      checked: chk.checked,
      complex: item.querySelector('.pvc-part-complex')?.checked || false,
      m:       item.querySelector('.pvc-part-m')?.value       || '',
      price:   item.querySelector('.pvc-part-price')?.value   || '',
      mot:     item.querySelector('.pvc-part-mot')?.value     || '',
      markup:  item.querySelector('.pvc-part-markup')?.value  || '',
    });
  });

  // ── Фиксированные услуги (arm / det / gl / misc) ─────────────
  ['arm', 'det', 'gl', 'misc'].forEach(tp => {
    qa(`.${tp}-chk`).forEach(chk => {
      const item  = chk.closest('.service-item');
      const label = item?.querySelector('.service-header label')?.textContent?.trim();
      if (!label) return;
      data.serviceChecks[tp].push({
        name:    label,
        checked: chk.checked,
        complex: item.querySelector(`.${tp}-complex`)?.checked || false,
        mat:     item.querySelector(`.${tp}-mat`)?.value      || '',
        mot:     item.querySelector(`.${tp}-mot`)?.value      || '',
      });
    });
  });

  // ── Детали услуг из collectAll (для assign-work) ─────────────
  try {
    const sums = collectAll();
    data.services_detail = {
      arm:  sums.arm.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      det:  sums.det.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      gl:   sums.gl.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      ms:   sums.ms.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      wrap: sums.wrap.details.map(d => ({ name: d[0], m: d[1], pr: d[2], mat: d[3], mot: d[4] })),
    };
  } catch (e) { /* collectAll может не быть при первом запуске */ }

  // ── Исполнители ───────────────────────────────────────────────
  data.executors = [];
  qa('#executorsContent .executor-row').forEach(row => {
    const baseId = row.getAttribute('data-exec-id');
    if (!baseId) return;
    const serviceName    = row.querySelector('.executor-row-header')?.textContent?.trim();
    const executorName   = row.querySelector(`#${baseId}name`)?.value    || '';
    const salary         = row.querySelector(`#${baseId}salary`)?.value  || '0';
    const receive        = row.querySelector(`#${baseId}receive`)?.value || '';
    const returnDate     = row.querySelector(`#${baseId}return`)?.value  || '';
    const note           = row.querySelector(`#${baseId}note`)?.value    || '';

    if (executorName || parseFloat(salary) > 0) {
      data.executors.push({ service: serviceName, name: executorName,
        salary: parseFloat(salary) || 0, receive_date: receive, return_date: returnDate, note });
    }

    row.querySelector('.extra-executors')
      ?.querySelectorAll('.extra-executor-row')
      .forEach(extraRow => {
        const eName    = extraRow.querySelector('input[id*="name"]')?.value    || '';
        const eSalary  = extraRow.querySelector('input[id*="salary"]')?.value  || '0';
        const eReceive = extraRow.querySelector('input[id*="receive"]')?.value || '';
        const eReturn  = extraRow.querySelector('input[id*="return"]')?.value  || '';
        const eNote    = extraRow.querySelector('input[id*="note"]')?.value    || '';
        if (eName || parseFloat(eSalary) > 0) {
          data.executors.push({ service: serviceName, name: eName,
            salary: parseFloat(eSalary) || 0, receive_date: eReceive, return_date: eReturn, note: eNote });
        }
      });
  });

  return data;
}

// ═══════════════════════════════════════════
// АВТОСОХРАНЕНИЕ
// ═══════════════════════════════════════════

let saveTimeout    = null;
let lastSavedData  = null;

async function saveCalculation() {
  const sb = getSb();
  if (!sb || !currentUser) { console.log('[persistence] No user — skip save'); return; }

  try {
    const { data: memberData } = await sb
      .from('studio_members')
      .select('studio_id')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .maybeSingle();

    const studioId = memberData?.studio_id;
    const formData = collectFormData();
    const dataStr  = JSON.stringify(formData);

    if (dataStr === lastSavedData) { console.log('[persistence] No changes — skip save'); return; }

    // Итоги для быстрого отображения в списке заказов
    const s    = collectAll();
    const mu   = markups();
    const taxK = taxCoef();

    const sectionTotals = {
      pkg:    s.pkg.mat    + s.pkg.mot,
      impact: s.impact.mat + s.impact.mot,
      arm:    s.arm.mat    + s.arm.mot,
      wrap:   s.wrap.mat   + s.wrap.mot,
      det:    s.det.mat    + s.det.mot,
      gl:     s.gl.mat     + s.gl.mot,
      ms:     s.ms.mat     + s.ms.mot,
    };

    const totalMarkup =
      r100(sectionTotals.pkg    * (mu.pkg    || 0) / 100) +
      r100(sectionTotals.impact * (mu.impact || 0) / 100) +
      r100(sectionTotals.arm    * (mu.arm    || 0) / 100) +
      r100(sectionTotals.wrap   * (mu.wrap   || 0) / 100) +
      r100(sectionTotals.det    * (mu.det    || 0) / 100) +
      r100(sectionTotals.gl     * (mu.gl     || 0) / 100) +
      r100(sectionTotals.ms     * (mu.ms     || 0) / 100);

    const discVal            = parseFloat(q('#customDiscount')?.value) || 0;
    const markupWithDiscount = r100(totalMarkup * (1 - discVal / 100));
    const baseAll            = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
    const afterMarkup        = baseAll + markupWithDiscount;
    const tax                = r100(afterMarkup * taxK);
    const finalTotal         = afterMarkup + tax;

    const car_name = `${formData.car.brand || ''} ${formData.car.model || ''} ${formData.car.year || ''}`.trim();

    const calcData = {
      user_id:          currentUser.id,
      car_name:         car_name || 'Без названия',
      brand:            formData.car.brand  || null,
      model:            formData.car.model  || null,
      year:             formData.car.year   || null,
      total_price:      finalTotal,
      calculation_data: formData,
      status:           'draft',
      updated_at:       new Date().toISOString(),
    };
    if (studioId) calcData.studio_id = studioId;

    let error, savedData;
    if (currentCalculationId) {
      ({ error } = await getSb()
        .from('calculations')
        .update(calcData)
        .eq('id', currentCalculationId));
      console.log('[persistence] Updated:', currentCalculationId);
    } else {
      ({ data: savedData, error } = await getSb()
        .from('calculations')
        .insert(calcData)
        .select()
        .single());
      if (savedData) {
        currentCalculationId = savedData.id;
        console.log('[persistence] Created:', currentCalculationId);
      }
    }

    if (error) {
      console.error('[persistence] Save error:', JSON.stringify(error));
      const btn = q('#btnSaveCalc');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent        = '❌ Ошибка сохранения';
        btn.style.background   = '#ef4444';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 3000);
      }
      return;
    }

    lastSavedData = dataStr;
    console.log('[persistence] ✅ Saved');

    // Индикатор сохранения
    showToast(); // сигнатура calculator.html — без аргументов
    const btn = q('#btnSaveCalc');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent      = '✅ Сохранено';
      btn.style.background = 'linear-gradient(135deg, var(--success), var(--success-dark))';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2000);
    }
  } catch (e) {
    console.error('[persistence] Save exception:', e);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCalculation, 2000);
}

// ═══════════════════════════════════════════
// ЗАГРУЗКА РАСЧЁТА ИЗ URL
// ═══════════════════════════════════════════

async function loadCalculationFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const calcId    = urlParams.get('load');
  if (!calcId) return;

  try {
    console.log('[persistence] Loading calculation:', calcId);

    const { data: calculation, error } = await getSb()
      .from('calculations')
      .select('*')
      .eq('id', calcId)
      .single();

    if (error || !calculation) {
      console.error('[persistence] Failed to load calculation:', error);
      return;
    }

    currentCalculationId = calcId;

    const formData = calculation.calculation_data;
    if (!formData) return;

    // ── Автомобиль ───────────────────────────────────────────────
    if (formData.car) {
      const brandSelect = q('#brand');
      const brandManual = q('#brandManual');
      if (formData.car.brand && brandSelect) {
        brandSelect.value = formData.car.brand;
        if (brandManual) brandManual.value = formData.car.brand;
        fillModels(formData.car.brand);
      }
      setTimeout(() => {
        if (formData.car.model) {
          const ms = q('#model'), mm = q('#modelManual');
          if (ms) ms.value = formData.car.model;
          if (mm) mm.value = formData.car.model;
        }
        if (formData.car.year) {
          const yr = q('#year');
          if (yr) yr.value = formData.car.year;
        }
      }, 150);
    }

    // ── Полная защита вкруг ──────────────────────────────────────
    if (formData.package) {
      _setVal('#pkgWrapMat', formData.package.wrapMat);
      _setVal('#pkgWrapMot', formData.package.wrapMot);
      _setVal('#pkgPrepMat', formData.package.prepMat);
      _setVal('#pkgPrepMot', formData.package.prepMot);
      _setVal('#pkgArmMat',  formData.package.armMat);
      _setVal('#pkgArmMot',  formData.package.armMot);
      _setVal('#pkgMarkup',  formData.package.markup);
      _restoreCostRows('#pkgCostsContent', 'pkg', formData.package.costs);
    }

    // ── Защита ударной части ─────────────────────────────────────
    if (formData.impact) {
      _setVal('#impactWrapMat', formData.impact.wrapMat);
      _setVal('#impactWrapMot', formData.impact.wrapMot);
      _setVal('#impactPrepMat', formData.impact.prepMat);
      _setVal('#impactPrepMot', formData.impact.prepMot);
      _setVal('#impactArmMat',  formData.impact.armMat);
      _setVal('#impactArmMot',  formData.impact.armMot);
      _setVal('#impactMarkup',  formData.impact.markup);
      _restoreCostRows('#impactCostsContent', 'impact', formData.impact.costs);
    }

    // ── PPF / PVC оклейка ────────────────────────────────────────
    if (formData.wrap) {
      const w = formData.wrap;

      _setChk('#ppfClearChk',     w.ppfClear);
      _setChk('#ppfClearComplex', w.ppfClearComplex);
      _setVal('#ppfClearM',       w.ppfClearM);
      _setVal('#ppfClearPrice',   w.ppfClearPrice);
      _setVal('#ppfClearMot',     w.ppfClearMot);

      _setChk('#ppfColorChk',     w.ppfColor);
      _setChk('#ppfColorComplex', w.ppfColorComplex);
      _setVal('#ppfColorM',       w.ppfColorM);
      _setVal('#ppfColorPrice',   w.ppfColorPrice);
      _setVal('#ppfColorMot',     w.ppfColorMot);

      _setChk('#ppfMatChk',       w.ppfMat);
      _setChk('#ppfMatComplex',   w.ppfMatComplex);
      _setVal('#ppfMatM',         w.ppfMatM);
      _setVal('#ppfMatPrice',     w.ppfMatPrice);
      _setVal('#ppfMatMot',       w.ppfMatMot);

      _setChk('#ppfPartChk',      w.ppfPart);

      _setChk('#pvcFullChk',      w.pvcFull);
      _setChk('#pvcFullComplex',  w.pvcFullComplex);
      _setVal('#pvcFullM',        w.pvcFullM);
      _setVal('#pvcFullPrice',    w.pvcFullPrice);
      _setVal('#pvcFullMot',      w.pvcFullMot);

      _setChk('#pvcPartChk',      w.pvcPart);

      _setVal('#wrapMarkup',      w.markup);
      _restoreCostRows('#wrapCostsContent', 'wrap', w.costs);

      // Частичные PPF-элементы
      if (Array.isArray(w.ppfPartItems)) {
        w.ppfPartItems.forEach(saved => {
          qa('.ppf-part-chk').forEach(chk => {
            const item  = chk.closest('.service-item');
            const label = item?.querySelector('.service-header label')?.textContent?.trim();
            if (label !== saved.name) return;
            chk.checked = saved.checked;
            if (item.querySelector('.ppf-part-complex')) item.querySelector('.ppf-part-complex').checked = saved.complex;
            _setValEl(item.querySelector('.ppf-part-m'),      saved.m);
            _setValEl(item.querySelector('.ppf-part-price'),  saved.price);
            _setValEl(item.querySelector('.ppf-part-mot'),    saved.mot);
            _setValEl(item.querySelector('.ppf-part-markup'), saved.markup);
          });
        });
      }

      // Частичные PVC-элементы
      if (Array.isArray(w.pvcPartItems)) {
        w.pvcPartItems.forEach(saved => {
          qa('.pvc-part-chk').forEach(chk => {
            const item  = chk.closest('.service-item');
            const label = item?.querySelector('.service-header label')?.textContent?.trim();
            if (label !== saved.name) return;
            chk.checked = saved.checked;
            if (item.querySelector('.pvc-part-complex')) item.querySelector('.pvc-part-complex').checked = saved.complex;
            _setValEl(item.querySelector('.pvc-part-m'),      saved.m);
            _setValEl(item.querySelector('.pvc-part-price'),  saved.price);
            _setValEl(item.querySelector('.pvc-part-mot'),    saved.mot);
            _setValEl(item.querySelector('.pvc-part-markup'), saved.markup);
          });
        });
      }
    }

    // ── Фиксированные услуги — чекбоксы ─────────────────────────
    if (formData.serviceChecks) {
      ['arm', 'det', 'gl', 'misc'].forEach(tp => {
        const saved = formData.serviceChecks[tp];
        if (!Array.isArray(saved)) return;
        saved.forEach(s => {
          qa(`.${tp}-chk`).forEach(chk => {
            const item  = chk.closest('.service-item');
            const label = item?.querySelector('.service-header label')?.textContent?.trim();
            if (label !== s.name) return;
            chk.checked = s.checked;
            const cx = item.querySelector(`.${tp}-complex`);
            if (cx) cx.checked = s.complex;
            _setValEl(item.querySelector(`.${tp}-mat`), s.mat);
            _setValEl(item.querySelector(`.${tp}-mot`), s.mot);
          });
        });
      });
    }

    // ── Наценки ──────────────────────────────────────────────────
    if (formData.markups) {
      _setVal('#pkgMarkup',    formData.markups.pkg);
      _setVal('#impactMarkup', formData.markups.impact);
      _setVal('#armMarkup',    formData.markups.arm);
      _setVal('#wrapMarkup',   formData.markups.wrap);
      _setVal('#detMarkup',    formData.markups.det);
      _setVal('#glMarkup',     formData.markups.gl);
      _setVal('#miscMarkup',   formData.markups.misc);
    }

    // ── Форма оплаты ─────────────────────────────────────────────
    if (formData.paymentMode) {
      const r = q(`input[name=payMode][value="${formData.paymentMode}"]`);
      if (r) r.checked = true;
    }

    // ── Скидка ───────────────────────────────────────────────────
    if (formData.discount) {
      _setVal('#customDiscount', formData.discount);
    }

    // ── Динамические строки из services_detail ───────────────────
    if (formData.services_detail) {
      [['arm', '#armDyn'], ['det', '#detDyn'], ['gl', '#glDyn'], ['misc', '#miscDyn']].forEach(([key, sel]) => {
        const sdKey = key === 'misc' ? 'ms' : key;
        const items = formData.services_detail[sdKey] || [];
        items.forEach(d => {
          addDynRow(sel, key);
          const rows = qa(sel + ' .service-item');
          const row  = rows[rows.length - 1];
          if (!row) return;
          const nameInput = row.querySelector('input[type=text]');
          if (nameInput) nameInput.value = d.name || '';
          _setValEl(row.querySelector(`.${key}-mat`), d.mat);
          _setValEl(row.querySelector(`.${key}-mot`), d.mot);
        });
      });

      const staticWrapPrefixes = ['PPF прозрачный', 'PPF цветной', 'PPF матовый', 'ПВХ полная'];
      const wrapItems = (formData.services_detail.wrap || [])
        .filter(d => !staticWrapPrefixes.some(p => d.name?.startsWith(p)));
      wrapItems.forEach(d => {
        addDynRow('#wrapDyn', 'wrap');
        const rows = qa('#wrapDyn .service-item');
        const row  = rows[rows.length - 1];
        if (!row) return;
        const nameInput = row.querySelector('input[type=text]');
        if (nameInput) nameInput.value = d.name || '';
        const nums = row.querySelectorAll('input[type=number]');
        if (nums[0]) nums[0].value = d.m   || 0;
        if (nums[1]) nums[1].value = d.pr  || 0;
        if (nums[2]) nums[2].value = d.mot || 0;
      });

      initServiceToggles();
    }

    // Пересчёт после полного восстановления
    setTimeout(() => {
      renderAll();
      console.log('[persistence] ✅ Calculation loaded and rendered');
    }, 400);

  } catch (e) {
    console.error('[persistence] Error loading calculation:', e);
  }
}

// ── Точка входа (вызывается из calculator-ui.js) ─────────────────
async function initAuthAndAccess() {
  return await checkAuth();
}

// ═══════════════════════════════════════════
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════

/** Установить value по селектору если значение не пустое */
function _setVal(selector, value) {
  if (value === undefined || value === null || value === '') return;
  const el = q(selector);
  if (el) el.value = value;
}

/** Установить value на элемент напрямую */
function _setValEl(el, value) {
  if (!el || value === undefined || value === null || value === '') return;
  el.value = value;
}

/** Установить checked по селектору */
function _setChk(selector, checked) {
  const el = q(selector);
  if (el) el.checked = !!checked;
}

/** Восстановить строки доп. затрат */
function _restoreCostRows(containerSelector, prefix, costs) {
  if (!Array.isArray(costs) || costs.length === 0) return;
  costs.forEach(cost => {
    addCostRow(prefix);
    const rows    = qa(`${containerSelector} .cost-row`);
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return;
    const nameInput = lastRow.querySelector(`.${prefix}-cost-name`);
    const valInput  = lastRow.querySelector(`.${prefix}-cost-val`);
    if (nameInput) nameInput.value = cost.name  || '';
    if (valInput)  valInput.value  = cost.value || '';
  });
}

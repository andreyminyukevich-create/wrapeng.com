Object.defineProperty(window, "sb", { get: () => window._crmApi || window._crmSb, configurable: true });
/**
 * calculator-persistence.js
 * Аутентификация, автосохранение, загрузка расчёта из URL.
 * Зависит от: calculator-engine.js (collectAll, markups, taxCoef, r100)
 *             calculator-ui.js (collectFormData, q, qa, addDynRow, addCostRow, initServiceToggles)
 */

async function checkAccess(user) {
  try {
    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
    
    if (error || !profile) {
      console.error('Profile not found:', error);
      return false;
    }

    currentProfile = profile;

    if (profile.is_paid) {
      return true;
    }

    const now = new Date();
    const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    
    if (!trialEnds || trialEnds <= now) {
      return false;
    }

    return true;
  } catch (e) {
    console.error('checkAccess error:', e);
    return false;
  }
}

async function checkAuth() {
  try {
    if (!sb) return true; // Supabase не загружен — пропускаем авторизацию
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      currentUser = session.user;
      // Загружаем профиль студии чтобы сохранение работало
      const { data: member } = await sb
        .from('studio_members')
        .select('studio_id, studios(name, subscription_tier, subscription_expires_at, settings)')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      if (member) {
        currentProfile = {
          id: session.user.id,
          studio_name: member.studios?.name || 'Студия',
          studio_id: member.studio_id,
          is_paid: ['active','trial'].includes(member.studios?.subscription_tier),
          trial_ends_at: member.studios?.subscription_expires_at,
          settings: member.studios?.settings || {},
        };
      } else {
        // Нет студии — разрешаем пользоваться, но без сохранения
        currentProfile = null;
      }
      displayUserInfo();
    }
    return true;
  } catch (e) {
    console.error('Auth check error:', e);
    return true;
  }
}

function displayUserInfo() {
  const userInfo = document.getElementById('user-info');
  
  if (!userInfo || !currentProfile) return;

  let statusText = '';
  if (currentProfile.is_paid) {
    statusText = '✅ Оплачен';
  } else if (currentProfile.trial_ends_at) {
    const now = new Date();
    const end = new Date(currentProfile.trial_ends_at);
    const hours = Math.floor((end - now) / (1000 * 60 * 60));
    statusText = hours > 0 ? `🕐 Триал: ${hours}ч` : '⚠️ Истёк';
  }

  userInfo.innerHTML = `<div>${currentProfile.studio_name || 'Студия'}</div><div style="font-size:0.75rem">${statusText}</div>`;
  userInfo.style.display = 'block';
}

function goToDashboard() {
  window.location.href = 'dashboard.html';
}

// ========================================
// AUTOSAVE FUNCTIONS
// ========================================

let saveTimeout = null;
let lastSavedData = null;

function collectFormData() {
  // Собираем все данные формы
  const data = {
    // Автомобиль
    car: {
      brand: q('#brandManual')?.classList.contains('invis') ? q('#brand')?.value : q('#brandManual')?.value,
      model: q('#modelManual')?.classList.contains('invis') ? q('#model')?.value : q('#modelManual')?.value,
      year: q('#year')?.value
    },
    
    // Полная защита вкруг
    package: {
      wrapMat: q('#pkgWrapMat')?.value,
      wrapMot: q('#pkgWrapMot')?.value,
      prepMat: q('#pkgPrepMat')?.value,
      prepMot: q('#pkgPrepMot')?.value,
      armMat: q('#pkgArmMat')?.value,
      armMot: q('#pkgArmMot')?.value,
      markup: q('#pkgMarkup')?.value,
      costs: []
    },
    
    // Защита ударной части
    impact: {
      wrapMat: q('#impactWrapMat')?.value,
      wrapMot: q('#impactWrapMot')?.value,
      prepMat: q('#impactPrepMat')?.value,
      prepMot: q('#impactPrepMot')?.value,
      armMat: q('#impactArmMat')?.value,
      armMot: q('#impactArmMot')?.value,
      markup: q('#impactMarkup')?.value,
      costs: []
    },
    
    // Форма оплаты
    paymentMode: q('input[name=payMode]:checked')?.value || 'cash',
    
    // Скидка
    discount: q('#customDiscount')?.value || '0',
    
    // Наценки
    markups: {
      arm: q('#armMarkup')?.value,
      wrap: q('#wrapMarkup')?.value,
      det: q('#detMarkup')?.value,
      gl: q('#glMarkup')?.value,
      misc: q('#miscMarkup')?.value
    }
  };
  
  // Собираем доп затраты для пакетов
  qa('#pkgCostsContent .cost-row').forEach(row => {
    data.package.costs.push({
      name: row.querySelector('.pkg-cost-name')?.value,
      value: row.querySelector('.pkg-cost-val')?.value
    });
  });
  
  qa('#impactCostsContent .cost-row').forEach(row => {
    data.impact.costs.push({
      name: row.querySelector('.impact-cost-name')?.value,
      value: row.querySelector('.impact-cost-val')?.value
    });
  });
  
  // Добавляем детали по услугам из collectAll (для assign-work)
  try {
    const sums = collectAll();
    data.services_detail = {
      arm: sums.arm.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      det: sums.det.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      gl:  sums.gl.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      ms:  sums.ms.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      wrap: sums.wrap.details.map(d => ({ name: d[0], mat: d[3], mot: d[4] })),
    };
  } catch(e) { /* collectAll может не быть при загрузке */ }

  // Собираем исполнителей
  data.executors = [];
  qa('#executorsContent .executor-row').forEach(row => {
    const baseId = row.getAttribute('data-exec-id');
    if (!baseId) return;
    
    const serviceName = row.querySelector('.executor-row-header')?.textContent?.trim();
    const executorName = row.querySelector(`#${baseId}name`)?.value || '';
    const salary = row.querySelector(`#${baseId}salary`)?.value || '0';
    const receive = row.querySelector(`#${baseId}receive`)?.value || '';
    const returnDate = row.querySelector(`#${baseId}return`)?.value || '';
    const note = row.querySelector(`#${baseId}note`)?.value || '';
    
    // Основной исполнитель
    if (executorName || parseFloat(salary) > 0) {
      data.executors.push({
        service: serviceName,
        name: executorName,
        salary: parseFloat(salary) || 0,
        receive_date: receive,
        return_date: returnDate,
        note: note
      });
    }
    
    // Дополнительные исполнители
    const extraContainer = row.querySelector('.extra-executors');
    if (extraContainer) {
      extraContainer.querySelectorAll('.extra-executor-row').forEach(extraRow => {
        const extraName = extraRow.querySelector('input[id*="name"]')?.value || '';
        const extraSalary = extraRow.querySelector('input[id*="salary"]')?.value || '0';
        const extraReceive = extraRow.querySelector('input[id*="receive"]')?.value || '';
        const extraReturn = extraRow.querySelector('input[id*="return"]')?.value || '';
        const extraNote = extraRow.querySelector('input[id*="note"]')?.value || '';
        
        if (extraName || parseFloat(extraSalary) > 0) {
          data.executors.push({
            service: serviceName,
            name: extraName,
            salary: parseFloat(extraSalary) || 0,
            receive_date: extraReceive,
            return_date: extraReturn,
            note: extraNote
          });
        }
      });
    }
  });
  
  return data;
}

async function saveCalculation() {
  if (!sb || !currentUser) {
    console.log('No user - skip save');
    return;
  }
  
  try {
    // Получаем studio_id текущего пользователя
    const { data: memberData, error: memberError } = await sb
      .from('studio_members')
      .select('studio_id')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .single();
    
    if (memberError || !memberData) {
      console.error('No studio found for user:', memberError);
      // Fallback - сохраняем БЕЗ studio_id (для обратной совместимости)
      // В следующий раз при логине студия создастся автоматически
    }
    
    const studioId = memberData?.studio_id;
    
    const formData = collectFormData();
    const dataStr = JSON.stringify(formData);
    
    // Проверяем изменились ли данные
    if (dataStr === lastSavedData) {
      console.log('No changes - skip save');
      return;
    }
    
    // Собираем итоги
    const s = collectAll();
    const mu = markups();
    const taxK = taxCoef();
    
    const baseAll = (s.pkg.mat + s.pkg.mot) + (s.impact.mat + s.impact.mot) + 
                    (s.arm.mat + s.arm.mot) + (s.wrap.mat + s.wrap.mot) + 
                    (s.det.mat + s.det.mot) + (s.gl.mat + s.gl.mot) + (s.ms.mat + s.ms.mot);
    
    const pkgTotal = s.pkg.mat + s.pkg.mot;
    const impactTotal = s.impact.mat + s.impact.mot;
    const armTotal = s.arm.mat + s.arm.mot;
    const wrapTotal = s.wrap.mat + s.wrap.mot;
    const detTotal = s.det.mat + s.det.mot;
    const glTotal = s.gl.mat + s.gl.mot;
    const msTotal = s.ms.mat + s.ms.mot;
    
    const totalMarkup = 
      r100(pkgTotal * (mu.pkg || 0) / 100) +
      r100(impactTotal * (mu.impact || 0) / 100) +
      r100(armTotal * (mu.arm || 0) / 100) +
      r100(wrapTotal * (mu.wrap || 0) / 100) +
      r100(detTotal * (mu.det || 0) / 100) +
      r100(glTotal * (mu.gl || 0) / 100) +
      r100(msTotal * (mu.ms || 0) / 100);
    
    const disc = parseFloat(q('#customDiscount')?.value) || 0;
    const markupWithDiscount = r100(totalMarkup * (1 - disc / 100));
    const afterMarkup = baseAll + markupWithDiscount;
    const tax = r100(afterMarkup * taxK);
    const finalTotal = afterMarkup + tax;
    
    const car_name = `${formData.car.brand || ''} ${formData.car.model || ''} ${formData.car.year || ''}`.trim();
    
    // Подготавливаем данные для сохранения
    const calcData = {
      user_id: currentUser.id,
      car_name: car_name || 'Без названия',
      brand: formData.car.brand || null,
      model: formData.car.model || null,
      year: formData.car.year || null,
      total_price: finalTotal,
      calculation_data: formData,
      status: 'draft',
      updated_at: new Date().toISOString()
    };
    
    // Добавляем studio_id если есть
    if (studioId) {
      calcData.studio_id = studioId;
    }
    
    // Умная логика сохранения:
    // - Если открыли существующий расчёт (currentCalculationId) → UPDATE
    // - Если новый расчёт → INSERT один раз, запоминаем ID, дальше UPDATE
    let error;
    let savedData;
    
    if (currentCalculationId) {
      // UPDATE существующего
      ({ error } = await sb
        .from('calculations')
        .update(calcData)
        .eq('id', currentCalculationId));
      console.log('Updated existing calculation:', currentCalculationId);
    } else {
      // INSERT нового
      ({ data: savedData, error } = await sb
        .from('calculations')
        .insert(calcData)
        .select()
        .single());
      
      if (savedData) {
        currentCalculationId = savedData.id; // Запоминаем ID
        console.log('Created new calculation:', currentCalculationId);
      }
    }
    
    if (error) {
      console.error('Save error details:', JSON.stringify(error));
      // Показываем пользователю ошибку
      const btn2 = q('#btnSaveCalc');
      if (btn2) {
        const orig = btn2.textContent;
        btn2.textContent = '❌ Ошибка сохранения';
        btn2.style.background = '#ef4444';
        setTimeout(() => { btn2.textContent = orig; btn2.style.background = ''; }, 3000);
      }
      return;
    }
    
    lastSavedData = dataStr;
    console.log('✅ Saved successfully');
    
    // Показываем индикатор сохранения
    const btn = q('#btnSaveCalc');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✅ Сохранено';
      showToast();
      btn.style.background = 'linear-gradient(135deg, var(--success), var(--success-dark))';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    }
  } catch (e) {
    console.error('Save error:', e);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCalculation, 2000); // Автосохранение через 2 сек после последнего изменения
}

// ========================================
// ЗАГРУЗКА РАСЧЁТА ИЗ URL
// ========================================

async function loadCalculationFromUrl() {
  // Получаем ID из URL параметров
  const urlParams = new URLSearchParams(window.location.search);
  const calcId = urlParams.get('load');
  const fromBoard = urlParams.get('from') === 'board' || !!calcId;

  if (!calcId) return; // Нет ID - ничего не делаем
  
  try {
    console.log('Loading calculation:', calcId);
    
    // Ждём пока api.js инициализируется
    await new Promise(r => { const t = setInterval(() => { if (window._crmApi || window._crmSb) { clearInterval(t); r(); } }, 50); });
    const sb = window._crmApi || window._crmSb;
    const sb = window._crmApi; const { data: calculation, error } = await sb
      .from('calculations')
      .select('*')
      .eq('id', calcId)
      .single();
    
    if (error || !calculation) {
      console.error('Failed to load calculation:', error);
      console.error('❌ Не удалось загрузить расчёт');
      return;
    }
    
    console.log('Calculation loaded:', calculation);
    
    // Запоминаем ID открытого расчёта
    currentCalculationId = calcId;
    
    const formData = calculation.calculation_data;
    if (!formData) return;
    
    // Заполняем автомобиль
    if (formData.car) {
      if (formData.car.brand) {
        const brandSelect = q('#brand');
        const brandManual = q('#brandManual');
        if (brandSelect) brandSelect.value = formData.car.brand;
        if (brandManual) brandManual.value = formData.car.brand;
        // Загружаем модели для бренда
        fillModels(formData.car.brand);
      }
      
      setTimeout(() => {
        if (formData.car.model) {
          const modelSelect = q('#model');
          const modelManual = q('#modelManual');
          if (modelSelect) modelSelect.value = formData.car.model;
          if (modelManual) modelManual.value = formData.car.model;
        }
        if (formData.car.year) {
          const yearInput = q('#year');
          if (yearInput) yearInput.value = formData.car.year;
        }
      }, 150);
    }
    
    // Заполняем пакет "Полная защита"
    if (formData.package) {
      if (formData.package.wrapMat) q('#pkgWrapMat').value = formData.package.wrapMat;
      if (formData.package.wrapMot) q('#pkgWrapMot').value = formData.package.wrapMot;
      if (formData.package.prepMat) q('#pkgPrepMat').value = formData.package.prepMat;
      if (formData.package.prepMot) q('#pkgPrepMot').value = formData.package.prepMot;
      if (formData.package.armMat) q('#pkgArmMat').value = formData.package.armMat;
      if (formData.package.armMot) q('#pkgArmMot').value = formData.package.armMot;
      if (formData.package.markup) q('#pkgMarkup').value = formData.package.markup;
      
      // Доп затраты для пакета
      if (formData.package.costs && formData.package.costs.length > 0) {
        formData.package.costs.forEach(cost => {
          addCostRow('pkg');
          const rows = qa('#pkgCostsContent .cost-row');
          const lastRow = rows[rows.length - 1];
          if (lastRow) {
            const nameInput = lastRow.querySelector('.pkg-cost-name');
            const valInput = lastRow.querySelector('.pkg-cost-val');
            if (nameInput) nameInput.value = cost.name || '';
            if (valInput) valInput.value = cost.value || '';
          }
        });
      }
    }
    
    // Заполняем пакет "Защита ударной части"
    if (formData.impact) {
      if (formData.impact.wrapMat) q('#impactWrapMat').value = formData.impact.wrapMat;
      if (formData.impact.wrapMot) q('#impactWrapMot').value = formData.impact.wrapMot;
      if (formData.impact.prepMat) q('#impactPrepMat').value = formData.impact.prepMat;
      if (formData.impact.prepMot) q('#impactPrepMot').value = formData.impact.prepMot;
      if (formData.impact.armMat) q('#impactArmMat').value = formData.impact.armMat;
      if (formData.impact.armMot) q('#impactArmMot').value = formData.impact.armMot;
      if (formData.impact.markup) q('#impactMarkup').value = formData.impact.markup;
      
      // Доп затраты
      if (formData.impact.costs && formData.impact.costs.length > 0) {
        formData.impact.costs.forEach(cost => {
          addCostRow('impact');
          const rows = qa('#impactCostsContent .cost-row');
          const lastRow = rows[rows.length - 1];
          if (lastRow) {
            const nameInput = lastRow.querySelector('.impact-cost-name');
            const valInput = lastRow.querySelector('.impact-cost-val');
            if (nameInput) nameInput.value = cost.name || '';
            if (valInput) valInput.value = cost.value || '';
          }
        });
      }
    }
    
    // Форма оплаты
    if (formData.paymentMode) {
      const payModeRadio = q(`input[name=payMode][value="${formData.paymentMode}"]`);
      if (payModeRadio) payModeRadio.checked = true;
    }
    
    // Скидка
    if (formData.discount) {
      q('#customDiscount').value = formData.discount;
    }
    
    // Наценки
    if (formData.markups) {
      if (formData.markups.arm) q('#armMarkup').value = formData.markups.arm;
      if (formData.markups.wrap) q('#wrapMarkup').value = formData.markups.wrap;
      if (formData.markups.det) q('#detMarkup').value = formData.markups.det;
      if (formData.markups.gl) q('#glMarkup').value = formData.markups.gl;
      if (formData.markups.misc) q('#miscMarkup').value = formData.markups.misc;
    }
    
    // Восстанавливаем динамические строки из services_detail
    if (formData.services_detail) {
      // arm, det, gl, misc — структура details: [name, mat, mot]
      [['arm', '#armDyn'], ['det', '#detDyn'], ['gl', '#glDyn'], ['misc', '#miscDyn']].forEach(([key, sel]) => {
        const items = formData.services_detail[key === 'misc' ? 'ms' : key] || [];
        items.forEach(d => {
          addDynRow(sel, key);
          const rows = qa(sel + ' .service-item');
          const row = rows[rows.length - 1];
          if (!row) return;
          const nameInput = row.querySelector('input[type=text]');
          if (nameInput) nameInput.value = d.name || '';
          const matInput = row.querySelector('.' + key + '-mat');
          const motInput = row.querySelector('.' + key + '-mot');
          if (matInput) matInput.value = d.mat || 0;
          if (motInput) motInput.value = d.mot || 0;
        });
      });

      // wrap — структура details: [name, m, pr, mat, mot, itemMarkup]
      const wrapItems = formData.services_detail.wrap || [];
      // Фильтруем только динамические (не PPF/ПВХ стандартные)
      const staticWrapNames = ['PPF прозрачный вкруг','PPF цветной вкруг','PPF матовый вкруг','ПВХ полная оклейка'];
      wrapItems.filter(d => !staticWrapNames.some(s => d.name && d.name.startsWith(s.split(' ')[0]))).forEach(d => {
        addDynRow('#wrapDyn', 'wrap');
        const rows = qa('#wrapDyn .service-item');
        const row = rows[rows.length - 1];
        if (!row) return;
        const nameInput = row.querySelector('input[type=text]');
        if (nameInput) nameInput.value = d.name || '';
        const nums = row.querySelectorAll('input[type=number]');
        if (nums[0]) nums[0].value = d.m || 0;    // метры
        if (nums[1]) nums[1].value = d.pr || 0;   // цена за метр
        if (nums[2]) nums[2].value = d.mot || 0;  // мотивация
      });

      // Инициализируем тоглы у всех новых строк
      initServiceToggles();
    }

    // Пересчитываем всё
    setTimeout(() => {
      renderAll();
      console.log('✅ Calculation loaded and rendered');
    }, 400);
    
  } catch (e) {
    console.error('Error loading calculation:', e);
  }
}

async function initAuthAndAccess() {
  const hasAccess = await checkAuth();
  return hasAccess;
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.search.includes('load=')) {
    const tryLoad = () => {
      if (window._crmApi || window._crmSb) {
        loadCalculationFromUrl();
      } else {
        setTimeout(tryLoad, 100);
      }
    };
    tryLoad();
  }
});

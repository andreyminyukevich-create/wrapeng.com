/**
 * calculator-persistence.js
 * Supabase-клиент, авторизация, сохранение/загрузка расчётов
 * Зависит от: calculator-data.js, calculator-engine.js
 */

const SUPABASE_URL      = 'https://hdghijgrrnzmntistdvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';

const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } })
  : null;

let currentUser          = null;
let currentProfile       = null;
let currentCalculationId = null;
let saveTimeout          = null;
let lastSavedData        = null;

// ── Авторизация ───────────────────────────────────────────────────
async function checkAccess(user) {
  try {
    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (error || !profile) { console.error('Profile not found:', error); return false; }
    currentProfile = profile;
    if (profile.is_paid) return true;
    const now       = new Date();
    const trialEnds = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    return !!(trialEnds && trialEnds > now);
  } catch (e) {
    console.error('checkAccess error:', e);
    return false;
  }
}

async function checkAuth() {
  try {
    if (!sb) return true;
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      currentUser = session.user;
      const { data: member } = await sb
        .from('studio_members')
        .select('studio_id, studios(name, subscription_tier, subscription_expires_at)')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      if (member) {
        currentProfile = {
          id:          session.user.id,
          studio_name: member.studios?.name || 'Студия',
          studio_id:   member.studio_id,
          is_paid:     ['active','trial'].includes(member.studios?.subscription_tier),
          trial_ends_at: member.studios?.subscription_expires_at,
        };
      } else {
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
    const hours = Math.floor((new Date(currentProfile.trial_ends_at) - new Date()) / 3600000);
    statusText  = hours > 0 ? `🕐 Триал: ${hours}ч` : '⚠️ Истёк';
  }

  userInfo.innerHTML  = `<div>${currentProfile.studio_name || 'Студия'}</div><div style="font-size:0.75rem">${statusText}</div>`;
  userInfo.style.display = 'block';

  // Применяем брендинг КП в зависимости от тарифа
  const isTrial = !currentProfile.is_paid;
  if (typeof window.applyKPBranding === 'function') window.applyKPBranding(isTrial);
  // Имя студии в КП-шапке
  const studioNameEl = document.getElementById('kpStudioName');
  if (studioNameEl && currentProfile.studio_name) studioNameEl.textContent = currentProfile.studio_name;
}

function goToDashboard() {
  window.location.href = 'dashboard.html';
}

// ── Сбор данных формы ─────────────────────────────────────────────
function collectFormData() {
  const data = {
    car: {
      brand: q('#brandManual')?.classList.contains('invis') ? q('#brand')?.value : q('#brandManual')?.value,
      model: q('#modelManual')?.classList.contains('invis') ? q('#model')?.value : q('#modelManual')?.value,
      year:  q('#year')?.value
    },
    package: {
      wrapMat: q('#pkgWrapMat')?.value,  wrapMot: q('#pkgWrapMot')?.value,
      prepMat: q('#pkgPrepMat')?.value,  prepMot: q('#pkgPrepMot')?.value,
      armMat:  q('#pkgArmMat')?.value,   armMot:  q('#pkgArmMot')?.value,
      markup:  q('#pkgMarkup')?.value,   costs:   []
    },
    impact: {
      wrapMat: q('#impactWrapMat')?.value, wrapMot: q('#impactWrapMot')?.value,
      prepMat: q('#impactPrepMat')?.value, prepMot: q('#impactPrepMot')?.value,
      armMat:  q('#impactArmMat')?.value,  armMot:  q('#impactArmMot')?.value,
      markup:  q('#impactMarkup')?.value,  costs:   []
    },
    paymentMode: q('input[name=payMode]:checked')?.value || 'cash',
    discount:    q('#customDiscount')?.value || '0',
    markups: {
      arm:  q('#armMarkup')?.value,
      wrap: q('#wrapMarkup')?.value,
      det:  q('#detMarkup')?.value,
      gl:   q('#glMarkup')?.value,
      misc: q('#miscMarkup')?.value
    }
  };

  qa('#pkgCostsContent .cost-row').forEach(row => {
    data.package.costs.push({ name: row.querySelector('.pkg-cost-name')?.value, value: row.querySelector('.pkg-cost-val')?.value });
  });
  qa('#impactCostsContent .cost-row').forEach(row => {
    data.impact.costs.push({ name: row.querySelector('.impact-cost-name')?.value, value: row.querySelector('.impact-cost-val')?.value });
  });

  try {
    const sums = collectAll();
    data.services_detail = {
      arm:  sums.arm.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      det:  sums.det.details.map(d => ({ name: d[0], mat: d[1], mot: d[2] })),
      gl:   sums.gl.details.map(d  => ({ name: d[0], mat: d[1], mot: d[2] })),
      ms:   sums.ms.details.map(d  => ({ name: d[0], mat: d[1], mot: d[2] })),
      wrap: sums.wrap.details.map(d => ({ name: d[0], mat: d[3], mot: d[4] })),
    };
  } catch(e) { /* collectAll может не быть при загрузке */ }

  data.executors = [];
  qa('#executorsContent .executor-row').forEach(row => {
    const baseId      = row.getAttribute('data-exec-id');
    if (!baseId) return;
    const serviceName = row.querySelector('.executor-row-header')?.textContent?.trim();
    const name        = row.querySelector(`#${baseId}name`)?.value || '';
    const salary      = row.querySelector(`#${baseId}salary`)?.value || '0';
    const receive     = row.querySelector(`#${baseId}receive`)?.value || '';
    const returnDate  = row.querySelector(`#${baseId}return`)?.value || '';
    const note        = row.querySelector(`#${baseId}note`)?.value || '';

    if (name || parseFloat(salary) > 0) {
      data.executors.push({ service: serviceName, name, salary: parseFloat(salary) || 0, receive_date: receive, return_date: returnDate, note });
    }

    row.querySelector('.extra-executors')?.querySelectorAll('.extra-executor-row').forEach(extraRow => {
      const eName    = extraRow.querySelector('input[id*="name"]')?.value || '';
      const eSalary  = extraRow.querySelector('input[id*="salary"]')?.value || '0';
      const eReceive = extraRow.querySelector('input[id*="receive"]')?.value || '';
      const eReturn  = extraRow.querySelector('input[id*="return"]')?.value || '';
      const eNote    = extraRow.querySelector('input[id*="note"]')?.value || '';
      if (eName || parseFloat(eSalary) > 0) {
        data.executors.push({ service: serviceName, name: eName, salary: parseFloat(eSalary) || 0, receive_date: eReceive, return_date: eReturn, note: eNote });
      }
    });
  });

  return data;
}

// ── Сохранение расчёта ───────────────────────────────────────────
async function saveCalculation() {
  if (!sb || !currentUser) { console.log('No user - skip save'); return; }

  try {
    const { data: memberData, error: memberError } = await sb
      .from('studio_members').select('studio_id').eq('user_id', currentUser.id).eq('is_active', true).single();
    if (memberError || !memberData) console.error('No studio found for user:', memberError);

    const studioId = memberData?.studio_id;
    const formData = collectFormData();
    const dataStr  = JSON.stringify(formData);
    if (dataStr === lastSavedData) { console.log('No changes - skip save'); return; }

    const s    = collectAll();
    const mu   = markups();
    const taxK = taxCoef();

    const baseAll   = (s.pkg.mat + s.pkg.mot) + (s.impact.mat + s.impact.mot) +
                      (s.arm.mat + s.arm.mot) + (s.wrap.mat + s.wrap.mot) +
                      (s.det.mat + s.det.mot) + (s.gl.mat + s.gl.mot) + (s.ms.mat + s.ms.mot);
    const totalMarkup = r100((s.pkg.mat + s.pkg.mot)    * (mu.pkg    || 0) / 100) +
                        r100((s.impact.mat + s.impact.mot) * (mu.impact || 0) / 100) +
                        r100((s.arm.mat + s.arm.mot)    * (mu.arm    || 0) / 100) +
                        r100((s.wrap.mat + s.wrap.mot)  * (mu.wrap   || 0) / 100) +
                        r100((s.det.mat + s.det.mot)    * (mu.det    || 0) / 100) +
                        r100((s.gl.mat + s.gl.mot)      * (mu.gl     || 0) / 100) +
                        r100((s.ms.mat + s.ms.mot)      * (mu.ms     || 0) / 100);

    const disc       = parseFloat(q('#customDiscount')?.value) || 0;
    const afterMarkup = baseAll + r100(totalMarkup * (1 - disc / 100));
    const finalTotal  = afterMarkup + r100(afterMarkup * taxK);
    const car_name    = `${formData.car.brand || ''} ${formData.car.model || ''} ${formData.car.year || ''}`.trim();

    const calcData = {
      user_id:          currentUser.id,
      car_name:         car_name || 'Без названия',
      brand:            formData.car.brand  || null,
      model:            formData.car.model  || null,
      year:             formData.car.year   || null,
      total_price:      finalTotal,
      calculation_data: formData,
      status:           'draft',
      updated_at:       new Date().toISOString()
    };
    if (studioId) calcData.studio_id = studioId;

    let error, savedData;
    if (currentCalculationId) {
      ({ error } = await sb.from('calculations').update(calcData).eq('id', currentCalculationId));
      console.log('Updated existing calculation:', currentCalculationId);
    } else {
      ({ data: savedData, error } = await sb.from('calculations').insert(calcData).select().single());
      if (savedData) { currentCalculationId = savedData.id; console.log('Created new calculation:', currentCalculationId); }
    }

    if (error) {
      console.error('Save error details:', JSON.stringify(error));
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

    const btn = q('#btnSaveCalc');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '✅ Сохранено';
      btn.style.background = 'linear-gradient(135deg, var(--success), var(--success-dark))';
      setTimeout(() => { btn.textContent = originalText; btn.style.background = ''; }, 2000);
    }
  } catch (e) {
    console.error('Save error:', e);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCalculation, 2000);
}

// ── Загрузка расчёта из URL ──────────────────────────────────────
async function loadCalculationFromUrl() {
  const calcId = new URLSearchParams(window.location.search).get('load');
  if (!calcId) return;

  try {
    console.log('Loading calculation:', calcId);
    const { data: calculation, error } = await sb.from('calculations').select('*').eq('id', calcId).single();
    if (error || !calculation) { console.error('Failed to load calculation:', error); alert('❌ Не удалось загрузить расчёт'); return; }

    console.log('Calculation loaded:', calculation);
    currentCalculationId = calcId;

    const fd = calculation.calculation_data;
    if (!fd) return;

    if (fd.car) {
      if (fd.car.brand) {
        const bs = q('#brand'), bm = q('#brandManual');
        if (bs) bs.value = fd.car.brand;
        if (bm) bm.value = fd.car.brand;
        fillModels(fd.car.brand);
      }
      setTimeout(() => {
        if (fd.car.model) { const ms = q('#model'), mm = q('#modelManual'); if (ms) ms.value = fd.car.model; if (mm) mm.value = fd.car.model; }
        if (fd.car.year)  { const yi = q('#year'); if (yi) yi.value = fd.car.year; }
      }, 100);
    }

    if (fd.package) {
      if (fd.package.wrapMat) q('#pkgWrapMat').value = fd.package.wrapMat;
      if (fd.package.wrapMot) q('#pkgWrapMot').value = fd.package.wrapMot;
      if (fd.package.prepMat) q('#pkgPrepMat').value = fd.package.prepMat;
      if (fd.package.prepMot) q('#pkgPrepMot').value = fd.package.prepMot;
      if (fd.package.armMat)  q('#pkgArmMat').value  = fd.package.armMat;
      if (fd.package.armMot)  q('#pkgArmMot').value  = fd.package.armMot;
      if (fd.package.markup)  q('#pkgMarkup').value  = fd.package.markup;
      fd.package.costs?.forEach(cost => {
        addCostRow('pkg');
        const rows = qa('#pkgCostsContent .cost-row');
        const last = rows[rows.length - 1];
        if (last) { last.querySelector('.pkg-cost-name').value = cost.name || ''; last.querySelector('.pkg-cost-val').value = cost.value || ''; }
      });
    }

    if (fd.impact) {
      if (fd.impact.wrapMat) q('#impactWrapMat').value = fd.impact.wrapMat;
      if (fd.impact.wrapMot) q('#impactWrapMot').value = fd.impact.wrapMot;
      if (fd.impact.prepMat) q('#impactPrepMat').value = fd.impact.prepMat;
      if (fd.impact.prepMot) q('#impactPrepMot').value = fd.impact.prepMot;
      if (fd.impact.armMat)  q('#impactArmMat').value  = fd.impact.armMat;
      if (fd.impact.armMot)  q('#impactArmMot').value  = fd.impact.armMot;
      if (fd.impact.markup)  q('#impactMarkup').value  = fd.impact.markup;
      fd.impact.costs?.forEach(cost => {
        addCostRow('impact');
        const rows = qa('#impactCostsContent .cost-row');
        const last = rows[rows.length - 1];
        if (last) { last.querySelector('.impact-cost-name').value = cost.name || ''; last.querySelector('.impact-cost-val').value = cost.value || ''; }
      });
    }

    if (fd.paymentMode) { const r = q(`input[name=payMode][value="${fd.paymentMode}"]`); if (r) r.checked = true; }
    if (fd.discount)    { q('#customDiscount').value = fd.discount; }

    if (fd.markups) {
      if (fd.markups.arm)  q('#armMarkup').value  = fd.markups.arm;
      if (fd.markups.wrap) q('#wrapMarkup').value = fd.markups.wrap;
      if (fd.markups.det)  q('#detMarkup').value  = fd.markups.det;
      if (fd.markups.gl)   q('#glMarkup').value   = fd.markups.gl;
      if (fd.markups.misc) q('#miscMarkup').value = fd.markups.misc;
    }

    setTimeout(() => { renderAll(); console.log('✅ Calculation loaded and rendered'); }, 200);

  } catch (e) {
    console.error('Error loading calculation:', e);
    alert('❌ Ошибка загрузки расчёта');
  }
}

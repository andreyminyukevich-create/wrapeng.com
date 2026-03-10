/**
 * calculator-engine.js
 * Бизнес-логика: сбор данных, расчёты, коэффициенты
 * Зависит от: calculator-data.js
 */

function getServiceDescription(name) {
  return serviceDescriptions[name] || name;
}

function taxCoef() {
  const m = q('input[name=payMode]:checked')?.value;
  return m === 'card' ? 0.13 : m === 'ooo' ? 0.22 : 0;
}

function markups() {
  return {
    pkg:    parseFloat(q('#pkgMarkup')?.value)    || 0,
    impact: parseFloat(q('#impactMarkup')?.value) || 0,
    arm:    parseFloat(q('#armMarkup')?.value)    || 0,
    wrap:   parseFloat(q('#wrapMarkup')?.value)   || 0,
    det:    parseFloat(q('#detMarkup')?.value)    || 0,
    gl:     parseFloat(q('#glMarkup')?.value)     || 0,
    ms:     parseFloat(q('#miscMarkup')?.value)   || 0
  };
}

function collectAdditionalCosts(prefix) {
  let total = 0;
  qa(`#${prefix}CostsContent .cost-row`).forEach(row => {
    const val = parseFloat(row.querySelector(`.${prefix}-cost-val`)?.value) || 0;
    total += val;
  });
  return total;
}

function collectAll() {
  const sums = {
    pkg:    { mat: 0, mot: 0, names: [] },
    impact: { mat: 0, mot: 0, names: [] },
    arm:    { mat: 0, mot: 0, names: [], details: [] },
    wrap:   { mat: 0, mot: 0, details: [] },
    det:    { mat: 0, mot: 0, names: [], details: [] },
    gl:     { mat: 0, mot: 0, names: [], details: [] },
    ms:     { mat: 0, mot: 0, names: [], details: [] }
  };

  // Полная защита вкруг
  const pkgWrapMat  = parseFloat(q('#pkgWrapMat')?.value)  || 0;
  const pkgWrapMot  = parseFloat(q('#pkgWrapMot')?.value)  || 0;
  const pkgPrepMat  = parseFloat(q('#pkgPrepMat')?.value)  || 0;
  const pkgPrepMot  = parseFloat(q('#pkgPrepMot')?.value)  || 0;
  const pkgArmMat   = parseFloat(q('#pkgArmMat')?.value)   || 0;
  const pkgArmMot   = parseFloat(q('#pkgArmMot')?.value)   || 0;
  const pkgCosts    = collectAdditionalCosts('pkg');

  if (pkgWrapMat > 0 || pkgWrapMot > 0 || pkgPrepMat > 0 || pkgPrepMot > 0 || pkgArmMat > 0 || pkgArmMot > 0 || pkgCosts > 0) {
    sums.pkg.mat = pkgWrapMat + pkgPrepMat + pkgArmMat + pkgCosts;
    sums.pkg.mot = pkgWrapMot + pkgPrepMot + pkgArmMot;
    sums.pkg.names.push('Полная защита вкруг');
  }

  // Защита ударной части
  const impactWrapMat = parseFloat(q('#impactWrapMat')?.value) || 0;
  const impactWrapMot = parseFloat(q('#impactWrapMot')?.value) || 0;
  const impactPrepMat = parseFloat(q('#impactPrepMat')?.value) || 0;
  const impactPrepMot = parseFloat(q('#impactPrepMot')?.value) || 0;
  const impactArmMat  = parseFloat(q('#impactArmMat')?.value)  || 0;
  const impactArmMot  = parseFloat(q('#impactArmMot')?.value)  || 0;
  const impactCosts   = collectAdditionalCosts('impact');

  if (impactWrapMat > 0 || impactWrapMot > 0 || impactPrepMat > 0 || impactPrepMot > 0 || impactArmMat > 0 || impactArmMot > 0 || impactCosts > 0) {
    sums.impact.mat = impactWrapMat + impactPrepMat + impactArmMat + impactCosts;
    sums.impact.mot = impactWrapMot + impactPrepMot + impactArmMot;
    sums.impact.names.push('Защита ударной части');
  }

  // Арматурные работы
  qa('.arm-chk').forEach(c => {
    if (!c.checked) return;
    const item = c.closest('.service-item');
    const n    = item.querySelector('.service-header label')?.textContent?.trim();
    let mat = parseFloat(item.querySelector('.arm-mat')?.value) || 0;
    let mot = parseFloat(item.querySelector('.arm-mot')?.value) || 0;
    if (item.querySelector('.arm-complex')?.checked) { mat *= 1.1; mot *= 1.1; }
    if (n && (mat > 0 || mot > 0)) {
      sums.arm.mat += mat; sums.arm.mot += mot;
      sums.arm.names.push(n); sums.arm.details.push([n, mat, mot]);
    }
  });
  qa('#armDyn .service-item').forEach(item => {
    const c = item.querySelector('input[type=checkbox]');
    if (!c?.checked) return;
    const n = item.querySelector('input[type=text]')?.value?.trim() || 'Название услуги';
    let mat = parseFloat(item.querySelector('.arm-mat')?.value) || 0;
    let mot = parseFloat(item.querySelector('.arm-mot')?.value) || 0;
    if (item.querySelector('.arm-complex')?.checked) { mat *= 1.1; mot *= 1.1; }
    if (mat > 0 || mot > 0) {
      sums.arm.mat += mat; sums.arm.mot += mot;
      sums.arm.names.push(n); sums.arm.details.push([n, mat, mot]);
    }
  });
  sums.arm.mat += collectAdditionalCosts('arm');

  // PPF / PVC — Оклейка
  if (q('#ppfClearChk')?.checked) {
    const pr = parseFloat(q('#ppfClearPrice')?.value) || 0;
    let m = parseFloat(q('#ppfClearM')?.value) || 0;
    let mot = parseFloat(q('#ppfClearMot')?.value) || 0;
    if (q('#ppfClearComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat; sums.wrap.mot += mot;
    sums.wrap.details.push(['PPF прозрачный вкруг', m, pr, mat, mot, 0]);
  }
  if (q('#ppfColorChk')?.checked) {
    const pr = parseFloat(q('#ppfColorPrice')?.value) || 0;
    let m = parseFloat(q('#ppfColorM')?.value) || 0;
    let mot = parseFloat(q('#ppfColorMot')?.value) || 0;
    if (q('#ppfColorComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat; sums.wrap.mot += mot;
    sums.wrap.details.push(['PPF цветной вкруг', m, pr, mat, mot, 0]);
  }
  if (q('#ppfMatChk')?.checked) {
    const pr = parseFloat(q('#ppfMatPrice')?.value) || 0;
    let m = parseFloat(q('#ppfMatM')?.value) || 0;
    let mot = parseFloat(q('#ppfMatMot')?.value) || 0;
    if (q('#ppfMatComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat; sums.wrap.mot += mot;
    sums.wrap.details.push(['PPF матовый вкруг', m, pr, mat, mot, 0]);
  }
  qa('.ppf-part-chk').forEach(c => {
    if (!c.checked) return;
    if (!q('#ppfPartChk')?.checked) return;
    const item = c.closest('.service-item');
    const n    = item.querySelector('.service-header label')?.textContent?.trim();
    let m   = parseFloat(item.querySelector('.ppf-part-m')?.value) || 0;
    const pr = parseFloat(item.querySelector('.ppf-part-price')?.value) || 0;
    let mot = parseFloat(item.querySelector('.ppf-part-mot')?.value) || 0;
    if (item.querySelector('.ppf-part-complex')?.checked) { m *= 1.1; mot *= 1.1; }
    if (m > 0 || pr > 0 || mot > 0) {
      const mat = r100(m * pr);
      const itemMarkup = parseFloat(item.querySelector('.ppf-part-markup')?.value) || 0;
      sums.wrap.mat += mat; sums.wrap.mot += mot;
      sums.wrap.details.push([`PPF частично - ${n}`, m, pr, mat, mot, itemMarkup]);
    }
  });
  if (q('#pvcFullChk')?.checked) {
    const pr = parseFloat(q('#pvcFullPrice')?.value) || 0;
    let m = parseFloat(q('#pvcFullM')?.value) || 0;
    let mot = parseFloat(q('#pvcFullMot')?.value) || 0;
    if (q('#pvcFullComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat; sums.wrap.mot += mot;
    sums.wrap.details.push(['ПВХ полная оклейка', m, pr, mat, mot, 0]);
  }
  qa('.pvc-part-chk').forEach(c => {
    if (!c.checked) return;
    if (!q('#pvcPartChk')?.checked) return;
    const item = c.closest('.service-item');
    const n    = item.querySelector('.service-header label')?.textContent?.trim();
    let m   = parseFloat(item.querySelector('.pvc-part-m')?.value) || 0;
    const pr = parseFloat(item.querySelector('.pvc-part-price')?.value) || 0;
    let mot = parseFloat(item.querySelector('.pvc-part-mot')?.value) || 0;
    if (item.querySelector('.pvc-part-complex')?.checked) { m *= 1.1; mot *= 1.1; }
    if (m > 0 || pr > 0 || mot > 0) {
      const mat = r100(m * pr);
      const itemMarkup = parseFloat(item.querySelector('.pvc-part-markup')?.value) || 0;
      sums.wrap.mat += mat; sums.wrap.mot += mot;
      sums.wrap.details.push([`ПВХ частично - ${n}`, m, pr, mat, mot, itemMarkup]);
    }
  });
  qa('#wrapDyn .service-item').forEach(item => {
    const c = item.querySelector('input[type=checkbox]');
    if (!c?.checked) return;
    const n   = item.querySelector('input[type=text]')?.value?.trim() || 'Название услуги';
    let m   = parseFloat(item.querySelectorAll('input[type=number]')[0]?.value) || 0;
    const pr = parseFloat(item.querySelectorAll('input[type=number]')[1]?.value) || 0;
    let mot = parseFloat(item.querySelectorAll('input[type=number]')[2]?.value) || 0;
    if (item.querySelector('.wrap-complex')?.checked) { m *= 1.1; mot *= 1.1; }
    if (m > 0 || pr > 0 || mot > 0) {
      const mat = r100(m * pr);
      sums.wrap.mat += mat; sums.wrap.mot += mot;
      sums.wrap.details.push([n, m, pr, mat, mot, 0]);
    }
  });
  sums.wrap.mat += collectAdditionalCosts('wrap');

  // Детейлинг / Стёкла / Прочее
  ['det', 'gl', 'misc'].forEach(tp => {
    const key = tp === 'misc' ? 'ms' : tp;
    qa(`.${tp}-chk`).forEach(c => {
      if (!c.checked) return;
      const item = c.closest('.service-item');
      const n    = item.querySelector('.service-header label')?.textContent?.trim();
      let mat = parseFloat(item.querySelector(`.${tp}-mat`)?.value) || 0;
      let mot = parseFloat(item.querySelector(`.${tp}-mot`)?.value) || 0;
      if (item.querySelector(`.${tp}-complex`)?.checked) { mat *= 1.1; mot *= 1.1; }
      if (n && (mat > 0 || mot > 0)) {
        sums[key].mat += mat; sums[key].mot += mot;
        sums[key].names.push(n); sums[key].details.push([n, mat, mot]);
      }
    });
    qa(`#${tp}Dyn .service-item`).forEach(item => {
      const c = item.querySelector('input[type=checkbox]');
      if (!c?.checked) return;
      const n = item.querySelector('input[type=text]')?.value?.trim() || 'Название услуги';
      let mat = parseFloat(item.querySelector(`.${tp}-mat`)?.value) || 0;
      let mot = parseFloat(item.querySelector(`.${tp}-mot`)?.value) || 0;
      if (item.querySelector(`.${tp}-complex`)?.checked) { mat *= 1.1; mot *= 1.1; }
      if (mat > 0 || mot > 0) {
        sums[key].mat += mat; sums[key].mot += mot;
        sums[key].names.push(n); sums[key].details.push([n, mat, mot]);
      }
    });
    sums[key].mat += collectAdditionalCosts(tp);
  });

  return sums;
}

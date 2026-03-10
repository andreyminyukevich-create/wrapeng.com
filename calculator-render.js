/**
 * calculator-render.js — v1.1
 * Зависит от: calculator-data.js, calculator-engine.js
 */

function renderServiceList(containerId, services, classPrefix) {
  const container = q(containerId);
  let html = '';
  
  services.forEach((name, idx) => {
    html += `<div class="service-item">
      <div class="service-header">
        <input type="checkbox" class="${classPrefix}-chk" id="${classPrefix}${idx + 1}">
        <label for="${classPrefix}${idx + 1}">${name}</label>
      </div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Материалы ():</label><input type="number" class="${classPrefix}-mat" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" class="${classPrefix}-mot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity">
          <input type="checkbox" class="${classPrefix}-complex" id="${classPrefix}${idx + 1}c">
          <label for="${classPrefix}${idx + 1}c">Усложнение +10%</label>
        </div>
      </div>
    </div>`;
  });
  
  html += `<div id="${classPrefix}Dyn"></div>
    <button type="button" class="btn btn-secondary" id="btnAdd${capitalize(classPrefix)}">+ Дополнительно</button>
    <div class="partial-wrapper">
      <div class="partial-header">
        <input type="checkbox" id="${classPrefix}CostsChk">
        <label for="${classPrefix}CostsChk">Дополнительные затраты</label>
      </div>
      <div class="partial-content" id="${classPrefix}CostsContent"></div>
    </div>
    <button type="button" class="btn btn-secondary" id="btnAdd${capitalize(classPrefix)}Cost" style="margin-top:10px;display:none">+ Добавить затрату</button>
    <div style="margin-top:15px">
      <label class="markup-label">⚠️ Наценка (%):</label>
      <input type="number" id="${classPrefix}Markup" placeholder="0" step="1">
      <div class="chips">
        <span class="chip" data-markup-target="#${classPrefix}Markup">10</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">20</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">30</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">40</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">50</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">60</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">70</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">80</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">90</span>
        <span class="chip" data-markup-target="#${classPrefix}Markup">100</span>
      </div>
    </div>
`;
  
  container.innerHTML = html;
}

function renderWrapContent() {
  const container = q('#wrapContent');
  let html = `<h3 style="margin-bottom:10px;font-size:1.05rem;font-weight:700">PPF</h3>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="ppfClearChk"><label for="ppfClearChk">PPF прозрачный (кузов)</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="ppfClearM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр ():</label><input type="number" id="ppfClearPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" id="ppfClearMot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity"><input type="checkbox" id="ppfClearComplex"><label for="ppfClearComplex">Усложнение +10%</label></div>
      </div>
    </div>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="ppfColorChk"><label for="ppfColorChk">PPF цветной (кузов)</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="ppfColorM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр ():</label><input type="number" id="ppfColorPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" id="ppfColorMot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity"><input type="checkbox" id="ppfColorComplex"><label for="ppfColorComplex">Усложнение +10%</label></div>
      </div>
    </div>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="ppfMatChk"><label for="ppfMatChk">PPF матовый (кузов)</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="ppfMatM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр ():</label><input type="number" id="ppfMatPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" id="ppfMatMot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity"><input type="checkbox" id="ppfMatComplex"><label for="ppfMatComplex">Усложнение +10%</label></div>
      </div>
    </div>
    <div class="partial-wrapper">
      <div class="partial-header"><input type="checkbox" id="ppfPartChk"><label for="ppfPartChk">PPF частично</label></div>
      <div class="partial-content" id="ppfPartContent"></div>
    </div>
    <h3 style="margin:20px 0 10px;font-size:1.05rem;font-weight:700">PVC</h3>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="pvcFullChk"><label for="pvcFullChk">ПВХ полная оклейка</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="pvcFullM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр ():</label><input type="number" id="pvcFullPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" id="pvcFullMot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity"><input type="checkbox" id="pvcFullComplex"><label for="pvcFullComplex">Усложнение +10%</label></div>
      </div>
    </div>
    <div class="partial-wrapper">
      <div class="partial-header"><input type="checkbox" id="pvcPartChk"><label for="pvcPartChk">ПВХ частично</label></div>
      <div class="partial-content" id="pvcPartContent"></div>
    </div>
    <div id="wrapDyn"></div>
    <button type="button" class="btn btn-secondary" id="btnAddWrap">+ Дополнительно</button>
    <div class="partial-wrapper">
      <div class="partial-header">
        <input type="checkbox" id="wrapCostsChk">
        <label for="wrapCostsChk">Дополнительные затраты</label>
      </div>
      <div class="partial-content" id="wrapCostsContent"></div>
    </div>
    <button type="button" class="btn btn-secondary" id="btnAddWrapCost" style="margin-top:10px;display:none">+ Добавить затрату</button>
    <div style="margin-top:20px">
      <label class="markup-label">⚠️ Наценка на оклейку (%):</label>
      <input type="number" id="wrapMarkup" placeholder="0" step="1">
      <div class="chips">
        <span class="chip" data-markup-target="#wrapMarkup">10</span>
        <span class="chip" data-markup-target="#wrapMarkup">20</span>
        <span class="chip" data-markup-target="#wrapMarkup">30</span>
        <span class="chip" data-markup-target="#wrapMarkup">40</span>
        <span class="chip" data-markup-target="#wrapMarkup">50</span>
        <span class="chip" data-markup-target="#wrapMarkup">60</span>
        <span class="chip" data-markup-target="#wrapMarkup">70</span>
        <span class="chip" data-markup-target="#wrapMarkup">80</span>
        <span class="chip" data-markup-target="#wrapMarkup">90</span>
        <span class="chip" data-markup-target="#wrapMarkup">100</span>
      </div>
    </div>
`;
  // wrapSummary — статичный div в HTML
  
  container.innerHTML = html;
}

function renderPartialLists() {
  const ppf = q('#ppfPartContent');
  const pvc = q('#pvcPartContent');
  let ppfHtml = '', pvcHtml = '';
  
  partElements.forEach((name, idx) => {
    ppfHtml += `<div class="service-item">
      <div class="service-header"><input type="checkbox" class="ppf-part-chk" id="ppfp${idx}"><label for="ppfp${idx}">${name}</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" class="ppf-part-m" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр ():</label><input type="number" class="ppf-part-price" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" class="ppf-part-mot" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Своя наценка (%):</label><input type="number" class="ppf-part-markup" placeholder="0"></div>
        </div>
<div class="chips" style="margin-top:10px">
          <span class="chip" data-ppf-markup="${idx}">10</span>
          <span class="chip" data-ppf-markup="${idx}">20</span>
          <span class="chip" data-ppf-markup="${idx}">30</span>
          <span class="chip" data-ppf-markup="${idx}">40</span>
          <span class="chip" data-ppf-markup="${idx}">50</span>
          <span class="chip" data-ppf-markup="${idx}">60</span>
          <span class="chip" data-ppf-markup="${idx}">70</span>
          <span class="chip" data-ppf-markup="${idx}">80</span>
          <span class="chip" data-ppf-markup="${idx}">90</span>
          <span class="chip" data-ppf-markup="${idx}">100</span>
        </div>
      </div>
    </div>`;
    
    pvcHtml += `<div class="service-item">
      <div class="service-header"><input type="checkbox" class="pvc-part-chk" id="pvcp${idx}"><label for="pvcp${idx}">${name}</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" class="pvc-part-m" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр ():</label><input type="number" class="pvc-part-price" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация ():</label><input type="number" class="pvc-part-mot" placeholder="0" step="0.01"></div>
<div class="form-group"><label>Своя наценка (%):</label><input type="number" class="pvc-part-markup" placeholder="0"></div>
        </div>
<div class="chips" style="margin-top:10px">
          <span class="chip" data-pvc-markup="${idx}">10</span>
          <span class="chip" data-pvc-markup="${idx}">20</span>
          <span class="chip" data-pvc-markup="${idx}">30</span>
          <span class="chip" data-pvc-markup="${idx}">40</span>
          <span class="chip" data-pvc-markup="${idx}">50</span>
          <span class="chip" data-pvc-markup="${idx}">60</span>
          <span class="chip" data-pvc-markup="${idx}">70</span>
          <span class="chip" data-pvc-markup="${idx}">80</span>
          <span class="chip" data-pvc-markup="${idx}">90</span>
          <span class="chip" data-pvc-markup="${idx}">100</span>
        </div>
      </div>
    </div>`;
  });
  
  ppf.innerHTML = ppfHtml;
  pvc.innerHTML = pvcHtml;
}

function addCostRow(prefix) {
  costCounter++;
  const container = q(`#${prefix}CostsContent`);
  const row = document.createElement('div');
  row.className = 'cost-row';
  row.innerHTML = `
    <div class="form-group">
      <input type="text" placeholder="Название затраты" class="${prefix}-cost-name">
      <input type="number" placeholder="Сумма ()" class="${prefix}-cost-val" step="0.01">
    </div>
    <button type="button" onclick="this.closest('.cost-row').remove();renderAll()">❌</button>
  `;
  container.appendChild(row);
  renderAll();
}

let dynCounter = 0;
function addDynRow(id, cls) {
  const c = q(id);
  const d = document.createElement('div');
  d.className = 'service-item';
  dynCounter++;
  
  // Для wrap - особые поля (метры/цена/мотивация)
  if (cls === 'wrap') {
    d.innerHTML = `<div class="service-header">
      <input type="checkbox" checked id="dyn${cls}${dynCounter}">
      <label for="dyn${cls}${dynCounter}"><input type="text" placeholder="Название услуги" style="border:none;background:transparent;padding:0;font-weight:600;font-size:.95rem;color:var(--text);width:100%"></label>
    </div>
    <div class="service-body open">
      <div class="service-fields">
        <div class="form-group"><label>Метры (м):</label><input type="number" class="${cls}-m" placeholder="0" step="0.01"></div>
        <div class="form-group"><label>Цена за метр ():</label><input type="number" class="${cls}-price" placeholder="0" step="0.01"></div>
        <div class="form-group"><label>Мотивация ():</label><input type="number" class="${cls}-mot" placeholder="0" step="0.01"></div>
      </div>
      <div class="service-complexity">
        <input type="checkbox" class="${cls}-complex" id="dyn${cls}${dynCounter}c">
        <label for="dyn${cls}${dynCounter}c">Усложнение +10%</label>
      </div>
    </div>`;
  } else {
    // Для остальных - обычные поля (материалы/мотивация)
    d.innerHTML = `<div class="service-header">
      <input type="checkbox" checked id="dyn${cls}${dynCounter}">
      <label for="dyn${cls}${dynCounter}"><input type="text" placeholder="Название услуги" style="border:none;background:transparent;padding:0;font-weight:600;font-size:.95rem;color:var(--text);width:100%"></label>
    </div>
    <div class="service-body open">
      <div class="service-fields">
        <div class="form-group"><label>Материалы ():</label><input type="number" class="${cls}-mat" placeholder="0" step="0.01"></div>
        <div class="form-group"><label>Мотивация ():</label><input type="number" class="${cls}-mot" placeholder="0" step="0.01"></div>
      </div>
      <div class="service-complexity">
        <input type="checkbox" class="${cls}-complex" id="dyn${cls}${dynCounter}c">
        <label for="dyn${cls}${dynCounter}c">Усложнение +10%</label>
      </div>
    </div>`;
  }
  c.appendChild(d);
}

function initServiceToggles() {
  qa('.service-item').forEach(item => {
    const chk = item.querySelector('.service-header input[type="checkbox"]');
    const body = item.querySelector('.service-body');
    const header = item.querySelector('.service-header');
    
    if (!chk || !body) return;
    
    header.onclick = function(e) {
      if (e.target === chk || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
      chk.click();
    };
    
    chk.onchange = function() {
      if (chk.checked) {
        body.classList.add('open');
      } else {
        body.classList.remove('open');
      }
    };
  });
  
  ['ppfPartChk', 'pvcPartChk', 'pkgCostsChk', 'impactCostsChk', 'armCostsChk', 'wrapCostsChk', 'detCostsChk', 'glCostsChk', 'miscCostsChk'].forEach(id => {
    const chk = q(`#${id}`);
    if (!chk) return;
    const content = q(`#${id.replace('Chk', 'Content')}`);
    
    // Исправляем регистр: первая буква заглавная
    let btnId = id.replace('Chk', '').replace('Costs', 'Cost');
    btnId = btnId.charAt(0).toUpperCase() + btnId.slice(1);
    const btn = q(`#btnAdd${btnId}`);
    if (!content) return;
    
    chk.onchange = function() {
      if (chk.checked) {
        content.classList.add('open');
        if (btn) btn.style.display = 'block';
      } else {
        content.classList.remove('open');
        if (btn) btn.style.display = 'none';
      }
    };
  });
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
    pkg: { mat: 0, mot: 0, names: [] },
    impact: { mat: 0, mot: 0, names: [] },
    arm: { mat: 0, mot: 0, names: [], details: [] },
    wrap: { mat: 0, mot: 0, details: [] },
    det: { mat: 0, mot: 0, names: [], details: [] },
    gl: { mat: 0, mot: 0, names: [], details: [] },
    ms: { mat: 0, mot: 0, names: [], details: [] }
  };
  
  const pkgWrapMat = parseFloat(q('#pkgWrapMat')?.value) || 0;
  const pkgWrapMot = parseFloat(q('#pkgWrapMot')?.value) || 0;
  const pkgPrepMat = parseFloat(q('#pkgPrepMat')?.value) || 0;
  const pkgPrepMot = parseFloat(q('#pkgPrepMot')?.value) || 0;
  const pkgArmMat = parseFloat(q('#pkgArmMat')?.value) || 0;
  const pkgArmMot = parseFloat(q('#pkgArmMot')?.value) || 0;
  const pkgCosts = collectAdditionalCosts('pkg');
  
  if (pkgWrapMat > 0 || pkgWrapMot > 0 || pkgPrepMat > 0 || pkgPrepMot > 0 || pkgArmMat > 0 || pkgArmMot > 0 || pkgCosts > 0) {
    sums.pkg.mat = pkgWrapMat + pkgPrepMat + pkgArmMat + pkgCosts;
    sums.pkg.mot = pkgWrapMot + pkgPrepMot + pkgArmMot;
    sums.pkg.names.push('Полная защита кузова');
  }
  
  const impactWrapMat = parseFloat(q('#impactWrapMat')?.value) || 0;
  const impactWrapMot = parseFloat(q('#impactWrapMot')?.value) || 0;
  const impactPrepMat = parseFloat(q('#impactPrepMat')?.value) || 0;
  const impactPrepMot = parseFloat(q('#impactPrepMot')?.value) || 0;
  const impactArmMat = parseFloat(q('#impactArmMat')?.value) || 0;
  const impactArmMot = parseFloat(q('#impactArmMot')?.value) || 0;
  const impactCosts = collectAdditionalCosts('impact');
  
  if (impactWrapMat > 0 || impactWrapMot > 0 || impactPrepMat > 0 || impactPrepMot > 0 || impactArmMat > 0 || impactArmMot > 0 || impactCosts > 0) {
    sums.impact.mat = impactWrapMat + impactPrepMat + impactArmMat + impactCosts;
    sums.impact.mot = impactWrapMot + impactPrepMot + impactArmMot;
    sums.impact.names.push('Защита ударной части');
  }
  
  qa('.arm-chk').forEach(c => {
    if (c.checked) {
      const item = c.closest('.service-item');
      const n = item.querySelector('.service-header label')?.textContent?.trim();
      let mat = parseFloat(item.querySelector('.arm-mat')?.value) || 0;
      let mot = parseFloat(item.querySelector('.arm-mot')?.value) || 0;
      if (item.querySelector('.arm-complex')?.checked) { mat *= 1.1; mot *= 1.1; }
      if (n && (mat > 0 || mot > 0)) {
        sums.arm.mat += mat;
        sums.arm.mot += mot;
        sums.arm.names.push(n);
        sums.arm.details.push([n, mat, mot]);
      }
    }
  });
  
  qa('#armDyn .service-item').forEach(item => {
    const c = item.querySelector('input[type=checkbox]');
    if (c?.checked) {
      const n = item.querySelector('input[type=text]')?.value?.trim() || 'Название услуги';
      let mat = parseFloat(item.querySelector('.arm-mat')?.value) || 0;
      let mot = parseFloat(item.querySelector('.arm-mot')?.value) || 0;
      if (item.querySelector('.arm-complex')?.checked) { mat *= 1.1; mot *= 1.1; }
      if (mat > 0 || mot > 0) {
        sums.arm.mat += mat;
        sums.arm.mot += mot;
        sums.arm.names.push(n);
        sums.arm.details.push([n, mat, mot]);
      }
    }
  });
  
  sums.arm.mat += collectAdditionalCosts('arm');
  
  if (q('#ppfClearChk')?.checked) {
    const pr = parseFloat(q('#ppfClearPrice')?.value) || 0;
    let m = parseFloat(q('#ppfClearM')?.value) || 0;
    let mot = parseFloat(q('#ppfClearMot')?.value) || 0;
    if (q('#ppfClearComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat;
    sums.wrap.mot += mot;
    sums.wrap.details.push(['PPF прозрачный (кузов)', m, pr, mat, mot, 0]);
  }
  
  if (q('#ppfColorChk')?.checked) {
    const pr = parseFloat(q('#ppfColorPrice')?.value) || 0;
    let m = parseFloat(q('#ppfColorM')?.value) || 0;
    let mot = parseFloat(q('#ppfColorMot')?.value) || 0;
    if (q('#ppfColorComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat;
    sums.wrap.mot += mot;
    sums.wrap.details.push(['PPF цветной (кузов)', m, pr, mat, mot, 0]);
  }
  
  if (q('#ppfMatChk')?.checked) {
    const pr = parseFloat(q('#ppfMatPrice')?.value) || 0;
    let m = parseFloat(q('#ppfMatM')?.value) || 0;
    let mot = parseFloat(q('#ppfMatMot')?.value) || 0;
    if (q('#ppfMatComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat;
    sums.wrap.mot += mot;
    sums.wrap.details.push(['PPF матовый (кузов)', m, pr, mat, mot, 0]);
  }
  
  qa('.ppf-part-chk').forEach(c => {
    if (c.checked) {
      const ppfPartMainChk = q('#ppfPartChk');
      if (!ppfPartMainChk || !ppfPartMainChk.checked) return;
      
      const item = c.closest('.service-item');
      const n = item.querySelector('.service-header label')?.textContent?.trim();
      let m = parseFloat(item.querySelector('.ppf-part-m')?.value) || 0;
      const pr = parseFloat(item.querySelector('.ppf-part-price')?.value) || 0;
      let mot = parseFloat(item.querySelector('.ppf-part-mot')?.value) || 0;
      if (item.querySelector('.ppf-part-complex')?.checked) { m *= 1.1; mot *= 1.1; }
      
      if (m > 0 || pr > 0 || mot > 0) {
        const mat = r100(m * pr);
        const itemMarkup = parseFloat(item.querySelector('.ppf-part-markup')?.value) || 0;
        sums.wrap.mat += mat;
        sums.wrap.mot += mot;
        sums.wrap.details.push([`PPF частично - ${n}`, m, pr, mat, mot, itemMarkup]);
      }
    }
  });
  
  if (q('#pvcFullChk')?.checked) {
    const pr = parseFloat(q('#pvcFullPrice')?.value) || 0;
    let m = parseFloat(q('#pvcFullM')?.value) || 0;
    let mot = parseFloat(q('#pvcFullMot')?.value) || 0;
    if (q('#pvcFullComplex')?.checked) { m *= 1.1; mot *= 1.1; }
    const mat = r100(m * pr);
    sums.wrap.mat += mat;
    sums.wrap.mot += mot;
    sums.wrap.details.push(['ПВХ полная оклейка', m, pr, mat, mot, 0]);
  }
  
  qa('.pvc-part-chk').forEach(c => {
    if (c.checked) {
      const pvcPartMainChk = q('#pvcPartChk');
      if (!pvcPartMainChk || !pvcPartMainChk.checked) return;
      
      const item = c.closest('.service-item');
      const n = item.querySelector('.service-header label')?.textContent?.trim();
      let m = parseFloat(item.querySelector('.pvc-part-m')?.value) || 0;
      const pr = parseFloat(item.querySelector('.pvc-part-price')?.value) || 0;
      let mot = parseFloat(item.querySelector('.pvc-part-mot')?.value) || 0;
      if (item.querySelector('.pvc-part-complex')?.checked) { m *= 1.1; mot *= 1.1; }
      
      if (m > 0 || pr > 0 || mot > 0) {
        const mat = r100(m * pr);
        const itemMarkup = parseFloat(item.querySelector('.pvc-part-markup')?.value) || 0;
        sums.wrap.mat += mat;
        sums.wrap.mot += mot;
        sums.wrap.details.push([`ПВХ частично - ${n}`, m, pr, mat, mot, itemMarkup]);
      }
    }
  });
  
  qa('#wrapDyn .service-item').forEach(item => {
    const c = item.querySelector('input[type=checkbox]');
    if (c?.checked) {
      const n = item.querySelector('input[type=text]')?.value?.trim() || 'Название услуги';
      let m = parseFloat(item.querySelectorAll('input[type=number]')[0]?.value) || 0;
      const pr = parseFloat(item.querySelectorAll('input[type=number]')[1]?.value) || 0;
      let mot = parseFloat(item.querySelectorAll('input[type=number]')[2]?.value) || 0;
      if (item.querySelector('.wrap-complex')?.checked) { m *= 1.1; mot *= 1.1; }
      
      if (m > 0 || pr > 0 || mot > 0) {
        const mat = r100(m * pr);
        sums.wrap.mat += mat;
        sums.wrap.mot += mot;
        sums.wrap.details.push([n, m, pr, mat, mot, 0]);
      }
    }
  });
  
  sums.wrap.mat += collectAdditionalCosts('wrap');
  
  ['det', 'gl', 'misc'].forEach(tp => {
    const key = tp === 'misc' ? 'ms' : tp;
    
    qa(`.${tp}-chk`).forEach(c => {
      if (c.checked) {
        const item = c.closest('.service-item');
        const n = item.querySelector('.service-header label')?.textContent?.trim();
        let mat = parseFloat(item.querySelector(`.${tp}-mat`)?.value) || 0;
        let mot = parseFloat(item.querySelector(`.${tp}-mot`)?.value) || 0;
        if (item.querySelector(`.${tp}-complex`)?.checked) { mat *= 1.1; mot *= 1.1; }
        if (n && (mat > 0 || mot > 0)) {
          sums[key].mat += mat;
          sums[key].mot += mot;
          sums[key].names.push(n);
          sums[key].details.push([n, mat, mot]);
        }
      }
    });
    
    qa(`#${tp}Dyn .service-item`).forEach(item => {
      const c = item.querySelector('input[type=checkbox]');
      if (c?.checked) {
        const n = item.querySelector('input[type=text]')?.value?.trim() || 'Название услуги';
        let mat = parseFloat(item.querySelector(`.${tp}-mat`)?.value) || 0;
        let mot = parseFloat(item.querySelector(`.${tp}-mot`)?.value) || 0;
        if (item.querySelector(`.${tp}-complex`)?.checked) { mat *= 1.1; mot *= 1.1; }
        if (mat > 0 || mot > 0) {
          sums[key].mat += mat;
          sums[key].mot += mot;
          sums[key].names.push(n);
          sums[key].details.push([n, mat, mot]);
        }
      }
    });
    
    sums[key].mat += collectAdditionalCosts(tp);
  });
  
  return sums;
}

function taxCoef() {
  const m = q('input[name=payMode]:checked')?.value;
  return m === 'card' ? 0.13 : m === 'ooo' ? 0.22 : 0;
}

function markups() {
  return {
    pkg: parseFloat(q('#pkgMarkup')?.value) || 0,
    impact: parseFloat(q('#impactMarkup')?.value) || 0,
    arm: parseFloat(q('#armMarkup')?.value) || 0,
    wrap: parseFloat(q('#wrapMarkup')?.value) || 0,
    det: parseFloat(q('#detMarkup')?.value) || 0,
    gl: parseFloat(q('#glMarkup')?.value) || 0,
    ms: parseFloat(q('#miscMarkup')?.value) || 0
  };
}

function getServiceDescription(name) {
  return serviceDescriptions[name] || name;
}

function renderKP(s, mu) {
  const tb = q('#kpTable tbody');
  if (!tb) return;
  tb.innerHTML = '';
  
  const taxK = taxCoef();
  let tot = 0;
  
  // Полная защита кузова
  const pkgBase = s.pkg.mat + s.pkg.mot;
  if (pkgBase > 0) {
    const markupAmount = r100(pkgBase * (mu.pkg || 0) / 100);
    const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
    let pr = pkgBase + markupWithDiscount;
    pr = r100(pr * (1 + taxK));
    tot += pr;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">Полная защита кузова</td><td style="text-align:left">${getServiceDescription('Полная защита кузова')}</td><td>${fmt(pr)}</td>`;
    tb.appendChild(tr);
  }
  
  // Защита ударной части
  const impactBase = s.impact.mat + s.impact.mot;
  if (impactBase > 0) {
    const markupAmount = r100(impactBase * (mu.impact || 0) / 100);
    const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
    let pr = impactBase + markupWithDiscount;
    pr = r100(pr * (1 + taxK));
    tot += pr;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">Защита ударной части</td><td style="text-align:left">${getServiceDescription('Защита ударной части')}</td><td>${fmt(pr)}</td>`;
    tb.appendChild(tr);
  }
  
  // Арматурные работы - каждая услуга отдельно
  if (s.arm.details && s.arm.details.length > 0) {
    s.arm.details.forEach(detail => {
      const [name, mat, mot] = detail;
      const armBase = s.arm.mat + s.arm.mot;
      const serviceFraction = armBase / s.arm.details.length;
      const markupAmount = r100(serviceFraction * (mu.arm || 0) / 100);
      const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
      let pr = serviceFraction + markupWithDiscount;
      pr = r100(pr * (1 + taxK));
      tot += pr;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }
  
  // Оклейка - каждая услуга отдельно
  if (s.wrap.details && s.wrap.details.length > 0) {
    s.wrap.details.forEach(detail => {
      const [name, meters, price, mat, mot, itemMarkup] = detail;
      const base = mat + mot;
      if (base <= 0) return;
      
      const markupToUse = (itemMarkup && itemMarkup > 0) ? itemMarkup : mu.wrap;
      const markupAmount = r100(base * (markupToUse || 0) / 100);
      const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
      let pr = base + markupWithDiscount;
      pr = r100(pr * (1 + taxK));
      tot += pr;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }
  
  // Детейлинг - каждая услуга отдельно
  if (s.det.details && s.det.details.length > 0) {
    s.det.details.forEach(detail => {
      const [name, mat, mot] = detail;
      const detBase = s.det.mat + s.det.mot;
      const serviceFraction = detBase / s.det.details.length;
      const markupAmount = r100(serviceFraction * (mu.det || 0) / 100);
      const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
      let pr = serviceFraction + markupWithDiscount;
      pr = r100(pr * (1 + taxK));
      tot += pr;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }
  
  // Стёкла - каждая услуга отдельно
  if (s.gl.details && s.gl.details.length > 0) {
    s.gl.details.forEach(detail => {
      const [name, mat, mot] = detail;
      const glBase = s.gl.mat + s.gl.mot;
      const serviceFraction = glBase / s.gl.details.length;
      const markupAmount = r100(serviceFraction * (mu.gl || 0) / 100);
      const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
      let pr = serviceFraction + markupWithDiscount;
      pr = r100(pr * (1 + taxK));
      tot += pr;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }
  
  // Прочие работы - каждая услуга отдельно
  if (s.ms.details && s.ms.details.length > 0) {
    s.ms.details.forEach(detail => {
      const [name, mat, mot] = detail;
      const msBase = s.ms.mat + s.ms.mot;
      const serviceFraction = msBase / s.ms.details.length;
      const markupAmount = r100(serviceFraction * (mu.ms || 0) / 100);
      const markupWithDiscount = r100(markupAmount * (1 - disc / 100));
      let pr = serviceFraction + markupWithDiscount;
      pr = r100(pr * (1 + taxK));
      tot += pr;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }
  
  q('#kpTotal').textContent = fmt(tot);
}

function renderCost(s) {
  const tb = q('#costTable tbody');
  if (!tb) return;
  tb.innerHTML = '';
  
  const rows = [
    { t: 'Полная защита кузова', sum: s.pkg },
    { t: 'Защита ударной части', sum: s.impact },
    { t: 'Арматурные работы', sum: s.arm },
    { t: 'Детейлинг', sum: s.det },
    { t: 'Стёкла', sum: s.gl },
    { t: 'Прочие работы', sum: s.ms }
  ];
  
  let totM = 0, totO = 0;
  
  rows.forEach(r => {
    const base = r.sum.mat + r.sum.mot;
    if (base <= 0) return;
    
    totM += r.sum.mat;
    totO += r.sum.mot;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">${r.t}</td><td>${fmt(r.sum.mat)}</td><td>${fmt(r.sum.mot)}</td>`;
    tb.appendChild(tr);
  });
  
  if (s.wrap.details && s.wrap.details.length > 0) {
    s.wrap.details.forEach(detail => {
      const [name, meters, price, mat, mot, itemMarkup] = detail;
      if (mat <= 0 && mot <= 0) return;
      
      totM += mat;
      totO += mot;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td>${fmt(mat)}</td><td>${fmt(mot)}</td>`;
      tb.appendChild(tr);
    });
  }
  
  q('#cMat').textContent = fmt(totM);
  q('#cMot').textContent = fmt(totO);
  q('#cTotal').textContent = fmt(totM + totO);
}
function renderExecutors(s) {
  const container = q('#executorsContent');
  if (!container) return;
  
  let execIndex = 0;
  const allServices = [];
  
  // Пакет "Полная защита кузова" - разбиваем на услуги
  const pkgWrapMot = parseFloat(q('#pkgWrapMot')?.value) || 0;
  const pkgPrepMot = parseFloat(q('#pkgPrepMot')?.value) || 0;
  const pkgArmMot = parseFloat(q('#pkgArmMot')?.value) || 0;
  
  if (pkgWrapMot > 0 || pkgPrepMot > 0 || pkgArmMot > 0) {
    if (pkgWrapMot > 0) {
      allServices.push({ name: 'Полная защита кузова - Инсталляция пленки', mot: pkgWrapMot, idx: execIndex++ });
    }
    if (pkgPrepMot > 0) {
      allServices.push({ name: 'Полная защита кузова - Подготовка', mot: pkgPrepMot, idx: execIndex++ });
    }
    if (pkgArmMot > 0) {
      allServices.push({ name: 'Полная защита кузова - Арматурные работы', mot: pkgArmMot, idx: execIndex++ });
    }
  }
  
  // Пакет "Защита ударной части" - разбиваем на услуги
  const impactWrapMot = parseFloat(q('#impactWrapMot')?.value) || 0;
  const impactPrepMot = parseFloat(q('#impactPrepMot')?.value) || 0;
  const impactArmMot = parseFloat(q('#impactArmMot')?.value) || 0;
  
  if (impactWrapMot > 0 || impactPrepMot > 0 || impactArmMot > 0) {
    if (impactWrapMot > 0) {
      allServices.push({ name: 'Защита ударной части - Инсталляция пленки', mot: impactWrapMot, idx: execIndex++ });
    }
    if (impactPrepMot > 0) {
      allServices.push({ name: 'Защита ударной части - Подготовка', mot: impactPrepMot, idx: execIndex++ });
    }
    if (impactArmMot > 0) {
      allServices.push({ name: 'Защита ударной части - Арматурные работы', mot: impactArmMot, idx: execIndex++ });
    }
  }
  
  if (s.arm.details && s.arm.details.length > 0) {
    s.arm.details.forEach(detail => {
      allServices.push({ name: detail[0], mot: detail[2], idx: execIndex++ });
    });
  }
  
  if (s.wrap.details && s.wrap.details.length > 0) {
    s.wrap.details.forEach(detail => {
      allServices.push({ name: detail[0], mot: detail[4], idx: execIndex++ });
    });
  }
  
  if (s.det.details && s.det.details.length > 0) {
    s.det.details.forEach(detail => {
      allServices.push({ name: detail[0], mot: detail[2], idx: execIndex++ });
    });
  }
  
  if (s.gl.details && s.gl.details.length > 0) {
    s.gl.details.forEach(detail => {
      allServices.push({ name: detail[0], mot: detail[2], idx: execIndex++ });
    });
  }
  
  if (s.ms.details && s.ms.details.length > 0) {
    s.ms.details.forEach(detail => {
      allServices.push({ name: detail[0], mot: detail[2], idx: execIndex++ });
    });
  }
  
  // Проверяем, изменилось ли количество услуг
  const existingRows = container.querySelectorAll('[data-exec-id]');
  if (existingRows.length === allServices.length) {
    // Только обновляем значения зарплаты если они не были изменены вручную
    allServices.forEach(srv => {
      const baseId = `exec${srv.idx}`;
      const salaryInput = q(`#${baseId}salary`);
      if (salaryInput && salaryInput.dataset.manuallySet !== 'true') {
        salaryInput.value = srv.mot.toFixed(2);
      }
    });
    return; // НЕ перерисовываем
  }
  
  // Если количество изменилось — полная перерисовка
  let html = '';
  
  allServices.forEach(srv => {
    const baseId = `exec${srv.idx}`;
    
    html += `<div class="executor-row" data-exec-id="${baseId}">
      <div class="executor-row-header">${srv.name}</div>
      <div class="executor-fields-new">
        <div class="executor-field">
          <label>Исполнитель:</label>
          <input type="text" id="${baseId}name" placeholder="ФИО" value="">
        </div>
        <div class="executor-field">
          <label>Зарплата ():</label>
          <input type="number" id="${baseId}salary" placeholder="0" value="${srv.mot.toFixed(2)}" step="0.01" data-original-motivation="${srv.mot.toFixed(2)}">
        </div>
        <div class="executor-field">
          <label>Дата приема:</label>
          <input type="date" id="${baseId}receive" value="">
        </div>
        <div class="executor-field">
          <label>Дата выдачи:</label>
          <input type="date" id="${baseId}return" value="">
        </div>
        <div class="executor-field executor-field-note">
          <label>Примечание:</label>
          <input type="text" id="${baseId}note" placeholder="Заметки" value="">
        </div>
      </div>
      <div style="margin-top:12px;text-align:center">
        <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem;user-select:none">
          <input type="checkbox" class="add-executor-chk" data-exec-base="${baseId}" style="width:20px;height:20px;cursor:pointer;accent-color:var(--primary)">
          <span>+ Добавить исполнителя</span>
        </label>
      </div>
      <div class="extra-executors" id="${baseId}-extra"></div>
    </div>`;
  });
  
  container.innerHTML = html;
  
  // Навешиваем обработчики
  qa('.add-executor-chk').forEach(chk => {
    chk.addEventListener('change', function() {
      if (this.checked) {
        const baseId = this.getAttribute('data-exec-base');
        const extraContainer = q(`#${baseId}-extra`);
        const baseRow = this.closest('.executor-row');
        const baseSalaryInput = baseRow.querySelector(`#${baseId}salary`);
        
        // Берем ОРИГИНАЛЬНУЮ мотивацию, а не текущее значение
        const originalMotivation = parseFloat(baseSalaryInput?.getAttribute('data-original-motivation')) || 0;
        
        const extraCount = extraContainer.querySelectorAll('.extra-executor-row').length;
        
        // НЕ делим зарплату! У первого остается 100%, у нового пусто
        const newId = `${baseId}-ex${extraCount + 1}`;
        
        const row = document.createElement('div');
        row.className = 'extra-executor-row';
        row.style.cssText = 'margin-top:12px;padding:12px;background:var(--bg-tertiary);border-radius:12px;border:1px solid var(--border)';
        row.innerHTML = `
          <div class="executor-row-header" style="font-size:0.8rem;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
            <span>Исполнитель ${extraCount + 2}</span>
            <button type="button" class="btn-remove-executor" style="background:var(--danger);color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:600;transition:all 0.3s">❌ Удалить</button>
          </div>
          <div class="executor-fields-new">
            <div class="executor-field">
              <label>Исполнитель:</label>
              <input type="text" id="${newId}name" placeholder="ФИО" value="">
            </div>
            <div class="executor-field">
              <label>Зарплата ():</label>
              <input type="number" id="${newId}salary" placeholder="0" value="" step="0.01">
            </div>
            <div class="executor-field">
              <label>Дата приема:</label>
              <input type="date" id="${newId}receive" value="">
            </div>
            <div class="executor-field">
              <label>Дата выдачи:</label>
              <input type="date" id="${newId}return" value="">
            </div>
            <div class="executor-field executor-field-note">
              <label>Примечание:</label>
              <input type="text" id="${newId}note" placeholder="Заметки" value="">
            </div>
          </div>
          <div style="margin-top:12px;text-align:center">
            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:0.9rem;user-select:none">
              <input type="checkbox" class="add-executor-chk" data-exec-base="${baseId}" style="width:20px;height:20px;cursor:pointer;accent-color:var(--primary)">
              <span>+ Добавить исполнителя</span>
            </label>
          </div>
        `;
        
        extraContainer.appendChild(row);
        this.checked = false;
        
        // Обработчик на кнопку удаления
        row.querySelector('.btn-remove-executor').addEventListener('click', function() {
          if (confirm('Удалить этого исполнителя?')) {
            row.remove();
          }
        });
      }
    });
  });
}


function updateBlockSummaries(s, mu) {
  function setSummary(sid, base, markupAmt) {
    const el = document.getElementById(sid);
    if (!el) return;
    if (base === 0 && markupAmt === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const total = base + markupAmt;
    const baseEl = document.getElementById(sid + 'Base') || document.getElementById(sid.replace('Summary','') + 'SumBase');
    const markEl = document.getElementById(sid + 'Markup') || document.getElementById(sid.replace('Summary','') + 'SumMarkup');
    const totEl  = document.getElementById(sid + 'Total') || document.getElementById(sid.replace('Summary','') + 'SumTotal');
    if (baseEl) baseEl.textContent = fmt(base) + '';
    if (markEl) markEl.textContent = (markupAmt >= 0 ? '+' : '') + fmt(markupAmt) + '';
    if (totEl)  totEl.textContent  = fmt(total) + '';
  }

  const pkgBase    = s.pkg.mat + s.pkg.mot;
  const impactBase = s.impact.mat + s.impact.mot;
  const armBase    = s.arm.mat + s.arm.mot;
  const wrapBase   = s.wrap.mat + s.wrap.mot;
  const detBase    = s.det.mat + s.det.mot;
  const glBase     = s.gl.mat + s.gl.mot;
  const msBase     = s.ms.mat + s.ms.mot;

  // Наценки в рублях
  let wrapMarkupAmt = 0;
  if (s.wrap.details && s.wrap.details.length > 0) {
    s.wrap.details.forEach(d => {
      const base = d[3] + d[4];
      const mk = (d[5] && d[5] > 0) ? d[5] : (mu.wrap || 0);
      wrapMarkupAmt += r100(base * mk / 100);
    });
  } else {
    wrapMarkupAmt = r100(wrapBase * (mu.wrap || 0) / 100);
  }

  // pkg
  const pkgEl = document.getElementById('pkgSummary');
  if (pkgEl) {
    if (pkgBase === 0) { pkgEl.style.display = 'none'; }
    else {
      pkgEl.style.display = 'flex';
      const m = r100(pkgBase * (mu.pkg || 0) / 100);
      document.getElementById('pkgSumBase').textContent   = fmt(pkgBase) + '';
      document.getElementById('pkgSumMarkup').textContent = '+' + fmt(m) + '';
      document.getElementById('pkgSumTotal').textContent  = fmt(pkgBase + m) + '';
    }
  }
  // impact
  const impEl = document.getElementById('impactSummary');
  if (impEl) {
    if (impactBase === 0) { impEl.style.display = 'none'; }
    else {
      impEl.style.display = 'flex';
      const m = r100(impactBase * (mu.impact || 0) / 100);
      document.getElementById('impactSumBase').textContent   = fmt(impactBase) + '';
      document.getElementById('impactSumMarkup').textContent = '+' + fmt(m) + '';
      document.getElementById('impactSumTotal').textContent  = fmt(impactBase + m) + '';
    }
  }

  // Динамические блоки (arm/det/gl/ms через renderServiceList)
  const dynBlocks = [
    { sid: 'armSummary',  base: armBase,  mu: mu.arm  || 0 },
    { sid: 'detSummary',  base: detBase,  mu: mu.det  || 0 },
    { sid: 'glSummary',   base: glBase,   mu: mu.gl   || 0 },
    { sid: 'miscSummary', base: msBase,   mu: mu.ms   || 0 },
  ];
  dynBlocks.forEach(({ sid, base, mu: muPct }) => {
    const el = document.getElementById(sid);
    if (!el) return;
    if (base === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const m = r100(base * muPct / 100);
    const prefix = sid.replace('Summary', '');
    const baseEl = document.getElementById(prefix + 'SumBase');
    const markEl = document.getElementById(prefix + 'SumMarkup');
    const totEl  = document.getElementById(prefix + 'SumTotal');
    if (baseEl) baseEl.textContent = fmt(base) + '';
    if (markEl) markEl.textContent = '+' + fmt(m) + '';
    if (totEl)  totEl.textContent  = fmt(base + m) + '';
  });

  // wrap
  const wrapEl = document.getElementById('wrapSummary');
  if (wrapEl) {
    if (wrapBase === 0) { wrapEl.style.display = 'none'; }
    else {
      wrapEl.style.display = 'flex';
      document.getElementById('wrapSumBase').textContent   = fmt(wrapBase) + '';
      document.getElementById('wrapSumMarkup').textContent = '+' + fmt(wrapMarkupAmt) + '';
      document.getElementById('wrapSumTotal').textContent  = fmt(wrapBase + wrapMarkupAmt) + '';
    }
  }
}

function renderBadges(s, mu) {
  // Итоги по направлениям удалены, считаем только общие итоги
  
  const pkgTotal = s.pkg.mat + s.pkg.mot;
  const impactTotal = s.impact.mat + s.impact.mot;
  const armTotal = s.arm.mat + s.arm.mot;
  const wrapTotal = s.wrap.mat + s.wrap.mot;
  const detTotal = s.det.mat + s.det.mot;
  const glTotal = s.gl.mat + s.gl.mot;
  const msTotal = s.ms.mat + s.ms.mot;
  
  const baseAll = pkgTotal + impactTotal + armTotal + wrapTotal + detTotal + glTotal + msTotal;
  
  const pkgMarkup = r100(pkgTotal * (mu.pkg || 0) / 100);
  const impactMarkup = r100(impactTotal * (mu.impact || 0) / 100);
  const armMarkup = r100(armTotal * (mu.arm || 0) / 100);
  const detMarkup = r100(detTotal * (mu.det || 0) / 100);
  const glMarkup = r100(glTotal * (mu.gl || 0) / 100);
  const msMarkup = r100(msTotal * (mu.ms || 0) / 100);
  
  let wrapMarkup = 0;
  if (s.wrap.details && s.wrap.details.length > 0) {
    s.wrap.details.forEach(detail => {
      const [name, meters, price, mat, mot, itemMarkup] = detail;
      const base = mat + mot;
      const markupToUse = (itemMarkup && itemMarkup > 0) ? itemMarkup : mu.wrap;
      wrapMarkup += r100(base * (markupToUse || 0) / 100);
    });
  } else {
    wrapMarkup = r100(wrapTotal * (mu.wrap || 0) / 100);
  }
  
  const totalMarkup = pkgMarkup + impactMarkup + armMarkup + wrapMarkup + detMarkup + glMarkup + msMarkup;
  const markupWithDiscount = r100(totalMarkup * (1 - disc / 100));
  const afterMarkup = baseAll + markupWithDiscount;
  const taxK = taxCoef();
  const tax = r100(afterMarkup * taxK);
  const fin = afterMarkup + tax;
  
  updateBlockSummaries(s, mu);
  q('#grandMat').textContent = fmt(s.pkg.mat + s.impact.mat + s.arm.mat + s.wrap.mat + s.det.mat + s.gl.mat + s.ms.mat);
  q('#grandMot').textContent = fmt(s.pkg.mot + s.impact.mot + s.arm.mot + s.wrap.mot + s.det.mot + s.gl.mot + s.ms.mot);
  q('#grandBase').textContent = fmt(baseAll);
  q('#grandMarkup').textContent = fmt(markupWithDiscount);
  q('#grandTax').textContent = fmt(tax);
  q('#finalTotal').textContent = fmt(fin);
  
  if (chart) {
    chart.data.datasets[0].data = [
      s.pkg.mat + s.impact.mat + s.arm.mat + s.wrap.mat + s.det.mat + s.gl.mat + s.ms.mat,
      s.pkg.mot + s.impact.mot + s.arm.mot + s.wrap.mot + s.det.mot + s.gl.mot + s.ms.mot,
      markupWithDiscount,
      tax
    ];
    chart.update('none');
  }
}

function renderAll() {
  const s = collectAll();
  const mu = markups();
  renderBadges(s, mu);
  renderKP(s, mu);
  renderCost(s);
  renderExecutors(s);
  highlightMarkupFields(s, mu);
}

function highlightMarkupFields(s, mu) {
  const checks = [
    { sum: s.pkg.mat + s.pkg.mot, markup: mu.pkg, field: '#pkgMarkup' },
    { sum: s.impact.mat + s.impact.mot, markup: mu.impact, field: '#impactMarkup' },
    { sum: s.arm.mat + s.arm.mot, markup: mu.arm, field: '#armMarkup' },
    { sum: s.wrap.mat + s.wrap.mot, markup: mu.wrap, field: '#wrapMarkup' },
    { sum: s.det.mat + s.det.mot, markup: mu.det, field: '#detMarkup' },
    { sum: s.gl.mat + s.gl.mot, markup: mu.gl, field: '#glMarkup' },
    { sum: s.ms.mat + s.ms.mot, markup: mu.ms, field: '#miscMarkup' }
  ];
  
  checks.forEach(c => {
    const field = q(c.field);
    if (!field) return;
    if (c.sum > 0 && (!c.markup || c.markup === 0)) {
      field.classList.add('markup-warning');
    } else {
      field.classList.remove('markup-warning');
    }
  });
}

function initChart() {
  const ctx = q('#pieChart')?.getContext('2d');
  if (!ctx || !window.Chart) return;
  
  // Получаем цвет текста из CSS переменной (адаптивно к теме)
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f1f5f9';
  
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Материалы', 'Мотивация', 'Наценка', 'Налог'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 13, family: 'Inter', weight: '600' },
            padding: 12,
            color: textColor,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { size: 12, family: 'Inter', weight: '600' },
          bodyFont: { size: 11, family: 'Inter' },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return context.label + ': ' + fmt(context.parsed) + '';
            }
          }
        }
      }
    }
  });
}

/**
 * calculator-render.js
 * Все функции рендеринга: списки услуг, таблицы КП/себестоимости, исполнители, итоги
 * Зависит от: calculator-data.js, calculator-engine.js
 */

// ── Инициализация Chart.js ────────────────────────────────────────
function initChart() {
  const ctx = q('#pieChart')?.getContext('2d');
  if (!ctx || !window.Chart) return;

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
              return context.label + ': ' + fmt(context.parsed) + ' ₽';
            }
          }
        }
      }
    }
  });
}

// ── Рендер списка услуг ───────────────────────────────────────────
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
          <div class="form-group"><label>Материалы (₽):</label><input type="number" class="${classPrefix}-mat" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" class="${classPrefix}-mot" placeholder="0" step="0.01"></div>
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
        ${[10,20,30,40,50,60,70,80,90,100].map(v =>
          `<span class="chip" data-markup-target="#${classPrefix}Markup">${v}</span>`
        ).join('')}
      </div>
    </div>`;

  container.innerHTML = html;
}

// ── Рендер содержимого блока оклейки ─────────────────────────────
function renderWrapContent() {
  const container = q('#wrapContent');
  let html = `<h3 style="margin-bottom:10px;font-size:1.05rem;font-weight:700">PPF</h3>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="ppfClearChk"><label for="ppfClearChk">PPF прозрачный вкруг</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="ppfClearM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр (₽):</label><input type="number" id="ppfClearPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" id="ppfClearMot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity"><input type="checkbox" id="ppfClearComplex"><label for="ppfClearComplex">Усложнение +10%</label></div>
      </div>
    </div>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="ppfColorChk"><label for="ppfColorChk">PPF цветной вкруг</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="ppfColorM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр (₽):</label><input type="number" id="ppfColorPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" id="ppfColorMot" placeholder="0" step="0.01"></div>
        </div>
        <div class="service-complexity"><input type="checkbox" id="ppfColorComplex"><label for="ppfColorComplex">Усложнение +10%</label></div>
      </div>
    </div>
    <div class="service-item">
      <div class="service-header"><input type="checkbox" id="ppfMatChk"><label for="ppfMatChk">PPF матовый вкруг</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" id="ppfMatM" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр (₽):</label><input type="number" id="ppfMatPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" id="ppfMatMot" placeholder="0" step="0.01"></div>
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
          <div class="form-group"><label>Цена за метр (₽):</label><input type="number" id="pvcFullPrice" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" id="pvcFullMot" placeholder="0" step="0.01"></div>
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
        ${[10,20,30,40,50,60,70,80,90,100].map(v =>
          `<span class="chip" data-markup-target="#wrapMarkup">${v}</span>`
        ).join('')}
      </div>
    </div>`;

  container.innerHTML = html;
}

// ── Рендер частичных списков PPF/PVC ─────────────────────────────
function renderPartialLists() {
  const ppf = q('#ppfPartContent');
  const pvc = q('#pvcPartContent');
  let ppfHtml = '', pvcHtml = '';

  partElements.forEach((name, idx) => {
    const chips = [10,20,30,40,50,60,70,80,90,100].map(v =>
      `<span class="chip" data-ppf-markup="${idx}">${v}</span>`
    ).join('');
    const chipsVpc = [10,20,30,40,50,60,70,80,90,100].map(v =>
      `<span class="chip" data-pvc-markup="${idx}">${v}</span>`
    ).join('');

    ppfHtml += `<div class="service-item">
      <div class="service-header"><input type="checkbox" class="ppf-part-chk" id="ppfp${idx}"><label for="ppfp${idx}">${name}</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" class="ppf-part-m" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр (₽):</label><input type="number" class="ppf-part-price" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" class="ppf-part-mot" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Своя наценка (%):</label><input type="number" class="ppf-part-markup" placeholder="0"></div>
        </div>
        <div class="chips" style="margin-top:10px">${chips}</div>
      </div>
    </div>`;

    pvcHtml += `<div class="service-item">
      <div class="service-header"><input type="checkbox" class="pvc-part-chk" id="pvcp${idx}"><label for="pvcp${idx}">${name}</label></div>
      <div class="service-body">
        <div class="service-fields">
          <div class="form-group"><label>Метры (м):</label><input type="number" class="pvc-part-m" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Цена за метр (₽):</label><input type="number" class="pvc-part-price" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Мотивация (₽):</label><input type="number" class="pvc-part-mot" placeholder="0" step="0.01"></div>
          <div class="form-group"><label>Своя наценка (%):</label><input type="number" class="pvc-part-markup" placeholder="0"></div>
        </div>
        <div class="chips" style="margin-top:10px">${chipsVpc}</div>
      </div>
    </div>`;
  });

  ppf.innerHTML = ppfHtml;
  pvc.innerHTML = pvcHtml;
}

// ── Добавление строки доп. затраты ───────────────────────────────
function addCostRow(prefix) {
  costCounter++;
  const container = q(`#${prefix}CostsContent`);
  const row = document.createElement('div');
  row.className = 'cost-row';
  row.innerHTML = `
    <div class="form-group">
      <input type="text" placeholder="Название затраты" class="${prefix}-cost-name">
      <input type="number" placeholder="Сумма (₽)" class="${prefix}-cost-val" step="0.01">
    </div>
    <button type="button" onclick="this.closest('.cost-row').remove();renderAll()">❌</button>
  `;
  container.appendChild(row);
  renderAll();
}

// ── Добавление динамической строки услуги ────────────────────────
function addDynRow(id, cls) {
  const c = q(id);
  const d = document.createElement('div');
  d.className = 'service-item';
  dynCounter++;

  if (cls === 'wrap') {
    d.innerHTML = `<div class="service-header">
      <input type="checkbox" checked id="dyn${cls}${dynCounter}">
      <label for="dyn${cls}${dynCounter}"><input type="text" placeholder="Название услуги" style="border:none;background:transparent;padding:0;font-weight:600;font-size:.95rem;color:var(--text);width:100%"></label>
    </div>
    <div class="service-body open">
      <div class="service-fields">
        <div class="form-group"><label>Метры (м):</label><input type="number" class="${cls}-m" placeholder="0" step="0.01"></div>
        <div class="form-group"><label>Цена за метр (₽):</label><input type="number" class="${cls}-price" placeholder="0" step="0.01"></div>
        <div class="form-group"><label>Мотивация (₽):</label><input type="number" class="${cls}-mot" placeholder="0" step="0.01"></div>
      </div>
      <div class="service-complexity">
        <input type="checkbox" class="${cls}-complex" id="dyn${cls}${dynCounter}c">
        <label for="dyn${cls}${dynCounter}c">Усложнение +10%</label>
      </div>
    </div>`;
  } else {
    d.innerHTML = `<div class="service-header">
      <input type="checkbox" checked id="dyn${cls}${dynCounter}">
      <label for="dyn${cls}${dynCounter}"><input type="text" placeholder="Название услуги" style="border:none;background:transparent;padding:0;font-weight:600;font-size:.95rem;color:var(--text);width:100%"></label>
    </div>
    <div class="service-body open">
      <div class="service-fields">
        <div class="form-group"><label>Материалы (₽):</label><input type="number" class="${cls}-mat" placeholder="0" step="0.01"></div>
        <div class="form-group"><label>Мотивация (₽):</label><input type="number" class="${cls}-mot" placeholder="0" step="0.01"></div>
      </div>
      <div class="service-complexity">
        <input type="checkbox" class="${cls}-complex" id="dyn${cls}${dynCounter}c">
        <label for="dyn${cls}${dynCounter}c">Усложнение +10%</label>
      </div>
    </div>`;
  }
  c.appendChild(d);
}

// ── Тогглы раскрытия услуг ────────────────────────────────────────
function initServiceToggles() {
  qa('.service-item').forEach(item => {
    const chk    = item.querySelector('.service-header input[type="checkbox"]');
    const body   = item.querySelector('.service-body');
    const header = item.querySelector('.service-header');
    if (!chk || !body) return;

    header.onclick = function(e) {
      if (e.target === chk || e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
      chk.click();
    };
    chk.onchange = function() {
      body.classList.toggle('open', chk.checked);
    };
  });

  ['ppfPartChk','pvcPartChk','pkgCostsChk','impactCostsChk','armCostsChk','wrapCostsChk','detCostsChk','glCostsChk','miscCostsChk'].forEach(id => {
    const chk = q(`#${id}`);
    if (!chk) return;
    const content = q(`#${id.replace('Chk', 'Content')}`);
    let btnId = id.replace('Chk', '').replace('Costs', 'Cost');
    btnId = btnId.charAt(0).toUpperCase() + btnId.slice(1);
    const btn = q(`#btnAdd${btnId}`);
    if (!content) return;

    chk.onchange = function() {
      content.classList.toggle('open', chk.checked);
      if (btn) btn.style.display = chk.checked ? 'block' : 'none';
    };
  });
}

// ── Рендер КП ────────────────────────────────────────────────────
function renderKP(s, mu) {
  const tb = q('#kpTable tbody');
  if (!tb) return;
  tb.innerHTML = '';
  const taxK = taxCoef();
  let tot = 0;

  const addRow = (name, base, markupPct) => {
    if (base <= 0) return;
    const markupAmount = r100(base * (markupPct || 0) / 100);
    const mWithDisc    = r100(markupAmount * (1 - disc / 100));
    let pr = r100((base + mWithDisc) * (1 + taxK));
    tot += pr;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
    tb.appendChild(tr);
  };

  addRow('Полная защита вкруг',   s.pkg.mat + s.pkg.mot,       mu.pkg);
  addRow('Защита ударной части',  s.impact.mat + s.impact.mot, mu.impact);

  if (s.arm.details?.length) {
    const armBase = s.arm.mat + s.arm.mot;
    s.arm.details.forEach(([name]) => {
      const frac = armBase / s.arm.details.length;
      const mAmt  = r100(frac * (mu.arm || 0) / 100);
      const mDisc = r100(mAmt * (1 - disc / 100));
      const pr    = r100((frac + mDisc) * (1 + taxK));
      tot += pr;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }

  if (s.wrap.details?.length) {
    s.wrap.details.forEach(([name, , , mat, mot, itemMarkup]) => {
      const base = mat + mot;
      if (base <= 0) return;
      const mkPct  = (itemMarkup && itemMarkup > 0) ? itemMarkup : mu.wrap;
      const mAmt   = r100(base * (mkPct || 0) / 100);
      const mDisc  = r100(mAmt * (1 - disc / 100));
      const pr     = r100((base + mDisc) * (1 + taxK));
      tot += pr;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
      tb.appendChild(tr);
    });
  }

  ['det','gl','ms'].forEach(key => {
    const base = s[key].mat + s[key].mot;
    const muKey = key === 'ms' ? mu.ms : mu[key];
    if (s[key].details?.length) {
      s[key].details.forEach(([name]) => {
        const frac = base / s[key].details.length;
        const mAmt  = r100(frac * (muKey || 0) / 100);
        const mDisc = r100(mAmt * (1 - disc / 100));
        const pr    = r100((frac + mDisc) * (1 + taxK));
        tot += pr;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="text-align:left">${name}</td><td style="text-align:left">${getServiceDescription(name)}</td><td>${fmt(pr)}</td>`;
        tb.appendChild(tr);
      });
    }
  });

  q('#kpTotal').textContent = fmt(tot);
}

// ── Рендер себестоимости ─────────────────────────────────────────
function renderCost(s) {
  const tb = q('#costTable tbody');
  if (!tb) return;
  tb.innerHTML = '';
  let totM = 0, totO = 0;

  [
    { t: 'Полная защита вкруг',  sum: s.pkg },
    { t: 'Защита ударной части', sum: s.impact },
    { t: 'Арматурные работы',    sum: s.arm },
    { t: 'Детейлинг',            sum: s.det },
    { t: 'Стёкла',               sum: s.gl },
    { t: 'Прочие работы',        sum: s.ms }
  ].forEach(r => {
    if (r.sum.mat + r.sum.mot <= 0) return;
    totM += r.sum.mat; totO += r.sum.mot;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">${r.t}</td><td>${fmt(r.sum.mat)}</td><td>${fmt(r.sum.mot)}</td>`;
    tb.appendChild(tr);
  });

  s.wrap.details?.forEach(([name, , , mat, mot]) => {
    if (mat <= 0 && mot <= 0) return;
    totM += mat; totO += mot;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left">${name}</td><td>${fmt(mat)}</td><td>${fmt(mot)}</td>`;
    tb.appendChild(tr);
  });

  q('#cMat').textContent   = fmt(totM);
  q('#cMot').textContent   = fmt(totO);
  q('#cTotal').textContent = fmt(totM + totO);
}

// ── Рендер исполнителей ──────────────────────────────────────────
function renderExecutors(s) {
  const container = q('#executorsContent');
  if (!container) return;

  let execIndex = 0;
  const allServices = [];

  const pkgWrapMot   = parseFloat(q('#pkgWrapMot')?.value)    || 0;
  const pkgPrepMot   = parseFloat(q('#pkgPrepMot')?.value)    || 0;
  const pkgArmMot    = parseFloat(q('#pkgArmMot')?.value)     || 0;
  if (pkgWrapMot > 0 || pkgPrepMot > 0 || pkgArmMot > 0) {
    if (pkgWrapMot > 0)  allServices.push({ name: 'Полная защита вкруг - Инсталляция пленки', mot: pkgWrapMot,  idx: execIndex++ });
    if (pkgPrepMot > 0)  allServices.push({ name: 'Полная защита вкруг - Подготовка',          mot: pkgPrepMot,  idx: execIndex++ });
    if (pkgArmMot > 0)   allServices.push({ name: 'Полная защита вкруг - Арматурные работы',   mot: pkgArmMot,   idx: execIndex++ });
  }

  const impactWrapMot = parseFloat(q('#impactWrapMot')?.value) || 0;
  const impactPrepMot = parseFloat(q('#impactPrepMot')?.value) || 0;
  const impactArmMot  = parseFloat(q('#impactArmMot')?.value)  || 0;
  if (impactWrapMot > 0 || impactPrepMot > 0 || impactArmMot > 0) {
    if (impactWrapMot > 0) allServices.push({ name: 'Защита ударной части - Инсталляция пленки', mot: impactWrapMot, idx: execIndex++ });
    if (impactPrepMot > 0) allServices.push({ name: 'Защита ударной части - Подготовка',          mot: impactPrepMot, idx: execIndex++ });
    if (impactArmMot > 0)  allServices.push({ name: 'Защита ударной части - Арматурные работы',   mot: impactArmMot,  idx: execIndex++ });
  }

  s.arm.details?.forEach(d  => allServices.push({ name: d[0], mot: d[2], idx: execIndex++ }));
  s.wrap.details?.forEach(d => allServices.push({ name: d[0], mot: d[4], idx: execIndex++ }));
  s.det.details?.forEach(d  => allServices.push({ name: d[0], mot: d[2], idx: execIndex++ }));
  s.gl.details?.forEach(d   => allServices.push({ name: d[0], mot: d[2], idx: execIndex++ }));
  s.ms.details?.forEach(d   => allServices.push({ name: d[0], mot: d[2], idx: execIndex++ }));

  // Не перерисовываем если количество не изменилось
  const existingRows = container.querySelectorAll('[data-exec-id]');
  if (existingRows.length === allServices.length) {
    allServices.forEach(srv => {
      const salaryInput = q(`#exec${srv.idx}salary`);
      if (salaryInput && salaryInput.dataset.manuallySet !== 'true') {
        salaryInput.value = srv.mot.toFixed(2);
      }
    });
    return;
  }

  let html = '';
  allServices.forEach(srv => {
    const baseId = `exec${srv.idx}`;
    html += `<div class="executor-row" data-exec-id="${baseId}">
      <div class="executor-row-header">${srv.name}</div>
      <div class="executor-fields-new">
        <div class="executor-field"><label>Исполнитель:</label><input type="text" id="${baseId}name" placeholder="ФИО" value=""></div>
        <div class="executor-field"><label>Зарплата (₽):</label><input type="number" id="${baseId}salary" placeholder="0" value="${srv.mot.toFixed(2)}" step="0.01" data-original-motivation="${srv.mot.toFixed(2)}"></div>
        <div class="executor-field"><label>Дата приема:</label><input type="date" id="${baseId}receive" value=""></div>
        <div class="executor-field"><label>Дата выдачи:</label><input type="date" id="${baseId}return" value=""></div>
        <div class="executor-field executor-field-note"><label>Примечание:</label><input type="text" id="${baseId}note" placeholder="Заметки" value=""></div>
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

  qa('.add-executor-chk').forEach(chk => {
    chk.addEventListener('change', function() {
      if (!this.checked) return;
      const baseId        = this.getAttribute('data-exec-base');
      const extraContainer = q(`#${baseId}-extra`);
      const extraCount    = extraContainer.querySelectorAll('.extra-executor-row').length;
      const newId         = `${baseId}-ex${extraCount + 1}`;

      const row = document.createElement('div');
      row.className = 'extra-executor-row';
      row.style.cssText = 'margin-top:12px;padding:12px;background:var(--bg-tertiary);border-radius:12px;border:1px solid var(--border)';
      row.innerHTML = `
        <div class="executor-row-header" style="font-size:0.8rem;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <span>Исполнитель ${extraCount + 2}</span>
          <button type="button" class="btn-remove-executor" style="background:var(--danger);color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:600">❌ Удалить</button>
        </div>
        <div class="executor-fields-new">
          <div class="executor-field"><label>Исполнитель:</label><input type="text" id="${newId}name" placeholder="ФИО" value=""></div>
          <div class="executor-field"><label>Зарплата (₽):</label><input type="number" id="${newId}salary" placeholder="0" value="" step="0.01"></div>
          <div class="executor-field"><label>Дата приема:</label><input type="date" id="${newId}receive" value=""></div>
          <div class="executor-field"><label>Дата выдачи:</label><input type="date" id="${newId}return" value=""></div>
          <div class="executor-field executor-field-note"><label>Примечание:</label><input type="text" id="${newId}note" placeholder="Заметки" value=""></div>
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

      row.querySelector('.btn-remove-executor').addEventListener('click', function() {
        if (confirm('Удалить этого исполнителя?')) row.remove();
      });
    });
  });
}

// ── Мини-итоги по блокам ─────────────────────────────────────────
function updateBlockSummaries(s, mu) {
  const pkgBase    = s.pkg.mat    + s.pkg.mot;
  const impactBase = s.impact.mat + s.impact.mot;
  const armBase    = s.arm.mat    + s.arm.mot;
  const wrapBase   = s.wrap.mat   + s.wrap.mot;
  const detBase    = s.det.mat    + s.det.mot;
  const glBase     = s.gl.mat     + s.gl.mot;
  const msBase     = s.ms.mat     + s.ms.mot;

  let wrapMarkupAmt = 0;
  if (s.wrap.details?.length) {
    s.wrap.details.forEach(d => {
      const base = d[3] + d[4];
      const mk   = (d[5] && d[5] > 0) ? d[5] : (mu.wrap || 0);
      wrapMarkupAmt += r100(base * mk / 100);
    });
  } else {
    wrapMarkupAmt = r100(wrapBase * (mu.wrap || 0) / 100);
  }

  const showSummary = (sid, base, markupPct) => {
    const el = document.getElementById(sid);
    if (!el) return;
    const m = r100(base * markupPct / 100);
    if (base === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const prefix = sid.replace('Summary', '');
    const baseEl = document.getElementById(prefix + 'SumBase');
    const markEl = document.getElementById(prefix + 'SumMarkup');
    const totEl  = document.getElementById(prefix + 'SumTotal');
    if (baseEl) baseEl.textContent = fmt(base) + ' ₽';
    if (markEl) markEl.textContent = '+' + fmt(m) + ' ₽';
    if (totEl)  totEl.textContent  = fmt(base + m) + ' ₽';
  };

  showSummary('pkgSummary',    pkgBase,    mu.pkg    || 0);
  showSummary('impactSummary', impactBase, mu.impact || 0);
  showSummary('armSummary',    armBase,    mu.arm    || 0);
  showSummary('detSummary',    detBase,    mu.det    || 0);
  showSummary('glSummary',     glBase,     mu.gl     || 0);
  showSummary('miscSummary',   msBase,     mu.ms     || 0);

  const wrapEl = document.getElementById('wrapSummary');
  if (wrapEl) {
    if (wrapBase === 0) { wrapEl.style.display = 'none'; }
    else {
      wrapEl.style.display = 'flex';
      document.getElementById('wrapSumBase').textContent   = fmt(wrapBase) + ' ₽';
      document.getElementById('wrapSumMarkup').textContent = '+' + fmt(wrapMarkupAmt) + ' ₽';
      document.getElementById('wrapSumTotal').textContent  = fmt(wrapBase + wrapMarkupAmt) + ' ₽';
    }
  }
}

// ── Итоговые бейджи + диаграмма ──────────────────────────────────
function renderBadges(s, mu) {
  const pkgTotal    = s.pkg.mat    + s.pkg.mot;
  const impactTotal = s.impact.mat + s.impact.mot;
  const armTotal    = s.arm.mat    + s.arm.mot;
  const wrapTotal   = s.wrap.mat   + s.wrap.mot;
  const detTotal    = s.det.mat    + s.det.mot;
  const glTotal     = s.gl.mat     + s.gl.mot;
  const msTotal     = s.ms.mat     + s.ms.mot;

  const baseAll = pkgTotal + impactTotal + armTotal + wrapTotal + detTotal + glTotal + msTotal;

  let wrapMarkup = 0;
  if (s.wrap.details?.length) {
    s.wrap.details.forEach(([, , , mat, mot, itemMarkup]) => {
      const base    = mat + mot;
      const mkToUse = (itemMarkup && itemMarkup > 0) ? itemMarkup : mu.wrap;
      wrapMarkup += r100(base * (mkToUse || 0) / 100);
    });
  } else {
    wrapMarkup = r100(wrapTotal * (mu.wrap || 0) / 100);
  }

  const totalMarkup      = r100(pkgTotal * (mu.pkg || 0) / 100) +
                           r100(impactTotal * (mu.impact || 0) / 100) +
                           r100(armTotal * (mu.arm || 0) / 100) +
                           wrapMarkup +
                           r100(detTotal * (mu.det || 0) / 100) +
                           r100(glTotal * (mu.gl || 0) / 100) +
                           r100(msTotal * (mu.ms || 0) / 100);
  const markupWithDisc   = r100(totalMarkup * (1 - disc / 100));
  const afterMarkup      = baseAll + markupWithDisc;
  const taxK             = taxCoef();
  const tax              = r100(afterMarkup * taxK);
  const fin              = afterMarkup + tax;

  updateBlockSummaries(s, mu);

  q('#grandMat')?.textContent  !== undefined && (q('#grandMat').textContent  = fmt(s.pkg.mat + s.impact.mat + s.arm.mat + s.wrap.mat + s.det.mat + s.gl.mat + s.ms.mat));
  q('#grandMot')?.textContent  !== undefined && (q('#grandMot').textContent  = fmt(s.pkg.mot + s.impact.mot + s.arm.mot + s.wrap.mot + s.det.mot + s.gl.mot + s.ms.mot));
  q('#grandBase')?.textContent  !== undefined && (q('#grandBase').textContent  = fmt(baseAll));
  q('#grandMarkup')?.textContent !== undefined && (q('#grandMarkup').textContent = fmt(markupWithDisc));
  q('#grandTax')?.textContent   !== undefined && (q('#grandTax').textContent   = fmt(tax));
  q('#finalTotal')?.textContent !== undefined && (q('#finalTotal').textContent = fmt(fin));

  if (chart) {
    chart.data.datasets[0].data = [
      s.pkg.mat + s.impact.mat + s.arm.mat + s.wrap.mat + s.det.mat + s.gl.mat + s.ms.mat,
      s.pkg.mot + s.impact.mot + s.arm.mot + s.wrap.mot + s.det.mot + s.gl.mot + s.ms.mot,
      markupWithDisc,
      tax
    ];
    chart.update('none');
  }
}

// ── Подсветка полей наценки ───────────────────────────────────────
function highlightMarkupFields(s, mu) {
  [
    { sum: s.pkg.mat    + s.pkg.mot,    markup: mu.pkg,    field: '#pkgMarkup' },
    { sum: s.impact.mat + s.impact.mot, markup: mu.impact, field: '#impactMarkup' },
    { sum: s.arm.mat    + s.arm.mot,    markup: mu.arm,    field: '#armMarkup' },
    { sum: s.wrap.mat   + s.wrap.mot,   markup: mu.wrap,   field: '#wrapMarkup' },
    { sum: s.det.mat    + s.det.mot,    markup: mu.det,    field: '#detMarkup' },
    { sum: s.gl.mat     + s.gl.mot,     markup: mu.gl,     field: '#glMarkup' },
    { sum: s.ms.mat     + s.ms.mot,     markup: mu.ms,     field: '#miscMarkup' }
  ].forEach(({ sum, markup, field }) => {
    const el = q(field);
    if (!el) return;
    el.classList.toggle('markup-warning', sum > 0 && (!markup || markup === 0));
  });
}

// ── Главная функция рендеринга ────────────────────────────────────
function renderAll() {
  const s  = collectAll();
  const mu = markups();
  renderBadges(s, mu);
  renderKP(s, mu);
  renderCost(s);
  renderExecutors(s);
  highlightMarkupFields(s, mu);
}

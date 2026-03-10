/**
 * calculator-pdf.js — v1.1
 * Зависит от: calculator-data.js, calculator-engine.js
 * Внешние: jsPDF, html2canvas
 */

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.applyKPBranding = function(isTrial, studioSettings, studioName) {
  studioSettings = studioSettings || {};
  studioName = studioName || '';
  const headerEl = document.getElementById('kpBrandHeader');
  const footerEl = document.getElementById('kpBrandFooter');
  if (!headerEl) return;
  if (isTrial) return;

  const phone   = studioSettings.kp_phone   || studioSettings.phone   || '';
  const website = studioSettings.kp_website || studioSettings.website || '';
  const name    = studioSettings.kp_name    || studioName || '';
  const logo    = studioSettings.kp_logo    || null;

  if (logo) {
    headerEl.innerHTML =
      `<div style="max-height:60px;max-width:180px;overflow:hidden">` +
        `<img src="${logo}" alt="logo" style="max-height:60px;max-width:180px;object-fit:contain;display:block">` +
      `</div>` +
      `<div style="text-align:right;font-size:8px;color:#475569;line-height:1.9">` +
        (name    ? `<div style="font-weight:800;font-size:9px;color:#0f172a">${esc(name)}</div>` : '') +
        (phone   ? `<div>📞 ${esc(phone)}</div>`   : '') +
        (website ? `<div>🌐 ${esc(website)}</div>` : '') +
      `</div>`;
  } else if (name) {
    headerEl.innerHTML =
      `<div style="font-size:22px;font-weight:900;letter-spacing:-1px;color:#0f172a">${esc(name)}</div>` +
      `<div style="text-align:right;font-size:8px;color:#475569;line-height:1.9">` +
        (phone   ? `<div>📞 ${esc(phone)}</div>`   : '') +
        (website ? `<div>🌐 ${esc(website)}</div>` : '') +
      `</div>`;
  } else {
    headerEl.innerHTML = `<div style="font-size:14px;font-weight:700;color:#94a3b8;font-style:italic">Настройте брендинг в разделе «Настройки»</div>`;
  }

  if (footerEl) {
    footerEl.innerHTML =
      `<div style="font-size:7.5px;color:#94a3b8;display:flex;justify-content:space-between;align-items:center;width:100%">` +
        `<span style="color:#cbd5e1">Создано в Keep1R CRM</span>` +
        `<span style="display:flex;gap:14px;white-space:nowrap">` +
          (name    ? `<span style="font-weight:700;color:#475569">${esc(name)}</span>` : '') +
          (phone   ? `<span>${esc(phone)}</span>`   : '') +
          (website ? `<span>${esc(website)}</span>` : '') +
        `</span>` +
      `</div>`;
  }
};

function exportPDF(blockId, filename) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || !window.html2canvas) {
    alert('Библиотеки PDF загружаются...');
    return;
  }
  
  const holder = q('#pdfTemplates');
  const block = q(blockId);
  const orig = holder.style.display;
  holder.style.display = 'block';
  holder.style.position = 'absolute';
  holder.style.left = '-9999px';
  
  setTimeout(() => {
    html2canvas(block, { scale: 2, useCORS: true, backgroundColor: '#fff' }).then(canvas => {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const iw = canvas.width;
      const ih = canvas.height;
      const ratio = Math.min(pw / iw, ph / ih);
      const sw = iw * ratio;
      const sh = ih * ratio;
      const x = (pw - sw) / 2;
      const y = 20;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, sw, Math.min(sh, ph - 40));
      pdf.save(filename);
    }).catch(err => {
      alert('Ошибка создания PDF: ' + err.message);
    }).finally(() => {
      holder.style.display = orig;
    });
  }, 200);
}
function showTrialWatermark() {
  if (!currentProfile) return;
  
  // Если оплачен - скрываем водяные знаки
  if (currentProfile.is_paid) {
    document.querySelectorAll('.trial-watermark').forEach(w => w.style.display = 'none');
    return;
  }
  
  // Если триал - показываем водяные знаки
  const trialEnd = currentProfile.trial_ends_at ? new Date(currentProfile.trial_ends_at) : null;
  if (!trialEnd) return;
  
  const dateStr = trialEnd.toLocaleDateString('ru-RU');
  const watermarkText = `ПРОБНАЯ ВЕРСИЯ ДО ${dateStr}`;
  
  document.querySelectorAll('.trial-watermark').forEach(w => {
    w.textContent = watermarkText;
    w.style.display = 'block';
  });
}
function prepKP() {
  showTrialWatermark();

  // Применяем брендинг студии
  if (currentProfile && window.applyKPBranding) {
    const isTrial = !currentProfile.is_paid;
    applyKPBranding(isTrial, currentProfile.settings || {}, currentProfile.studio_name || '');
  }
  const tb = q('#pdfKPTBody');
  if (!tb) return;
  tb.innerHTML = '';
  
  qa('#kpTable tbody tr').forEach(tr => {
    const t = tr.children[0].textContent.trim();
    const d = tr.children[1].textContent.trim();
    const p = tr.children[2].textContent.trim();
    const r = document.createElement('tr');
    r.innerHTML = `<td style="width:25%">${t}</td><td style="width:50%">${d || '—'}</td><td style="width:25%">${p}</td>`;
    tb.appendChild(r);
  });
  
  q('#pdfKPTotal').textContent = q('#kpTotal')?.textContent || '0,00';
  
  const br = q('#brandManual').classList.contains('invis') ? q('#brand').value : q('#brandManual').value;
  const md = q('#modelManual').classList.contains('invis') ? q('#model').value : q('#modelManual').value;
  const yr = q('#year').value || '—';
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU');
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const payMode = q('input[name=payMode]:checked')?.value;
const payText = payMode === 'cash' ? 'Наличные' : payMode === 'card' ? 'Карта или ИП' : 'ООО';
  
  q('#pdfKPMeta').innerHTML = `Автомобиль: ${br || '—'} ${md || '—'} ${yr}<br>Дата: ${dateStr} ${timeStr}<br><b><i>Условия оплаты: ${payText}</i></b>`;
}

function prepCost() {
  showTrialWatermark();
  const tb = q('#pdfCostTBody');
  if (!tb) return;
  tb.innerHTML = '';
  
  qa('#costTable tbody tr').forEach(tr => {
    const c = tr.children;
    const r = document.createElement('tr');
    r.innerHTML = `<td>${c[0].textContent.trim()}</td><td>${c[1].textContent.trim()}</td><td>${c[2].textContent.trim()}</td>`;
    tb.appendChild(r);
  });
  
  q('#pdfCM').textContent = q('#cMat')?.textContent || '0,00';
  q('#pdfCO').textContent = q('#cMot')?.textContent || '0,00';
  
  const br = q('#brandManual').classList.contains('invis') ? q('#brand').value : q('#brandManual').value;
  const md = q('#modelManual').classList.contains('invis') ? q('#model').value : q('#modelManual').value;
  const yr = q('#year').value || '—';
  
  q('#pdfCostMeta').textContent = `Автомобиль: ${br || '—'} ${md || '—'} ${yr}`;
}

function prepExecutors() {
  showTrialWatermark();
  const tb = q('#pdfExecutorsTBody');
  if (!tb) return;
  tb.innerHTML = '';
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  qa('#executorsContent .executor-row').forEach(row => {
    const name = row.querySelector('.executor-row-header')?.textContent?.trim() || '';
    
    // Основной исполнитель
    const baseId = row.getAttribute('data-exec-id');
    if (baseId) {
      const executor = row.querySelector(`#${baseId}name`)?.value || '';
      const receive = row.querySelector(`#${baseId}receive`)?.value || todayStr;
      const returnDate = row.querySelector(`#${baseId}return`)?.value || '';
      const note = row.querySelector(`#${baseId}note`)?.value || '';
      
      if (executor) {
        const r = document.createElement('tr');
        r.innerHTML = `<td>${name}</td><td>${executor}</td><td>${receive}</td><td>${returnDate}</td><td>${note}</td>`;
        tb.appendChild(r);
      }
    }
    
    // Дополнительные исполнители
    const extraContainer = row.querySelector('.extra-executors');
    if (extraContainer) {
      extraContainer.querySelectorAll('.extra-executor-row').forEach(extraRow => {
        const extraName = extraRow.querySelector('input[id*="name"]')?.value || '';
        const extraReceive = extraRow.querySelector('input[id*="receive"]')?.value || todayStr;
        const extraReturn = extraRow.querySelector('input[id*="return"]')?.value || '';
        const extraNote = extraRow.querySelector('input[id*="note"]')?.value || '';
        
        if (extraName) {
          const r = document.createElement('tr');
          r.innerHTML = `<td>${name}</td><td>${extraName}</td><td>${extraReceive}</td><td>${extraReturn}</td><td>${extraNote}</td>`;
          tb.appendChild(r);
        }
      });
    }
  });
  
  const br = q('#brandManual').classList.contains('invis') ? q('#brand').value : q('#brandManual').value;
  const md = q('#modelManual').classList.contains('invis') ? q('#model').value : q('#modelManual').value;
  const yr = q('#year').value || '—';
  
  q('#pdfExecutorsMeta').textContent = `Автомобиль: ${br || '—'} ${md || '—'} ${yr}`;
}

function prepExecutorsWithSalary() {
  showTrialWatermark();
  const tb = q('#pdfExecutorsWithSalaryTBody');
  if (!tb) return;
  tb.innerHTML = '';
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  qa('#executorsContent .executor-row').forEach(row => {
    const name = row.querySelector('.executor-row-header')?.textContent?.trim() || '';
    
    // Основной исполнитель
    const baseId = row.getAttribute('data-exec-id');
    if (baseId) {
      const executor = row.querySelector(`#${baseId}name`)?.value || '';
      const salary = row.querySelector(`#${baseId}salary`)?.value || '0';
      const receive = row.querySelector(`#${baseId}receive`)?.value || todayStr;
      const returnDate = row.querySelector(`#${baseId}return`)?.value || '';
      const note = row.querySelector(`#${baseId}note`)?.value || '';
      
      if (executor) {
        const r = document.createElement('tr');
        r.innerHTML = `<td>${name}</td><td>${executor}</td><td>${fmt(parseFloat(salary))}</td><td>${receive}</td><td>${returnDate}</td><td>${note}</td>`;
        tb.appendChild(r);
      }
    }
    
    // Дополнительные исполнители
    const extraContainer = row.querySelector('.extra-executors');
    if (extraContainer) {
      extraContainer.querySelectorAll('.extra-executor-row').forEach(extraRow => {
        const extraName = extraRow.querySelector('input[id*="name"]')?.value || '';
        const extraSalary = extraRow.querySelector('input[id*="salary"]')?.value || '0';
        const extraReceive = extraRow.querySelector('input[id*="receive"]')?.value || todayStr;
        const extraReturn = extraRow.querySelector('input[id*="return"]')?.value || '';
        const extraNote = extraRow.querySelector('input[id*="note"]')?.value || '';
        
        if (extraName) {
          const r = document.createElement('tr');
          r.innerHTML = `<td>${name}</td><td>${extraName}</td><td>${fmt(parseFloat(extraSalary))}</td><td>${extraReceive}</td><td>${extraReturn}</td><td>${extraNote}</td>`;
          tb.appendChild(r);
        }
      });
    }
  });
  
  const br = q('#brandManual').classList.contains('invis') ? q('#brand').value : q('#brandManual').value;
  const md = q('#modelManual').classList.contains('invis') ? q('#model').value : q('#modelManual').value;
  const yr = q('#year').value || '—';
  
  q('#pdfExecutorsWithSalaryMeta').textContent = `Автомобиль: ${br || '—'} ${md || '—'} ${yr}`;
}

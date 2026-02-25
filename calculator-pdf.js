/**
 * calculator-pdf.js
 * PDF-экспорт: КП, себестоимость, исполнители
 * Зависит от: calculator-data.js, calculator-persistence.js (currentProfile)
 */

function showTrialWatermark() {
  if (!currentProfile) return;
  if (currentProfile.is_paid) {
    document.querySelectorAll('.trial-watermark').forEach(w => w.style.display = 'none');
    return;
  }
  const trialEnd = currentProfile.trial_ends_at ? new Date(currentProfile.trial_ends_at) : null;
  if (!trialEnd) return;
  const watermarkText = `ПРОБНАЯ ВЕРСИЯ ДО ${trialEnd.toLocaleDateString('ru-RU')}`;
  document.querySelectorAll('.trial-watermark').forEach(w => {
    w.textContent = watermarkText;
    w.style.display = 'block';
  });
}

function exportPDF(blockId, filename) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || !window.html2canvas) { alert('Библиотеки PDF загружаются...'); return; }

  const holder = q('#pdfTemplates');
  const block  = q(blockId);
  const orig   = holder.style.display;
  holder.style.display  = 'block';
  holder.style.position = 'absolute';
  holder.style.left     = '-9999px';

  setTimeout(() => {
    html2canvas(block, { scale: 2, useCORS: true, backgroundColor: '#fff' }).then(canvas => {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pw  = pdf.internal.pageSize.getWidth();
      const ph  = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      const sw  = canvas.width  * ratio;
      const sh  = canvas.height * ratio;
      const x   = (pw - sw) / 2;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, 20, sw, Math.min(sh, ph - 40));
      pdf.save(filename);
    }).catch(err => {
      alert('Ошибка создания PDF: ' + err.message);
    }).finally(() => {
      holder.style.display = orig;
    });
  }, 200);
}

function prepKP() {
  showTrialWatermark();
  const tb = q('#pdfKPTBody');
  if (!tb) return;
  tb.innerHTML = '';

  qa('#kpTable tbody tr').forEach(tr => {
    const r = document.createElement('tr');
    r.innerHTML = `<td style="width:25%">${tr.children[0].textContent.trim()}</td>` +
                  `<td style="width:50%">${tr.children[1].textContent.trim() || '—'}</td>` +
                  `<td style="width:25%">${tr.children[2].textContent.trim()}</td>`;
    tb.appendChild(r);
  });

  q('#pdfKPTotal').textContent = q('#kpTotal')?.textContent || '0,00';

  const br   = q('#brandManual').classList.contains('invis') ? q('#brand').value   : q('#brandManual').value;
  const md   = q('#modelManual').classList.contains('invis') ? q('#model').value   : q('#modelManual').value;
  const yr   = q('#year').value || '—';
  const now  = new Date();
  const payMode = q('input[name=payMode]:checked')?.value;
  const payText = payMode === 'cash' ? 'Наличные' : payMode === 'card' ? 'Карта или ИП' : 'ООО';

  q('#pdfKPMeta').innerHTML = `Автомобиль: ${br || '—'} ${md || '—'} ${yr}<br>` +
    `Дата: ${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}<br>` +
    `<b><i>Условия оплаты: ${payText}</i></b>`;
}

function prepCost() {
  showTrialWatermark();
  const tb = q('#pdfCostTBody');
  if (!tb) return;
  tb.innerHTML = '';

  qa('#costTable tbody tr').forEach(tr => {
    const r = document.createElement('tr');
    r.innerHTML = `<td>${tr.children[0].textContent.trim()}</td>` +
                  `<td>${tr.children[1].textContent.trim()}</td>` +
                  `<td>${tr.children[2].textContent.trim()}</td>`;
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
  const todayStr = new Date().toISOString().split('T')[0];

  qa('#executorsContent .executor-row').forEach(row => {
    const name   = row.querySelector('.executor-row-header')?.textContent?.trim() || '';
    const baseId = row.getAttribute('data-exec-id');
    if (baseId) {
      const executor = row.querySelector(`#${baseId}name`)?.value || '';
      if (executor) {
        const r = document.createElement('tr');
        r.innerHTML = `<td>${name}</td><td>${executor}</td>` +
          `<td>${row.querySelector(`#${baseId}receive`)?.value || todayStr}</td>` +
          `<td>${row.querySelector(`#${baseId}return`)?.value  || ''}</td>` +
          `<td>${row.querySelector(`#${baseId}note`)?.value    || ''}</td>`;
        tb.appendChild(r);
      }
    }
    row.querySelector('.extra-executors')?.querySelectorAll('.extra-executor-row').forEach(extraRow => {
      const eName = extraRow.querySelector('input[id*="name"]')?.value || '';
      if (eName) {
        const r = document.createElement('tr');
        r.innerHTML = `<td>${name}</td><td>${eName}</td>` +
          `<td>${extraRow.querySelector('input[id*="receive"]')?.value || todayStr}</td>` +
          `<td>${extraRow.querySelector('input[id*="return"]')?.value  || ''}</td>` +
          `<td>${extraRow.querySelector('input[id*="note"]')?.value    || ''}</td>`;
        tb.appendChild(r);
      }
    });
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
  const todayStr = new Date().toISOString().split('T')[0];

  qa('#executorsContent .executor-row').forEach(row => {
    const name   = row.querySelector('.executor-row-header')?.textContent?.trim() || '';
    const baseId = row.getAttribute('data-exec-id');
    if (baseId) {
      const executor = row.querySelector(`#${baseId}name`)?.value || '';
      if (executor) {
        const salary = row.querySelector(`#${baseId}salary`)?.value || '0';
        const r = document.createElement('tr');
        r.innerHTML = `<td>${name}</td><td>${executor}</td><td>${fmt(parseFloat(salary))}</td>` +
          `<td>${row.querySelector(`#${baseId}receive`)?.value || todayStr}</td>` +
          `<td>${row.querySelector(`#${baseId}return`)?.value  || ''}</td>` +
          `<td>${row.querySelector(`#${baseId}note`)?.value    || ''}</td>`;
        tb.appendChild(r);
      }
    }
    row.querySelector('.extra-executors')?.querySelectorAll('.extra-executor-row').forEach(extraRow => {
      const eName = extraRow.querySelector('input[id*="name"]')?.value || '';
      if (eName) {
        const eSalary = extraRow.querySelector('input[id*="salary"]')?.value || '0';
        const r = document.createElement('tr');
        r.innerHTML = `<td>${name}</td><td>${eName}</td><td>${fmt(parseFloat(eSalary))}</td>` +
          `<td>${extraRow.querySelector('input[id*="receive"]')?.value || todayStr}</td>` +
          `<td>${extraRow.querySelector('input[id*="return"]')?.value  || ''}</td>` +
          `<td>${extraRow.querySelector('input[id*="note"]')?.value    || ''}</td>`;
        tb.appendChild(r);
      }
    });
  });

  const br = q('#brandManual').classList.contains('invis') ? q('#brand').value : q('#brandManual').value;
  const md = q('#modelManual').classList.contains('invis') ? q('#model').value : q('#modelManual').value;
  const yr = q('#year').value || '—';
  q('#pdfExecutorsWithSalaryMeta').textContent = `Автомобиль: ${br || '—'} ${md || '—'} ${yr}`;
}

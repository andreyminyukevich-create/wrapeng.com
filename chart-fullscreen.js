/**
 * chart-fullscreen.js — Кнопка «⛶» для просмотра графика на полный экран
 * Подключается после Chart.js. Автоматически добавляет кнопку ко всем canvas-контейнерам.
 */
(function() {
  'use strict';

  function initChartFS() {
    // Найти все контейнеры графиков (canvas внутри .cw или .cwt)
    var containers = document.querySelectorAll('.cw, .cwt');
    for (var i = 0; i < containers.length; i++) {
      var c = containers[i];
      var canvas = c.querySelector('canvas');
      if (!canvas) continue;
      if (c.querySelector('.btn-chart-fs')) continue; // уже есть

      // Позиция relative для кнопки
      c.style.position = 'relative';

      // Кнопка
      var btn = document.createElement('button');
      btn.className = 'btn-chart-fs';
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', 'На полный экран');
      btn.textContent = '\u26F6'; // ⛶
      btn.dataset.canvasId = canvas.id || '';
      btn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openFS(this);
      };
      c.appendChild(btn);
    }
  }

  function openFS(btn) {
    var container = btn.parentElement;
    var canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Находим заголовок графика
    var sc = container.closest('.sc') || container.closest('[id^="w"]');
    var titleEl = sc ? sc.querySelector('.sc-title') : null;
    var title = titleEl ? titleEl.textContent.replace(/^[^\w\dА-яёЁ]*/, '') : 'График';

    // Создаём overlay
    var overlay = document.createElement('div');
    overlay.className = 'chart-fs-overlay';

    var header = document.createElement('div');
    header.className = 'chart-fs-header';

    var titleSpan = document.createElement('div');
    titleSpan.className = 'chart-fs-title';
    titleSpan.textContent = title;

    var closeBtn = document.createElement('button');
    closeBtn.className = 'chart-fs-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.textContent = '\u2715'; // ✕

    header.appendChild(titleSpan);
    header.appendChild(closeBtn);
    overlay.appendChild(header);

    var body = document.createElement('div');
    body.className = 'chart-fs-body';

    // Копируем canvas как изображение
    var img = document.createElement('img');
    img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:8px';
    try {
      img.src = canvas.toDataURL('image/png');
      img.alt = title;
    } catch(e) {
      // fallback — показываем сам canvas
      var clone = canvas.cloneNode(true);
      clone.style.cssText = 'max-width:100%;max-height:100%';
      body.appendChild(clone);
    }
    if (img.src) body.appendChild(img);

    overlay.appendChild(body);
    document.body.appendChild(overlay);

    // Закрытие
    function closeFS() {
      overlay.remove();
    }
    closeBtn.onclick = closeFS;
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeFS();
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        closeFS();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  // Инициализация после загрузки страницы + задержка для рендера графиков
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initChartFS, 2000); });
  } else {
    setTimeout(initChartFS, 2000);
  }

  // Повторная инициализация при обновлении графиков
  window._initChartFS = initChartFS;
})();

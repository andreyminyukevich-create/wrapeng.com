/**
 * nav.js — Единая навигация CRM
 * Светлая тема, без переключателя.
 * Подключать сразу после supabase CDN.
 */
(function () {
  'use strict';

  // Светлая тема — принудительно
  document.documentElement.setAttribute('data-theme', 'light');

  var PAGES = [
    { href: 'dashboard.html',   icon: '🏠', label: 'Главная' },
    { href: 'board.html',       icon: '🔧', label: 'В работе' },
    { href: 'executors.html',   icon: '👥', label: 'Сотрудники' },
    { href: 'payouts.html',     icon: '💰', label: 'Зарплаты' },
    { href: 'analytics.html',   icon: '📊', label: 'Аналитика',     soon: true },
    { href: 'inventory.html',   icon: '📦', label: 'Закупки',       soon: true },
    { href: 'settlements.html', icon: '💳', label: 'Взаиморасчёты', soon: true },
    { href: 'settings.html',    icon: '⚙️', label: 'Настройки',     soon: true },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  /**
   * initNav(config?)
   * config.actionHref   — ссылка кнопки справа    (default: 'calculator.html')
   * config.actionLabel  — текст кнопки             (default: '➕ Новый расчёт')
   * config.hideAction   — скрыть кнопку            (default: false)
   */
  window.initNav = function (config) {
    config = config || {};
    var actionHref  = config.actionHref  !== undefined ? config.actionHref  : 'calculator.html';
    var actionLabel = config.actionLabel !== undefined ? config.actionLabel : '➕ Новый расчёт';
    var hideAction  = config.hideAction  || false;

    var page = currentPage();

    var links = PAGES.map(function (p) {
      var isActive = p.href === page;
      var cls = 'nav-link' + (isActive ? ' active' : '') + (p.soon ? ' nav-soon' : '');
      var badge = p.soon ? ' <span class="nav-soon-badge">скоро</span>' : '';
      return '<a href="' + (p.soon ? '#' : p.href) + '" class="' + cls + '">'
        + p.icon + ' ' + p.label + badge + '</a>';
    }).join('');

    var actionBtn = hideAction ? '' :
      '<a href="' + actionHref + '" class="btn-nav-action">' + actionLabel + '</a>';

    var html =
      '<div id="navTopBar">' +
        '<a href="dashboard.html" class="nav-brand">🚗 CRM</a>' +
        '<nav class="nav-links">' + links + '</nav>' +
        '<div class="nav-right">' + actionBtn + '</div>' +
      '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.insertBefore(wrap.firstElementChild, document.body.firstChild);
  };

})();

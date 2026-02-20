/**
 * nav.js — Рендерит top-bar. Минимальный, без конфликтов.
 */
(function () {
  'use strict';

  var NAV_LINKS = [
    { href: 'dashboard.html', icon: '🏠', label: 'Главная' },
    { href: 'board.html',     icon: '📋', label: 'Заказы' },
    { href: 'executors.html', icon: '👥', label: 'Мастера' },
    { href: 'payouts.html',   icon: '💰', label: 'Зарплаты' },
    { href: 'analytics.html', icon: '📊', label: 'Аналитика', soon: true },
    { href: 'calendar.html',  icon: '🗓', label: 'Календарь', soon: true },
    { href: 'settings.html',  icon: '⚙️', label: 'Настройки', soon: true },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  window.initNav = function(config) {
    config = config || {};
    var actionHref  = config.actionHref  || 'calculator.html';
    var actionLabel = config.actionLabel || '➕ Новый расчёт';
    var hideAction  = config.hideAction  || false;

    var page = currentPage();
    var found = NAV_LINKS.find(function(l) { return l.href === page; });
    var title = found ? (found.icon + ' ' + found.label) : '🏠 Студия';

    var links = NAV_LINKS.map(function(l) {
      var cls = 'nav-link' + (l.href === page ? ' active' : '') + (l.soon ? ' nav-soon' : '');
      var dot = l.soon ? ' <span class="nav-soon-dot"></span>' : '';
      return '<a href="' + (l.soon ? '#' : l.href) + '" class="' + cls + '">' + l.icon + ' ' + l.label + dot + '</a>';
    }).join('');

    var actionBtn = hideAction ? '' :
      '<a href="' + actionHref + '" class="btn-nav-action">' + actionLabel + '</a>';

    var html = '<div class="top-bar" id="navTopBar">' +
      '<div class="top-bar-left"><span class="top-bar-title">' + title + '</span></div>' +
      '<nav class="global-nav">' + links + '</nav>' +
      '<div class="top-bar-right">' +
        '<button class="theme-toggle" id="navThemeToggle">🌙</button>' +
        actionBtn +
      '</div>' +
    '</div>';

    var el = document.createElement('div');
    el.innerHTML = html;
    var bar = el.firstElementChild;
    document.body.insertBefore(bar, document.body.firstChild);

    // Синхронизируем иконку темы с текущей
    var theme = document.documentElement.getAttribute('data-theme') || 'dark';
    var btn = document.getElementById('navThemeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.addEventListener('click', function() {
        var cur = document.documentElement.getAttribute('data-theme');
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        btn.textContent = next === 'dark' ? '☀️' : '🌙';
        // Обновляем и старую кнопку если есть
        var old = document.getElementById('themeToggle');
        if (old && old !== btn) old.textContent = next === 'dark' ? '☀️' : '🌙';
      });
    }
  };

  // Supabase клиент (общий)
  var SB_URL = 'https://hdghijgrrnzmntistdvw.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';
  window.getDB = function() {
    if (!window._sb && window.supabase) {
      window._sb = window.supabase.createClient(SB_URL, SB_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    return window._sb;
  };

})();

/**
 * nav.js — Единый компонент навигации
 * Подключить в <head> ПОСЛЕ supabase.js
 */

(function () {
  'use strict';

  const NAV_LINKS = [
    { href: 'dashboard.html',  icon: '🏠', label: 'Главная' },
    { href: 'board.html',      icon: '📋', label: 'Заказы' },
    { href: 'executors.html',  icon: '👥', label: 'Мастера' },
    { href: 'payouts.html',    icon: '💰', label: 'Зарплаты' },
    { href: 'analytics.html',  icon: '📊', label: 'Аналитика', soon: true },
    { href: 'calendar.html',   icon: '🗓', label: 'Календарь', soon: true },
    { href: 'settings.html',   icon: '⚙️', label: 'Настройки', soon: true },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  function isActive(href) {
    return currentPage() === href;
  }

  function renderTopBar(config) {
    config = config || {};
    var actionHref  = config.actionHref  || 'calculator.html';
    var actionLabel = config.actionLabel || '➕ Новый расчёт';
    var hideAction  = config.hideAction  || false;

    var page = currentPage();
    var found = NAV_LINKS.find(function(l) { return l.href === page; });
    var autoTitle = found ? (found.icon + ' ' + found.label) : '🏠 Студия';

    var navLinks = NAV_LINKS.map(function(l) {
      var cls = 'nav-link' + (isActive(l.href) ? ' active' : '') + (l.soon ? ' nav-soon' : '');
      var dot = l.soon ? ' <span class="nav-soon-dot"></span>' : '';
      var href = l.soon ? '#' : l.href;
      var extra = l.soon ? 'title="Скоро" onclick="return false"' : '';
      return '<a href="' + href + '" class="' + cls + '" ' + extra + '>' + l.icon + ' ' + l.label + dot + '</a>';
    }).join('');

    var actionBtn = hideAction ? '' : '<a href="' + actionHref + '" class="btn-nav-action">' + actionLabel + '</a>';

    return '<div class="top-bar" id="topBar">' +
      '<div class="top-bar-left"><span class="top-bar-title">' + autoTitle + '</span></div>' +
      '<nav class="global-nav" id="globalNav">' + navLinks + '</nav>' +
      '<div class="top-bar-right">' +
        '<button class="theme-toggle" id="themeToggle" title="Тема">🌙</button>' +
        actionBtn +
      '</div>' +
    '</div>';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
  }

  /* Supabase */
  var SUPABASE_URL = 'https://hdghijgrrnzmntistdvw.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';

  window._sb = null;
  window.getDB = function() {
    if (!window._sb && window.supabase) {
      window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    return window._sb;
  };

  window.checkAuth = async function(redirectTo) {
    redirectTo = redirectTo || 'welcome.html';
    var sb = window.getDB();
    if (!sb) return null;
    var result = await sb.auth.getSession();
    if (!result.data.session) { window.location.href = redirectTo; return null; }
    return result.data.session.user;
  };

  window.logoutUser = async function() {
    var sb = window.getDB();
    if (sb) await sb.auth.signOut();
    window.location.href = 'welcome.html';
  };

  window.initNav = async function(config) {
    // Тема сразу
    applyTheme(localStorage.getItem('theme') || 'dark');

    // Вставляем top-bar перед всем контентом
    var el = document.createElement('div');
    el.innerHTML = renderTopBar(config);
    var bar = el.firstElementChild;
    document.body.insertBefore(bar, document.body.firstChild);

    // Тема toggle
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function() {
        var cur = document.documentElement.getAttribute('data-theme');
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }
  };

  // Тема немедленно
  applyTheme(localStorage.getItem('theme') || 'dark');

})();

/**
 * nav.js — Единый компонент навигации
 * Подключить в <head> ПОСЛЕ supabase.js
 * Автоматически рендерит top-bar + drawer + theme
 */

(function () {
  'use strict';

  /* ── Конфигурация навигации ─────────────────────────────── */

  // Основные ссылки в top-bar
  const NAV_LINKS = [
    { href: 'dashboard.html',   icon: '🏠', label: 'Главная' },
    { href: 'board.html',       icon: '📋', label: 'Заказы' },
    { href: 'executors.html',   icon: '👥', label: 'Мастера' },
    { href: 'payouts.html',     icon: '💰', label: 'Зарплаты' },
    { href: 'calculator.html',  icon: '🧮', label: 'Калькулятор' },
  ];

  // Drawer — расширенное меню
  const DRAWER_SECTIONS = [
    {
      label: 'Основное',
      links: [
        { href: 'dashboard.html',  icon: '🏠', label: 'Главная' },
        { href: 'board.html',      icon: '📋', label: 'Доска заказов' },
        { href: 'calculator.html', icon: '🧮', label: 'Калькулятор' },
        { href: 'executors.html',  icon: '👥', label: 'Мастера' },
        { href: 'payouts.html',    icon: '💰', label: 'Зарплаты' },
      ],
    },
    {
      label: 'Скоро',
      links: [
        { href: 'inventory.html',   icon: '📦', label: 'Склад',       soon: true },
        { href: 'settlements.html', icon: '💳', label: 'Взаиморасчёты', soon: true },
        { href: 'clients.html',     icon: '🧑‍💼', label: 'Клиенты',     soon: true },
        { href: 'analytics.html',   icon: '📊', label: 'Аналитика',    soon: true },
        { href: 'calendar.html',    icon: '🗓', label: 'Календарь',    soon: true },
        { href: 'settings.html',    icon: '⚙️', label: 'Настройки',    soon: true },
      ],
    },
  ];

  /* ── Определяем текущую страницу ───────────────────────── */
  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  function isActive(href) {
    return currentPage() === href;
  }

  /* ── Рендер top-bar ────────────────────────────────────── */
  function renderTopBar(config = {}) {
    const {
      title = '',
      actionHref = 'calculator.html',
      actionLabel = '➕ Новый расчёт',
      hideAction = false,
    } = config;

    // Автотайтл по текущей странице
    const page = currentPage();
    const found = [...NAV_LINKS, ...DRAWER_SECTIONS.flatMap(s => s.links)]
      .find(l => l.href === page);
    const autoTitle = found ? `${found.icon} ${found.label}` : title;

    const navLinks = NAV_LINKS.map(l => `
      <a href="${l.href}" class="nav-link${isActive(l.href) ? ' active' : ''}">
        <span class="nav-emoji">${l.icon}</span>${l.label}
      </a>
    `).join('');

    const actionBtn = hideAction ? '' : `
      <a href="${actionHref}" class="btn">${actionLabel}</a>
    `;

    return `
      <div class="top-bar" id="topBar">
        <div class="top-bar-left">
          <button class="menu-toggle" id="menuToggle" title="Меню">☰</button>
          <span class="top-bar-title">${autoTitle}</span>
        </div>
        <nav class="global-nav" id="globalNav">
          ${navLinks}
        </nav>
        <div class="top-bar-right">
          <button class="theme-toggle" id="themeToggle" title="Сменить тему">🌙</button>
          ${actionBtn}
        </div>
      </div>
    `;
  }

  /* ── Рендер drawer ─────────────────────────────────────── */
  function renderDrawer() {
    const sections = DRAWER_SECTIONS.map(section => {
      const links = section.links.map(l => `
        <a href="${l.soon ? '#' : l.href}"
           class="drawer-link${l.soon ? ' disabled' : ''}${isActive(l.href) ? ' active-link' : ''}"
           ${l.soon ? 'onclick="return false"' : ''}>
          ${l.icon} ${l.label}
          ${l.soon ? '<span class="drawer-badge">Скоро</span>' : ''}
        </a>
      `).join('');

      return `
        <div class="drawer-section">
          <div class="drawer-section-label">${section.label}</div>
          ${links}
        </div>
      `;
    }).join('');

    return `
      <div class="drawer-overlay" id="drawerOverlay"></div>
      <div class="drawer" id="drawer">
        <div class="drawer-header">
          <div class="drawer-title">📁 Навигация</div>
          <button class="drawer-close" id="drawerClose">✕</button>
        </div>
        ${sections}
        <div class="drawer-footer">
          <div class="drawer-user">
            <div class="drawer-user-dot"></div>
            <span id="drawerUserEmail">...</span>
          </div>
          <button class="btn btn-danger" style="width:100%;justify-content:center" id="drawerLogout">
            🚪 Выйти
          </button>
        </div>
      </div>
    `;
  }

  /* ── Тема ──────────────────────────────────────────────── */
  function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ── Drawer logic ──────────────────────────────────────── */
  function openDrawer() {
    document.getElementById('drawer')?.classList.add('active');
    document.getElementById('drawerOverlay')?.classList.add('active');
  }

  function closeDrawer() {
    document.getElementById('drawer')?.classList.remove('active');
    document.getElementById('drawerOverlay')?.classList.remove('active');
  }

  /* ── Supabase auth ─────────────────────────────────────── */
  const SUPABASE_URL = 'https://hdghijgrrnzmntistdvw.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';

  // Общий клиент Supabase (доступен глобально)
  window._sb = null;

  function getSB() {
    if (!window._sb && window.supabase) {
      window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    return window._sb;
  }

  // Публичные функции для страниц
  window.getDB = getSB;

  window.checkAuth = async function (redirectTo = 'welcome.html') {
    const sb = getSB();
    if (!sb) return null;
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = redirectTo;
      return null;
    }
    return session.user;
  };

  window.logoutUser = async function () {
    const sb = getSB();
    if (sb) await sb.auth.signOut();
    window.location.href = 'welcome.html';
  };

  /* ── Главная функция инициализации ────────────────────── */
  async function initNav(config = {}) {
    // Устанавливаем тему ДО рендера (без мелькания)
    initTheme();

    // Инжектируем top-bar в начало body
    const topBarHTML = renderTopBar(config);
    const drawerHTML = renderDrawer();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = topBarHTML + drawerHTML;

    // Вставляем перед первым дочерним элементом body
    document.body.insertBefore(wrapper, document.body.firstChild);

    // События
    document.getElementById('menuToggle')?.addEventListener('click', openDrawer);
    document.getElementById('drawerClose')?.addEventListener('click', closeDrawer);
    document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('drawerLogout')?.addEventListener('click', window.logoutUser);

    // Keyboard: Esc закрывает drawer
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
    });

    // Загружаем email пользователя
    const sb = getSB();
    if (sb) {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        const emailEl = document.getElementById('drawerUserEmail');
        if (emailEl) emailEl.textContent = session.user.email;
      }
    }
  }

  // Экспортируем для страниц
  window.initNav = initNav;

  // Применяем тему сразу при загрузке скрипта (до DOMContentLoaded)
  // чтобы не было вспышки неправильной темы
  initTheme();

})();

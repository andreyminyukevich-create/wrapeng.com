/**
 * nav.js — Единая навигация CRM
 * Светлая тема, без переключателя.
 * Включает проверку подписки студии.
 */
(function () {
  'use strict';

  document.documentElement.setAttribute('data-theme', 'light');

  // ── Единый справочник статусов ─────────────────────────────────
  // Используйте window.STATUSES везде вместо хардкода меток.
  // Ключи соответствуют полю status в таблице calculations.
  window.STATUSES = {
    new:         { label: 'Расчёт произведён',      short: 'Расчёт',    icon: '📋', cls: 'status-new' },
    scheduled:   { label: 'Назначена дата и время', short: 'Дата',      icon: '📅', cls: 'status-scheduled' },
    in_progress: { label: 'Принято в работу',       short: 'В работе',  icon: '🔧', cls: 'status-in_progress' },
    done:        { label: 'Завершено',               short: 'Готово',    icon: '✅', cls: 'status-done' },
    delivered:   { label: 'Выдано',                  short: 'Выдано',    icon: '🚗', cls: 'status-delivered' },
    cancelled:   { label: 'Отказ',                   short: 'Отказ',     icon: '❌', cls: 'status-cancelled' },
  };


  var ADMIN_ID = 'c5db87ec-8e4a-4c48-bad3-5747513224d9';

  var PAGES = [
    { href: 'dashboard.html',   icon: '🏠', label: 'Главная' },
    { href: 'board.html',       icon: '📋', label: 'Доска' },
    { href: 'executors.html',   icon: '👥', label: 'Сотрудники' },
    { href: 'payouts.html',     icon: '💰', label: 'Зарплаты' },
    { href: 'analytics.html',   icon: '📊', label: 'Аналитика',  soon: true },
    { href: 'calendar.html',    icon: '🗓', label: 'Календарь' },
    { href: 'inventory.html',   icon: '📦', label: 'Закупки',    soon: true },
    { href: 'settings.html',    icon: '⚙️', label: 'Настройки' },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

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
      '<a href="' + actionHref + '" class="btn-nav-action">' + actionLabel + '</a>' +
      '<button class="btn-nav-action" style="background:rgba(245,158,11,0.12);color:#b45309;border:1.5px solid rgba(245,158,11,0.3)" onclick="BookingPopup&&BookingPopup.open({studioId:window._boardStudioId||window._studioId,onSaved:function(){location.reload()}})">📅 Записать авто</button>';
    var logoutBtn = '<button class="btn-nav-logout" onclick="(async()=>{const s=window._crmSb||window.supabase.createClient(\'https://hdghijgrrnzmntistdvw.supabase.co\',\'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q\');await s.auth.signOut();window.location.href=\'welcome.html\';})()" style="background:transparent;border:1.5px solid rgba(124,58,237,0.3);color:#7c6fa0;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:700;font-family:inherit;transition:all 0.2s" onmouseover="this.style.borderColor=\'#7c3aed\';this.style.color=\'#7c3aed\'" onmouseout="this.style.borderColor=\'rgba(124,58,237,0.3)\';this.style.color=\'#7c6fa0\'">Выйти →</button>';

    // Проверяем текущего пользователя для показа пункта Админ
    var SUPABASE_URL = 'https://hdghijgrrnzmntistdvw.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';
    var _sb = window._crmSb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _sb.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (session && session.user && session.user.id === ADMIN_ID) {
        var adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'nav-link' + (page === 'admin.html' ? ' active' : '');
        adminLink.textContent = '⚙️ Админ';
        adminLink.style.color = '#7c3aed';
        var navLinks = document.querySelector('#navTopBar .nav-links');
        if (navLinks) navLinks.appendChild(adminLink);
      }
    });

    var html =
      '<div id="navTopBar">' +
        '<a href="dashboard.html" class="nav-brand">Keep1R CRM</a>' +
        '<nav class="nav-links">' + links + '</nav>' +
        '<div class="nav-right">' + actionBtn + logoutBtn + '</div>' +
      '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.insertBefore(wrap.firstElementChild, document.body.firstChild);
  };

  // ── Проверка подписки ──────────────────────────────────────────
  // Возвращает: 'active' | 'trial' | 'expired' | 'none'
  window.checkSubscription = async function(studioId) {
    var sb = window._crmSb;
    if (!sb) return 'none';

    var res = await sb
      .from('studios')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', studioId)
      .single();

    if (res.error || !res.data) return 'none';

    var tier    = res.data.subscription_tier;
    var expires = res.data.subscription_expires_at;
    var now     = new Date();

    if (tier === 'active') {
      return (!expires || new Date(expires) > now) ? 'active' : 'expired';
    }
    if (tier === 'trial') {
      return (expires && new Date(expires) > now) ? 'trial' : 'expired';
    }
    return 'expired';
  };

  // ── Paywall оверлей ────────────────────────────────────────────
  window.showPaywall = function(trialExpired) {
    // Блюрим весь контент кроме nav
    Array.from(document.body.children).forEach(function(el) {
      if (el.id !== 'navTopBar') el.style.filter = 'blur(6px)';
    });

    var icon = trialExpired ? '⏰' : '🔒';
    var title = trialExpired ? 'Пробный период завершён' : 'Требуется подписка';
    var desc  = trialExpired
      ? '72 часа бесплатного доступа истекли. Оформите подписку, чтобы продолжить работу.'
      : 'Для доступа к CRM необходимо оформить подписку.';

    var overlay = document.createElement('div');
    overlay.innerHTML =
      '<div style="position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(240,244,251,0.75);backdrop-filter:blur(8px);padding:20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif">' +
        '<div style="background:#fff;border-radius:20px;box-shadow:0 16px 64px rgba(37,99,235,0.15);' +
        'padding:44px 36px;max-width:400px;width:100%;text-align:center">' +
          '<div style="font-size:3rem;margin-bottom:14px">' + icon + '</div>' +
          '<div style="font-size:1.35rem;font-weight:800;color:#0f172a;margin-bottom:10px">' + title + '</div>' +
          '<div style="font-size:0.88rem;color:#64748b;line-height:1.6;margin-bottom:24px">' + desc + '</div>' +
          '<div style="background:#f8faff;border:1px solid rgba(37,99,235,0.1);border-radius:12px;padding:18px;margin-bottom:22px">' +
            '<div style="font-size:0.72rem;color:#94a3b8;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Тариф CRM</div>' +
            '<div style="font-size:2rem;font-weight:800;color:#0f172a;line-height:1">2 900 ₽' +
              '<span style="font-size:0.95rem;font-weight:500;color:#64748b">/мес</span></div>' +
            '<div style="font-size:0.8rem;color:#94a3b8;margin-top:6px">Сотрудники · Зарплаты · Аналитика · Заказы</div>' +
          '</div>' +
          '<a href="https://t.me/keeper_wrap" target="_blank" ' +
          'style="display:block;background:#2563eb;color:#fff;padding:13px;border-radius:10px;' +
          'font-weight:700;font-size:0.92rem;text-decoration:none;margin-bottom:10px;' +
          'box-shadow:0 4px 14px rgba(37,99,235,0.3)">Написать для оформления</a>' +
          '<a href="calculator.html" style="font-size:0.83rem;color:#94a3b8;text-decoration:none">Вернуться к калькулятору →</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay.firstElementChild);
  };

})();

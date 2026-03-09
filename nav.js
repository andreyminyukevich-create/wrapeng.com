/**
 * nav.js - Единая навигация CRM
 */
(function () {
  'use strict';

  document.documentElement.setAttribute('data-theme', 'light');

  window.STATUSES = {
    new:         { label: 'Расчёт произведён',      short: 'Расчёт',    icon: '&#x1F4CB;', cls: 'status-new' },
    scheduled:   { label: 'Назначена дата и время', short: 'Дата',      icon: '&#x1F4C5;', cls: 'status-scheduled' },
    in_progress: { label: 'Принято в работу',       short: 'В работе',  icon: '&#x1F527;', cls: 'status-in_progress' },
    done:        { label: 'Завершено',               short: 'Готово',    icon: '&#x2705;', cls: 'status-done' },
    delivered:   { label: 'Выдано',                  short: 'Выдано',    icon: '&#x1F697;', cls: 'status-delivered' },
    cancelled:   { label: 'Отказ',                   short: 'Отказ',     icon: '&#x274C;', cls: 'status-cancelled' },
  };

  var SUPABASE_URL      = 'https://hdghijgrrnzmntistdvw.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';
  var ADMIN_ID          = 'c5db87ec-8e4a-4c48-bad3-5747513224d9';

  var PAGES = [
    { href: 'dashboard.html',  icon: '&#x1F3E0;', label: 'Главная' },
    { href: 'board.html',      icon: '&#x1F4CB;', label: 'Доска' },
    { href: 'executors.html',  icon: '&#x1F465;', label: 'Сотрудники' },
    { href: 'payouts.html',    icon: '&#x1F4B0;', label: 'Зарплаты' },
    { href: 'analytics.html',  icon: '&#x1F4CA;', label: 'Аналитика' },
    { href: 'calendar.html',   icon: '&#x1F5D3;', label: 'Календарь' },
    { href: 'inventory.html',  icon: '&#x1F4E6;', label: 'Склад' },
    { href: 'settings.html',   icon: '&#x1F527;', label: 'Настройки' },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  window._navLogout = async function () {
    var s = window._crmSb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await s.auth.signOut();
    window.location.href = 'welcome.html';
  };

  window.initNav = function (config) {
    if (document.getElementById('navTopBar')) return;

    config = config || {};
    var actionHref  = config.actionHref  !== undefined ? config.actionHref  : 'calculator.html';
    var actionLabel = config.actionLabel !== undefined ? config.actionLabel : '&#x2795; Новый расчёт';
    var hideAction  = config.hideAction  || false;
    var page        = config.activePage  || currentPage();

    var links = PAGES.map(function (p) {
      var isActive = p.href === page;
      var cls = 'nav-link' + (isActive ? ' active' : '') + (p.soon ? ' nav-soon' : '');
      var badge = p.soon ? ' <span class="nav-soon-badge">скоро</span>' : '';
      return '<a href="' + (p.soon ? '#' : p.href) + '" class="' + cls + '">'
        + p.icon + ' ' + p.label + badge + '</a>';
    }).join('');

    var actionBtn = hideAction ? '' :
      '<a href="' + actionHref + '" class="btn-nav-action">' + actionLabel + '</a>' +
      '<button class="btn-nav-book" id="btnNavBook" onclick="window._openNavBooking()">&#x1F4C5; Записать авто</button>';

    var logoutBtn = '<button class="btn-nav-logout" onclick="window._navLogout()">Выйти &rarr;</button>';

    var _sb = window._crmSb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _sb.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (session && session.user && session.user.id === ADMIN_ID) {
        var adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'nav-link' + (page === 'admin.html' ? ' active' : '');
        adminLink.innerHTML = '&#x1F511; Админ';
        adminLink.style.color = '#7c3aed';
        var navLinks = document.querySelector('#navTopBar .nav-links');
        if (navLinks && !navLinks.querySelector('a[href="admin.html"]')) {
          navLinks.appendChild(adminLink);
        }
      }
    });

    var mobileLinks = PAGES.map(function(p) {
      var isActive = p.href === page;
      return '<a href="' + (p.soon ? '#' : p.href) + '" class="nav-mobile-link' + (isActive ? ' active' : '') + '" onclick="window._closeMobileNav()">' +
        '<span class="nav-mobile-link-icon">' + p.icon + '</span>' + p.label +
      '</a>';
    }).join('');

    var mobileActions =
      (hideAction ? '' :
        '<a href="' + actionHref + '" class="nav-mobile-btn-primary">' + actionLabel + '</a>' +
        '<button class="nav-mobile-btn-secondary" onclick="window._closeMobileNav();window._openNavBooking()">&#x1F4C5; Записать авто</button>'
      ) +
      '<button class="nav-mobile-btn-logout" onclick="window._navLogout()">Выйти &rarr;</button>';

    var html =
      '<div id="navTopBar">' +
        '<a href="dashboard.html" class="nav-brand">Keep1R CRM</a>' +
        '<nav class="nav-links">' + links + '</nav>' +
        '<div class="nav-right">' + actionBtn + logoutBtn + '</div>' +
        '<button id="navHamburger" onclick="window._toggleMobileNav()" aria-label="Меню">&#9776;</button>' +
      '</div>' +
      '<div id="navMobileOverlay" onclick="window._closeMobileNav()"></div>' +
      '<div id="navMobileMenu">' +
        '<div class="nav-mobile-section">' + mobileLinks + '</div>' +
        '<div class="nav-mobile-section nav-mobile-actions">' + mobileActions + '</div>' +
      '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    // Insert topBar
    document.body.insertBefore(wrap.children[0], document.body.firstChild);
    // Insert overlay and mobile menu after topBar
    document.body.insertBefore(wrap.children[0], document.body.children[1]);
    document.body.insertBefore(wrap.children[0], document.body.children[2]);
  };

  window._toggleMobileNav = function() {
    var menu    = document.getElementById('navMobileMenu');
    var overlay = document.getElementById('navMobileOverlay');
    var btn     = document.getElementById('navHamburger');
    if (!menu) return;
    var isOpen = menu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open', isOpen);
    if (btn) btn.textContent = isOpen ? '✕' : '☰';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  window._closeMobileNav = function() {
    var menu    = document.getElementById('navMobileMenu');
    var overlay = document.getElementById('navMobileOverlay');
    var btn     = document.getElementById('navHamburger');
    if (menu)    menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (btn) btn.textContent = '☰';
    document.body.style.overflow = '';
  };

  window._openNavBooking = async function () {
    var sid = window._boardStudioId || window._studioId || null;

    if (!sid) {
      var _sb = window._crmSb;
      if (_sb) {
        var sess = await _sb.auth.getSession();
        var uid  = sess && sess.data && sess.data.session && sess.data.session.user && sess.data.session.user.id;
        if (uid) {
          var res = await _sb.from('studio_members')
            .select('studio_id')
            .eq('user_id', uid)
            .eq('is_active', true)
            .single();
          if (res.data) {
            sid = res.data.studio_id;
            window._studioId = sid;
          }
        }
      }
    }

    function doOpen() {
      BookingPopup.open({ studioId: sid, onSaved: function () { location.reload(); } });
    }

    if (window.BookingPopup) { doOpen(); return; }

    var s = document.createElement('script');
    s.src = 'booking-popup.js';
    s.onload = function () { doOpen(); };
    s.onerror = function () { alert('Не удалось загрузить модуль записи.'); };
    document.head.appendChild(s);
  };

  window.checkSubscription = async function (studioId) {
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

    if (tier === 'active') return (!expires || new Date(expires) > now) ? 'active' : 'expired';
    if (tier === 'trial')  return (expires && new Date(expires) > now)  ? 'trial'  : 'expired';
    return 'expired';
  };

  window.showPaywall = function (trialExpired) {
    Array.from(document.body.children).forEach(function (el) {
      if (el.id !== 'navTopBar') el.style.filter = 'blur(6px)';
    });

    var icon  = trialExpired ? '&#x23F0;' : '&#x1F512;';
    var title = trialExpired ? 'Пробный период завершён' : 'Требуется подписка';
    var desc  = trialExpired
      ? '72 часа бесплатного доступа истекли. Оформите подписку, чтобы продолжить работу.'
      : 'Для доступа к CRM необходимо оформить подписку.';

    var overlay = document.createElement('div');
    overlay.innerHTML =
      '<div style="position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(240,244,251,0.75);backdrop-filter:blur(8px);padding:20px;' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif">' +
        '<div style="background:#fff;border-radius:20px;box-shadow:0 16px 64px rgba(37,99,235,0.15);' +
        'padding:44px 36px;max-width:400px;width:100%;text-align:center">' +
          '<div style="font-size:3rem;margin-bottom:14px">' + icon + '</div>' +
          '<div style="font-size:1.35rem;font-weight:800;color:#0f172a;margin-bottom:10px">' + title + '</div>' +
          '<div style="font-size:0.88rem;color:#64748b;line-height:1.6;margin-bottom:24px">' + desc + '</div>' +
          '<div style="background:#f8faff;border:1px solid rgba(37,99,235,0.1);border-radius:12px;padding:18px;margin-bottom:22px">' +
            '<div style="font-size:0.72rem;color:#94a3b8;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Тариф CRM</div>' +
            '<div style="font-size:2rem;font-weight:800;color:#0f172a;line-height:1">2 900' +
              '<span style="font-size:0.95rem;font-weight:500;color:#64748b">/мес</span></div>' +
            '<div style="font-size:0.8rem;color:#94a3b8;margin-top:6px">Сотрудники &middot; Зарплаты &middot; Аналитика &middot; Заказы</div>' +
          '</div>' +
          '<a href="https://t.me/keeper_wrap" target="_blank" ' +
          'style="display:block;background:#2563eb;color:#fff;padding:13px;border-radius:10px;' +
          'font-weight:700;font-size:0.92rem;text-decoration:none;margin-bottom:10px;' +
          'box-shadow:0 4px 14px rgba(37,99,235,0.3)">Написать для оформления</a>' +
          '<a href="calculator.html" style="font-size:0.83rem;color:#94a3b8;text-decoration:none">Вернуться к калькулятору &rarr;</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay.firstElementChild);
  };

})();

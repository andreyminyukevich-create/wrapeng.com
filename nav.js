/**
 * nav.js — Sidebar навигация Keep1R CRM
 * Не зависит от body.style — всё через CSS классы
 */
(function () {
  'use strict';
  document.documentElement.setAttribute('data-theme', 'light');

  // ── dvh fallback: фиксит высоту sidebar при скрытии адресной строки ──
  // Яндекс/Chrome mobile: адресная строка скрывается → 100vh меняется →
  // sidebar дёргается. CSS dvh помогает, но не все браузеры поддерживают.
  // JS fallback: обновляем CSS-переменную --vh при resize/orientationchange.
  function setVH() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', function() { setTimeout(setVH, 150); });

  // Роль global_admin проверяется из localStorage (ставится при логине)

  window.STATUSES = {
    draft:       { label: 'Черновик',            short: 'Черновик',  icon: '📝', cls: 'status-draft',       step: 0 },
    scheduled:   { label: 'Запись подтверждена', short: 'Запись',    icon: '📅', cls: 'status-scheduled',   step: 1 },
    accepted:    { label: 'Авто принято',        short: 'Принято',   icon: '🔑', cls: 'status-accepted',    step: 2 },
    in_progress: { label: 'В работе',            short: 'В работе',  icon: '🔧', cls: 'status-in_progress', step: 3 },
    done:        { label: 'Проверено',           short: 'Проверено', icon: '✅', cls: 'status-done',        step: 4 },
    delivered:   { label: 'Выдано',              short: 'Выдано',    icon: '🚗', cls: 'status-delivered',   step: 5 },
    cancelled:   { label: 'Запись отменена',     short: 'Отменено',  icon: '❌', cls: 'status-cancelled',   step: 6 },
    new:         { label: 'Запись подтверждена', short: 'Запись',    icon: '📅', cls: 'status-scheduled',   step: 1 },
    waiting:     { label: 'В работе',            short: 'В работе',  icon: '🔧', cls: 'status-in_progress', step: 3 },
    closed:      { label: 'Выдано',              short: 'Выдано',    icon: '🚗', cls: 'status-delivered',   step: 5 },
  };

  var NAV = [
    { id: 'home',     icon: '🏠', label: 'Главная',     href: 'dashboard.html' },
    { id: 'workshop', icon: '🔧', label: 'Цех', children: [
      { href: 'board.html',      icon: '📋', label: 'Доска' },
      { href: 'work-order.html', icon: '📄', label: 'Заказ-наряды' },
      { href: 'inventory.html',  icon: '📦', label: 'Склад' },
    ]},
    { id: 'sales', icon: '💼', label: 'Продажи', children: [
      { href: 'sales.html',      icon: '🎯', label: 'Воронка' },
      { href: 'clients.html',    icon: '👤', label: 'Клиенты' },
      { href: 'calculations.html', icon: '🧮', label: 'Расчёты' },
    ]},
    { id: 'staff', icon: '👥', label: 'Сотрудники', children: [
      { href: 'executors.html', icon: '👤', label: 'Список' },
      { href: 'calendar.html',  icon: '🗓', label: 'Календарь' },
    ]},
    { id: 'analytics', icon: '📊', label: 'Аналитика', href: 'analytics.html' },
    { id: 'finance', icon: '💳', label: 'Бухгалтерия', children: [
      { href: 'cashflow.html',        icon: '💸', label: 'Касса / ДДС' },
      { href: 'purchases.html', icon: '🛒', label: 'Закупки' },
      { href: 'reconcile.html',        icon: '📑', label: 'Акты сверок' },
      { href: 'counterparties.html',   icon: '🤝', label: 'Контрагенты' },
      { href: 'payouts.html',          icon: '💰', label: 'Зарплаты' },
    ]},
    { id: 'settings', icon: '⚙️', label: 'Настройки', href: 'settings.html' },
  ];

  var ADMIN_NAV = { id: 'admin', icon: '🛡', label: 'Админ', href: 'admin.html' };

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('k1r_user')); } catch(e) { return null; }
  }

  function buildSidebar(user) {
    // Партнёр не видит CRM — редирект
    if (user && user.role === 'partner') {
      window.location.href = 'partner-dashboard.html';
      return;
    }
    var isAdmin = user && user.role === 'global_admin';
    var cur = currentPage();

    // ── CSS — всё через #id, не через body inline styles ──
    var css = document.createElement('style');
    css.id = 'k1r-nav-css';
    css.textContent = [
      '/* nav layout */',
      'body.k1r-has-sidebar { margin: 0 }',
      '#k1r-sidebar {',
      '  width: 230px; position: fixed; top: 0; left: 0;',
      '  height: 100vh; height: 100dvh; height: calc(var(--vh, 1vh) * 100);',
      '  background: linear-gradient(180deg,#2e1065 0%,#4c1d95 40%,#5b21b6 100%);',
      '  color: #fff; display: flex; flex-direction: column;',
      '  z-index: 1000; overflow-y: auto; -webkit-overflow-scrolling: touch;',
      '  overscroll-behavior: contain;',
      '  box-shadow: 4px 0 24px rgba(124,58,237,0.15);',
      '  transition: transform .3s cubic-bezier(.4,0,.2,1);',
      '}',

      '#k1r-sidebar .sb-logo { padding: 22px 18px 14px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between }',
      '#k1r-sidebar .sb-logo-text { font-size: 19px; font-weight: 800; background: linear-gradient(135deg,#fff,#e9d5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text }',
      '#k1r-sidebar .sb-logo-sub { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; letter-spacing: 0.05em }',

      '/* Close button — всегда готов, скрыт на десктопе */',
      '.sb-close-btn { display: none; background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 0; border-radius: 8px; width: 36px; height: 36px; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; line-height: 1; flex-shrink: 0; touch-action: manipulation }',
      '.sb-close-btn:active { background: rgba(255,255,255,0.3); transform: scale(0.9) }',

      '#k1r-sidebar nav { flex: 1; padding: 8px 0 }',
      '#k1r-sidebar .sb-item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; cursor: pointer; border-radius: 10px; margin: 1px 8px; font-size: 14px; color: rgba(255,255,255,0.7); text-decoration: none; transition: all .15s; user-select: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation }',
      '#k1r-sidebar .sb-item:hover { background: rgba(255,255,255,0.1); color: #fff }',
      '#k1r-sidebar .sb-item.active { background: rgba(255,255,255,0.18); color: #fff; font-weight: 600 }',
      '#k1r-sidebar .sb-item .sb-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0 }',
      '#k1r-sidebar .sb-item .sb-arrow { margin-left: auto; font-size: 11px; transition: transform .25s; color: rgba(255,255,255,0.4) }',
      '#k1r-sidebar .sb-item.open .sb-arrow { transform: rotate(90deg); color: rgba(255,255,255,0.7) }',
      '#k1r-sidebar .sb-children { overflow: hidden; max-height: 0; transition: max-height .3s }',
      '#k1r-sidebar .sb-children.open { max-height: 400px }',
      '#k1r-sidebar .sb-child { display: flex; align-items: center; gap: 8px; padding: 7px 16px 7px 46px; font-size: 13px; color: rgba(255,255,255,0.55); text-decoration: none; border-radius: 8px; margin: 1px 8px; transition: all .15s; -webkit-tap-highlight-color: transparent; touch-action: manipulation }',
      '#k1r-sidebar .sb-child:hover { background: rgba(255,255,255,0.08); color: #fff }',
      '#k1r-sidebar .sb-child.active { color: #c4b5fd; font-weight: 600; background: rgba(196,181,253,0.1) }',
      '#k1r-sidebar .sb-bottom { padding: 12px 8px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: auto }',
      '#k1r-sidebar .sb-user { padding: 6px 16px; font-size: 11px; color: rgba(255,255,255,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }',
      '#k1r-sidebar .sb-btn-new { display: flex; align-items: center; justify-content: center; gap: 6px; background: linear-gradient(135deg,#a855f7,#ec4899); color: #fff; border: none; border-radius: 10px; padding: 11px; margin: 8px 10px; cursor: pointer; font-size: 13px; font-weight: 700; text-decoration: none; transition: all .2s; box-shadow: 0 2px 12px rgba(168,85,247,0.3); -webkit-tap-highlight-color: transparent }',
      '#k1r-sidebar .sb-btn-new:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(168,85,247,0.4) }',
      '#k1r-sidebar .sb-btn-record { display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px; margin: 4px 10px 8px; cursor: pointer; font-size: 13px; font-weight: 600; text-decoration: none; transition: all .2s; -webkit-tap-highlight-color: transparent }',
      '#k1r-sidebar .sb-btn-record:hover { background: rgba(255,255,255,0.18) }',

      '#k1r-main { margin-left: 230px; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column }',

      '#k1r-topbar { display: none }',

      '#k1r-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; height: 100dvh; background: rgba(46,16,101,.55); z-index: 999; display: none; -webkit-tap-highlight-color: transparent; cursor: pointer }',

      '/* ── Mobile ── */',
      '@media (max-width: 768px) {',
      '  #k1r-sidebar { transform: translateX(-100%); width: min(280px, 82vw); will-change: transform }',
      '  #k1r-sidebar.mobile-open { transform: translateX(0) }',
      '  .sb-close-btn { display: flex !important }',
      '  #k1r-main { margin-left: 0 }',
      '  #k1r-topbar { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg,#2e1065,#4c1d95); color: #fff; position: sticky; top: 0; z-index: 98; box-shadow: 0 2px 16px rgba(124,58,237,0.2) }',
      '  #k1r-topbar .tb-title { font-size: 17px; font-weight: 800; flex: 1; background: linear-gradient(135deg,#fff,#e9d5ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text }',
      '  .tb-menu-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 4px; border-radius: 8px; -webkit-tap-highlight-color: transparent; min-width: 36px; min-height: 36px; touch-action: manipulation }',
      '  .tb-menu-btn:active { background: rgba(255,255,255,0.15) }',
      '}',
    ].join('\n');
    document.head.appendChild(css);

    // Добавляем маркер на body
    document.body.classList.add('k1r-has-sidebar');

    // ── Sidebar DOM ──────────────────────────
    var sidebar = document.createElement('div');
    sidebar.id = 'k1r-sidebar';

    // Logo + close
    var logoDiv = document.createElement('div');
    logoDiv.className = 'sb-logo';
    var logoLeft = document.createElement('div');
    logoLeft.innerHTML = '<span class="sb-logo-text">Keep1R</span><small class="sb-logo-sub">CRM</small>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'sb-close-btn';
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Закрыть меню');
    closeBtn.textContent = '\u2715';
    logoDiv.appendChild(logoLeft);
    logoDiv.appendChild(closeBtn);
    sidebar.appendChild(logoDiv);

    // Action buttons
    var btnNew = document.createElement('a');
    btnNew.className = 'sb-btn-new';
    btnNew.href = 'calculator.html';
    btnNew.textContent = '\uFF0B Новый расчёт';
    sidebar.appendChild(btnNew);

    // Кнопка "Записать авто" убрана — запись через календарь или доску

    // Nav items
    var nav = document.createElement('nav');
    var items = isAdmin ? NAV.concat([ADMIN_NAV]) : NAV;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.children) {
        var isOpen = false;
        for (var j = 0; j < item.children.length; j++) {
          if (item.children[j].href === cur) isOpen = true;
        }

        var sectionEl = document.createElement('div');
        sectionEl.className = 'sb-item' + (isOpen ? ' open' : '');
        sectionEl.setAttribute('data-section', item.id);
        sectionEl.innerHTML = '<span class="sb-icon">' + item.icon + '</span>' + item.label + '<span class="sb-arrow">\u203A</span>';
        nav.appendChild(sectionEl);

        var childWrap = document.createElement('div');
        childWrap.className = 'sb-children' + (isOpen ? ' open' : '');
        for (var k = 0; k < item.children.length; k++) {
          var c = item.children[k];
          var a = document.createElement('a');
          a.className = 'sb-child' + (cur === c.href ? ' active' : '');
          a.href = c.href;
          a.textContent = c.icon + ' ' + c.label;
          childWrap.appendChild(a);
        }
        nav.appendChild(childWrap);
      } else {
        var link = document.createElement('a');
        link.className = 'sb-item' + (cur === item.href ? ' active' : '');
        link.href = item.href;
        link.innerHTML = '<span class="sb-icon">' + item.icon + '</span>' + item.label;
        nav.appendChild(link);
      }
    }
    sidebar.appendChild(nav);

    // Bottom
    var bottom = document.createElement('div');
    bottom.className = 'sb-bottom';
    var userEl = document.createElement('div');
    userEl.className = 'sb-user';
    userEl.textContent = user ? user.email : '';
    bottom.appendChild(userEl);
    // Кнопка подписки — скрыта по умолчанию, покажется если нет доступа
    var subBtn = document.createElement('a');
    subBtn.id = 'k1r-sub-btn';
    subBtn.className = 'sb-btn-new';
    subBtn.href = 'subscription.html';
    subBtn.style.cssText = 'display:none;background:linear-gradient(135deg,#f59e0b,#f97316);margin:4px 10px 8px;box-shadow:0 2px 12px rgba(245,158,11,0.3)';
    subBtn.textContent = '💳 Оформить подписку';
    bottom.appendChild(subBtn);

    var logoutEl = document.createElement('a');
    logoutEl.className = 'sb-item';
    logoutEl.href = '#';
    logoutEl.innerHTML = '<span class="sb-icon">🚪</span>Выйти';
    logoutEl.onclick = function(e) {
      e.preventDefault();
      localStorage.removeItem('k1r_token');
      localStorage.removeItem('k1r_user');
      window.location.href = 'welcome.html';
    };
    bottom.appendChild(logoutEl);
    sidebar.appendChild(bottom);

    // ── Insert into page ──────────────────────
    document.body.insertBefore(sidebar, document.body.firstChild);

    var main = document.createElement('div');
    main.id = 'k1r-main';
    // Move all body children except sidebar into main
    while (document.body.children.length > 1) {
      main.appendChild(document.body.children[1]);
    }
    document.body.appendChild(main);

    // Topbar (mobile hamburger)
    var topbar = document.createElement('div');
    topbar.id = 'k1r-topbar';
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'tb-menu-btn';
    toggleBtn.setAttribute('type', 'button');
    toggleBtn.setAttribute('aria-label', 'Открыть меню');
    toggleBtn.textContent = '\u2630';
    var tbTitle = document.createElement('span');
    tbTitle.className = 'tb-title';
    tbTitle.textContent = 'Keep1R CRM';
    topbar.appendChild(toggleBtn);
    topbar.appendChild(tbTitle);
    main.insertBefore(topbar, main.firstChild);

    // Overlay
    var overlay = document.createElement('div');
    overlay.id = 'k1r-overlay';
    document.body.appendChild(overlay);

    // ══════════════════════════════════════════════
    // OPEN / CLOSE — addEventListener вместо inline onclick
    // для надёжной работы на мобильных браузерах.
    // ══════════════════════════════════════════════

    window._k1rOpen = function() {
      var s = document.getElementById('k1r-sidebar');
      var o = document.getElementById('k1r-overlay');
      if (s) s.classList.add('mobile-open');
      if (o) { o.style.display = 'block'; o.style.pointerEvents = 'auto'; }
    };

    window._k1rClose = function() {
      var s = document.getElementById('k1r-sidebar');
      var o = document.getElementById('k1r-overlay');
      if (s) s.classList.remove('mobile-open');
      if (o) { o.style.display = 'none'; o.style.pointerEvents = 'none'; }
    };

    // Hamburger
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      window._k1rOpen();
    });

    // Close button
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      window._k1rClose();
    });

    // Overlay — cursor:pointer нужен для Safari iOS click delegation на div
    overlay.style.cursor = 'pointer';
    overlay.addEventListener('click', function() {
      window._k1rClose();
    });

    // ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') window._k1rClose();
    });

    // Section accordion
    var sections = nav.querySelectorAll('[data-section]');
    for (var s = 0; s < sections.length; s++) {
      (function(el) {
        el.onclick = function() {
          el.classList.toggle('open');
          if (el.nextElementSibling) el.nextElementSibling.classList.toggle('open');
        };
      })(sections[s]);
    }

    // Nav links auto-close on mobile
    sidebar.onclick = function(e) {
      var a = e.target;
      while (a && a !== sidebar) {
        if (a.tagName === 'A' && a.getAttribute('href') && a.getAttribute('href') !== '#') {
          setTimeout(window._k1rClose, 50);
          return;
        }
        a = a.parentElement;
      }
    };

    // Expose
    window._navCloseSidebar = window._k1rClose;
    window._navLogout = function() {
      localStorage.removeItem('k1r_token');
      localStorage.removeItem('k1r_user');
      window.location.href = 'welcome.html';
    };
  }

  function init() {
    var user = getStoredUser();
    var pub = ['welcome.html','consent.html','privacy-policy.html','user-agreement.html','calculator.html',
               'partner-login.html','partner-dashboard.html','partner-orders.html','partner-order.html',
               'partner-calculator.html','partner-subscription.html','partner-cashback.html',
               'partner-referral.html','partner-profile.html','subscription.html'];
    var cur = currentPage();
    if (!user && !pub.includes(cur)) {
      window.location.href = 'welcome.html';
      return;
    }
    // Партнёрские страницы — не строим CRM sidebar
    if (cur.startsWith('partner-') || cur === 'subscription.html') return;

    buildSidebar(user);

    // ── Баннер триала ──
    if (user) {
      var now = new Date();
      var trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
      var subEnd = user.subscription_ends_at ? new Date(user.subscription_ends_at) : null;
      var trialActive = trialEnd && trialEnd > now;
      var subActive = subEnd && subEnd > now;

      if (trialActive && !subActive) {
        var hoursLeft = Math.ceil((trialEnd - now) / 3600000);
        if (hoursLeft <= 72) {
          var banner = document.createElement('div');
          banner.style.cssText = 'background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;text-align:center;padding:8px 16px;font-size:0.82rem;font-weight:600;z-index:490';
          banner.innerHTML = '⏰ Триал: осталось ' + hoursLeft + ' ч. <a href="subscription.html" style="color:#fff;text-decoration:underline;margin-left:8px">Оформить подписку →</a>';
          var mainEl = document.getElementById('k1r-main');
          if (mainEl) mainEl.insertBefore(banner, mainEl.firstChild);
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── RBAC: фильтрация пунктов меню по роли ──
  // Вызывается из страниц после getStudioContext()
  var PAGE_PERMS = {
    'board.html':'view_board','work-order.html':'view_board','inventory.html':'view_inventory',
    'sales.html':'view_sales','clients.html':'view_clients','calculations.html':'view_calcs',
    'calculator.html':'view_calcs','executors.html':'view_executors','calendar.html':'view_calendar',
    'analytics.html':'view_analytics','cashflow.html':'view_finance','purchases.html':'view_finance',
    'reconcile.html':'view_finance','counterparties.html':'view_finance','payouts.html':'view_finance',
    'settings.html':'view_settings','assign-work.html':'edit_board','acceptance-act.html':'view_board',
    'admin.html':'_global_admin',
  };
  var ROLE_PERMS = {
    staff: ['view_board','view_calcs','view_calendar','view_clients','view_inventory','view_executors'],
    manager: ['view_board','edit_board','view_sales','edit_sales','view_calcs','edit_calcs','view_clients','edit_clients','view_calendar','edit_calendar','view_inventory','edit_inventory','view_analytics','view_executors','edit_executors','view_finance','view_settings'],
    owner: ['view_board','edit_board','view_sales','edit_sales','view_calcs','edit_calcs','view_clients','edit_clients','view_calendar','edit_calendar','view_inventory','edit_inventory','view_analytics','view_executors','edit_executors','view_finance','edit_finance','view_settings','edit_settings','manage_members'],
  };

  window.applyNavRBAC = function(role) {
    if (!role || role === 'owner' || !ROLE_PERMS[role]) return; // owner и неизвестные роли — видят всё
    var perms = ROLE_PERMS[role] || [];
    var permSet = {};
    for (var i = 0; i < perms.length; i++) permSet[perms[i]] = true;

    var links = document.querySelectorAll('#k1r-sidebar .sb-child');
    for (var j = 0; j < links.length; j++) {
      var href = links[j].getAttribute('href');
      if (!href) continue;
      var page = href.split('?')[0];
      var perm = PAGE_PERMS[page];
      if (perm && !permSet[perm]) {
        links[j].style.display = 'none';
      }
    }

    // Скрываем секции если все дочерние скрыты
    var sections = document.querySelectorAll('#k1r-sidebar .sb-children');
    for (var s = 0; s < sections.length; s++) {
      var visible = sections[s].querySelectorAll('.sb-child:not([style*="display: none"])');
      if (visible.length === 0) {
        // Скрыть и заголовок секции (предыдущий sibling)
        var prev = sections[s].previousElementSibling;
        if (prev && prev.classList.contains('sb-item')) prev.style.display = 'none';
        sections[s].style.display = 'none';
      }
    }
  };

  window.initNav = function() {};
  window.normalizeStatus = function(s) { return s || 'draft'; };
  window.getStatusLabel  = function(s) { return (window.STATUSES[s] || window.STATUSES.draft).label; };
  window.getStatusIcon   = function(s) { return (window.STATUSES[s] || window.STATUSES.draft).icon; };
  window.getStatusCls    = function(s) { return (window.STATUSES[s] || window.STATUSES.draft).cls; };

})();

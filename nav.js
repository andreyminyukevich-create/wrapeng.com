/**
 * nav.js — Sidebar навигация Keep1R CRM
 */
(function () {
  'use strict';
  document.documentElement.setAttribute('data-theme', 'light');

  const ADMIN_ID = 'c5db87ec-8e4a-4c48-bad3-5747513224d9';

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

  const NAV = [
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
      { href: 'payouts.html',   icon: '💰', label: 'Зарплаты' },
      { href: 'calendar.html',  icon: '🗓', label: 'Календарь' },
    ]},
    { id: 'analytics', icon: '📊', label: 'Аналитика', href: 'analytics.html' },
    { id: 'finance', icon: '💳', label: 'Бухгалтерия', children: [
      { href: 'cashflow.html',   icon: '💸', label: 'ДДС' },
      { href: 'income.html',     icon: '📥', label: 'Поступления' },
      { href: 'reconcile.html',  icon: '📑', label: 'Акты сверок' },
      { href: 'counterparties.html', icon: '🤝', label: 'Контрагенты' },
      { href: 'payouts.html',    icon: '💰', label: 'Зарплаты' },
    ]},
    { id: 'settings', icon: '⚙️', label: 'Настройки', href: 'settings.html' },
  ];

  const ADMIN_NAV = { id: 'admin', icon: '🛡', label: 'Админ', href: 'admin.html' };

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem('k1r_user')); } catch { return null; }
  }

  function buildSidebar(user) {
    const isAdmin = user && user.id === ADMIN_ID;
    const cur = currentPage();

    const style = document.createElement('style');
    style.textContent = `
      *,*::before,*::after{box-sizing:border-box}
      body{margin:0;display:flex;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      #k1r-sidebar{width:230px;min-width:230px;background:linear-gradient(180deg,#2e1065 0%,#4c1d95 40%,#5b21b6 100%);color:#fff;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;transition:transform .3s cubic-bezier(.4,0,.2,1);overflow-y:auto;box-shadow:4px 0 24px rgba(124,58,237,0.15)}
      #k1r-sidebar .sb-logo{padding:22px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.1)}
      #k1r-sidebar .sb-logo span{font-size:19px;font-weight:800;background:linear-gradient(135deg,#fff 0%,#e9d5ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      #k1r-sidebar .sb-logo small{display:block;font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;letter-spacing:0.05em}
      #k1r-sidebar nav{flex:1;padding:8px 0}
      #k1r-sidebar .sb-item{display:flex;align-items:center;gap:10px;padding:9px 16px;cursor:pointer;border-radius:10px;margin:1px 8px;font-size:14px;color:rgba(255,255,255,0.7);text-decoration:none;transition:all .2s ease;user-select:none}
      #k1r-sidebar .sb-item:hover{background:rgba(255,255,255,0.1);color:#fff}
      #k1r-sidebar .sb-item.active{background:rgba(255,255,255,0.18);color:#fff;font-weight:600}
      #k1r-sidebar .sb-item .sb-icon{font-size:16px;width:20px;text-align:center;flex-shrink:0}
      #k1r-sidebar .sb-item .sb-arrow{margin-left:auto;font-size:11px;transition:transform .25s ease;color:rgba(255,255,255,0.4)}
      #k1r-sidebar .sb-item.open .sb-arrow{transform:rotate(90deg);color:rgba(255,255,255,0.7)}
      #k1r-sidebar .sb-children{overflow:hidden;max-height:0;transition:max-height .3s ease}
      #k1r-sidebar .sb-children.open{max-height:400px}
      #k1r-sidebar .sb-child{display:flex;align-items:center;gap:8px;padding:7px 16px 7px 46px;font-size:13px;color:rgba(255,255,255,0.55);text-decoration:none;border-radius:8px;margin:1px 8px;transition:all .2s ease}
      #k1r-sidebar .sb-child:hover{background:rgba(255,255,255,0.08);color:#fff}
      #k1r-sidebar .sb-child.active{color:#c4b5fd;font-weight:600;background:rgba(196,181,253,0.1)}
      #k1r-sidebar .sb-divider{height:1px;background:rgba(255,255,255,0.08);margin:8px 16px}
      #k1r-sidebar .sb-bottom{padding:12px 8px;border-top:1px solid rgba(255,255,255,0.08);margin-top:auto}
      #k1r-sidebar .sb-user{padding:6px 16px;font-size:11px;color:rgba(255,255,255,0.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #k1r-sidebar .sb-btn-new{display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border:none;border-radius:10px;padding:11px;margin:8px 10px;cursor:pointer;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s ease;box-shadow:0 2px 12px rgba(168,85,247,0.3)}
      #k1r-sidebar .sb-btn-new:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(168,85,247,0.4)}
      #k1r-sidebar .sb-btn-record{display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px;margin:4px 10px 8px;cursor:pointer;font-size:13px;font-weight:600;text-decoration:none;transition:all .2s ease}
      #k1r-sidebar .sb-btn-record:hover{background:rgba(255,255,255,0.18);border-color:rgba(255,255,255,0.25)}
      #k1r-main{margin-left:230px;flex:1;min-width:0;display:flex;flex-direction:column}
      #k1r-topbar{display:none}
      #k1r-overlay{display:none;position:fixed;inset:0;background:rgba(46,16,101,.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:99;transition:opacity .3s ease}
      #k1r-overlay.show{display:block}
      @media(max-width:768px){
        #k1r-sidebar{transform:translateX(-100%)}
        #k1r-sidebar.mobile-open{transform:translateX(0)}
        #k1r-main{margin-left:0}
        #k1r-topbar{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#2e1065,#4c1d95);color:#fff;position:sticky;top:0;z-index:98;box-shadow:0 2px 16px rgba(124,58,237,0.2)}
        #k1r-topbar .tb-title{font-size:17px;font-weight:800;flex:1;background:linear-gradient(135deg,#fff,#e9d5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        #k1r-topbar .tb-menu{background:none;border:none;color:#fff;font-size:24px;cursor:pointer;padding:4px;border-radius:8px;transition:background .2s ease;-webkit-tap-highlight-color:transparent}
        #k1r-topbar .tb-menu:active{background:rgba(255,255,255,0.15)}
      }
    `;
    document.head.appendChild(style);

    const sidebar = document.createElement('div');
    sidebar.id = 'k1r-sidebar';

    let html = `<div class="sb-logo"><span>Keep1R</span><small>CRM</small></div>`;
    html += `<a class="sb-btn-new" href="calculator.html">＋ Новый расчёт</a>`;
    html += `<a class="sb-btn-record" href="booking-popup.js" onclick="event.preventDefault();window.openBookingPopup?.()">🚗 Записать авто</a>`;
    html += `<nav>`;

    const items = isAdmin ? [...NAV, ADMIN_NAV] : NAV;
    for (const item of items) {
      if (item.children) {
        const open = item.children.some(c => c.href === cur);
        html += `<div class="sb-item${open ? ' open' : ''}" data-section="${item.id}">
          <span class="sb-icon">${item.icon}</span>${item.label}
          <span class="sb-arrow">›</span>
        </div>
        <div class="sb-children${open ? ' open' : ''}">`;
        for (const c of item.children) {
          html += `<a class="sb-child${cur === c.href ? ' active' : ''}" href="${c.href}">${c.icon} ${c.label}</a>`;
        }
        html += `</div>`;
      } else {
        html += `<a class="sb-item${cur === item.href ? ' active' : ''}" href="${item.href}"><span class="sb-icon">${item.icon}</span>${item.label}</a>`;
      }
    }

    html += `</nav>`;
    html += `<div class="sb-bottom">
      <div class="sb-user">${user ? user.email : ''}</div>
      <a class="sb-item" href="#" id="sb-logout"><span class="sb-icon">🚪</span>Выйти</a>
    </div>`;

    sidebar.innerHTML = html;
    document.body.insertBefore(sidebar, document.body.firstChild);

    const main = document.createElement('div');
    main.id = 'k1r-main';
    while (document.body.children.length > 1 && document.body.children[1].id !== 'k1r-overlay') {
      main.appendChild(document.body.children[1]);
    }
    document.body.appendChild(main);

    const topbar = document.createElement('div');
    topbar.id = 'k1r-topbar';
    topbar.innerHTML = `<button class="tb-menu" id="sb-toggle">☰</button><span class="tb-title">Keep1R CRM</span>`;
    main.insertBefore(topbar, main.firstChild);

    const overlay = document.createElement('div');
    overlay.id = 'k1r-overlay';
    document.body.appendChild(overlay);

    sidebar.querySelectorAll('[data-section]').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('open');
        el.nextElementSibling.classList.toggle('open');
      });
    });

    document.getElementById('sb-toggle')?.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('show');
    });

    document.getElementById('sb-logout')?.addEventListener('click', async e => {
      e.preventDefault();
      localStorage.removeItem('k1r_token');
      localStorage.removeItem('k1r_user');
      window.location.href = 'welcome.html';
    });
  }

  function init() {
    const user = getStoredUser();
    const pub = ['welcome.html','consent.html','privacy-policy.html','user-agreement.html','calculator.html'];
    if (!user && !pub.includes(currentPage())) {
      window.location.href = 'welcome.html';
      return;
    }
    buildSidebar(user);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.initNav = function() {};
  window.normalizeStatus = s => s || 'draft';
  window.getStatusLabel  = s => (window.STATUSES[s] || window.STATUSES.draft).label;
  window.getStatusIcon   = s => (window.STATUSES[s] || window.STATUSES.draft).icon;
  window.getStatusCls    = s => (window.STATUSES[s] || window.STATUSES.draft).cls;

})();

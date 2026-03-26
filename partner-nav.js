/**
 * partner-nav.js — навигация для кабинета партнёра Keep1R
 */
(function() {
  'use strict';

  var NAV_ITEMS = [
    { href: 'partner-dashboard.html', icon: '🏠', label: 'Главная' },
    { href: 'partner-orders.html',    icon: '📦', label: 'Закупки' },
    { href: 'partner-calculator.html',icon: '🧮', label: 'Калькулятор' },
    { href: 'partner-subscription.html',icon:'💳',label: 'Подписка' },
    { href: 'partner-cashback.html',  icon: '🎁', label: 'Бонусы' },
    { href: 'partner-profile.html',   icon: '👤', label: 'Профиль' },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'partner-dashboard.html';
  }

  function build() {
    var cur = currentPage();
    var nav = document.createElement('nav');
    nav.className = 'partner-topnav';
    nav.innerHTML =
      '<div class="pn-inner">' +
        '<a class="pn-brand" href="partner-dashboard.html">Keep1R <span>Partner</span></a>' +
        '<div class="pn-links" id="pnLinks"></div>' +
        '<button class="pn-burger" id="pnBurger">☰</button>' +
        '<button class="pn-logout" onclick="localStorage.removeItem(\'k1r_token\');localStorage.removeItem(\'k1r_user\');location.href=\'partner-login.html\'">Выйти</button>' +
      '</div>';

    var links = nav.querySelector('#pnLinks');
    NAV_ITEMS.forEach(function(item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = 'pn-link' + (cur === item.href ? ' active' : '');
      a.textContent = item.icon + ' ' + item.label;
      links.appendChild(a);
    });

    document.body.insertBefore(nav, document.body.firstChild);

    // Mobile burger
    nav.querySelector('#pnBurger').addEventListener('click', function() {
      links.classList.toggle('open');
    });

    // Inject CSS
    var style = document.createElement('style');
    style.textContent = [
      '.partner-topnav { background: linear-gradient(135deg,#2e1065,#5b21b6); color:#fff; position:sticky; top:0; z-index:1000; box-shadow:0 2px 12px rgba(124,58,237,0.2) }',
      '.pn-inner { max-width:1280px; margin:0 auto; display:flex; align-items:center; padding:0 20px; height:56px; gap:8px }',
      '.pn-brand { font-size:1.1rem; font-weight:800; color:#fff; text-decoration:none; margin-right:auto; white-space:nowrap }',
      '.pn-brand span { color:#c4b5fd; font-weight:600 }',
      '.pn-links { display:flex; gap:2px; align-items:center }',
      '.pn-link { padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; color:rgba(255,255,255,0.7); text-decoration:none; transition:all .15s; white-space:nowrap }',
      '.pn-link:hover { background:rgba(255,255,255,0.1); color:#fff }',
      '.pn-link.active { background:rgba(255,255,255,0.18); color:#fff }',
      '.pn-burger { display:none; background:rgba(255,255,255,0.15); border:none; color:#fff; font-size:1.2rem; cursor:pointer; padding:6px 10px; border-radius:8px }',
      '.pn-logout { padding:6px 14px; border-radius:8px; font-size:0.78rem; font-weight:700; background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.7); border:none; cursor:pointer; transition:all .15s; font-family:inherit }',
      '.pn-logout:hover { background:rgba(255,255,255,0.2); color:#fff }',
      '@media (max-width:768px) {',
      '  .pn-inner { height:48px; padding:0 12px }',
      '  .pn-links { display:none; position:absolute; top:48px; left:0; right:0; background:#2e1065; flex-direction:column; padding:8px 12px 12px; box-shadow:0 8px 24px rgba(0,0,0,0.3) }',
      '  .pn-links.open { display:flex }',
      '  .pn-link { padding:10px 14px; font-size:0.85rem; border-radius:10px }',
      '  .pn-burger { display:block }',
      '  .pn-logout { font-size:0.72rem; padding:5px 10px }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();

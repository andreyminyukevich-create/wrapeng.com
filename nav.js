/**
 * nav.js — Единая навигация CRM
 *
 * Зависит от: supabase.js (должен быть загружен раньше через type="module")
 * Подключение: <script src="nav.js"></script>  (классический скрипт, не модуль)
 *
 * Supabase-клиент берётся исключительно из window._crmSb (инициализирован в supabase.js).
 * Никакого createClient здесь нет.
 */
(function () {
  'use strict';

  document.documentElement.setAttribute('data-theme', 'light');

  // ── Статусы заказов (глобально для всех страниц) ─────────────────
  window.STATUSES = {
    // ── 9-шаговый pipeline ─────────────────────────────────────────
    new:         { label: 'Расчёт произведён',      short: 'Расчёт',   icon: '📋', cls: 'status-new',         step: 1 },
    scheduled:   { label: 'Запись подтверждена',    short: 'Запись',   icon: '📅', cls: 'status-scheduled',   step: 2 },
    accepted:    { label: 'Авто принято',           short: 'Принято',  icon: '🔑', cls: 'status-accepted',    step: 3 },
    in_progress: { label: 'В работе',               short: 'В работе', icon: '🔧', cls: 'status-in_progress', step: 4 },
    waiting:     { label: 'Ожидание',               short: 'Ожидание', icon: '⏸', cls: 'status-waiting',    step: 5 },
    done:        { label: 'Готово',                 short: 'Готово',   icon: '✅', cls: 'status-done',        step: 6 },
    delivered:   { label: 'Выдано',                 short: 'Выдано',   icon: '🚗', cls: 'status-delivered',   step: 7 },
    closed:      { label: 'Закрыто',                short: 'Закрыто',  icon: '🔒', cls: 'status-closed',      step: 8 },
    cancelled:   { label: 'Отменено',               short: 'Отменено', icon: '❌', cls: 'status-cancelled',   step: 9 },
  };
  // Обратная совместимость: старые записи с 'Принято в работу' и 'Завершено' продолжают работать
  // через normalizeStatus() — маппинг происходит на уровне отображения, данные не меняются.

  // ADMIN_ID не является секретом — это публичный UUID для UI-ветки.
  // Источник истины: core/auth.js → ADMIN_ID.
  const ADMIN_ID = 'c5db87ec-8e4a-4c48-bad3-5747513224d9';

  const PAGES = [
    { href: 'dashboard.html', icon: '🏠', label: 'Главная' },
    { href: 'board.html',     icon: '📋', label: 'Доска' },
    { href: 'executors.html', icon: '👥', label: 'Сотрудники' },
    { href: 'payouts.html',   icon: '💰', label: 'Зарплаты' },
    { href: 'analytics.html', icon: '📊', label: 'Аналитика' },
    { href: 'calendar.html',  icon: '🗓', label: 'Календарь' },
    { href: 'inventory.html', icon: '📦', label: 'Склад' },
    { href: 'settings.html',  icon: '🔧', label: 'Настройки' },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'dashboard.html';
  }

  // Получаем клиент — только из window._crmSb, без fallback createClient
  function getSb() {
    if (!window._crmSb) {
      console.warn('[nav] window._crmSb не найден. Убедись, что supabase.js подключён раньше nav.js.');
    }
    return window._crmSb ?? null;
  }

  // ── Выход ─────────────────────────────────────────────────────────
  window._navLogout = async function () {
    const sb = getSb();
    if (sb) await sb.auth.signOut();
    window.location.href = 'welcome.html';
  };

  // ── Инициализация навигации ───────────────────────────────────────
  window.initNav = function (config) {
    if (document.getElementById('navTopBar')) return; // защита от двойного вызова

    config = config || {};
    const actionHref  = config.actionHref  ?? 'calculator.html';
    const actionLabel = config.actionLabel ?? '➕ Новый расчёт';
    const hideAction  = config.hideAction  ?? false;
    const page        = config.activePage  ?? currentPage();

    // Ссылки верхней панели
    const links = PAGES.map(p => {
      const isActive = p.href === page;
      const cls = 'nav-link' + (isActive ? ' active' : '') + (p.soon ? ' nav-soon' : '');
      const badge = p.soon ? ' <span class="nav-soon-badge">скоро</span>' : '';
      return `<a href="${p.soon ? '#' : p.href}" class="${cls}">${p.icon} ${p.label}${badge}</a>`;
    }).join('');

    const actionBtn = hideAction ? '' :
      `<a href="${actionHref}" class="btn-nav-action">${actionLabel}</a>` +
      `<button class="btn-nav-book" id="btnNavBook">📅 Записать авто</button>`;

    const logoutBtn = `<button class="btn-nav-logout" id="btnNavLogout">Выйти →</button>`;

    // Bottom tab bar
    const BOTTOM_TABS = [
      { href: 'dashboard.html', icon: '🏠', label: 'Главная' },
      { href: 'board.html',     icon: '📋', label: 'Доска' },
      { href: actionHref,       icon: null,  label: 'Расчёт', isMain: true },
      { href: 'analytics.html', icon: '📊', label: 'Аналитика' },
      { href: 'settings.html',  icon: '⚙️', label: 'Ещё' },
    ];

    const bottomTabs = BOTTOM_TABS.map(tab => {
      const isActive = tab.href === page;
      if (tab.isMain) {
        return `<a href="${tab.href}" class="nav-tab nav-tab-main">
          <div class="nav-tab-icon-wrap">➕</div>
          <span class="nav-tab-label">${tab.label}</span>
        </a>`;
      }
      return `<a href="${tab.href}" class="nav-tab${isActive ? ' active' : ''}">
        <span class="nav-tab-icon">${tab.icon}</span>
        <span class="nav-tab-label">${tab.label}</span>
      </a>`;
    }).join('');

    // Вставляем topBar
    const topBar = document.createElement('div');
    topBar.id = 'navTopBar';
    topBar.innerHTML =
      `<a href="dashboard.html" class="nav-brand">Keep1R CRM</a>` +
      `<nav class="nav-links">${links}</nav>` +
      `<div class="nav-right">${actionBtn}${logoutBtn}</div>`;
    document.body.insertBefore(topBar, document.body.firstChild);

    // Вставляем bottomBar
    const bottomBar = document.createElement('div');
    bottomBar.id = 'navBottomBar';
    bottomBar.innerHTML = bottomTabs;
    document.body.appendChild(bottomBar);

    // Навешиваем обработчики через addEventListener (не onclick)
    document.getElementById('btnNavLogout')?.addEventListener('click', window._navLogout);
    document.getElementById('btnNavBook')?.addEventListener('click', window._openNavBooking);

    // Ссылка «Админ» — только для global admin
    const sb = getSb();
    if (sb) {
      sb.auth.getSession().then(res => {
        const user = res.data?.session?.user;
        if (user?.id === ADMIN_ID) {
          const adminLink = document.createElement('a');
          adminLink.href      = 'admin.html';
          adminLink.className = 'nav-link' + (page === 'admin.html' ? ' active' : '');
          adminLink.textContent = '🔑 Админ';
          adminLink.style.color = '#7c3aed';
          const navLinks = document.querySelector('#navTopBar .nav-links');
          if (navLinks && !navLinks.querySelector('a[href="admin.html"]')) {
            navLinks.appendChild(adminLink);
          }
        }
      }).catch(() => {}); // тихо — юзер просто не увидит ссылку
    }
  };

  // ── Открыть попап записи авто ─────────────────────────────────────
  window._openNavBooking = async function () {
    // studioId берём из кэша studio-context.js или из legacy-переменных
    let sid = window._studioId || window._boardStudioId || null;

    if (!sid) {
      const sb = getSb();
      if (sb) {
        const sess = await sb.auth.getSession();
        const uid  = sess.data?.session?.user?.id;
        if (uid) {
          const { data } = await sb
            .from('studio_members')
            .select('studio_id')
            .eq('user_id', uid)
            .eq('is_active', true)
            .maybeSingle();
          if (data) {
            sid = data.studio_id;
            window._studioId = sid;
          }
        }
      }
    }

    function doOpen() {
      BookingPopup.open({ studioId: sid, onSaved: () => location.reload() });
    }

    if (window.BookingPopup) { doOpen(); return; }

    const s = document.createElement('script');
    s.src    = 'booking-popup.js';
    s.onload = doOpen;
    s.onerror = () => alert('Не удалось загрузить модуль записи.');
    document.head.appendChild(s);
  };

  // ── Проверка подписки (legacy-совместимость) ──────────────────────
  // Используется на страницах до перехода на studio-context.js.
  // После перехода всех страниц — удалить.
  window.checkSubscription = async function (studioId) {
    const sb = getSb();
    if (!sb) return 'none';

    const { data, error } = await sb
      .from('studios')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', studioId)
      .single();

    if (error || !data) return 'none';

    const { subscription_tier: tier, subscription_expires_at: expires } = data;
    const now = new Date();

    if (tier === 'active') return (!expires || new Date(expires) > now) ? 'active' : 'expired';
    if (tier === 'trial')  return (expires && new Date(expires) > now)  ? 'trial'  : 'expired';
    return 'expired';
  };

  // ── Paywall-экран ─────────────────────────────────────────────────
  window.showPaywall = function (trialExpired) {
    // Размываем весь контент кроме навбара
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'navTopBar') el.style.filter = 'blur(6px)';
    });

    const icon  = trialExpired ? '⏰' : '🔒';
    const title = trialExpired ? 'Пробный период завершён' : 'Требуется подписка';
    const desc  = trialExpired
      ? '72 часа бесплатного доступа истекли. Оформите подписку, чтобы продолжить работу.'
      : 'Для доступа к CRM необходимо оформить подписку.';

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;' +
      'justify-content:center;background:rgba(240,244,251,0.75);backdrop-filter:blur(8px);padding:20px;' +
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:20px;box-shadow:0 16px 64px rgba(37,99,235,0.15);' +
      'padding:44px 36px;max-width:400px;width:100%;text-align:center';

    // Собираем карточку через DOM, не через innerHTML
    const iconEl = document.createElement('div');
    iconEl.style.cssText = 'font-size:3rem;margin-bottom:14px';
    iconEl.textContent = icon;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:1.35rem;font-weight:800;color:#0f172a;margin-bottom:10px';
    titleEl.textContent = title;

    const descEl = document.createElement('div');
    descEl.style.cssText = 'font-size:0.88rem;color:#64748b;line-height:1.6;margin-bottom:24px';
    descEl.textContent = desc;

    const priceBox = document.createElement('div');
    priceBox.style.cssText = 'background:#f8faff;border:1px solid rgba(37,99,235,0.1);border-radius:12px;' +
      'padding:18px;margin-bottom:22px';
    priceBox.innerHTML =
      '<div style="font-size:0.72rem;color:#94a3b8;font-weight:700;letter-spacing:0.08em;' +
      'text-transform:uppercase;margin-bottom:6px">Тариф CRM</div>' +
      '<div style="font-size:2rem;font-weight:800;color:#0f172a;line-height:1">2 900' +
      '<span style="font-size:0.95rem;font-weight:500;color:#64748b">/мес</span></div>' +
      '<div style="font-size:0.8rem;color:#94a3b8;margin-top:6px">Сотрудники · Зарплаты · Аналитика · Заказы</div>';

    const ctaLink = document.createElement('a');
    ctaLink.href   = 'https://t.me/keeper_wrap';
    ctaLink.target = '_blank';
    ctaLink.rel    = 'noopener noreferrer';
    ctaLink.style.cssText = 'display:block;background:#2563eb;color:#fff;padding:13px;border-radius:10px;' +
      'font-weight:700;font-size:0.92rem;text-decoration:none;margin-bottom:10px;' +
      'box-shadow:0 4px 14px rgba(37,99,235,0.3)';
    ctaLink.textContent = 'Написать для оформления';

    const backLink = document.createElement('a');
    backLink.href  = 'calculator.html';
    backLink.style.cssText = 'font-size:0.83rem;color:#94a3b8;text-decoration:none';
    backLink.textContent = 'Вернуться к калькулятору →';

    card.append(iconEl, titleEl, descEl, priceBox, ctaLink, backLink);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  };

})();

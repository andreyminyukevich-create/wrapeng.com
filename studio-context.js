/**
 * studio-context.js
 * Единый контекст: пользователь + студия + роль + подписка.
 *
 * Использование:
 *   import { getStudioContext, clearContextCache } from './studio-context.js';
 *
 *   const ctx = await getStudioContext();
 *   // ctx.user, ctx.studioId, ctx.role, ctx.studio, ctx.subscriptionStatus
 *
 * Результат кэшируется на время жизни страницы.
 * Для принудительного обновления вызвать clearContextCache().
 */

import { sb } from './api.js';
import { getCurrentSession } from './auth.js';

// ── Кэш ──────────────────────────────────────────────────────────────
let _cache = null;

export function clearContextCache() {
  _cache = null;
}

// ── Статусы подписки ──────────────────────────────────────────────────
export const SUBSCRIPTION = {
  ACTIVE:  'active',
  TRIAL:   'trial',
  EXPIRED: 'expired',
  NONE:    'none',
};

function resolveSubscriptionStatus(tier, expiresAt) {
  const now     = new Date();
  const expires = expiresAt ? new Date(expiresAt) : null;

  if (tier === 'active') {
    return (!expires || expires > now) ? SUBSCRIPTION.ACTIVE : SUBSCRIPTION.EXPIRED;
  }
  if (tier === 'trial') {
    return (expires && expires > now) ? SUBSCRIPTION.TRIAL : SUBSCRIPTION.EXPIRED;
  }
  return SUBSCRIPTION.EXPIRED;
}

// ── Основная функция ──────────────────────────────────────────────────
/**
 * Возвращает контекст текущего пользователя.
 *
 * @returns {Promise<StudioContext | null>}
 *   null — если нет сессии (пользователь не авторизован)
 *
 * @typedef {object} StudioContext
 * @property {object}      user               — Supabase user object
 * @property {string|null} studioId           — ID студии (null если не найдена)
 * @property {string}      role               — 'owner' | 'manager' | 'staff' | 'none'
 * @property {object|null} studio             — строка из таблицы studios
 * @property {string}      subscriptionStatus — SUBSCRIPTION.* константа
 * @property {boolean}     hasAccess          — true если подписка активна или trial
 */
export async function getStudioContext() {
  if (_cache) return _cache;
  const session = await getCurrentSession();
  if (!session) return null;
  const user = session.user;

  const _smRes = await fetch("/api/studio-members/me", { headers: { "Authorization": "Bearer " + session.access_token } });
  if (!_smRes.ok) throw new Error("[studio-context] Ошибка запроса studio_members");
  const _smData = await _smRes.json();
  const member = _smData[0] ?? null;


  if (!member) {
    _cache = {
      user,
      studioId:           null,
      role:               'none',
      studio:             null,
      subscriptionStatus: SUBSCRIPTION.NONE,
      hasAccess:          false,
    };
    return _cache;
  }

  const studio = { id: member.studio_id, name: member.studio_name, subscription_tier: member.subscription_tier, subscription_expires_at: member.subscription_expires_at, settings: member.settings };
  const subscriptionStatus = resolveSubscriptionStatus(
    studio?.subscription_tier,
    studio?.subscription_expires_at,
  );

  // Проверяем profiles.subscription_ends_at (новая модель доступа)
  // Подгружаем актуальные данные с сервера
  let profileAccess = false;
  try {
    const accRes = await fetch('/api/auth/access', { headers: { 'Authorization': 'Bearer ' + session.access_token } });
    if (accRes.ok) {
      const acc = await accRes.json();
      profileAccess = !!(acc.crm_view || acc.crm_edit);
      // Обновляем localStorage
      const storedUser = JSON.parse(localStorage.getItem('k1r_user') || '{}');
      storedUser.is_partner = acc.is_partner;
      storedUser.trial_ends_at = acc.trial_ends_at;
      storedUser.subscription_ends_at = acc.sub_ends_at;
      localStorage.setItem('k1r_user', JSON.stringify(storedUser));
    }
  } catch {}

  _cache = {
    user,
    studioId:           member.studio_id,
    role:               member.role || 'staff',
    studio:             studio ?? null,
    subscriptionStatus,
    hasAccess:          subscriptionStatus === SUBSCRIPTION.ACTIVE
                     || subscriptionStatus === SUBSCRIPTION.TRIAL
                     || profileAccess,
  };

  // Совместимость с legacy-кодом (nav.js, BookingPopup и др.)
  window._studioId      = _cache.studioId;
  window._boardStudioId = _cache.studioId;
  window._userRole      = _cache.role;

  // Применяем RBAC к навигации
  if (typeof window.applyNavRBAC === 'function') window.applyNavRBAC(_cache.role);

  // Кнопка подписки: скрыть если оплаченная подписка активна, показать на триале и без доступа
  const subBtn = document.getElementById('k1r-sub-btn');
  if (subBtn) {
    const paidSub = subscriptionStatus === SUBSCRIPTION.ACTIVE || profileAccess;
    // Проверяем именно paid subscription, не триал
    const storedU = JSON.parse(localStorage.getItem('k1r_user') || '{}');
    const hasPaidSub = (storedU.subscription_ends_at && new Date(storedU.subscription_ends_at) > new Date())
                    || subscriptionStatus === SUBSCRIPTION.ACTIVE;
    subBtn.style.display = hasPaidSub ? 'none' : 'flex';
  }

  return _cache;
}

// ── RBAC — матрица прав ──────────────────────────────────────────────
/**
 * Роли: owner > manager > staff
 * Каждый уровень наследует права нижнего.
 *
 * Права:
 *   view_board, edit_board       — доска цеха
 *   view_sales, edit_sales       — воронка продаж
 *   view_calcs, edit_calcs       — расчёты
 *   view_clients, edit_clients   — клиенты
 *   view_calendar, edit_calendar — календарь
 *   view_inventory, edit_inventory — склад
 *   view_analytics               — аналитика
 *   view_finance                 — бухгалтерия (ДДС, зарплаты, закупки, акты)
 *   edit_finance                 — редактирование фин. данных
 *   view_executors, edit_executors — сотрудники
 *   view_settings, edit_settings — настройки студии
 *   manage_members               — управление участниками
 */
const ROLE_PERMISSIONS = {
  staff: new Set([
    'view_board', 'view_calcs', 'view_calendar', 'view_clients',
    'view_inventory', 'view_executors',
  ]),
  manager: new Set([
    'view_board', 'edit_board', 'view_sales', 'edit_sales',
    'view_calcs', 'edit_calcs', 'view_clients', 'edit_clients',
    'view_calendar', 'edit_calendar', 'view_inventory', 'edit_inventory',
    'view_analytics', 'view_executors', 'edit_executors',
    'view_finance', 'view_settings',
  ]),
  owner: new Set([
    'view_board', 'edit_board', 'view_sales', 'edit_sales',
    'view_calcs', 'edit_calcs', 'view_clients', 'edit_clients',
    'view_calendar', 'edit_calendar', 'view_inventory', 'edit_inventory',
    'view_analytics', 'view_executors', 'edit_executors',
    'view_finance', 'edit_finance', 'view_settings', 'edit_settings',
    'manage_members',
  ]),
};

/**
 * Проверяет, есть ли у текущего пользователя указанное право.
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(permission) {
  if (!_cache) return false;
  const perms = ROLE_PERMISSIONS[_cache.role];
  return perms ? perms.has(permission) : false;
}

/**
 * Матрица: какие страницы доступны каким ролям.
 * Используется в nav.js для фильтрации пунктов меню.
 */
export const PAGE_PERMISSIONS = {
  'board.html':          'view_board',
  'work-order.html':     'view_board',
  'inventory.html':      'view_inventory',
  'sales.html':          'view_sales',
  'clients.html':        'view_clients',
  'calculations.html':   'view_calcs',
  'calculator.html':     'view_calcs',
  'executors.html':      'view_executors',
  'calendar.html':       'view_calendar',
  'analytics.html':      'view_analytics',
  'cashflow.html':       'view_finance',
  'purchases.html':      'view_finance',
  'reconcile.html':      'view_finance',
  'counterparties.html': 'view_finance',
  'payouts.html':        'view_finance',
  'settings.html':       'view_settings',
  'assign-work.html':    'edit_board',
  'acceptance-act.html': 'view_board',
  'admin.html':          '_global_admin',
};

// ── Хелперы для частых проверок ───────────────────────────────────────
export async function requireStudio({ onMissing } = {}) {
  const ctx = await getStudioContext();
  if (!ctx) return null;
  if (!ctx.studioId) {
    if (typeof onMissing === 'function') onMissing(ctx);
    return null;
  }
  return ctx;
}

export async function requireAccess({ onPaywall } = {}) {
  const ctx = await getStudioContext();
  if (!ctx) return null;
  if (!ctx.hasAccess) {
    if (typeof onPaywall === 'function') {
      onPaywall(ctx.subscriptionStatus === SUBSCRIPTION.EXPIRED);
    } else {
      window.showPaywall?.(ctx.subscriptionStatus === SUBSCRIPTION.EXPIRED);
    }
    return null;
  }
  return ctx;
}

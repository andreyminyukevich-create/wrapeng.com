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

  _cache = {
    user,
    studioId:           member.studio_id,
    role:               member.role || 'staff',
    studio:             studio ?? null,
    subscriptionStatus,
    hasAccess:          subscriptionStatus === SUBSCRIPTION.ACTIVE
                     || subscriptionStatus === SUBSCRIPTION.TRIAL,
  };

  // Совместимость с legacy-кодом (nav.js, BookingPopup и др.)
  window._studioId      = _cache.studioId;
  window._boardStudioId = _cache.studioId;

  return _cache;
}

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

/**
 * core/auth.js
 * Авторизация: сессия, пользователь, выход, защита маршрутов.
 *
 * Использование:
 *   import { requireAuth, getCurrentUser, logout } from './core/auth.js';
 */

import { sb } from './api.js';

// ── Получить текущую сессию ───────────────────────────────────────
export async function getCurrentSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

// ── Получить текущего пользователя ────────────────────────────────
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

// ── Проверить авторизацию; редирект если нет ─────────────────────
/**
 * @param {object} [opts]
 * @param {string} [opts.redirectTo='welcome.html']  — куда редиректить если нет сессии
 * @returns {import('@supabase/supabase-js').User | null}  user или null (если выполнен редирект)
 */
export async function requireAuth({ redirectTo = 'welcome.html' } = {}) {
  const user = await getCurrentUser();
  if (!user) {
    const currentUrl = window.location.href;
    const loginUrl = redirectTo + '?returnUrl=' + encodeURIComponent(currentUrl);
    window.location.href = loginUrl;
    return null;
  }
  return user;
}

// ── Выйти ─────────────────────────────────────────────────────────
export async function logout({ redirectTo = 'welcome.html' } = {}) {
  await sb.auth.signOut();
  window.location.href = redirectTo;
}

// ── Проверить, является ли пользователь глобальным админом ────────
// Роль global_admin хранится в БД (profiles.role)
export function isGlobalAdmin(user) {
  return user?.role === 'global_admin'
      || user?.user_metadata?.role === 'global_admin';
}

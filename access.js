/**
 * access.js — проверка уровня доступа пользователя
 *
 * Три флага (не взаимоисключающие):
 *   is_partner         — постоянный доступ к закупкам/калькулятору
 *   trial_ends_at      — 72-часовой полный доступ к CRM
 *   subscription_ends_at — платная подписка, полный доступ + своё лого
 */

export function getAccess(user) {
  if (!user) return {
    purchases: false, calculator: false,
    crm_view: false, crm_edit: false, own_logo: false,
    trial_active: false, sub_active: false,
    trial_ends_at: null, sub_ends_at: null, is_partner: false,
  };
  const now = new Date();
  const trialActive = user.trial_ends_at && new Date(user.trial_ends_at) > now;
  const subActive = user.subscription_ends_at && new Date(user.subscription_ends_at) > now;
  return {
    purchases:     !!user.is_partner,
    calculator:    !!(user.is_partner || trialActive || subActive),
    crm_view:      !!(trialActive || subActive),
    crm_edit:      !!(trialActive || subActive),
    own_logo:      !!subActive,
    trial_active:  !!trialActive,
    sub_active:    !!subActive,
    trial_ends_at: user.trial_ends_at || null,
    sub_ends_at:   user.subscription_ends_at || null,
    is_partner:    !!user.is_partner,
  };
}

/** Загрузить актуальный доступ с сервера */
export async function fetchAccess() {
  try {
    const token = localStorage.getItem('k1r_token');
    if (!token) return getAccess(null);
    const res = await fetch('/api/auth/access', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return getAccess(null);
    return await res.json();
  } catch {
    return getAccess(null);
  }
}

/** Показать paywall если нет доступа */
export function showPaywall() {
  const existing = document.getElementById('_paywall');
  if (existing) existing.remove();

  const user = (() => { try { return JSON.parse(localStorage.getItem('k1r_user') || '{}'); } catch { return {}; } })();
  const trialUsed = !!user.trial_ends_at;

  const div = document.createElement('div');
  div.id = '_paywall';
  div.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:var(--font,-apple-system,sans-serif);padding:20px';

  const trialBtn = trialUsed ? '' :
    '<button onclick="window._startTrial()" style="padding:12px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;width:100%">🚀 Попробовать бесплатно 72 часа</button>';

  div.innerHTML = '<div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">' +
    '<div style="font-size:2rem;margin-bottom:12px">🔐</div>' +
    '<h2 style="font-size:1.2rem;font-weight:700;margin:0 0 8px;color:#1e1b4b">Функция недоступна</h2>' +
    '<p style="color:#6b7280;font-size:0.9rem;margin:0 0 24px;line-height:1.5">' +
      (trialUsed ? 'Ваш триал завершился. Оформите подписку чтобы продолжить.' : 'Попробуйте бесплатно 72 часа или сразу оформите подписку.') +
    '</p>' +
    '<div style="display:flex;gap:10px;flex-direction:column">' +
      trialBtn +
      '<button onclick="window.location.href=\'subscription.html\'" style="padding:12px;background:#7c3aed;color:#fff;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;width:100%">💳 Оформить подписку — от 5 000 ₽/мес</button>' +
      '<button onclick="document.getElementById(\'_paywall\').remove()" style="padding:10px;background:#f3f4f6;color:#6b7280;border:none;border-radius:10px;font-size:0.85rem;cursor:pointer;width:100%">Закрыть</button>' +
    '</div></div>';

  document.body.appendChild(div);
}

/** Запустить триал */
window._startTrial = async function() {
  try {
    const token = localStorage.getItem('k1r_token');
    const res = await fetch('/api/auth/trial', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('k1r_user') || '{}');
      user.trial_ends_at = data.trial_ends_at;
      localStorage.setItem('k1r_user', JSON.stringify(user));
      document.getElementById('_paywall')?.remove();
      location.reload();
    } else {
      alert(data.error || 'Не удалось активировать триал');
    }
  } catch {
    alert('Ошибка. Попробуйте ещё раз.');
  }
};

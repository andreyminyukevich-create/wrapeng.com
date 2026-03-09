/**
 * core/ui.js
 * Единые UI-состояния, toast, диалоги.
 * Зависит от: core/dom.js
 *
 * Использование:
 *   import { showToast, showLoading, showError, showEmpty, confirmAction } from './core/ui.js';
 */

import { createEl, clearEl } from './dom.js';

// ── Стили (инжектируются один раз) ───────────────────────────────
const CSS = `
/* ── CRM Toast ── */
#_crmToast {
  position: fixed;
  bottom: 28px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
._toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  opacity: 0;
  transform: translateY(10px) scale(0.97);
  transition: opacity 0.2s, transform 0.2s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  -webkit-font-smoothing: antialiased;
  max-width: 340px;
  word-break: break-word;
  pointer-events: auto;
}
._toast.show    { opacity: 1; transform: translateY(0) scale(1); }
._toast.success { background: #0f172a; }
._toast.error   { background: #dc2626; }
._toast.warning { background: #d97706; }
._toast.info    { background: #2563eb; }

/* ── CRM UI States ── */
._ui-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 24px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
._ui-state-icon  { font-size: 2.2rem; line-height: 1; }
._ui-state-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
._ui-state-text  {
  font-size: 0.83rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}
._ui-state-retry {
  margin-top: 6px;
  padding: 7px 18px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
._ui-state-retry:hover { background: #1d4ed8; }

/* ── Loading spinner ── */
._spinner {
  width: 24px; height: 24px;
  border: 3px solid rgba(37,99,235,0.2);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: _spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes _spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  #_crmToast { bottom: 80px; right: 16px; left: 16px; }
  ._toast { max-width: 100%; }
}
`;

let _styleInjected = false;
function injectStyles() {
  if (_styleInjected) return;
  const s = document.createElement('style');
  s.id = '_crmUiStyles';
  s.textContent = CSS;
  document.head.appendChild(s);
  _styleInjected = true;
}

// ── Toast ─────────────────────────────────────────────────────────
let _toastContainer = null;

function getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.getElementById('_crmToast');
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.id = '_crmToast';
      document.body.appendChild(_toastContainer);
    }
  }
  return _toastContainer;
}

const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

/**
 * Показывает всплывающее уведомление.
 *
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} text
 * @param {number} [duration=3000]  мс
 */
export function showToast(type = 'success', text = '', duration = 3000) {
  injectStyles();
  const container = getToastContainer();
  const el = document.createElement('div');
  el.className = `_toast ${type}`;
  el.textContent = `${TOAST_ICONS[type] ?? ''} ${text}`;
  container.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, duration);
}

// ── UI States ─────────────────────────────────────────────────────
function buildState(icon, title, text, retryFn) {
  injectStyles();
  const el = createEl('div', { className: '_ui-state' }, [
    createEl('div', { className: '_ui-state-icon',  textContent: icon }),
    createEl('p',   { className: '_ui-state-title', textContent: title }),
    ...(text  ? [createEl('p', { className: '_ui-state-text', textContent: text })] : []),
    ...(retryFn ? [createEl('button', { className: '_ui-state-retry', textContent: 'Попробовать снова', onclick: retryFn })] : []),
  ]);
  return el;
}

/**
 * Показывает индикатор загрузки в контейнере.
 * @param {Element} container
 * @param {string} [text='Загрузка...']
 */
export function showLoading(container, text = 'Загрузка...') {
  if (!container) return;
  injectStyles();
  clearEl(container);
  container.appendChild(
    createEl('div', { className: '_ui-state' }, [
      createEl('div', { className: '_spinner' }),
      createEl('p', { className: '_ui-state-text', textContent: text }),
    ])
  );
}

/**
 * Показывает состояние ошибки в контейнере.
 * @param {Element} container
 * @param {string}  [text]
 * @param {Function} [retryFn]  — если передана, появится кнопка "Попробовать снова"
 */
export function showError(container, text = 'Произошла ошибка', retryFn) {
  if (!container) return;
  clearEl(container);
  container.appendChild(buildState('❌', 'Ошибка', text, retryFn));
}

/**
 * Показывает пустое состояние в контейнере.
 * @param {Element} container
 * @param {string}  title
 * @param {string}  [text]
 */
export function showEmpty(container, title = 'Нет данных', text) {
  if (!container) return;
  clearEl(container);
  container.appendChild(buildState('📭', title, text));
}

/**
 * Показывает состояние "нет доступа" в контейнере.
 */
export function showForbidden(container, text = 'У вас нет доступа к этому разделу.') {
  if (!container) return;
  clearEl(container);
  container.appendChild(buildState('🔒', 'Нет доступа', text));
}

/**
 * Показывает состояние "не найдено" в контейнере.
 */
export function showNotFound(container, text = 'Запрошенные данные не найдены.') {
  if (!container) return;
  clearEl(container);
  container.appendChild(buildState('🔍', 'Не найдено', text));
}

// ── Блокировка кнопки на время запроса ───────────────────────────
/**
 * Блокирует кнопку, показывает progressText, по завершении восстанавливает.
 *
 * const release = lockButton(btn, '⏳ Сохранение...');
 * try { await save(); } finally { release(); }
 *
 * @param {HTMLButtonElement} btn
 * @param {string} [progressText]
 * @returns {function} release — вызвать для разблокировки
 */
export function lockButton(btn, progressText) {
  if (!btn) return () => {};
  const orig     = btn.textContent;
  const origDis  = btn.disabled;
  btn.disabled   = true;
  if (progressText) btn.textContent = progressText;
  return () => {
    btn.disabled   = origDis;
    btn.textContent = orig;
  };
}

// ── Подтверждение действия ────────────────────────────────────────
/**
 * Показывает нативный confirm (потом можно заменить на кастомный диалог).
 *
 * @param {object} opts
 * @param {string} opts.message
 * @param {string} [opts.confirmText='Да']
 * @param {string} [opts.cancelText='Отмена']
 * @returns {Promise<boolean>}
 */
export async function confirmAction({ message, confirmText = 'Да', cancelText = 'Отмена' } = {}) {
  // TODO: заменить на кастомный диалог на следующем этапе
  return window.confirm(message ?? 'Вы уверены?');
}

/**
 * core/formatters.js
 * Форматирование данных для отображения. Нет зависимостей.
 *
 * Использование:
 *   import { fmtMoney, fmtDate, fmtPhone, escapeHtml } from './core/formatters.js';
 */

// ── Деньги ────────────────────────────────────────────────────────
/**
 * Форматирует число как денежную сумму в рублях.
 * fmtMoney(12345.6) → '12 345,60'
 */
export function fmtMoney(n) {
  return parseFloat((n || 0).toFixed(2)).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Округляет до копеек (без форматирования).
 */
export function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

// ── Дата / Время ──────────────────────────────────────────────────
/**
 * Форматирует дату.
 * fmtDate('2025-06-15') → '15 июня 2025 г.'
 */
export function fmtDate(d, opts) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('ru-RU', opts ?? {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}

/**
 * Короткий формат: '15 июн.'
 */
export function fmtDateShort(d) {
  return fmtDate(d, { day: 'numeric', month: 'short' });
}

/**
 * Форматирует дату и время.
 * fmtDateTime('2025-06-15T10:30') → '15.06.2025, 10:30'
 */
export function fmtDateTime(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleString('ru-RU', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// ── Телефон ───────────────────────────────────────────────────────
/**
 * Форматирует российский номер телефона.
 * fmtPhone('79991234567') → '+7 (999) 123-45-67'
 */
export function fmtPhone(raw) {
  if (!raw) return '—';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11) {
    const d = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
    return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9,11)}`;
  }
  return raw; // не распознан — вернуть как есть
}

// ── XSS-защита ────────────────────────────────────────────────────
const _escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Экранирует пользовательскую строку для безопасной вставки в HTML.
 * Обязательно использовать для ЛЮБЫХ данных из БД / форм / URL.
 *
 * escapeHtml('<script>alert(1)</script>') → '&lt;script&gt;alert(1)&lt;/script&gt;'
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, c => _escMap[c]);
}

// ── Прочее ────────────────────────────────────────────────────────
/**
 * Первая буква заглавная.
 */
export function capitalize(s) {
  if (!s) return '';
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

/**
 * Склонение числительных.
 * pluralize(3, 'заказ', 'заказа', 'заказов') → '3 заказа'
 */
export function pluralize(n, one, few, many) {
  const abs = Math.abs(n) % 100;
  const rem = abs % 10;
  if (abs > 10 && abs < 20) return `${n} ${many}`;
  if (rem === 1) return `${n} ${one}`;
  if (rem >= 2 && rem <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

/**
 * core/errors.js
 * Единый нормализатор ошибок. Нет зависимостей.
 *
 * Использование:
 *   import { normalizeError, ERR } from './core/errors.js';
 */

// ── Типы ошибок ───────────────────────────────────────────────────
export const ERR = {
  AUTH:       'auth',        // нет/истекла сессия
  ACCESS:     'access',      // нет прав / нет подписки
  NOT_FOUND:  'not_found',   // запись не найдена
  VALIDATION: 'validation',  // некорректные данные
  NETWORK:    'network',     // сеть недоступна
  DATABASE:   'database',    // ошибка Supabase / PostgreSQL
  RENDER:     'render',      // внутренняя ошибка рендера
  UNKNOWN:    'unknown',
};

// Коды PostgreSQL → тип ошибки
const PG_CODE_MAP = {
  '42501': ERR.ACCESS,      // insufficient_privilege
  '23503': ERR.VALIDATION,  // foreign_key_violation
  '23505': ERR.VALIDATION,  // unique_violation
  '22P02': ERR.VALIDATION,  // invalid_text_representation (bad uuid etc)
  'PGRST116': ERR.NOT_FOUND, // Row not found (PostgREST)
};

// Текстовые сообщения для пользователя
const USER_MESSAGES = {
  [ERR.AUTH]:       'Сессия истекла. Пожалуйста, войдите снова.',
  [ERR.ACCESS]:     'Нет доступа к этому разделу.',
  [ERR.NOT_FOUND]:  'Запись не найдена.',
  [ERR.VALIDATION]: 'Некорректные данные.',
  [ERR.NETWORK]:    'Нет соединения с сервером. Проверьте интернет.',
  [ERR.DATABASE]:   'Ошибка базы данных.',
  [ERR.RENDER]:     'Ошибка отображения данных.',
  [ERR.UNKNOWN]:    'Произошла непредвиденная ошибка.',
};

/**
 * @typedef {object} NormalizedError
 * @property {string}  type       — ERR.*
 * @property {string}  message    — сообщение для пользователя
 * @property {string}  technical  — техническая деталь для консоли
 * @property {any}     original   — исходная ошибка
 */

/**
 * Нормализует любую ошибку в единый формат.
 *
 * @param {any} err
 * @param {string} [context]  — контекст для консоли (имя функции / страницы)
 * @returns {NormalizedError}
 */
export function normalizeError(err, context = '') {
  let type    = ERR.UNKNOWN;
  let technical = '';

  if (!err) {
    return { type: ERR.UNKNOWN, message: USER_MESSAGES[ERR.UNKNOWN], technical: 'empty error', original: err };
  }

  // Supabase / PostgREST error
  if (err.code) {
    type      = PG_CODE_MAP[err.code] ?? ERR.DATABASE;
    technical = `[${err.code}] ${err.message || ''} ${err.details || ''}`.trim();
  }
  // Сетевые ошибки
  else if (err instanceof TypeError && err.message.includes('fetch')) {
    type      = ERR.NETWORK;
    technical = err.message;
  }
  // JS Error
  else if (err instanceof Error) {
    type      = ERR.UNKNOWN;
    technical = `${err.name}: ${err.message}`;
  }
  // Строка
  else if (typeof err === 'string') {
    technical = err;
  }

  // Логируем структурированно
  const prefix = context ? `[${context}]` : '[error]';
  console.error(`${prefix} type=${type} ${technical}`, err);

  return {
    type,
    message:   USER_MESSAGES[type] ?? USER_MESSAGES[ERR.UNKNOWN],
    technical,
    original:  err,
  };
}

/**
 * Бросает ошибку с типом.
 * throw typedError(ERR.NOT_FOUND, 'calculation not found')
 */
export function typedError(type, message) {
  const err  = new Error(message);
  err._type  = type;
  return err;
}

/**
 * core/dom.js
 * Безопасные DOM-хелперы. Нет зависимостей.
 *
 * Использование:
 *   import { qs, qsa, createEl, setText, clearEl } from './core/dom.js';
 */

// ── Поиск ─────────────────────────────────────────────────────────
/** querySelector с опциональным контекстом */
export const qs  = (sel, ctx = document) => ctx.querySelector(sel);

/** querySelectorAll → Array */
export const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// ── Создание элементов ────────────────────────────────────────────
/**
 * Создаёт элемент с атрибутами и дочерними узлами.
 *
 * createEl('div', { className: 'card', id: 'main' }, [
 *   createEl('span', {}, ['Текст'])
 * ])
 *
 * @param {string} tag
 * @param {Record<string, string>} [attrs]
 * @param {(Node|string)[]} [children]
 * @returns {HTMLElement}
 */
export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') { el.className = v; }
    else if (k === 'textContent') { el.textContent = v; }
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

// ── Безопасная работа с текстом ───────────────────────────────────
/** Устанавливает textContent (безопасно, без XSS) */
export function setText(el, text) {
  if (!el) return;
  el.textContent = text ?? '';
}

/** Устанавливает textContent по селектору */
export function setTextBySel(sel, text, ctx = document) {
  const el = ctx.querySelector(sel);
  if (el) el.textContent = text ?? '';
}

// ── Очистка ───────────────────────────────────────────────────────
/** Удаляет всех потомков элемента */
export function clearEl(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** clearEl по селектору */
export function clearBySel(sel, ctx = document) {
  clearEl(ctx.querySelector(sel));
}

// ── Показ / скрытие ───────────────────────────────────────────────
export function show(el) { if (el) el.style.display = ''; }
export function hide(el) { if (el) el.style.display = 'none'; }

export function showBySel(sel, ctx = document) { show(qs(sel, ctx)); }
export function hideBySel(sel, ctx = document) { hide(qs(sel, ctx)); }

// ── Безопасный рендер списка ──────────────────────────────────────
/**
 * Рендерит список: очищает контейнер, затем добавляет элементы.
 * renderList(container, items, item => createEl('div', { textContent: item.name }))
 *
 * @param {Element} container
 * @param {any[]} items
 * @param {(item: any, index: number) => Node} renderFn
 */
export function renderList(container, items, renderFn) {
  clearEl(container);
  if (!items || items.length === 0) return;
  const frag = document.createDocumentFragment();
  items.forEach((item, i) => frag.appendChild(renderFn(item, i)));
  container.appendChild(frag);
}

// ── Event delegation ──────────────────────────────────────────────
/**
 * Подписывается на событие через delegation от родителя.
 * delegate(container, 'click', '.btn-delete', handler)
 *
 * @param {Element} parent
 * @param {string}  eventType
 * @param {string}  selector
 * @param {function} handler  — вызывается с (event, matchedElement)
 */
export function delegate(parent, eventType, selector, handler) {
  if (!parent) return;
  parent.addEventListener(eventType, e => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler(e, target);
    }
  });
}

// ── Форматирование числовых полей ─────────────────────────────────
/** Запрещает ввод отрицательного числа */
export function preventNegative(input) {
  const val = parseFloat(input.value);
  if (!isNaN(val) && val < 0) input.value = '';
}

/** Обрезает год до 4 цифр */
export function formatYearInput(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 4) val = val.slice(0, 4);
  input.value = val;
}

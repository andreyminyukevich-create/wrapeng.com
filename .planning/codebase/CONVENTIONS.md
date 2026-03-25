# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files:**
- kebab-case for filenames: `calculator-engine.js`, `calculator-persistence.js`, `dom.js`
- Core/utility modules prefixed with scope: `calculator-*`, `core/*`
- Feature-specific files grouped by prefix: all calculator-related files share `calculator-` prefix

**Functions:**
- camelCase for function names: `collectAll()`, `markups()`, `taxCoef()`, `normalizeError()`
- Verb-first for action functions: `parseNumbers()`, `clearToken()`, `preventNegative()`
- `get*` prefix for accessors: `getToken()`, `getServiceDescription()`, `getStudioContext()`
- `set*` prefix for setters: `setToken()`, `setStoredUser()`, `setText()`
- Initialization functions use `init` prefix: `initTheme()`, `initDiscounts()`, `initChart()`
- `_private` convention for truly private helpers (underscore prefix): `_emitAuth()`, `_escMap`

**Variables:**
- camelCase for all variables: `currentProfile`, `currentCalculationId`, `apiBase`
- Short abbreviations acceptable in calculator context: `mat` (materials), `mot` (motivation/labor), `det` (detailing), `pkg` (package)
- Prefix private module-level variables with underscore: `_cache`, `_authListeners`, `_auth`
- Constants in UPPERCASE_SNAKE_CASE: `NUMERIC_FIELDS`, `ADMIN_ID`, `API_BASE`, `TOKEN_KEY`
- Prefer full words in exported APIs: use `formatMoney()` not `fmtMny()`; abbreviations acceptable only in well-known patterns like `qs`/`qsa` for querySelector

**Types:**
- Class names in PascalCase: `QueryBuilder`, `NormalizedError` (in JSDoc)
- Error type constants in UPPER_CASE: `ERR.AUTH`, `ERR.VALIDATION`, `ERR.NOT_FOUND`
- Enums/constants as uppercase object keys: `SUBSCRIPTION.ACTIVE`, `SUBSCRIPTION.TRIAL`
- JSDoc typedef names in PascalCase: `StudioContext`, `NormalizedError`

## Code Style

**Formatting:**
- No dedicated formatter config detected (no .prettierrc or ESLint config files)
- Observed style: 2-space indentation (not enforced)
- Line length varies; files contain lines up to 150+ characters
- Semicolons used consistently
- Prefer `const` over `let` (observed pattern)

**Linting:**
- No ESLint config detected
- No automated linting observed
- Manual code review conventions:
  - Use `const` by default, `let` for loop counters/reassigned values
  - Avoid `var`
  - Prefer nullish coalescing (`??`) over falsy checks for defaults

**Comments:**
- JSDoc-style for exported functions with param and return types
- Example from `dom.js`:
  ```javascript
  /**
   * Создаёт элемент с атрибутами и дочерними узлами.
   *
   * @param {string} tag
   * @param {Record<string, string>} [attrs]
   * @param {(Node|string)[]} [children]
   * @returns {HTMLElement}
   */
  export function createEl(tag, attrs = {}, children = []) { ... }
  ```
- File-level headers document purpose and dependencies:
  ```javascript
  /**
   * calculator-engine.js
   * Бизнес-логика: сбор данных, расчёты, коэффициенты
   * Зависит от: calculator-data.js
   */
  ```
- Inline comments use Cyrillic where applicable (Russian project)
- Section dividers use ASCII art: `// ── Раздел ────────────────────`
- TODO comments used sparingly: `// TODO: заменить на кастомный диалог на следующем этапе` (in `ui.js`)

## Import Organization

**Order:**
1. Core utilities and DOM helpers (if ES6 modules): `import { qs, qsa } from './core/dom.js'`
2. API/Database: `import { sb } from './api.js'`
3. Auth: `import { getCurrentSession } from './auth.js'`
4. Context/State: `import { getStudioContext } from './studio-context.js'`
5. Local helpers: `import { normalizeError } from './errors.js'`

**Path Aliases:**
- No path aliases configured; relative imports used throughout
- Modules assume HTML script tags load dependencies in order or use `<script type="module">`

**Module Patterns:**
- Mix of ES6 modules and IIFE patterns
- Files with `export` keyword are ES6 modules: `dom.js`, `formatters.js`, `errors.js`, `auth.js`, `api.js`
- Legacy files without exports work globally: `calculator-ui.js`, `booking-popup.js` (IIFE-wrapped)
- Global variable registration for interop: `window._crmApi = sb`, `window._crmSb = sb`

## Error Handling

**Patterns:**
- **Centralized error normalization**: Use `normalizeError()` from `errors.js` to convert any error to standard format
  ```javascript
  export function normalizeError(err, context = '') {
    // Returns { type, message, technical, original }
  }
  ```
- **Typed errors**: Use `ERR` constants for categorization
  ```javascript
  export const ERR = {
    AUTH: 'auth',
    ACCESS: 'access',
    NOT_FOUND: 'not_found',
    VALIDATION: 'validation',
    NETWORK: 'network',
    DATABASE: 'database',
    RENDER: 'render',
    UNKNOWN: 'unknown',
  };
  ```
- **Try-catch with fallback returns**: Common pattern in API functions
  ```javascript
  try {
    res = await fetch(...);
    data = await res.json();
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
  ```
- **Conditional error checks**: Validate before using
  ```javascript
  if (error || !profile) {
    console.error('Profile not found:', error);
    return false;
  }
  ```

## Logging

**Framework:** `console.*` (native browser APIs)

**Patterns:**
- `console.error()` for errors with context: `console.error('Auth check error:', e)`
- `console.log()` for debug/progress: `console.log('No user - skip save')`
- Structured logging with prefixes for context: `console.error('[context] message', error)`
- Avoid console output in production-critical paths (not enforced, but observed practice)

## Function Design

**Size:** Functions range from 5 lines (getters) to 100+ lines (collectors like `collectAll()`)
- Small, focused functions preferred for utilities (`setText()`, `hide()`, `show()` are 1-3 lines)
- Larger functions accept when grouping related logic: `collectAll()` handles all calculator sections (220 lines)

**Parameters:**
- Prefer positional parameters for required values: `apiFetch(method, path, body = null)`
- Use optional parameter objects for configuration: `fmtDate(d, opts)` with `opts = { day, month, year }`
- Destructuring used in async functions: `const { data, error } = await sb.from(...)`
- Default parameters for fallbacks: `getCurrentUser() → session?.user ?? null`

**Return Values:**
- Tuple-like returns for API calls: `{ data, error }` pattern (Supabase-style)
  ```javascript
  async function apiFetch(method, path, body = null) {
    // ... returns { data: parseNumbers(data), error: null }
  }
  ```
- Single values for utilities: `fmtMoney()` returns formatted string
- null for "not found": `getStoredUser()` returns `null` if parse fails
- Promise-based for async: all async functions return Promises

## Module Design

**Exports:**
- Named exports for utilities: `export function formatMoney(n) { ... }`
- Mixed named/default: `export { sb }; export const SUPABASE_URL = null;`
- Barrel files not used; each module exports its own symbols
- One-off exports for singletons: `export { sb, SUPABASE_URL }` from api.js

**File-Level Scope:**
- Module-level variables hold state: `let _cache = null` (cleared by `clearContextCache()`)
- Private helpers marked with underscore: `_emitAuth()` private to api.js
- Initialization on import: Supabase client created once, cached globally
  ```javascript
  const sb = window._crmSb ?? window.supabase.createClient(...)
  window._crmSb = sb; // Cache globally
  ```

## Validation Patterns

**Type Coercion:**
- Parse numbers explicitly: `parseFloat(input.value) || 0`
- Nullish coalescing for optional fields: `profile?.trial_ends_at ?? null`
- Safe property access: `res.data?.field` or check existence first

**Input Sanitation:**
- XSS protection via `escapeHtml()` function — **must use for all user-generated content**:
  ```javascript
  export function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => _escMap[c]);
  }
  ```
- Number validation: `!isNaN(val) && val < 0` patterns in DOM helpers
- Array coercion: `Array.from(ctx.querySelectorAll(sel))` safe conversion

## Comments Standards

**When to Comment:**
- Document non-obvious business logic (e.g., tax coefficient rules in `taxCoef()`)
- Explain algorithm or calculation: series comments in `collectAll()` for different service types
- Mark sections with decorative headers for readability:
  ```javascript
  // ── Дата / Время ──────────────────────────────────────────────────
  ```
- Skip obvious code: no comments on simple getters/setters

**JSDoc/TSDoc:**
- Used for all exported functions
- Include `@param` with types: `@param {string} tag`
- Include `@returns` with type: `@returns {HTMLElement}`
- Use `@typedef` for complex return objects:
  ```javascript
  /**
   * @typedef {object} NormalizedError
   * @property {string}  type       — ERR.*
   * @property {string}  message    — сообщение для пользователя
   */
  ```
- Parameter names match function signature exactly

---

*Convention analysis: 2026-03-25*

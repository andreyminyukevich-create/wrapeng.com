<!-- GSD:project-start source:PROJECT.md -->
## Project

**Keep1R CRM — Workshop Pipeline**

Доработка CRM-системы для детейлинг-студий: полноценная воронка цеха (workshop pipeline) в board.html с формами переходов между статусами, новым статусом "Аутсорсинг", и реализацией страниц acceptance-act.html (акт приёмки) и work-order.html (заказ-наряд). Целевые пользователи — администраторы и мастера детейлинг-студий.

**Core Value:** Каждый переход автомобиля между статусами в цехе сопровождается заполнением формы — данные не теряются, ответственность фиксируется, документы генерируются автоматически.

### Constraints

- **Tech stack**: Ванильный HTML/JS, без фреймворков — весь проект так написан
- **API**: Серверный код не в этом репо — только SQL-миграции и фронтенд
- **Совместимость**: Новые формы должны вписываться в существующий дизайн board.html (модалки, стили карточек)
- **Мобильная верстка**: Все формы должны работать на мобильных (студии часто работают с планшетов)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (vanilla, no transpilation) - Frontend application and client-side logic
- Russian language locale used throughout codebase comments and UI
## Runtime
- Browser (modern standards: ES6+, async/await, Fetch API, localStorage)
- No Node.js/build tools detected
- No package manager (npm/yarn) in use
- All dependencies loaded via CDN scripts in HTML files
## Frameworks
- Vanilla JavaScript (no framework) - HTML pages with embedded script modules
- Browser Fetch API - HTTP client for API communication
- Custom CSS (`nav.css` for navigation component)
- No CSS framework detected (pure CSS with CSS custom properties)
- Custom DOM utilities in `dom.js` for element manipulation
- Custom PDF library - `calculator-pdf.js` generates PDF documents (appears to be pdfkit or similar)
## Key Dependencies
- Supabase JS SDK (v2) - Authentication and database via CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`
- Custom API client abstraction - `api.js` provides a Supabase-like query interface
- `dom.js` - DOM manipulation helpers (createElement, querySelector, event delegation)
- `errors.js` - Error normalization and classification system
- `formatters.js` - Russian locale formatting (money, dates, phones)
- `auth.js` - Authentication state management
- `studio-context.js` - User context (studio, role, subscription)
## Configuration
- Supabase URL: `https://hdghijgrrnzmntistdvw.supabase.co`
- Supabase Anon Key embedded in `supabase.js`
- API Base URL: `/api` (relative path, backend-dependent)
- No `.env` file detected (secrets hardcoded in `supabase.js`)
- No build step detected
- Single-file HTML pages with inline modules
- CSS inlined in `<style>` tags within HTML
## Platform Requirements
- Text editor (any)
- Modern browser (ES6+ support)
- Git for version control
- Static file server (serves HTML + JS + CSS)
- Backend API at `/api` endpoint (separate service)
- Supabase instance at `https://hdghijgrrnzmntistdvw.supabase.co`
- Deployment via rsync script: `deploy.sh`
## Frontend Architecture
- ES6 modules with `export`/`import` statements
- Global namespacing for Supabase client: `window._crmSb`, `window._crmApi`
- Each HTML page loads multiple `<script type="module">` blocks
- `calculator-render.js` (677 lines) - Renders calculation form UI
- `calculator-persistence.js` (583 lines) - Autosave and form persistence
- `booking-popup.js` (571 lines) - Calendar/booking widget
- `calculator-ui.js` (283 lines) - Calculator form setup
- `ui.js` (271 lines) - Generic UI components
- `calculator-engine.js` (221 lines) - Calculation business logic
- `nav.js` (204 lines) - Navigation sidebar
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- kebab-case for filenames: `calculator-engine.js`, `calculator-persistence.js`, `dom.js`
- Core/utility modules prefixed with scope: `calculator-*`, `core/*`
- Feature-specific files grouped by prefix: all calculator-related files share `calculator-` prefix
- camelCase for function names: `collectAll()`, `markups()`, `taxCoef()`, `normalizeError()`
- Verb-first for action functions: `parseNumbers()`, `clearToken()`, `preventNegative()`
- `get*` prefix for accessors: `getToken()`, `getServiceDescription()`, `getStudioContext()`
- `set*` prefix for setters: `setToken()`, `setStoredUser()`, `setText()`
- Initialization functions use `init` prefix: `initTheme()`, `initDiscounts()`, `initChart()`
- `_private` convention for truly private helpers (underscore prefix): `_emitAuth()`, `_escMap`
- camelCase for all variables: `currentProfile`, `currentCalculationId`, `apiBase`
- Short abbreviations acceptable in calculator context: `mat` (materials), `mot` (motivation/labor), `det` (detailing), `pkg` (package)
- Prefix private module-level variables with underscore: `_cache`, `_authListeners`, `_auth`
- Constants in UPPERCASE_SNAKE_CASE: `NUMERIC_FIELDS`, `ADMIN_ID`, `API_BASE`, `TOKEN_KEY`
- Prefer full words in exported APIs: use `formatMoney()` not `fmtMny()`; abbreviations acceptable only in well-known patterns like `qs`/`qsa` for querySelector
- Class names in PascalCase: `QueryBuilder`, `NormalizedError` (in JSDoc)
- Error type constants in UPPER_CASE: `ERR.AUTH`, `ERR.VALIDATION`, `ERR.NOT_FOUND`
- Enums/constants as uppercase object keys: `SUBSCRIPTION.ACTIVE`, `SUBSCRIPTION.TRIAL`
- JSDoc typedef names in PascalCase: `StudioContext`, `NormalizedError`
## Code Style
- No dedicated formatter config detected (no .prettierrc or ESLint config files)
- Observed style: 2-space indentation (not enforced)
- Line length varies; files contain lines up to 150+ characters
- Semicolons used consistently
- Prefer `const` over `let` (observed pattern)
- No ESLint config detected
- No automated linting observed
- Manual code review conventions:
- JSDoc-style for exported functions with param and return types
- Example from `dom.js`:
- File-level headers document purpose and dependencies:
- Inline comments use Cyrillic where applicable (Russian project)
- Section dividers use ASCII art: `// ── Раздел ────────────────────`
- TODO comments used sparingly: `// TODO: заменить на кастомный диалог на следующем этапе` (in `ui.js`)
## Import Organization
- No path aliases configured; relative imports used throughout
- Modules assume HTML script tags load dependencies in order or use `<script type="module">`
- Mix of ES6 modules and IIFE patterns
- Files with `export` keyword are ES6 modules: `dom.js`, `formatters.js`, `errors.js`, `auth.js`, `api.js`
- Legacy files without exports work globally: `calculator-ui.js`, `booking-popup.js` (IIFE-wrapped)
- Global variable registration for interop: `window._crmApi = sb`, `window._crmSb = sb`
## Error Handling
- **Centralized error normalization**: Use `normalizeError()` from `errors.js` to convert any error to standard format
- **Typed errors**: Use `ERR` constants for categorization
- **Try-catch with fallback returns**: Common pattern in API functions
- **Conditional error checks**: Validate before using
## Logging
- `console.error()` for errors with context: `console.error('Auth check error:', e)`
- `console.log()` for debug/progress: `console.log('No user - skip save')`
- Structured logging with prefixes for context: `console.error('[context] message', error)`
- Avoid console output in production-critical paths (not enforced, but observed practice)
## Function Design
- Small, focused functions preferred for utilities (`setText()`, `hide()`, `show()` are 1-3 lines)
- Larger functions accept when grouping related logic: `collectAll()` handles all calculator sections (220 lines)
- Prefer positional parameters for required values: `apiFetch(method, path, body = null)`
- Use optional parameter objects for configuration: `fmtDate(d, opts)` with `opts = { day, month, year }`
- Destructuring used in async functions: `const { data, error } = await sb.from(...)`
- Default parameters for fallbacks: `getCurrentUser() → session?.user ?? null`
- Tuple-like returns for API calls: `{ data, error }` pattern (Supabase-style)
- Single values for utilities: `fmtMoney()` returns formatted string
- null for "not found": `getStoredUser()` returns `null` if parse fails
- Promise-based for async: all async functions return Promises
## Module Design
- Named exports for utilities: `export function formatMoney(n) { ... }`
- Mixed named/default: `export { sb }; export const SUPABASE_URL = null;`
- Barrel files not used; each module exports its own symbols
- One-off exports for singletons: `export { sb, SUPABASE_URL }` from api.js
- Module-level variables hold state: `let _cache = null` (cleared by `clearContextCache()`)
- Private helpers marked with underscore: `_emitAuth()` private to api.js
- Initialization on import: Supabase client created once, cached globally
## Validation Patterns
- Parse numbers explicitly: `parseFloat(input.value) || 0`
- Nullish coalescing for optional fields: `profile?.trial_ends_at ?? null`
- Safe property access: `res.data?.field` or check existence first
- XSS protection via `escapeHtml()` function — **must use for all user-generated content**:
- Number validation: `!isNaN(val) && val < 0` patterns in DOM helpers
- Array coercion: `Array.from(ctx.querySelectorAll(sel))` safe conversion
## Comments Standards
- Document non-obvious business logic (e.g., tax coefficient rules in `taxCoef()`)
- Explain algorithm or calculation: series comments in `collectAll()` for different service types
- Mark sections with decorative headers for readability:
- Skip obvious code: no comments on simple getters/setters
- Used for all exported functions
- Include `@param` with types: `@param {string} tag`
- Include `@returns` with type: `@returns {HTMLElement}`
- Use `@typedef` for complex return objects:
- Parameter names match function signature exactly
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Pure JavaScript (no frameworks like React/Vue)
- Server-side authentication with JWT tokens
- Query builder abstraction for API calls (Supabase-like)
- Page-based routing (HTML pages as entry points)
- Global state management via localStorage + window objects
- Module interdependencies managed through explicit imports
## Layers
- Purpose: All backend communication and data access
- Location: `api.js`, `studio-context.js`
- Contains: QueryBuilder class, auth methods, HTTP fetch wrappers, token management
- Depends on: None (lowest layer)
- Used by: All other layers
- Purpose: User session, permissions, access control
- Location: `auth.js`, `studio-context.js`
- Contains: Login/logout, session retrieval, user verification, subscription status
- Depends on: `api.js`
- Used by: Business logic modules, page entry points
- Purpose: Reusable helpers with no dependencies
- Location: `dom.js`, `formatters.js`, `errors.js`, `ui.js`, `footer.js`
- Contains: DOM manipulation, formatting (money, dates, phone), error normalization, toast/modal UI
- Depends on: None
- Used by: All business logic and feature modules
- Purpose: Domain-specific calculations and data collection
- Location: `calculator-engine.js`, `calculator-data.js`, `booking-popup.js`
- Contains: Cost calculations, markup logic, service descriptions, form data collection
- Depends on: Core utilities + DOM helpers
- Used by: Feature-specific modules, rendering layer
- Purpose: Presenting data and building dynamic UI
- Location: `calculator-render.js`, `calculator-ui.js`, `calculator-pdf.js`
- Contains: HTML generation, list rendering, chart initialization, form population
- Depends on: Business logic layer + Core utilities
- Used by: Page modules
- Purpose: State saving and restoration across sessions
- Location: `calculator-persistence.js`
- Contains: Auto-save logic, form state serialization, localStorage read/write
- Depends on: API layer + Business logic
- Used by: Feature pages
- Purpose: App structure, sidebar, navigation state
- Location: `nav.js`, `nav.css`
- Contains: Navigation menu structure, role-based visibility, active state tracking
- Depends on: Authentication layer
- Used by: All pages (injected globally)
## Data Flow
- **Session State:** `localStorage` (token, user) + window globals (`_studioId`, `_boardStudioId`)
- **Form State:** DOM element values (inputs, checkboxes, selects)
- **Page State:** Global variables in calculator modules (e.g., `disc`, `costCounter`, `dynCounter`)
- **Cache:** Supabase-like API responses cached during page lifetime
## Key Abstractions
- Purpose: Unified data access with filtering, ordering, pagination
- Location: `api.js` lines 52-90
- Pattern: Fluent interface returning promise
- Example:
- Purpose: Resolve user permissions and studio membership
- Location: `studio-context.js`
- Pattern: Lazy-loaded and cached for page lifetime
- Returns: `{ user, studioId, role, studio, subscriptionStatus, hasAccess }`
- Purpose: Convert any error into structured format
- Location: `errors.js:normalizeError()`
- Pattern: Returns `{ type, message, technical, original }`
- Types: `ERR.AUTH`, `ERR.ACCESS`, `ERR.VALIDATION`, `ERR.NETWORK`, `ERR.DATABASE`
- Purpose: Non-blocking user feedback
- Location: `ui.js:showToast(type, text, duration)`
- Types: 'success', 'error', 'warning', 'info'
## Entry Points
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/welcome.html`
- Triggers: Direct visit to `/welcome.html` or redirect from protected pages
- Responsibilities: Auth UI, login form, registration flow, redirect to dashboard on success
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/dashboard.html`
- Triggers: Successful login or direct visit
- Responsibilities: Load studio context, display KPIs, navigate to features
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/board.html`
- Triggers: User clicks "Доска" in nav or direct visit
- Responsibilities: Kanban-style task board, drag-drop, status filtering
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/calculator.html`
- Triggers: User clicks "Расчёты" in nav
- Responsibilities: Service selection, cost calculation, quote generation, PDF export
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/settings.html`
- Triggers: User clicks "Настройки" in nav
- Responsibilities: Studio settings, team management, billing
## Error Handling
## Cross-Cutting Concerns
- Uses `console.error()` and `console.log()` with context prefixes `[context_name]`
- Error module logs all errors via `normalizeError()` with technical details
- DOM-level validation (HTML5 `required`, `min`, `max`)
- No centralized validation layer; inline per-form
- Example: `calculator-data.js` provides field names list
- JWT token in Authorization header: `Authorization: Bearer <token>`
- Token expiry checked via `jwtExpired()` function
- Auto-logout on 401 response via `k1r:unauthorized` event
- Role stored in studio context: `'owner' | 'manager' | 'staff' | 'none'`
- Global admin check via `isGlobalAdmin(user)` from `auth.js`
- Subscription status checked via `studio.subscriptionStatus` constants
- All text hardcoded in Russian
- Date/number formatting uses `'ru-RU'` locale
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

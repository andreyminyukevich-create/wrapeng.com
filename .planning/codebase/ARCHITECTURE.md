# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Layered Client-Side MVC with Module Dependencies

This is a browser-based CRM application using vanilla JavaScript organized into discrete modules with clear separation of concerns. The architecture combines server-side API interactions with client-side state management and rendering, using localStorage for persistence.

**Key Characteristics:**
- Pure JavaScript (no frameworks like React/Vue)
- Server-side authentication with JWT tokens
- Query builder abstraction for API calls (Supabase-like)
- Page-based routing (HTML pages as entry points)
- Global state management via localStorage + window objects
- Module interdependencies managed through explicit imports

## Layers

**API Layer:**
- Purpose: All backend communication and data access
- Location: `api.js`, `studio-context.js`
- Contains: QueryBuilder class, auth methods, HTTP fetch wrappers, token management
- Depends on: None (lowest layer)
- Used by: All other layers

**Authentication & Session Layer:**
- Purpose: User session, permissions, access control
- Location: `auth.js`, `studio-context.js`
- Contains: Login/logout, session retrieval, user verification, subscription status
- Depends on: `api.js`
- Used by: Business logic modules, page entry points

**Core Utilities Layer:**
- Purpose: Reusable helpers with no dependencies
- Location: `dom.js`, `formatters.js`, `errors.js`, `ui.js`, `footer.js`
- Contains: DOM manipulation, formatting (money, dates, phone), error normalization, toast/modal UI
- Depends on: None
- Used by: All business logic and feature modules

**Business Logic Layer:**
- Purpose: Domain-specific calculations and data collection
- Location: `calculator-engine.js`, `calculator-data.js`, `booking-popup.js`
- Contains: Cost calculations, markup logic, service descriptions, form data collection
- Depends on: Core utilities + DOM helpers
- Used by: Feature-specific modules, rendering layer

**Rendering Layer:**
- Purpose: Presenting data and building dynamic UI
- Location: `calculator-render.js`, `calculator-ui.js`, `calculator-pdf.js`
- Contains: HTML generation, list rendering, chart initialization, form population
- Depends on: Business logic layer + Core utilities
- Used by: Page modules

**Persistence Layer:**
- Purpose: State saving and restoration across sessions
- Location: `calculator-persistence.js`
- Contains: Auto-save logic, form state serialization, localStorage read/write
- Depends on: API layer + Business logic
- Used by: Feature pages

**Navigation & Layout Layer:**
- Purpose: App structure, sidebar, navigation state
- Location: `nav.js`, `nav.css`
- Contains: Navigation menu structure, role-based visibility, active state tracking
- Depends on: Authentication layer
- Used by: All pages (injected globally)

## Data Flow

**User Login Flow:**

1. User submits credentials on `welcome.html`
2. `api.js:_auth.signInWithPassword()` → POST `/api/auth/login`
3. Server returns `{ token, user }`
4. `api.js` stores token in localStorage (`k1r_token`), user in `k1r_user`
5. Session event emitted via `_emitAuth('SIGNED_IN', session)`
6. Pages can call `getCurrentUser()` to retrieve cached user

**Page Load Flow:**

1. Page HTML loads (e.g., `calculator.html`)
2. `nav.js` injects sidebar, calls `getStoredUser()` from localStorage
3. Page checks auth via `requireAuth()` from `auth.js`
4. If unauthenticated, redirect to `welcome.html?returnUrl=...`
5. If authenticated, fetch studio context via `getStudioContext()` (calls `/api/studio-members/me`)
6. Load page data, initialize UI, set up event listeners

**Calculator Workflow:**

1. User selects services on calculator form
2. `calculator-engine.js:collectAll()` reads form values using DOM queries (`q()`, `qa()`)
3. Calculates material + labor costs, applies markups, taxes
4. `calculator-render.js` updates charts and summary displays
5. `calculator-persistence.js` auto-saves to localStorage every interval
6. User can export as PDF via `calculator-pdf.js`

**State Management:**

- **Session State:** `localStorage` (token, user) + window globals (`_studioId`, `_boardStudioId`)
- **Form State:** DOM element values (inputs, checkboxes, selects)
- **Page State:** Global variables in calculator modules (e.g., `disc`, `costCounter`, `dynCounter`)
- **Cache:** Supabase-like API responses cached during page lifetime

## Key Abstractions

**QueryBuilder (Supabase-like):**
- Purpose: Unified data access with filtering, ordering, pagination
- Location: `api.js` lines 52-90
- Pattern: Fluent interface returning promise
- Example:
  ```javascript
  const { data, error } = await sb
    .from('table')
    .select('*')
    .eq('id', 123)
    .single();
  ```

**Authentication Context:**
- Purpose: Resolve user permissions and studio membership
- Location: `studio-context.js`
- Pattern: Lazy-loaded and cached for page lifetime
- Returns: `{ user, studioId, role, studio, subscriptionStatus, hasAccess }`

**Error Normalization:**
- Purpose: Convert any error into structured format
- Location: `errors.js:normalizeError()`
- Pattern: Returns `{ type, message, technical, original }`
- Types: `ERR.AUTH`, `ERR.ACCESS`, `ERR.VALIDATION`, `ERR.NETWORK`, `ERR.DATABASE`

**Toast Notifications:**
- Purpose: Non-blocking user feedback
- Location: `ui.js:showToast(type, text, duration)`
- Types: 'success', 'error', 'warning', 'info'

## Entry Points

**`welcome.html`:**
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/welcome.html`
- Triggers: Direct visit to `/welcome.html` or redirect from protected pages
- Responsibilities: Auth UI, login form, registration flow, redirect to dashboard on success

**`dashboard.html`:**
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/dashboard.html`
- Triggers: Successful login or direct visit
- Responsibilities: Load studio context, display KPIs, navigate to features

**`board.html`:**
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/board.html`
- Triggers: User clicks "Доска" in nav or direct visit
- Responsibilities: Kanban-style task board, drag-drop, status filtering

**`calculator.html`:**
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/calculator.html`
- Triggers: User clicks "Расчёты" in nav
- Responsibilities: Service selection, cost calculation, quote generation, PDF export

**`settings.html`:**
- Location: `/Users/and20mnk/Downloads/wrapeng-17.com-main/settings.html`
- Triggers: User clicks "Настройки" in nav
- Responsibilities: Studio settings, team management, billing

## Error Handling

**Strategy:** Normalize all errors to structured type, show user-friendly message, log technical details

**Patterns:**

1. **API Errors:**
   ```javascript
   const { data, error } = await apiFetch('GET', '/table/users');
   if (error) {
     const normalized = normalizeError(error, 'loadUsers');
     showToast('error', normalized.message);
   }
   ```

2. **Authentication Errors:**
   ```javascript
   // 401 response → clearToken() + dispatch 'k1r:unauthorized' event
   // Listeners call _emitAuth('SIGNED_OUT', null)
   ```

3. **Form Validation:**
   - No centralized validation layer; validations live in form handlers
   - Invalid inputs trigger toast or inline error messages

4. **Network Errors:**
   - apiFetch catches `fetch()` exceptions and returns `{ data: null, error }`
   - No automatic retry; caller decides whether to retry

## Cross-Cutting Concerns

**Logging:**
- Uses `console.error()` and `console.log()` with context prefixes `[context_name]`
- Error module logs all errors via `normalizeError()` with technical details

**Validation:**
- DOM-level validation (HTML5 `required`, `min`, `max`)
- No centralized validation layer; inline per-form
- Example: `calculator-data.js` provides field names list

**Authentication:**
- JWT token in Authorization header: `Authorization: Bearer <token>`
- Token expiry checked via `jwtExpired()` function
- Auto-logout on 401 response via `k1r:unauthorized` event

**Permissions:**
- Role stored in studio context: `'owner' | 'manager' | 'staff' | 'none'`
- Global admin check via `isGlobalAdmin(user)` from `auth.js`
- Subscription status checked via `studio.subscriptionStatus` constants

**Localization:**
- All text hardcoded in Russian
- Date/number formatting uses `'ru-RU'` locale

---

*Architecture analysis: 2026-03-25*

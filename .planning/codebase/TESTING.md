# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework

**Status:** No testing framework detected

**What's Missing:**
- No `.test.js`, `.spec.js`, or `*.test.ts` files found in the codebase
- No Jest, Vitest, Mocha, or other test runner config detected
- No test configuration files: `jest.config.js`, `vitest.config.ts`, `karma.conf.js`, etc.
- No test dependencies in `package.json` (file not accessible, but no evidence of testing setup)

**Type of Project:** Browser-based frontend application without automated test infrastructure
- Single-page application with calculator, booking, and admin features
- Heavy browser/DOM interaction
- No testing framework in use

## Manual Testing Patterns

**Console Logging for Debugging:**
- `console.error()` used throughout for error tracking
  - Examples: `console.error('Auth check error:', e)`, `console.error('Profile not found:', error)`
  - Location: `calculator-persistence.js`, `booking-popup.js`, `errors.js`
- `console.log()` used for progress/state tracking
  - Examples: `console.log('No user - skip save')`, `console.log('Updated existing calculation:', currentCalculationId)`
  - Location: `calculator-persistence.js`

**Error Observation Points:**
- `errors.js` (`normalizeError()`) logs structured errors with context:
  ```javascript
  const prefix = context ? `[${context}]` : '[error]';
  console.error(`${prefix} type=${type} ${technical}`, err);
  ```
- Errors passed through standardized `ERR` type constants for categorization

## Code Organization for Testing

**Testable Units (if tests were added):**

**`api.js` (140 lines):**
- `apiFetch()` — HTTP wrapper with error handling, could be unit tested
- `QueryBuilder` class — chainable query builder, test-friendly interface
- `parseNumbers()` — pure function converting specific fields, testable
- Global functions: `getToken()`, `setToken()`, `clearToken()` — mockable localStorage

**`formatters.js` (117 lines):**
- **Most testable module** — all pure functions with no side effects
- `fmtMoney(n)` → formatted currency string
- `fmtDate(d, opts)` → localized date
- `fmtPhone(raw)` → phone formatting
- `escapeHtml(str)` → XSS prevention (security critical)
- `pluralize(n, one, few, many)` → Russian plural rules
- Example test structure:
  ```javascript
  describe('formatters', () => {
    describe('fmtMoney', () => {
      it('formats positive numbers as rubles', () => {
        expect(fmtMoney(12345.6)).toBe('12 345,60');
      });
      it('handles null/undefined', () => {
        expect(fmtMoney(null)).toBe('0,00');
      });
    });
  });
  ```

**`dom.js` (127 lines):**
- Pure utility functions for DOM manipulation, test-compatible
- `qs()`, `qsa()` — selector wrappers
- `createEl()` — safe element factory
- `setText()`, `clearEl()` — DOM mutators
- `delegate()` — event delegation
- Would need JSDOM or similar to test DOM interactions

**`errors.js` (105 lines):**
- `normalizeError()` — pure function (given error, returns normalized object)
- `typedError()` — error factory
- Testable for various error types (Supabase errors, network errors, JS errors, strings)
- Example test:
  ```javascript
  it('normalizes PostgreSQL errors', () => {
    const pgErr = { code: '23505', message: 'duplicate key' };
    const result = normalizeError(pgErr);
    expect(result.type).toBe(ERR.VALIDATION);
  });
  ```

**`auth.js` (55 lines):**
- `getCurrentSession()` — async, requires mocked `sb.auth`
- `getCurrentUser()` — derived from session
- `requireAuth()` — guards route, triggers redirect
- `isGlobalAdmin()` — pure function (testable)
- Would require mocking Supabase client

**`studio-context.js` (131 lines):**
- `getStudioContext()` — async, caches result
- `clearContextCache()` — cache management (testable)
- `resolveSubscriptionStatus()` — pure function (date comparisons, very testable)
- Example test:
  ```javascript
  it('resolves active subscription', () => {
    const future = new Date(Date.now() + 1000000);
    expect(resolveSubscriptionStatus('active', future.toISOString()))
      .toBe(SUBSCRIPTION.ACTIVE);
  });
  ```

**`calculator-engine.js` (221 lines):**
- `collectAll()` — main business logic aggregator (200+ lines)
- Heavy DOM querying (`q()`, `qa()` selectors), not unit-testable without extraction
- `markups()`, `taxCoef()`, `collectAdditionalCosts()` — depend on DOM state
- **Would require:** refactoring to separate data collection from DOM queries
- Could test calculations in isolation if data passed as parameters instead of queried

**`calculator-persistence.js` (583 lines):**
- `checkAuth()` — async, depends on Supabase
- `checkAccess()` — async, depends on database
- `saveCalculation()` — main save logic, requires mocked `sb`
- `loadCalculation()` — async load, requires mocked `sb`
- All require either Supabase mocking or integration testing

## Mocking Strategy (If Tests Were Added)

**What Would Need Mocking:**
- **Supabase client (`sb`):** Mock `sb.from().select().eq().single()` chains
  ```javascript
  // Mock example (pseudo-code for Vitest/Jest)
  vi.mock('./api.js', () => ({
    sb: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: '123' },
              error: null
            })
          }))
        }))
      }))
    }
  }));
  ```
- **localStorage:** For token/user persistence tests
  ```javascript
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  ```
- **fetch API:** For API calls in `apiFetch()`
  ```javascript
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: {...} })
  }));
  ```
- **DOM Elements:** For calculator functions requiring `querySelector`
  ```javascript
  // Create fixture HTML or mock document API
  document.body.innerHTML = `
    <input id="pkgWrapMat" value="100" />
    <input id="pkgWrapMot" value="50" />
  `;
  ```
- **window.Chart:** For Chart.js initialization in `calculator-render.js`
  ```javascript
  window.Chart = vi.fn();
  ```

## Integration Testing Opportunities

**What Could Be Integration Tested (Without Unit Tests):**
1. **Calculator Flow:** User input → calculation → render → save → load
   - Manual: Open calculator.html, fill form, save, reload, verify data persists
   - Could automate with Playwright/Cypress

2. **Auth Flow:** Login → profile check → feature unlock
   - Requires real/mocked Supabase instance
   - End-to-end via browser

3. **Booking Workflow:** Select car → choose services → assign staff → submit
   - Requires real DOM and mocked Supabase
   - Manual or E2E framework

## Test Coverage Gaps

**Uncovered Areas:**
- **Business logic:** `collectAll()` calculator logic (221 lines) — accumulates prices, no tests
- **API integration:** `apiFetch()`, `QueryBuilder` — actual network calls tested only manually
- **Auth state management:** Token refresh, expiration, logout flows — untested
- **Persistence:** Auto-save, load-from-URL, cache invalidation — manual testing only
- **Error scenarios:** Network failures, validation errors, 401 responses — assumed handled
- **PDF generation:** `calculator-pdf.js` (187 lines) — no test coverage
- **Booking popup:** Complex multi-step form in IIFE — no automated tests
- **Security:** XSS via `escapeHtml()` not verified by tests
- **Localization:** Date/phone/plural formatting for Russian locale — manual testing

## Recommended Testing Approach

**If Testing Were to Be Implemented:**

1. **Unit Tests (Vitest):**
   - Test pure functions: `formatters.js`, `errors.js`, utilities in `dom.js`
   - Mock external deps: Supabase, localStorage, fetch
   - Target: 70%+ coverage for pure functions

2. **Integration Tests:**
   - Test API layer (`api.js` QueryBuilder) with mocked fetch
   - Test auth flows with mocked Supabase
   - Test persistence with mocked database

3. **E2E Tests (Playwright/Cypress):**
   - Test full user workflows: calculator flow, booking, auth
   - Run against real/staging backend
   - Critical paths only

4. **File Organization (Proposed):**
   ```
   src/
   ├── __tests__/
   │   ├── formatters.test.js
   │   ├── dom.test.js
   │   ├── errors.test.js
   │   ├── api.test.js
   │   └── integration/
   │       ├── auth.test.js
   │       └── calculator.test.js
   ├── formatters.js
   ├── dom.js
   └── ...
   ```

## Current Testing Reality

**Testing is entirely manual:**
- Developers open HTML pages in browser
- Manual form input and observation
- Console.log() inspection for debugging
- No automated verification
- No regression detection

**To Add Tests:**
1. Choose framework: Vitest (modern, fast) or Jest (industry standard)
2. Add dev dependencies: `npm install -D vitest jsdom` (or jest)
3. Create `vitest.config.js` or `jest.config.js`
4. Move pure functions to testable locations (already mostly isolated)
5. Add test files alongside or in `__tests__` directory
6. Focus on high-risk areas: auth, calculations, persistence, security

---

*Testing analysis: 2026-03-25*

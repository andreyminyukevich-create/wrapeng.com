# Codebase Concerns

**Analysis Date:** 2026-03-25

## Tech Debt

**Hardcoded Credentials in Source Code:**
- Issue: Supabase API keys and anonymous key exposed in client-side code
- Files: `supabase.js`, `api.js`
- Impact: Keys are visible to anyone inspecting network traffic or source code. If compromised, attacker has direct access to Supabase database. Rotations require code redeploys.
- Fix approach: Move SUPABASE_URL and SUPABASE_ANON_KEY to environment variables or secure configuration endpoint. Create backend API proxy for sensitive operations. Implement proper RLS (Row Level Security) policies in Supabase.

**Hardcoded Admin ID:**
- Issue: Single admin account ID hardcoded in multiple files as string literal
- Files: `nav.js` (line 8), `auth.js` (line 48)
- Impact: Admin identification fragile; changing admin requires code changes and redeploy. Role-based access control (RBAC) is absent.
- Fix approach: Move admin ID to secure configuration or database. Implement proper role-based access control with roles table. Use studio membership with role field instead of ID comparison.

**Dual API Pattern (Supabase vs Custom API):**
- Issue: Code uses both direct Supabase client AND custom API wrapper interchangeably
- Files: `supabase.js` (original), `api.js` (replacement), `calculator-persistence.js`, `studio-context.js`
- Impact: Confusing dual implementations; `window.sb` is alias for either `window._crmApi` or `window._crmSb`. Two different error handling paths. Inconsistent patterns across files.
- Fix approach: Complete migration to single API layer. Remove all direct Supabase imports. Update all pages to use api.js only. Establish clear separation of concerns (backend API vs frontend client).

**Large Monolithic HTML Files:**
- Issue: Several HTML files exceed 2000+ lines (calculator.html: 2409 lines, inventory.html: 1562 lines, board.html: 1447 lines)
- Files: `calculator.html`, `inventory.html`, `board.html`, `assign-work.html`
- Impact: Difficult to maintain, test, or refactor. Hard to identify which styles/scripts are used. Mixed concerns (HTML, CSS, JS inline). Slower page load.
- Fix approach: Split into components with separate CSS and JS files. Extract inline styles to dedicated stylesheets. Extract inline scripts to modules. Consolidate duplicate code across pages.

**Global State Pollution:**
- Issue: Excessive use of `window.` for state management and configuration
- Files: Multiple (api.js, nav.js, calculator-persistence.js, booking-popup.js, studio-context.js)
- Impact: State can be modified anywhere; no encapsulation. Makes debugging hard. Race conditions possible on page navigation. Difficult to track where state is changed.
- Fix approach: Replace `window._crmApi`, `window._crmSb`, `window._studioId`, `window._boardStudioId`, `window._calcNewMode` with proper module-level state. Implement state management (simple object with getters/setters) or use browser storage with validation.

**Missing Error Handling in Multiple Locations:**
- Issue: Many async operations lack error handling or have swallowed errors with empty catch blocks
- Files: `api.js` (line 93: empty catch), `calculator-persistence.js`, `studio-context.js`
- Impact: Silent failures; users don't know operations failed. Bugs harder to diagnose. Users left in inconsistent state. No logging of critical errors.
- Fix approach: Implement consistent error handling. Use normalizeError() from `errors.js` across all files. Show user feedback on failures. Log errors to monitoring service.

**Unsafe innerHTML Usage:**
- Issue: Multiple uses of `innerHTML` with unsanitized content
- Files: `booking-popup.js` (lines where innerHTML is set with dynamic content), `calculator-ui.js`, multiple HTML files with inline scripts
- Impact: Potential XSS vulnerabilities if user input reaches these assignments. Current usage appears to use emojis and formatted strings, but pattern is fragile.
- Fix approach: Use `textContent` or `createTextNode()` for user-generated content. Reserve `innerHTML` for known-safe content only. Better: migrate to template literals with proper escaping or DOM API.

**Missing Request/Response Validation:**
- Issue: API responses parsed without schema validation; numeric fields converted via regex matching
- Files: `api.js` (lines 22-35: NUMERIC_FIELDS heuristic)
- Impact: Type mismatches not caught. If backend changes field format, frontend silently breaks. No validation of required fields.
- Fix approach: Define schemas (using Zod, Joi, or simple validation functions) for each API response type. Validate before using data. Fail fast with clear error messages.

**Custom Token-Based Authentication Without Standard Patterns:**
- Issue: Custom JWT parsing in localStorage; token expiration check in `api.js` (lines 15-20)
- Files: `api.js`, `nav.js`, `auth.js`
- Impact: Token refresh logic fragile. No standard OAuth/OIDC flow. Token revocation not implemented. Manual token management error-prone.
- Fix approach: Use Supabase auth with built-in token refresh. Or implement standard JWT with secure refresh token rotation. Consider using Auth0 or similar for production.

**Untyped JavaScript Codebase:**
- Issue: All code is plain JavaScript with no type checking; no JSDoc specifications on critical functions
- Files: All .js files
- Impact: Type errors only caught at runtime. Refactoring unsafe. IDE cannot provide accurate autocompletion. Documentation incomplete.
- Fix approach: Migrate to TypeScript incrementally, starting with critical modules (api.js, calculator-engine.js, studio-context.js). Or add comprehensive JSDoc comments with type annotations.

## Known Bugs

**Custom Dialog Implementation Incomplete:**
- Bug: TODO comment indicates custom dialog not yet implemented
- Files: `ui.js` (line 269)
- Symptoms: Booking popup and dialogs may fall back to browser defaults or not render correctly
- Workaround: Ensure fallback behavior handles missing dialog gracefully
- Fix approach: Complete the custom dialog implementation or remove TODO and use native HTML dialog element

**Russian UI with Potential Localization Issues:**
- Bug: All UI text hardcoded in Russian; no i18n framework
- Files: All HTML files, nav.js, errors.js
- Symptoms: Cannot support other languages without code changes. User error messages only in Russian.
- Trigger: Run application in non-Russian locale; messages still appear in Russian
- Workaround: None - application is Russian-only
- Fix approach: Implement i18n framework (use native Intl API or i18next library). Extract all strings to translation files.

**Potential Race Condition in API Token Refresh:**
- Bug: No mutex or synchronization on token refresh; multiple concurrent requests could trigger multiple refresh calls
- Files: `api.js` (lines 44-49)
- Symptoms: Multiple simultaneous API calls when token expires could cause race conditions; 401s might not be handled correctly
- Trigger: User performs multiple quick actions when session expires
- Workaround: Retry failed requests manually
- Fix approach: Implement request queue with single token refresh. Use Supabase built-in session management instead.

**PDF Export May Fail Silently:**
- Bug: PDF generation with jsPDF/html2canvas requires external libraries; no fallback
- Files: `calculator-pdf.js` (lines 2-5)
- Symptoms: Users click "Export PDF" and nothing happens if libraries fail to load or timeout
- Trigger: Poor internet connection, jsPDF library load fails, html2canvas times out
- Workaround: User manually saves HTML as PDF
- Fix approach: Add progress indicator. Implement timeout with user feedback. Provide alternative: server-side PDF generation. Pre-load libraries earlier.

## Security Considerations

**Supabase Anonymous Key Exposure:**
- Risk: SUPABASE_ANON_KEY in source allows anyone to query database directly via JavaScript
- Files: `supabase.js` (line 14)
- Current mitigation: Supabase RLS policies (not visible in codebase; assumed to exist)
- Recommendations:
  - Verify RLS policies are strict and tested
  - Move sensitive queries to backend API (use service role key server-side)
  - Document which operations are safe via anonymous client
  - Consider not using Supabase client directly; use backend API for all data access

**Admin ID Comparison Without RBAC:**
- Risk: Role-based access controlled by ID string comparison; no database verification of admin status
- Files: `nav.js` (line 62), `auth.js` (line 50)
- Current mitigation: localStorage user data (easily spoofed)
- Recommendations:
  - Verify admin status from backend/database with session
  - Do not trust client-side role claims
  - Implement proper RBAC with roles table
  - Audit admin actions server-side

**localStorage Contains Sensitive User Data:**
- Risk: k1r_user and k1r_token stored in localStorage; vulnerable to XSS attacks
- Files: `api.js` (lines 9-13), `nav.js` (line 58)
- Current mitigation: None obvious
- Recommendations:
  - Consider using httpOnly cookies for tokens (requires backend support)
  - For SPA token storage: use memory + sessionStorage (clears on tab close)
  - Implement CSP to prevent XSS
  - Add XSS detection and automatic logout
  - Sanitize all user input; avoid innerHTML with dynamic content

**No Input Validation on Calculations:**
- Risk: calculator-engine.js accepts parseFloat() values without bounds checking
- Files: `calculator-engine.js`, `calculator-ui.js`
- Current mitigation: None visible
- Recommendations:
  - Validate all numeric inputs: min/max ranges, decimals
  - Server-side validation of calculation results before storage
  - Prevent negative values in appropriate fields (enforced UI-side with preventNegative())
  - Audit calculations for accuracy; test with edge cases (0, very large numbers, negative)

**No CORS Headers or API Rate Limiting Visible:**
- Risk: API endpoints open to any origin; no rate limiting protection visible
- Files: All files making API calls
- Current mitigation: Unknown (backend implementation not in repo)
- Recommendations:
  - Implement proper CORS on backend (restrict origins)
  - Add rate limiting per IP/user
  - Monitor for abuse (unusual request patterns)
  - Log all API access

## Performance Bottlenecks

**Inefficient DOM Querying in Loops:**
- Problem: Heavy use of `document.querySelector/querySelectorAll` inside loops
- Files: `calculator-engine.js` (lines 28-35, 79-100), multiple HTML files with inline scripts
- Cause: Re-querying DOM for same elements repeatedly; QuerySelector is O(n) operation
- Improvement path: Cache DOM nodes at start. Use event delegation. Refactor to accumulate updates then single render.

**Large Monolithic JavaScript Files Without Code Splitting:**
- Problem: ~3900 lines of JS in single files with no bundling/minification
- Files: `calculator.html` (2400 lines), `board.html` (1400 lines), `assign-work.html` (1100 lines)
- Cause: All code on one page; no lazy loading. Every script must parse/compile even if not used.
- Improvement path: Implement bundler (Vite, esbuild, webpack). Code split by page. Load only necessary modules.

**No Caching Strategy for API Responses:**
- Problem: Same data queries repeatedly; no caching between requests
- Files: `studio-context.js` (single page-lifetime cache), most pages reload data on every visit
- Cause: Fresh data each time. No stale-while-revalidate. Cache only per-page-load.
- Improvement path: Implement service worker for HTTP caching. Use Cache API headers (ETag, Last-Modified). Implement stale-while-revalidate pattern.

**Synchronous JSON.parse Without Timeout:**
- Problem: JSON.parse can block UI thread on large payloads; no limit on response size
- Files: `api.js` (line 47), `calculator-persistence.js`, multiple files
- Cause: Large database responses parsed synchronously; no pagination or size limits
- Improvement path: Implement pagination for large datasets. Use streaming JSON parsing. Add response size limits.

**No Image Optimization:**
- Problem: Unknown (image handling not visible in codebase; assume uploaded via settings.html)
- Files: `settings.html` (logo upload mentioned in comments)
- Improvement path: Implement client-side image compression before upload. Server-side optimization. Use WebP with fallbacks.

## Fragile Areas

**Calculator Module (Package Wrapping Logic):**
- Files: `calculator-engine.js`, `calculator-ui.js`, `calculator-persistence.js`, `calculator-render.js`, `calculator-pdf.js`
- Why fragile: Complex interdependencies between 5 files. Multiplicative logic (1.1x multiplier for "complex" flag) applied inconsistently. Multiple numeric conversions with parseFloat(). No input validation. No unit tests visible.
- Safe modification:
  - Write unit tests for each calculation function first
  - Document formula assumptions (units, precision, edge cases)
  - Add input validation before all calculations
  - Test with extreme values: 0, negative, very large numbers, decimals
  - Version the calculation logic; support multiple calculation engines

**Booking Popup System:**
- Files: `booking-popup.js` (570 lines), embedded in multiple pages
- Why fragile: Large file with multiple responsibilities. Uses innerHTML extensively. Manages global state via window._BookingPopup. Complex form state. No input validation visible. Error handling sparse.
- Safe modification:
  - Write integration tests for booking workflow
  - Extract validation logic
  - Implement proper error handling with user feedback
  - Split into smaller, focused modules
  - Add request timeout handling

**Database-to-UI Field Mapping:**
- Files: `api.js` (NUMERIC_FIELDS heuristic), `calculator-engine.js`, multiple HTML files
- Why fragile: Heuristic-based type conversion based on field name patterns. If backend changes field names or adds new numeric fields, conversion breaks silently.
- Safe modification:
  - Define explicit schema/types for each table
  - Create data mappers for each entity
  - Test with real API responses
  - Add runtime validation

**Studio Context and Role-Based Access:**
- Files: `studio-context.js`, `nav.js`, `auth.js`
- Why fragile: Cache is per-page; no invalidation mechanism on context changes. Role comparisons are string-based, not database-backed. Multiple ways to access auth state (_crmApi, _crmSb, localStorage).
- Safe modification:
  - Add event-driven cache invalidation
  - Verify roles with backend on every sensitive operation
  - Consolidate auth state access to single module
  - Add tests for role-based access control

## Scaling Limits

**Single-Page localStorage for Token Management:**
- Current capacity: localStorage can store ~5-10MB per domain
- Limit: If application adds more user session data or large caches, localStorage will fill up and throw QuotaExceededError
- Scaling path: Implement selective persistence. Use IndexedDB for larger datasets. Add data cleanup/eviction policies.

**Direct Supabase Queries Without Backend API:**
- Current capacity: Supabase anonymous client can handle typical traffic; RLS policies determine query cost
- Limit: No rate limiting visible; potential for abuse. Cost not controlled on client side.
- Scaling path: Move all data access through backend API with proper rate limiting, caching, and cost controls. Use backend as security boundary.

**HTML File Size and Page Load:**
- Current capacity: Largest file ~2400 lines HTML + inline JS/CSS
- Limit: Browser parse/compile time increases linearly. No code splitting. Difficult to lazy load.
- Scaling path: Implement build pipeline (Vite). Code split by page. Use dynamic imports. Implement service worker caching.

**In-Memory State Without Persistence:**
- Current capacity: Window objects and page-scoped caches work fine for single user session
- Limit: If application adds offline support or progressive features, loss of state on reload becomes problematic
- Scaling path: Implement persistent state (localStorage, IndexedDB, or backend sync). Add offline detection and queueing.

## Dependencies at Risk

**Supabase JavaScript SDK:**
- Risk: Direct dependency on @supabase/supabase-js v2 via CDN (jsdelivr); pinned by hash in HTML, not in package.json
- Impact: If CDN breaks or library has breaking change, application breaks silently
- Migration plan: Move to npm/package.json dependency. Implement proper version pinning. Add pre-commit hooks to verify dependencies.

**jsPDF and html2canvas for PDF Export:**
- Risk: External libraries loaded on-demand via CDN; both are heavy libraries (~300KB combined uncompressed)
- Impact: Slow PDF generation. Users with poor connectivity experience delays or timeouts. Libraries can be MITM attacked if CDN compromised.
- Migration plan: Implement server-side PDF generation (use Node.js pdfkit or Python reportlab). Or use lightweight alternative (PDFKit.js). Implement timeout and fallback.

**Chart.js Library:**
- Risk: Loaded via CDN; used in analytics.html and potentially other pages
- Impact: Analytics page breaks if Chart.js fails to load; no fallback rendering
- Migration plan: Bundle with application using npm. Implement graceful degradation if library unavailable.

**Missing package.json:**
- Risk: No package.json or dependency management; all dependencies assumed to be available at runtime via CDN
- Impact: Impossible to audit dependencies, check for security updates, or reproduce build environment. No version control of dependencies.
- Migration plan: Create package.json with all dependencies. Implement build process. Use npm/yarn/pnpm for dependency management.

## Missing Critical Features

**No Automated Testing:**
- Problem: No test files visible (*.test.js, *.spec.js)
- Blocks: Cannot safely refactor. Regressions undetected. API changes not caught.
- Impact on shipping: Every change requires manual testing. Bugs slip to production easily.

**No Session Timeout or Automatic Re-authentication:**
- Problem: Token stored in localStorage; no refresh mechanism visible
- Blocks: Sessions can expire mid-workflow; users lose work. Token revocation not enforced.

**No Offline Support:**
- Problem: Application requires constant connectivity; no service worker
- Blocks: Cannot work on plane, in elevator, or with spotty connection. Unsaved work lost on disconnect.

**No Analytics or Error Reporting:**
- Problem: console.error calls only; no error reporting service (Sentry, Rollbar, etc.)
- Blocks: Production errors unknown. Cannot prioritize fixes. Users suffer bugs in production without developers knowing.

**No Accessibility (a11y) Testing:**
- Problem: Inline styles, emojis as icons, no ARIA labels visible
- Blocks: Application unusable for screenreader users. Keyboard navigation not comprehensive.

**No I18n/Localization:**
- Problem: All strings hardcoded in Russian
- Blocks: Cannot serve non-Russian users. No way to expand to international markets.

## Test Coverage Gaps

**Calculator Logic Untested:**
- What's not tested: collectAll(), taxCoef(), markups(), rendering logic, PDF export
- Files: `calculator-engine.js`, `calculator-render.js`, `calculator-pdf.js`
- Risk: Calculation errors undetected until customer discovers wrong price. Edge cases not verified (negative values, 0, very large numbers).
- Priority: High

**API Layer Untested:**
- What's not tested: apiFetch() error handling, QueryBuilder filter generation, token refresh logic, numeric field parsing
- Files: `api.js`
- Risk: API breaking changes not caught. Error handling bugs. Silent data loss.
- Priority: High

**Authentication Flow Untested:**
- What's not tested: requireAuth() redirects, token expiration, session validation, admin role verification
- Files: `auth.js`, `studio-context.js`
- Risk: Auth bypass possible. Users access restricted areas. Admin actions allow by non-admins.
- Priority: Critical

**Database Integration Untested:**
- What's not tested: RLS policy enforcement, data validation, relationship integrity, studio isolation
- Files: All files making database calls
- Risk: Data corruption. Cross-tenant data leaks. Orphaned records.
- Priority: Critical

**Persistence/Auto-save Untested:**
- What's not tested: Auto-save triggers, conflict resolution, rollback on error, partial save scenarios
- Files: `calculator-persistence.js`
- Risk: User data loss. Corrupted calculations. Sync failures.
- Priority: High

**Booking Popup Untested:**
- What's not tested: Form validation, submission flow, error handling, car/calculation selection logic
- Files: `booking-popup.js`
- Risk: Bookings fail to save. Data corruption. Users unaware of failures.
- Priority: High

---

*Concerns audit: 2026-03-25*

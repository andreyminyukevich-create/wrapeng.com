# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- JavaScript (vanilla, no transpilation) - Frontend application and client-side logic
- Russian language locale used throughout codebase comments and UI

## Runtime

**Environment:**
- Browser (modern standards: ES6+, async/await, Fetch API, localStorage)
- No Node.js/build tools detected

**Package Manager:**
- No package manager (npm/yarn) in use
- All dependencies loaded via CDN scripts in HTML files

## Frameworks

**Core:**
- Vanilla JavaScript (no framework) - HTML pages with embedded script modules
- Browser Fetch API - HTTP client for API communication

**UI:**
- Custom CSS (`nav.css` for navigation component)
- No CSS framework detected (pure CSS with CSS custom properties)
- Custom DOM utilities in `dom.js` for element manipulation

**PDF Generation:**
- Custom PDF library - `calculator-pdf.js` generates PDF documents (appears to be pdfkit or similar)

## Key Dependencies

**Critical:**
- Supabase JS SDK (v2) - Authentication and database via CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`
  - Used for: user auth, session management, real-time data
  - Location: `supabase.js` - singleton client wrapper
  - Authentication method: JWT tokens with localStorage persistence

**Infrastructure:**
- Custom API client abstraction - `api.js` provides a Supabase-like query interface
  - Implements QueryBuilder pattern matching Supabase RLS policies
  - Handles JWT token lifecycle and refresh
  - Location: `api.js` (140 lines)

**Utilities:**
- `dom.js` - DOM manipulation helpers (createElement, querySelector, event delegation)
- `errors.js` - Error normalization and classification system
- `formatters.js` - Russian locale formatting (money, dates, phones)
- `auth.js` - Authentication state management
- `studio-context.js` - User context (studio, role, subscription)

## Configuration

**Environment:**
- Supabase URL: `https://hdghijgrrnzmntistdvw.supabase.co`
- Supabase Anon Key embedded in `supabase.js`
- API Base URL: `/api` (relative path, backend-dependent)
- No `.env` file detected (secrets hardcoded in `supabase.js`)

**Build:**
- No build step detected
- Single-file HTML pages with inline modules
- CSS inlined in `<style>` tags within HTML

## Platform Requirements

**Development:**
- Text editor (any)
- Modern browser (ES6+ support)
- Git for version control

**Production:**
- Static file server (serves HTML + JS + CSS)
- Backend API at `/api` endpoint (separate service)
- Supabase instance at `https://hdghijgrrnzmntistdvw.supabase.co`
- Deployment via rsync script: `deploy.sh`

## Frontend Architecture

**Module Pattern:**
- ES6 modules with `export`/`import` statements
- Global namespacing for Supabase client: `window._crmSb`, `window._crmApi`
- Each HTML page loads multiple `<script type="module">` blocks

**Largest Components by Lines:**
- `calculator-render.js` (677 lines) - Renders calculation form UI
- `calculator-persistence.js` (583 lines) - Autosave and form persistence
- `booking-popup.js` (571 lines) - Calendar/booking widget
- `calculator-ui.js` (283 lines) - Calculator form setup
- `ui.js` (271 lines) - Generic UI components
- `calculator-engine.js` (221 lines) - Calculation business logic
- `nav.js` (204 lines) - Navigation sidebar

---

*Stack analysis: 2026-03-25*

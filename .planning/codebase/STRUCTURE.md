# Codebase Structure

**Analysis Date:** 2026-03-25

## Directory Layout

```
/Users/and20mnk/Downloads/wrapeng-17.com-main/
├── api.js                      # API client, QueryBuilder, auth methods
├── auth.js                     # Session, user, auth guards
├── studio-context.js           # Studio membership, subscription context
├── dom.js                      # DOM helpers (qs, qsa, createEl, etc)
├── errors.js                   # Error normalization, typed errors
├── formatters.js               # Money, date, phone formatting
├── ui.js                       # Toast, modals, loading states
├── footer.js                   # Footer component
├── nav.js                      # Sidebar navigation, role-based menu
├── nav.css                     # Navigation styles
├──
├── calculator-data.js          # Car DB, service descriptions, state vars
├── calculator-engine.js        # Cost calculations, markups, tax logic
├── calculator-render.js        # Chart rendering, service list HTML
├── calculator-ui.js            # Form initialization, dynamic rows
├── calculator-pdf.js           # PDF generation and export
├── calculator-persistence.js   # Auto-save, form restoration
├──
├── booking-popup.js            # Booking modal, appointment scheduling
├── ui.js                       # Shared UI utilities
├──
├── welcome.html                # Login/signup page
├── dashboard.html              # Main dashboard
├── calculator.html             # Service cost calculator
├── board.html                  # Kanban task board
├── clients.html                # Client management
├── executors.html              # Staff directory
├── inventory.html              # Parts/materials inventory
├── calendar.html               # Team schedule
├── settings.html               # Studio configuration
├── analytics.html              # KPI dashboard
├── cashflow.html               # Cash flow / DDS
├── income.html                 # Revenue tracking
├── payouts.html                # Salary management
├── counterparties.html         # Supplier/contractor management
├── work-order.html             # Work orders (наряд)
├── acceptance-act.html         # Customer acceptance form
├── sales.html                  # Sales pipeline
├── reconcile.html              # Reconciliation acts
├── admin.html                  # Admin panel (global settings)
├── consent.html                # Legal consent
├── privacy-policy.html         # Privacy terms
├── user-agreement.html         # User terms
├── calc-view.html              # Calculator view-only page
├──
├── index.html                  # Redirect to dashboard
├── deploy.sh                   # Deployment script
├──
├── .planning/codebase/         # GSD documentation
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   └── ...
├── .git/                       # Git repository
└── .claude/                    # Claude workspace
```

## Directory Purposes

**Root Directory:**
- Purpose: All source code at root level (no subdirectories)
- Contains: JavaScript modules, HTML pages, CSS files
- Rationale: Small, single-page application with simple routing

## Key File Locations

**Entry Points:**
- `welcome.html`: Authentication page (login/signup)
- `dashboard.html`: Post-login dashboard
- `index.html`: Redirects to `dashboard.html`
- `calculator.html`: Cost calculator tool
- `board.html`: Kanban board for work orders

**Core API & Auth:**
- `api.js`: HTTP client, QueryBuilder, token management
- `auth.js`: User session, permission checks
- `studio-context.js`: Studio membership, subscription status

**UI Utilities:**
- `dom.js`: Selector helpers, element creation, safe text setting
- `formatters.js`: Currency, date, phone formatting
- `errors.js`: Error type normalization
- `ui.js`: Toast notifications, modal dialogs, loading states
- `nav.js` + `nav.css`: Sidebar navigation UI

**Calculator Feature:**
- `calculator-data.js`: Car database, service names, global state
- `calculator-engine.js`: Core calculation logic (materials, labor, tax, markups)
- `calculator-render.js`: Rendering service lists, chart updates
- `calculator-ui.js`: Form initialization, dynamic row management
- `calculator-pdf.js`: PDF export
- `calculator-persistence.js`: Auto-save state to localStorage
- `calculator.html`: Calculator page

**Booking & Appointments:**
- `booking-popup.js`: Appointment scheduling modal

**Feature Pages:**
- `clients.html`: Customer management
- `executors.html`: Employee/contractor directory
- `inventory.html`: Parts and materials inventory
- `board.html`: Task board (Kanban)
- `calendar.html`: Schedule/calendar view
- `settings.html`: Studio settings and team management
- `admin.html`: Global admin panel
- `analytics.html`: KPI dashboard
- `cashflow.html`: Financial dashboard (DDS)
- `income.html`: Revenue tracking
- `payouts.html`: Salary/payment processing
- `counterparties.html`: Suppliers and contractors
- `work-order.html`: Work order management
- `sales.html`: Sales pipeline

**Configuration & Metadata:**
- `deploy.sh`: Deployment script
- `.planning/codebase/`: GSD documentation

## Naming Conventions

**Files:**
- **Modules:** kebab-case (e.g., `calculator-engine.js`, `studio-context.js`)
- **HTML Pages:** kebab-case (e.g., `work-order.html`, `calc-view.html`)
- **CSS:** kebab-case (e.g., `nav.css`)

**DOM Elements & Classes:**
- **IDs:** camelCase or kebab-case mixed (e.g., `#pkgMarkup`, `#ppfClearChk`, `#armDyn`)
- **CSS Classes:** kebab-case (e.g., `.service-item`, `.form-group`, `.status-draft`)
- **Data Attributes:** kebab-case (e.g., `data-theme`, `data-studio-id`)

**JavaScript Functions & Variables:**
- **Exports:** camelCase (e.g., `getCurrentUser()`, `fmtMoney()`, `normalizeError()`)
- **DOM Queries:** Single letter (e.g., `q()` for querySelector, `qa()` for querySelectorAll)
- **Abbreviations:** `fmt` (format), `sb` (supabase API client), `ctx` (context)
- **Global State:** Prefixed with underscore (e.g., `_cache`, `_authListeners`, `_escMap`)

**Constants:**
- **UPPERCASE_SNAKE_CASE** (e.g., `NUMERIC_FIELDS`, `ADMIN_ID`, `TOKEN_KEY`, `USER_KEY`)
- **Enums as Objects:** `ERR`, `SUBSCRIPTION`, `STATUSES`

## Where to Add New Code

**New Feature (Complete):**
- **Core Logic:** Create `feature-name-engine.js` in root
  - Example: `board-engine.js` for board calculations
- **Rendering:** Create `feature-name-render.js` in root
- **Persistence:** Create `feature-name-persistence.js` if needed
- **Page:** Create `feature-name.html` in root
- **Import pattern:** Use `import { functionName } from './feature-name-engine.js'`

**New Utility Function:**
- **If formatting/display:** Add to `formatters.js`
- **If DOM helpers:** Add to `dom.js`
- **If error handling:** Add to `errors.js`
- **If UI components:** Add to `ui.js`

**New API Endpoint:**
- Add a method to `QueryBuilder` class in `api.js` if pattern matches (filtering, ordering, pagination)
- Otherwise use `apiFetch()` directly:
  ```javascript
  const { data, error } = await apiFetch('POST', '/custom/endpoint', { body });
  ```

**New Page/Feature:**
1. Create `feature-name.html` in root
2. Create supporting module files as needed (e.g., `feature-name-engine.js`)
3. Add navigation item to `nav.js` array (around line 23)
4. Import auth check: `import { requireAuth } from './auth.js'`
5. Import studio context if needed: `import { requireAccess } from './studio-context.js'`
6. Include `<link rel="stylesheet" href="nav.css"><script src="nav.js"></script>` at top

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD documentation (ARCHITECTURE.md, STRUCTURE.md, etc)
- Generated: Yes (by GSD mapper)
- Committed: Yes (version controlled)

**`.git/`:**
- Purpose: Git repository metadata
- Generated: Yes (automatically)
- Committed: N/A (internal)

**`.claude/`:**
- Purpose: Claude workspace and session data
- Generated: Yes (Claude AI)
- Committed: No (in .gitignore)

## Root-Level Code Organization

**Why No Subdirectories?**

This is intentional for a small SPA with 40-50 files:
- All files easily discoverable at root
- Simple module imports (`./api.js` vs `./core/api.js`)
- Natural organization by feature (calculator-* files grouped, board-* files grouped, etc)
- Low overhead for file management

**If Growing Beyond 100+ Files:**
Consider reorganizing into:
```
src/
  ├── core/           # api.js, auth.js, dom.js, etc
  ├── features/
  │   ├── calculator/
  │   ├── board/
  │   └── ...
  ├── pages/          # HTML files
  └── styles/         # CSS files
```

## Module Dependency Graph

```
api.js (lowest level)
  ├── auth.js
  │   └── studio-context.js
  ├── calculator-persistence.js
  └── (used by all feature modules)

dom.js, formatters.js, errors.js (no dependencies)
  └── ui.js (depends on dom.js)

calculator-data.js (no dependencies)
  ├── calculator-engine.js
  │   ├── calculator-render.js
  │   └── calculator-persistence.js
  └── calculator-ui.js
      └── calculator-persistence.js

nav.js (depends on nothing, injected globally)

booking-popup.js (depends on dom.js, ui.js)
```

---

*Structure analysis: 2026-03-25*

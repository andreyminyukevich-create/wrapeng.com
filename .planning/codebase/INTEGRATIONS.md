# External Integrations

**Analysis Date:** 2026-03-25

## APIs & External Services

**Supabase (Primary Backend):**
- Supabase PostgreSQL database
  - SDK/Client: `@supabase/supabase-js` (v2) via CDN
  - Location: Singleton client in `supabase.js`
  - Wrapped by custom API abstraction in `api.js`

**Backend REST API:**
- Custom API at `/api` endpoint (relative path)
- Authentication: Bearer token (JWT)
- Endpoints detected:
  - `POST /api/auth/login` - Login endpoint
  - `GET /api/auth/me` - Current user info
  - `GET /api/studio-members/me` - User's studio membership
  - `GET /api/table/{table_name}` - Generic table query (via QueryBuilder)
  - `POST /api/table/{table_name}` - Insert/upsert rows
  - `PATCH /api/table/{table_name}` - Update rows
  - `DELETE /api/table/{table_name}` - Delete rows

## Data Storage

**Primary Database:**
- Supabase PostgreSQL (managed service)
- Tables referenced:
  - `profiles` - User profiles with subscription status (`is_paid`, `trial_ends_at`)
  - `studio_members` - Studio membership with roles (owner, manager, staff)
  - `studios` - Studio data with subscription tier and expiration
  - Generic table access via `sb.from(table_name)` pattern

**Client-Side Storage:**
- `localStorage`:
  - `k1r_token` - JWT access token for API authentication
  - `k1r_user` - Cached user object (JSON)
  - Persists across browser sessions
- Location: `api.js` (token management functions)

**Form Persistence:**
- Form state stored in localStorage during calculator operations
- Location: `calculator-persistence.js`

**File Storage:**
- PDF generation (no external cloud storage detected)
- Location: `calculator-pdf.js` generates PDF dynamically

**Caching:**
- Page-level context cache: `studio-context.js` caches user+studio info
- Cache cleared on unauthorized (401) responses

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (custom JWT-based)
- Implementation: `auth.js` provides session management
- Methods:
  - `signInWithPassword(email, password)` - Login via `/api/auth/login`
  - `getSession()` - Retrieve cached JWT token
  - `getUser()` - Get user object from `/api/auth/me`
  - `signOut()` - Clear token and session

**Token Management:**
- JWT tokens stored in localStorage (`k1r_token`)
- Auto-refresh: checks token expiration with `jwtExpired(token)` function
- JWT parsing: manual decode with `atob()` of token payload
- 401 response triggers logout and `k1r:unauthorized` event dispatch
- Location: `api.js` (lines 15-20, 95-127)

**Authorization:**
- Role-based: `owner`, `manager`, `staff`, `none`
- Global admin check: user ID `c5db87ec-8e4a-4c48-bad3-5747513224d9` has special privileges
- Subscription-based access:
  - `is_paid` flag determines full access
  - Trial period: `trial_ends_at` timestamp
  - Location: `calculator-persistence.js`, `studio-context.js`

**Protected Routes:**
- `requireAuth()` redirects to `welcome.html?returnUrl=...` if no session
- Location: `auth.js`

## Monitoring & Observability

**Error Tracking:**
- No external error tracking service detected
- Client-side error logging via `console.error()`
- Structured error normalization in `errors.js`

**Logs:**
- Browser console only
- Error classification system:
  - `auth` - Session expired
  - `access` - Permission denied
  - `not_found` - Record not found
  - `validation` - Bad data
  - `network` - Connection failed
  - `database` - Supabase/PostgreSQL error
  - `render` - UI rendering error
  - `unknown` - Uncategorized
- Location: `errors.js`, `normalizeError()` function

**Usage Analytics:**
- No analytics service integrated
- No tracking pixels or event logging

## CI/CD & Deployment

**Hosting:**
- Static host (appears to be traditional VPS/Linux server)
- Deployed to: `keep1r:/var/www/keep1r/wrapeng.com/`

**Deployment Method:**
- Shell script: `deploy.sh`
- Tool: `rsync` with flags:
  - `-avz` - Archive, verbose, compress
  - `--delete` - Remove files from remote that don't exist locally
  - Excludes: `node_modules`, `.git`, `.env`, `deploy.sh`
- SSH-based deployment to remote Linux server

**CI Pipeline:**
- Not detected (manual deployment via `deploy.sh`)

## Environment Configuration

**Required env vars:**
- None detected (all secrets currently hardcoded)

**Current Configuration Location:**
- Supabase credentials: `supabase.js` lines 13-14 (hardcoded)
- API base URL: `api.js` line 5 (hardcoded as `/api`)
- Admin ID: `auth.js` line 48 and `nav.js`

**Secrets location:**
- `.env` file present but not analyzed (contains sensitive keys)

## Webhooks & Callbacks

**Incoming:**
- Custom event system: `k1r:unauthorized` event dispatched on 401 responses
- Event listener pattern: `window.addEventListener('k1r:unauthorized', callback)`
- Location: `api.js` line 135

**Outgoing:**
- No outgoing webhooks detected
- Supabase real-time subscriptions not explicitly used (only REST API)

## Security Notes

**Concerns:**
1. Supabase credentials hardcoded in `supabase.js` (anon key visible in source)
2. JWT tokens stored in localStorage (vulnerable to XSS)
3. No CSRF protection detected for state-changing requests
4. Password transmitted over HTTP to `/api/auth/login` (requires backend TLS)
5. No request signing or rate limiting detected

**Mitigations in Place:**
- XSS protection: `escapeHtml()` function used for user-generated content (location: `formatters.js`)
- Supabase RLS (Row-Level Security) enforces database-level access control
- JWT expiration validation prevents indefinite session lifetime
- 401 handling clears invalid tokens

---

*Integration audit: 2026-03-25*

/**
 * api.js — замена supabase.js
 */

const API_BASE = '/api';
const TOKEN_KEY = 'k1r_token';
const USER_KEY  = 'k1r_user';

function getToken()       { return localStorage.getItem(TOKEN_KEY); }
function setToken(t)      { localStorage.setItem(TOKEN_KEY, t); }
function clearToken()     { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
function getStoredUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
function setStoredUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

function jwtExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Date.now() / 1000 > payload.exp;
  } catch { return true; }
}

const NUMERIC_FIELDS = new Set(['total_price','total_amount','final_price','amount','price',
  'cost','salary','rate','markup','discount','quantity','mot','mat','sum',
  'payout_amount','paid_amount','balance']);

function parseNumbers(obj, key) {
  if (Array.isArray(obj)) return obj.map(v => parseNumbers(v, key));
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) res[k] = parseNumbers(v, k);
    return res;
  }
  if (typeof obj === 'string' && obj.trim() !== '' && !isNaN(obj) && NUMERIC_FIELDS.has(key)) return Number(obj);
  return obj;
}

async function apiFetch(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);
  let res;
  try { res = await fetch(API_BASE + path, opts); } catch (err) { return { data: null, error: { message: err.message } }; }
  if (res.status === 401) { clearToken(); window.dispatchEvent(new CustomEvent('k1r:unauthorized')); }
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) return { data: null, error: { message: data.message || 'HTTP ' + res.status } };
  return { data: parseNumbers(data), error: null };
}

class QueryBuilder {
  constructor(table) {
    this._table = table; this._method = 'GET'; this._body = null;
    this._filters = []; this._order = null; this._limit = null;
    this._single = false; this._upsert = false;
  }
  select(cols) { return this; }
  eq(col, val)    { this._filters.push([col, 'eq',    val]); return this; }
  neq(col, val)   { this._filters.push([col, 'neq',   val]); return this; }
  gt(col, val)    { this._filters.push([col, 'gt',    val]); return this; }
  gte(col, val)   { this._filters.push([col, 'gte',   val]); return this; }
  lt(col, val)    { this._filters.push([col, 'lt',    val]); return this; }
  lte(col, val)   { this._filters.push([col, 'lte',   val]); return this; }
  ilike(col, val) { this._filters.push([col, 'ilike', val]); return this; }
  is(col, val)    { this._filters.push([col, 'is',    val]); return this; }
  in(col, vals)   { this._filters.push([col, 'eq',    vals[0]]); return this; }
  order(col, opts) { this._order = col + '.' + ((opts && opts.ascending === false) ? 'desc' : 'asc'); return this; }
  limit(n)  { this._limit = n; return this; }
  single()     { this._single = true; return this; }
  maybeSingle() { this._single = true; return this; }
  insert(body) { this._method = 'POST';   this._body = body; return this; }
  update(body) { this._method = 'PATCH';  this._body = body; return this; }
  delete()     { this._method = 'DELETE';                    return this; }
  upsert(body) { this._method = 'POST';   this._body = body; this._upsert = true; return this; }
  then(resolve, reject) { return this._run().then(resolve, reject); }
  catch(reject)         { return this._run().catch(reject); }
  async _run() {
    const params = new URLSearchParams();
    if (this._order)  params.set('order',  this._order);
    if (this._limit)  params.set('limit',  this._limit);
    if (this._single) params.set('single', '1');
    for (const [col, op, val] of this._filters) params.append('filter[' + col + '][' + op + ']', val ?? '');
    const qs = params.toString();
    const path = '/table/' + this._table + (qs ? '?' + qs : '');
    const result = await apiFetch(this._method, path, this._body);
    if (!result.error && this._single && Array.isArray(result.data)) result.data = result.data[0] ?? null;
    return result;
  }
}

const _authListeners = new Set();
function _emitAuth(event, session) { for (const cb of _authListeners) try { cb(event, session); } catch {} }

const _auth = {
  async signInWithPassword({ email, password }) {
    let res, data;
    try {
      res  = await fetch(API_BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      data = await res.json();
    } catch (err) { return { data: null, error: { message: err.message } }; }
    if (!res.ok) return { data: null, error: { message: data.message || 'Ошибка входа' } };
    setToken(data.token); setStoredUser(data.user);
    const session = { access_token: data.token, user: data.user };
    _emitAuth('SIGNED_IN', session);
    return { data: { user: data.user, session }, error: null };
  },
  async signOut() { clearToken(); _emitAuth('SIGNED_OUT', null); return { error: null }; },
  async getUser() {
    const token = getToken();
    if (!token || jwtExpired(token)) { clearToken(); return { data: { user: null }, error: null }; }
    const cached = getStoredUser();
    if (cached) return { data: { user: cached }, error: null };
    const { data, error } = await apiFetch('GET', '/auth/me');
    if (!error) setStoredUser(data);
    return { data: { user: data ?? null }, error };
  },
  async getSession() {
    const token = getToken();
    if (!token || jwtExpired(token)) { clearToken(); return { data: { session: null }, error: null }; }
    return { data: { session: { access_token: token, user: getStoredUser() } }, error: null };
  },
  onAuthStateChange(cb) {
    _authListeners.add(cb);
    this.getSession().then(({ data }) => cb(data.session ? 'SIGNED_IN' : 'SIGNED_OUT', data.session));
    return { data: { subscription: { unsubscribe: () => _authListeners.delete(cb) } } };
  },
};

const sb = {
  from(table) { return new QueryBuilder(table); },
  auth: _auth,
};

window.addEventListener('k1r:unauthorized', () => _emitAuth('SIGNED_OUT', null));
window._crmApi = window._crmApi ?? sb;
window._crmSb  = window._crmApi;

export { sb };
export const SUPABASE_URL = null;

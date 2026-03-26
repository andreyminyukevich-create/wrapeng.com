/**
 * partner-api.js — API клиент для кабинета партнёра
 */

const API_BASE = '/api';
const TOKEN_KEY = 'k1r_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }

export async function partnerFetch(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);
  let res;
  try { res = await fetch(API_BASE + path, opts); } catch (err) { return { data: null, error: err.message }; }
  if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = 'partner-login.html'; return { data: null, error: 'Unauthorized' }; }
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) return { data: null, error: data.message || data.error || 'HTTP ' + res.status };
  return { data, error: null };
}

export async function partnerLogin(email, password) {
  const { data, error } = await partnerFetch('/auth/login', 'POST', { email, password });
  if (error) return { error };
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem('k1r_user', JSON.stringify(data.user));
  return { data };
}

export function partnerLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('k1r_user');
  window.location.href = 'partner-login.html';
}

export function isAuthenticated() {
  return !!getToken();
}

export function requirePartnerAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'partner-login.html';
    return false;
  }
  return true;
}

export function fmt(n) {
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

export function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('ru-RU'); } catch { return d; }
}

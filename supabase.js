/**
 * core/supabase.js
 * Единственный источник Supabase-клиента для всего проекта.
 *
 * Использование:
 *   import { sb } from './core/supabase.js';
 *
 * Требования к странице:
 *   Supabase CDN должен быть подключён ДО этого модуля:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 */

const SUPABASE_URL      = 'https://hdghijgrrnzmntistdvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hpamdycm56bW50aXN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzMyNzksImV4cCI6MjA3NTYwOTI3OX0.D9EDTmVrFRVp0B8_5tCJM29gbFdtadsom0Ihsf4uQ8Q';

if (!window.supabase) {
  throw new Error('[core/supabase] window.supabase не найден. Подключи CDN-скрипт до модулей.');
}

// Создаём один раз, переиспользуем везде.
// Если по какой-то причине уже создан (HMR / двойной импорт) — берём существующий.
const sb = window._crmSb ?? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});

// Кэшируем глобально, чтобы nav.js и legacy-код не создавали второй экземпляр.
window._crmSb = sb;

export { sb, SUPABASE_URL };

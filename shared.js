// shared.js - Общие функции для всех страниц

// Supabase конфигурация
const SUPABASE_URL = 'https://hdghjjgrrnzmnttstdvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2hqamdycm56bW50dHN0ZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxMTc1MjYsImV4cCI6MjA1MDY5MzUyNn0.pPKs7TUONpGgTEkfvnJFa7irv_9YaFo7LT4F_VZLXvs';

let sb = null;
let currentUser = null;

// Инициализация Supabase
async function initAuth() {
  if (!sb) {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  
  // Проверяем текущую сессию
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
  }
  
  return sb;
}

// Получить текущего пользователя
async function getCurrentUser() {
  if (!sb) await initAuth();
  
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    return currentUser;
  }
  return null;
}

// Получить профиль пользователя
async function getProfile(userId) {
  if (!sb) await initAuth();
  
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error loading profile:', error);
    return null;
  }
  
  return data;
}

// Выход
async function logout() {
  if (!sb) await initAuth();
  await sb.auth.signOut();
  currentUser = null;
}

// Вход
async function login(email, password) {
  if (!sb) await initAuth();
  
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw error;
  }
  
  currentUser = data.user;
  return data;
}

// Регистрация
async function register(email, password, studioName) {
  if (!sb) await initAuth();
  
  // Создаём пользователя
  const { data, error } = await sb.auth.signUp({
    email,
    password
  });
  
  if (error) {
    throw error;
  }
  
  const user = data.user;
  if (!user) {
    throw new Error('User not created');
  }
  
  // Создаём профиль
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const referralCode = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const { mode, ref } = getUrlParams();
  
  const profileData = {
    id: user.id,
    email,
    studio_name: studioName || 'Моя студия',
    is_paid: false,
    referral_code: referralCode
  };
  
  if (mode === 'trial') {
    profileData.trial_started_at = now.toISOString();
    profileData.trial_ends_at = trialEnds.toISOString();
  }
  
  if (ref) {
    profileData.referred_by = ref;
  }
  
  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .insert(profileData)
    .select()
    .single();
  
  if (profileError) {
    console.error('Profile creation error:', profileError);
    throw profileError;
  }
  
  currentUser = user;
  return { user, profile };
}

// Получить параметры URL
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    mode: params.get('mode'),
    ref: params.get('ref')
  };
}

// Сохранить расчёт
async function saveCalculation(calculationData) {
  if (!sb) await initAuth();
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not logged in');
  }
  
  const { data, error } = await sb
    .from('calculations')
    .insert({
      user_id: user.id,
      ...calculationData
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving calculation:', error);
    throw error;
  }
  
  return data;
}

// Получить расчёты пользователя
async function getCalculations(limit = 100) {
  if (!sb) await initAuth();
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not logged in');
  }
  
  const { data, error } = await sb
    .from('calculations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error loading calculations:', error);
    throw error;
  }
  
  return data;
}

// Получить один расчёт
async function getCalculation(id) {
  if (!sb) await initAuth();
  
  const { data, error } = await sb
    .from('calculations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error loading calculation:', error);
    throw error;
  }
  
  return data;
}

// Обновить расчёт
async function updateCalculation(id, calculationData) {
  if (!sb) await initAuth();
  
  const { data, error } = await sb
    .from('calculations')
    .update(calculationData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating calculation:', error);
    throw error;
  }
  
  return data;
}

// Удалить расчёт
async function deleteCalculation(id) {
  if (!sb) await initAuth();
  
  const { error } = await sb
    .from('calculations')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting calculation:', error);
    throw error;
  }
  
  return true;
}

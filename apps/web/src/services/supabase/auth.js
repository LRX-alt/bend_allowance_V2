import { getSupabase } from './client.js';

export function safeNext(value, fallback = '/progetti') {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value.includes('://') || value.includes('\\')) return fallback;
  return value;
}

export async function signInWithProvider(provider, redirectTo) {
  const supabase = await getSupabase();
  if (!supabase) {
    const error = new Error('Supabase non configurato');
    error.code = 'not_configured';
    throw error;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

export async function fetchProfile(userId) {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, patch) {
  const supabase = await getSupabase();
  if (!supabase) {
    const error = new Error('Supabase non configurato');
    error.code = 'not_configured';
    throw error;
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('id, display_name, avatar_url, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

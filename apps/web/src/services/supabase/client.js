let clientPromise = null;

export function supabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL || '';
}

export function supabaseKey() {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
}

export function isConfigured() {
  return Boolean(supabaseUrl() && supabaseKey());
}

export function projectRef() {
  try {
    return new URL(supabaseUrl()).hostname.split('.')[0];
  } catch {
    return '';
  }
}

export function hasStoredSession() {
  if (import.meta.env.SSR || typeof localStorage === 'undefined') return false;
  const ref = projectRef();
  if (!ref) return false;
  try {
    return Boolean(localStorage.getItem(`sb-${ref}-auth-token`));
  } catch {
    return false;
  }
}

export function getSupabase() {
  if (import.meta.env.SSR) return Promise.resolve(null);
  if (!isConfigured()) return Promise.resolve(null);
  if (!clientPromise) {
    const url = supabaseUrl();
    const key = supabaseKey();
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, key, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    );
  }
  return clientPromise;
}

export function resetSupabaseForTests() {
  clientPromise = null;
}

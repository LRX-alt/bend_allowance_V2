import { computed, readonly, ref } from 'vue';
import {
  fetchProfile,
  safeNext,
  signInWithProvider,
  updateProfile,
} from '@/services/supabase/auth.js';
import { getSupabase, isConfigured } from '@/services/supabase/client.js';
import { toUserError } from '@/services/supabase/errors.js';

const status = ref('unknown');
const session = ref(null);
const profile = ref(null);
const errorMessage = ref('');
let ready = null;
let clientOverride = null;

export function __setAuthClientForTests(factory) {
  clientOverride = factory;
  ready = null;
  status.value = 'unknown';
  session.value = null;
  profile.value = null;
  errorMessage.value = '';
}

function client() {
  if (clientOverride) return Promise.resolve(clientOverride());
  return getSupabase();
}

function applySession(next) {
  session.value = next || null;
  status.value = next?.user ? 'authenticated' : 'anonymous';
  if (!next?.user) profile.value = null;
}

async function loadProfile(userId) {
  try {
    const next = await fetchProfile(userId);
    if (session.value?.user?.id === userId) profile.value = next;
  } catch (error) {
    errorMessage.value = toUserError(error).message;
  }
}

async function start() {
  if (import.meta.env.SSR && !clientOverride) {
    status.value = 'unknown';
    return;
  }
  const supabase = await client();
  if (!supabase) {
    status.value = 'anonymous';
    return;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    errorMessage.value = toUserError(error).message;
    applySession(null);
  } else {
    applySession(data.session);
    if (data.session?.user && !clientOverride) await loadProfile(data.session.user.id);
  }
  supabase.auth.onAuthStateChange((event, next) => {
    if (event === 'SIGNED_OUT') {
      applySession(null);
      return;
    }
    if (
      event === 'SIGNED_IN' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'USER_UPDATED' ||
      event === 'INITIAL_SESSION'
    ) {
      applySession(next);
      if (next?.user && !clientOverride) void loadProfile(next.user.id);
    }
  });
}

export function useAuth() {
  const user = computed(() => session.value?.user ?? null);
  const isAuthenticated = computed(() => status.value === 'authenticated');
  const displayName = computed(
    () =>
      profile.value?.display_name ||
      user.value?.user_metadata?.full_name ||
      user.value?.user_metadata?.name ||
      user.value?.email ||
      ''
  );
  const avatarUrl = computed(
    () =>
      profile.value?.avatar_url ||
      user.value?.user_metadata?.avatar_url ||
      user.value?.user_metadata?.picture ||
      ''
  );

  function whenReady() {
    if (!ready) ready = start();
    return ready;
  }

  function markAnonymous() {
    if (status.value === 'unknown') status.value = 'anonymous';
  }

  async function signInWithGoogle(nextPath) {
    errorMessage.value = '';
    const next = safeNext(typeof nextPath === 'string' ? nextPath : '/progetti');
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    try {
      await signInWithProvider('google', redirectTo);
    } catch (error) {
      errorMessage.value = toUserError(error).message;
      throw error;
    }
  }

  async function signOut() {
    const supabase = await client();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) errorMessage.value = toUserError(error).message;
    }
    applySession(null);
  }

  async function saveDisplayName(name) {
    const trimmed = String(name || '')
      .trim()
      .slice(0, 120);
    const data = await updateProfile(user.value.id, { display_name: trimmed });
    profile.value = data;
    return data;
  }

  return {
    status: readonly(status),
    user,
    profile: readonly(profile),
    errorMessage: readonly(errorMessage),
    isAuthenticated,
    displayName,
    avatarUrl,
    configured: isConfigured(),
    whenReady,
    markAnonymous,
    signInWithGoogle,
    signOut,
    saveDisplayName,
  };
}

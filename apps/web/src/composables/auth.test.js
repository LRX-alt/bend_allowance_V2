import { describe, expect, it } from 'vitest';
import { __setAuthClientForTests, useAuth } from './useAuth.js';

function mockClient(session) {
  const listeners = [];
  return {
    listeners,
    auth: {
      async getSession() {
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback) {
        listeners.push(callback);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signOut() {
        return { error: null };
      },
    },
  };
}

describe('useAuth', () => {
  it('ripristina la sessione salvata', async () => {
    const client = mockClient({ user: { id: 'a', email: 'a@example.com' } });
    __setAuthClientForTests(() => client);
    const auth = useAuth();
    await auth.whenReady();
    expect(auth.isAuthenticated.value).toBe(true);
    expect(auth.user.value.email).toBe('a@example.com');
  });

  it('applica login e logout', async () => {
    const client = mockClient(null);
    __setAuthClientForTests(() => client);
    const auth = useAuth();
    await auth.whenReady();
    expect(auth.status.value).toBe('anonymous');
    client.listeners[0]('SIGNED_IN', { user: { id: 'b', email: 'b@example.com' } });
    expect(auth.isAuthenticated.value).toBe(true);
    client.listeners[0]('SIGNED_OUT', null);
    expect(auth.user.value).toBeNull();
  });

  it('chiude la sessione con signOut', async () => {
    const client = mockClient({ user: { id: 'a', email: 'a@example.com' } });
    __setAuthClientForTests(() => client);
    const auth = useAuth();
    await auth.whenReady();
    await auth.signOut();
    expect(auth.isAuthenticated.value).toBe(false);
    expect(auth.user.value).toBeNull();
  });
});

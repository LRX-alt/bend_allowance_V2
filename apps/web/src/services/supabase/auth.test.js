import { describe, expect, it } from 'vitest';
import { safeNext } from './auth.js';
import { oauthErrorMessage, toUserError } from './errors.js';

describe('auth e errori', () => {
  it('accetta solo percorsi interni', () => {
    expect(safeNext('/editor')).toBe('/editor');
    expect(safeNext('/progetti/abc?x=1')).toBe('/progetti/abc?x=1');
    expect(safeNext('https://evil.example')).toBe('/progetti');
    expect(safeNext('//evil.example')).toBe('/progetti');
    expect(safeNext('/\\evil')).toBe('/progetti');
    expect(safeNext(null)).toBe('/progetti');
  });

  it('traduce gli errori senza esporre il dettaglio tecnico', () => {
    expect(oauthErrorMessage('access_denied')).toBe('Accesso annullato.');
    expect(oauthErrorMessage('server_error')).toBe('Accesso non riuscito. Riprova.');
    const offline = toUserError({ message: 'Failed to fetch' });
    expect(offline.code).toBe('offline');
    expect(offline.message).not.toContain('fetch');
    const missing = toUserError({ code: 'not_found', message: 'relation projects does not exist' });
    expect(missing.message).toBe('Progetto non trovato.');
    expect(missing.message).not.toContain('relation');
  });
});

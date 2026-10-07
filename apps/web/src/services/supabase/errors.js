import logger from '@/utils/logger.js';

const MESSAGES = {
  not_configured: 'Il salvataggio nel tuo account non è ancora disponibile.',
  offline: 'Connessione assente. Il lavoro resta in questo browser.',
  session: 'Sessione scaduta. Accedi di nuovo.',
  not_found: 'Progetto non trovato.',
  conflict: 'Questo progetto è stato modificato da un altro dispositivo.',
  too_new: 'Questo progetto è stato salvato con una versione più recente. Aggiorna la pagina.',
  storage: 'Il progetto è salvato, ma il DXF originale non è stato caricato.',
  oauth_denied: 'Accesso annullato.',
  oauth: 'Accesso non riuscito. Riprova.',
  delete: 'Eliminazione non riuscita. Riprova.',
  validation: 'Alcuni dati del progetto non sono validi.',
  generic: 'Operazione non riuscita. Riprova.',
};

export function userMessage(code) {
  return MESSAGES[code] || MESSAGES.generic;
}

export function oauthErrorMessage(code) {
  if (code === 'access_denied') return MESSAGES.oauth_denied;
  return MESSAGES.oauth;
}

function classify(error) {
  if (!error) return 'generic';
  if (MESSAGES[error.code] && error.code !== 'generic') return error.code;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  const message = String(error.message || '');
  const status = error.status || error.statusCode;
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Load failed') ||
    error.name === 'AuthRetryableFetchError'
  ) {
    return 'offline';
  }
  if (status === 401 || error.code === 'PGRST301' || /jwt/i.test(message)) return 'session';
  if (error.code === '23514') return 'validation';
  if (error.code === '42501' || error.code === 'PGRST116') return 'not_found';
  if (/owner is immutable|id is immutable|profile id is immutable/i.test(message))
    return 'not_found';
  return 'generic';
}

export function toUserError(error) {
  const code = classify(error);
  if (code !== 'offline' && code !== 'not_found' && code !== 'oauth_denied') {
    logger.error(error);
  }
  return { code, message: userMessage(code) };
}

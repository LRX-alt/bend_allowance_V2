export const SUPPORTED_SCHEMA = { part: 1, profile: 1 };

const MIGRATIONS = {
  part: {},
  profile: {},
};

export function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortValue(value[key]);
    return out;
  }
  return value;
}

export function migrate(
  kind,
  schemaVersion,
  data,
  registry = MIGRATIONS,
  supported = SUPPORTED_SCHEMA[kind]
) {
  if (!supported || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    const error = new Error('Versione non valida');
    error.code = 'validation';
    throw error;
  }
  if (schemaVersion > supported) return { status: 'too-new', data, schemaVersion };
  let current = data;
  let version = schemaVersion;
  while (version < supported) {
    const step = registry[kind]?.[version];
    if (typeof step !== 'function') {
      const error = new Error('Migrazione assente');
      error.code = 'validation';
      throw error;
    }
    current = step(current);
    version += 1;
  }
  return { status: 'ok', data: current, schemaVersion: version };
}

export function clampName(value, fallback) {
  const trimmed = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
  return (trimmed || fallback).slice(0, 120);
}

export function formatSavedAt(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function formatUpdatedAt(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusLabel({ status, savedAt, detail }) {
  if (status === 'loading') return 'Caricamento...';
  if (status === 'saving') return 'Salvataggio...';
  if (status === 'saved') return savedAt ? `Salvato · ${formatSavedAt(savedAt)}` : 'Salvato';
  if (status === 'offline') return 'Connessione assente';
  if (status === 'error') return detail || 'Salvataggio non riuscito. Riprova.';
  if (status === 'conflict') return 'Questo progetto è stato modificato da un altro dispositivo.';
  if (status === 'unsaved') return 'Modifiche non salvate';
  if (status === 'new') return 'Non salvato';
  return '';
}

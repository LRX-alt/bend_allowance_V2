const KEY = 'bendingProjects';

export function readProjects(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeProjects(projects, storage = globalThis.localStorage) {
  storage.setItem(KEY, JSON.stringify(projects));
}

export function decodeShare(encoded) {
  const data = JSON.parse(atob(encoded));
  if (!data || data.v !== 1) return null;
  return {
    spessore: data.t ?? 2,
    raggioPiega: data.r ?? 1,
    fattoreK: data.k ?? 0.33,
    metodoDiCalcolo: data.m ?? 'standard',
    segments: Array.isArray(data.s) ? data.s.map(row => ({ length: row[0] || 0, angle: row[1] || 0 })) : [],
    modo: 'profilo',
  };
}

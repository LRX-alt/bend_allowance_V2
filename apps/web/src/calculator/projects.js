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

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function toolFromRecord(record = {}) {
  return {
    processo: record.processo || 'airBend',
    cavaScelta: record.cavaScelta || 'consigliata',
    cavaCustom: finiteOrNull(record.cavaCustom) ?? 16,
    raggioPunzone: finiteOrNull(record.raggioPunzone),
    raggioOrigine: record.raggioOrigine || 'manual',
    raggioMisurato: finiteOrNull(record.raggioMisurato),
    raggioTarget: finiteOrNull(record.raggioTarget),
  };
}

export function decodeShare(encoded) {
  const data = JSON.parse(atob(encoded));
  if (!data || (data.v !== 1 && data.v !== 2 && data.v !== 3)) return null;
  const base = {
    spessore: data.t ?? 2,
    raggioPiega: data.r ?? 1,
    fattoreK: data.k ?? 0.33,
    metodoDiCalcolo: data.m ?? 'standard',
    segments: Array.isArray(data.s)
      ? data.s.map(row => ({ length: row[0] || 0, angle: row[1] || 0 }))
      : [],
    modo: data.modo === 'esterne' ? 'esterne' : 'profilo',
    materialId: typeof data.mat === 'string' ? data.mat : '',
    latoA: data.la,
    latoB: data.lb,
    angolo: data.an,
  };
  if (data.v !== 3) {
    return {
      ...base,
      processo: 'airBend',
      raggioOrigine: 'manual',
    };
  }
  return {
    ...base,
    ...toolFromRecord(data),
  };
}

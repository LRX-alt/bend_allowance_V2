import { materialsDatabase } from '@sviluppolamiera/bend-core';
import { clampName, stableStringify } from './envelope.js';

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function profileFromCalculator(state = {}) {
  const segments = Array.isArray(state.segments)
    ? state.segments.map(segment => ({
        length: Number(segment.length) || 0,
        angle: Number(segment.angle) || 0,
      }))
    : [];
  return {
    spessore: finite(state.spessore) ?? 2,
    raggioPiega: finite(state.raggioPiega) ?? 1,
    fattoreK: finite(state.fattoreK) ?? 0.33,
    materialeSelezionato:
      typeof state.materialeSelezionato === 'string' ? state.materialeSelezionato : '',
    metodoDiCalcolo: 'standard',
    segments,
    modo: state.modo === 'esterne' ? 'esterne' : 'profilo',
    angolo: finite(state.angolo) ?? 90,
    latoA: finite(state.latoA) ?? 50,
    latoB: finite(state.latoB) ?? 50,
    larghezza: finite(state.larghezza) ?? 100,
    processo: state.processo || 'airBend',
    cavaScelta: state.cavaScelta || 'consigliata',
    cavaCustom: finite(state.cavaCustom) ?? 16,
    raggioPunzone: finite(state.raggioPunzone),
    raggioOrigine: state.raggioOrigine || 'manual',
    raggioMisurato: finite(state.raggioMisurato),
    raggioTarget: finite(state.raggioTarget),
  };
}

export function profileFromLocal(record = {}) {
  return profileFromCalculator({
    spessore: record.spessore,
    raggioPiega: record.raggioPiega,
    fattoreK: record.fattoreK,
    materialeSelezionato: record.materialeSelezionato,
    segments: record.segments,
    modo: record.modo,
    angolo: record.angolo,
    latoA: record.latoA,
    latoB: record.latoB,
    larghezza: record.larghezza,
    processo: record.processo,
    cavaScelta: record.cavaScelta,
    cavaCustom: record.cavaCustom,
    raggioPunzone: record.raggioPunzone,
    raggioOrigine: record.raggioOrigine,
    raggioMisurato: record.raggioMisurato,
    raggioTarget: record.raggioTarget,
  });
}

export function bendCount(profile) {
  if (profile.modo === 'esterne') return Math.abs(Number(profile.angolo) || 0) > 0 ? 1 : 0;
  return (profile.segments || []).filter(
    (segment, index) => index > 0 && Math.abs(Number(segment.angle) || 0) > 0
  ).length;
}

export function assertProfileShape(profile) {
  if (!profile || typeof profile !== 'object' || !Array.isArray(profile.segments)) {
    const error = new Error('Profilo non valido');
    error.code = 'validation';
    throw error;
  }
  return profileFromCalculator(profile);
}

export function profileEnvelope(profile) {
  return { profile: assertProfileShape(profile) };
}

export function profileRow(profile, name) {
  const normalized = assertProfileShape(profile);
  return {
    kind: 'profile',
    name: clampName(name, 'Profilo'),
    description: null,
    schema_version: 1,
    data: { profile: normalized },
    units: 'mm',
    material_id: normalized.materialeSelezionato || null,
    thickness: normalized.spessore,
    width: normalized.larghezza,
    height: null,
    bend_count: bendCount(normalized),
    part_status: null,
    source_file_name: null,
  };
}

export function profileFingerprint(profile) {
  return stableStringify(assertProfileShape(profile));
}

export function materialLabel(id) {
  if (!id) return '—';
  const found = materialsDatabase.find(item => item.id === id);
  return found?.name || id;
}

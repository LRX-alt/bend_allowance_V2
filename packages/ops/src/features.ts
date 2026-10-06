import { regenerateFeatureLoop, validatePart, type Feature, type Part } from '@sviluppolamiera/part-model';
import { finding, type Finding } from '@sviluppolamiera/part-model';
import type { OpResult } from './stretch';

function blocked(part: Part): Finding | null {
  if (!part.provenance.unitsConfirmedByUser) return finding('error', 'OPS-011', 'Unita non confermate, modifica non consentita');
  if (validatePart(part).status === 'invalid') return finding('error', 'OPS-010', 'Il pezzo non e valido');
  return null;
}

function replaceFeature(part: Part, feature: Feature): OpResult {
  const previous = part.inner.find(loop => loop.id === feature.loopId);
  const loop = regenerateFeatureLoop(feature, previous);
  const next: Part = {
    ...part,
    features: part.features.map(item => (item.id === feature.id ? feature : item)),
    inner: part.inner.map(item => (item.id === feature.loopId ? { ...loop, id: feature.loopId } : item)),
  };
  if (validatePart(next).status === 'invalid') {
    return { ok: false, blocking: [finding('error', 'OPS-010', 'La modifica produce un pezzo non valido')], warnings: [] };
  }
  return { ok: true, part: next, blocking: [], warnings: [] };
}

export function editFeature(part: Part, id: string, patch: Partial<Feature>): OpResult {
  const gate = blocked(part);
  if (gate) return { ok: false, blocking: [gate], warnings: [] };
  const current = part.features.find(feature => feature.id === id);
  if (!current) return { ok: false, blocking: [finding('error', 'FEA-003', 'Lavorazione assente')], warnings: [] };
  if (current.locked) return { ok: false, blocking: [finding('error', 'OPS-010', 'Elemento bloccato')], warnings: [] };
  const next = { ...current, ...patch, id: current.id, kind: current.kind, loopId: current.loopId } as Feature;
  return replaceFeature(part, next);
}

export function translateGroup(part: Part, groupId: string, dx: number, dy: number): OpResult {
  const gate = blocked(part);
  if (gate) return { ok: false, blocking: [gate], warnings: [] };
  let next = part;
  for (const feature of part.features.filter(item => item.groupId === groupId)) {
    const moved = shift(feature, dx, dy);
    const result = replaceFeature(next, moved);
    if (!result.ok || !result.part) return result;
    next = result.part;
  }
  return { ok: true, part: next, blocking: [], warnings: [] };
}

function shift(feature: Feature, dx: number, dy: number): Feature {
  if (feature.kind === 'hole' || feature.kind === 'rect') {
    return { ...feature, center: { x: feature.center.x + dx, y: feature.center.y + dy } };
  }
  if (feature.kind === 'slot') {
    return {
      ...feature,
      p0: { x: feature.p0.x + dx, y: feature.p0.y + dy },
      p1: { x: feature.p1.x + dx, y: feature.p1.y + dy },
    };
  }
  return { ...feature, centroid: { x: feature.centroid.x + dx, y: feature.centroid.y + dy } };
}

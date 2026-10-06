import { calcolaPiega, materialsDatabase, risolviFattoreK } from '@sviluppolamiera/bend-core';

export function partBox(part) {
  const box = part?.outer?.bbox;
  if (!box) return null;
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height, box };
}

export function materialRecord(part) {
  const id = part?.material?.dbId;
  if (!id) return null;
  return materialsDatabase.find(item => item.id === id) ?? null;
}

export function kFactorOf(part) {
  const override = part?.material?.kFactorOverride;
  const dbId = part?.material?.dbId;
  const hasOverride = typeof override === 'number' && Number.isFinite(override) && override > 0;
  if (!hasOverride && !dbId) return null;
  return risolviFattoreK({
    fattoreK: hasOverride ? override : undefined,
    materialKey: dbId,
  });
}

export function bendLength(bend) {
  if (!bend) return null;
  const length = Math.hypot(bend.b.x - bend.a.x, bend.b.y - bend.a.y);
  return Number.isFinite(length) ? length : null;
}

export function bendCalculation(part, bend) {
  const k = kFactorOf(part);
  if (!part?.thickness || !bend?.angleDeg || bend.innerRadius == null || k == null) return null;
  return calcolaPiega({
    angolo: bend.angleDeg,
    T: part.thickness,
    R: bend.innerRadius,
    K: k,
    metodo: part.bendSetup?.method || 'standard',
  });
}

export function featureCounts(part) {
  const features = part?.features ?? [];
  return {
    bends: part?.bendLines?.length ?? 0,
    holes: features.filter(item => item.kind === 'hole').length,
    slots: features.filter(item => item.kind === 'slot').length,
    cuts: features.filter(item => item.kind !== 'hole' && item.kind !== 'slot').length,
    openPaths: part?.openPaths?.length ?? 0,
    annotations: part?.annotations?.length ?? 0,
  };
}

export function directionLabel(direction) {
  if (direction === 'up') return 'Positiva';
  if (direction === 'down') return 'Negativa';
  return 'Non indicata';
}

export function bendStatus(bend) {
  if (!bend?.angleDeg || !bend?.direction) return 'Incompleta';
  return 'Completa';
}

export function findingFocus(item) {
  if (item?.code === 'BND-006') return { id: 'thickness', label: 'Indica lo spessore' };
  if (item?.code === 'BND-007') return { id: 'material', label: 'Indica il materiale' };
  if (item?.code === 'UNI-001' || item?.code === 'UNI-002' || item?.code === 'EXP-002') {
    return { id: 'units', label: 'Conferma le unità' };
  }
  return null;
}

export function mergeFindings(imported, decided) {
  const seen = new Set();
  const merged = [];
  for (const item of [...(imported || []), ...(decided || [])]) {
    const key = `${item.code}|${item.severity}|${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

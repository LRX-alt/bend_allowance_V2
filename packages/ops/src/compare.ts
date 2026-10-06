import { curveLength, dist, type Curve } from '@sviluppolamiera/geom2d';
import type { Feature, Part } from '@sviluppolamiera/part-model';

export type EntityChange = 'invariato' | 'traslato' | 'stirato' | 'aggiunto' | 'rimosso';

export interface CompareReport {
  entities: { id: string; state: EntityChange }[];
  widthBefore: number;
  widthAfter: number;
  heightBefore: number;
  heightAfter: number;
  holesBefore: number;
  holesAfter: number;
  diametersUnchanged: boolean;
  pitchesUnchanged: boolean;
  moved: { id: string; dx: number; dy: number }[];
  edgeDistanceChanged: string[];
}

function curvesOf(part: Part): Curve[] {
  return [...part.outer.curves, ...part.inner.flatMap(loop => loop.curves), ...part.bendLines.map(bend => ({ id: bend.id, kind: 'line' as const, a: bend.a, b: bend.b }))];
}

function sameGeometry(a: Curve, b: Curve, tol: number): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'line' && b.kind === 'line') return dist(a.a, b.a) <= tol && dist(a.b, b.b) <= tol;
  if (a.kind === 'arc' && b.kind === 'arc') {
    return dist(a.c, b.c) <= tol && Math.abs(a.r - b.r) <= tol && Math.abs(a.a0 - b.a0) <= 1e-6 && Math.abs(a.a1 - b.a1) <= 1e-6;
  }
  return false;
}

function isTranslation(a: Curve, b: Curve, tol: number): boolean {
  if (a.kind !== b.kind) return false;
  if (Math.abs(curveLength(a) - curveLength(b)) > tol) return false;
  if (a.kind === 'line' && b.kind === 'line') {
    const dx = b.a.x - a.a.x;
    const dy = b.a.y - a.a.y;
    return dist({ x: a.b.x + dx, y: a.b.y + dy }, b.b) <= tol && (Math.abs(dx) > tol || Math.abs(dy) > tol);
  }
  if (a.kind === 'arc' && b.kind === 'arc') {
    return Math.abs(a.r - b.r) <= tol && (Math.abs(a.c.x - b.c.x) > tol || Math.abs(a.c.y - b.c.y) > tol);
  }
  return false;
}

function refPoint(feature: Feature): { x: number; y: number } {
  if (feature.kind === 'hole' || feature.kind === 'rect') return feature.center;
  if (feature.kind === 'slot') return { x: (feature.p0.x + feature.p1.x) / 2, y: (feature.p0.y + feature.p1.y) / 2 };
  return feature.centroid;
}

function pitches(part: Part): number[] {
  const byGroup = new Map<string, Feature[]>();
  for (const feature of part.features) {
    if (!feature.groupId) continue;
    const list = byGroup.get(feature.groupId) ?? [];
    list.push(feature);
    byGroup.set(feature.groupId, list);
  }
  const values: number[] = [];
  for (const members of byGroup.values()) {
    const ordered = [...members].sort((a, b) => refPoint(a).x - refPoint(b).x);
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1];
      const cur = ordered[i];
      if (!prev || !cur) continue;
      values.push(refPoint(cur).x - refPoint(prev).x);
    }
  }
  return values;
}

export function compareParts(before: Part, after: Part): CompareReport {
  const tol = before.tolerances.point;
  const beforeCurves = new Map(curvesOf(before).map(curve => [curve.id, curve]));
  const afterCurves = new Map(curvesOf(after).map(curve => [curve.id, curve]));
  const entities: { id: string; state: EntityChange }[] = [];
  for (const [id, curve] of beforeCurves) {
    const next = afterCurves.get(id);
    if (!next) entities.push({ id, state: 'rimosso' });
    else if (sameGeometry(curve, next, tol)) entities.push({ id, state: 'invariato' });
    else if (isTranslation(curve, next, tol)) entities.push({ id, state: 'traslato' });
    else entities.push({ id, state: 'stirato' });
  }
  for (const id of afterCurves.keys()) {
    if (!beforeCurves.has(id)) entities.push({ id, state: 'aggiunto' });
  }
  const beforeHoles = before.features.filter(feature => feature.kind === 'hole');
  const afterHoles = after.features.filter(feature => feature.kind === 'hole');
  const afterById = new Map(after.features.map(feature => [feature.id, feature]));
  const diametersUnchanged = beforeHoles.every(hole => {
    const next = afterById.get(hole.id);
    return next && next.kind === 'hole' && next.diameter === hole.diameter;
  });
  const beforePitch = pitches(before);
  const afterPitch = pitches(after);
  const pitchesUnchanged = beforePitch.length === afterPitch.length && beforePitch.every((value, i) => Math.abs(value - (afterPitch[i] ?? value)) <= tol);
  const moved = before.features.flatMap(feature => {
    const next = afterById.get(feature.id);
    if (!next) return [];
    const a = refPoint(feature);
    const b = refPoint(next);
    if (dist(a, b) <= tol) return [];
    return [{ id: feature.id, dx: b.x - a.x, dy: b.y - a.y }];
  });
  return {
    entities,
    widthBefore: before.outer.bbox.maxX - before.outer.bbox.minX,
    widthAfter: after.outer.bbox.maxX - after.outer.bbox.minX,
    heightBefore: before.outer.bbox.maxY - before.outer.bbox.minY,
    heightAfter: after.outer.bbox.maxY - after.outer.bbox.minY,
    holesBefore: beforeHoles.length,
    holesAfter: afterHoles.length,
    diametersUnchanged,
    pitchesUnchanged,
    moved,
    edgeDistanceChanged: moved.map(item => item.id),
  };
}

import {
  curveBbox,
  curveEnd,
  curveStart,
  dist,
  intersect,
  loopSelfIntersects,
  pointInLoop,
  signedArea,
  unionBbox,
  type Curve,
  type Loop,
} from '@sviluppolamiera/geom2d';
import {
  finding,
  regenerateFeatureLoop,
  translateFeature,
  translateLoop,
  validatePart,
  type AnchorRef,
  type Feature,
  type Finding,
  type Part,
} from '@sviluppolamiera/part-model';
import { computeBendZones } from './bend-adapter';

export type StretchMode = 'leftFixed' | 'rightFixed' | 'symmetric' | 'manualZones';

export type AnchorPolicy =
  | { kind: 'followMinEdge' }
  | { kind: 'followMaxEdge' }
  | { kind: 'keepAbsolute' }
  | { kind: 'perFeature'; assignments: Record<string, AnchorRef> };

export interface StretchParams {
  axis: 'x' | 'y';
  delta: number;
  mode: StretchMode;
  cuts?: number[];
  zoneOffsets?: number[];
  anchorPolicy?: AnchorPolicy;
  confirmWarnings?: boolean;
}

export interface OpResult {
  ok: boolean;
  part?: Part;
  blocking: Finding[];
  warnings: Finding[];
  summary?: {
    movedFeatureIds: string[];
    unchangedFeatureIds: string[];
    stretchedCurveIds: string[];
    bboxBefore: Part['outer']['bbox'];
    bboxAfter: Part['outer']['bbox'];
  };
}

function coord(p: { x: number; y: number }, axis: 'x' | 'y'): number {
  return axis === 'x' ? p.x : p.y;
}

function zoneIndex(value: number, cuts: number[], tol: number): number {
  let zone = 0;
  for (const cut of cuts) {
    if (value > cut + tol) zone += 1;
    else break;
  }
  return zone;
}

export function deriveZones(part: Part, params: StretchParams): { cuts: number[]; offsets: number[] } {
  const box = part.outer.bbox;
  const min = params.axis === 'x' ? box.minX : box.minY;
  const max = params.axis === 'x' ? box.maxX : box.maxY;
  const cut = params.cuts?.[0] ?? defaultCut(part, params.axis);
  if (params.mode === 'manualZones') {
    return { cuts: [...(params.cuts ?? [])].sort((a, b) => a - b), offsets: [...(params.zoneOffsets ?? [])] };
  }
  if (params.mode === 'symmetric') {
    const span = (max - min) / 3;
    return {
      cuts: params.cuts && params.cuts.length >= 2 ? [...params.cuts].sort((a, b) => a - b) : [min + span, min + 2 * span],
      offsets: [-params.delta / 2, 0, params.delta / 2],
    };
  }
  if (params.mode === 'rightFixed') return { cuts: [cut], offsets: [-params.delta, 0] };
  return { cuts: [cut], offsets: [0, params.delta] };
}

function defaultCut(part: Part, axis: 'x' | 'y'): number {
  const box = part.outer.bbox;
  const min = axis === 'x' ? box.minX : box.minY;
  const max = axis === 'x' ? box.maxX : box.maxY;
  const mid = (min + max) / 2;
  const bands = suggestCutBands(part, axis);
  const containing = bands.find(band => mid >= band.min && mid <= band.max);
  if (containing) return (containing.min + containing.max) / 2;
  const nearest = [...bands].sort((a, b) => Math.abs((a.min + a.max) / 2 - mid) - Math.abs((b.min + b.max) / 2 - mid))[0];
  if (nearest) return (nearest.min + nearest.max) / 2;
  return mid;
}

function mapValue(value: number, cuts: number[], offsets: number[], tol: number): number {
  const zone = zoneIndex(value, cuts, tol);
  return value + (offsets[zone] ?? 0);
}

function mapPoint(p: { x: number; y: number }, axis: 'x' | 'y', cuts: number[], offsets: number[], tol: number) {
  if (axis === 'x') return { x: mapValue(p.x, cuts, offsets, tol), y: p.y };
  return { x: p.x, y: mapValue(p.y, cuts, offsets, tol) };
}

function spanCrosses(min: number, max: number, cut: number, tol: number): boolean {
  return min < cut - tol && max > cut + tol;
}

function featureSpan(feature: Feature, axis: 'x' | 'y', loop: Loop | undefined): { min: number; max: number } {
  if (loop && loop.curves.length) {
    const box = loop.bbox;
    return axis === 'x' ? { min: box.minX, max: box.maxX } : { min: box.minY, max: box.maxY };
  }
  if (feature.kind === 'hole') {
    const r = feature.diameter / 2;
    const c = coord(feature.center, axis);
    return { min: c - r, max: c + r };
  }
  if (feature.kind === 'slot') {
    const r = feature.width / 2;
    const a = coord(feature.p0, axis);
    const b = coord(feature.p1, axis);
    return { min: Math.min(a, b) - r, max: Math.max(a, b) + r };
  }
  if (feature.kind === 'rect') {
    const c = coord(feature.center, axis);
    const half = axis === 'x' ? feature.w / 2 : feature.h / 2;
    return { min: c - half, max: c + half };
  }
  const c = coord(feature.centroid, axis);
  return { min: c, max: c };
}

function edgeOffset(which: 'min' | 'max', axis: 'x' | 'y', box: Part['outer']['bbox'], cuts: number[], offsets: number[], tol: number): number {
  const value = axis === 'x' ? (which === 'min' ? box.minX : box.maxX) : which === 'min' ? box.minY : box.maxY;
  const zone = zoneIndex(value, cuts, tol);
  return offsets[zone] ?? 0;
}

function policyOffset(
  feature: Feature,
  axis: 'x' | 'y',
  policy: AnchorPolicy | undefined,
  part: Part,
  cuts: number[],
  offsets: number[]
): number | 'unset' {
  if (feature.locked) return 0;
  const declared = feature.anchor[axis];
  const tol = part.tolerances.point;
  const box = part.outer.bbox;
  const ref =
    declared !== 'unset'
      ? declared
      : feature.groupId
        ? 'group'
        : policy?.kind === 'perFeature'
          ? policy.assignments[feature.id]
          : policy?.kind === 'followMinEdge'
            ? axis === 'x'
              ? 'minX'
              : 'minY'
            : policy?.kind === 'followMaxEdge'
              ? axis === 'x'
                ? 'maxX'
                : 'maxY'
              : policy?.kind === 'keepAbsolute'
                ? 'absolute'
                : 'unset';
  if (ref === 'unset' || ref === undefined) return 'unset';
  if (ref === 'absolute') return 0;
  if (ref === 'minX' || ref === 'minY') return edgeOffset('min', axis, box, cuts, offsets, tol);
  if (ref === 'maxX' || ref === 'maxY') return edgeOffset('max', axis, box, cuts, offsets, tol);
  if (ref === 'group' && feature.groupId) {
    const members = part.features.filter(f => f.groupId === feature.groupId);
    const sample = members[0] ?? feature;
    const loop = part.inner.find(l => l.id === sample.loopId);
    const span = featureSpan(sample, axis, loop);
    const mid = (span.min + span.max) / 2;
    return offsets[zoneIndex(mid, cuts, tol)] ?? 0;
  }
  return 0;
}

function arcCrosses(curve: Curve, axis: 'x' | 'y', cut: number, tol: number): boolean {
  if (curve.kind !== 'arc') return false;
  const box = curveBbox(curve);
  const min = axis === 'x' ? box.minX : box.minY;
  const max = axis === 'x' ? box.maxX : box.maxY;
  return spanCrosses(min, max, cut, tol);
}

export function suggestCutBands(part: Part, axis: 'x' | 'y'): Array<{ min: number; max: number }> {
  const box = part.outer.bbox;
  const min = axis === 'x' ? box.minX : box.minY;
  const max = axis === 'x' ? box.maxX : box.maxY;
  const blocked: Array<{ min: number; max: number }> = [];
  const margin = part.thickness ? 2 * part.thickness : (max - min) * 0.05;
  for (const curve of part.outer.curves) {
    if (curve.kind === 'line') {
      const a = coord(curve.a, axis);
      const b = coord(curve.b, axis);
      if (Math.abs(a - b) <= part.tolerances.point) {
        const p = (a + b) / 2;
        blocked.push({ min: p - part.tolerances.point, max: p + part.tolerances.point });
      }
    }
    if (curve.kind !== 'arc') continue;
    const b = curveBbox(curve);
    blocked.push(axis === 'x' ? { min: b.minX, max: b.maxX } : { min: b.minY, max: b.maxY });
  }
  for (const loop of part.inner) {
    const b = loop.bbox;
    const a = axis === 'x' ? b.minX : b.minY;
    const c = axis === 'x' ? b.maxX : b.maxY;
    blocked.push({ min: a - margin, max: c + margin });
  }
  for (const bend of part.bendLines) {
    if (bend.zoneHalfWidth === undefined) continue;
    const pos = coord(bend.a, axis);
    blocked.push({ min: pos - bend.zoneHalfWidth - margin, max: pos + bend.zoneHalfWidth + margin });
  }
  blocked.sort((a, b) => a.min - b.min);
  const bands: Array<{ min: number; max: number }> = [];
  let cursor = min;
  for (const block of blocked) {
    if (block.min > cursor) bands.push({ min: cursor, max: Math.min(block.min, max) });
    cursor = Math.max(cursor, block.max);
  }
  if (cursor < max) bands.push({ min: cursor, max });
  return bands.filter(b => b.max - b.min > part.tolerances.point);
}

function fail(blocking: Finding[], warnings: Finding[] = []): OpResult {
  return { ok: false, blocking, warnings };
}

export function zoneOf(value: number, cuts: number[], tol: number): number {
  return zoneIndex(value, cuts, tol);
}

export function stretchAlongAxis(part: Part, params: StretchParams): OpResult {
  const blocking: Finding[] = [];
  const warnings: Finding[] = [];
  if (!part.provenance.unitsConfirmedByUser) {
    return fail([finding('error', 'OPS-011', 'Unita non confermate, modifica non consentita')]);
  }
  if (part.provenance.unsupportedCurvesDecision === 'rejected' || (part.provenance.hadUnsupportedCurves && !part.provenance.unsupportedCurvesDecision)) {
    return fail([finding('error', 'OPS-012', 'Geometria non gestibile, modifica non consentita')]);
  }
  if (validatePart(part).status === 'invalid') {
    return fail([finding('error', 'OPS-010', 'Il pezzo non e valido')]);
  }
  const unset = part.features.filter(f => !f.locked && !f.groupId && f.anchor[params.axis] === 'unset' && !params.anchorPolicy);
  if (unset.length) {
    return fail([finding('error', 'OPS-008', 'Ancoraggio non dichiarato: scegli cosa fare dei fori', { geometryRefs: unset.map(f => f.id) })]);
  }

  const source = withBendZones(part);
  const { cuts, offsets } = deriveZones(source, params);
  if (params.mode === 'manualZones' && offsets.length !== cuts.length + 1) {
    return fail([finding('error', 'OPS-007', 'Gli offset non corrispondono alle zone')]);
  }
  const tol = source.tolerances.point;

  for (const cut of cuts) {
    for (const curve of source.outer.curves) {
      if (arcCrosses(curve, params.axis, cut, tol)) {
        blocking.push(finding('error', 'OPS-001', 'Il taglio attraversa un arco', { geometryRefs: [curve.id] }));
      }
      if (curve.kind === 'line') {
        const a = coord(curve.a, params.axis);
        const b = coord(curve.b, params.axis);
        const otherA = params.axis === 'x' ? curve.a.y : curve.a.x;
        const otherB = params.axis === 'x' ? curve.b.y : curve.b.x;
        const crosses = spanCrosses(Math.min(a, b), Math.max(a, b), cut, tol);
        const parallel = Math.abs(a - b) <= tol && Math.abs(otherA - otherB) > tol;
        if (crosses && !parallel) {
          const dx = curve.b.x - curve.a.x;
          const dy = curve.b.y - curve.a.y;
          const horizontal = params.axis === 'x' ? Math.abs(dy) <= tol : Math.abs(dx) <= tol;
          if (!horizontal) warnings.push(finding('warning', 'OPS-009', 'Questa modifica cambia l angolo di un lato inclinato', { geometryRefs: [curve.id] }));
        }
      }
    }
    for (const feature of source.features) {
      const loop = source.inner.find(l => l.id === feature.loopId);
      const span = featureSpan(feature, params.axis, loop);
      if (spanCrosses(span.min, span.max, cut, tol)) {
        blocking.push(finding('error', 'OPS-002', 'Il taglio attraversa una lavorazione', { geometryRefs: [feature.id] }));
      }
    }
    for (const bend of source.bendLines) {
      const pos = (coord(bend.a, params.axis) + coord(bend.b, params.axis)) / 2;
      if (bend.zoneHalfWidth !== undefined && Math.abs(pos - cut) < bend.zoneHalfWidth) {
        blocking.push(finding('error', 'OPS-003', 'Il taglio cade dentro una zona di piega', { geometryRefs: [bend.id] }));
      }
      const bendZone = zoneIndex(pos, cuts, tol);
      if ((offsets[bendZone] ?? 0) !== 0) {
        warnings.push(finding('warning', 'OPS-004', 'La modifica sposta una linea di piega', { geometryRefs: [bend.id] }));
      }
    }
  }

  if (blocking.length) return fail(blocking, warnings);
  const preWarnings = warnings.filter(w => w.code === 'OPS-004' || w.code === 'OPS-009');
  if (preWarnings.length && !params.confirmWarnings) return fail([], preWarnings);

  const stretchedIds: string[] = [];
  const mapLoop = (loop: Loop): Loop => ({
    ...loop,
    curves: loop.curves.map(curve => {
      const next = mapLineOrKeepArc(curve, params.axis, cuts, offsets, tol);
      if (curve.kind === 'line' && next.kind === 'line' && dist(curve.a, next.a) + dist(curve.b, next.b) > tol) stretchedIds.push(curve.id);
      return next;
    }),
  });

  let outer = refreshSigned(mapLoop(source.outer));
  const openPaths = source.openPaths.map(loop => refreshSigned(mapLoop(loop)));
  const bendLines = source.bendLines.map(bend => ({
    ...bend,
    a: mapPoint(bend.a, params.axis, cuts, offsets, tol),
    b: mapPoint(bend.b, params.axis, cuts, offsets, tol),
  }));

  const moved: string[] = [];
  const unchanged: string[] = [];
  const features: Feature[] = [];
  const inner: Loop[] = [];
  for (const feature of source.features) {
    const shift = policyOffset(feature, params.axis, params.anchorPolicy, source, cuts, offsets);
    if (shift === 'unset') {
      return fail([finding('error', 'OPS-008', 'Ancoraggio non dichiarato', { geometryRefs: [feature.id] })]);
    }
    const dx = params.axis === 'x' ? shift : 0;
    const dy = params.axis === 'y' ? shift : 0;
    const movedFeature = translateFeature(feature, dx, dy);
    const previous = source.inner.find(l => l.id === feature.loopId);
    const loop = feature.kind === 'generic' && previous ? translateLoop(previous, dx, dy) : regenerateFeatureLoop(movedFeature, previous);
    features.push(movedFeature);
    inner.push({ ...loop, id: feature.loopId });
    if (Math.abs(shift) > tol) moved.push(feature.id);
    else unchanged.push(feature.id);
  }

  const candidate: Part = { ...source, outer, inner, features, bendLines, openPaths };
  const refreshed = {
    ...candidate,
    outer: refreshSigned(candidate.outer),
    inner: candidate.inner.map(refreshSigned),
  };

  const size = params.axis === 'x' ? refreshed.outer.bbox.maxX - refreshed.outer.bbox.minX : refreshed.outer.bbox.maxY - refreshed.outer.bbox.minY;
  if (size <= tol) return fail([finding('error', 'OPS-013', 'La modifica collassa il pezzo')]);
  if (loopSelfIntersects(refreshed.outer, source.tolerances) || innersOverlap(refreshed)) {
    return fail([finding('error', 'OPS-010', 'La modifica produce un pezzo non valido')]);
  }
  for (const feature of refreshed.features) {
    const loop = refreshed.inner.find(l => l.id === feature.loopId);
    if (!loop) return fail([finding('error', 'OPS-005', 'Una lavorazione esce dal contorno', { geometryRefs: [feature.id] })]);
    const inside = loop.curves.every(curve => pointInLoop(curveStart(curve), refreshed.outer, source.tolerances) && pointInLoop(curveEnd(curve), refreshed.outer, source.tolerances));
    if (!inside) return fail([finding('error', 'OPS-005', 'Una lavorazione esce dal contorno', { geometryRefs: [feature.id] })]);
    if (typeof source.thickness === 'number') {
      const edge = distanceToOuter(feature, refreshed);
      if (edge < 2 * source.thickness) {
        warnings.push(finding('warning', 'FEA-004', 'Distanza lavorazione-bordo sotto due spessori', { geometryRefs: [feature.id] }));
        warnings.push(finding('warning', 'OPS-006', 'La distanza dal bordo e scesa sotto soglia', { geometryRefs: [feature.id] }));
      }
    }
  }
  if (validatePart(refreshed).status === 'invalid') {
    return fail([finding('error', 'OPS-010', 'La modifica produce un pezzo non valido')]);
  }

  return {
    ok: true,
    part: refreshed,
    blocking: [],
    warnings,
    summary: {
      movedFeatureIds: moved,
      unchangedFeatureIds: unchanged,
      stretchedCurveIds: stretchedIds,
      bboxBefore: source.outer.bbox,
      bboxAfter: refreshed.outer.bbox,
    },
  };
}

function mapLineOrKeepArc(curve: Curve, axis: 'x' | 'y', cuts: number[], offsets: number[], tol: number): Curve {
  if (curve.kind === 'arc') {
    const box = curveBbox(curve);
    const min = axis === 'x' ? box.minX : box.minY;
    const max = axis === 'x' ? box.maxX : box.maxY;
    const z0 = zoneIndex(min, cuts, tol);
    const z1 = zoneIndex(max, cuts, tol);
    const shift = offsets[z0] ?? 0;
    if (z0 === z1) {
      return axis === 'x'
        ? { ...curve, c: { x: curve.c.x + shift, y: curve.c.y } }
        : { ...curve, c: { x: curve.c.x, y: curve.c.y + shift } };
    }
    return curve;
  }
  return {
    ...curve,
    a: mapPoint(curve.a, axis, cuts, offsets, tol),
    b: mapPoint(curve.b, axis, cuts, offsets, tol),
  };
}

function refreshSigned(loop: Loop): Loop {
  return { ...loop, signedArea: signedArea(loop.curves), bbox: unionBbox(loop.curves.map(curveBbox)) };
}

function withBendZones(part: Part): Part {
  const pending = part.bendLines.some(
    bend => bend.zoneHalfWidth === undefined && bend.angleDeg !== undefined && bend.innerRadius !== undefined
  );
  if (!pending || part.thickness === undefined) return part;
  return { ...part, bendLines: computeBendZones(part).bendLines };
}

function innersOverlap(part: Part): boolean {
  const loops = part.inner;
  for (let i = 0; i < loops.length; i++) {
    for (let j = i + 1; j < loops.length; j++) {
      const a = loops[i];
      const b = loops[j];
      if (!a || !b) continue;
      if (a.bbox.maxX < b.bbox.minX || b.bbox.maxX < a.bbox.minX || a.bbox.maxY < b.bbox.minY || b.bbox.maxY < a.bbox.minY) continue;
      for (const ca of a.curves) {
        for (const cb of b.curves) {
          if (intersect(ca, cb, part.tolerances).length) return true;
        }
      }
    }
  }
  return false;
}

function distanceToOuter(feature: Feature, part: Part): number {
  const box = part.outer.bbox;
  if (feature.kind === 'hole') {
    const r = feature.diameter / 2;
    return Math.min(feature.center.x - r - box.minX, box.maxX - (feature.center.x + r), feature.center.y - r - box.minY, box.maxY - (feature.center.y + r));
  }
  return part.tolerances.point * 10;
}

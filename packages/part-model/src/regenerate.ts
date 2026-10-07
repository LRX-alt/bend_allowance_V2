import {
  curveBbox,
  reverseCurve,
  signedArea,
  translate,
  unionBbox,
  type Curve,
  type Loop,
} from '@sviluppolamiera/geom2d';
import { nextId } from './createPart';
import type { Feature } from './types';

/** I loop di lavorazione sono sempre interni: devono avere area con segno negativo. */
function finish(id: string, curves: Curve[]): Loop {
  const oriented = signedArea(curves) > 0 ? [...curves].reverse().map(reverseCurve) : curves;
  return {
    id,
    curves: oriented,
    closed: true,
    signedArea: signedArea(oriented),
    bbox: unionBbox(oriented.map(curveBbox)),
  };
}

function reuse(previous: Loop | undefined, count: number, kind: Curve['kind']): string[] {
  if (previous && previous.curves.length === count && previous.curves.every(c => c.kind === kind)) {
    return previous.curves.map(c => c.id);
  }
  return Array.from({ length: count }, () => nextId('cv'));
}

function holeCurves(feature: Extract<Feature, { kind: 'hole' }>, ids: string[]): Curve[] {
  const r = feature.diameter / 2;
  const c = feature.center;
  const a = ids[0] ?? nextId('cv');
  const b = ids[1] ?? nextId('cv');
  return [
    { id: a, kind: 'arc', c, r, a0: 0, a1: Math.PI, ccw: false },
    { id: b, kind: 'arc', c, r, a0: Math.PI, a1: 0, ccw: false },
  ];
}

export function regenerateFeatureLoop(feature: Feature, previous?: Loop): Loop {
  if (feature.kind === 'hole') {
    return finish(feature.loopId, holeCurves(feature, reuse(previous, 2, 'arc')));
  }
  if (feature.kind === 'slot') {
    return finish(feature.loopId, slotCurves(feature, previous));
  }
  if (feature.kind === 'rect') {
    return finish(feature.loopId, rectCurves(feature, previous));
  }
  if (previous) return finish(feature.loopId, previous.curves.map(c => ({ ...c })));
  return finish(feature.loopId, []);
}

function slotCurves(feature: Extract<Feature, { kind: 'slot' }>, previous?: Loop): Curve[] {
  const r = feature.width / 2;
  const dx = feature.p1.x - feature.p0.x;
  const dy = feature.p1.y - feature.p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * r;
  const ny = (dx / len) * r;
  const ang = Math.atan2(dy, dx);
  const ids = previous && previous.curves.length === 4 ? previous.curves.map(c => c.id) : [nextId('cv'), nextId('cv'), nextId('cv'), nextId('cv')];
  return [
    { id: ids[0] ?? nextId('cv'), kind: 'line', a: { x: feature.p0.x + nx, y: feature.p0.y + ny }, b: { x: feature.p1.x + nx, y: feature.p1.y + ny } },
    { id: ids[1] ?? nextId('cv'), kind: 'arc', c: feature.p1, r, a0: ang + Math.PI / 2, a1: ang - Math.PI / 2, ccw: false },
    { id: ids[2] ?? nextId('cv'), kind: 'line', a: { x: feature.p1.x - nx, y: feature.p1.y - ny }, b: { x: feature.p0.x - nx, y: feature.p0.y - ny } },
    { id: ids[3] ?? nextId('cv'), kind: 'arc', c: feature.p0, r, a0: ang - Math.PI / 2, a1: ang + Math.PI / 2, ccw: false },
  ];
}

function rectCurves(feature: Extract<Feature, { kind: 'rect' }>, previous?: Loop): Curve[] {
  const hw = feature.w / 2;
  const hh = feature.h / 2;
  const r = feature.cornerRadius;
  const local: Curve[] = r <= 0
    ? [
        { id: 'x', kind: 'line', a: { x: -hw, y: -hh }, b: { x: hw, y: -hh } },
        { id: 'x', kind: 'line', a: { x: hw, y: -hh }, b: { x: hw, y: hh } },
        { id: 'x', kind: 'line', a: { x: hw, y: hh }, b: { x: -hw, y: hh } },
        { id: 'x', kind: 'line', a: { x: -hw, y: hh }, b: { x: -hw, y: -hh } },
      ]
    : [
        { id: 'x', kind: 'line', a: { x: -hw + r, y: -hh }, b: { x: hw - r, y: -hh } },
        { id: 'x', kind: 'arc', c: { x: hw - r, y: -hh + r }, r, a0: -Math.PI / 2, a1: 0, ccw: true },
        { id: 'x', kind: 'line', a: { x: hw, y: -hh + r }, b: { x: hw, y: hh - r } },
        { id: 'x', kind: 'arc', c: { x: hw - r, y: hh - r }, r, a0: 0, a1: Math.PI / 2, ccw: true },
        { id: 'x', kind: 'line', a: { x: hw - r, y: hh }, b: { x: -hw + r, y: hh } },
        { id: 'x', kind: 'arc', c: { x: -hw + r, y: hh - r }, r, a0: Math.PI / 2, a1: Math.PI, ccw: true },
        { id: 'x', kind: 'line', a: { x: -hw, y: hh - r }, b: { x: -hw, y: -hh + r } },
        { id: 'x', kind: 'arc', c: { x: -hw + r, y: -hh + r }, r, a0: Math.PI, a1: Math.PI * 1.5, ccw: true },
      ];
  const ids = previous && previous.curves.length === local.length ? previous.curves.map(c => c.id) : local.map(() => nextId('cv'));
  const cos = Math.cos(feature.rotationRad);
  const sin = Math.sin(feature.rotationRad);
  const placed = local.map((curve, i) => {
    const id = ids[i] ?? nextId('cv');
    const map = (p: { x: number; y: number }) => ({
      x: feature.center.x + p.x * cos - p.y * sin,
      y: feature.center.y + p.x * sin + p.y * cos,
    });
    if (curve.kind === 'line') return { ...curve, id, a: map(curve.a), b: map(curve.b) };
    return { ...curve, id, c: map(curve.c), a0: curve.a0 + feature.rotationRad, a1: curve.a1 + feature.rotationRad };
  });
  return placed;
}

export function translateFeature(feature: Feature, dx: number, dy: number): Feature {
  if (feature.locked || (dx === 0 && dy === 0)) return feature;
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

export function translateLoop(loop: Loop, dx: number, dy: number): Loop {
  const curves = loop.curves.map(curve => translate(curve, dx, dy));
  return finish(loop.id, curves);
}

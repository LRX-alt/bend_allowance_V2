import { type Arc, type Bbox, type Curve, type Line, type Pt, NUMERIC_EPS } from './types';

export const TAU = Math.PI * 2;

export function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function samePoint(a: Pt, b: Pt, tol: number): boolean {
  return dist(a, b) <= tol;
}

export function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Ampiezza con segno: positiva se antioraria, nulla se gli angoli coincidono. */
export function arcSweep(arc: Arc): number {
  let d = arc.a1 - arc.a0;
  d = d % TAU;
  if (arc.ccw) {
    if (d < 0) d += TAU;
    if (Math.abs(d) < NUMERIC_EPS) return 0;
    return d;
  }
  if (d > 0) d -= TAU;
  if (Math.abs(d) < NUMERIC_EPS) return 0;
  return d;
}

export function pointOnArc(arc: Arc, t: number): Pt {
  const ang = arc.a0 + t * arcSweep(arc);
  return { x: arc.c.x + arc.r * Math.cos(ang), y: arc.c.y + arc.r * Math.sin(ang) };
}

export function curveStart(curve: Curve): Pt {
  return curve.kind === 'line' ? curve.a : pointOnArc(curve, 0);
}

export function curveEnd(curve: Curve): Pt {
  return curve.kind === 'line' ? curve.b : pointOnArc(curve, 1);
}

export function curveLength(curve: Curve): number {
  if (curve.kind === 'line') return dist(curve.a, curve.b);
  return Math.abs(curve.r * arcSweep(curve));
}

export function pointAt(curve: Curve, t: number): Pt {
  if (curve.kind === 'line') return lerp(curve.a, curve.b, t);
  return pointOnArc(curve, t);
}

export function tangentAt(curve: Curve, t: number): Pt {
  if (curve.kind === 'line') {
    const len = curveLength(curve);
    if (len <= NUMERIC_EPS) return { x: 1, y: 0 };
    return { x: (curve.b.x - curve.a.x) / len, y: (curve.b.y - curve.a.y) / len };
  }
  const ang = curve.a0 + t * arcSweep(curve);
  const sign = curve.ccw ? 1 : -1;
  return { x: -Math.sin(ang) * sign, y: Math.cos(ang) * sign };
}

function lineBbox(line: Line): Bbox {
  return {
    minX: Math.min(line.a.x, line.b.x),
    minY: Math.min(line.a.y, line.b.y),
    maxX: Math.max(line.a.x, line.b.x),
    maxY: Math.max(line.a.y, line.b.y),
  };
}

function angleInSweep(arc: Arc, ang: number): boolean {
  const sweep = arcSweep(arc);
  let d = ang - arc.a0;
  d = d % TAU;
  if (arc.ccw) {
    if (d < 0) d += TAU;
    return d >= -NUMERIC_EPS && d <= sweep + NUMERIC_EPS;
  }
  if (d > 0) d -= TAU;
  return d <= NUMERIC_EPS && d >= sweep - NUMERIC_EPS;
}

function arcBbox(arc: Arc): Bbox {
  const start = pointOnArc(arc, 0);
  const end = pointOnArc(arc, 1);
  let minX = Math.min(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let maxX = Math.max(start.x, end.x);
  let maxY = Math.max(start.y, end.y);
  const candidates = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, TAU, -Math.PI / 2];
  for (const ang of candidates) {
    if (!angleInSweep(arc, ang)) continue;
    const x = arc.c.x + arc.r * Math.cos(ang);
    const y = arc.c.y + arc.r * Math.sin(ang);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

export function curveBbox(curve: Curve): Bbox {
  return curve.kind === 'line' ? lineBbox(curve) : arcBbox(curve);
}

export function unionBbox(boxes: Bbox[]): Bbox {
  const first = boxes[0];
  if (!first) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = first.minX;
  let minY = first.minY;
  let maxX = first.maxX;
  let maxY = first.maxY;
  for (const b of boxes) {
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }
  return { minX, minY, maxX, maxY };
}

/** Contributo a ∫ x dy. Per un contorno chiuso la somma e' l'area firmata. */
export function curveSignedArea(curve: Curve): number {
  if (curve.kind === 'line') {
    return ((curve.b.y - curve.a.y) * (curve.a.x + curve.b.x)) / 2;
  }
  const sweep = arcSweep(curve);
  const t0 = curve.a0;
  const t1 = curve.a0 + sweep;
  const cx = curve.c.x;
  const r = curve.r;
  const integ = (th: number) => cx * r * Math.sin(th) + r * r * (th / 2 + Math.sin(2 * th) / 4);
  return integ(t1) - integ(t0);
}

export function signedArea(curves: Curve[]): number {
  let area = 0;
  for (const curve of curves) area += curveSignedArea(curve);
  return area;
}

export function reverseCurve(curve: Curve): Curve {
  if (curve.kind === 'line') return { ...curve, a: curve.b, b: curve.a };
  return { ...curve, a0: curve.a1, a1: curve.a0, ccw: !curve.ccw };
}

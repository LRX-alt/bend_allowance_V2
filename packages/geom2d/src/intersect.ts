import { arcSweep, dist, TAU } from './basics';
import { NUMERIC_EPS, type Curve, type Line, type Pt, type Tolerances } from './types';

function pushUnique(points: Pt[], p: Pt, tol: number): void {
  if (points.every(q => dist(q, p) > tol)) points.push(p);
}

function lineLine(a: Line, b: Line, tol: number): Pt[] {
  const dax = a.b.x - a.a.x;
  const day = a.b.y - a.a.y;
  const dbx = b.b.x - b.a.x;
  const dby = b.b.y - b.a.y;
  const den = dax * dby - day * dbx;
  if (Math.abs(den) <= NUMERIC_EPS) return [];
  const t = ((b.a.x - a.a.x) * dby - (b.a.y - a.a.y) * dbx) / den;
  const u = ((b.a.x - a.a.x) * day - (b.a.y - a.a.y) * dax) / den;
  const slack = tol / Math.max(Math.hypot(dax, day), Math.hypot(dbx, dby), NUMERIC_EPS);
  if (t < -slack || t > 1 + slack || u < -slack || u > 1 + slack) return [];
  return [{ x: a.a.x + t * dax, y: a.a.y + t * day }];
}

function lineArc(line: Line, arc: Curve & { kind: 'arc' }, tol: number): Pt[] {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const fx = line.a.x - arc.c.x;
  const fy = line.a.y - arc.c.y;
  const A = dx * dx + dy * dy;
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - arc.r * arc.r;
  if (A <= NUMERIC_EPS) return [];
  let disc = B * B - 4 * A * C;
  if (disc < -tol * arc.r) return [];
  if (disc < 0) disc = 0;
  const root = Math.sqrt(disc);
  const ts = disc === 0 ? [-B / (2 * A)] : [(-B - root) / (2 * A), (-B + root) / (2 * A)];
  const len = Math.hypot(dx, dy);
  const slack = len > NUMERIC_EPS ? tol / len : 0;
  const out: Pt[] = [];
  for (const t of ts) {
    if (t < -slack || t > 1 + slack) continue;
    const p = { x: line.a.x + t * dx, y: line.a.y + t * dy };
    if (pointLiesOnArc(arc, p, tol)) pushUnique(out, p, tol);
  }
  return out;
}

function pointLiesOnArc(arc: Curve & { kind: 'arc' }, p: Pt, tol: number): boolean {
  if (Math.abs(dist(p, arc.c) - arc.r) > tol) return false;
  const ang = Math.atan2(p.y - arc.c.y, p.x - arc.c.x);
  const sweep = arcSweep(arc);
  let d = ang - arc.a0;
  d = d % TAU;
  if (arc.ccw) {
    if (d < 0) d += TAU;
    const angTol = arc.r > NUMERIC_EPS ? tol / arc.r : 0;
    return d <= sweep + angTol || d >= TAU - angTol;
  }
  if (d > 0) d -= TAU;
  const angTol = arc.r > NUMERIC_EPS ? tol / arc.r : 0;
  return d >= sweep - angTol || d <= -TAU + angTol;
}

function arcArc(a: Curve & { kind: 'arc' }, b: Curve & { kind: 'arc' }, tol: number): Pt[] {
  const dx = b.c.x - a.c.x;
  const dy = b.c.y - a.c.y;
  const d = Math.hypot(dx, dy);
  if (d <= NUMERIC_EPS) return [];
  if (d > a.r + b.r + tol || d < Math.abs(a.r - b.r) - tol) return [];
  const aa = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const h2 = a.r * a.r - aa * aa;
  const h = h2 < 0 ? 0 : Math.sqrt(h2);
  const px = a.c.x + (aa * dx) / d;
  const py = a.c.y + (aa * dy) / d;
  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;
  const candidates = h === 0 ? [{ x: px, y: py }] : [{ x: px + rx, y: py + ry }, { x: px - rx, y: py - ry }];
  return candidates.filter(p => pointLiesOnArc(a, p, tol) && pointLiesOnArc(b, p, tol));
}

/** Intersezioni fra due curve. `tol` e' obbligatorio: nessun default. */
export function intersect(a: Curve, b: Curve, tol: Tolerances): Pt[] {
  const point = tol.point;
  if (a.kind === 'line' && b.kind === 'line') return lineLine(a, b, point);
  if (a.kind === 'line' && b.kind === 'arc') return lineArc(a, b, point);
  if (a.kind === 'arc' && b.kind === 'line') return lineArc(b, a, point);
  if (a.kind === 'arc' && b.kind === 'arc') return arcArc(a, b, point);
  return [];
}

export function pointLiesOnCurve(curve: Curve, p: Pt, tol: number): boolean {
  if (curve.kind === 'line') {
    const ab = dist(curve.a, curve.b);
    if (ab <= NUMERIC_EPS) return dist(p, curve.a) <= tol;
    const t =
      ((p.x - curve.a.x) * (curve.b.x - curve.a.x) + (p.y - curve.a.y) * (curve.b.y - curve.a.y)) /
      (ab * ab);
    if (t < -NUMERIC_EPS || t > 1 + NUMERIC_EPS) return false;
    const proj = {
      x: curve.a.x + t * (curve.b.x - curve.a.x),
      y: curve.a.y + t * (curve.b.y - curve.a.y),
    };
    return dist(p, proj) <= tol;
  }
  return pointLiesOnArc(curve, p, tol);
}

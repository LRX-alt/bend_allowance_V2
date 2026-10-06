import { curveEnd, curveStart, dist } from './basics';
import { intersect, pointLiesOnCurve } from './intersect';
import type { Curve, Loop, Pt, Tolerances } from './types';

/**
 * Punto sul bordo: considerato interno.
 * Il raggio parte dal punto verso +X. Il vertice superiore di un lato non viene contato,
 * cosi' un vertice condiviso non produce un doppio attraversamento.
 */
export function pointInLoop(p: Pt, loop: Loop, tol: Tolerances): boolean {
  if (loop.curves.some(curve => pointLiesOnCurve(curve, p, tol.point))) return true;
  const hits: Pt[] = [];
  for (const curve of loop.curves) hits.push(...rayHitPoints(p, curve, tol));
  const unique: Pt[] = [];
  for (const hit of hits) {
    if (unique.every(q => dist(q, hit) > tol.point)) unique.push(hit);
  }
  return unique.length % 2 === 1;
}

function rayHitPoints(p: Pt, curve: Curve, tol: Tolerances): Pt[] {
  if (curve.kind === 'line') {
    const y1 = curve.a.y;
    const y2 = curve.b.y;
    if (y1 > y2) return rayHitPoints(p, { ...curve, a: curve.b, b: curve.a }, tol);
    if (p.y < y1 || p.y >= y2) return [];
    const t = y2 === y1 ? 0 : (p.y - y1) / (y2 - y1);
    const x = curve.a.x + t * (curve.b.x - curve.a.x);
    return x > p.x ? [{ x, y: p.y }] : [];
  }
  const far: Curve = {
    id: '_ray',
    kind: 'line',
    a: p,
    b: { x: p.x + curve.r * 4 + Math.abs(curve.c.x) + 1, y: p.y },
  };
  return intersect(far, curve, tol).filter(h => h.x > p.x + tol.point && Math.abs(h.y - p.y) <= tol.point);
}

export function loopSelfIntersects(loop: Loop, tol: Tolerances): boolean {
  const curves = loop.curves;
  for (let i = 0; i < curves.length; i++) {
    for (let j = i + 1; j < curves.length; j++) {
      const a = curves[i];
      const b = curves[j];
      if (!a || !b) continue;
      const adjacent = j === i + 1 || (loop.closed && i === 0 && j === curves.length - 1);
      const hits = intersect(a, b, tol);
      for (const hit of hits) {
        if (adjacent) {
          const shared =
            dist(hit, curveEnd(a)) <= tol.point && dist(hit, curveStart(b)) <= tol.point ||
            dist(hit, curveStart(a)) <= tol.point && dist(hit, curveEnd(b)) <= tol.point;
          if (shared) continue;
        }
        const onlyEndpoint =
          (dist(hit, curveStart(a)) <= tol.point || dist(hit, curveEnd(a)) <= tol.point) &&
          (dist(hit, curveStart(b)) <= tol.point || dist(hit, curveEnd(b)) <= tol.point);
        if (onlyEndpoint && adjacent) continue;
        if (onlyEndpoint && !adjacent) return true;
        if (!onlyEndpoint) return true;
      }
    }
  }
  return false;
}

import { curveBbox, reverseCurve, signedArea, unionBbox } from './basics';
import { pointInLoop } from './contains';
import type { Curve, Loop, Pt, Tolerances } from './types';

export interface Nesting {
  outer: Loop | null;
  inner: Loop[];
  /** loop chiusi non contenuti nel contorno esterno */
  outside: Loop[];
  /** loop contenuti in un inner: oltre il secondo livello */
  deeper: Loop[];
}

function sample(loop: Loop): Pt | null {
  const curve = loop.curves[0];
  if (!curve) return null;
  return curve.kind === 'line' ? curve.a : { x: curve.c.x + curve.r * Math.cos(curve.a0), y: curve.c.y + curve.r * Math.sin(curve.a0) };
}

function withOrientation(loop: Loop, wantPositive: boolean): Loop {
  const positive = loop.signedArea >= 0;
  if (positive === wantPositive) return loop;
  const curves = [...loop.curves].reverse().map(reverseCurve);
  return {
    ...loop,
    curves,
    signedArea: signedArea(curves),
    bbox: unionBbox(curves.map(curveBbox)),
  };
}

export function nestLoops(loops: Loop[], tol: Tolerances): Nesting {
  const closed = loops.filter(loop => loop.closed && loop.curves.length > 0);
  if (closed.length === 0) return { outer: null, inner: [], outside: [], deeper: [] };
  const ranked = [...closed].sort((a, b) => Math.abs(b.signedArea) - Math.abs(a.signedArea));
  const outer0 = ranked[0];
  if (!outer0) return { outer: null, inner: [], outside: [], deeper: [] };
  const outer = withOrientation(outer0, true);
  const inner: Loop[] = [];
  const outside: Loop[] = [];
  const deeper: Loop[] = [];
  for (const loop of ranked.slice(1)) {
    const p = sample(loop);
    if (!p || !pointInLoop(p, outer, tol)) {
      outside.push(loop);
      continue;
    }
    const insideInner = inner.some(existing => {
      const q = sample(loop);
      return q ? pointInLoop(q, existing, tol) : false;
    });
    if (insideInner) deeper.push(withOrientation(loop, true));
    else inner.push(withOrientation(loop, false));
  }
  return { outer, inner, outside, deeper };
}

export function curvesOf(loop: Loop): Curve[] {
  return loop.curves;
}

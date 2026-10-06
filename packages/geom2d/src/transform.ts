import { curveEnd, curveLength, curveStart, pointAt } from './basics';
import type { Curve, Pt } from './types';

export function translate(curve: Curve, dx: number, dy: number): Curve {
  const move = (p: Pt): Pt => ({ x: p.x + dx, y: p.y + dy });
  if (curve.kind === 'line') return { ...curve, a: move(curve.a), b: move(curve.b) };
  return { ...curve, c: move(curve.c) };
}

export function rotate(curve: Curve, origin: Pt, rad: number): Curve {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rot = (p: Pt): Pt => {
    const x = p.x - origin.x;
    const y = p.y - origin.y;
    return { x: origin.x + x * cos - y * sin, y: origin.y + x * sin + y * cos };
  };
  if (curve.kind === 'line') return { ...curve, a: rot(curve.a), b: rot(curve.b) };
  return { ...curve, c: rot(curve.c), a0: curve.a0 + rad, a1: curve.a1 + rad };
}

export function mirror(curve: Curve, axis: 'x' | 'y'): Curve {
  const flip = (p: Pt): Pt => (axis === 'x' ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y });
  if (curve.kind === 'line') return { ...curve, a: flip(curve.a), b: flip(curve.b) };
  const c = flip(curve.c);
  const a0 = axis === 'x' ? -curve.a0 : Math.PI - curve.a0;
  const a1 = axis === 'x' ? -curve.a1 : Math.PI - curve.a1;
  return { ...curve, c, a0, a1, ccw: !curve.ccw };
}

export function translatePreservesLength(curve: Curve, dx: number, dy: number): boolean {
  const moved = translate(curve, dx, dy);
  return (
    curve.id === moved.id &&
    Math.abs(curveLength(curve) - curveLength(moved)) < 1e-9 &&
    curveStart(moved).x - curveStart(curve).x === dx &&
    pointAt(moved, 1).y - pointAt(curve, 1).y === dy
  );
}

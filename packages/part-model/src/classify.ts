import { arcSweep, curveStart, dist, type Curve, type Loop } from '@sviluppolamiera/geom2d';
import { nextId } from './createPart';
import type { Feature, Tolerances } from './types';

function centroidOf(loop: Loop): { x: number; y: number } {
  const pts = loop.curves.map(curveStart);
  const n = pts.length || 1;
  const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / n, y: sum.y / n };
}

function isHole(loop: Loop, tol: Tolerances): { center: { x: number; y: number }; diameter: number } | null {
  if (loop.curves.length === 0 || loop.curves.some(c => c.kind !== 'arc')) return null;
  const arcs = loop.curves.filter(c => c.kind === 'arc');
  const first = arcs[0];
  if (!first || first.kind !== 'arc') return null;
  for (const arc of arcs) {
    if (arc.kind !== 'arc') return null;
    if (dist(arc.c, first.c) > tol.point) return null;
    if (Math.abs(arc.r - first.r) > tol.point) return null;
  }
  const sweep = arcs.reduce((sum, arc) => (arc.kind === 'arc' ? sum + Math.abs(arcSweep(arc)) : sum), 0);
  if (Math.abs(sweep - Math.PI * 2) > Math.max(tol.angular, 1e-6)) return null;
  return { center: { ...first.c }, diameter: first.r * 2 };
}

function isSlot(loop: Loop, tol: Tolerances): { p0: { x: number; y: number }; p1: { x: number; y: number }; width: number } | null {
  const lines = loop.curves.filter(c => c.kind === 'line');
  const arcs = loop.curves.filter(c => c.kind === 'arc');
  if (lines.length !== 2 || arcs.length !== 2) return null;
  const [l0, l1] = lines;
  const [a0, a1] = arcs;
  if (!l0 || !l1 || l0.kind !== 'line' || l1.kind !== 'line') return null;
  if (!a0 || !a1 || a0.kind !== 'arc' || a1.kind !== 'arc') return null;
  if (Math.abs(a0.r - a1.r) > tol.point) return null;
  const d0 = { x: l0.b.x - l0.a.x, y: l0.b.y - l0.a.y };
  const d1 = { x: l1.b.x - l1.a.x, y: l1.b.y - l1.a.y };
  const len0 = Math.hypot(d0.x, d0.y);
  const len1 = Math.hypot(d1.x, d1.y);
  if (Math.abs(len0 - len1) > tol.point || len0 <= tol.point) return null;
  const cross = Math.abs(d0.x * d1.y - d0.y * d1.x) / (len0 * len1);
  if (cross > tol.angular) return null;
  const gap = Math.abs((l1.a.x - l0.a.x) * (-d0.y / len0) + (l1.a.y - l0.a.y) * (d0.x / len0));
  if (Math.abs(gap - 2 * a0.r) > tol.point) return null;
  return { p0: { ...a0.c }, p1: { ...a1.c }, width: a0.r * 2 };
}

function isRect(loop: Loop, tol: Tolerances): { center: { x: number; y: number }; w: number; h: number; rotationRad: number; cornerRadius: number } | null {
  const lines = loop.curves.filter(c => c.kind === 'line');
  const arcs = loop.curves.filter(c => c.kind === 'arc');
  if (lines.length !== 4) return null;
  if (arcs.length !== 0 && arcs.length !== 4) return null;
  if (arcs.some(a => a.kind !== 'arc')) return null;
  const radii = arcs.map(a => (a.kind === 'arc' ? a.r : 0));
  const r0 = radii[0] ?? 0;
  if (radii.some(r => Math.abs(r - r0) > tol.point)) return null;
  const dirs = lines.map(l => {
    if (l.kind !== 'line') return { x: 0, y: 0, len: 0, ang: 0 };
    const x = l.b.x - l.a.x;
    const y = l.b.y - l.a.y;
    const len = Math.hypot(x, y);
    return { x, y, len, ang: Math.atan2(y, x) };
  });
  for (let i = 0; i < 4; i++) {
    const a = dirs[i];
    const b = dirs[(i + 1) % 4];
    if (!a || !b || a.len <= tol.point || b.len <= tol.point) return null;
    const dot = Math.abs((a.x * b.x + a.y * b.y) / (a.len * b.len));
    if (dot > tol.angular) return null;
  }
  const w = (dirs[0]?.len ?? 0) + 2 * r0;
  const h = (dirs[1]?.len ?? 0) + 2 * r0;
  const box = loop.bbox;
  return {
    center: { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 },
    w,
    h,
    rotationRad: dirs[0]?.ang ?? 0,
    cornerRadius: r0,
  };
}

export function classifyLoop(loop: Loop, tol: Tolerances): Feature {
  const base = {
    id: nextId('fea'),
    loopId: loop.id,
    anchor: { x: 'unset' as const, y: 'unset' as const },
    locked: false,
  };
  const hole = isHole(loop, tol);
  if (hole) return { ...base, kind: 'hole', ...hole };
  const slot = isSlot(loop, tol);
  if (slot) return { ...base, kind: 'slot', ...slot };
  const rect = isRect(loop, tol);
  if (rect) return { ...base, kind: 'rect', ...rect };
  return { ...base, kind: 'generic', centroid: centroidOf(loop) };
}

export function curveIds(loop: Loop): string[] {
  return loop.curves.map(c => c.id);
}

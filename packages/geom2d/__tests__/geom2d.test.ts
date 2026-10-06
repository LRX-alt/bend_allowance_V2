import { describe, expect, it } from 'vitest';
import {
  chainToLoop,
  curveLength,
  DEFAULT_TOLERANCES,
  intersect,
  loopSelfIntersects,
  nestLoops,
  pointAt,
  pointInLoop,
  rotate,
  signedArea,
  stitch,
  translate,
  type Curve,
  type Loop,
} from '../src/index';

const T = DEFAULT_TOLERANCES;

function line(id: string, x0: number, y0: number, x1: number, y1: number): Curve {
  return { id, kind: 'line', a: { x: x0, y: y0 }, b: { x: x1, y: y1 } };
}

function loopOf(id: string, curves: Curve[], closed = true): Loop {
  return chainToLoop(id, curves, closed);
}

describe('geom2d primitive', () => {
  it('arco di 90 gradi e raggio 10 e lungo 15.70796', () => {
    const arc: Curve = { id: 'a', kind: 'arc', c: { x: 0, y: 0 }, r: 10, a0: 0, a1: Math.PI / 2, ccw: true };
    expect(curveLength(arc)).toBeCloseTo(15.70796, 4);
  });

  it('area firmata positiva in antiorario e negativa se invertita', () => {
    const ccw = [line('b', 0, 0, 10, 0), line('r', 10, 0, 10, 10), line('t', 10, 10, 0, 10), line('l', 0, 10, 0, 0)];
    expect(signedArea(ccw)).toBeCloseTo(100, 6);
    const cw = [...ccw].reverse().map(c =>
      c.kind === 'line' ? { ...c, a: c.b, b: c.a } : c
    );
    expect(signedArea(cw)).toBeCloseTo(-100, 6);
  });

  it('la traslazione conserva id e lunghezza', () => {
    const src = line('L1', 0, 0, 3, 4);
    const moved = translate(src, 10, -2);
    expect(moved.id).toBe('L1');
    expect(curveLength(moved)).toBeCloseTo(curveLength(src), 9);
  });

  it('una rotazione di 360 gradi torna all origine entro point', () => {
    const src = line('L', 2, 3, 5, 7);
    const spun = rotate(src, { x: 0, y: 0 }, Math.PI * 2);
    expect(spun.kind === 'line' && Math.hypot(spun.a.x - 2, spun.a.y - 3)).toBeLessThanOrEqual(T.point);
    expect(spun.kind === 'line' && Math.hypot(spun.b.x - 5, spun.b.y - 7)).toBeLessThanOrEqual(T.point);
  });
});

describe('geom2d predicati', () => {
  it('una retta tangente a un arco restituisce un solo punto', () => {
    const arc: Curve = { id: 'c', kind: 'arc', c: { x: 0, y: 0 }, r: 10, a0: 0, a1: Math.PI, ccw: true };
    const tang = line('t', -20, 10, 20, 10);
    const hits = intersect(tang, arc, T);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.y).toBeCloseTo(10, 6);
  });

  it('una retta per un estremo condiviso non duplica il punto e non e autointersezione', () => {
    const a = line('a', 0, 0, 10, 0);
    const b = line('b', 10, 0, 10, 10);
    expect(intersect(a, b, T)).toHaveLength(1);
    const loop = loopOf('sq', [
      a,
      b,
      line('c', 10, 10, 0, 10),
      line('d', 0, 10, 0, 0),
    ]);
    expect(loopSelfIntersects(loop, T)).toBe(false);
  });

  it('un punto sul bordo e interno; un punto fuori no', () => {
    const loop = loopOf('sq', [
      line('a', 0, 0, 10, 0),
      line('b', 10, 0, 10, 10),
      line('c', 10, 10, 0, 10),
      line('d', 0, 10, 0, 0),
    ]);
    expect(pointInLoop({ x: 10, y: 5 }, loop, T)).toBe(true);
    expect(pointInLoop({ x: 5, y: 5 }, loop, T)).toBe(true);
    expect(pointInLoop({ x: 15, y: 5 }, loop, T)).toBe(false);
  });

  it('un loop a C non si autointerseca, un otto si', () => {
    const cShape = loopOf('c', [
      line('1', 0, 0, 30, 0),
      line('2', 30, 0, 30, 10),
      line('3', 30, 10, 20, 10),
      line('4', 20, 10, 20, 20),
      line('5', 20, 20, 10, 20),
      line('6', 10, 20, 10, 10),
      line('7', 10, 10, 0, 10),
      line('8', 0, 10, 0, 0),
    ]);
    expect(loopSelfIntersects(cShape, T)).toBe(false);
    const eight = loopOf('8', [
      line('a', 0, 0, 10, 10),
      line('b', 10, 10, 10, 0),
      line('c', 10, 0, 0, 10),
      line('d', 0, 10, 0, 0),
    ]);
    expect(loopSelfIntersects(eight, T)).toBe(true);
  });
});

describe('geom2d topologia', () => {
  it('una catena aperta resta aperta', () => {
    const curves = [line('a', 0, 0, 10, 0), line('b', 10, 0, 20, 0)];
    const stitched = stitch(curves, T);
    expect(stitched.chains).toHaveLength(1);
    expect(stitched.closed[0]).toBe(false);
    expect(stitched.gaps).toHaveLength(0);
  });

  it('due capi a 0.03 mm producono una segnalazione e nessuna modifica', () => {
    const curves = [line('a', 0, 0, 10, 0), line('b', 10.03, 0, 20, 0)];
    const before = JSON.stringify(curves);
    const stitched = stitch(curves, T);
    expect(JSON.stringify(curves)).toBe(before);
    expect(stitched.chains).toHaveLength(2);
    expect(stitched.gaps.some(g => Math.abs(g.distance - 0.03) < 1e-9)).toBe(true);
  });

  it('rileva una biforcazione', () => {
    const stitched = stitch(
      [line('a', 0, 0, 10, 0), line('b', 0, 0, 0, 10), line('c', 0, 0, -10, 0)],
      T
    );
    expect(stitched.branches.length).toBeGreaterThan(0);
  });

  it('classifica i loop annidati e conserva gli id', () => {
    const outer = loopOf('out', [
      line('o1', 0, 0, 100, 0),
      line('o2', 100, 0, 100, 80),
      line('o3', 100, 80, 0, 80),
      line('o4', 0, 80, 0, 0),
    ]);
    const hole = loopOf('in', [
      line('i1', 10, 10, 10, 20),
      line('i2', 10, 20, 20, 20),
      line('i3', 20, 20, 20, 10),
      line('i4', 20, 10, 10, 10),
    ]);
    const nested = nestLoops([hole, outer], T);
    expect(nested.outer?.id).toBe('out');
    expect(nested.inner.map(l => l.id)).toEqual(['in']);
    expect(nested.outer?.signedArea).toBeGreaterThan(0);
    expect(nested.inner[0]?.signedArea).toBeLessThan(0);
    const ids = stitchedIds(outer);
    expect(ids).toEqual(['o1', 'o2', 'o3', 'o4']);
    const moved = outer.curves.map(c => translate(c, 1, 0));
    expect(moved.map(c => c.id)).toEqual(ids);
  });
});

function stitchedIds(loop: Loop): string[] {
  return stitch(loop.curves, T).chains.flat().map(c => c.id);
}

void pointAt;

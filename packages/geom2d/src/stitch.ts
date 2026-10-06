import { curveBbox, reverseCurve, signedArea, unionBbox, curveEnd, curveStart, dist } from './basics';
import type { Curve, Loop, Pt, Tolerances } from './types';

export interface GapReport {
  a: Pt;
  b: Pt;
  distance: number;
}

export interface StitchResult {
  chains: Curve[][];
  /** true se la catena torna sul nodo di partenza */
  closed: boolean[];
  /** quanti endpoint distinti sono stati identificati come lo stesso nodo, senza spostare i vertici */
  identifiedNodes: number;
  gaps: GapReport[];
  branches: Pt[];
}

class UnionFind {
  parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(i: number): number {
    const p = this.parent[i];
    if (p === undefined || p === i) return i;
    const root = this.find(p);
    this.parent[i] = root;
    return root;
  }
  union(a: number, b: number): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[rb] = ra;
    return true;
  }
}

/**
 * Cucitura topologica. I vertici non vengono spostati: due estremi entro
 * `tolerances.point` sono lo stesso nodo, ma le coordinate delle curve restano quelle di ingresso.
 * I gap non vengono chiusi.
 */
export function stitch(curves: Curve[], tol: Tolerances): StitchResult {
  const ends: Pt[] = [];
  for (const curve of curves) {
    ends.push(curveStart(curve), curveEnd(curve));
  }
  const uf = new UnionFind(ends.length);
  let identifiedNodes = 0;
  for (let i = 0; i < ends.length; i++) {
    for (let j = i + 1; j < ends.length; j++) {
      const a = ends[i];
      const b = ends[j];
      if (!a || !b) continue;
      if (dist(a, b) <= tol.point && uf.union(i, j)) identifiedNodes += 1;
    }
  }

  const nodeOfEnd = (index: number) => uf.find(index);
  const degree = new Map<number, number>();
  const bump = (n: number) => degree.set(n, (degree.get(n) ?? 0) + 1);
  curves.forEach((curve, i) => {
    const s = nodeOfEnd(i * 2);
    const e = nodeOfEnd(i * 2 + 1);
    if (s === e) {
      bump(s);
      bump(e);
    } else {
      bump(s);
      bump(e);
    }
  });

  const branches: Pt[] = [];
  for (const [node, deg] of degree) {
    if (deg > 2) {
      const sample = ends[node];
      if (sample) branches.push(sample);
    }
  }

  const unused = new Set(curves.map((_, i) => i));
  const neighbors = new Map<number, number[]>();
  const addN = (node: number, edge: number) => {
    const list = neighbors.get(node) ?? [];
    list.push(edge);
    neighbors.set(node, list);
  };
  curves.forEach((_, i) => {
    addN(nodeOfEnd(i * 2), i);
    addN(nodeOfEnd(i * 2 + 1), i);
  });

  const chains: Curve[][] = [];
  const closed: boolean[] = [];

  const orientFrom = (curve: Curve, node: number, edge: number): Curve => {
    const startNode = nodeOfEnd(edge * 2);
    if (startNode === node) return curve;
    return reverseCurve(curve);
  };

  const pending = [...unused];
  for (const startEdge of pending) {
    if (!unused.has(startEdge)) continue;
    const startCurve = curves[startEdge];
    if (!startCurve) continue;
    unused.delete(startEdge);
    const chain: Curve[] = [startCurve];
    let node = nodeOfEnd(startEdge * 2 + 1);
    const origin = nodeOfEnd(startEdge * 2);
    let guard = curves.length + 2;
    while (guard-- > 0) {
      if (node === origin) break;
      const deg = degree.get(node) ?? 0;
      if (deg !== 2) break;
      const opts = (neighbors.get(node) ?? []).filter(e => unused.has(e));
      const next = opts[0];
      if (next === undefined) break;
      const nextCurve = curves[next];
      if (!nextCurve) break;
      unused.delete(next);
      chain.push(orientFrom(nextCurve, node, next));
      const s = nodeOfEnd(next * 2);
      const e = nodeOfEnd(next * 2 + 1);
      node = s === node ? e : s;
    }
    const isClosed = node === origin && chain.length > 1;
    chains.push(chain);
    closed.push(isClosed);
  }

  const gaps: GapReport[] = [];
  const endsOf = chains.map(chain => {
    const first = chain[0];
    const last = chain[chain.length - 1];
    if (!first || !last) return null;
    return { a: curveStart(first), b: curveEnd(last) };
  });
  const paired = new Set<string>();
  for (let i = 0; i < endsOf.length; i++) {
    const left = endsOf[i];
    if (!left || closed[i]) continue;
    const candidates = [left.a, left.b];
    for (const a of candidates) {
      let best: { key: string; b: Pt; d: number } | null = null;
      for (let j = 0; j < endsOf.length; j++) {
        const right = endsOf[j];
        if (!right || closed[j]) continue;
        const points = i === j ? [] : [right.a, right.b];
        if (i === j && dist(left.a, left.b) <= tol.stitchSuggest && dist(left.a, left.b) > tol.point) {
          const key = `${i}:${j}`;
          if (!paired.has(key)) {
            gaps.push({ a: left.a, b: left.b, distance: dist(left.a, left.b) });
            paired.add(key);
          }
          continue;
        }
        for (const b of points) {
          const d = dist(a, b);
          if (d <= tol.point) continue;
          const key = [i, j, d.toFixed(6)].sort().join(':');
          if (paired.has(key)) continue;
          if (!best || d < best.d) best = { key, b, d };
        }
      }
      if (best && !paired.has(best.key)) {
        gaps.push({ a, b: best.b, distance: best.d });
        paired.add(best.key);
      }
    }
  }

  return { chains, closed, identifiedNodes, gaps, branches };
}

export function chainToLoop(id: string, curves: Curve[], closed: boolean): Loop {
  return {
    id,
    curves,
    closed,
    signedArea: signedArea(curves),
    bbox: unionBbox(curves.map(curveBbox)),
  };
}

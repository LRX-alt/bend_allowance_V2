import { stretchAlongAxis } from '@sviluppolamiera/ops';

function uniqueSorted(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((value, index) => index === 0 || value - sorted[index - 1] > 0.2);
}

/** Intervallo di una quota «N mm» appoggiata alle linee di piega o al contorno. */
export function quoteSpan(part, x, y, length) {
  if (!part?.outer?.bbox || !(length > 0)) return null;
  const box = part.outer.bbox;
  const vertical = [box.minX, box.maxX];
  const horizontal = [box.minY, box.maxY];
  for (const bend of part.bendLines || []) {
    if (Math.abs(bend.a.x - bend.b.x) <= 0.2) vertical.push((bend.a.x + bend.b.x) / 2);
    if (Math.abs(bend.a.y - bend.b.y) <= 0.2) horizontal.push((bend.a.y + bend.b.y) / 2);
  }
  const match = (stops, at) => {
    const marks = uniqueSorted(stops);
    for (let index = 1; index < marks.length; index += 1) {
      const from = marks[index - 1];
      const to = marks[index];
      if (
        Math.abs(to - from - length) < 0.08 &&
        Math.abs((from + to) / 2 - at) < Math.max(20, length)
      ) {
        return { from, to };
      }
    }
    return null;
  };
  const alongX = match(vertical, x);
  if (alongX) return { axis: 'x', ...alongX };
  const alongY = match(horizontal, y);
  if (alongY) return { axis: 'y', ...alongY };
  return null;
}

export function applyDimensionEdit(part, { axis, from, to, next }) {
  const current = Math.abs(to - from);
  const target = Number(next);
  if (!part || !(target > 0) || !Number.isFinite(target)) {
    return { ok: false, blocking: [], warnings: [] };
  }
  const delta = target - current;
  if (Math.abs(delta) < 0.001) return { ok: true, part, blocking: [], warnings: [] };
  return stretchAlongAxis(part, {
    axis,
    delta,
    mode: 'leftFixed',
    cuts: [(Math.min(from, to) + Math.max(from, to)) / 2],
    confirmWarnings: true,
    anchorPolicy: { kind: 'followMinEdge' },
  });
}

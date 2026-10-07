import { stretchAlongAxis, suggestCutBands } from '@sviluppolamiera/ops';

const EDGE_TOL = 0.05;

function uniqueSorted(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((value, index) => index === 0 || value - sorted[index - 1] > 0.2);
}

function boxRange(part, axis) {
  const box = part.outer.bbox;
  return axis === 'x' ? [box.minX, box.maxX] : [box.minY, box.maxY];
}

function bendPositions(part, axis) {
  const positions = [];
  for (const bend of part.bendLines || []) {
    if (axis === 'x' && Math.abs(bend.a.x - bend.b.x) <= 0.2)
      positions.push((bend.a.x + bend.b.x) / 2);
    if (axis === 'y' && Math.abs(bend.a.y - bend.b.y) <= 0.2)
      positions.push((bend.a.y + bend.b.y) / 2);
  }
  return positions;
}

/** Punti notevoli di un asse: i due bordi del contorno e le linee di piega. */
function axisMarks(part, axis) {
  const [min, max] = boxRange(part, axis);
  return uniqueSorted([min, max, ...bendPositions(part, axis)]);
}

/** Intervallo di una quota «N mm» appoggiata alle linee di piega o al contorno. */
export function quoteSpan(part, x, y, length) {
  if (!part?.outer?.bbox || !(length > 0)) return null;
  const match = (marks, at) => {
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
  const alongX = match(axisMarks(part, 'x'), x);
  if (alongX) return { axis: 'x', ...alongX };
  const alongY = match(axisMarks(part, 'y'), y);
  if (alongY) return { axis: 'y', ...alongY };
  return null;
}

/**
 * Le due flange di un asse (bordo del contorno -> prima linea di piega incontrata
 * venendo da quel bordo). `null` quando sull'asse non c'e' nessuna linea di piega.
 */
function flangeSpans(part, axis) {
  const marks = axisMarks(part, axis);
  if (marks.length < 3) return { min: null, max: null };
  return {
    min: { edge: marks[0], bend: marks[1] },
    max: { edge: marks[marks.length - 1], bend: marks[marks.length - 2] },
  };
}

/** Un taglio dentro la flangia, a 1 mm dalla piega verso il bordo. */
function cutTowardEdge(edge, bend) {
  const span = Math.abs(edge - bend);
  const offset = Math.min(1, span / 2);
  return bend + Math.sign(edge - bend) * offset;
}

/** Un taglio vicino al bordo interno di una fascia libera, verso il centro del pezzo. */
function cutInsideBand(band, side) {
  const span = band.max - band.min;
  const margin = Math.min(1, span / 2);
  return side === 'min' ? band.max - margin : band.min + margin;
}

/** Tagli ricavati dalle fasce libere di suggestCutBands, usati quando l'asse non ha pieghe. */
function bandBasedCuts(part, axis, min, max) {
  const bands = suggestCutBands(part, axis);
  const minBand = bands.length && Math.abs(bands[0].min - min) < 0.5 ? bands[0] : null;
  const maxBand =
    bands.length && Math.abs(bands[bands.length - 1].max - max) < 0.5
      ? bands[bands.length - 1]
      : null;
  if (minBand && maxBand && minBand !== maxBand) {
    return [cutInsideBand(minBand, 'min'), cutInsideBand(maxBand, 'max')].sort((a, b) => a - b);
  }
  return null;
}

const CLUSTER_GAP = 3;
const PAD = 0.05;

/**
 * Pieghe parallele al taglio raggruppate per posizione: una piega ripetuta su piu'
 * layer (es. BEND e BEND_EXTENT) conta una volta sola.
 */
function bendClusters(part, axis) {
  const gap = Math.max(CLUSTER_GAP, 2 * (part.thickness || 0));
  const items = [];
  for (const bend of part.bendLines || []) {
    const a = axis === 'x' ? bend.a.x : bend.a.y;
    const b = axis === 'x' ? bend.b.x : bend.b.y;
    if (Math.abs(a - b) > 0.2) continue;
    items.push({ pos: (a + b) / 2, half: bend.zoneHalfWidth ?? 0 });
  }
  items.sort((p, q) => p.pos - q.pos);
  const clusters = [];
  for (const item of items) {
    const last = clusters[clusters.length - 1];
    if (last && item.pos - last.lastPos <= gap) {
      last.lastPos = item.pos;
      last.from = Math.min(last.from, item.pos - item.half);
      last.to = Math.max(last.to, item.pos + item.half);
    } else {
      clusters.push({ lastPos: item.pos, from: item.pos - item.half, to: item.pos + item.half });
    }
  }
  return clusters;
}

function featureSpan(part, feature, axis) {
  const loop = (part.inner || []).find(item => item.id === feature.loopId);
  if (loop?.curves?.length) {
    const box = loop.bbox;
    return axis === 'x' ? [box.minX, box.maxX] : [box.minY, box.maxY];
  }
  if (feature.kind === 'hole') {
    const c = axis === 'x' ? feature.center.x : feature.center.y;
    return [c - feature.diameter / 2, c + feature.diameter / 2];
  }
  if (feature.kind === 'slot') {
    const a = axis === 'x' ? feature.p0.x : feature.p0.y;
    const b = axis === 'x' ? feature.p1.x : feature.p1.y;
    return [Math.min(a, b) - feature.width / 2, Math.max(a, b) + feature.width / 2];
  }
  if (feature.kind === 'rect') {
    const c = axis === 'x' ? feature.center.x : feature.center.y;
    const half = (axis === 'x' ? feature.w : feature.h) / 2;
    return [c - half, c + half];
  }
  const c = axis === 'x' ? (feature.centroid?.x ?? 0) : (feature.centroid?.y ?? 0);
  return [c, c];
}

/** Intervalli dell'asse dove un taglio non puo' cadere: lavorazioni, archi, lati paralleli, pieghe. */
function blockedSpans(part, axis) {
  const spans = [];
  for (const feature of part.features || []) {
    const [min, max] = featureSpan(part, feature, axis);
    spans.push({ min: min - PAD, max: max + PAD });
  }
  for (const curve of part.outer?.curves || []) {
    if (curve.kind === 'arc') {
      const c = axis === 'x' ? curve.c.x : curve.c.y;
      spans.push({ min: c - curve.r - PAD, max: c + curve.r + PAD });
    } else if (curve.kind === 'line') {
      const a = axis === 'x' ? curve.a.x : curve.a.y;
      const b = axis === 'x' ? curve.b.x : curve.b.y;
      if (Math.abs(a - b) <= 0.01) spans.push({ min: a - PAD, max: a + PAD });
    }
  }
  for (const bend of part.bendLines || []) {
    const a = axis === 'x' ? bend.a.x : bend.a.y;
    const b = axis === 'x' ? bend.b.x : bend.b.y;
    if (Math.abs(a - b) > 0.2) continue;
    const half = (bend.zoneHalfWidth ?? 0) + PAD;
    spans.push({ min: (a + b) / 2 - half, max: (a + b) / 2 + half });
  }
  return spans;
}

/** Prima posizione libera partendo da `start` e spostandosi nel verso `dir`, entro (lo, hi). */
function freePosition(start, dir, lo, hi, spans) {
  let pos = start;
  for (let guard = 0; guard < 500; guard += 1) {
    if (pos <= lo || pos >= hi) return null;
    const hit = spans.find(span => pos > span.min && pos < span.max);
    if (!hit) return pos;
    pos = dir > 0 ? hit.max + PAD : hit.min - PAD;
  }
  return null;
}

/**
 * Il punto libero piu' vicino a `center`, entro (lo, hi), fuori da ogni intervallo
 * di `spans`. Se `center` e' gia' libero restituisce `center`; altrimenti sceglie
 * il bordo piu' vicino, a sinistra o a destra, dell'intervallo bloccato che lo contiene.
 */
function nearestFreePosition(center, lo, hi, spans) {
  const hit = spans.find(span => center > span.min && center < span.max);
  if (!hit) return center;
  const left = freePosition(hit.min - PAD, -1, lo, hi, spans);
  const right = freePosition(hit.max + PAD, 1, lo, hi, spans);
  if (left === null && right === null) return null;
  if (left === null) return right;
  if (right === null) return left;
  return Math.abs(center - left) <= Math.abs(right - center) ? left : right;
}

/**
 * Il corpo di un asse: il tratto tra la piega (o il grappolo di pieghe) piu' interna
 * vicino al bordo minimo e quella piu' interna vicino al bordo massimo. Se su un
 * lato non c'e' nessuna piega, il corpo arriva fino al bordo del contorno.
 */
function bodyRange(part, axis) {
  const [min, max] = boxRange(part, axis);
  const mid = (min + max) / 2;
  const clusters = bendClusters(part, axis);
  if (!clusters.length) return null;
  const minSide = clusters.filter(cluster => cluster.lastPos <= mid);
  const maxSide = clusters.filter(cluster => cluster.lastPos > mid);
  const lo = minSide.length ? Math.max(...minSide.map(cluster => cluster.to)) : min;
  const hi = maxSide.length ? Math.min(...maxSide.map(cluster => cluster.from)) : max;
  if (hi - lo < 0.01) return null;
  return { lo, hi };
}

/**
 * Correzione dello sviluppo nel corpo del pezzo: le flange e le pieghe restano
 * ferme rispetto al loro bordo (e quindi rispetto a eventuali scantonature), e
 * ogni foro conserva la distanza dalla sua piega. L'intera differenza entra con un
 * solo taglio nello spazio libero del corpo piu' vicino al centro: meta' dei
 * millimetri va al lato minimo, meta' al lato massimo. `null` se l'asse non ha
 * pieghe o nel corpo non c'e' nessuno spazio libero dalle lavorazioni.
 */
export function bodyCutPlan(part, axis, delta) {
  const range = bodyRange(part, axis);
  if (!range) return null;
  const { lo, hi } = range;
  const spans = blockedSpans(part, axis).filter(span => span.max > lo && span.min < hi);
  const center = (lo + hi) / 2;
  const cut = nearestFreePosition(center, lo, hi, spans);
  if (cut === null) return null;
  return { cuts: [cut], zoneOffsets: [-delta / 2, delta / 2] };
}

/** Parametri di stretchAlongAxis per correggere l'ingombro di un asse senza spostare le quote dei fori. */
export function overallStretchParams(part, axis, delta) {
  const base = { axis, delta, anchorPolicy: zonePolicy(part), confirmWarnings: true };
  const [min, max] = boxRange(part, axis);
  if (bendPositions(part, axis).length) {
    const plan = bodyCutPlan(part, axis, delta);
    if (!plan) return null;
    return { ...base, mode: 'manualZones', ...plan };
  }
  const mid = (min + max) / 2;
  return {
    ...base,
    mode: 'symmetric',
    cuts: bandBasedCuts(part, axis, min, max) ?? [mid - 0.5, mid + 0.5],
  };
}

/**
 * Ogni lavorazione trasla come la zona in cui cade. Le lavorazioni con un
 * ancoraggio gia' dichiarato mantengono la loro regola (gestito da stretchAlongAxis).
 */
export function zonePolicy(part) {
  const assignments = {};
  for (const feature of part.features || []) assignments[feature.id] = 'group';
  return { kind: 'perFeature', assignments };
}

function applyOverallResize(part, axis, delta) {
  const params = overallStretchParams(part, axis, delta);
  if (!params) {
    return {
      ok: false,
      blocking: [
        {
          code: 'DIM-001',
          severity: 'error',
          message: "Nel corpo non c'è uno spazio libero dai fori dove aggiungere i millimetri.",
        },
      ],
      warnings: [],
    };
  }
  return stretchAlongAxis(part, params);
}

function applyFlangeResize(part, axis, delta, side, edge, bend) {
  const cut = cutTowardEdge(edge, bend);
  const mode = side === 'min' ? 'rightFixed' : 'leftFixed';
  const anchorPolicy = zonePolicy(part);
  return stretchAlongAxis(part, {
    axis,
    delta,
    mode,
    cuts: [cut],
    anchorPolicy,
    confirmWarnings: true,
  });
}

function applyBetweenBendsResize(part, axis, delta, from, to) {
  const cut = (from + to) / 2;
  const anchorPolicy = zonePolicy(part);
  return stretchAlongAxis(part, {
    axis,
    delta,
    mode: 'leftFixed',
    cuts: [cut],
    anchorPolicy,
    confirmWarnings: true,
  });
}

export function applyDimensionEdit(part, { axis, from, to, next }) {
  const current = Math.abs(to - from);
  const target = Number(next);
  if (!part || !(target > 0) || !Number.isFinite(target)) {
    return { ok: false, blocking: [], warnings: [] };
  }
  const delta = target - current;
  if (Math.abs(delta) < 0.001) return { ok: true, part, blocking: [], warnings: [] };

  const [boxMin, boxMax] = boxRange(part, axis);
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const touchesMin = Math.abs(lo - boxMin) <= EDGE_TOL;
  const touchesMax = Math.abs(hi - boxMax) <= EDGE_TOL;

  if (touchesMin && touchesMax) {
    return applyOverallResize(part, axis, delta);
  }
  if (touchesMin || touchesMax) {
    const side = touchesMin ? 'min' : 'max';
    const edge = touchesMin ? lo : hi;
    const bend = touchesMin ? hi : lo;
    return applyFlangeResize(part, axis, delta, side, edge, bend);
  }
  return applyBetweenBendsResize(part, axis, delta, lo, hi);
}

/**
 * Quote di flangia: dal bordo del contorno alla linea di piega piu' esterna,
 * una per lato su ogni asse. Si ricalcolano ad ogni disegno, quindi seguono
 * automaticamente la piega successiva quando la piu' esterna viene cancellata.
 */
export function flangeQuotes(part) {
  if (!part?.outer?.bbox) return [];
  const quotes = [];
  for (const axis of ['x', 'y']) {
    const spans = flangeSpans(part, axis);
    if (spans.min) {
      quotes.push({
        axis,
        side: 'min',
        from: Math.min(spans.min.edge, spans.min.bend),
        to: Math.max(spans.min.edge, spans.min.bend),
      });
    }
    if (spans.max) {
      quotes.push({
        axis,
        side: 'max',
        from: Math.min(spans.max.edge, spans.max.bend),
        to: Math.max(spans.max.edge, spans.max.bend),
      });
    }
  }
  return quotes;
}

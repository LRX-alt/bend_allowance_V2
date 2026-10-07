import { describe, expect, it } from 'vitest';
import { importDxf } from '@sviluppolamiera/dxf';
import { createPart, regenerateFeatureLoop } from '@sviluppolamiera/part-model';
import { MATRICI, PUNZONI } from '@/calculator/toolCatalog.js';
import { applyDimensionEdit, flangeQuotes, quoteSpan } from './dimensionEdit.js';

const confirmed = { unitsConfirmedByUser: true, sourceFormat: 'manual' };

function line(id, x0, y0, x1, y1) {
  return { id, kind: 'line', a: { x: x0, y: y0 }, b: { x: x1, y: y1 } };
}

function rectLoop(id, x, y, w, h) {
  return {
    id,
    closed: true,
    signedArea: 0,
    bbox: { minX: x, minY: y, maxX: x + w, maxY: y + h },
    curves: [
      line(`${id}-b`, x, y, x + w, y),
      line(`${id}-r`, x + w, y, x + w, y + h),
      line(`${id}-t`, x + w, y + h, x, y + h),
      line(`${id}-l`, x, y + h, x, y),
    ],
  };
}

function hole(id, x, y, diameter) {
  return {
    id,
    kind: 'hole',
    loopId: `loop-${id}`,
    center: { x, y },
    diameter,
    anchor: { x: 'unset', y: 'unset' },
    locked: false,
  };
}

function bendLine(id, x0, y0, x1, y1) {
  return { id, a: { x: x0, y: y0 }, b: { x: x1, y: y1 }, source: 'manual' };
}

function slot(id, x0, y0, x1, y1, width) {
  return {
    id,
    kind: 'slot',
    loopId: `loop-${id}`,
    p0: { x: x0, y: y0 },
    p1: { x: x1, y: y1 },
    width,
    anchor: { x: 'unset', y: 'unset' },
    locked: false,
  };
}

/** Contorno rettangolare con una scantonatura (tacca) sul bordo superiore, centrata su `notchX`. */
function notchedRectLoop(id, w, h, notchX, notchWidth, notchDepth) {
  const left = notchX - notchWidth / 2;
  const right = notchX + notchWidth / 2;
  return {
    id,
    closed: true,
    signedArea: 0,
    bbox: { minX: 0, minY: 0, maxX: w, maxY: h },
    curves: [
      line(`${id}-1`, 0, 0, w, 0),
      line(`${id}-2`, w, 0, w, h),
      line(`${id}-3`, w, h, right, h),
      line(`${id}-4`, right, h, right, h - notchDepth),
      line(`${id}-5`, right, h - notchDepth, left, h - notchDepth),
      line(`${id}-6`, left, h - notchDepth, left, h),
      line(`${id}-7`, left, h, 0, h),
      line(`${id}-8`, 0, h, 0, 0),
    ],
  };
}

function sheet(w, h, features = [], extra = {}) {
  return createPart({
    outer: rectLoop('out', 0, 0, w, h),
    inner: features.map(feature => regenerateFeatureLoop(feature)),
    features,
    provenance: confirmed,
    ...extra,
  });
}

function rectangle(width, height) {
  return [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '9',
    '$INSUNITS',
    '70',
    '4',
    '0',
    'ENDSEC',
    '0',
    'SECTION',
    '2',
    'ENTITIES',
    '0',
    'LWPOLYLINE',
    '8',
    '0',
    '90',
    '4',
    '70',
    '1',
    '10',
    '0',
    '20',
    '0',
    '10',
    String(width),
    '20',
    '0',
    '10',
    String(width),
    '20',
    String(height),
    '10',
    '0',
    '20',
    String(height),
    '0',
    'ENDSEC',
    '0',
    'EOF',
    '',
  ].join('\n');
}

describe('modifica quota dal disegno', () => {
  it('allunga la larghezza dell ingombro in modo simmetrico', () => {
    const part = importDxf(rectangle(100, 40), { confirmUnits: 'mm' }).part;
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 100, next: 130 });
    expect(result.ok).toBe(true);
    expect(result.part.outer.bbox.minX).toBeCloseTo(-15, 3);
    expect(result.part.outer.bbox.maxX).toBeCloseTo(115, 3);
    expect(result.part.outer.bbox.maxY - result.part.outer.bbox.minY).toBeCloseTo(40, 3);
  });

  it('riconosce la quota tra due linee di piega', () => {
    const part = {
      outer: { bbox: { minX: 0, minY: 0, maxX: 115, maxY: 100 } },
      bendLines: [
        { a: { x: 48, y: 0 }, b: { x: 48, y: 100 } },
        { a: { x: 76, y: 0 }, b: { x: 76, y: 100 } },
      ],
    };
    expect(quoteSpan(part, 24, 108, 48)).toEqual({ axis: 'x', from: 0, to: 48 });
    expect(quoteSpan(part, 62, 108, 28)).toEqual({ axis: 'x', from: 48, to: 76 });
  });

  it('allarga simmetricamente un ingombro senza pieghe', () => {
    const part = sheet(100, 40);
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 100, next: 130 });
    expect(result.ok).toBe(true);
    expect(result.part.outer.bbox.minX).toBeCloseTo(-15, 3);
    expect(result.part.outer.bbox.maxX).toBeCloseTo(115, 3);
  });

  it('allarga simmetricamente lasciando fermi i fori centrali (larghezza e altezza)', () => {
    const features = [
      hole('a', 60, 50, 10),
      hole('b', 120, 50, 10),
      hole('c', 180, 50, 10),
      hole('d', 240, 50, 10),
    ];
    const part = sheet(300, 100, features);
    const widened = applyDimensionEdit(part, { axis: 'x', from: 0, to: 300, next: 340 });
    expect(widened.ok).toBe(true);
    expect(widened.part.outer.bbox.minX).toBeCloseTo(-20, 3);
    expect(widened.part.outer.bbox.maxX).toBeCloseTo(320, 3);
    for (const feature of widened.part.features) {
      const before = features.find(item => item.id === feature.id);
      expect(feature.center.x).toBeCloseTo(before.center.x, 3);
    }

    const heightened = applyDimensionEdit(part, { axis: 'y', from: 0, to: 100, next: 140 });
    expect(heightened.ok).toBe(true);
    expect(heightened.part.outer.bbox.minY).toBeCloseTo(-20, 3);
    expect(heightened.part.outer.bbox.maxY).toBeCloseTo(120, 3);
    for (const feature of heightened.part.features) {
      const before = features.find(item => item.id === feature.id);
      expect(feature.center.y).toBeCloseTo(before.center.y, 3);
    }
  });

  it('la correzione va nel corpo: flange e pieghe restano della stessa misura, ogni foro mantiene la distanza dalla sua piega', () => {
    const features = [
      hole('flange', 10, 50, 4),
      hole('left-body', 100, 50, 10),
      hole('right-body', 200, 50, 10),
    ];
    const part = sheet(300, 100, features, {
      bendLines: [bendLine('bend-left', 30, 0, 30, 100), bendLine('bend-right', 270, 0, 270, 100)],
    });
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 300, next: 340 });
    expect(result.ok).toBe(true);
    const flange = result.part.features.find(item => item.id === 'flange');
    const leftBody = result.part.features.find(item => item.id === 'left-body');
    const rightBody = result.part.features.find(item => item.id === 'right-body');
    const left = result.part.bendLines.find(item => item.id === 'bend-left');
    const right = result.part.bendLines.find(item => item.id === 'bend-right');
    // Il taglio cade nel mezzo del corpo libero: 40 mm, 20 mm per lato.
    expect(left.a.x).toBeCloseTo(10, 3);
    expect(right.a.x).toBeCloseTo(290, 3);
    // Le flange restano della stessa misura: bordo e piega si spostano insieme.
    expect(left.a.x - result.part.outer.bbox.minX).toBeCloseTo(30, 3);
    expect(result.part.outer.bbox.maxX - right.a.x).toBeCloseTo(30, 3);
    expect(left.a.x - flange.center.x).toBeCloseTo(20, 3);
    // Ogni foro del corpo mantiene la distanza dalla sua piega.
    expect(leftBody.center.x - left.a.x).toBeCloseTo(70, 3);
    expect(right.a.x - rightBody.center.x).toBeCloseTo(70, 3);
    // Cresce solo l'interasse centrale, di tutta la differenza (40 mm).
    expect(rightBody.center.x - leftBody.center.x).toBeCloseTo(140, 3);
  });

  it('ogni foro mantiene la distanza dalla sua piega, gli interassi vicini alle pieghe restano uguali', () => {
    const xs = [50, 90, 210, 250];
    const features = xs.map((x, index) => hole(`h${index}`, x, 50, 8));
    const part = sheet(300, 100, features, {
      bendLines: [bendLine('bend-left', 30, 0, 30, 100), bendLine('bend-right', 270, 0, 270, 100)],
    });
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 300, next: 301 });
    expect(result.ok).toBe(true);
    const left = result.part.bendLines.find(item => item.id === 'bend-left').a.x;
    const right = result.part.bendLines.find(item => item.id === 'bend-right').a.x;
    const moved = xs.map(
      (_, index) => result.part.features.find(f => f.id === `h${index}`).center.x
    );
    // 1 mm nel corpo: mezzo mm per lato, dove le pieghe stesse si spostano con la loro flangia.
    expect(left).toBeCloseTo(29.5, 3);
    expect(right).toBeCloseTo(270.5, 3);
    expect(moved[0] - left).toBeCloseTo(20, 3);
    expect(moved[1] - left).toBeCloseTo(60, 3);
    expect(right - moved[2]).toBeCloseTo(60, 3);
    expect(right - moved[3]).toBeCloseTo(20, 3);
    expect(moved[1] - moved[0]).toBeCloseTo(40, 3);
    expect(moved[3] - moved[2]).toBeCloseTo(40, 3);
    // Cresce solo l'interasse centrale, dell'intera differenza (1 mm).
    expect(moved[2] - moved[1]).toBeCloseTo(121, 3);
    expect(result.part.outer.bbox.maxX - result.part.outer.bbox.minX).toBeCloseTo(301, 3);
  });

  it('la piega resta al centro di una scantonatura e la flangia non cambia misura', () => {
    const part = createPart({
      outer: notchedRectLoop('out', 300, 100, 30, 4, 10),
      inner: [],
      features: [],
      provenance: confirmed,
      bendLines: [bendLine('bend', 30, 0, 30, 100)],
    });
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 300, next: 310 });
    expect(result.ok).toBe(true);
    const bend = result.part.bendLines.find(item => item.id === 'bend');
    const { minX, maxX } = result.part.outer.bbox;
    const notchXs = result.part.outer.curves
      .filter(
        curve =>
          Math.abs(curve.a.x - curve.b.x) < 0.01 && curve.a.x > minX + 1 && curve.a.x < maxX - 1
      )
      .map(curve => curve.a.x);
    const notchMin = Math.min(...notchXs);
    const notchMax = Math.max(...notchXs);
    expect((notchMin + notchMax) / 2).toBeCloseTo(bend.a.x, 3);
    expect(notchMax - notchMin).toBeCloseTo(4, 3);
    expect(bend.a.x - result.part.outer.bbox.minX).toBeCloseTo(30, 3);
  });

  it('blocca la modifica quando nel corpo non c e spazio libero dalle lavorazioni', () => {
    const features = [slot('full', 31, 50, 269, 50, 4)];
    const part = sheet(300, 100, features, {
      bendLines: [bendLine('bend-left', 30, 0, 30, 100), bendLine('bend-right', 270, 0, 270, 100)],
    });
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 300, next: 310 });
    expect(result.ok).toBe(false);
    expect(result.blocking.some(item => item.code === 'DIM-001')).toBe(true);
  });

  it('quota la flangia tra bordo e piega, poi segue la piega successiva dopo la cancellazione', () => {
    const part = sheet(100, 60, [], {
      bendLines: [bendLine('bend', 20, 0, 20, 60)],
    });
    const quotesBefore = flangeQuotes(part);
    expect(quotesBefore).toContainEqual(
      expect.objectContaining({ axis: 'x', side: 'min', from: 0, to: 20 })
    );

    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 20, next: 30 });
    expect(result.ok).toBe(true);
    expect(result.part.outer.bbox.minX).toBeCloseTo(-10, 3);
    const bend = result.part.bendLines.find(item => item.id === 'bend');
    expect(bend.a.x).toBeCloseTo(20, 3);
  });

  it('con pieghe doppie (BEND + BEND_EXTENT) le due linee contano come una piega sola e la flangia non cambia', () => {
    const features = [hole('base', 200, 50, 10)];
    const part = sheet(300, 100, features, {
      bendLines: [
        bendLine('bend-left', 20, 0, 20, 100),
        bendLine('bend-left-extent', 22, 0, 22, 100),
        bendLine('bend-right', 280, 0, 280, 100),
        bendLine('bend-right-extent', 278, 0, 278, 100),
      ],
    });
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 300, next: 340 });
    expect(result.ok).toBe(true);
    const left = result.part.bendLines.find(item => item.id === 'bend-left');
    const leftExtent = result.part.bendLines.find(item => item.id === 'bend-left-extent');
    const right = result.part.bendLines.find(item => item.id === 'bend-right');
    const rightExtent = result.part.bendLines.find(item => item.id === 'bend-right-extent');
    expect(leftExtent.a.x - left.a.x).toBeCloseTo(2, 3);
    expect(left.a.x - result.part.outer.bbox.minX).toBeCloseTo(20, 3);
    expect(right.a.x - rightExtent.a.x).toBeCloseTo(2, 3);
    expect(result.part.outer.bbox.maxX - right.a.x).toBeCloseTo(20, 3);
    const base = result.part.features.find(item => item.id === 'base');
    // Il foro e' nella meta' destra: segue la piega destra e mantiene la sua distanza da essa.
    expect(right.a.x - base.center.x).toBeCloseTo(80, 3);
  });

  it('quota solo la piega piu esterna tra due vicine al bordo', () => {
    const part = sheet(100, 60, [], {
      bendLines: [bendLine('near', 18, 0, 18, 60), bendLine('far', 20, 0, 20, 60)],
    });
    const quotes = flangeQuotes(part);
    const minQuote = quotes.find(item => item.axis === 'x' && item.side === 'min');
    expect(minQuote.to).toBeCloseTo(18, 3);

    const afterDelete = sheet(100, 60, [], { bendLines: [bendLine('far', 20, 0, 20, 60)] });
    const nextQuotes = flangeQuotes(afterDelete);
    const nextMin = nextQuotes.find(item => item.axis === 'x' && item.side === 'min');
    expect(nextMin.to).toBeCloseTo(20, 3);
  });
});

describe('catalogo utensili', () => {
  it('elenca punzoni e matrici con raggio o apertura validi', () => {
    expect(new Set(PUNZONI.map(item => item.id)).size).toBe(PUNZONI.length);
    expect(new Set(MATRICI.map(item => item.id)).size).toBe(MATRICI.length);
    expect(PUNZONI.every(item => item.radius >= 0 && item.gruppo && item.label)).toBe(true);
    expect(MATRICI.every(item => item.opening > 0 && item.gruppo && item.label)).toBe(true);
    expect(MATRICI.some(item => item.opening === 16)).toBe(true);
    expect(PUNZONI.some(item => item.radius === 0.8)).toBe(true);
  });
});

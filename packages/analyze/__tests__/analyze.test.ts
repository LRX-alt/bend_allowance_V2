import { describe, expect, it } from 'vitest';
import type { Curve, Loop } from '@sviluppolamiera/geom2d';
import { createPart, regenerateFeatureLoop, type Feature, type Part } from '@sviluppolamiera/part-model';
import { calcolaAperturaMatrice, calcolaLatoMinimo } from '@sviluppolamiera/bend-core';
import { applyAutomatic, bendSheetHtml, buildCleanupPlan, evaluateProducibility, exportDecision } from '../src/index';

const confirmed = { unitsConfirmedByUser: true, sourceFormat: 'manual' as const };

function line(id: string, x0: number, y0: number, x1: number, y1: number): Curve {
  return { id, kind: 'line', a: { x: x0, y: y0 }, b: { x: x1, y: y1 } };
}

function rect(w: number, h: number): Loop {
  return {
    id: 'out',
    closed: true,
    signedArea: 0,
    bbox: { minX: 0, minY: 0, maxX: w, maxY: h },
    curves: [line('b', 0, 0, w, 0), line('r', w, 0, w, h), line('t', w, h, 0, h), line('l', 0, h, 0, 0)],
  };
}

function hole(x: number, y: number, diameter: number): Feature {
  return { id: 'foro', kind: 'hole', loopId: 'loop-foro', center: { x, y }, diameter, anchor: { x: 'unset', y: 'unset' }, locked: false };
}

function piece(w: number, h: number, bendX: number, feature: Feature | null, extra: Partial<Part> = {}): Part {
  const features = feature ? [feature] : [];
  return createPart({
    outer: rect(w, h),
    inner: features.map(item => regenerateFeatureLoop(item)),
    features,
    thickness: 2,
    material: { dbId: 'steel_mild' },
    bendLines: [{ id: 'piega', a: { x: bendX, y: 0 }, b: { x: bendX, y: h }, angleDeg: 90, innerRadius: 1, direction: 'up', source: 'manual', zoneHalfWidth: 3 }],
    provenance: confirmed,
    ...extra,
  });
}

describe('producibilita', () => {
  const opening = calcolaAperturaMatrice(2, 'airBend', 'acciaio');
  const flange = calcolaLatoMinimo({ V: opening.aperturaOttimale, pieghe: 1 });
  const wide = flange.consigliato + 30;

  it('un foro lontano e un lembo lungo passano', () => {
    const part = piece(wide * 2, 200, wide, hole(12, 100, 8));
    const codes = evaluateProducibility(part).map(item => item.code);
    expect(codes).not.toContain('BND-003');
    expect(codes).not.toContain('BND-004');
    expect(codes).not.toContain('BND-005');
  });

  it('un foro nella zona di piega fallisce con BND-003', () => {
    const part = piece(wide * 2, 200, wide, hole(wide, 100, 8));
    expect(evaluateProducibility(part).some(item => item.code === 'BND-003' && item.severity === 'error')).toBe(true);
  });

  it('un foro appena fuori zona avvisa con BND-004', () => {
    const part = piece(wide * 2, 200, wide, hole(wide + 7.5, 100, 8));
    const codes = evaluateProducibility(part).filter(item => item.geometryRefs?.includes('foro')).map(item => item.code);
    expect(codes).toContain('BND-004');
    expect(codes).not.toContain('BND-003');
  });

  it('un lembo sotto il minimo geometrico e un errore, fra geometrico e consigliato e un avviso', () => {
    const short = piece(flange.geometrico * 0.4, 200, flange.geometrico * 0.2, null);
    expect(evaluateProducibility(short).some(item => item.code === 'BND-005' && item.severity === 'error')).toBe(true);
    const mid = (flange.geometrico + flange.consigliato) / 2;
    const between = piece(mid * 2, 200, mid, null);
    const warnings = evaluateProducibility(between).filter(item => item.code === 'BND-005');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.every(item => item.severity === 'warning')).toBe(true);
  });

  it('senza spessore emette solo BND-006', () => {
    const part = piece(100, 80, 50, hole(50, 40, 8), { thickness: undefined });
    const result = evaluateProducibility(part);
    expect(result.map(item => item.code)).toEqual(['BND-006']);
  });

  it('una V usata sostituisce la cava consigliata nel controllo del lembo', () => {
    const part = piece(20, 200, 10, null);
    expect(evaluateProducibility(part).some(item => item.code === 'BND-005' && item.severity === 'error')).toBe(
      false
    );
    const withDie = {
      ...part,
      bendSetup: { ...part.bendSetup, vOpening: 24 },
    };
    expect(
      evaluateProducibility(withDie).some(item => item.code === 'BND-005' && item.severity === 'error')
    ).toBe(true);
  });

  it('senza materiale non giudica il lembo e emette BND-007', () => {
    const part = piece(40, 80, 20, null, { material: undefined });
    const result = evaluateProducibility(part);
    expect(result.some(item => item.code === 'BND-007')).toBe(true);
    expect(result.some(item => item.code === 'BND-005')).toBe(false);
  });
});

describe('pulizia e gate', () => {
  it('il gap si propone e la pulizia automatica non sposta i vertici', () => {
    const outer: Loop = {
      id: 'out',
      closed: true,
      signedArea: 1,
      bbox: { minX: 0, minY: 0, maxX: 100, maxY: 50 },
      curves: [
        line('b', 0, 0, 100, 0),
        line('r', 100, 0, 100, 50),
        line('t', 100, 50, 0, 50),
        line('l', 0, 50, 0, 1),
      ],
    };
    const part = createPart({ outer, openPaths: [{ id: 'open', closed: false, signedArea: 0, bbox: { minX: 0, minY: 0, maxX: 10, maxY: 0 }, curves: [line('zero', 0, 0, 0, 0), line('real', 0, 0, 10, 0)] }], provenance: confirmed });
    const before = part.openPaths[0]!.curves.find(curve => curve.id === 'real');
    const plan = buildCleanupPlan(part);
    expect(plan.proposed.some(action => action.kind === 'close-gap')).toBe(true);
    expect(plan.forbidden.some(action => action.kind === 'assign-anchor')).toBe(true);
    const cleaned = applyAutomatic(part);
    const after = cleaned.openPaths[0]!.curves.find(curve => curve.id === 'real');
    expect(cleaned.openPaths[0]!.curves.some(curve => curve.id === 'zero')).toBe(false);
    expect(after).toEqual(before);
    expect(cleaned.features.every(feature => feature.anchor.x === 'unset')).toBe(true);
  });

  it('il gate distingue valido, avvisi e non esportabile', () => {
    const ready = createPart({ outer: rect(80, 40), provenance: confirmed });
    expect(exportDecision(ready).status).toBe('valid');
    const unconfirmed = createPart({ outer: rect(80, 40) });
    expect(exportDecision(unconfirmed).status).toBe('blocked');
    const micro = createPart({
      outer: rect(80, 40),
      openPaths: [{ id: 'm', closed: false, signedArea: 0, bbox: { minX: 0, minY: 0, maxX: 0.02, maxY: 0 }, curves: [line('micro', 0, 0, 0.02, 0)] }],
      provenance: confirmed,
    });
    expect(exportDecision(micro).status).toBe('warnings');
  });
});

describe('scheda di piega', () => {
  it('elenca tre pieghe, lo sviluppo e l apertura V', () => {
    const part = createPart({
      outer: rect(400, 200),
      thickness: 2,
      material: { dbId: 'steel_mild' },
      bendLines: [80, 180, 280].map((x, index) => ({
        id: `p${index}`,
        a: { x, y: 0 },
        b: { x, y: 200 },
        angleDeg: 90,
        innerRadius: 1,
        direction: 'up' as const,
        source: 'manual' as const,
        zoneHalfWidth: 3,
      })),
      provenance: confirmed,
    });
    const html = bendSheetHtml(part);
    expect(html).toContain('Scheda di piega');
    expect(html).toContain('400.00');
    expect(html).toContain('200.00');
    expect(html.match(/<tr><td>/g)?.length).toBe(3);
    expect(html).toContain('Apertura V');
  });
});

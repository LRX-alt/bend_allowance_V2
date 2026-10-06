import { describe, expect, it } from 'vitest';
import { createPart } from '@sviluppolamiera/part-model';
import { applyBendSetup } from './radiusPolicy.js';

const confirmed = { unitsConfirmedByUser: true, sourceFormat: 'manual' };

function piece(innerRadius = 2) {
  return createPart({
    outer: {
      id: 'out',
      closed: true,
      signedArea: 1,
      bbox: { minX: 0, minY: 0, maxX: 100, maxY: 40 },
      curves: [],
    },
    bendLines: [
      {
        id: 'piega',
        a: { x: 40, y: 0 },
        b: { x: 40, y: 40 },
        angleDeg: 90,
        innerRadius,
        source: 'manual',
      },
      {
        id: 'vuota',
        a: { x: 70, y: 0 },
        b: { x: 70, y: 40 },
        source: 'manual',
      },
    ],
    provenance: confirmed,
    thickness: 2,
  });
}

describe('applyBendSetup', () => {
  it('un pezzo senza policy non riscrive i raggi', () => {
    const part = piece();
    const next = applyBendSetup(part, { process: 'bottoming' }, {});
    expect(next.part.bendLines[0].innerRadius).toBe(2);
    expect(next.part.bendLines[1].innerRadius).toBeUndefined();
    expect(next.part.bendSetup.punch).toBeUndefined();
    expect(next.part.bendSetup.radiusPolicy).toBeUndefined();
    expect(next.part.bendSetup.process).toBe('bottoming');
  });

  it('il misurato 10 scrive le linee e il ritorno a manuale ripristina', () => {
    const part = piece(2);
    const applied = applyBendSetup(
      part,
      {
        punch: { radius: 10 },
        vOpening: 24,
        radiusPolicy: { source: 'measured', measuredInside: 10 },
      },
      {}
    );
    expect(applied.part.bendLines[0].innerRadius).toBe(10);
    expect(applied.part.bendLines[1].innerRadius).toBeUndefined();
    expect(applied.savedManualRadii.piega).toBe(2);
    expect(applied.part.bendSetup.punch.radius).toBe(10);
    expect(applied.part.bendSetup.vOpening).toBe(24);
    const back = applyBendSetup(
      applied.part,
      { radiusPolicy: { source: 'manual' } },
      applied.savedManualRadii
    );
    expect(back.part.bendLines[0].innerRadius).toBe(2);
    expect(back.savedManualRadii).toEqual({});
    expect(back.part.bendSetup.punch.radius).toBe(10);
  });

  it('una misura mancante non tocca innerRadius', () => {
    const part = piece(2);
    const next = applyBendSetup(part, { radiusPolicy: { source: 'measured' } }, {});
    expect(next.part.bendLines[0].innerRadius).toBe(2);
    expect(next.savedManualRadii).toEqual({});
    expect(next.part.bendSetup.radiusPolicy).toEqual({ source: 'measured' });
  });

  it('cambiare la V non muove il raggio', () => {
    const part = piece(4);
    const next = applyBendSetup(part, { vOpening: 40, punch: { radius: 15 } }, {});
    expect(next.part.bendLines[0].innerRadius).toBe(4);
    expect(next.part.bendSetup.vOpening).toBe(40);
    expect(next.part.bendSetup.punch.radius).toBe(15);
  });
});

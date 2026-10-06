import { describe, expect, it } from 'vitest';
import type { Curve, Loop } from '@sviluppolamiera/geom2d';
import { createPart } from '@sviluppolamiera/part-model';
import { flatLength, partToBendInput } from '../src/index';

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

function piece(material?: { dbId: string; kFactorOverride?: number }) {
  return createPart({
    outer: rect(100, 40),
    thickness: 2,
    material,
    bendLines: [
      {
        id: 'piega',
        a: { x: 50, y: 0 },
        b: { x: 50, y: 40 },
        angleDeg: 90,
        innerRadius: 2,
        source: 'manual',
      },
    ],
    provenance: confirmed,
  });
}

describe('fattore K del pezzo', () => {
  it('senza materiale resta 0.33', () => {
    const adapted = partToBendInput(piece());
    expect('input' in adapted && adapted.input.K).toBe(0.33);
  });

  it('con materiale e senza override usa il K della lega', () => {
    const part = piece({ dbId: 'steel_s275' });
    const adapted = partToBendInput(part);
    expect('input' in adapted && adapted.input.K).toBe(0.35);
    const length = flatLength(part);
    const legacy = flatLength({
      ...part,
      material: { dbId: 'steel_s275', kFactorOverride: 0.33 },
    });
    expect('length' in length && 'length' in legacy && length.length).not.toBeCloseTo(legacy.length, 6);
  });

  it('l override resta l unico K scritto, il punzone no', () => {
    const punch = { radius: 10 };
    const part = piece({ dbId: 'steel_s275', kFactorOverride: 0.4 });
    part.bendSetup = { ...part.bendSetup, punch };
    const adapted = partToBendInput(part);
    expect('input' in adapted && adapted.input.K).toBe(0.4);
    expect(part.bendSetup.punch?.radius).toBe(10);
  });
});

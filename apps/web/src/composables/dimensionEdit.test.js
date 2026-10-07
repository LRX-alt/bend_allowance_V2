import { describe, expect, it } from 'vitest';
import { importDxf } from '@sviluppolamiera/dxf';
import { MATRICI, PUNZONI } from '@/calculator/toolCatalog.js';
import { applyDimensionEdit, quoteSpan } from './dimensionEdit.js';

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
  it('allunga la larghezza tenendo fermo il lato sinistro', () => {
    const part = importDxf(rectangle(100, 40), { confirmUnits: 'mm' }).part;
    const result = applyDimensionEdit(part, { axis: 'x', from: 0, to: 100, next: 130 });
    expect(result.ok).toBe(true);
    expect(result.part.outer.bbox.minX).toBeCloseTo(0, 3);
    expect(result.part.outer.bbox.maxX).toBeCloseTo(130, 3);
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

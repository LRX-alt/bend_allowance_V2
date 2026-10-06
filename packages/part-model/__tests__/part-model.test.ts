import { describe, expect, it } from 'vitest';
import type { Curve, Loop } from '@sviluppolamiera/geom2d';
import {
  classifyLoop,
  commit,
  createEditorState,
  createPart,
  proposeGroups,
  regenerateFeatureLoop,
  serialize,
  deserialize,
  undo,
  redo,
  validatePart,
  type Feature,
} from '../src/index';

function line(id: string, x0: number, y0: number, x1: number, y1: number): Curve {
  return { id, kind: 'line', a: { x: x0, y: y0 }, b: { x: x1, y: y1 } };
}

function square(id: string, x: number, y: number, w: number, h: number): Loop {
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

const confirmed = { unitsConfirmedByUser: true, sourceFormat: 'manual' as const };

describe('validatePart', () => {
  it('un pezzo senza spessore e materiale e geometricamente valido', () => {
    const part = createPart({ outer: square('out', 0, 0, 100, 80), provenance: confirmed });
    const result = validatePart(part);
    expect(result.status).toBe('valid');
    expect(result.can.view).toBe(true);
    expect(result.can.measure).toBe(true);
    expect(result.can.editGeometry).toBe(true);
    expect(result.can.computeBend).toBe(false);
    expect(part.thickness).toBeUndefined();
    expect(part.material).toBeUndefined();
  });

  it('unita non confermate: misurabile, non modificabile', () => {
    const part = createPart({ outer: square('out', 0, 0, 80, 50) });
    const result = validatePart(part);
    expect(part.provenance.unitsConfirmedByUser).toBe(false);
    expect(result.status).toBe('incompleteForDomain');
    expect(result.can.measure).toBe(true);
    expect(result.can.editGeometry).toBe(false);
    expect(result.can.exportDxf).toBe(false);
  });

  it('contorno aperto, loop fuori, autointersezione e id duplicati sono invalidi', () => {
    const open = createPart({
      outer: { ...square('out', 0, 0, 10, 10), closed: false, curves: [line('solo', 0, 0, 10, 0)] },
      provenance: confirmed,
    });
    expect(validatePart(open).status).toBe('invalid');

    const outside = createPart({
      outer: square('out', 0, 0, 50, 50),
      inner: [square('far', 200, 200, 10, 10)],
      provenance: confirmed,
    });
    expect(validatePart(outside).status).toBe('invalid');

    const bow = createPart({
      outer: {
        id: 'bow',
        closed: true,
        signedArea: 1,
        bbox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        curves: [
          line('a', 0, 0, 10, 10),
          line('b', 10, 10, 10, 0),
          line('c', 10, 0, 0, 10),
          line('d', 0, 10, 0, 0),
        ],
      },
      provenance: confirmed,
    });
    expect(validatePart(bow).status).toBe('invalid');

    const dup = createPart({
      outer: {
        ...square('out', 0, 0, 20, 20),
        curves: [
          line('same', 0, 0, 20, 0),
          line('same', 20, 0, 20, 20),
          line('t', 20, 20, 0, 20),
          line('l', 0, 20, 0, 0),
        ],
      },
      provenance: confirmed,
    });
    expect(validatePart(dup).status).toBe('invalid');
  });
});

describe('feature', () => {
  it('un foro di diametro 10 si rigenera con raggio 5 e lo stesso loopId', () => {
    const feature: Feature = {
      id: 'f1',
      kind: 'hole',
      loopId: 'loop-foro',
      center: { x: 40, y: 30 },
      diameter: 10,
      anchor: { x: 'unset', y: 'unset' },
      locked: false,
    };
    const loop = regenerateFeatureLoop(feature);
    expect(loop.id).toBe('loop-foro');
    for (const curve of loop.curves) {
      expect(curve.kind === 'arc' && curve.r).toBe(5);
    }
    const again = regenerateFeatureLoop(feature, loop);
    expect(again.curves.map(c => c.id)).toEqual(loop.curves.map(c => c.id));
    expect(again.id).toBe(loop.id);
  });

  it('classifica foro, asola, rettangolo e sagoma con ancoraggio non impostato', () => {
    const hole = regenerateFeatureLoop({
      id: 'h',
      kind: 'hole',
      loopId: 'lh',
      center: { x: 0, y: 0 },
      diameter: 8,
      anchor: { x: 'unset', y: 'unset' },
      locked: false,
    });
    const classifiedHole = classifyLoop({ ...hole, signedArea: Math.abs(hole.signedArea) }, { point: 0.01, stitchSuggest: 0.05, micro: 0.05, angular: 0.001 });
    expect(classifiedHole.kind).toBe('hole');
    if (classifiedHole.kind === 'hole') expect(classifiedHole.diameter).toBeCloseTo(8, 6);
    expect(classifiedHole.anchor).toEqual({ x: 'unset', y: 'unset' });
    expect(classifiedHole.groupId).toBeUndefined();

    const slot = regenerateFeatureLoop({
      id: 's',
      kind: 'slot',
      loopId: 'ls',
      p0: { x: 0, y: 0 },
      p1: { x: 30, y: 0 },
      width: 10,
      anchor: { x: 'unset', y: 'unset' },
      locked: false,
    });
    const classifiedSlot = classifyLoop(slot, { point: 0.01, stitchSuggest: 0.05, micro: 0.05, angular: 0.001 });
    expect(classifiedSlot.kind).toBe('slot');
    if (classifiedSlot.kind === 'slot') {
      expect(classifiedSlot.width).toBeCloseTo(10, 6);
      expect(Math.hypot(classifiedSlot.p1.x - classifiedSlot.p0.x, classifiedSlot.p1.y - classifiedSlot.p0.y)).toBeCloseTo(30, 6);
    }

    const rectLoop = square('rect', 0, 0, 40, 20);
    rectLoop.signedArea = 800;
    const classifiedRect = classifyLoop(rectLoop, { point: 0.01, stitchSuggest: 0.05, micro: 0.05, angular: 0.001 });
    expect(classifiedRect.kind).toBe('rect');
    if (classifiedRect.kind === 'rect') expect(classifiedRect.cornerRadius).toBe(0);

    const generic = classifyLoop(
      {
        id: 'g',
        closed: true,
        signedArea: 1,
        bbox: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        curves: [line('a', 0, 0, 10, 1), line('b', 10, 1, 8, 6), line('c', 8, 6, 0, 0)],
      },
      { point: 0.01, stitchSuggest: 0.05, micro: 0.05, angular: 0.001 }
    );
    expect(generic.kind).toBe('generic');
    expect(generic.anchor).toEqual({ x: 'unset', y: 'unset' });
  });

  it('quattro fori a passo 30 producono una proposta e nessun groupId', () => {
    const features: Feature[] = [40, 70, 100, 130].map((x, i) => ({
      id: `h${i}`,
      kind: 'hole' as const,
      loopId: `l${i}`,
      center: { x, y: 20 },
      diameter: 6,
      anchor: { x: 'unset' as const, y: 'unset' as const },
      locked: false,
    }));
    const part = createPart({
      outer: square('out', 0, 0, 200, 80),
      features,
      provenance: confirmed,
    });
    const proposals = proposeGroups(part);
    expect(proposals).toHaveLength(1);
    expect(proposals[0]?.pitch).toBeCloseTo(30, 6);
    expect(part.features.every(f => f.groupId === undefined)).toBe(true);
  });
});

describe('serialize', () => {
  it('serialize(deserialize(s)) === s su dieci casi', () => {
    const cases = Array.from({ length: 10 }, (_, i) =>
      createPart({
        name: `Pezzo ${i}`,
        thickness: i % 2 === 0 ? 2 : undefined,
        material: i % 3 === 0 ? { dbId: 'steel_mild' } : undefined,
        outer: square('out', 0, 0, 100 + i, 40),
        inner: i % 2 === 0 ? [square('in', 10, 10, 8, 8)] : [],
        features:
          i % 2 === 0
            ? [
                {
                  id: 'f',
                  kind: 'hole',
                  loopId: 'in',
                  center: { x: 14, y: 14 },
                  diameter: 4,
                  anchor: { x: 'unset', y: 'unset' },
                  locked: false,
                },
              ]
            : [],
        bendLines: [{ id: 'b1', a: { x: 50, y: 0 }, b: { x: 50, y: 40 }, source: 'manual', angleDeg: 90 }],
        openPaths: [{ ...square('open', 0, 0, 5, 0), closed: false, curves: [line('op', 0, 0, 5, 0)] }],
        annotations: [{ id: 'n1', kind: 'text', layer: 'QUOTE', raw: { text: '500' } }],
        provenance: { ...confirmed, hadUnsupportedCurves: i === 3 },
      })
    );
    for (const part of cases) {
      const s = serialize(part);
      expect(serialize(deserialize(s))).toBe(s);
    }
  });
});

describe('undo', () => {
  it('ripristina una stringa identica', () => {
    const part = createPart({ outer: square('out', 0, 0, 100, 40), provenance: confirmed, thickness: 2 });
    let state = createEditorState(part);
    const before = serialize(state.current);
    const next = { ...part, name: 'Dopo' };
    state = commit(state, next, 'Rinominato');
    state = undo(state);
    expect(serialize(state.current)).toBe(before);
    state = redo(state);
    expect(state.current.name).toBe('Dopo');
  });
});

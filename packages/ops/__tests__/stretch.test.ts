import { describe, expect, it } from 'vitest';
import type { Curve, Loop } from '@sviluppolamiera/geom2d';
import {
  commit,
  confirmGroup,
  createEditorState,
  createPart,
  redo,
  regenerateFeatureLoop,
  serialize,
  undo,
  validatePart,
  type Feature,
  type Part,
} from '@sviluppolamiera/part-model';
import { compareParts, editFeature, stretchAlongAxis, zoneOf } from '../src/index';

const confirmed = { unitsConfirmedByUser: true, sourceFormat: 'manual' as const };

function line(id: string, x0: number, y0: number, x1: number, y1: number): Curve {
  return { id, kind: 'line', a: { x: x0, y: y0 }, b: { x: x1, y: y1 } };
}

function rectLoop(id: string, x: number, y: number, w: number, h: number): Loop {
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

function hole(id: string, x: number, y: number, diameter: number): Feature {
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

function slot(id: string, x0: number, y0: number, x1: number, y1: number, width: number): Feature {
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

function sheet(w: number, h: number, features: Feature[] = [], extra: Partial<Part> = {}): Part {
  return createPart({
    outer: rectLoop('out', 0, 0, w, h),
    inner: features.map(feature => regenerateFeatureLoop(feature)),
    features,
    provenance: confirmed,
    ...extra,
  });
}

function width(part: Part): number {
  return part.outer.bbox.maxX - part.outer.bbox.minX;
}

function height(part: Part): number {
  return part.outer.bbox.maxY - part.outer.bbox.minY;
}

function expectValid(result: { ok: boolean; part?: Part }): void {
  expect(result.ok).toBe(true);
  expect(result.part).toBeDefined();
  if (result.part) expect(validatePart(result.part).status).toBe('valid');
}

describe('stretchAlongAxis', () => {
  it('test 1 rettangolo semplice', () => {
    const part = sheet(500, 300);
    const ids = part.outer.curves.map(curve => curve.id);
    const result = stretchAlongAxis(part, { axis: 'x', delta: 5.3, mode: 'leftFixed' });
    expectValid(result);
    const next = result.part!;
    expect(width(next)).toBeCloseTo(505.3, 6);
    expect(next.outer.bbox.minX).toBeCloseTo(part.outer.bbox.minX, 6);
    expect(height(next)).toBeCloseTo(300, 6);
    expect(next.outer.curves.map(curve => curve.id)).toEqual(ids);
  });

  it('test 2 fori e politiche di ancoraggio', () => {
    const features = [hole('a', 50, 150, 10), hole('b', 250, 150, 10), hole('c', 450, 150, 10)];
    const part = sheet(500, 300, features);
    const min = stretchAlongAxis(part, { axis: 'x', delta: 5.3, mode: 'leftFixed', anchorPolicy: { kind: 'followMinEdge' } });
    expectValid(min);
    for (const feature of min.part!.features) {
      if (feature.kind !== 'hole') continue;
      const before = features.find(item => item.id === feature.id);
      expect(feature.center.x).toBe(before && before.kind === 'hole' ? before.center.x : 0);
      expect(feature.diameter).toBe(10);
    }
    const max = stretchAlongAxis(part, { axis: 'x', delta: 5.3, mode: 'leftFixed', anchorPolicy: { kind: 'followMaxEdge' } });
    expectValid(max);
    for (const feature of max.part!.features) {
      if (feature.kind !== 'hole') continue;
      const before = features.find(item => item.id === feature.id);
      expect(feature.center.x).toBeCloseTo((before && before.kind === 'hole' ? before.center.x : 0) + 5.3, 6);
      expect(feature.diameter).toBe(10);
    }
    const abs = stretchAlongAxis(part, { axis: 'x', delta: 5.3, mode: 'leftFixed', anchorPolicy: { kind: 'keepAbsolute' } });
    expectValid(abs);
    for (const feature of abs.part!.features) {
      if (feature.kind !== 'hole') continue;
      const before = features.find(item => item.id === feature.id);
      expect(feature.center.x).toBe(before && before.kind === 'hole' ? before.center.x : 0);
    }
    const report = compareParts(part, max.part!);
    expect(report.diametersUnchanged).toBe(true);
    expect(report.holesBefore).toBe(3);
    expect(report.holesAfter).toBe(3);
  });

  it('test 2b ancoraggio non dichiarato', () => {
    const part = sheet(500, 300, [hole('a', 50, 150, 10)]);
    const result = stretchAlongAxis(part, { axis: 'x', delta: 5.3, mode: 'leftFixed' });
    expect(result.ok).toBe(false);
    expect(result.part).toBeUndefined();
    expect(result.blocking.some(item => item.code === 'OPS-008')).toBe(true);
  });

  it('test 3 asole rigide', () => {
    const features = [slot('h', 100, 100, 160, 100, 12), slot('v', 400, 80, 400, 140, 10)];
    const part = sheet(500, 300, features);
    const result = stretchAlongAxis(part, { axis: 'x', delta: -10, mode: 'rightFixed', anchorPolicy: { kind: 'followMinEdge' } });
    expectValid(result);
    const horizontal = result.part!.features.find(feature => feature.id === 'h');
    const vertical = result.part!.features.find(feature => feature.id === 'v');
    expect(horizontal?.kind).toBe('slot');
    expect(vertical?.kind).toBe('slot');
    if (horizontal?.kind === 'slot' && vertical?.kind === 'slot') {
      expect(Math.hypot(horizontal.p1.x - horizontal.p0.x, horizontal.p1.y - horizontal.p0.y)).toBeCloseTo(60, 9);
      expect(Math.hypot(vertical.p1.x - vertical.p0.x, vertical.p1.y - vertical.p0.y)).toBeCloseTo(60, 9);
      expect(horizontal.width).toBe(12);
      expect(vertical.width).toBe(10);
      expect(Math.abs(Math.hypot(horizontal.p1.x - horizontal.p0.x, horizontal.p1.y - horizontal.p0.y) - 60)).toBeLessThan(1e-9);
    }
  });

  it('test 4 foro vicino al bordo', () => {
    const part = sheet(400, 300, [hole('edge', 6, 150, 8)], { thickness: 2 });
    const kept = stretchAlongAxis(part, { axis: 'x', delta: -20, mode: 'rightFixed', anchorPolicy: { kind: 'followMinEdge' } });
    expectValid(kept);
    expect(kept.warnings.some(item => item.code === 'FEA-004')).toBe(true);
    const escaped = stretchAlongAxis(part, { axis: 'x', delta: -20, mode: 'rightFixed', anchorPolicy: { kind: 'keepAbsolute' } });
    expect(escaped.ok).toBe(false);
    expect(escaped.part).toBeUndefined();
    expect(escaped.blocking.some(item => item.code === 'OPS-005')).toBe(true);
  });

  it('test 5 gruppi confermati', () => {
    const groupA = [40, 70, 100, 130].map((x, i) => hole(`a${i}`, x, 150, 8));
    const groupB = [370, 400, 430, 460].map((x, i) => hole(`b${i}`, x, 150, 8));
    let part = sheet(500, 300, [...groupA, ...groupB]);
    part = confirmGroup(part, groupA.map(feature => feature.id), 'A');
    part = confirmGroup(part, groupB.map(feature => feature.id), 'B');
    part = {
      ...part,
      features: part.features.map(feature => ({ ...feature, anchor: { x: 'group' as const, y: 'unset' as const } })),
    };
    const result = stretchAlongAxis(part, {
      axis: 'x',
      delta: 100,
      mode: 'manualZones',
      cuts: [200, 300],
      zoneOffsets: [0, 0, 100],
    });
    expectValid(result);
    const next = result.part!;
    expect(width(next)).toBeCloseTo(600, 6);
    const xs = (id: string) => {
      const feature = next.features.find(item => item.id === id);
      return feature && feature.kind === 'hole' ? feature.center.x : NaN;
    };
    expect(xs('a0')).toBeCloseTo(40, 6);
    expect(xs('a3')).toBeCloseTo(130, 6);
    expect(xs('b0')).toBeCloseTo(470, 6);
    expect(xs('b3')).toBeCloseTo(560, 6);
    for (const pair of [['a0', 'a1'], ['a1', 'a2'], ['b0', 'b1'], ['b2', 'b3']] as const) {
      expect(xs(pair[1]) - xs(pair[0])).toBeCloseTo(30, 6);
    }
  });

  it('test 6 archi', () => {
    const outer: Loop = {
      id: 'pista',
      closed: true,
      signedArea: 0,
      bbox: { minX: 0, minY: 0, maxX: 500, maxY: 300 },
      curves: [
        line('bottom', 150, 0, 350, 0),
        { id: 'right', kind: 'arc', c: { x: 350, y: 150 }, r: 150, a0: -Math.PI / 2, a1: Math.PI / 2, ccw: true },
        line('top', 350, 300, 150, 300),
        { id: 'left', kind: 'arc', c: { x: 150, y: 150 }, r: 150, a0: Math.PI / 2, a1: (3 * Math.PI) / 2, ccw: true },
      ],
    };
    const part = createPart({ outer, provenance: confirmed });
    expect(validatePart(part).status).toBe('valid');
    const blocked = stretchAlongAxis(part, { axis: 'x', delta: 20, mode: 'leftFixed', cuts: [50] });
    expect(blocked.ok).toBe(false);
    expect(blocked.blocking.some(item => item.code === 'OPS-001')).toBe(true);
    const result = stretchAlongAxis(part, { axis: 'x', delta: 20, mode: 'leftFixed', cuts: [250] });
    expectValid(result);
    expect(width(result.part!)).toBeCloseTo(520, 6);
    expect(height(result.part!)).toBeCloseTo(300, 6);
    for (const curve of result.part!.outer.curves) {
      if (curve.kind === 'arc') expect(curve.r).toBe(150);
    }
  });

  it('test 7 zone multiple', () => {
    const groups = [
      [80, 110, 140].map((x, i) => hole(`a${i}`, x, 100, 8)),
      [350, 380, 410].map((x, i) => hole(`b${i}`, x, 100, 8)),
      [650, 680, 710].map((x, i) => hole(`c${i}`, x, 100, 8)),
    ];
    let part = sheet(800, 200, groups.flat());
    part = confirmGroup(part, groups[0]!.map(feature => feature.id), 'A');
    part = confirmGroup(part, groups[1]!.map(feature => feature.id), 'B');
    part = confirmGroup(part, groups[2]!.map(feature => feature.id), 'C');
    const result = stretchAlongAxis(part, {
      axis: 'x',
      delta: 60,
      mode: 'manualZones',
      cuts: [250, 550],
      zoneOffsets: [0, 30, 60],
    });
    expectValid(result);
    expect(width(result.part!)).toBeCloseTo(860, 6);
    const xs = result.part!.features.filter(feature => feature.kind === 'hole').map(feature => (feature.kind === 'hole' ? feature.center.x : 0));
    const pitches = [xs[1]! - xs[0]!, xs[2]! - xs[1]!, xs[4]! - xs[3]!, xs[7]! - xs[6]!];
    for (const pitch of pitches) expect(pitch).toBeCloseTo(30, 6);
  });

  it('test 8 linee di piega', () => {
    const part = createPart({
      outer: rectLoop('out', 0, 0, 400, 200),
      thickness: 2,
      bendLines: [{ id: 'bend', a: { x: 150, y: 0 }, b: { x: 150, y: 200 }, angleDeg: 90, innerRadius: 1, direction: 'up', source: 'manual' }],
      provenance: confirmed,
    });
    const far = stretchAlongAxis(part, { axis: 'x', delta: 10, mode: 'leftFixed', cuts: [300] });
    expectValid(far);
    expect(far.warnings.some(item => item.code === 'OPS-004' || item.code === 'OPS-003')).toBe(false);
    const inside = stretchAlongAxis(part, { axis: 'x', delta: 10, mode: 'leftFixed', cuts: [150] });
    expect(inside.ok).toBe(false);
    expect(inside.blocking.some(item => item.code === 'OPS-003')).toBe(true);
    const moving = stretchAlongAxis(part, { axis: 'x', delta: 10, mode: 'rightFixed', cuts: [250] });
    expect(moving.ok).toBe(false);
    expect(moving.part).toBeUndefined();
    expect(moving.warnings.some(item => item.code === 'OPS-004')).toBe(true);
    const confirmedMove = stretchAlongAxis(part, { axis: 'x', delta: 10, mode: 'rightFixed', cuts: [250], confirmWarnings: true });
    expectValid(confirmedMove);
    expect(confirmedMove.warnings.some(item => item.code === 'OPS-004')).toBe(true);
  });

  it('test 9 convenzione del taglio', () => {
    expect(zoneOf(100, [100], 0.01)).toBe(0);
    expect(zoneOf(100.02, [100], 0.01)).toBe(1);
    expect(zoneOf(99.99, [100], 0.01)).toBe(0);
    const part = sheet(100, 80);
    const onX = stretchAlongAxis(part, { axis: 'x', delta: 10, mode: 'leftFixed', cuts: [100] });
    expectValid(onX);
    expect(width(onX.part!)).toBeCloseTo(100, 6);
    const onY = stretchAlongAxis(part, { axis: 'y', delta: 10, mode: 'leftFixed', cuts: [80] });
    expectValid(onY);
    expect(height(onY.part!)).toBeCloseTo(80, 6);
  });

  it('test 10 lato inclinato', () => {
    const outer: Loop = {
      id: 'trap',
      closed: true,
      signedArea: 0,
      bbox: { minX: 0, minY: 0, maxX: 180, maxY: 200 },
      curves: [
        line('b', 0, 0, 180, 30),
        line('r', 180, 30, 180, 150),
        line('t', 180, 150, 0, 200),
        line('l', 0, 200, 0, 0),
      ],
    };
    const part = createPart({ outer, provenance: confirmed });
    const result = stretchAlongAxis(part, { axis: 'x', delta: 15, mode: 'leftFixed', cuts: [90], confirmWarnings: true });
    expectValid(result);
    expect(result.warnings.some(item => item.code === 'OPS-009')).toBe(true);
  });

  it('test 11 autointersezione', () => {
    const outer: Loop = {
      id: 'c',
      closed: true,
      signedArea: 0,
      bbox: { minX: 0, minY: 0, maxX: 150, maxY: 100 },
      curves: [
        line('a', 0, 0, 200, 0),
        line('b', 200, 0, 200, 100),
        line('c1', 200, 100, 120, 100),
        line('d', 120, 100, 80, 60),
        line('e', 80, 60, 40, 100),
        line('f', 40, 100, 0, 100),
        line('g', 0, 100, 0, 0),
      ],
    };
    const part = createPart({ outer, provenance: confirmed });
    expect(validatePart(part).status).toBe('valid');
    const result = stretchAlongAxis(part, { axis: 'x', delta: -130, mode: 'leftFixed', cuts: [150] });
    expect(result.ok).toBe(false);
    expect(result.part).toBeUndefined();
    expect(result.blocking.some(item => item.code === 'OPS-010')).toBe(true);
  });

  it('test 12 collasso', () => {
    const part = sheet(500, 200);
    const result = stretchAlongAxis(part, { axis: 'x', delta: -500, mode: 'leftFixed' });
    expect(result.ok).toBe(false);
    expect(result.blocking.some(item => item.code === 'OPS-013')).toBe(true);
  });

  it('test 13 identita degli id', () => {
    const part = sheet(400, 200, [hole('foro', 40, 80, 10)]);
    const outerIds = part.outer.curves.map(curve => curve.id);
    const featureId = part.features[0]!.id;
    const loopId = part.features[0]!.loopId;
    const steps = [
      stretchAlongAxis(part, { axis: 'x', delta: 5, mode: 'leftFixed', anchorPolicy: { kind: 'followMinEdge' } }),
    ];
    expectValid(steps[0]!);
    steps.push(stretchAlongAxis(steps[0]!.part!, { axis: 'x', delta: -2, mode: 'leftFixed', anchorPolicy: { kind: 'followMinEdge' } }));
    expectValid(steps[1]!);
    const edited = editFeature(steps[1]!.part!, featureId, { kind: 'hole', diameter: 12 });
    expectValid(edited);
    const zoned = stretchAlongAxis(edited.part!, {
      axis: 'x',
      delta: 8,
      mode: 'manualZones',
      cuts: [200],
      zoneOffsets: [0, 8],
      anchorPolicy: { kind: 'followMinEdge' },
    });
    expectValid(zoned);
    let state = createEditorState(part);
    for (const step of [steps[0]!.part!, steps[1]!.part!, edited.part!, zoned.part!]) {
      state = commit(state, step!, 'Modifica dimensione');
      expect(state.current.features.map(feature => feature.id)).toContain(featureId);
      expect(state.current.features.map(feature => feature.loopId)).toContain(loopId);
      expect(state.current.outer.curves.map(curve => curve.id)).toEqual(outerIds);
    }
    state = undo(state);
    expect(state.current.outer.curves.map(curve => curve.id)).toEqual(outerIds);
    const again = stretchAlongAxis(state.current, { axis: 'x', delta: 1, mode: 'leftFixed', anchorPolicy: { kind: 'followMinEdge' } });
    expectValid(again);
    expect(again.part!.features[0]!.id).toBe(featureId);
    expect(again.part!.features[0]!.loopId).toBe(loopId);
    expect(again.part!.outer.curves.map(curve => curve.id)).toEqual(outerIds);
  });

  it('test 14 undo esatto', () => {
    let state = createEditorState(sheet(200, 100));
    const snapshots: string[] = [];
    for (let i = 0; i < 50; i++) {
      snapshots.push(serialize(state.current));
      const result = stretchAlongAxis(state.current, { axis: 'x', delta: 0.2, mode: 'leftFixed' });
      expectValid(result);
      state = commit(state, result.part!, 'Modifica dimensione');
    }
    expect(state.past.length).toBe(50);
    const finalSnap = serialize(state.current);
    for (let i = 1; i <= 10; i++) {
      state = undo(state);
      expect(serialize(state.current)).toBe(snapshots[50 - i]);
    }
    for (let i = 0; i < 10; i++) state = redo(state);
    expect(serialize(state.current)).toBe(finalSnap);
    expect(state.past.length).toBe(50);
  });

  it('test 16 gate unita', () => {
    const part = createPart({ outer: rectLoop('out', 0, 0, 80, 40) });
    const result = stretchAlongAxis(part, { axis: 'x', delta: 5, mode: 'leftFixed' });
    expect(result.ok).toBe(false);
    expect(result.blocking.some(item => item.code === 'OPS-011')).toBe(true);
  });
});

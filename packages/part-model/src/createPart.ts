import {
  curveBbox,
  curveEnd,
  curveStart,
  DEFAULT_TOLERANCES,
  dist,
  reverseCurve,
  signedArea,
  unionBbox,
  type Loop,
} from '@sviluppolamiera/geom2d';
import type { BendSetup, Part, Provenance } from './types';

let seq = 0;

export function resetIds(start = 0): void {
  seq = start;
}

export function nextId(prefix = 'id'): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function orient(loop: Loop, positive: boolean): Loop {
  if ((loop.signedArea >= 0) === positive) return refresh(loop);
  const curves = [...loop.curves].reverse().map(reverseCurve);
  return refresh({ ...loop, curves });
}

function refresh(loop: Loop): Loop {
  return {
    ...loop,
    signedArea: signedArea(loop.curves),
    bbox: unionBbox(loop.curves.map(curveBbox)),
  };
}

const defaultSetup: BendSetup = {
  process: 'airBend',
  method: 'standard',
  grainDirection: 'parallelaPiega',
  dimensionReference: 'external',
};

const defaultProvenance: Provenance = {
  unitsConfirmedByUser: false,
  sourceFormat: 'manual',
};

export function createPart(input: {
  id?: string;
  name?: string;
  units?: Part['units'];
  tolerances?: Part['tolerances'];
  thickness?: number;
  material?: Part['material'];
  outer: Loop;
  inner?: Loop[];
  features?: Part['features'];
  bendLines?: Part['bendLines'];
  openPaths?: Loop[];
  annotations?: Part['annotations'];
  bendSetup?: BendSetup;
  provenance?: Provenance;
}): Part {
  const part: Part = {
    schemaVersion: 1,
    id: input.id ?? nextId('part'),
    name: input.name ?? 'Pezzo',
    units: input.units ?? 'mm',
    tolerances: input.tolerances ?? { ...DEFAULT_TOLERANCES },
    outer: orient(input.outer, true),
    inner: (input.inner ?? []).map(loop => orient(loop, false)),
    features: input.features ?? [],
    bendLines: input.bendLines ?? [],
    openPaths: (input.openPaths ?? []).map(refresh),
    annotations: input.annotations ?? [],
    bendSetup: input.bendSetup ?? { ...defaultSetup },
    provenance: { ...defaultProvenance, ...input.provenance, unitsConfirmedByUser: input.provenance?.unitsConfirmedByUser ?? false },
  };
  if (input.thickness !== undefined) part.thickness = input.thickness;
  if (input.material !== undefined) part.material = input.material;
  return part;
}

export function loopClosedWithin(loop: Loop, tol: number): boolean {
  const curves = loop.curves;
  if (curves.length === 0) return false;
  for (let i = 0; i < curves.length; i++) {
    const cur = curves[i];
    const nxt = curves[(i + 1) % curves.length];
    if (!cur || !nxt) return false;
    if (!loop.closed && i === curves.length - 1) break;
    if (dist(curveEnd(cur), curveStart(nxt)) > tol) return false;
  }
  return true;
}

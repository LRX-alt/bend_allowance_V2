import { calcolaPiega, calcolaSviluppo } from '@sviluppolamiera/bend-core';
import { finding, type BendLine, type Finding, type Part } from '@sviluppolamiera/part-model';

export interface BendInput {
  segments: { length: number; angle: number }[];
  T: number;
  R: number;
  K: number;
  metodo: string;
}

export function partToBendInput(part: Part): { input: BendInput } | { findings: Finding[] } {
  if (part.thickness === undefined) {
    return { findings: [finding('warning', 'BND-006', 'Per calcolare la piega mi serve lo spessore')] };
  }
  const vertical = part.bendLines
    .filter(bend => Math.abs(bend.a.x - bend.b.x) <= part.tolerances.point)
    .map(bend => ({ bend, x: (bend.a.x + bend.b.x) / 2 }))
    .sort((a, b) => a.x - b.x);
  const edges = [part.outer.bbox.minX, ...vertical.map(item => item.x), part.outer.bbox.maxX];
  const segments: { length: number; angle: number }[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const left = edges[i] ?? 0;
    const right = edges[i + 1] ?? left;
    const angle = i === 0 ? 0 : vertical[i - 1]?.bend.angleDeg ?? 0;
    segments.push({ length: right - left, angle });
  }
  const radius = part.bendLines.find(bend => bend.innerRadius !== undefined)?.innerRadius ?? 0;
  return {
    input: {
      segments,
      T: part.thickness,
      R: radius,
      K: part.material?.kFactorOverride ?? 0.33,
      metodo: part.bendSetup.method,
    },
  };
}

export function computeBendZones(part: Part): { bendLines: BendLine[]; findings: Finding[] } {
  if (part.thickness === undefined) {
    return {
      bendLines: part.bendLines,
      findings: [finding('warning', 'BND-006', 'Per calcolare la zona di piega mi serve lo spessore')],
    };
  }
  const K = part.material?.kFactorOverride ?? 0.33;
  const bendLines = part.bendLines.map(bend => {
    if (bend.angleDeg === undefined || bend.innerRadius === undefined) return { ...bend };
    const piega = calcolaPiega({ angolo: bend.angleDeg, T: part.thickness ?? 0, R: bend.innerRadius, K });
    return { ...bend, zoneHalfWidth: piega.setback };
  });
  return { bendLines, findings: [] };
}

export function flatLength(part: Part): { length: number } | { findings: Finding[] } {
  const adapted = partToBendInput(part);
  if ('findings' in adapted) return adapted;
  const result = calcolaSviluppo({
    segments: adapted.input.segments,
    T: adapted.input.T,
    R: adapted.input.R,
    K: adapted.input.K,
    metodo: adapted.input.metodo,
  });
  return { length: result.sviluppoTotale };
}

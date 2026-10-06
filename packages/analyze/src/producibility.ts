import { dist, type Pt } from '@sviluppolamiera/geom2d';
import { calcolaAperturaMatrice, calcolaLatoMinimo, MATERIAL_ID_TO_KEY } from '@sviluppolamiera/bend-core';
import { finding, type Feature, type Finding, type Part } from '@sviluppolamiera/part-model';
import { producibilityThresholds as limits } from './thresholds';

function pointSegmentDistance(p: Pt, a: Pt, b: Pt): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2));
  return dist(p, { x: a.x + t * abx, y: a.y + t * aby });
}

function featureRadius(feature: Feature): number {
  if (feature.kind === 'hole') return feature.diameter / 2;
  if (feature.kind === 'slot') return feature.width / 2;
  if (feature.kind === 'rect') return Math.min(feature.w, feature.h) / 2;
  return 0;
}

function featurePoint(feature: Feature): Pt {
  if (feature.kind === 'hole' || feature.kind === 'rect') return feature.center;
  if (feature.kind === 'slot') return { x: (feature.p0.x + feature.p1.x) / 2, y: (feature.p0.y + feature.p1.y) / 2 };
  return feature.centroid;
}

export function evaluateProducibility(part: Part): Finding[] {
  const findings: Finding[] = [];
  const span = Math.max(part.outer.bbox.maxX - part.outer.bbox.minX, part.outer.bbox.maxY - part.outer.bbox.minY);
  if (span < limits.minScale || span > limits.maxScale) {
    findings.push(finding('warning', 'GEO-009', 'Geometria fuori scala'));
  }
  if (part.bendLines.length === 0) return findings;
  if (part.thickness === undefined) {
    return [...findings, finding('warning', 'BND-006', 'Per i controlli di piega mi serve lo spessore')];
  }
  const T = part.thickness;
  const materialKey = part.material ? (MATERIAL_ID_TO_KEY as Record<string, string | undefined>)[part.material.dbId] : undefined;
  for (const bend of part.bendLines) {
    const zone = bend.zoneHalfWidth;
    const radius = bend.innerRadius;
    for (const feature of part.features) {
      const clearance = pointSegmentDistance(featurePoint(feature), bend.a, bend.b) - featureRadius(feature);
      if (zone !== undefined && clearance < zone) {
        findings.push(finding('error', 'BND-003', 'Una lavorazione cade nella zona di piega', { geometryRefs: [feature.id, bend.id] }));
      } else if (radius !== undefined && clearance < radius + limits.bendClearanceFactor * T) {
        findings.push(finding('warning', 'BND-004', 'Distanza lavorazione-piega sotto la soglia', { geometryRefs: [feature.id, bend.id] }));
      }
    }
    if (!materialKey) {
      findings.push(finding('warning', 'BND-007', 'Per verificare il lembo mi serve il materiale', { geometryRefs: [bend.id] }));
      continue;
    }
    const recommended = calcolaAperturaMatrice(T, part.bendSetup.process, materialKey);
    const chosen = part.bendSetup.vOpening;
    const opening = typeof chosen === 'number' && chosen > 0 ? chosen : recommended.aperturaOttimale;
    const flange = calcolaLatoMinimo({ V: opening, pieghe: limits.flangeBends });
    const pos = (bend.a.x + bend.b.x) / 2;
    const vertical = Math.abs(bend.a.x - bend.b.x) <= part.tolerances.point;
    const lengths = vertical
      ? [pos - part.outer.bbox.minX, part.outer.bbox.maxX - pos]
      : [((bend.a.y + bend.b.y) / 2) - part.outer.bbox.minY, part.outer.bbox.maxY - (bend.a.y + bend.b.y) / 2];
    for (const length of lengths) {
      if (length < flange.geometrico) {
        findings.push(finding('error', 'BND-005', 'Lembo piu corto del minimo geometrico', { geometryRefs: [bend.id], data: { length, geometrico: flange.geometrico } }));
      } else if (length < flange.consigliato) {
        findings.push(finding('warning', 'BND-005', 'Lembo piu corto del minimo consigliato', { geometryRefs: [bend.id], data: { length, consigliato: flange.consigliato } }));
      }
    }
  }
  return findings;
}

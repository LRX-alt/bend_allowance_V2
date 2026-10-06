import { loopSelfIntersects, pointInLoop } from '@sviluppolamiera/geom2d';
import { loopClosedWithin } from './createPart';
import { finding } from './finding';
import type { Finding } from './finding';
import type { Part, ValidationResult } from './types';

function idsOf(part: Part): string[] {
  const ids = [part.outer.id];
  for (const curve of part.outer.curves) ids.push(curve.id);
  for (const loop of [...part.inner, ...part.openPaths]) {
    ids.push(loop.id);
    for (const curve of loop.curves) ids.push(curve.id);
  }
  for (const feature of part.features) ids.push(feature.id);
  for (const bend of part.bendLines) ids.push(bend.id);
  for (const note of part.annotations) ids.push(note.id);
  return ids;
}

export function validatePart(part: Part): ValidationResult {
  const findings: Finding[] = [];
  const tol = part.tolerances;

  if (!part.outer.closed || part.outer.signedArea <= 0 || !loopClosedWithin(part.outer, tol.point)) {
    findings.push(finding('error', 'TOP-001', 'Nessun contorno esterno chiuso utilizzabile', { geometryRefs: [part.outer.id] }));
  }
  if (part.outer.closed && loopSelfIntersects(part.outer, tol)) {
    findings.push(finding('error', 'GEO-005', 'Il contorno esterno si autointerseca', { geometryRefs: [part.outer.id] }));
  }

  const seen = new Set<string>();
  for (const id of idsOf(part)) {
    if (seen.has(id)) {
      findings.push(finding('error', 'GEO-007', `Identificativo duplicato: ${id}`, { geometryRefs: [id] }));
    }
    seen.add(id);
  }

  const featureByLoop = new Map<string, number>();
  for (const feature of part.features) {
    featureByLoop.set(feature.loopId, (featureByLoop.get(feature.loopId) ?? 0) + 1);
    if (!part.inner.some(loop => loop.id === feature.loopId)) {
      findings.push(finding('error', 'FEA-003', 'La lavorazione non ha un loop interno', { geometryRefs: [feature.id] }));
    }
  }

  for (const loop of part.inner) {
    if (!loop.closed || loop.signedArea >= 0 || !loopClosedWithin(loop, tol.point)) {
      findings.push(finding('error', 'TOP-004', 'Loop interno non chiuso o non orientato', { geometryRefs: [loop.id] }));
    }
    const probe = loop.curves[0];
    const sample = probe && probe.kind === 'line' ? probe.a : probe && probe.kind === 'arc' ? { x: probe.c.x + probe.r, y: probe.c.y } : null;
    if (sample && part.outer.closed && !pointInLoop(sample, part.outer, tol)) {
      findings.push(finding('error', 'FEA-003', 'Loop chiuso fuori dal contorno esterno', { geometryRefs: [loop.id] }));
    }
    if ((featureByLoop.get(loop.id) ?? 0) > 1) {
      findings.push(finding('error', 'FEA-002', 'Piu lavorazioni sullo stesso loop', { geometryRefs: [loop.id] }));
    }
    if (loopSelfIntersects(loop, tol)) {
      findings.push(finding('error', 'GEO-006', 'Loop interni sovrapposti o autointersecanti', { geometryRefs: [loop.id] }));
    }
  }

  if (!part.provenance.unitsConfirmedByUser) {
    const code = part.provenance.declaredUnits && part.provenance.declaredUnits !== 'unknown' ? 'UNI-002' : 'UNI-001';
    findings.push(finding('warning', code, 'Unita non confermata: modifica ed export non sono consentiti'));
  }
  if (part.provenance.hadUnsupportedCurves && !part.provenance.unsupportedCurvesDecision) {
    findings.push(finding('warning', 'GEO-008', 'Curve non supportate in attesa di una decisione dell operatore'));
  }
  if (part.provenance.unsupportedCurvesDecision === 'rejected') {
    findings.push(finding('warning', 'GEO-008', 'Curve non supportate rifiutate: il pezzo resta in sola lettura'));
  }

  const geometricError = findings.some(f => f.severity === 'error' && !f.code.startsWith('UNI'));
  const domainBlock =
    !part.provenance.unitsConfirmedByUser ||
    part.provenance.unsupportedCurvesDecision === 'rejected' ||
    (part.provenance.hadUnsupportedCurves === true && !part.provenance.unsupportedCurvesDecision);

  const status = geometricError ? 'invalid' : domainBlock ? 'incompleteForDomain' : 'valid';
  const editable = status === 'valid';
  return {
    status,
    findings,
    can: {
      view: true,
      measure: status !== 'invalid',
      editGeometry: editable,
      computeBend: editable && typeof part.thickness === 'number',
      exportDxf: editable,
    },
  };
}

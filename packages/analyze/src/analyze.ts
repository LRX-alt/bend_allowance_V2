import { finding, validatePart, type Finding, type Part } from '@sviluppolamiera/part-model';
import { findingsForCleanup } from './cleanup';
import { evaluateProducibility } from './producibility';

export type ExportStatus = 'valid' | 'warnings' | 'blocked';

export interface ExportDecision {
  status: ExportStatus;
  findings: Finding[];
}

export function analyzePart(part: Part): Finding[] {
  const validation = validatePart(part);
  return [...validation.findings, ...findingsForCleanup(part), ...evaluateProducibility(part)];
}

export function exportDecision(part: Part, extra: Finding[] = []): ExportDecision {
  const findings = [...analyzePart(part), ...extra];
  if (!part.provenance.unitsConfirmedByUser) {
    findings.push(finding('error', 'EXP-002', 'Unita non confermate'));
  }
  if (part.provenance.unsupportedCurvesDecision === 'rejected') {
    findings.push(finding('error', 'EXP-002', 'Geometria non supportata rifiutata'));
  }
  if (!part.outer.closed || part.outer.curves.length === 0) {
    findings.push(finding('error', 'EXP-001', 'Contorno non chiuso'));
  }
  const errors = findings.some(item => item.severity === 'error');
  const warnings = findings.some(item => item.severity === 'warning');
  if (errors) return { status: 'blocked', findings };
  if (warnings) return { status: 'warnings', findings };
  return { status: 'valid', findings };
}

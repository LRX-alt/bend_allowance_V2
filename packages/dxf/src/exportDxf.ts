import {
  DxfWriter,
  LWPolylineFlags,
  TextHorizontalAlignment,
  TextVerticalAlignment,
  Units,
} from '@tarikjabiri/dxf';
import type { Curve, Loop } from '@sviluppolamiera/geom2d';
import { arcSweep, curveEnd, curveStart } from '@sviluppolamiera/geom2d';
import { finding, validatePart, type Finding, type Part } from '@sviluppolamiera/part-model';

export interface ExportGate {
  status: 'valid' | 'warnings' | 'blocked';
  findings: Finding[];
}

export function exportGate(part: Part, findings: Finding[] = []): ExportGate {
  const local = [...findings];
  if (!part.provenance.unitsConfirmedByUser) {
    local.push(finding('error', 'EXP-002', 'Unita non confermate'));
  }
  if (part.provenance.unsupportedCurvesDecision === 'rejected') {
    local.push(finding('error', 'EXP-002', 'Geometria non supportata rifiutata: export del pezzo modificato non consentito'));
  }
  if (!part.outer.closed || part.outer.curves.length === 0) {
    local.push(finding('error', 'EXP-001', 'Contorno non chiuso'));
  }
  const validation = validatePart(part);
  if (validation.status === 'invalid') {
    local.push(...validation.findings.filter(f => f.severity === 'error'));
  }
  const errors = local.filter(f => f.severity === 'error');
  const warnings = local.filter(f => f.severity === 'warning');
  if (errors.length) return { status: 'blocked', findings: local };
  if (warnings.length) return { status: 'warnings', findings: local };
  return { status: 'valid', findings: local };
}

function bulgeOf(curve: Curve): number {
  if (curve.kind !== 'arc') return 0;
  const sweep = arcSweep(curve);
  return Math.tan(sweep / 4);
}

function polylineOf(loop: Loop): { point: { x: number; y: number }; bulge: number }[] {
  return loop.curves.map(curve => ({
    point: curveStart(curve),
    bulge: bulgeOf(curve),
  }));
}

export function exportDxf(part: Part, findings: Finding[] = []): { dxf: string | null; gate: ExportGate } {
  const gate = exportGate(part, findings);
  if (gate.status === 'blocked') return { dxf: null, gate };
  const writer = new DxfWriter();
  writer.setUnits(part.units === 'inch' ? Units.Inches : Units.Millimeters);
  writer.addLayer('SL_TAGLIO', 7, 'CONTINUOUS');
  writer.addLayer('SL_PIEGA', 1, 'CONTINUOUS');
  writer.addLayer('SL_QUOTE', 3, 'CONTINUOUS');
  writer.setCurrentLayerName('SL_TAGLIO');
  const holes = new Set(part.features.filter(f => f.kind === 'hole').map(f => f.loopId));
  writer.addLWPolyline(polylineOf(part.outer), { flags: LWPolylineFlags.Closed });
  for (const loop of part.inner) {
    const hole = part.features.find(f => f.loopId === loop.id && f.kind === 'hole');
    if (hole && hole.kind === 'hole') {
      writer.addCircle({ x: hole.center.x, y: hole.center.y, z: 0 }, hole.diameter / 2);
      continue;
    }
    if (holes.has(loop.id)) continue;
    writer.addLWPolyline(polylineOf(loop), { flags: LWPolylineFlags.Closed });
  }
  writer.setCurrentLayerName('SL_PIEGA');
  for (const bend of part.bendLines) {
    writer.addLine({ x: bend.a.x, y: bend.a.y, z: 0 }, { x: bend.b.x, y: bend.b.y, z: 0 });
  }
  return { dxf: writer.stringify(), gate };
}

function roundMm(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** DXF R2000 in millimetri, con un contorno chiuso sul layer di taglio. */
export function exportOutlineDxf(points: Array<{ x: number; y: number }>): string {
  const writer = new DxfWriter();
  writer.setUnits(Units.Millimeters);
  writer.addLayer('SL_TAGLIO', 7, 'CONTINUOUS');
  writer.setCurrentLayerName('SL_TAGLIO');
  const rounded = points
    .map(point => ({ x: roundMm(point.x), y: roundMm(point.y) }))
    .filter((point, index, all) => {
      const prev = all[index - 1];
      return !prev || Math.hypot(point.x - prev.x, point.y - prev.y) > 1e-6;
    });
  if (rounded.length >= 3) {
    writer.addLWPolyline(
      rounded.map(point => ({ point, bulge: 0 })),
      { flags: LWPolylineFlags.Closed }
    );
  }
  return writer.stringify();
}

export interface FlatBendLine {
  a: { x: number; y: number };
  b: { x: number; y: number };
  layer: string;
  label: string;
}

export interface FlatQuote {
  x: number;
  y: number;
  text: string;
}

/** Sviluppo piatto: contorno, linee di piega e quote, in millimetri. */
export function exportFlatDxf(pattern: {
  contorno: Array<{ x: number; y: number }>;
  pieghe: FlatBendLine[];
  quote: FlatQuote[];
}): string {
  const writer = new DxfWriter();
  writer.setUnits(Units.Millimeters);
  writer.addLayer('SL_TAGLIO', 7, 'CONTINUOUS');
  writer.addLayer('SL_QUOTE', 3, 'CONTINUOUS');
  for (const name of new Set(pattern.pieghe.map(bend => bend.layer))) {
    writer.addLayer(name, 1, 'CONTINUOUS');
  }
  const outline = pattern.contorno
    .map(point => ({ x: roundMm(point.x), y: roundMm(point.y) }))
    .filter((point, index, all) => {
      const prev = all[index - 1];
      return !prev || Math.hypot(point.x - prev.x, point.y - prev.y) > 1e-6;
    });
  if (outline.length >= 3) {
    writer.setCurrentLayerName('SL_TAGLIO');
    writer.addLWPolyline(
      outline.map(point => ({ point, bulge: 0 })),
      { flags: LWPolylineFlags.Closed }
    );
  }
  for (const bend of pattern.pieghe) {
    writer.setCurrentLayerName(bend.layer);
    writer.addLine(
      { x: roundMm(bend.a.x), y: roundMm(bend.a.y), z: 0 },
      { x: roundMm(bend.b.x), y: roundMm(bend.b.y), z: 0 }
    );
  }
  writer.setCurrentLayerName('SL_QUOTE');
  for (const quote of pattern.quote) {
    const point = { x: roundMm(quote.x), y: roundMm(quote.y), z: 0 };
    writer.addText(point, 3.5, quote.text, {
      horizontalAlignment: TextHorizontalAlignment.Center,
      verticalAlignment: TextVerticalAlignment.Middle,
      secondAlignmentPoint: point,
    });
  }
  return writer.stringify();
}

void curveEnd;

import DxfParser from 'dxf-parser';
import {
  chainToLoop,
  curveBbox,
  curveEnd,
  curveLength,
  curveStart,
  dist,
  nestLoops,
  pointAt,
  signedArea,
  stitch,
  unionBbox,
  type Curve,
  type Loop,
} from '@sviluppolamiera/geom2d';
import {
  classifyLoop,
  createPart,
  finding,
  proposeGroups,
  regenerateFeatureLoop,
  resetIds,
  validatePart,
  type BendLine,
  type Finding,
  type GroupProposal,
  type Part,
  type ValidationResult,
} from '@sviluppolamiera/part-model';

export type LayerRole = 'cut' | 'bend' | 'annotation' | 'ignored';

export interface ImportDecisions {
  /** Conferma esplicita. Senza questo valore non si converte nulla. */
  confirmUnits?: 'mm' | 'inch';
  /** Consenso all'approssimazione. Senza questo oggetto spline ed ellissi restano non convertite. */
  approximateUnsupported?: { tolerance: number };
}

export interface ImportResult {
  part: Part | null;
  validation: ValidationResult | null;
  findings: Finding[];
  groupProposals: GroupProposal[];
  layerRoles: Record<string, LayerRole>;
}

interface RawEntity {
  type?: string;
  layer?: string;
  vertices?: Array<{ x?: number; y?: number; bulge?: number }>;
  center?: { x?: number; y?: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  shape?: boolean;
  name?: string;
  position?: { x?: number; y?: number };
  xScale?: number;
  yScale?: number;
  rotation?: number;
  controlPoints?: Array<{ x?: number; y?: number }>;
  fitPoints?: Array<{ x?: number; y?: number }>;
}

interface Parsed {
  header?: Record<string, unknown>;
  entities?: RawEntity[];
  blocks?: Record<string, { entities?: RawEntity[] }>;
  tables?: { layer?: { layers?: Record<string, { frozen?: boolean; visible?: boolean }> } };
}

function parser(): DxfParser {
  return new DxfParser();
}

let localSeq = 0;
function nid(prefix: string): string {
  localSeq += 1;
  return `${prefix}-${localSeq}`;
}

function roleOf(name: string, frozen: boolean): LayerRole {
  if (frozen) return 'ignored';
  const n = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (/pieg|bend|fold|biege/.test(n)) return 'bend';
  if (/quot|dim|text|cartig|frame/.test(n)) return 'annotation';
  return 'cut';
}

function unitsFromHeader(header: Record<string, unknown> | undefined): {
  code: number | null;
  declared: 'mm' | 'inch' | 'unknown';
} {
  const raw = header?.$INSUNITS;
  const code = typeof raw === 'number' ? raw : null;
  if (code === 4) return { code, declared: 'mm' };
  if (code === 1) return { code, declared: 'inch' };
  return { code, declared: 'unknown' };
}

function bulgeArc(id: string, p1: { x: number; y: number }, p2: { x: number; y: number }, bulge: number): Curve {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const L = Math.hypot(dx, dy);
  const radius = (L * (1 + bulge * bulge)) / (4 * Math.abs(bulge));
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const distToCenter = Math.sqrt(Math.max(0, radius * radius - (L / 2) * (L / 2)));
  const ux = dx / L;
  const uy = dy / L;
  const leftx = -uy;
  const lefty = ux;
  const minor = Math.abs(bulge) <= 1;
  const dir = (bulge > 0 ? 1 : -1) * (minor ? -1 : 1);
  const c = { x: mx + dir * leftx * distToCenter, y: my + dir * lefty * distToCenter };
  return {
    id,
    kind: 'arc',
    c,
    r: radius,
    a0: Math.atan2(p1.y - c.y, p1.x - c.x),
    a1: Math.atan2(p2.y - c.y, p2.x - c.x),
    ccw: bulge > 0,
  };
}

function transformPoint(
  p: { x: number; y: number },
  insert: RawEntity
): { x: number; y: number } {
  const sx = insert.xScale ?? 1;
  const sy = insert.yScale ?? 1;
  const rad = ((insert.rotation ?? 0) * Math.PI) / 180;
  const x = p.x * sx;
  const y = p.y * sy;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {
    x: (insert.position?.x ?? 0) + x * c - y * s,
    y: (insert.position?.y ?? 0) + x * s + y * c,
  };
}

interface Exploded {
  curves: Array<{ curve: Curve; layer: string }>;
  annotations: Array<{ id: string; kind: 'text' | 'dimension' | 'other'; layer: string; raw: unknown }>;
  unsupported: Array<{ type: string; layer: string; points: Array<{ x: number; y: number }> }>;
  ignoredTypes: string[];
}

function explodeEntity(
  entity: RawEntity,
  blocks: Parsed['blocks'],
  depth: number,
  out: Exploded,
  findings: Finding[]
): void {
  const layer = entity.layer ?? '0';
  const type = entity.type ?? 'UNKNOWN';
  if (depth > 8) {
    findings.push(finding('error', 'TOP-005', 'Blocco annidato oltre 8 livelli', { data: { type } }));
    return;
  }
  if (type === 'INSERT') {
    const block = entity.name ? blocks?.[entity.name] : undefined;
    const sx = entity.xScale ?? 1;
    const sy = entity.yScale ?? 1;
    if (sx !== sy) {
      out.unsupported.push({ type: 'INSERT_NONUNIFORM', layer, points: [] });
      return;
    }
    for (const child of block?.entities ?? []) {
      const clone = JSON.parse(JSON.stringify(child)) as RawEntity;
      const map = (p?: { x?: number; y?: number }) => {
        const t = transformPoint({ x: p?.x ?? 0, y: p?.y ?? 0 }, entity);
        return { ...p, x: t.x, y: t.y };
      };
      if (clone.vertices) clone.vertices = clone.vertices.map(v => ({ ...v, ...map(v) }));
      if (clone.center) clone.center = map(clone.center);
      if (clone.position) clone.position = map(clone.position);
      if (clone.controlPoints) clone.controlPoints = clone.controlPoints.map(p => map(p));
      if (clone.fitPoints) clone.fitPoints = clone.fitPoints.map(p => map(p));
      explodeEntity(clone, blocks, depth + 1, out, findings);
    }
    return;
  }
  if (type === 'LINE') {
    const a = entity.vertices?.[0];
    const b = entity.vertices?.[1];
    if (!a || !b) return;
    out.curves.push({
      curve: { id: nid('ln'), kind: 'line', a: { x: a.x ?? 0, y: a.y ?? 0 }, b: { x: b.x ?? 0, y: b.y ?? 0 } },
      layer,
    });
    return;
  }
  if (type === 'ARC') {
    const c = entity.center ?? {};
    const start = entity.startAngle ?? 0;
    const end = entity.endAngle ?? 0;
    out.curves.push({
      curve: {
        id: nid('ar'),
        kind: 'arc',
        c: { x: c.x ?? 0, y: c.y ?? 0 },
        r: entity.radius ?? 0,
        a0: start,
        a1: end,
        ccw: true,
      },
      layer,
    });
    return;
  }
  if (type === 'CIRCLE') {
    const c = entity.center ?? {};
    const r = entity.radius ?? 0;
    const center = { x: c.x ?? 0, y: c.y ?? 0 };
    out.curves.push({
      curve: { id: nid('ar'), kind: 'arc', c: center, r, a0: 0, a1: Math.PI, ccw: true },
      layer,
    });
    out.curves.push({
      curve: { id: nid('ar'), kind: 'arc', c: center, r, a0: Math.PI, a1: Math.PI * 2, ccw: true },
      layer,
    });
    return;
  }
  if (type === 'LWPOLYLINE' || type === 'POLYLINE') {
    const verts = entity.vertices ?? [];
    const closed = Boolean(entity.shape);
    const count = closed ? verts.length : verts.length - 1;
    for (let i = 0; i < count; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % verts.length];
      if (!v1 || !v2) continue;
      const p1 = { x: v1.x ?? 0, y: v1.y ?? 0 };
      const p2 = { x: v2.x ?? 0, y: v2.y ?? 0 };
      const bulge = v1.bulge ?? 0;
      if (Math.abs(bulge) < 1e-12) {
        out.curves.push({ curve: { id: nid('ln'), kind: 'line', a: p1, b: p2 }, layer });
      } else {
        out.curves.push({ curve: bulgeArc(nid('ar'), p1, p2, bulge), layer });
      }
    }
    return;
  }
  if (type === 'SPLINE' || type === 'ELLIPSE') {
    const points = [...(entity.fitPoints ?? []), ...(entity.controlPoints ?? [])].map(p => ({
      x: p.x ?? 0,
      y: p.y ?? 0,
    }));
    out.unsupported.push({ type, layer, points });
    return;
  }
  if (type === 'TEXT' || type === 'MTEXT' || type === 'DIMENSION' || type === 'LEADER' || type === 'HATCH') {
    const kind = type === 'TEXT' || type === 'MTEXT' ? 'text' : type === 'DIMENSION' ? 'dimension' : 'other';
    out.annotations.push({ id: nid('an'), kind, layer, raw: entity });
    return;
  }
  out.ignoredTypes.push(type);
}

function dedupe(curves: Array<{ curve: Curve; layer: string }>, tol: number, findings: Finding[]): Array<{ curve: Curve; layer: string }> {
  const kept: Array<{ curve: Curve; layer: string }> = [];
  for (const item of curves) {
    if (curveLength(item.curve) <= tol) {
      findings.push(finding('info', 'GEO-004', 'Entita a lunghezza nulla rimossa', { geometryRefs: [item.curve.id] }));
      continue;
    }
    const dup = kept.some(other => sameCurve(other.curve, item.curve, tol));
    if (dup) {
      findings.push(finding('info', 'GEO-001', 'Duplicato geometricamente identico rimosso', { geometryRefs: [item.curve.id] }));
      continue;
    }
    kept.push(item);
  }
  return kept;
}

function sameCurve(a: Curve, b: Curve, tol: number): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'line' && b.kind === 'line') {
    const direct = dist(a.a, b.a) <= tol && dist(a.b, b.b) <= tol;
    const flip = dist(a.a, b.b) <= tol && dist(a.b, b.a) <= tol;
    return direct || flip;
  }
  if (a.kind === 'arc' && b.kind === 'arc') {
    return (
      dist(a.c, b.c) <= tol &&
      Math.abs(a.r - b.r) <= tol &&
      dist(pointAt(a, 0.5), pointAt(b, 0.5)) <= tol
    );
  }
  return false;
}

function approximate(points: Array<{ x: number; y: number }>, tolerance: number): Curve[] {
  if (points.length < 2) return [];
  const curves: Curve[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const n = Math.max(1, Math.ceil(dist(a, b) / Math.max(tolerance, 0.01)));
    let prev = a;
    for (let s = 1; s <= n; s++) {
      const t = s / n;
      const next = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      curves.push({ id: nid('ap'), kind: 'line', a: prev, b: next });
      prev = next;
    }
  }
  return curves;
}

function bendFromLayer(name: string): Partial<BendLine> {
  const up = /up|su/i.test(name);
  const down = /down|giu/i.test(name);
  const angle = name.match(/(\d+)/);
  return {
    angleDeg: angle ? Number(angle[1]) : undefined,
    direction: up ? 'up' : down ? 'down' : undefined,
  };
}

export function importDxf(source: string, decisions: ImportDecisions = {}): ImportResult {
  localSeq = 0;
  resetIds(0);
  const findings: Finding[] = [];
  let parsed: Parsed;
  try {
    parsed = parser().parseSync(source) as Parsed;
  } catch (error) {
    findings.push(finding('error', 'TOP-001', `DXF non leggibile: ${error instanceof Error ? error.message : 'errore'}`));
    return { part: null, validation: null, findings, groupProposals: [], layerRoles: {} };
  }
  if (!parsed) {
    findings.push(finding('error', 'TOP-001', 'DXF non leggibile'));
    return { part: null, validation: null, findings, groupProposals: [], layerRoles: {} };
  }

  const layerRoles: Record<string, LayerRole> = {};
  const layers = parsed.tables?.layer?.layers ?? {};
  for (const [name, layer] of Object.entries(layers)) {
    layerRoles[name] = roleOf(name, Boolean(layer.frozen) || layer.visible === false);
  }

  const exploded: Exploded = { curves: [], annotations: [], unsupported: [], ignoredTypes: [] };
  for (const entity of parsed.entities ?? []) explodeEntity(entity, parsed.blocks, 0, exploded, findings);
  if (exploded.ignoredTypes.length) {
    findings.push(
      finding('info', 'GEO-007', `Tipi ignorati: ${[...new Set(exploded.ignoredTypes)].join(', ')}`)
    );
  }

  for (const item of exploded.curves) {
    if (!layerRoles[item.layer]) layerRoles[item.layer] = roleOf(item.layer, false);
  }

  const units = unitsFromHeader(parsed.header);
  const confirmed = decisions.confirmUnits;
  let scale = 1;
  if (confirmed === 'inch') scale = 25.4;
  if (confirmed === 'mm') scale = 1;
  const applyScale = (p: { x: number; y: number }) => ({ x: p.x * scale, y: p.y * scale });
  if (confirmed) {
    for (const item of exploded.curves) {
      const c = item.curve;
      if (c.kind === 'line') {
        c.a = applyScale(c.a);
        c.b = applyScale(c.b);
      } else {
        c.c = applyScale(c.c);
        c.r *= scale;
      }
    }
  }

  const cutLike = exploded.curves.filter(item => (layerRoles[item.layer] ?? 'cut') === 'cut');
  const bendItems = exploded.curves.filter(item => layerRoles[item.layer] === 'bend');
  const deduped = dedupe(cutLike, 0.01, findings);

  const operableUnsupported = exploded.unsupported.filter(item => {
    const role = layerRoles[item.layer] ?? 'cut';
    return role === 'cut' || role === 'bend';
  });
  const hadUnsupported = operableUnsupported.length > 0;
  let decision: 'approximated' | 'rejected' | undefined;
  const extra: Curve[] = [];
  if (hadUnsupported && decisions.approximateUnsupported) {
    decision = 'approximated';
    for (const item of operableUnsupported) extra.push(...approximate(item.points, decisions.approximateUnsupported.tolerance));
    findings.push(
      finding('info', 'GEO-010', `Approssimate ${operableUnsupported.length} curve con tolleranza ${decisions.approximateUnsupported.tolerance} mm`, {
        data: { count: operableUnsupported.length, tolerance: decisions.approximateUnsupported.tolerance },
      })
    );
  } else if (hadUnsupported) {
    findings.push(finding('warning', 'GEO-008', 'Il file contiene spline o ellissi sulla geometria di taglio'));
  }

  const stitched = stitch([...deduped.map(item => item.curve), ...extra], {
    point: 0.01,
    stitchSuggest: 0.05,
    micro: 0.05,
    angular: 0.001,
  });
  if (stitched.identifiedNodes > 0) {
    findings.push(finding('info', 'TOP-002', `Nodi identificati senza spostare i vertici: ${stitched.identifiedNodes}`));
  }
  for (const gap of stitched.gaps) {
    if (gap.distance <= 0.05) {
      findings.push(finding('warning', 'TOP-003', `Gap di ${gap.distance.toFixed(3)} mm, chiusura solo su conferma`));
    }
  }
  if (stitched.branches.length) findings.push(finding('warning', 'TOP-005', 'Biforcazione nel contorno'));

  const loops = stitched.chains.map((chain, i) => chainToLoop(nid('loop'), chain, Boolean(stitched.closed[i])));
  const nested = nestLoops(loops, { point: 0.01, stitchSuggest: 0.05, micro: 0.05, angular: 0.001 });
  const empty: Loop = {
    id: nid('loop'),
    curves: [],
    closed: false,
    signedArea: 0,
    bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
  };
  const outer = nested.outer ?? empty;
  const features = nested.inner.map(loop => classifyLoop(loop, { point: 0.01, stitchSuggest: 0.05, micro: 0.05, angular: 0.001 }));
  const inner = features.map(feature => {
    const prev = nested.inner.find(loop => loop.id === feature.loopId);
    return feature.kind === 'generic' ? (prev ?? regenerateFeatureLoop(feature)) : regenerateFeatureLoop(feature, prev);
  });

  const openPaths = [
    ...stitched.chains
      .filter((_, i) => !stitched.closed[i])
      .map(chain => chainToLoop(nid('open'), chain, false)),
  ];
  if (hadUnsupported && decision !== 'approximated') {
    for (const item of operableUnsupported) {
      if (item.points.length >= 2) {
        const curves: Curve[] = [];
        for (let i = 1; i < item.points.length; i++) {
          const a = item.points[i - 1];
          const b = item.points[i];
          if (a && b) curves.push({ id: nid('raw'), kind: 'line', a, b });
        }
        if (curves.length) openPaths.push(chainToLoop(nid('open'), curves, false));
      }
    }
  }

  const bendLines: BendLine[] = bendItems
    .filter(item => item.curve.kind === 'line')
    .map(item => {
      const curve = item.curve;
      if (curve.kind !== 'line') throw new Error('atteso');
      const meta = bendFromLayer(item.layer);
      if (meta.angleDeg === undefined || meta.direction === undefined) {
        findings.push(finding('warning', 'BND-002', 'Linea di piega senza angolo o direzione', { geometryRefs: [curve.id] }));
      }
      return {
        id: nid('bend'),
        a: curve.a,
        b: curve.b,
        source: 'layer' as const,
        layer: item.layer,
        ...meta,
      };
    });
  if (bendLines.length === 0) findings.push(finding('info', 'BND-001', 'Nessun layer di piega riconosciuto'));

  const maxDim = Math.max(outer.bbox.maxX - outer.bbox.minX, outer.bbox.maxY - outer.bbox.minY, 0);
  if (units.declared !== 'unknown' && (maxDim < 1 || maxDim > 6000)) {
    findings.push(finding('warning', 'UNI-003', 'Dimensioni sospette rispetto all unita dichiarata'));
  }

  const part = createPart({
    name: 'Import DXF',
    units: confirmed === 'inch' ? 'mm' : confirmed === 'mm' ? 'mm' : units.declared === 'inch' ? 'inch' : 'mm',
    outer,
    inner,
    features,
    bendLines,
    openPaths,
    annotations: exploded.annotations,
    provenance: {
      sourceFormat: 'dxf',
      declaredUnits: units.declared,
      assumedUnits: confirmed,
      unitsConfirmedByUser: Boolean(confirmed),
      hadUnsupportedCurves: hadUnsupported,
      unsupportedCurvesDecision: decision,
      approximationTolerance: decisions.approximateUnsupported?.tolerance,
    },
  });
  const validation = validatePart(part);
  const groupProposals = proposeGroups(part);
  for (const proposal of groupProposals) {
    findings.push(
      finding('info', 'FEA-006', `Questi ${proposal.featureIds.length} fori sembrano un gruppo, passo ${proposal.pitch} mm`, {
        geometryRefs: proposal.featureIds,
      })
    );
  }
  return { part, validation, findings: [...findings, ...validation.findings], groupProposals, layerRoles };
}

void curveEnd;
void curveStart;
void curveBbox;
void signedArea;
void unionBbox;

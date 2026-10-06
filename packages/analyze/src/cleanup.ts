import { curveLength, dist, type Curve } from '@sviluppolamiera/geom2d';
import { finding, type Finding, type Part } from '@sviluppolamiera/part-model';

export interface CleanupAction {
  kind: string;
  label: string;
  geometryRefs: string[];
}

export interface CleanupPlan {
  automatic: CleanupAction[];
  proposed: CleanupAction[];
  forbidden: CleanupAction[];
}

const forbidden: CleanupAction[] = [
  { kind: 'move-vertex', label: 'Spostare un vertice', geometryRefs: [] },
  { kind: 'delete-loop', label: 'Cancellare un contorno', geometryRefs: [] },
  { kind: 'reinterpret-layer', label: 'Reinterpretare i layer', geometryRefs: [] },
  { kind: 'assign-group', label: 'Assegnare un gruppo', geometryRefs: [] },
  { kind: 'assign-anchor', label: 'Assegnare un ancoraggio', geometryRefs: [] },
  { kind: 'convert-units', label: 'Convertire le unita', geometryRefs: [] },
];

function zeroLength(curve: Curve, tol: number): boolean {
  return curveLength(curve) <= tol;
}

export function buildCleanupPlan(part: Part): CleanupPlan {
  const automatic: CleanupAction[] = [];
  const proposed: CleanupAction[] = [];
  const curves = [...part.outer.curves, ...part.inner.flatMap(loop => loop.curves), ...part.openPaths.flatMap(loop => loop.curves)];
  for (const curve of curves) {
    const length = curveLength(curve);
    if (length <= part.tolerances.point * 0.01) {
      automatic.push({ kind: 'drop-zero', label: 'Rimuovi entita a lunghezza zero', geometryRefs: [curve.id] });
    } else if (length < part.tolerances.micro) {
      proposed.push({ kind: 'drop-micro', label: 'Microsegmento: eliminazione solo su conferma', geometryRefs: [curve.id] });
    }
  }
  for (let i = 0; i < part.outer.curves.length; i++) {
    const current = part.outer.curves[i];
    const next = part.outer.curves[(i + 1) % part.outer.curves.length];
    if (!current || !next || !part.outer.closed && i === part.outer.curves.length - 1) continue;
    const gap = dist(
      current.kind === 'line' ? current.b : { x: current.c.x + current.r * Math.cos(current.a1), y: current.c.y + current.r * Math.sin(current.a1) },
      next.kind === 'line' ? next.a : { x: next.c.x + next.r * Math.cos(next.a0), y: next.c.y + next.r * Math.sin(next.a0) }
    );
    if (gap > part.tolerances.point) {
      proposed.push({ kind: 'close-gap', label: 'Chiudi il gap solo dopo conferma', geometryRefs: [current.id, next.id] });
    }
  }
  return { automatic, proposed, forbidden };
}

export function applyAutomatic(part: Part): Part {
  const drop = new Set(buildCleanupPlan(part).automatic.filter(action => action.kind === 'drop-zero').flatMap(action => action.geometryRefs));
  const keep = (curves: Curve[]) => curves.filter(curve => !drop.has(curve.id));
  return {
    ...part,
    outer: { ...part.outer, curves: keep(part.outer.curves) },
    inner: part.inner.map(loop => ({ ...loop, curves: keep(loop.curves) })),
    openPaths: part.openPaths.map(loop => ({ ...loop, curves: keep(loop.curves) })),
  };
}

export function findingsForCleanup(part: Part): Finding[] {
  const plan = buildCleanupPlan(part);
  return [
    ...plan.automatic.map(action => finding('info', action.kind === 'drop-zero' ? 'GEO-004' : 'GEO-001', action.label, { geometryRefs: action.geometryRefs })),
    ...plan.proposed.map(action => finding('warning', action.kind === 'close-gap' ? 'TOP-003' : 'GEO-003', action.label, { geometryRefs: action.geometryRefs })),
  ];
}

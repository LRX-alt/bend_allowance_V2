import type { Bbox, Curve, Loop } from '@sviluppolamiera/geom2d';
import type { Finding } from './finding';

export type Unit = 'mm' | 'inch';
export type EntityId = string;

export type AnchorRef = 'minX' | 'maxX' | 'minY' | 'maxY' | 'absolute' | 'group' | 'unset';

export interface Anchor {
  x: AnchorRef;
  y: AnchorRef;
}

export interface Tolerances {
  point: number;
  stitchSuggest: number;
  micro: number;
  angular: number;
}

export interface FeatureBase {
  id: EntityId;
  loopId: EntityId;
  anchor: Anchor;
  groupId?: string;
  locked: boolean;
}

export interface HoleFeature extends FeatureBase {
  kind: 'hole';
  center: { x: number; y: number };
  diameter: number;
}

export interface SlotFeature extends FeatureBase {
  kind: 'slot';
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  width: number;
}

export interface RectCutFeature extends FeatureBase {
  kind: 'rect';
  center: { x: number; y: number };
  w: number;
  h: number;
  rotationRad: number;
  cornerRadius: number;
}

export interface GenericCutFeature extends FeatureBase {
  kind: 'generic';
  centroid: { x: number; y: number };
}

export type Feature = HoleFeature | SlotFeature | RectCutFeature | GenericCutFeature;

export interface BendLine {
  id: EntityId;
  a: { x: number; y: number };
  b: { x: number; y: number };
  angleDeg?: number;
  direction?: 'up' | 'down';
  innerRadius?: number;
  zoneHalfWidth?: number;
  source: 'layer' | 'manual';
  layer?: string;
}

export interface Provenance {
  sourceFileName?: string;
  sourceFormat?: 'dxf' | 'manual';
  sourceHash?: string;
  declaredUnits?: Unit | 'unknown';
  assumedUnits?: Unit;
  unitsConfirmedByUser: boolean;
  importedAt?: string;
  hadUnsupportedCurves?: boolean;
  unsupportedCurvesDecision?: 'approximated' | 'rejected';
  approximationTolerance?: number;
}

export interface MaterialRef {
  dbId: string;
  kFactorOverride?: number;
}

export interface BendSetup {
  vOpening?: number;
  process: 'airBend' | 'bottoming' | 'coining';
  method: 'standard' | 'DIN6935' | 'ANSI' | 'customK';
  grainDirection: 'parallelaPiega' | 'perpendicolarePiega';
  dimensionReference: 'external' | 'internal' | 'flat';
}

export interface Annotation {
  id: EntityId;
  kind: 'text' | 'dimension' | 'other';
  layer: string;
  raw: unknown;
  bbox?: Bbox;
}

export interface Part {
  schemaVersion: 1;
  id: string;
  name: string;
  units: Unit;
  tolerances: Tolerances;
  thickness?: number;
  material?: MaterialRef;
  outer: Loop;
  inner: Loop[];
  features: Feature[];
  bendLines: BendLine[];
  openPaths: Loop[];
  annotations: Annotation[];
  bendSetup: BendSetup;
  provenance: Provenance;
}

export type PartStatus = 'valid' | 'incompleteForDomain' | 'invalid';

export interface ValidationResult {
  status: PartStatus;
  findings: Finding[];
  can: {
    view: boolean;
    measure: boolean;
    editGeometry: boolean;
    computeBend: boolean;
    exportDxf: boolean;
  };
}

export interface GroupProposal {
  featureIds: EntityId[];
  axis: 'x' | 'y';
  pitch: number;
  confidence: number;
}

export interface EditorState {
  current: Part;
  past: string[];
  future: string[];
  pastLabels: string[];
  futureLabels: string[];
  validation: ValidationResult;
  findings: Finding[];
}

export interface HistoryConfig {
  maxStates: number;
}

export const DEFAULT_HISTORY: HistoryConfig = { maxStates: 50 };

export type { Curve, Loop };

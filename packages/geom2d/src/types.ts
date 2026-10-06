export type EntityId = string;

export interface Pt {
  x: number;
  y: number;
}

export interface Bbox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Line {
  id: EntityId;
  kind: 'line';
  a: Pt;
  b: Pt;
}

export interface Arc {
  id: EntityId;
  kind: 'arc';
  c: Pt;
  r: number;
  /** angoli in radianti */
  a0: number;
  a1: number;
  ccw: boolean;
}

export type Curve = Line | Arc;

export interface Loop {
  id: EntityId;
  curves: Curve[];
  closed: boolean;
  signedArea: number;
  bbox: Bbox;
  sourceLayer?: string;
}

export interface Tolerances {
  /** coincidenza topologica, mm */
  point: number;
  /** soglia per PROPORRE la chiusura di un gap. Mai automatica */
  stitchSuggest: number;
  /** sotto questa lunghezza l'entita viene SEGNALATA come microsegmento */
  micro: number;
  /** scostamento angolare per la collinearita, radianti */
  angular: number;
}

/**
 * Valori ufficiali di dominio. Li usa `part-model` alla creazione di un Part.
 * Nessuna funzione di geom2d li applica come default implicito.
 */
export const DEFAULT_TOLERANCES: Tolerances = {
  point: 0.01,
  stitchSuggest: 0.05,
  micro: 0.05,
  angular: 0.001,
};

/** Epsilon numerico privato: non e' una tolleranza di dominio e non si esporta. */
export const NUMERIC_EPS = 1e-12;

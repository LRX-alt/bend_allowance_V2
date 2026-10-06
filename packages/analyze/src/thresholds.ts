/** Soglie di producibilita. I controlli leggono solo questo file. */
export const producibilityThresholds = {
  /** Distanza minima feature-piega oltre la zona: R + clearanceFactor * T */
  bendClearanceFactor: 1.5,
  /** Distanza minima feature-bordo e feature-feature, in spessori */
  featureClearanceFactor: 2,
  /** Lembo sotto il minimo geometrico e errore; sotto il consigliato e avviso */
  flangeBends: 1,
  minScale: 1,
  maxScale: 6000,
};

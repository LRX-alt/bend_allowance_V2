// BendingCalculator.js
//
// COMPAT: questo file e ora un thin wrapper sul motore unificato
// `bendingEngine.js`. Mantiene le firme storiche usate dai componenti
// (DiFurioCalculator, AdvancedCalculations, useBendCalculator) per non
// rompere le importazioni esistenti. La logica vive nel motore.

import {
  bendAllowanceByMethod,
  calcolaPiega,
  calcolaSviluppo,
  calcolaBendDeductionDiFurio as engineDiFurio,
} from './bendingEngine.js';

/**
 * Bend Allowance classica: BA = rad(angolo) * (R + K*T).
 */
export function calcolaBendAllowance(angolo, fattoreK, spessore, raggioPiega) {
  return bendAllowanceByMethod(Math.abs(angolo), spessore, raggioPiega, 'standard', fattoreK);
}

/**
 * Setback: SB = (R + T) * tan(angolo/2).
 */
export function calcolaSetback(angolo, spessore, raggioPiega) {
  return calcolaPiega({ angolo, T: spessore, R: raggioPiega, K: 0, metodo: 'standard' }).setback;
}

/**
 * Sviluppo della lamiera sui segmenti (lunghezza piatta da tagliare).
 * Il parametro `metodoDiCalcolo` e mantenuto per compatibilita ma non altera
 * piu il risultato: la vecchia "correzione lunghezza" empirica e stata rimossa
 * perche priva di base fisica e sommata erroneamente alla bend deduction.
 */
export function calcolaDettagliSegmenti(
  segments,
  spessore,
  raggioPiega,
  fattoreK,
  // eslint-disable-next-line no-unused-vars
  metodoDiCalcolo = 'standard'
) {
  const { dettagli, sviluppoTotale } = calcolaSviluppo({
    segments,
    T: spessore,
    R: raggioPiega,
    K: fattoreK,
    metodo: 'standard',
  });
  return { sviluppoTotale, dettagli };
}

/**
 * Bend Deduction con metodo Di Furio (misure esterne delle flange).
 */
export function calcolaBendDeductionDiFurio(angolo, latoA, latoB, fattoreK, raggioPiega, spessore) {
  return engineDiFurio(angolo, latoA, latoB, fattoreK, raggioPiega, spessore);
}

// src/utils/BendingCalculatorAdvanced.js
//
// COMPAT: thin wrapper sul motore unificato `bendingEngine.js`. Mantiene le
// firme storiche usate dalla UI (Calculator.vue, AdvancedCalculations.vue,
// ParametersInput.vue, DiFurioCalculator.vue).

import {
  bendAllowanceByMethod,
  calcolaSpringback as engineSpringback,
  calcolaForzaPiega as engineForza,
  calcolaRaggioMinimo as engineRaggioMinimo,
  calcolaAperturaMatrice as engineApertura,
  calcolaRaggioEffettivo as engineRaggioEffettivo,
  calcoliAvanzatiPiegatura as engineAvanzati,
} from './bendingEngine.js';

/**
 * Bend allowance con metodo selezionabile.
 * Firma storica: (angolo, spessore, raggioPiega, metodo, fattoreK).
 */
export function calcolaBendAllowanceAvanzato(
  angolo,
  spessore,
  raggioPiega,
  metodo,
  fattoreK = 0.33
) {
  return bendAllowanceByMethod(Math.abs(angolo), spessore, raggioPiega, metodo, fattoreK);
}

export function calcolaSpringback(angolo, materiale, spessore, raggioPiega, processo = 'airBend') {
  return engineSpringback(angolo, materiale, spessore, raggioPiega, processo);
}

export function calcolaForzaPiega(lunghezzaPiega, spessore, materiale, larghezzaMatrice) {
  return engineForza(lunghezzaPiega, spessore, materiale, larghezzaMatrice);
}

export function calcolaRaggioMinimo(materiale, spessore, direzione = 'parallelaPiega') {
  return engineRaggioMinimo(materiale, spessore, direzione);
}

export function calcolaAperturaMatrice(spessore, processo = 'airBend', materiale = 'acciaio') {
  return engineApertura(spessore, processo, materiale);
}

export function calcolaRaggioEffettivo(
  spessore,
  larghezzaMatrice,
  raggioPiegaBase = null,
  processo = 'airBend'
) {
  return engineRaggioEffettivo(spessore, larghezzaMatrice, raggioPiegaBase, processo);
}

export function calcoliAvanzatiPiegatura(params) {
  return engineAvanzati(params);
}

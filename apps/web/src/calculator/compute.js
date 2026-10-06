import { calcolaBendDeductionDiFurio, calcolaSviluppo } from '@sviluppolamiera/bend-core';

export function computeExternal({ angolo, latoA, latoB, fattoreK, raggio, spessore }) {
  return calcolaBendDeductionDiFurio(angolo, latoA, latoB, fattoreK, raggio, spessore);
}

export function computeProfile({ segments, spessore, raggio, fattoreK }) {
  return calcolaSviluppo({
    segments,
    T: spessore,
    R: raggio,
    K: fattoreK,
    metodo: 'standard',
  });
}

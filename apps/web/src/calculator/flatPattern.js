import { calcolaSviluppo } from '@sviluppolamiera/bend-core';

/**
 * Sviluppo in piano del profilo.
 * Le quote esterne diventano tratti diritti e zone di piega (bend allowance).
 * La linea di piega sta al centro della zona. La larghezza è il lato lungo la piega.
 */
export function sviluppoPiatto({ segments, spessore, raggio, fattoreK, larghezza }) {
  const list = Array.isArray(segments) ? segments : [];
  const computed = calcolaSviluppo({
    segments: list,
    T: Number(spessore) || 0,
    R: Number(raggio) || 0,
    K: Number(fattoreK) || 0,
    metodo: 'standard',
  });
  const width = Number(larghezza) > 0 ? Number(larghezza) : 100;
  const length = computed.sviluppoTotale;
  const bends = [];
  let x = 0;

  for (let i = 0; i < computed.dettagli.length; i += 1) {
    const detail = computed.dettagli[i];
    const next = computed.dettagli[i + 1];
    const segment = list[i] || {};
    const setbackPrev = detail.bendDeduction != null ? Number(detail.setback) || 0 : 0;
    const setbackNext = next && next.bendDeduction != null ? Number(next.setback) || 0 : 0;

    if (i > 0 && detail.angolo && detail.bendAllowance > 0) {
      const zone = detail.bendAllowance;
      const tipo = (segment.tipoPiega || 'su') === 'giu' ? 'giu' : 'su';
      const angolo = Math.abs(detail.angolo);
      bends.push({
        x: x + zone / 2,
        angolo,
        tipo,
        raggio: detail.raggioUsato,
        layer: `PIEGA_${Math.round(angolo)}_${tipo === 'giu' ? 'GIU' : 'SU'}`,
      });
      x += zone;
    }

    x += Math.max(0, detail.lunghezzaEffettiva - setbackPrev - setbackNext);
  }

  const marks = [0, ...bends.map(bend => bend.x), length];
  const quote = [];
  for (let i = 1; i < marks.length; i += 1) {
    const from = marks[i - 1];
    const to = marks[i];
    if (to - from <= 0.05) continue;
    quote.push({
      x: (from + to) / 2,
      y: width + 8,
      text: `${(to - from).toFixed(2)} mm`,
    });
  }
  for (const bend of bends) {
    quote.push({
      x: bend.x,
      y: width - Math.min(8, width / 3),
      text: `${bend.angolo}° ${bend.tipo}`,
    });
  }

  return {
    lunghezza: length,
    larghezza: width,
    contorno:
      length > 0
        ? [
            { x: 0, y: 0 },
            { x: length, y: 0 },
            { x: length, y: width },
            { x: 0, y: width },
          ]
        : [],
    pieghe: bends.map(bend => ({
      a: { x: bend.x, y: 0 },
      b: { x: bend.x, y: width },
      angolo: bend.angolo,
      tipo: bend.tipo,
      raggio: bend.raggio,
      layer: bend.layer,
      label: `${bend.angolo}° ${bend.tipo}`,
    })),
    quote,
  };
}

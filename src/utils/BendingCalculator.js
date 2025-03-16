// BendingCalculator.js
// Questo file contiene le funzioni per il calcolo della bend allowance, setback e dettagli segmenti.

export function calcolaBendAllowance(angolo, fattoreK, spessore, raggioPiega) {
  // angolo in gradi, convertiamo in radianti
  const angoloRad = (Math.PI / 180) * angolo;
  // Formula classica: BA = angoloRad * (R + K*T)
  return angoloRad * (raggioPiega + fattoreK * spessore);
}

export function calcolaSetback(angolo, spessore, raggioPiega) {
  // SB = (R + T)*tan(angolo/2)
  const angoloRad = (Math.PI / 180) * angolo;
  return (raggioPiega + spessore) * Math.tan(angoloRad / 2);
}

export function calcolaDettagliSegmenti(segments, spessore, raggioPiega, fattoreK) {
  const dettagli = [];
  let sviluppoTotale = 0;

  for (let i = 0; i < segments.length; i++) {
    const segmento = segments[i];
    const angolo = segmento.angle;
    let lunghezzaEffettiva = segmento.length;

    // Esempio di logica semplice per modificare leggermente la lunghezza effettiva
    // Puoi adattare questa parte in base alle tue esigenze
    if (i > 0 && angolo >= 0 && angolo <= 80) {
      lunghezzaEffettiva = segmento.length;
    } else if (i === 0 || i === segments.length - 1) {
      lunghezzaEffettiva -= spessore;
    } else {
      lunghezzaEffettiva -= 2 * spessore;
    }

    let bendAllowance = 0;
    let setback = null;
    let bendDeduction = null;

    // Calcolo BA, SB e BD solo se c'è un angolo di piega
    // e non siamo al primissimo segmento (logica personalizzabile)
    if (i > 0 && angolo !== 0) {
      bendAllowance = calcolaBendAllowance(angolo, fattoreK, spessore, raggioPiega);
      setback = calcolaSetback(angolo, spessore, raggioPiega);
      bendDeduction = 2 * setback - bendAllowance;
    }

    sviluppoTotale += lunghezzaEffettiva + (bendAllowance || 0);

    dettagli.push({
      segmento: i + 1,
      lunghezzaEffettiva,
      bendAllowance,
      setback,
      bendDeduction,
    });
  }

  return { sviluppoTotale, dettagli };
}

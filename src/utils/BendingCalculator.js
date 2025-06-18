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

/**
 * Calcola lo sviluppo della lamiera (lunghezza piatta da tagliare)
 * IMPORTANTE: La lunghezza piatta è diversa dalla Bend Allowance!
 * - Bend Allowance: usata per disegni CAD (lunghezza dell'arco neutro)
 * - Sviluppo lamiera: lunghezza effettiva da tagliare = Lunghezza lineare - Bend Deduction
 */
export function calcolaDettagliSegmenti(segments, spessore, raggioPiega, fattoreK, metodoDiCalcolo = 'standard') {
  const dettagli = [];
  let sviluppoTotale = 0;

  for (let i = 0; i < segments.length; i++) {
    const segmento = segments[i];
    const angolo = segmento.angle;
    let lunghezzaEffettiva = segmento.length;

    // Correzioni delle lunghezze solo per calcoli avanzati
    if (metodoDiCalcolo === 'avanzato') {
      // Correzione della lunghezza in base all'angolo di piega
      if (i > 0 && angolo !== 0) {
        const angoloRad = Math.abs(angolo) * (Math.PI / 180);

        // Calcola la posizione della linea neutra in base all'angolo
        // La posizione varia da 0.5 (centro) a circa 0.33 (verso l'interno)
        const fattoreY = 0.5 - 0.17 * Math.sin(angoloRad);

        // Calcola la correzione della lunghezza
        // Questa formula si basa sulla geometria della piega e tiene conto
        // dello spostamento della linea neutra
        const correzione = spessore * (1 - Math.cos(angoloRad / 2)) * (1 - 2 * fattoreY);
        lunghezzaEffettiva -= correzione;
      }

      // Applica una correzione simile all'ultimo segmento se c'è stata una piega prima
      if (i === segments.length - 1 && i > 0) {
        const prevAngolo = segments[i - 1].angle || 0;
        if (prevAngolo !== 0) {
          const angoloRad = Math.abs(prevAngolo) * (Math.PI / 180);
          const fattoreY = 0.5 - 0.17 * Math.sin(angoloRad);
          const correzione = spessore * (1 - Math.cos(angoloRad / 2)) * (1 - 2 * fattoreY);
          lunghezzaEffettiva -= correzione;
        }
      }
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

    // Per lo sviluppo della lamiera (lunghezza piatta), sottraiamo la bend deduction
    if (bendDeduction !== null) {
      sviluppoTotale += lunghezzaEffettiva - bendDeduction;
    } else {
      sviluppoTotale += lunghezzaEffettiva;
    }

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

/**
 * Calcola la bend deduction secondo il metodo Di Furio
 * Input: misure esterne delle flange, non lunghezze dei segmenti
 * Formula Di Furio: L = Lato A + Lato B - Bend Deduction
 */
export function calcolaBendDeductionDiFurio(angolo, latoA, latoB, fattoreK, raggioPiega, spessore) {
  // Conversione angolo in radianti
  const angoloRad = (Math.PI / 180) * angolo;
  
  // Calcola Bend Allowance
  const bendAllowance = angoloRad * (raggioPiega + fattoreK * spessore);
  
  // Calcola Setback per entrambi i lati
  const setback = (raggioPiega + spessore) * Math.tan(angoloRad / 2);
  
  // Bend Deduction = 2 × Setback - Bend Allowance
  const bendDeduction = 2 * setback - bendAllowance;
  
  // Lunghezza da tagliare = Lato A + Lato B - Bend Deduction
  const lunghezzaDaTagliare = latoA + latoB - bendDeduction;
  
  return {
    bendAllowance,
    setback,
    bendDeduction,
    lunghezzaDaTagliare,
    // Calcoli intermedi per debug
    latoA,
    latoB,
    angolo,
    angoloRad: angoloRad * 180 / Math.PI, // Riconverti per display
    raggioPiega,
    spessore,
    fattoreK
  };
}

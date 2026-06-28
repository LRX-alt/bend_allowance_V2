// src/utils/bendingEngine.js
//
// Motore di calcolo PURO e unificato per la piegatura della lamiera.
// Nessuna dipendenza da Vue: solo funzioni deterministiche e testabili.
//
// Convenzione angolo: `angolo` e l'angolo di PIEGA complementare (90 = piega a
// squadra). Per la magnitudine si usa sempre il valore assoluto; il segno
// indica solo la direzione (su/giu) ed e usato dalla geometria/anteprima, non
// cambia BA/SB/BD.
//
// Formule di base:
//   BA = rad(angolo) * (R + K*T)
//   SB = (R + T) * tan(rad(angolo)/2)
//   BD = 2*SB - BA
//   Sviluppo piatto = somma(lunghezze) - somma(BD di ogni piega)
//
// Casi limite gestiti: angolo 0 (nessuna piega), angoli negativi (magnitudine),
// angoli vicini a 180 (clamp per evitare l'esplosione di tan(angolo/2)).

import { resolveMaterial, risolviFattoreK } from './materials.js';

const DEG2RAD = Math.PI / 180;

// Angolo massimo (in gradi) usato nelle funzioni con tangente per evitare che
// tan(angolo/2) diverga avvicinandosi a 180 gradi.
const MAX_TAN_ANGLE = 179;

/**
 * Limita la magnitudine dell'angolo all'intervallo sicuro per la tangente.
 * @param {number} angoloMagnitudine - magnitudine in gradi (>= 0)
 * @returns {number}
 */
function clampTanAngle(angoloMagnitudine) {
  return Math.min(angoloMagnitudine, MAX_TAN_ANGLE);
}

/**
 * Bend allowance secondo il metodo selezionato.
 * @param {number} angoloMagnitudine - magnitudine angolo in gradi
 * @param {number} T - spessore
 * @param {number} R - raggio interno
 * @param {string} metodo - standard|DIN6935|ANSI|pressbrake|airBend|bottoming|coining|customK
 * @param {number} K - fattore K (usato da standard/customK)
 * @returns {number}
 */
export function bendAllowanceByMethod(angoloMagnitudine, T, R, metodo = 'standard', K = 0.33) {
  const rad = angoloMagnitudine * DEG2RAD;
  switch (metodo) {
    case 'standard':
    case 'customK':
      return rad * (R + K * T);

    case 'DIN6935':
      // DIN 6935: il fattore di posizione della fibra neutra dipende da R/T.
      if (R <= 5 * T) {
        return rad * (R + 0.65 * T);
      }
      return rad * (R + 0.5 * T);

    case 'ANSI':
      // Metodo ANSI/ASME: equivale a 2*setback (utile per piccoli angoli).
      return (R + T) * Math.tan((clampTanAngle(angoloMagnitudine) * DEG2RAD) / 2) * 2;

    case 'pressbrake':
      // EMPIRICO: ottimizzazione per pressopiegatrici moderne. Coefficiente 0.41
      // e termine (1 + 0.01*rad) senza riferimento normativo: usare con cautela.
      return rad * (R + 0.41 * T) * (1 + 0.01 * rad);

    case 'airBend':
      // EMPIRICO: air bending con +10% per springback medio.
      return rad * (R + 0.33 * T) * 1.1;

    case 'bottoming':
    case 'coining':
      // EMPIRICO: bottoming/coining con +2%.
      return rad * (R + 0.42 * T) * 1.02;

    default:
      return rad * (R + 0.33 * T);
  }
}

/**
 * Calcola BA, SB e BD per una singola piega.
 * @param {object} p
 * @param {number} p.angolo - angolo di piega in gradi (segno ignorato per la magnitudine)
 * @param {number} p.T - spessore
 * @param {number} p.R - raggio interno
 * @param {number} [p.K] - fattore K
 * @param {string} [p.metodo] - metodo di calcolo BA
 * @returns {{bendAllowance:number, setback:number, bendDeduction:number, angolo:number, magnitudine:number}}
 */
export function calcolaPiega({ angolo, T, R, K = 0.33, metodo = 'standard' }) {
  const magnitudine = Math.abs(Number(angolo) || 0);

  if (magnitudine === 0) {
    return { bendAllowance: 0, setback: 0, bendDeduction: 0, angolo: angolo || 0, magnitudine: 0 };
  }

  const safeT = Number(T) || 0;
  const safeR = Number(R) || 0;
  const radSafe = clampTanAngle(magnitudine) * DEG2RAD;

  const bendAllowance = bendAllowanceByMethod(magnitudine, safeT, safeR, metodo, K);
  const setback = (safeR + safeT) * Math.tan(radSafe / 2);
  const bendDeduction = 2 * setback - bendAllowance;

  return { bendAllowance, setback, bendDeduction, angolo: angolo || 0, magnitudine };
}

/**
 * Calcola lo sviluppo della lamiera iterando OGNI piega del profilo.
 *
 * Convenzione segmenti (compatibile con la UI esistente): l'angolo memorizzato
 * su `segments[i]` rappresenta la piega che precede il segmento i (quindi il
 * primo segmento, i=0, non ha piega associata).
 *
 * @param {object} input
 * @param {Array<{length:number, angle:number}>} input.segments
 * @param {number} input.T - spessore
 * @param {number} input.R - raggio interno nominale
 * @param {number} [input.K] - fattore K
 * @param {string} [input.metodo] - metodo BA
 * @param {number[]|null} [input.raggiPerPiega] - raggio per ciascun segmento (override di R)
 * @returns {{dettagli:Array, sviluppoTotale:number, lunghezzaLineare:number}}
 */
export function calcolaSviluppo({
  segments,
  T,
  R,
  K = 0.33,
  metodo = 'standard',
  raggiPerPiega = null,
}) {
  const dettagli = [];
  let sviluppoTotale = 0;
  let lunghezzaLineare = 0;

  if (!Array.isArray(segments) || segments.length === 0) {
    return { dettagli, sviluppoTotale, lunghezzaLineare };
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] || {};
    const angolo = typeof seg.angle === 'number' ? seg.angle : 0;
    const lunghezzaEffettiva = Number(seg.length) || 0;
    lunghezzaLineare += lunghezzaEffettiva;

    const raggioUsato =
      raggiPerPiega && typeof raggiPerPiega[i] === 'number' ? raggiPerPiega[i] : R;

    let bendAllowance = 0;
    let setback = null;
    let bendDeduction = null;

    // Una piega esiste solo dal secondo segmento in poi e con angolo non nullo.
    if (i > 0 && angolo !== 0) {
      const p = calcolaPiega({ angolo, T, R: raggioUsato, K, metodo });
      bendAllowance = p.bendAllowance;
      setback = p.setback;
      bendDeduction = p.bendDeduction;
    }

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
      raggioUsato,
      angolo,
    });
  }

  return { dettagli, sviluppoTotale, lunghezzaLineare };
}

/**
 * Calcola lo springback (gradi di sovra-piega) in base a materiale e processo.
 * @param {number} angolo - angolo di piega desiderato (gradi)
 * @param {string} materiale - chiave UI o id DB
 * @param {number} spessore
 * @param {number} raggioPiega
 * @param {string} [processo]
 * @returns {number} angolo di sovra-piega in gradi
 */
export function calcolaSpringback(angolo, materiale, spessore, raggioPiega, processo = 'airBend') {
  const mat = resolveMaterial(materiale);
  const springbackPct = mat.springback[processo] ?? mat.springback.airBend;

  // EMPIRICO: il rapporto R/T modula lo springback (raggi piccoli -> meno
  // ritorno elastico, raggi grandi -> piu ritorno).
  const rtRatio = spessore > 0 ? raggioPiega / spessore : 0;
  let rtModifier = 1.0;
  if (rtRatio < 1) {
    rtModifier = 0.8;
  } else if (rtRatio > 5) {
    rtModifier = 1.3;
  }

  return ((Math.abs(angolo) * springbackPct) / 100) * rtModifier;
}

/**
 * Calcola la forza di piega richiesta.
 * Formula: F[kN] = (k * S * T^2 * L) / (V * 1000)
 *  - k: coefficiente empirico (~1.3) per V-die standard
 *  - S: resistenza a trazione (N/mm^2)
 *  - T: spessore (mm), L: lunghezza piega (mm), V: apertura matrice (mm)
 * @returns {{forzaKN:number, forzaTon:number, forzaSpecificaKNm:number, forzaSpecificaTm:number}}
 */
export function calcolaForzaPiega(lunghezzaPiega, spessore, materiale, larghezzaMatrice) {
  const mat = resolveMaterial(materiale);
  const resistenza = mat.tensileStrength;
  const vDie = larghezzaMatrice && larghezzaMatrice > 0 ? larghezzaMatrice : 8 * spessore;
  const k = 1.3; // EMPIRICO

  const forzaKN = (k * resistenza * Math.pow(spessore, 2) * lunghezzaPiega) / (vDie * 1000);
  const forzaTon = forzaKN * 0.1019;

  // Forza per metro lineare (kN/m e t/m)
  const forzaSpecificaKNm = lunghezzaPiega > 0 ? (forzaKN * 1000) / lunghezzaPiega : 0;
  const forzaSpecificaTm = lunghezzaPiega > 0 ? (forzaTon * 1000) / lunghezzaPiega : 0;

  return { forzaKN, forzaTon, forzaSpecificaKNm, forzaSpecificaTm };
}

/**
 * Raggio minimo di piega consigliato (moltiplicatore dello spessore per direzione).
 * @returns {number}
 */
export function calcolaRaggioMinimo(materiale, spessore, direzione = 'parallelaPiega') {
  const mat = resolveMaterial(materiale);
  const fattore = mat.minRadius[direzione] ?? mat.minRadius.parallelaPiega;
  return fattore * spessore;
}

// Fattori di apertura matrice per processo (moltiplicatore dello spessore).
const FATTORI_PROCESSO_VDIE = {
  airBend: 8,
  bottoming: 6,
  coining: 5,
};

/**
 * Apertura ottimale della matrice (V-die) e range consigliato (+/-15%).
 * @returns {{aperturaOttimale:number, rangeConsigliato:{min:number, max:number}}}
 */
export function calcolaAperturaMatrice(spessore, processo = 'airBend', materiale = 'acciaio') {
  const mat = resolveMaterial(materiale);
  const fattoreBase = FATTORI_PROCESSO_VDIE[processo] ?? FATTORI_PROCESSO_VDIE.airBend;
  const aperturaOttimale = fattoreBase * mat.vDieModifier * spessore;
  return {
    aperturaOttimale,
    rangeConsigliato: { min: aperturaOttimale * 0.85, max: aperturaOttimale * 1.15 },
  };
}

/**
 * Raggio di piega effettivo stimato dalla larghezza della matrice.
 * EMPIRICO: costanti (V/6.6, V/8, V/9, -0.1*T) valide per acciai comuni in air
 * bending; rappresentano una stima e non un valore normativo.
 * @returns {number}
 */
export function calcolaRaggioEffettivo(
  spessore,
  larghezzaMatrice,
  raggioPiegaBase = null,
  processo = 'airBend'
) {
  let raggioEffettivo;
  if (processo === 'bottoming') {
    raggioEffettivo = raggioPiegaBase || larghezzaMatrice / 8.0 - 0.15 * spessore;
  } else if (processo === 'coining') {
    raggioEffettivo = raggioPiegaBase || larghezzaMatrice / 9.0;
  } else {
    // air bending e default
    raggioEffettivo = larghezzaMatrice / 6.6 - 0.1 * spessore;
  }
  return Math.max(0.1 * spessore, raggioEffettivo);
}

/**
 * Calcoli avanzati per UNA singola piega (compat con AdvancedCalculations.vue).
 * @param {object} params
 * @returns {object}
 */
export function calcoliAvanzatiPiegatura(params) {
  const {
    spessore,
    raggioPiega,
    angolo,
    lunghezzaPiega,
    materiale = 'acciaio',
    processo = 'airBend',
    metodo = 'standard',
    fattoreK = 0.33,
    direzione = 'parallelaPiega',
    larghezzaMatrice = null,
  } = params;

  let raggioEffettivo = raggioPiega;
  if (larghezzaMatrice && larghezzaMatrice > 0) {
    raggioEffettivo = calcolaRaggioEffettivo(spessore, larghezzaMatrice, raggioPiega, processo);
  }

  const piega = calcolaPiega({ angolo, T: spessore, R: raggioEffettivo, K: fattoreK, metodo });
  const springback = calcolaSpringback(angolo, materiale, spessore, raggioEffettivo, processo);
  const raggioMinimo = calcolaRaggioMinimo(materiale, spessore, direzione);
  const aperturaMatrice = calcolaAperturaMatrice(spessore, processo, materiale);
  const forzaPiega = calcolaForzaPiega(
    lunghezzaPiega,
    spessore,
    materiale,
    larghezzaMatrice || aperturaMatrice.aperturaOttimale
  );

  return {
    bendAllowance: piega.bendAllowance,
    springback,
    setback: piega.setback,
    bendDeduction: piega.bendDeduction,
    raggioMinimo,
    aperturaMatrice,
    forzaPiega,
    angoloEffettivo: Math.abs(angolo) + springback,
    raggioAdeguato: raggioEffettivo >= raggioMinimo,
    raggioEffettivo,
    info: {
      processoUsato: processo,
      metodoCalcolo: metodo,
      materiale,
      fattoreK: metodo === 'customK' ? fattoreK : null,
      larghezzaMatrice,
    },
  };
}

/**
 * Calcoli avanzati PER OGNI piega del profilo.
 * Corregge il bug per cui un singolo valore BA/SB/BD veniva applicato a tutte le
 * pieghe: ora ogni piega usa il proprio angolo e (se presente) il proprio raggio.
 *
 * @param {object} input
 * @returns {{dettagli:Array, sviluppoTotale:number, lunghezzaLineare:number, raggioMinimo:number, aperturaMatrice:object, forzaPiega:object, raggioEffettivo:number, raggioAdeguato:boolean, info:object}}
 */
export function calcoliAvanzatiPerPiega(input) {
  const {
    segments,
    spessore,
    raggioPiega,
    fattoreK = 0.33,
    metodo = 'standard',
    materiale = 'acciaio',
    processo = 'airBend',
    direzione = 'parallelaPiega',
    larghezzaMatrice = null,
  } = input;

  const usaMatrice = !!(larghezzaMatrice && larghezzaMatrice > 0);
  const raggioEffettivoGlobale = usaMatrice
    ? calcolaRaggioEffettivo(spessore, larghezzaMatrice, raggioPiega, processo)
    : raggioPiega;

  const dettagli = [];
  let sviluppoTotale = 0;
  let lunghezzaLineare = 0;
  let maxBendLength = 0;

  if (Array.isArray(segments)) {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i] || {};
      const angolo = typeof seg.angle === 'number' ? seg.angle : 0;
      const lunghezzaEffettiva = Number(seg.length) || 0;
      lunghezzaLineare += lunghezzaEffettiva;

      let bendAllowance = 0;
      let setback = null;
      let bendDeduction = null;
      let springback = 0;
      let angoloEffettivo = angolo;

      if (i > 0 && angolo !== 0) {
        const piega = calcolaPiega({
          angolo,
          T: spessore,
          R: raggioEffettivoGlobale,
          K: fattoreK,
          metodo,
        });
        bendAllowance = piega.bendAllowance;
        setback = piega.setback;
        bendDeduction = piega.bendDeduction;
        springback = calcolaSpringback(
          angolo,
          materiale,
          spessore,
          raggioEffettivoGlobale,
          processo
        );
        angoloEffettivo = Math.abs(angolo) + springback;
        if (lunghezzaEffettiva > maxBendLength) maxBendLength = lunghezzaEffettiva;
      }

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
        springback,
        angoloEffettivo,
        raggioEffettivo: i > 0 && angolo !== 0 ? raggioEffettivoGlobale : raggioPiega,
        angolo,
      });
    }
  }

  const raggioMinimo = calcolaRaggioMinimo(materiale, spessore, direzione);
  const aperturaMatrice = calcolaAperturaMatrice(spessore, processo, materiale);
  const lunghezzaPerForza = maxBendLength > 0 ? maxBendLength : 100;
  const forzaPiega = calcolaForzaPiega(
    lunghezzaPerForza,
    spessore,
    materiale,
    larghezzaMatrice || aperturaMatrice.aperturaOttimale
  );

  return {
    dettagli,
    sviluppoTotale,
    lunghezzaLineare,
    raggioMinimo,
    aperturaMatrice,
    forzaPiega,
    raggioEffettivo: raggioEffettivoGlobale,
    raggioAdeguato: raggioEffettivoGlobale >= raggioMinimo,
    info: {
      processoUsato: processo,
      metodoCalcolo: metodo,
      materiale,
      larghezzaMatrice,
    },
  };
}

/**
 * Bend deduction con il metodo Di Furio (misure esterne delle flange).
 * L = LatoA + LatoB - BD
 * @returns {object}
 */
export function calcolaBendDeductionDiFurio(angolo, latoA, latoB, fattoreK, raggioPiega, spessore) {
  const piega = calcolaPiega({
    angolo,
    T: spessore,
    R: raggioPiega,
    K: fattoreK,
    metodo: 'standard',
  });
  const lunghezzaDaTagliare = latoA + latoB - piega.bendDeduction;
  return {
    bendAllowance: piega.bendAllowance,
    setback: piega.setback,
    bendDeduction: piega.bendDeduction,
    lunghezzaDaTagliare,
    latoA,
    latoB,
    angolo,
    raggioPiega,
    spessore,
    fattoreK,
  };
}

export { risolviFattoreK, resolveMaterial };

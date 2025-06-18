// src/utils/BendingCalculatorAdvanced.js

/**
 * Calcolo della bend allowance con vari metodi standard industriali
 * @param {number} angolo - Angolo di piega in gradi
 * @param {number} spessore - Spessore del materiale (T)
 * @param {number} raggioPiega - Raggio interno di piega (R)
 * @param {string} metodo - Metodo di calcolo
 * @param {number} fattoreK - Fattore K (solo per metodo personalizzato)
 * @returns {number} - Bend Allowance calcolata
 */
export function calcolaBendAllowanceAvanzato(
  angolo,
  spessore,
  raggioPiega,
  metodo,
  fattoreK = 0.33
) {
  // Angolo in radianti
  const angoloRad = Math.abs(angolo) * (Math.PI / 180);

  switch (metodo) {
    case 'standard':
      // Formula classica: BA = angoloRad * (R + K*T)
      return angoloRad * (raggioPiega + fattoreK * spessore);

    case 'DIN6935':
      // Standard tedesco DIN 6935
      if (raggioPiega <= 5 * spessore) {
        return angoloRad * (raggioPiega + 0.65 * spessore);
      } else {
        return angoloRad * (raggioPiega + 0.5 * spessore);
      }

    case 'ANSI':
      // Metodo ANSI/ASME per piccoli angoli
      return (raggioPiega + spessore) * Math.tan(angoloRad / 2) * 2;

    case 'pressbrake':
      // Formula ottimizzata per pressopiegatrici moderne
      return angoloRad * (raggioPiega + 0.41 * spessore) * (1 + 0.01 * angoloRad);

    case 'airBend':
      // Formula per air bending
      return angoloRad * (raggioPiega + 0.33 * spessore) * 1.1; // 10% extra per springback

    case 'bottoming':
      // Formula per bottoming/coining
      return angoloRad * (raggioPiega + 0.42 * spessore) * 1.02; // 2% extra

    case 'customK':
      // Utilizzo del fattore K personalizzato
      return angoloRad * (raggioPiega + fattoreK * spessore);

    default:
      // Default al metodo standard
      return angoloRad * (raggioPiega + 0.33 * spessore);
  }
}

/**
 * Calcola lo springback (ritorno elastico) in base al materiale e al processo
 * @param {number} angolo - Angolo di piega desiderato in gradi
 * @param {string} materiale - Tipo di materiale
 * @param {number} spessore - Spessore del materiale
 * @param {number} raggioPiega - Raggio di piega
 * @param {string} processo - Processo di piega ('airBend', 'bottoming', 'coining')
 * @returns {number} - Angolo di sovra-piega necessario in gradi
 */
export function calcolaSpringback(angolo, materiale, spessore, raggioPiega, processo = 'airBend') {
  // Fattori di springback in percentuale (%)
  const springbackFactors = {
    acciaio: { airBend: 3, bottoming: 1, coining: 0.5 },
    alluminio: { airBend: 8, bottoming: 3, coining: 1 },
    rame: { airBend: 5, bottoming: 2, coining: 0.8 },
    ottone: { airBend: 4, bottoming: 1.5, coining: 0.7 },
    inox: { airBend: 7, bottoming: 2.5, coining: 1 },
    titanio: { airBend: 12, bottoming: 5, coining: 2 },
  };

  // Default per materiali non elencati
  const defaultFactor = { airBend: 5, bottoming: 2, coining: 1 };

  // Ottieni il fattore di springback appropriato
  const materialFactors = springbackFactors[materiale.toLowerCase()] || defaultFactor;
  const springbackPercent = materialFactors[processo] || materialFactors.airBend;

  // Calcola l'effetto del rapporto R/T
  const rtRatio = raggioPiega / spessore;
  let rtModifier = 1.0;

  if (rtRatio < 1) {
    rtModifier = 0.8; // Meno springback per raggi piccoli
  } else if (rtRatio > 5) {
    rtModifier = 1.3; // Più springback per raggi grandi
  }

  // Calcola l'angolo di sovra-piega necessario
  const springbackAngle = ((angolo * springbackPercent) / 100) * rtModifier;

  return springbackAngle;
}

/**
 * Calcola la forza di piega richiesta
 * @param {number} lunghezzaPiega - Lunghezza della piega in mm
 * @param {number} spessore - Spessore del materiale in mm
 * @param {string} materiale - Tipo di materiale
 * @param {number} larghezzaMatrice - Larghezza apertura matrice (V-die) in mm
 * @returns {object} - Forza di piega in kN, tonnellate e pressione massima
 */
export function calcolaForzaPiega(lunghezzaPiega, spessore, materiale, larghezzaMatrice) {
  // Resistenza a trazione dei materiali in N/mm²
  const resistenzaMateriali = {
    acciaio: 370,
    alluminio: 110,
    rame: 220,
    ottone: 340,
    inox: 520,
    titanio: 900,
  };

  // Resistenza di default
  const resistenza = resistenzaMateriali[materiale.toLowerCase()] || 370;

  // Se la larghezza matrice non è specificata, usare una stima standard (8*T)
  const vDie = larghezzaMatrice || 8 * spessore;

  // Formula standard per calcolo forza pressopiegatura (kN)
  // F = (K * S * T² * L) / V
  // Dove K è un coefficiente, S è la resistenza del materiale, T lo spessore,
  // L la lunghezza e V la larghezza matrice

  // Coefficiente K (varia in base alla resistenza del materiale)
  const k = 1.3;

  // Calcolo forza in kN
  const forzaKN = (k * resistenza * Math.pow(spessore, 2) * lunghezzaPiega) / (vDie * 1000);

  // Conversione in tonnellate (1 kN = 0.1019 tonnellate)
  const forzaTon = forzaKN * 0.1019;

  // Calcolo pressione massima (N/mm²)
  const pressioneMax = (forzaKN * 1000) / (lunghezzaPiega * spessore);

  return {
    forzaKN: forzaKN,
    forzaTon: forzaTon,
    pressioneMax: pressioneMax,
  };
}

/**
 * Calcola il raggio minimo di piega consigliato
 * @param {string} materiale - Tipo di materiale
 * @param {number} spessore - Spessore del materiale in mm
 * @param {string} direzione - Direzione di piega rispetto alla grana (parallelaPiega|perpendicolarePiega)
 * @returns {number} - Raggio minimo di piega consigliato in mm
 */
export function calcolaRaggioMinimo(materiale, spessore, direzione = 'parallelaPiega') {
  // Fattori per il raggio minimo rispetto allo spessore
  // Valori diversi per piega parallela o perpendicolare alla grana
  const fattoriMinimi = {
    acciaio: { parallelaPiega: 0.5, perpendicolarePiega: 0.8 },
    alluminio: { parallelaPiega: 1.0, perpendicolarePiega: 1.5 },
    rame: { parallelaPiega: 0.4, perpendicolarePiega: 0.7 },
    ottone: { parallelaPiega: 1.0, perpendicolarePiega: 1.5 },
    inox: { parallelaPiega: 0.7, perpendicolarePiega: 1.0 },
    titanio: { parallelaPiega: 2.5, perpendicolarePiega: 3.5 },
  };

  // Default per materiali non specificati
  const defaultFattore = { parallelaPiega: 1.0, perpendicolarePiega: 1.5 };

  // Ottieni il fattore appropriato
  const fattoriMateriale = fattoriMinimi[materiale.toLowerCase()] || defaultFattore;
  const fattore = fattoriMateriale[direzione] || fattoriMateriale.parallelaPiega;

  // Calcola e restituisci il raggio minimo
  return fattore * spessore;
}

/**
 * Calcola l'apertura ottimale della matrice (V-die)
 * @param {number} spessore - Spessore del materiale in mm
 * @param {string} processo - Processo di piega ('airBend', 'bottoming', 'coining')
 * @param {string} materiale - Tipo di materiale
 * @returns {object} - Apertura ottimale e range consigliato
 */
export function calcolaAperturaMatrice(spessore, processo = 'airBend', materiale = 'acciaio') {
  // Fattori per diversi processi (moltiplicatore dello spessore)
  const fattoriProcesso = {
    airBend: 8,
    bottoming: 6,
    coining: 5,
  };

  // Modificatori per materiale
  const modificatoriMateriale = {
    acciaio: 1.0,
    alluminio: 0.9,
    rame: 0.95,
    ottone: 0.9,
    inox: 1.1,
    titanio: 1.2,
  };

  // Ottieni fattore base e modificatore
  const fattoreBase = fattoriProcesso[processo] || fattoriProcesso.airBend;
  const modificatore = modificatoriMateriale[materiale.toLowerCase()] || 1.0;

  // Calcola l'apertura ottimale
  const aperturaOttimale = fattoreBase * modificatore * spessore;

  // Calcola il range consigliato (±15%)
  const min = aperturaOttimale * 0.85;
  const max = aperturaOttimale * 1.15;

  return {
    aperturaOttimale: aperturaOttimale,
    rangeConsigliato: {
      min: min,
      max: max,
    },
  };
}

/**
 * Calcola il raggio di piega effettivo in base alla larghezza della matrice
 * @param {number} spessore - Spessore del materiale in mm
 * @param {number} larghezzaMatrice - Larghezza apertura matrice (V-die) in mm
 * @param {number} raggioPiegaBase - Raggio di piega desiderato (se presente)
 * @param {string} processo - Processo di piega ('airBend', 'bottoming', 'coining')
 * @returns {number} - Raggio di piega effettivo in mm
 */
export function calcolaRaggioEffettivo(
  spessore,
  larghezzaMatrice,
  raggioPiegaBase = null,
  processo = 'airBend'
) {
  // Per air bending (processo standard), il raggio interno è fortemente influenzato dalla larghezza matrice

  // Base per il calcolo
  let raggioEffettivo;

  if (processo === 'airBend') {
    // In air bending, il raggio è principalmente determinato da V-die e spessore
    // Formula empirica: R ≈ V/6.6 per acciai comuni
    raggioEffettivo = larghezzaMatrice / 6.6 - 0.1 * spessore;
  } else if (processo === 'bottoming') {
    // Nel bottoming, il raggio è più vicino al raggio desiderato
    raggioEffettivo = raggioPiegaBase || larghezzaMatrice / 8.0 - 0.15 * spessore;
  } else if (processo === 'coining') {
    // Nel coining, il raggio è quasi uguale al raggio dello stampo
    raggioEffettivo = raggioPiegaBase || larghezzaMatrice / 9.0;
  } else {
    // Default - fallback alla formula di air bending
    raggioEffettivo = larghezzaMatrice / 6.6 - 0.1 * spessore;
  }

  // Assicuriamoci che il raggio non sia inferiore a 0
  raggioEffettivo = Math.max(0.1 * spessore, raggioEffettivo);

  return raggioEffettivo;
}

/**
 * Esegue calcoli avanzati completi per piegatura lamiera
 * @param {object} params - Parametri per i calcoli
 * @returns {object} - Risultati completi dei calcoli
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

  // Calcola il raggio effettivo se è specificata la larghezza matrice
  let raggioEffettivo = raggioPiega;
  if (larghezzaMatrice && larghezzaMatrice > 0) {
    raggioEffettivo = calcolaRaggioEffettivo(spessore, larghezzaMatrice, raggioPiega, processo);
  }

  // Calcola bend allowance usando il raggio effettivo
  const bendAllowance = calcolaBendAllowanceAvanzato(
    angolo,
    spessore,
    raggioEffettivo, // Usa raggio effettivo qui
    metodo,
    fattoreK
  );

  // Calcola springback
  const springback = calcolaSpringback(
    angolo,
    materiale,
    spessore,
    raggioEffettivo, // Usa raggio effettivo qui
    processo
  );

  // Calcola il raggio minimo
  const raggioMinimo = calcolaRaggioMinimo(materiale, spessore, direzione);

  // Calcola l'apertura ottimale della matrice
  const aperturaMatrice = calcolaAperturaMatrice(spessore, processo, materiale);

  // Calcola la forza di piegatura
  const forzaPiega = calcolaForzaPiega(
    lunghezzaPiega,
    spessore,
    materiale,
    larghezzaMatrice || aperturaMatrice.aperturaOttimale
  );

  // Calcola setback e bend deduction
  const angoloRad = Math.abs(angolo) * (Math.PI / 180);
  const setback = (raggioEffettivo + spessore) * Math.tan(angoloRad / 2); // Usa raggio effettivo qui
  const bendDeduction = 2 * setback - bendAllowance;

  // Restituisci tutti i risultati
  return {
    bendAllowance,
    springback,
    setback,
    bendDeduction,
    raggioMinimo,
    aperturaMatrice,
    forzaPiega,
    // Angolo vero da impostare sulla macchina per compensare lo springback
    angoloEffettivo: angolo + springback,
    // Verifica se il raggio di piega è adeguato
    raggioAdeguato: raggioEffettivo >= raggioMinimo,
    // Raggio effettivo calcolato
    raggioEffettivo,
    // Informazioni aggiuntive
    info: {
      processoUsato: processo,
      metodoCalcolo: metodo,
      materiale: materiale,
      fattoreK: metodo === 'customK' ? fattoreK : null,
      larghezzaMatrice: larghezzaMatrice,
    },
  };
}

// src/utils/materials.js
//
// Registry unico dei materiali per la piegatura lamiera.
//
// Obiettivo: una sola fonte di verita per i parametri di piegatura usati dal
// motore di calcolo (fattore K, springback per processo, raggio minimo, V-die,
// resistenza a trazione). In precedenza questi valori erano duplicati in piu
// file (Calculator.vue, useBendCalculator.js, BendingCalculatorAdvanced.js) con
// tabelle hardcoded divergenti, mentre MaterialsDatabase.js usava id diversi
// (es. 'steel_mild') rispetto alle chiavi della UI (es. 'acciaio').
//
// Qui riconciliamo i due mondi. I valori numerici sono quelli storicamente
// usati dai calcoli avanzati (per non alterare i risultati a sorpresa); dove il
// dato esiste anche in MaterialsDatabase.js si rimanda a quello come riferimento
// documentale.

import { materialsDatabase, getMaterialById } from './MaterialsDatabase.js';

// Mappatura chiave UI -> id rappresentativo nel database materiali.
export const MATERIAL_KEY_TO_ID = {
  acciaio: 'steel_mild',
  inox: 'steel_stainless_304',
  alluminio: 'aluminum_5052',
  rame: 'copper_pure',
  ottone: 'brass_70_30',
  titanio: 'titanium_grade2',
};

// Mappatura inversa id database -> chiave UI (piu id alluminio sulla stessa chiave).
export const MATERIAL_ID_TO_KEY = {
  steel_mild: 'acciaio',
  steel_dd11: 'acciaio',
  steel_s235jr: 'acciaio',
  steel_s275: 'acciaio',
  steel_s355mc: 'acciaio',
  steel_s420mc: 'acciaio',
  steel_s500mc: 'acciaio',
  steel_s700mc: 'acciaio',
  steel_stainless_304: 'inox',
  aluminum_1100: 'alluminio',
  aluminum_5052: 'alluminio',
  aluminum_6061t6: 'alluminio',
  copper_pure: 'rame',
  brass_70_30: 'ottone',
  titanium_grade2: 'titanio',
};

// Parametri CANONICI per chiave UI che NON sono presenti in MaterialsDatabase.js
// e quindi non possono essere derivati dal DB:
// - label: etichetta UI.
// - springback: ritorno elastico in PERCENTUALE per processo (il DB ha un solo
//   valore aggregato, qui serve la scomposizione per processo).
// - vDieModifier: modificatore dell'apertura matrice per materiale.
//
// I valori derivati dal DB (kFactor, tensileStrength, minRadius) sono presi in
// resolveMaterial() dalla voce rappresentativa del database, che e l'unica
// fonte di verita per quelle grandezze.
const MATERIALS = {
  acciaio: {
    label: 'Acciaio',
    springback: { airBend: 3, bottoming: 1, coining: 0.5 },
    vDieModifier: 1.0,
  },
  inox: {
    label: 'Acciaio Inox',
    springback: { airBend: 7, bottoming: 2.5, coining: 1 },
    vDieModifier: 1.1,
  },
  alluminio: {
    label: 'Alluminio',
    springback: { airBend: 8, bottoming: 3, coining: 1 },
    vDieModifier: 0.9,
  },
  rame: {
    label: 'Rame',
    springback: { airBend: 5, bottoming: 2, coining: 0.8 },
    vDieModifier: 0.95,
  },
  ottone: {
    label: 'Ottone',
    springback: { airBend: 4, bottoming: 1.5, coining: 0.7 },
    vDieModifier: 0.9,
  },
  titanio: {
    label: 'Titanio',
    springback: { airBend: 12, bottoming: 5, coining: 2 },
    vDieModifier: 1.2,
  },
};

// Valori di fallback se la voce del DB non e disponibile.
const FALLBACK = {
  kFactor: 0.33,
  tensileStrength: 370,
  minRadius: { parallelaPiega: 0.5, perpendicolarePiega: 0.8 },
};

// Materiale di fallback (acciaio dolce) usato quando la chiave non e riconosciuta.
const DEFAULT_KEY = 'acciaio';

/**
 * Normalizza un input (chiave UI o id del database) in una chiave UI valida.
 * @param {string} keyOrId
 * @returns {string} chiave UI (es. 'acciaio')
 */
export function normalizeMaterialKey(keyOrId) {
  if (!keyOrId || typeof keyOrId !== 'string') return DEFAULT_KEY;
  const raw = keyOrId.trim();
  const lower = raw.toLowerCase();
  if (MATERIALS[lower]) return lower;
  if (MATERIAL_ID_TO_KEY[raw]) return MATERIAL_ID_TO_KEY[raw];
  if (MATERIAL_ID_TO_KEY[lower]) return MATERIAL_ID_TO_KEY[lower];
  return DEFAULT_KEY;
}

/**
 * Risolve i parametri di piegatura di un materiale a partire da chiave UI o id DB.
 * @param {string} keyOrId
 * @returns {object} parametri normalizzati del materiale
 */
export function resolveMaterial(keyOrId) {
  const raw = typeof keyOrId === 'string' ? keyOrId.trim() : '';

  // Se l'input e un id specifico del database (lega precisa, es. aluminum_6061t6)
  // si usa esattamente quella voce; altrimenti si ricade sul rappresentante della
  // chiave UI generica.
  const directDb = raw ? getMaterialById(raw) : null;
  const key = normalizeMaterialKey(keyOrId);
  const base = MATERIALS[key];
  const dbId = directDb ? directDb.id : MATERIAL_KEY_TO_ID[key];
  const dbEntry = directDb || (dbId ? getMaterialById(dbId) : null);

  // K, resistenza e raggio minimo derivano dal database (fonte unica).
  const kFactor = dbEntry?.bending?.kFactor ?? FALLBACK.kFactor;
  const tensileStrength = dbEntry?.properties?.tensileStrength ?? FALLBACK.tensileStrength;
  const minRadius = {
    parallelaPiega: dbEntry?.bending?.minRadiusParallel ?? FALLBACK.minRadius.parallelaPiega,
    perpendicolarePiega:
      dbEntry?.bending?.minRadiusPerpendicular ?? FALLBACK.minRadius.perpendicolarePiega,
  };

  // Springback: il DB fornisce un valore aggregato per lega (frazione). Lo
  // usiamo come riferimento per l'air bending e scaliamo il profilo per-processo
  // della famiglia mantenendone le proporzioni relative (bottoming/coining).
  const springback = springbackProfile(base.springback, dbEntry?.bending?.springback);

  return {
    key,
    id: dbId || null,
    label: dbEntry ? dbEntry.name : base.label,
    name: dbEntry ? dbEntry.name : base.label,
    kFactor,
    tensileStrength,
    springback,
    minRadius,
    vDieModifier: base.vDieModifier,
    db: dbEntry || null,
  };
}

// Scala il profilo springback della famiglia (per processo) in modo che l'air
// bending coincida con lo springback della lega dal database (frazione -> %).
// Se il dato DB manca, restituisce il profilo della famiglia invariato.
function springbackProfile(familyProfile, dbSpringbackFraction) {
  const round2 = v => Math.round(v * 100) / 100;
  if (typeof dbSpringbackFraction !== 'number' || dbSpringbackFraction <= 0) {
    return { ...familyProfile };
  }
  const targetAir = dbSpringbackFraction * 100;
  const baseAir = familyProfile.airBend || targetAir;
  const factor = targetAir / baseAir;
  return {
    airBend: round2(targetAir),
    bottoming: round2(familyProfile.bottoming * factor),
    coining: round2(familyProfile.coining * factor),
  };
}

/**
 * Converte una chiave UI o un id in un id valido del database materiali.
 * Utile per la UI che ora seleziona la lega specifica.
 * @param {string} keyOrId
 * @returns {string} id del database (es. 'steel_mild')
 */
export function toDatabaseId(keyOrId) {
  const raw = typeof keyOrId === 'string' ? keyOrId.trim() : '';
  if (raw && getMaterialById(raw)) return raw;
  const key = normalizeMaterialKey(keyOrId);
  return MATERIAL_KEY_TO_ID[key] || MATERIAL_KEY_TO_ID[DEFAULT_KEY];
}

/**
 * Restituisce il fattore di springback (in percentuale) per materiale e processo.
 * @param {string} keyOrId
 * @param {string} processo - 'airBend' | 'bottoming' | 'coining'
 * @returns {number} percentuale di springback
 */
export function springbackPercent(keyOrId, processo = 'airBend') {
  const mat = resolveMaterial(keyOrId);
  return mat.springback[processo] ?? mat.springback.airBend;
}

/**
 * Calcola il fattore K dinamico in base al rapporto R/T.
 * Soglie allineate allo standard industriale usato nella UI precedente.
 * @param {number} R - raggio interno
 * @param {number} T - spessore
 * @returns {number} fattore K stimato
 */
export function kFactorDynamic(R, T) {
  const rapporto = T > 0 && R > 0 ? R / T : 0;
  if (rapporto < 0.5) return 0.25;
  if (rapporto < 1) return 0.3;
  if (rapporto < 2) return 0.33;
  if (rapporto < 4) return 0.38;
  if (rapporto < 8) return 0.42;
  return 0.46;
}

/**
 * Risolve il fattore K da usare nei calcoli con una sola fonte di verita.
 * Priorita: dinamico (toggle esplicito) > K manuale valido > K del materiale > 0.33.
 *
 * @param {object} opts
 * @param {number} [opts.fattoreK] - K manuale impostato dall'utente
 * @param {boolean} [opts.dinamico] - se true usa il K dinamico da R/T
 * @param {string} [opts.materialKey] - materiale per fallback K
 * @param {number} [opts.R] - raggio (per K dinamico)
 * @param {number} [opts.T] - spessore (per K dinamico)
 * @returns {number}
 */
export function risolviFattoreK({ fattoreK, dinamico = false, materialKey, R, T } = {}) {
  if (dinamico) {
    return kFactorDynamic(R, T);
  }
  if (typeof fattoreK === 'number' && Number.isFinite(fattoreK) && fattoreK > 0) {
    return fattoreK;
  }
  if (materialKey) {
    return resolveMaterial(materialKey).kFactor;
  }
  return 0.33;
}

/**
 * Mappa dei fattori K per chiave UI (compat con fattoriKMateriali della UI).
 * @returns {object}
 */
export function fattoriKMaterialiDefault() {
  return Object.fromEntries(Object.keys(MATERIALS).map(k => [k, resolveMaterial(k).kFactor]));
}

export { materialsDatabase };

// utils/MaterialsDatabase.js

/**
 * Database completo dei materiali per la piegatura della lamiera
 * Include proprietà fisiche, fattori K, raggi minimi, e suggerimenti di lavorazione
 */
export const materialsDatabase = [
  {
    id: 'steel_mild',
    name: 'Acciaio dolce (S235)',
    category: 'Acciaio',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 400, // MPa
      yieldStrength: 235, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.33,
      minRadiusParallel: 0.5, // x spessore
      minRadiusPerpendicular: 0.8, // x spessore
      springback: 0.04, // 4%
      grainDirection: true // tiene conto della direzione della grana?
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 35 // N/mm²
    },
    notes: 'Facile da piegare, molto comune per applicazioni generali'
  },
  {
    id: 'steel_stainless_304',
    name: 'Acciaio inox AISI 304',
    category: 'Acciaio inossidabile',
    properties: {
      density: 8.0, // g/cm³
      tensileStrength: 520, // MPa
      yieldStrength: 210, // MPa
      elasticModulus: 193000, // MPa
    },
    bending: {
      kFactor: 0.35,
      minRadiusParallel: 1.0, // x spessore
      minRadiusPerpendicular: 1.5, // x spessore
      springback: 0.08, // 8%
      grainDirection: true
    },
    tooling: {
      recommendedVDie: 10, // x spessore
      maxPressure: 45 // N/mm²
    },
    notes: 'Soggetto a incrudimento durante la piegatura, richiede più forza di pressione'
  },
  {
    id: 'aluminum_1100',
    name: 'Alluminio 1100-O',
    category: 'Alluminio',
    properties: {
      density: 2.7, // g/cm³
      tensileStrength: 90, // MPa
      yieldStrength: 35, // MPa
      elasticModulus: 69000, // MPa
    },
    bending: {
      kFactor: 0.40,
      minRadiusParallel: 0.7, // x spessore
      minRadiusPerpendicular: 1.0, // x spessore
      springback: 0.06, // 6%
      grainDirection: false
    },
    tooling: {
      recommendedVDie: 7, // x spessore
      maxPressure: 20 // N/mm²
    },
    notes: 'Molto duttile, facile da piegare, bassa resistenza'
  },
  {
    id: 'aluminum_5052',
    name: 'Alluminio 5052-H32',
    category: 'Alluminio',
    properties: {
      density: 2.68, // g/cm³
      tensileStrength: 228, // MPa
      yieldStrength: 193, // MPa
      elasticModulus: 70300, // MPa
    },
    bending: {
      kFactor: 0.38,
      minRadiusParallel: 1.0, // x spessore
      minRadiusPerpendicular: 1.5, // x spessore
      springback: 0.075, // 7.5%
      grainDirection: true
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 28 // N/mm²
    },
    notes: 'Buon compromesso resistenza/formabilità, comune in applicazioni marine'
  },
  {
    id: 'aluminum_6061t6',
    name: 'Alluminio 6061-T6',
    category: 'Alluminio',
    properties: {
      density: 2.7, // g/cm³
      tensileStrength: 310, // MPa
      yieldStrength: 276, // MPa
      elasticModulus: 68900, // MPa
    },
    bending: {
      kFactor: 0.41,
      minRadiusParallel: 1.5, // x spessore
      minRadiusPerpendicular: 2.5, // x spessore
      springback: 0.095, // 9.5%
      grainDirection: true
    },
    tooling: {
      recommendedVDie: 9, // x spessore
      maxPressure: 32 // N/mm²
    },
    notes: 'Alta resistenza, richiede raggi più ampi per evitare crepe'
  },
  {
    id: 'copper_pure',
    name: 'Rame puro (ricotto)',
    category: 'Rame',
    properties: {
      density: 8.96, // g/cm³
      tensileStrength: 220, // MPa
      yieldStrength: 70, // MPa
      elasticModulus: 117000, // MPa
    },
    bending: {
      kFactor: 0.45,
      minRadiusParallel: 0.4, // x spessore
      minRadiusPerpendicular: 0.7, // x spessore
      springback: 0.04, // 4%
      grainDirection: false
    },
    tooling: {
      recommendedVDie: 7, // x spessore
      maxPressure: 25 // N/mm²
    },
    notes: 'Molto duttile, eccellente formabilità'
  },
  {
    id: 'brass_70_30',
    name: 'Ottone 70/30',
    category: 'Ottone',
    properties: {
      density: 8.53, // g/cm³
      tensileStrength: 340, // MPa
      yieldStrength: 120, // MPa
      elasticModulus: 110000, // MPa
    },
    bending: {
      kFactor: 0.38,
      minRadiusParallel: 1.0, // x spessore
      minRadiusPerpendicular: 1.5, // x spessore
      springback: 0.055, // 5.5%
      grainDirection: false
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 30 // N/mm²
    },
    notes: 'Buona lavorabilità, adatto per decorazioni'
  },
  {
    id: 'titanium_grade2',
    name: 'Titanio Grado 2',
    category: 'Titanio',
    properties: {
      density: 4.51, // g/cm³
      tensileStrength: 485, // MPa
      yieldStrength: 380, // MPa
      elasticModulus: 105000, // MPa
    },
    bending: {
      kFactor: 0.35,
      minRadiusParallel: 2.5, // x spessore
      minRadiusPerpendicular: 3.5, // x spessore
      springback: 0.12, // 12%
      grainDirection: true
    },
    tooling: {
      recommendedVDie: 12, // x spessore
      maxPressure: 50 // N/mm²
    },
    notes: 'Richiede utensili specializzati, alta resistenza al calore'
  }
];

/**
 * Ricerca un materiale nel database per ID
 * @param {string} id - ID del materiale
 * @returns {object|null} - Oggetto materiale o null se non trovato
 */
export function getMaterialById(id) {
  return materialsDatabase.find(mat => mat.id === id) || null;
}

/**
 * Ricerca materiali nel database per categoria
 * @param {string} category - Categoria di materiali
 * @returns {array} - Array di materiali nella categoria specificata
 */
export function getMaterialsByCategory(category) {
  return materialsDatabase.filter(mat => mat.category === category);
}

/**
 * Ottiene tutte le categorie di materiali disponibili
 * @returns {array} - Array di categorie uniche
 */
export function getAllCategories() {
  const categories = new Set(materialsDatabase.map(mat => mat.category));
  return Array.from(categories);
}

/**
 * Converte i parametri del materiale in un formato adatto per i calcoli di piegatura
 * @param {string} materialId - ID del materiale
 * @returns {object} - Parametri di piegatura
 */
export function getBendingParameters(materialId) {
  const material = getMaterialById(materialId);
  if (!material) return null;
  
  return {
    fattoreK: material.bending.kFactor,
    springback: material.bending.springback,
    resistenza: material.properties.tensileStrength
  };
}
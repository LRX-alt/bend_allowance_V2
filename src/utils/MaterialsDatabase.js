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
      grainDirection: true, // tiene conto del senso di laminazione?
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 35, // N/mm²
    },
    notes: 'Facile da piegare, molto comune per applicazioni generali',
  },
  {
    id: 'steel_dd11',
    name: 'Acciaio decapato DD11',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 380, // MPa (max 440, valore tipico)
      yieldStrength: 250, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.33,
      minRadiusParallel: 0.5, // x spessore
      minRadiusPerpendicular: 0.8, // x spessore
      springback: 0.045, // 4.5%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 35, // N/mm²
    },
    notes: 'Laminato a caldo decapato da formatura (EN 10111). Molto duttile, facile da piegare.',
  },
  {
    id: 'steel_s235jr',
    name: 'Acciaio decapato S235JR',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 400, // MPa (360-510, valore tipico)
      yieldStrength: 235, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.33,
      minRadiusParallel: 0.5, // x spessore
      minRadiusPerpendicular: 0.8, // x spessore
      springback: 0.04, // 4%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 35, // N/mm²
    },
    notes: 'Acciaio strutturale S235 in finitura decapata. Comportamento simile allacciaio dolce.',
  },
  {
    id: 'steel_s275',
    name: 'Acciaio decapato S275',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 430, // MPa (370-530, valore tipico)
      yieldStrength: 275, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.35,
      minRadiusParallel: 0.8, // x spessore
      minRadiusPerpendicular: 1.2, // x spessore
      springback: 0.05, // 5%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 40, // N/mm²
    },
    notes: 'Acciaio strutturale S275 decapato. Leggermente piu resistente di S235.',
  },
  {
    id: 'steel_s355mc',
    name: 'Acciaio decapato S355MC',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 510, // MPa (430-550, valore tipico)
      yieldStrength: 355, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.38,
      minRadiusParallel: 1.0, // x spessore
      minRadiusPerpendicular: 1.5, // x spessore
      springback: 0.06, // 6%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 10, // x spessore
      maxPressure: 45, // N/mm²
    },
    notes:
      'Acciaio HSLA da formatura a freddo (EN 10149), decapato. Maggiore forza rispetto a S235.',
  },
  {
    id: 'steel_s420mc',
    name: 'Acciaio decapato S420MC',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 530, // MPa (480-620, valore tipico)
      yieldStrength: 420, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.4,
      minRadiusParallel: 1.2, // x spessore
      minRadiusPerpendicular: 1.8, // x spessore
      springback: 0.07, // 7%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 10, // x spessore
      maxPressure: 50, // N/mm²
    },
    notes:
      'HSLA EN 10149, decapato. Richiede raggi piu ampi e sovra-piega per il ritorno elastico.',
  },
  {
    id: 'steel_s500mc',
    name: 'Acciaio decapato S500MC',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 600, // MPa (550-700, valore tipico)
      yieldStrength: 500, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.41,
      minRadiusParallel: 1.5, // x spessore
      minRadiusPerpendicular: 2.2, // x spessore
      springback: 0.08, // 8%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 12, // x spessore
      maxPressure: 55, // N/mm²
    },
    notes: 'HSLA EN 10149, decapato. Alta resistenza: V piu ampia, raggi >= 1.5x T.',
  },
  {
    id: 'steel_s700mc',
    name: 'Acciaio decapato S700MC',
    category: 'Acciaio decapato (alta resistenza)',
    properties: {
      density: 7.85, // g/cm³
      tensileStrength: 750, // MPa (700-950, valore tipico)
      yieldStrength: 700, // MPa
      elasticModulus: 210000, // MPa
    },
    bending: {
      kFactor: 0.42,
      minRadiusParallel: 2.0, // x spessore
      minRadiusPerpendicular: 3.0, // x spessore
      springback: 0.1, // 10%
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 14, // x spessore
      maxPressure: 70, // N/mm²
    },
    notes:
      'Acciaio ad altissima resistenza (EN 10149), decapato. Ritorno elastico marcato, raggi ampi.',
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
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 10, // x spessore
      maxPressure: 45, // N/mm²
    },
    notes: 'Soggetto a incrudimento durante la piegatura, richiede maggiore forza di piegatura',
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
      kFactor: 0.4,
      minRadiusParallel: 0.7, // x spessore
      minRadiusPerpendicular: 1.0, // x spessore
      springback: 0.06, // 6%
      grainDirection: false,
    },
    tooling: {
      recommendedVDie: 7, // x spessore
      maxPressure: 20, // N/mm²
    },
    notes: 'Molto duttile, facile da piegare, bassa resistenza',
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
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 28, // N/mm²
    },
    notes: 'Buon compromesso resistenza/formabilità, comune in applicazioni marine',
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
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 9, // x spessore
      maxPressure: 32, // N/mm²
    },
    notes: 'Alta resistenza, richiede raggi più ampi per evitare crepe',
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
      grainDirection: false,
    },
    tooling: {
      recommendedVDie: 7, // x spessore
      maxPressure: 25, // N/mm²
    },
    notes: 'Molto duttile, eccellente formabilità',
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
      grainDirection: false,
    },
    tooling: {
      recommendedVDie: 8, // x spessore
      maxPressure: 30, // N/mm²
    },
    notes: 'Buona lavorabilità, adatto per decorazioni',
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
      grainDirection: true,
    },
    tooling: {
      recommendedVDie: 12, // x spessore
      maxPressure: 50, // N/mm²
    },
    notes: 'Richiede utensili specializzati, alta resistenza al calore',
  },
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
    resistenza: material.properties.tensileStrength,
  };
}

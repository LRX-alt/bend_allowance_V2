import { describe, it, expect } from 'vitest';
import {
  normalizeMaterialKey,
  resolveMaterial,
  risolviFattoreK,
  kFactorDynamic,
  springbackPercent,
  fattoriKMaterialiDefault,
  toDatabaseId,
} from '@/utils/materials.js';

describe('normalizeMaterialKey', () => {
  it('riconosce le chiavi UI', () => {
    expect(normalizeMaterialKey('acciaio')).toBe('acciaio');
    expect(normalizeMaterialKey('inox')).toBe('inox');
  });

  it('mappa gli id del database alle chiavi UI', () => {
    expect(normalizeMaterialKey('steel_mild')).toBe('acciaio');
    expect(normalizeMaterialKey('steel_stainless_304')).toBe('inox');
    expect(normalizeMaterialKey('aluminum_6061t6')).toBe('alluminio');
  });

  it('fallback ad acciaio per input sconosciuto', () => {
    expect(normalizeMaterialKey('xyz')).toBe('acciaio');
    expect(normalizeMaterialKey('')).toBe('acciaio');
    expect(normalizeMaterialKey(null)).toBe('acciaio');
  });
});

describe('resolveMaterial', () => {
  it('deriva i parametri dal database (fonte unica)', () => {
    const inox = resolveMaterial('inox');
    expect(inox.id).toBe('steel_stainless_304');
    expect(inox.db).not.toBeNull();
    // Valori derivati dal database materiali (steel_stainless_304).
    expect(inox.kFactor).toBe(0.35);
    expect(inox.tensileStrength).toBe(520);
    expect(inox.minRadius.parallelaPiega).toBe(1.0);
  });

  it('usa la lega specifica quando si passa un id del database', () => {
    const al = resolveMaterial('aluminum_6061t6');
    expect(al.id).toBe('aluminum_6061t6');
    // Valori propri della lega 6061-T6 (diversi dal rappresentante 5052).
    expect(al.kFactor).toBe(0.41);
    expect(al.tensileStrength).toBe(310);
    expect(al.minRadius.parallelaPiega).toBe(1.5);
    // Springback scalato sul valore della lega dal DB (6061-T6: 0.095 -> 9.5%).
    expect(al.springback.airBend).toBe(9.5);
  });
});

describe('toDatabaseId', () => {
  it('converte chiavi UI nel rappresentante del database', () => {
    expect(toDatabaseId('acciaio')).toBe('steel_mild');
    expect(toDatabaseId('alluminio')).toBe('aluminum_5052');
  });

  it('mantiene un id valido del database', () => {
    expect(toDatabaseId('aluminum_6061t6')).toBe('aluminum_6061t6');
  });

  it('fallback ad acciaio dolce per input sconosciuto', () => {
    expect(toDatabaseId('xyz')).toBe('steel_mild');
    expect(toDatabaseId('')).toBe('steel_mild');
  });
});

describe('kFactorDynamic', () => {
  it('segue le soglie R/T', () => {
    expect(kFactorDynamic(0.4, 2)).toBe(0.25); // R/T = 0.2
    expect(kFactorDynamic(1, 2)).toBe(0.3); // R/T = 0.5
    expect(kFactorDynamic(3, 2)).toBe(0.33); // R/T = 1.5 -> <2
    expect(kFactorDynamic(6, 2)).toBe(0.38); // R/T = 3 -> <4
    expect(kFactorDynamic(20, 2)).toBe(0.46); // R/T = 10
  });
});

describe('risolviFattoreK', () => {
  it('dinamico ha precedenza e usa R/T', () => {
    expect(risolviFattoreK({ dinamico: true, R: 20, T: 2, fattoreK: 0.31 })).toBe(0.46);
  });

  it('K manuale valido viene usato', () => {
    expect(risolviFattoreK({ fattoreK: 0.31, materialKey: 'inox' })).toBe(0.31);
  });

  it('fallback al K del materiale', () => {
    expect(risolviFattoreK({ materialKey: 'rame' })).toBe(0.45);
  });

  it('fallback finale a 0.33', () => {
    expect(risolviFattoreK({})).toBe(0.33);
  });
});

describe('springbackPercent', () => {
  it("usa lo springback della lega dal DB per l'air bending", () => {
    expect(springbackPercent('titanio', 'airBend')).toBe(12); // titanium_grade2 0.12
    expect(springbackPercent('acciaio', 'airBend')).toBe(4); // steel_mild 0.04
    expect(springbackPercent('steel_s700mc', 'airBend')).toBe(10); // 0.10
    expect(springbackPercent('steel_s500mc', 'airBend')).toBe(8); // 0.08
  });

  it('scala il profilo per-processo mantenendo le proporzioni della famiglia', () => {
    // acciaio: airBend base 3 -> 4 (fattore 4/3); coining 0.5 * 4/3 = 0.67
    expect(springbackPercent('acciaio', 'coining')).toBe(0.67);
  });
});

describe('fattoriKMaterialiDefault', () => {
  it('espone una mappa chiave -> K', () => {
    const map = fattoriKMaterialiDefault();
    expect(map.acciaio).toBe(0.33);
    expect(map.titanio).toBe(0.35);
  });
});

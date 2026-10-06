import { describe, expect, it } from 'vitest';
import { risolviKDaMisura } from '@sviluppolamiera/bend-core';
import { kFactorOf } from './partSummary.js';

describe('kFactorOf', () => {
  it('senza materiale e senza override non inventa un K', () => {
    expect(kFactorOf({ bendSetup: { process: 'airBend' } })).toBeNull();
  });

  it('con materiale e senza override usa il K del record', () => {
    expect(kFactorOf({ material: { dbId: 'steel_s275' } })).toBe(0.35);
  });

  it('l override vince sul record', () => {
    expect(kFactorOf({ material: { dbId: 'steel_s275', kFactorOverride: 0.4 } })).toBe(0.4);
  });
});

describe('risolviKDaMisura e punzone', () => {
  it('il K da misura non modifica il punzone', () => {
    const punch = { radius: 10 };
    const result = risolviKDaMisura({
      sviluppoTeorico: 100,
      sviluppoMisurato: 100,
      numeroPieghe: 1,
      T: 2,
      R: 10,
      angoloDeg: 90,
      kTeorico: 0.33,
    });
    expect(result.punch).toBeUndefined();
    expect(punch.radius).toBe(10);
    expect(Object.keys(result).sort()).toEqual(['bdEffettiva', 'bendAllowance', 'k', 'plausibile']);
  });
});

import { describe, expect, it } from 'vitest';
import { risolviKDaMisura } from '../src/index';

describe('risolviKDaMisura', () => {
  it('i default del vecchio componente non producono un K fuori scala spacciato per valido', () => {
    const r = risolviKDaMisura({
      sviluppoTeorico: 100,
      sviluppoMisurato: 98.5,
      numeroPieghe: 1,
      T: 2,
      R: 1,
      angoloDeg: 90,
    });
    expect(r.k).not.toBeCloseTo(0.614, 2);
    expect(r.plausibile).toBe(false);
  });

  it('una misura coerente con K 0.33 resta plausibile', () => {
    const r = risolviKDaMisura({
      sviluppoTeorico: 100,
      sviluppoMisurato: 100,
      numeroPieghe: 1,
      T: 2,
      R: 1,
      angoloDeg: 90,
      kTeorico: 0.33,
    });
    expect(r.k).toBeCloseTo(0.33, 5);
    expect(r.plausibile).toBe(true);
  });
});

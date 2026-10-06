import { describe, expect, it } from 'vitest';
import { calcolaPiega, calcolaRaggioEffettivo, risolviRaggioInterno } from '../src/index';

const sources = ['manual', 'measured', 'target', 'punchAssumption'] as const;

describe('risolviRaggioInterno', () => {
  it('senza source usa il manuale e marca origine legacy', () => {
    expect(risolviRaggioInterno({ manualInside: 1 })).toEqual({
      stato: 'resolved',
      raggioSviluppo: 1,
      origine: 'legacy',
      assunzioneOperatore: false,
    });
  });

  it('manual con 10 ignora punzone e non ha un ingresso V', () => {
    const result = risolviRaggioInterno({
      source: 'manual',
      manualInside: 10,
      punchRadius: 5,
      measuredInside: 24,
      targetInside: 3,
    });
    expect(result).toEqual({
      stato: 'resolved',
      raggioSviluppo: 10,
      origine: 'manual',
      assunzioneOperatore: false,
    });
  });

  it.each([
    ['measured', { measuredInside: 10 }, 10, 'manca_misura'],
    ['target', { targetInside: 4 }, 4, 'manca_target'],
    ['punchAssumption', { punchRadius: 10 }, 10, 'manca_punzone'],
  ] as const)('%s usa solo il proprio numero', (source, present, radius, reason) => {
    expect(risolviRaggioInterno({ source, ...present, manualInside: 1 })).toMatchObject({
      stato: 'resolved',
      raggioSviluppo: radius,
      origine: source,
      assunzioneOperatore: source === 'punchAssumption',
    });
    expect(risolviRaggioInterno({ source, manualInside: 1 })).toMatchObject({
      stato: 'incomplete',
      raggioSviluppo: null,
      origine: source,
      motivo: reason,
      assunzioneOperatore: false,
    });
  });

  it('valori non finiti o negativi contano come assenti', () => {
    for (const source of sources) {
      const result = risolviRaggioInterno({
        source,
        manualInside: Number.NaN,
        measuredInside: -1,
        targetInside: Number.POSITIVE_INFINITY,
        punchRadius: -0.01,
      });
      expect(result.stato).toBe('incomplete');
      expect(result.raggioSviluppo).toBeNull();
    }
    expect(risolviRaggioInterno({ manualInside: -1 }).motivo).toBe('manca_manuale');
  });

  it('zero è un raggio valido', () => {
    expect(risolviRaggioInterno({ source: 'measured', measuredInside: 0 }).raggioSviluppo).toBe(0);
  });
});

describe('caso d officina', () => {
  const setup = {
    materiale: 'steel_s235jr',
    spessore: 2,
    processo: 'airBend' as const,
    punch: { radius: 10 },
    vOpening: 24,
    angolo: 90,
    measuredInside: 10,
    source: 'measured' as const,
    K: 0.33,
  };

  it('il raggio misurato 10 è lo sviluppo e la stima da V resta separata', () => {
    const raggio = risolviRaggioInterno({
      source: setup.source,
      measuredInside: setup.measuredInside,
      punchRadius: setup.punch.radius,
      manualInside: 1,
    });
    const stima = calcolaRaggioEffettivo(setup.spessore, setup.vOpening, setup.punch.radius, setup.processo);
    expect(setup.punch.radius).toBe(10);
    expect(setup.vOpening).toBe(24);
    expect(setup.measuredInside).toBe(10);
    expect(raggio.raggioSviluppo).toBe(10);
    expect(stima).not.toBe(10);
    expect(stima).toBeCloseTo(24 / 6.6 - 0.1 * 2, 6);
    const atteso = calcolaPiega({ angolo: 90, T: 2, R: 10, K: 0.33 });
    const ottenuto = calcolaPiega({
      angolo: setup.angolo,
      T: setup.spessore,
      R: raggio.raggioSviluppo ?? 0,
      K: setup.K,
    });
    expect(ottenuto).toEqual(atteso);
    expect(setup.punch.radius).toBe(10);
  });
});

describe('casi senza misura', () => {
  const cases = [
    { punchRadius: 10, vOpening: 40 },
    { punchRadius: 10, vOpening: 24 },
    { punchRadius: 5, vOpening: 24 },
    { punchRadius: 15, vOpening: 24 },
  ];

  it.each(cases)('Rp $punchRadius e V $vOpening non deducono un raggio', ({ punchRadius, vOpening }) => {
    const stored = {
      punch: { radius: punchRadius },
      vOpening,
      measuredInside: undefined as number | undefined,
      manualInside: 1,
    };
    expect(stored.punch.radius).toBe(punchRadius);
    expect(stored.vOpening).toBe(vOpening);
    expect(stored.measuredInside).toBeUndefined();
    expect(
      risolviRaggioInterno({
        source: 'manual',
        manualInside: stored.manualInside,
        punchRadius,
      }).raggioSviluppo
    ).toBe(1);
    expect(
      risolviRaggioInterno({ source: 'measured', punchRadius, manualInside: stored.manualInside })
    ).toMatchObject({ stato: 'incomplete', motivo: 'manca_misura', raggioSviluppo: null });
    const stima = calcolaRaggioEffettivo(2, vOpening, punchRadius, 'airBend');
    expect(stima).not.toBe(stored.manualInside);
    expect(stored.measuredInside).toBeUndefined();
    expect(stored.punch.radius).toBe(punchRadius);
  });
});

import { describe, it, expect } from 'vitest';
import {
  calcolaPiega,
  calcolaSviluppo,
  bendAllowanceByMethod,
  calcoliAvanzatiPerPiega,
  calcolaBendDeductionDiFurio,
} from '@/utils/bendingEngine.js';

describe('calcolaPiega - caso noto', () => {
  // T=2, R=1, K=0.33, angolo=90 (squadra)
  const piega = calcolaPiega({ angolo: 90, T: 2, R: 1, K: 0.33 });

  it('Bend Allowance = rad*(R+K*T)', () => {
    // 1.5707963 * (1 + 0.66) = 2.6075219
    expect(piega.bendAllowance).toBeCloseTo(2.6075219, 5);
  });

  it('Setback = (R+T)*tan(angolo/2)', () => {
    // 3 * tan(45) = 3
    expect(piega.setback).toBeCloseTo(3, 6);
  });

  it('Bend Deduction = 2*SB - BA', () => {
    expect(piega.bendDeduction).toBeCloseTo(3.3924781, 5);
  });
});

describe('calcolaPiega - casi limite', () => {
  it('angolo 0 -> nessuna piega (tutto zero)', () => {
    const p = calcolaPiega({ angolo: 0, T: 2, R: 1, K: 0.33 });
    expect(p.bendAllowance).toBe(0);
    expect(p.setback).toBe(0);
    expect(p.bendDeduction).toBe(0);
  });

  it('angolo negativo usa la magnitudine (BD identico a +90)', () => {
    const pos = calcolaPiega({ angolo: 90, T: 2, R: 1, K: 0.33 });
    const neg = calcolaPiega({ angolo: -90, T: 2, R: 1, K: 0.33 });
    expect(neg.bendDeduction).toBeCloseTo(pos.bendDeduction, 9);
    expect(neg.magnitudine).toBe(90);
  });

  it('angolo 180 viene clampato e resta finito', () => {
    const p = calcolaPiega({ angolo: 180, T: 2, R: 1, K: 0.33 });
    expect(Number.isFinite(p.setback)).toBe(true);
    expect(Number.isFinite(p.bendDeduction)).toBe(true);
    expect(p.setback).toBeGreaterThan(0);
  });

  it('R=0 produce valori finiti', () => {
    const p = calcolaPiega({ angolo: 90, T: 2, R: 0, K: 0.33 });
    // BA = rad*(0+0.66)=1.0367255 ; SB=2 ; BD=4-1.0367255
    expect(p.bendAllowance).toBeCloseTo(1.0367255, 5);
    expect(p.setback).toBeCloseTo(2, 6);
    expect(p.bendDeduction).toBeCloseTo(2.9632745, 5);
  });
});

describe('calcolaSviluppo - per piega (angoli misti)', () => {
  const segments = [
    { length: 50, angle: 0 },
    { length: 30, angle: 90 },
    { length: 40, angle: 45 },
  ];
  const res = calcolaSviluppo({ segments, T: 2, R: 1, K: 0.33, metodo: 'standard' });

  it('il primo segmento non ha piega', () => {
    expect(res.dettagli[0].bendDeduction).toBeNull();
  });

  it('ogni piega usa il proprio angolo', () => {
    expect(res.dettagli[1].bendDeduction).toBeCloseTo(3.3924781, 5); // 90
    expect(res.dettagli[2].bendDeduction).toBeCloseTo(1.1815204, 5); // 45
  });

  it('lunghezza lineare = somma lunghezze', () => {
    expect(res.lunghezzaLineare).toBe(120);
  });

  it('sviluppo totale = somma lunghezze - somma BD', () => {
    // 120 - (3.3924781 + 1.1815204) = 115.4260015
    expect(res.sviluppoTotale).toBeCloseTo(115.4260015, 5);
  });
});

describe('calcolaSviluppo - segmento singolo', () => {
  it('senza pieghe lo sviluppo eguaglia la lunghezza', () => {
    const res = calcolaSviluppo({ segments: [{ length: 100, angle: 0 }], T: 2, R: 1, K: 0.33 });
    expect(res.sviluppoTotale).toBe(100);
    expect(res.dettagli).toHaveLength(1);
  });

  it('array vuoto -> zero', () => {
    const res = calcolaSviluppo({ segments: [], T: 2, R: 1, K: 0.33 });
    expect(res.sviluppoTotale).toBe(0);
    expect(res.dettagli).toHaveLength(0);
  });
});

describe('bendAllowanceByMethod', () => {
  it('DIN6935 con R<=5T usa coefficiente 0.65', () => {
    // rad(90)*(1 + 0.65*2) = 1.5707963 * 2.3 = 3.6128316
    expect(bendAllowanceByMethod(90, 2, 1, 'DIN6935')).toBeCloseTo(3.6128316, 5);
  });

  it('ANSI equivale a 2*setback', () => {
    const ansi = bendAllowanceByMethod(90, 2, 1, 'ANSI');
    expect(ansi).toBeCloseTo(6, 5); // 2 * (R+T)*tan45 = 2*3
  });

  it('standard usa il fattore K passato', () => {
    expect(bendAllowanceByMethod(90, 2, 1, 'standard', 0.5)).toBeCloseTo(
      (Math.PI / 2) * (1 + 0.5 * 2),
      6
    );
  });
});

describe('calcoliAvanzatiPerPiega', () => {
  const segments = [
    { length: 50, angle: 0 },
    { length: 30, angle: 90 },
    { length: 40, angle: 120 },
  ];

  it('calcola una BD diversa per ogni piega', () => {
    const adv = calcoliAvanzatiPerPiega({
      segments,
      spessore: 2,
      raggioPiega: 1,
      fattoreK: 0.33,
      metodo: 'standard',
      materiale: 'acciaio',
      processo: 'airBend',
    });
    expect(adv.dettagli[1].bendDeduction).not.toBeCloseTo(adv.dettagli[2].bendDeduction, 3);
    expect(adv.dettagli[1].springback).toBeGreaterThan(0);
    expect(Number.isFinite(adv.sviluppoTotale)).toBe(true);
    expect(adv.forzaPiega.forzaKN).toBeGreaterThan(0);
  });

  it('senza pieghe lo sviluppo eguaglia la lunghezza lineare', () => {
    const adv = calcoliAvanzatiPerPiega({
      segments: [{ length: 80, angle: 0 }],
      spessore: 2,
      raggioPiega: 1,
      fattoreK: 0.33,
      materiale: 'acciaio',
    });
    expect(adv.sviluppoTotale).toBe(80);
  });
});

describe('calcolaBendDeductionDiFurio', () => {
  it('L = LatoA + LatoB - BD', () => {
    const r = calcolaBendDeductionDiFurio(90, 50, 50, 0.33, 1, 2);
    expect(r.bendDeduction).toBeCloseTo(3.3924781, 5);
    expect(r.lunghezzaDaTagliare).toBeCloseTo(100 - 3.3924781, 5);
  });
});

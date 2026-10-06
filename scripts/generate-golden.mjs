/**
 * Fotografa gli output attuali del motore. Non corregge nulla.
 * Eseguire prima di qualsiasi tipizzazione di bend-core.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  bendAllowanceByMethod,
  calcolaPiega,
  calcolaSviluppo,
  calcolaSpringback,
  calcolaForzaPiega,
  calcolaRaggioMinimo,
  calcolaAperturaMatrice,
  calcolaLatoMinimo,
  calcolaRaggioEffettivo,
  calcoliAvanzatiPiegatura,
  calcoliAvanzatiPerPiega,
  calcolaBendDeductionDiFurio,
} from '../packages/bend-core/src/index.ts';
import { materialsDatabase, resolveMaterial, risolviFattoreK } from '../packages/bend-core/src/index.ts';

const ANGLES = [30, 45, 60, 90, 120, 135];
const THICKNESS = [1, 2, 3, 5];
const RADII = [0.5, 1, 2, 3];
const METHODS = ['standard', 'DIN6935', 'ANSI', 'pressbrake', 'airBend', 'bottoming', 'coining', 'customK'];
const PROCESSES = ['airBend', 'bottoming', 'coining'];

function stable(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value);
    return Number(value.toPrecision(10));
  }
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}

const piega = [];
for (const angolo of ANGLES) {
  for (const T of THICKNESS) {
    for (const R of RADII) {
      for (const metodo of METHODS) {
        const K = 0.33;
        piega.push(
          stable({
            in: { angolo, T, R, K, metodo },
            out: calcolaPiega({ angolo, T, R, K, metodo }),
            ba: bendAllowanceByMethod(angolo, T, R, metodo, K),
          })
        );
      }
    }
  }
}

const materialIds = materialsDatabase.map(m => m.id);
const materiali = [];
for (const id of materialIds) {
  const resolved = resolveMaterial(id);
  const perProcesso = {};
  for (const processo of PROCESSES) {
    perProcesso[processo] = {
      springback: calcolaSpringback(90, id, 2, 1, processo),
      apertura: calcolaAperturaMatrice(2, processo, id),
      raggioEffettivo: calcolaRaggioEffettivo(2, 16, 1, processo),
    };
  }
  materiali.push(
    stable({
      id,
      kFactor: resolved.kFactor,
      tensileStrength: resolved.tensileStrength,
      kRisolto: risolviFattoreK({ materialKey: id }),
      raggioMinimoParallelo: calcolaRaggioMinimo(id, 2, 'parallelaPiega'),
      raggioMinimoPerpendicolare: calcolaRaggioMinimo(id, 2, 'perpendicolarePiega'),
      forza: calcolaForzaPiega(100, 2, id, 16),
      perProcesso,
    })
  );
}

const baseline = stable({
  piega90: calcolaPiega({ angolo: 90, T: 2, R: 1, K: 0.33 }),
  din: bendAllowanceByMethod(90, 2, 1, 'DIN6935'),
  ansi: bendAllowanceByMethod(90, 2, 1, 'ANSI'),
  sviluppo: calcolaSviluppo({
    segments: [
      { length: 50, angle: 0 },
      { length: 30, angle: 90 },
      { length: 40, angle: 45 },
    ],
    T: 2,
    R: 1,
    K: 0.33,
    metodo: 'standard',
  }),
  r0: calcolaPiega({ angolo: 90, T: 2, R: 0, K: 0.33 }),
  angolo180: calcolaPiega({ angolo: 180, T: 2, R: 1, K: 0.33 }),
  angoloNeg: calcolaPiega({ angolo: -90, T: 2, R: 1, K: 0.33 }),
  diFurio: calcolaBendDeductionDiFurio(90, 50, 50, 0.33, 1, 2),
  latoMinimo: calcolaLatoMinimo({ V: 16, pieghe: 1 }),
  avanzati: calcoliAvanzatiPiegatura({
    spessore: 2,
    raggioPiega: 1,
    angolo: 90,
    lunghezzaPiega: 100,
    materiale: 'acciaio',
    processo: 'airBend',
    metodo: 'standard',
    fattoreK: 0.33,
  }),
  perPiega: calcoliAvanzatiPerPiega({
    segments: [
      { length: 50, angle: 0 },
      { length: 30, angle: 90 },
      { length: 40, angle: 45 },
    ],
    spessore: 2,
    raggioPiega: 1,
    fattoreK: 0.33,
    metodo: 'standard',
    materiale: 'acciaio',
  }),
});

const golden = stable({ piega, materiali, baseline });
const out = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../packages/bend-core/__tests__/golden.json'
);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(golden, null, 2) + '\n');
console.log('wrote', out, 'piega', piega.length, 'materiali', materiali.length);
void pathToFileURL;

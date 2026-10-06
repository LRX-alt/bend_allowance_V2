import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeExternal, computeProfile } from './compute.js';
import { buildProfileGeometry, lunghezzeArco } from './profileGeometry.js';
import { decodeShare, readProjects, writeProjects } from './projects.js';
import { addSegment, removeSegment } from './segments.js';

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (name.endsWith('.vue')) files.push(path);
  }
  return files;
}

describe('calcolo', () => {
  it('il profilo di riferimento resta 115.4260015', () => {
    const result = computeProfile({
      segments: [
        { length: 50, angle: 0 },
        { length: 30, angle: 90 },
        { length: 40, angle: 45 },
      ],
      spessore: 2,
      raggio: 1,
      fattoreK: 0.33,
    });
    expect(result.sviluppoTotale).toBeCloseTo(115.4260015, 6);
  });

  it('le quote esterne usano la deduzione Di Furio', () => {
    const result = computeExternal({
      angolo: 90,
      latoA: 50,
      latoB: 50,
      fattoreK: 0.33,
      raggio: 1,
      spessore: 2,
    });
    expect(result.bendDeduction).toBeCloseTo(3.3924781, 6);
    expect(result.lunghezzaDaTagliare).toBeCloseTo(100 - 3.3924781, 6);
  });
});

describe('anteprima del profilo', () => {
  it('disegna la piega con il raggio interno e non a spigolo vivo', () => {
    const sharp = buildProfileGeometry(
      [
        { length: 50, angle: 0 },
        { length: 50, angle: 25 },
      ],
      0,
      0
    );
    const end = sharp.center[sharp.center.length - 1];
    expect(end.x).toBeCloseTo(50 + 50 * Math.cos((25 * Math.PI) / 180), 6);
    expect(end.y).toBeCloseTo(50 * Math.sin((25 * Math.PI) / 180), 6);

    const bent = buildProfileGeometry(
      [
        { length: 50, angle: 0 },
        { length: 50, angle: 25 },
      ],
      10,
      2
    );
    const bend = bent.bends[0];
    expect(bend.raggio).toBe(10);
    expect(bend.raggioEsterno).toBe(12);
    const attese = lunghezzeArco(25, 10, 2);
    expect(attese.interno).toBeCloseTo(((25 * Math.PI) / 180) * 10, 6);
    expect(attese.esterno).toBeCloseTo(((25 * Math.PI) / 180) * 12, 6);
    expect(bend.arcoInterno).toBeCloseTo(attese.interno, 6);
    expect(bend.arcoEsterno).toBeCloseTo(attese.esterno, 6);
    expect(typeof bend.midAngle).toBe('number');
    const arcPoints = bent.left.filter(
      point => Math.hypot(point.x - bend.cx, point.y - bend.cy) > 0
    );
    const inner = arcPoints.filter(
      point => Math.abs(Math.hypot(point.x - bend.cx, point.y - bend.cy) - 10) < 0.01
    );
    expect(inner.length).toBeGreaterThan(2);
    const outer = bent.right.filter(
      point => Math.abs(Math.hypot(point.x - bend.cx, point.y - bend.cy) - 12) < 0.01
    );
    expect(outer.length).toBeGreaterThan(2);
    const setback = 12 * Math.tan((12.5 * Math.PI) / 180);
    expect(bent.center[1].x).toBeCloseTo(50 - setback, 6);
    expect(bent.center[1].y).toBeCloseTo(0, 6);
  });
});

describe('segmenti', () => {
  it('aggiunge e non svuota il profilo', () => {
    const next = addSegment([{ length: 50, angle: 0 }]);
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual({ length: 20, angle: 90 });
    expect(removeSegment(next, 1)).toHaveLength(1);
    expect(removeSegment([{ length: 50, angle: 0 }], 0)).toHaveLength(1);
  });
});

describe('progetti', () => {
  it('legge la chiave bendingProjects e un link share precedente', () => {
    const memory = {
      value: '',
      getItem() {
        return this.value;
      },
      setItem(_key, next) {
        this.value = next;
      },
    };
    writeProjects([{ nome: 'Staffa', spessore: 2, segments: [{ length: 50, angle: 0 }] }], memory);
    expect(readProjects(memory)[0].nome).toBe('Staffa');
    const encoded = btoa(
      JSON.stringify({
        v: 1,
        t: 3,
        r: 2,
        k: 0.4,
        m: 'standard',
        s: [
          [80, 0],
          [20, 90],
        ],
      })
    );
    const shared = decodeShare(encoded);
    expect(shared.spessore).toBe(3);
    expect(shared.segments[1].angle).toBe(90);
    expect(shared.modo).toBe('profilo');
    expect(shared.materialId).toBe('');
    const next = decodeShare(
      btoa(
        JSON.stringify({
          v: 2,
          t: 2,
          r: 1,
          k: 0.38,
          m: 'standard',
          s: [],
          modo: 'esterne',
          mat: 'steel_mild',
          la: 40,
          lb: 60,
          an: 90,
        })
      )
    );
    expect(next.modo).toBe('esterne');
    expect(next.materialId).toBe('steel_mild');
    expect(next.latoA).toBe(40);
  });
});

describe('confini dei moduli', () => {
  it('nessun file vue importa geom2d', () => {
    const root = join(process.cwd(), 'apps/web/src');
    const offenders = walk(root).filter(path =>
      readFileSync(path, 'utf8').includes('@sviluppolamiera/geom2d')
    );
    expect(offenders).toEqual([]);
  });
});

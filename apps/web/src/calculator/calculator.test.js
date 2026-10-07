import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcolaPiega, calcolaRaggioEffettivo } from '@sviluppolamiera/bend-core';
import { importDxf } from '@sviluppolamiera/dxf';
import { sviluppoPiatto } from './flatPattern.js';
import { contenutoDXF } from '@/utils/exporters.js';
import { computeExternal, computeProfile } from './compute.js';
import { buildProfileGeometry, lunghezzeArco } from './profileGeometry.js';
import { decodeShare, readProjects, toolFromRecord, writeProjects } from './projects.js';
import { cavaConsigliata, developmentRadius } from './toolSetup.js';
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
    expect(next.raggioOrigine).toBe('manual');
    expect(next.raggioPunzone).toBeUndefined();
    expect(next.processo).toBe('airBend');
  });

  it('un progetto vecchio resta manuale e lo sviluppo non cambia', () => {
    const vecchio = { nome: 'Vecchio', spessore: 2, raggioPiega: 1, fattoreK: 0.33 };
    const tool = toolFromRecord(vecchio);
    expect(tool.raggioOrigine).toBe('manual');
    expect(tool.raggioPunzone).toBeNull();
    expect(tool.processo).toBe('airBend');
    expect(tool.cavaScelta).toBe('consigliata');
    const raggio = developmentRadius({ raggio: vecchio.raggioPiega, raggioOrigine: tool.raggioOrigine });
    expect(raggio.raggioSviluppo).toBe(1);
    expect(
      computeExternal({ angolo: 90, latoA: 50, latoB: 50, fattoreK: 0.33, raggio: raggio.raggioSviluppo, spessore: 2 })
        .lunghezzaDaTagliare
    ).toBeCloseTo(100 - 3.3924781, 6);
  });

  it('il link v3 riporta punzone, cava e raggio misurato', () => {
    const encoded = btoa(
      JSON.stringify({
        v: 3,
        t: 2,
        r: 1,
        k: 0.33,
        m: 'standard',
        s: [],
        modo: 'esterne',
        mat: 'steel_s235jr',
        la: 50,
        lb: 50,
        an: 90,
        processo: 'airBend',
        cavaScelta: '24',
        raggioPunzone: 10,
        raggioOrigine: 'measured',
        raggioMisurato: 10,
      })
    );
    const shared = decodeShare(encoded);
    expect(shared.raggioPunzone).toBe(10);
    expect(shared.cavaScelta).toBe('24');
    expect(shared.raggioMisurato).toBe(10);
    expect(shared.raggioOrigine).toBe('measured');
    expect(shared.raggioPiega).toBe(1);
  });
});

describe('raggio di sviluppo', () => {
  const base = { angolo: 90, latoA: 50, latoB: 50, fattoreK: 0.33, spessore: 2 };

  it('il manuale 10 e il misurato 10 chiamano compute con lo stesso R', () => {
    const manuale = developmentRadius({ raggio: 10, raggioOrigine: 'manual', raggioPunzone: 5 });
    const misurato = developmentRadius({
      raggio: 1,
      raggioOrigine: 'measured',
      raggioMisurato: 10,
      raggioPunzone: 10,
    });
    expect(manuale.raggioSviluppo).toBe(10);
    expect(misurato.raggioSviluppo).toBe(10);
    const conManuale = computeExternal({ ...base, raggio: manuale.raggioSviluppo });
    const conMisura = computeExternal({ ...base, raggio: misurato.raggioSviluppo });
    expect(conMisura).toEqual(conManuale);
    expect(conManuale.bendAllowance).toBe(calcolaPiega({ angolo: 90, T: 2, R: 10, K: 0.33 }).bendAllowance);
  });

  it('cambiare la V o il punzone non muove il raggio manuale o misurato', () => {
    const stato = { raggio: 1, raggioOrigine: 'manual', raggioPunzone: 10, raggioMisurato: 10 };
    const prima = developmentRadius(stato).raggioSviluppo;
    const dopoPunzone = developmentRadius({ ...stato, raggioPunzone: 15 }).raggioSviluppo;
    const misurato = developmentRadius({ ...stato, raggioOrigine: 'measured' }).raggioSviluppo;
    expect(prima).toBe(1);
    expect(dopoPunzone).toBe(1);
    expect(misurato).toBe(10);
    expect(computeExternal({ ...base, raggio: prima }).lunghezzaDaTagliare).toBe(
      computeExternal({ ...base, raggio: dopoPunzone }).lunghezzaDaTagliare
    );
  });

  it('il caso d officina manda R 10 e tiene la stima fuori dallo sviluppo', () => {
    const pagina = developmentRadius({
      raggio: 1,
      raggioOrigine: 'measured',
      raggioMisurato: 10,
      raggioPunzone: 10,
    });
    expect(pagina.raggioSviluppo).toBe(10);
    expect(cavaConsigliata(2, 'airBend', 'steel_s235jr')).toBe(16);
    const stima = calcolaRaggioEffettivo(2, 24, 10, 'airBend');
    expect(stima).not.toBe(pagina.raggioSviluppo);
    expect(
      computeExternal({ ...base, raggio: pagina.raggioSviluppo }).bendAllowance
    ).toBe(calcolaPiega({ angolo: 90, T: 2, R: 10, K: 0.33 }).bendAllowance);
  });

  it('senza misura non inventa un raggio', () => {
    const incompleto = developmentRadius({
      raggioOrigine: 'measured',
      raggio: 1,
      raggioPunzone: 10,
    });
    expect(incompleto.stato).toBe('incomplete');
    expect(incompleto.raggioSviluppo).toBeNull();
  });
});

describe('sviluppo piatto', () => {
  const segments = [
    { length: 50, angle: 0 },
    { length: 30, angle: 90 },
    { length: 40, angle: 45, tipoPiega: 'su' },
  ];

  it('mette le linee di piega al centro della zona e quota gli intervalli', () => {
    const flat = sviluppoPiatto({
      segments,
      spessore: 2,
      raggio: 1,
      fattoreK: 0.33,
      larghezza: 80,
    });
    const sb90 = 3 * Math.tan(Math.PI / 4);
    const ba90 = (Math.PI / 2) * (1 + 0.33 * 2);
    const sb45 = 3 * Math.tan((45 * Math.PI) / 180 / 2);
    const ba45 = (Math.PI / 4) * (1 + 0.33 * 2);
    const first = 50 - sb90 + ba90 / 2;
    const second = first + ba90 / 2 + (30 - sb90 - sb45) + ba45 / 2;
    expect(flat.lunghezza).toBeCloseTo(115.4260015, 4);
    expect(flat.pieghe.map(bend => bend.a.x)).toEqual([
      expect.closeTo(first, 4),
      expect.closeTo(second, 4),
    ]);
    expect(flat.pieghe[0].layer).toBe('PIEGA_90_SU');
    expect(flat.pieghe[1].layer).toBe('PIEGA_45_SU');
    expect(flat.pieghe[0].b.y - flat.pieghe[0].a.y).toBe(80);
    const gaps = flat.quote.filter(item => item.text.endsWith('mm'));
    const sum = gaps.reduce((total, item) => total + Number(item.text.replace(' mm', '')), 0);
    expect(sum).toBeCloseTo(flat.lunghezza, 1);
  });

  it('il dxf piatto ha contorno chiuso, pieghe e quote in millimetri', () => {
    const dxf = contenutoDXF({
      segments,
      spessore: 2,
      raggioPiega: 1,
      fattoreK: 0.33,
      larghezza: 80,
    });
    expect(dxf).toContain('$INSUNITS');
    expect(dxf).toContain('PIEGA_90_SU');
    const imported = importDxf(dxf);
    expect(imported.part?.provenance.declaredUnits).toBe('mm');
    expect(imported.part?.outer.closed).toBe(true);
    expect(imported.part?.outer.bbox.maxX - imported.part?.outer.bbox.minX).toBeCloseTo(115.426, 2);
    expect(imported.part?.outer.bbox.maxY - imported.part?.outer.bbox.minY).toBeCloseTo(80, 2);
    expect(imported.part?.bendLines.map(bend => bend.angleDeg)).toEqual([90, 45]);
    expect(imported.part?.bendLines.map(bend => bend.direction)).toEqual(['up', 'up']);
    const labels = imported.part?.annotations.map(note => note.raw?.text).filter(Boolean);
    expect(labels).toEqual(expect.arrayContaining(['90° su', '45° su']));
    expect(
      imported.findings.some(item => item.code === 'TOP-001' && item.severity === 'error')
    ).toBe(false);
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

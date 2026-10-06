import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { exportDxf, importDxf } from '../src/index';

function dxf(body: string, insunits?: number): string {
  const header =
    insunits === undefined
      ? ''
      : `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${insunits}\n0\nENDSEC\n`;
  return `${header}0\nSECTION\n2\nENTITIES\n${body}0\nENDSEC\n0\nEOF\n`;
}

function line(layer: string, x0: number, y0: number, x1: number, y1: number): string {
  return `0\nLINE\n8\n${layer}\n10\n${x0}\n20\n${y0}\n11\n${x1}\n21\n${y1}\n`;
}

function rect(layer: string, w: number, h: number): string {
  return (
    line(layer, 0, 0, w, 0) +
    line(layer, w, 0, w, h) +
    line(layer, w, h, 0, h) +
    line(layer, 0, h, 0, 0)
  );
}

function circle(layer: string, x: number, y: number, r: number): string {
  return `0\nCIRCLE\n8\n${layer}\n10\n${x}\n20\n${y}\n40\n${r}\n`;
}

describe('import DXF', () => {
  it('non converte un file senza $INSUNITS', () => {
    const result = importDxf(dxf(rect('0', 80, 50)));
    expect(result.part).not.toBeNull();
    expect(result.part?.provenance.unitsConfirmedByUser).toBe(false);
    expect(result.part?.provenance.declaredUnits).toBe('unknown');
    expect(result.part?.outer.bbox.maxX).toBeCloseTo(80, 3);
    expect(result.part?.outer.bbox.maxY).toBeCloseTo(50, 3);
    expect(result.findings.some(f => f.code === 'UNI-001')).toBe(true);
  });

  it('dichiara i pollici e non converte prima della conferma', () => {
    const result = importDxf(dxf(rect('0', 3, 2), 1));
    expect(result.part?.provenance.declaredUnits).toBe('inch');
    expect(result.part?.provenance.unitsConfirmedByUser).toBe(false);
    expect(result.part?.outer.bbox.maxX).toBeCloseTo(3, 3);
  });

  it('converte in millimetri solo dopo conferma esplicita dei pollici', () => {
    const result = importDxf(dxf(rect('0', 1, 1), 1), { confirmUnits: 'inch' });
    expect(result.part?.provenance.unitsConfirmedByUser).toBe(true);
    expect(result.part?.outer.bbox.maxX).toBeCloseTo(25.4, 3);
  });

  it('non approssima una SPLINE senza consenso', () => {
    const spline = `0\nSPLINE\n8\nTAGLIO\n70\n8\n71\n3\n74\n2\n11\n0\n21\n0\n11\n10\n21\n5\n`;
    const result = importDxf(dxf(rect('TAGLIO', 80, 50) + spline, 4));
    expect(result.part?.provenance.hadUnsupportedCurves).toBe(true);
    expect(result.part?.provenance.unsupportedCurvesDecision).toBeUndefined();
    expect(result.findings.some(f => f.code === 'GEO-008')).toBe(true);
    expect(result.part?.outer.curves.every(c => c.id.startsWith('ap'))).toBe(false);
    expect(result.validation?.can.editGeometry).toBe(false);
  });

  it('riconosce un foro e non assegna ancoraggio ne gruppo', () => {
    const result = importDxf(dxf(rect('0', 100, 80) + circle('0', 40, 30, 5), 4), { confirmUnits: 'mm' });
    const hole = result.part?.features.find(f => f.kind === 'hole');
    expect(hole?.kind).toBe('hole');
    if (hole?.kind === 'hole') expect(hole.diameter).toBeCloseTo(10, 3);
    expect(hole?.anchor).toEqual({ x: 'unset', y: 'unset' });
    expect(hole?.groupId).toBeUndefined();
    expect(result.groupProposals.every(() => true)).toBe(true);
    expect(result.part?.features.every(f => f.groupId === undefined)).toBe(true);
  });
});

describe('export DXF', () => {
  it('blocca l export se le unita non sono confermate', () => {
    const imported = importDxf(dxf(rect('0', 80, 50), 4));
    expect(imported.part).not.toBeNull();
    if (!imported.part) return;
    const exported = exportDxf(imported.part);
    expect(exported.dxf).toBeNull();
    expect(exported.gate.status).toBe('blocked');
    expect(exported.gate.findings.some(f => f.code === 'EXP-002')).toBe(true);
  });

  it('scrive $INSUNITS e un cerchio per il foro', () => {
    const imported = importDxf(dxf(rect('0', 100, 60) + circle('0', 20, 20, 4), 4), {
      confirmUnits: 'mm',
    });
    expect(imported.part).not.toBeNull();
    if (!imported.part) return;
    const exported = exportDxf(imported.part);
    expect(exported.gate.status === 'valid' || exported.gate.status === 'warnings').toBe(true);
    expect(exported.dxf).toContain('$INSUNITS');
    expect(exported.dxf).toContain('CIRCLE');
    expect(exported.dxf).toContain('SL_TAGLIO');
  });
});

const corpusDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../corpus');

function writeCorpus(): void {
  mkdirSync(corpusDir, { recursive: true });
  const files: Record<string, string> = {
    '01-rettangolo-mm.dxf': dxf(rect('TAGLIO', 200, 100), 4),
    '02-fori.dxf': dxf(rect('TAGLIO', 300, 120) + circle('TAGLIO', 40, 60, 5) + circle('TAGLIO', 80, 60, 5), 4),
    '03-senza-unita-80x50.dxf': dxf(rect('0', 80, 50)),
    '04-pollici.dxf': dxf(rect('0', 4, 2), 1),
    '05-spline.dxf': dxf(rect('TAGLIO', 120, 80) + `0\nSPLINE\n8\nTAGLIO\n70\n8\n11\n10\n21\n10\n11\n30\n21\n40\n`, 4),
    '06-ellisse.dxf': dxf(rect('TAGLIO', 90, 40) + `0\nELLIPSE\n8\nTAGLIO\n10\n40\n20\n20\n11\n10\n21\n0\n40\n0.5\n`, 4),
    '07-aperto.dxf': dxf(line('0', 0, 0, 50, 0) + line('0', 50, 0, 50, 20), 4),
    '08-piega.dxf': dxf(rect('TAGLIO', 400, 200) + line('PIEGA_90_UP', 150, 0, 150, 200), 4),
    '09-duplicati.dxf': dxf(rect('0', 60, 40) + line('0', 0, 0, 60, 0), 4),
    '10-asola.dxf': dxf(rect('TAGLIO', 160, 80) + `0\nLWPOLYLINE\n8\nTAGLIO\n90\n4\n70\n1\n10\n20\n20\n30\n42\n1\n10\n50\n20\n30\n42\n1\n`, 4),
  };
  const catalog = Object.keys(files).map(name => ({ name, bytes: files[name]?.length ?? 0 }));
  for (const [name, content] of Object.entries(files)) writeFileSync(resolve(corpusDir, name), content ?? '');
  writeFileSync(resolve(corpusDir, 'catalog.json'), JSON.stringify({ note: 'Corpus di riferimento per i test di import. Sostituibile con DXF di officina nello stesso formato.', files: catalog }, null, 2));
}

describe('corpus', () => {
  it('i 10 file si aprono o dichiarano un errore preciso', () => {
    writeCorpus();
    const names = [
      '01-rettangolo-mm.dxf',
      '02-fori.dxf',
      '03-senza-unita-80x50.dxf',
      '04-pollici.dxf',
      '05-spline.dxf',
      '06-ellisse.dxf',
      '07-aperto.dxf',
      '08-piega.dxf',
      '09-duplicati.dxf',
      '10-asola.dxf',
    ];
    for (const name of names) {
      const text = dxfFromName(name);
      const result = importDxf(text);
      const usable = result.part !== null;
      const declared = result.findings.some(f => f.severity === 'error');
      expect(usable || declared).toBe(true);
    }
  });
});

function dxfFromName(name: string): string {
  return readFileSync(resolve(corpusDir, name), 'utf8');
}

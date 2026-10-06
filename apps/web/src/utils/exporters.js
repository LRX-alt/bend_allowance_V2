// src/utils/exporters.js
//
// Esportazione dei risultati di piegatura in PDF, SVG e DXF.
// Funzioni pure: ricevono i dati e producono/salvano il file, senza dipendere
// dallo stato Vue.

import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

const DEG2RAD = Math.PI / 180;

/**
 * Calcola la polilinea del profilo (vertici) a partire dai segmenti.
 * Convenzione: l'angolo su segments[i] e la piega che precede il segmento i.
 * @param {Array<{length:number, angle:number, tipoPiega?:string}>} segments
 * @returns {{punti:Array<{x:number,y:number}>, bounds:{minX:number,minY:number,maxX:number,maxY:number}}}
 */
export function profiloPunti(segments) {
  const punti = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  let angoloCorrente = 0;
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;

  if (Array.isArray(segments)) {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i] || {};
      const lunghezza = Number(seg.length) || 0;
      // L'angolo memorizzato sul segmento i (i>0) e la piega in ingresso.
      if (i > 0 && seg.angle) {
        const direzione = seg.tipoPiega === 'giu' ? -1 : 1;
        angoloCorrente += seg.angle * direzione;
      }
      const rad = angoloCorrente * DEG2RAD;
      x += lunghezza * Math.cos(rad);
      y -= lunghezza * Math.sin(rad);
      punti.push({ x, y });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { punti, bounds: { minX, minY, maxX, maxY } };
}

/**
 * Esporta un riepilogo dei risultati in PDF.
 * @param {object} data
 */
export function esportaPDF(data) {
  const {
    spessore,
    raggioPiega,
    fattoreK,
    materiale,
    sviluppoTotale,
    segments = [],
    dettagli = [],
    unitLabel = 'mm',
    nomeFile = 'sviluppo_lamiera.pdf',
  } = data;

  const doc = new jsPDF();
  let y = 14;
  const line = (txt, indent = 10, dy = 7) => {
    doc.text(String(txt), indent, y);
    y += dy;
  };

  doc.setFontSize ? doc.setFontSize(14) : null;
  line('Calcolatore Sviluppo Lamiera - Risultati', 10, 10);
  if (doc.setFontSize) doc.setFontSize(11);

  line(`Materiale: ${materiale ?? '-'}`);
  line(`Spessore: ${spessore} ${unitLabel}`);
  line(`Raggio di piega: ${raggioPiega} ${unitLabel}`);
  if (typeof fattoreK === 'number') line(`Fattore K: ${fattoreK.toFixed(3)}`);
  y += 3;

  line('Segmenti:', 10, 7);
  segments.forEach((seg, i) => {
    line(`  #${i + 1}  L=${seg.length} ${unitLabel}  angolo=${seg.angle}\u00b0`, 12, 6);
  });
  y += 3;

  const pieghe = dettagli.filter(
    d => d && d.bendDeduction !== null && d.bendDeduction !== undefined
  );
  if (pieghe.length) {
    line('Pieghe (per segmento):', 10, 7);
    pieghe.forEach(d => {
      line(
        `  Seg ${d.segmento}: BA=${num(d.bendAllowance)}  SB=${num(d.setback)}  BD=${num(d.bendDeduction)}`,
        12,
        6
      );
    });
    y += 3;
  }

  if (doc.setFontSize) doc.setFontSize(13);
  line(`Sviluppo totale: ${num(sviluppoTotale)} ${unitLabel}`, 10, 8);

  doc.save(nomeFile);
}

function num(v) {
  return typeof v === 'number' ? v.toFixed(2) : '-';
}

/**
 * Esporta il profilo in DXF (entita LINE).
 * @param {object} data
 */
export function esportaDXF(data) {
  const { segments = [], nomeFile = 'sviluppo_lamiera.dxf' } = data;
  const { punti } = profiloPunti(segments);

  let dxf =
    '0\nSECTION\n2\nHEADER\n0\nENDSEC\n' +
    '0\nSECTION\n2\nTABLES\n0\nENDSEC\n' +
    '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n' +
    '0\nSECTION\n2\nENTITIES\n';

  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1];
    const b = punti[i];
    dxf += `0\nLINE\n8\n0\n10\n${a.x}\n20\n${a.y}\n11\n${b.x}\n21\n${b.y}\n`;
  }

  dxf += '0\nENDSEC\n0\nEOF\n';

  saveAs(new Blob([dxf], { type: 'application/dxf' }), nomeFile);
}

/**
 * Esporta il profilo in SVG.
 * @param {object} data
 */
export function esportaSVG(data) {
  const {
    segments = [],
    spessore,
    raggioPiega,
    fattoreK,
    unitLabel = 'mm',
    nomeFile = 'sviluppo_lamiera.svg',
  } = data;

  const { punti, bounds } = profiloPunti(segments);
  const margin = 12;
  const minX = bounds.minX - margin;
  const minY = bounds.minY - margin;
  const width = bounds.maxX - bounds.minX + margin * 2;
  const height = bounds.maxY - bounds.minY + margin * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">\n`;
  const kTxt = typeof fattoreK === 'number' ? fattoreK.toFixed(3) : fattoreK;
  svg += `<text x="${minX + 6}" y="${minY + 16}" font-family="Arial" font-size="10">Spessore: ${spessore} ${unitLabel}, Raggio: ${raggioPiega} ${unitLabel}, K: ${kTxt}</text>\n`;

  for (let i = 1; i < punti.length; i++) {
    const a = punti[i - 1];
    const b = punti[i];
    svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2196F3" stroke-width="2" />\n`;
    if (i > 1) {
      svg += `<circle cx="${a.x}" cy="${a.y}" r="2" fill="#F44336" />\n`;
    }
    const xMid = (a.x + b.x) / 2;
    const yMid = (a.y + b.y) / 2;
    svg += `<text x="${xMid}" y="${yMid - 4}" font-family="Arial" font-size="8" text-anchor="middle">${i}</text>\n`;
  }

  if (punti.length) {
    svg += `<circle cx="${punti[0].x}" cy="${punti[0].y}" r="3" fill="#4CAF50" />\n`;
    const last = punti[punti.length - 1];
    svg += `<circle cx="${last.x}" cy="${last.y}" r="3" fill="#FF9800" />\n`;
  }

  svg += '</svg>';

  saveAs(new Blob([svg], { type: 'image/svg+xml' }), nomeFile);
}

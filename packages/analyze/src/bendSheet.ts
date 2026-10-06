import { calcolaAperturaMatrice, MATERIAL_ID_TO_KEY } from '@sviluppolamiera/bend-core';
import type { Part } from '@sviluppolamiera/part-model';
import { evaluateProducibility } from './producibility';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char
  );
}

export function bendSheetHtml(part: Part): string {
  const findings = evaluateProducibility(part);
  const width = part.outer.bbox.maxX - part.outer.bbox.minX;
  const height = part.outer.bbox.maxY - part.outer.bbox.minY;
  const materialKey = part.material
    ? ((MATERIAL_ID_TO_KEY as Record<string, string | undefined>)[part.material.dbId] ?? '')
    : '';
  const opening =
    part.thickness !== undefined && materialKey
      ? calcolaAperturaMatrice(part.thickness, part.bendSetup.process, materialKey)
      : null;
  const rows = part.bendLines.map((bend, index) => {
    const angle = bend.angleDeg === undefined ? 'non letto dal layer' : String(bend.angleDeg);
    const radius = bend.innerRadius === undefined ? '—' : String(bend.innerRadius);
    const direction = bend.direction === 'up' ? 'su' : bend.direction === 'down' ? 'giu' : '—';
    const layer = escapeHtml(bend.layer || bend.source);
    return `<tr><td>${index + 1}</td><td>${layer}</td><td>${angle}</td><td>${radius}</td><td>${direction}</td></tr>`;
  });
  const notes = findings.map(item => `<li>${escapeHtml(item.message)}</li>`).join('');
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><title>Scheda di piega</title>
<style>
  body { font-family: sans-serif; margin: 24px; color: #1c2430; }
  h1 { font-size: 22px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #c5ced9; padding: 6px 8px; text-align: left; }
</style></head>
<body>
  <h1>Scheda di piega</h1>
  <p>Pezzo: ${escapeHtml(part.name)} · ${part.units}</p>
  <p>Sviluppo: ${width.toFixed(2)} × ${height.toFixed(2)} ${part.units}</p>
  <p>Spessore: ${part.thickness ?? '—'} · Materiale: ${escapeHtml(materialKey || '—')}</p>
  <p>Processo: ${part.bendSetup.process} · Apertura V: ${opening ? opening.aperturaOttimale.toFixed(2) : '—'}</p>
  <table>
    <thead><tr><th>#</th><th>Layer</th><th>Angolo</th><th>Raggio interno</th><th>Direzione</th></tr></thead>
    <tbody>${rows.join('') || '<tr><td colspan="5">Nessuna linea di piega. Servono linee su un layer il cui nome contiene PIEGA, BEND o FOLD.</td></tr>'}</tbody>
  </table>
  <ul>${notes}</ul>
</body></html>`;
}

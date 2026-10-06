import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { exportDecision } from '@sviluppolamiera/analyze';
import { editorBanner, editorLight, editorLightLabel } from './editorStatus.js';
import { useEditorDocument } from './useEditorDocument.js';

function corpus(name) {
  return readFileSync(
    resolve(fileURLToPath(new URL('../../../../corpus', import.meta.url)), name),
    'utf8'
  );
}

describe('stato editor', () => {
  it('descrive il file assente e i problemi di esportazione', () => {
    expect(editorLight(null, 'blocked')).toBe('idle');
    expect(editorLightLabel('idle')).toBe('Nessun file');
    expect(editorBanner(null)).toBe('');
  });

  it('chiede le unità e blocca l’export finché non sono confermate', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('03-senza-unita-80x50.dxf');
    const imported = editor.openSource({});
    expect(imported).toBeTruthy();
    expect(editor.askUnits.value).toBe(true);
    expect(editorBanner(imported)).toContain('Dimensioni da confermare');
    expect(editorLight(imported, exportDecision(imported).status)).toBe('bad');

    editor.confirmUnits('mm');
    expect(editor.askUnits.value).toBe(false);
    expect(editor.part.value.provenance.unitsConfirmedByUser).toBe(true);
    expect(exportDecision(editor.part.value).status).not.toBe('blocked');
  });

  it('apre il dialogo delle curve non gestibili', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('05-spline.dxf');
    const imported = editor.openSource({});
    expect(editor.askCurves.value).toBe(true);
    expect(imported.provenance.hadUnsupportedCurves).toBe(true);
    editor.confirmUnits('mm');
    editor.rejectCurves();
    expect(editor.part.value.provenance.unsupportedCurvesDecision).toBe('rejected');
    expect(editorBanner(editor.part.value)).toContain('sola lettura');
  });
});

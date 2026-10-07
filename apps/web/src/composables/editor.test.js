import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { exportDecision } from '@sviluppolamiera/analyze';
import { commit } from '@sviluppolamiera/part-model';
import { editorCommand } from './editorShortcuts.js';
import { editorBanner, editorLight, editorLightLabel } from './editorStatus.js';
import { useEditorDocument } from './useEditorDocument.js';
import { useEditorSelection } from './useEditorSelection.js';

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

  it('apre il disegno in millimetri e consente l’export', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('03-senza-unita-80x50.dxf');
    const imported = editor.openSource();
    expect(imported).toBeTruthy();
    expect(imported.units).toBe('mm');
    expect(imported.provenance.unitsConfirmedByUser).toBe(true);
    expect(editorBanner(imported)).toBe('');
    expect(exportDecision(imported).status).not.toBe('blocked');
  });

  it('apre il dialogo delle curve non gestibili', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('05-spline.dxf');
    const imported = editor.openSource();
    expect(editor.askCurves.value).toBe(true);
    expect(imported.provenance.hadUnsupportedCurves).toBe(true);
    editor.rejectCurves();
    expect(editor.part.value.provenance.unsupportedCurvesDecision).toBe('rejected');
    expect(editorBanner(editor.part.value)).toContain('sola lettura');
  });

  it('legge i pollici e i file senza unità come millimetri, senza conversione', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('04-pollici.dxf');
    const inches = editor.stageSource('04-pollici.dxf');
    expect(inches.part.units).toBe('mm');
    expect(inches.part.provenance.assumedUnits).toBe('mm');
    expect(inches.part.outer.bbox.maxX - inches.part.outer.bbox.minX).toBeCloseTo(4, 3);

    editor.source.value = corpus('03-senza-unita-80x50.dxf');
    const unknown = editor.stageSource('03-senza-unita-80x50.dxf');
    expect(unknown.part.units).toBe('mm');
    expect(unknown.part.outer.bbox.maxX - unknown.part.outer.bbox.minX).toBeCloseTo(80, 3);
  });

  it('misura solo con lo strumento dedicato', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('03-senza-unita-80x50.dxf');
    editor.openSource();
    const selection = useEditorSelection(editor.state, editor.part, editor.proposals, ref([]));
    selection.onPoint({ x: 0, y: 0 }, 'measure');
    selection.onPoint({ x: 30, y: 0 }, 'measure');
    expect(selection.measureText.value).toContain('30.00 mm');
    selection.onPoint({ x: 4, y: 4 }, 'select');
    expect(selection.measure.value).toEqual([]);
  });

  it('aggiunge una piega sul contorno e la elimina', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('03-senza-unita-80x50.dxf');
    editor.openSource();
    const selection = useEditorSelection(editor.state, editor.part, editor.proposals, ref([]));
    expect(selection.onPoint({ x: 40, y: 0 }, 'bend')).toBe('added');
    expect(editor.part.value.bendLines).toHaveLength(1);
    expect(selection.pickBend({ x: 200, y: 200 })).toBe(false);
    expect(selection.selectedBend.value?.id).toBe(editor.part.value.bendLines[0].id);
    expect(selection.pickBend({ x: 40, y: 0 })).toBe(true);
    expect(editor.part.value.bendLines[0].source).toBe('manual');
    expect(selection.onPoint({ x: 40, y: 0 }, 'bend')).toBe('bend');
    expect(editor.part.value.bendLines).toHaveLength(1);
    expect(selection.removeBend(editor.part.value.bendLines[0].id)).toBe(true);
    expect(editor.part.value.bendLines).toHaveLength(0);
    selection.onPoint({ x: 20, y: 25 }, 'bend');
    selection.onPoint({ x: 60, y: 25 }, 'bend');
    expect(editor.part.value.bendLines).toHaveLength(1);
    expect(editor.part.value.bendLines[0].a.y).toBeCloseTo(25);
    expect(editor.part.value.bendLines[0].b.y).toBeCloseTo(25);
  });

  it('seleziona la piega più vicina al clic, non la prima entro tolleranza', () => {
    const editor = useEditorDocument();
    editor.source.value = corpus('03-senza-unita-80x50.dxf');
    editor.openSource();
    const selection = useEditorSelection(editor.state, editor.part, editor.proposals, ref([]));
    const upper = { id: 'upper', a: { x: 10, y: 30 }, b: { x: 70, y: 30 }, source: 'manual' };
    const lower = { id: 'lower', a: { x: 10, y: 28.5 }, b: { x: 70, y: 28.5 }, source: 'manual' };
    editor.state.value = commit(
      editor.state.value,
      { ...editor.part.value, bendLines: [upper, lower] },
      'Piega vicine'
    );
    expect(upper.a.y).toBeCloseTo(30);
    expect(lower.a.y).toBeCloseTo(28.5);
    expect(selection.onPoint({ x: 40, y: 28.5 }, 'select')).toBe('bend');
    expect(selection.selectedBendId.value).toBe(lower.id);
    expect(selection.onPoint({ x: 40, y: 30 }, 'select')).toBe('bend');
    expect(selection.selectedBendId.value).toBe(upper.id);
  });
});

describe('scorciatoie editor', () => {
  it('tiene i comandi fuori dai campi e mappa gli strumenti', () => {
    const plain = { tagName: 'DIV' };
    expect(editorCommand({ key: 'b', target: plain })).toBe('tool-bend');
    expect(editorCommand({ key: 'Delete', target: plain })).toBe('delete-bend');
    expect(editorCommand({ key: 'q', target: plain })).toBe('tool-stretch');
    expect(editorCommand({ key: 'f', target: plain })).toBe('fit');
    expect(editorCommand({ key: 'z', ctrlKey: true, target: plain })).toBe('undo');
    expect(editorCommand({ key: 'z', ctrlKey: true, shiftKey: true, target: plain })).toBe('redo');
    expect(editorCommand({ key: 'q', target: { tagName: 'INPUT' } })).toBe(null);
  });
});

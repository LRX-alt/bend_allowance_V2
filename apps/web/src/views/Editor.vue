<template>
  <div class="editor-page">
    <EditorToolbar
      :file-name="fileName"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :light="light"
      :label="lightLabel"
      :part="part"
      :gate-status="gate.status"
      @file="onFile"
      @undo="onUndo"
      @redo="onRedo"
      @findings="showFindings = !showFindings"
      @fit="canvasHost?.fit()"
      @zoom="factor => canvasHost?.zoomBy(factor)"
      @export="onExport"
    />
    <p v-if="banner" class="editor-banner" role="status">
      {{ banner }}
      <button v-if="needsUnits" type="button" class="btn btn-ghost btn-sm" @click="askUnits = true">
        Dichiara l'unità
      </button>
    </p>
    <div class="editor-workspace">
      <EditorCanvas
        ref="canvasHost"
        :part="part"
        :ghost="ghost"
        :preview-part="previewPart"
        :measure="measure"
        :selected-bend-id="selectedBend?.id || ''"
        :selected-loop-id="selected?.loopId || ''"
        @file="onFile"
        @point="onPoint"
      />
      <EditorSidePanel
        :part="part"
        :axis="axis"
        :amount="amount"
        :sign="sign"
        :mode="mode"
        :policy="policy"
        :needs-policy="needsPolicy"
        :locked="locked"
        :can-apply="Boolean(previewPart)"
        :messages="messages"
        :compare="compare"
        :measure-text="measureText"
        :selected="selected"
        :selected-bend="selectedBend"
        :pick-message="pickMessage"
        :draft-diameter="draftDiameter"
        :proposals="proposals"
        :findings="findings"
        :show-findings="showFindings"
        @update:axis="axis = $event"
        @update:amount="amount = $event"
        @update:sign="sign = $event"
        @update:mode="mode = $event"
        @update:policy="policy = $event"
        @update:draft-diameter="draftDiameter = $event"
        @preview="preview"
        @apply="apply"
        @diameter="changeDiameter"
        @group="acceptGroup"
        @sheet="openSheet"
        @bend-angle="updateBend({ angleDeg: Number($event) })"
        @bend-direction="updateBend({ direction: $event || undefined })"
        @thickness="setThickness"
        @material="setMaterial"
      />
    </div>

    <EditorDialog :open="askUnits" title="Dimensioni da confermare" title-id="units-title">
      <p class="dialog-copy">
        Senza l'unità non posso modificare né esportare. Le coordinate restano quelle del file.
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="confirmUnits('mm')">
          Millimetri
        </button>
        <button type="button" class="btn btn-ghost" @click="confirmUnits('inch')">Pollici</button>
      </div>
    </EditorDialog>
    <EditorDialog
      :open="askCurves && !askUnits"
      title="Curve non gestibili"
      title-id="curves-title"
    >
      <p class="dialog-copy">
        Il file contiene curve che non posso modificare senza una tua scelta.
      </p>
      <label class="dialog-fields"
        >Tolleranza mm
        <input
          v-model.number="approxTol"
          class="form-control"
          type="number"
          min="0.01"
          step="0.01"
        />
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="approximate">Approssima</button>
        <button type="button" class="btn btn-ghost" @click="rejectCurves">
          Lascia in sola lettura
        </button>
      </div>
    </EditorDialog>
    <section class="editor-about">
      <h1>Modifica uno sviluppo DXF</h1>
      <p>
        Apri il file, conferma se le quote sono in millimetri o in pollici, indica spessore e
        materiale, misura con due clic e correggi una quota. Le linee di piega si selezionano sul
        disegno; la scheda di piega riepiloga angolo e direzione. Non è un programma CNC della
        pressa.
        <router-link to="/modifica-sviluppo-dxf">Come funziona la modifica DXF</router-link>
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { exportDecision } from '@sviluppolamiera/analyze';
import { commit } from '@sviluppolamiera/part-model';
import EditorCanvas from '@/components/editor/EditorCanvas.vue';
import EditorDialog from '@/components/editor/EditorDialog.vue';
import EditorSidePanel from '@/components/editor/EditorSidePanel.vue';
import EditorToolbar from '@/components/editor/EditorToolbar.vue';
import { editorLight, editorLightLabel } from '@/composables/editorStatus.js';
import { useEditorDocument } from '@/composables/useEditorDocument.js';
import { useEditorExport } from '@/composables/useEditorExport.js';
import { useEditorHistory } from '@/composables/useEditorHistory.js';
import { useEditorSelection } from '@/composables/useEditorSelection.js';
import { useEditorStretch } from '@/composables/useEditorStretch.js';
import '@/components/editor/editor.css';

const SITE_URL = 'https://www.sviluppolamiera.it';

useHead({
  title: 'Modifica sviluppo DXF | SviluppoLamiera',
  meta: [
    {
      name: 'description',
      content:
        'Apri uno sviluppo DXF, conferma le unità, indica lo spessore e modifica una quota prima della piegatura.',
    },
    { property: 'og:title', content: 'Modifica sviluppo DXF | SviluppoLamiera' },
    {
      property: 'og:description',
      content:
        'Misura, controlla e modifica uno sviluppo lamiera DXF. Unità, spessore e scheda di piega.',
    },
    { property: 'og:url', content: `${SITE_URL}/editor` },
  ],
  link: [{ rel: 'canonical', href: `${SITE_URL}/editor` }],
});

const canvasHost = ref(null);
const showFindings = ref(false);
const {
  proposals,
  findings,
  askUnits,
  askCurves,
  approxTol,
  part,
  needsUnits,
  banner,
  state,
  fileName,
  onFile: loadFile,
  confirmUnits,
  approximate,
  rejectCurves,
} = useEditorDocument();
const { canUndo, canRedo, onUndo: undoState, onRedo: redoState } = useEditorHistory(state);
const {
  axis,
  amount,
  sign,
  mode,
  policy,
  messages,
  compare,
  ghost,
  previewPart,
  needsPolicy,
  preview,
  apply,
  clearPreview,
} = useEditorStretch(state, part);
const {
  draftDiameter,
  measure,
  selected,
  selectedBend,
  measureText,
  pickMessage,
  onPoint,
  acceptGroup,
  changeDiameter,
} = useEditorSelection(state, part, proposals, messages);
const { gate, onExport, openSheet } = useEditorExport(part, findings);

const light = computed(() => editorLight(part.value, gate.value.status));
const lightLabel = computed(() => editorLightLabel(light.value));
const locked = computed(
  () => needsUnits.value || part.value?.provenance.unsupportedCurvesDecision === 'rejected'
);

function onUndo() {
  undoState();
  clearPreview();
}

function onRedo() {
  redoState();
  clearPreview();
}

function setThickness(raw) {
  if (!part.value) return;
  const thickness = Number(raw);
  if (!Number.isFinite(thickness) || thickness <= 0 || part.value.thickness === thickness) return;
  state.value = commit(state.value, { ...part.value, thickness }, 'Spessore');
}

function updateBend(patch) {
  if (!part.value || !selectedBend.value) return;
  if (patch.angleDeg !== undefined && (!Number.isFinite(patch.angleDeg) || patch.angleDeg <= 0))
    return;
  const bendLines = part.value.bendLines.map(bend =>
    bend.id === selectedBend.value.id ? { ...bend, ...patch } : bend
  );
  state.value = commit(state.value, { ...part.value, bendLines }, 'Linea di piega');
}

function setMaterial(dbId) {
  if (!part.value) return;
  const next = { ...part.value };
  if (dbId) next.material = { dbId };
  else delete next.material;
  state.value = commit(state.value, next, 'Materiale');
}

async function onFile(event) {
  await loadFile(event);
  if (event?.target) event.target.value = '';
}

watch(part, value => {
  findings.value = value ? exportDecision(value).findings : [];
  clearPreview();
});
</script>

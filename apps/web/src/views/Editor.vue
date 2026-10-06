<template>
  <div class="editor-page" :data-density="density">
    <EditorToolbar
      :file-name="fileName"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :undo-label="undoLabel"
      :redo-label="redoLabel"
      :light="light"
      :label="lightLabel"
      :warning-count="warningCount"
      :part="part"
      :gate-status="gate.status"
      @file="onFile"
      @undo="onUndo"
      @redo="onRedo"
      @findings="openAnalysis"
      @analyze="openAnalysis"
      @sheet="openSheet"
      @export="requestExport"
    />
    <p v-if="banner" class="editor-banner" role="status">{{ banner }}</p>
    <div class="editor-workspace">
      <EditorToolRail
        :tool="tool"
        :enabled="Boolean(part)"
        @tool="setTool"
        @fit="canvasHost?.fit()"
        @zoom="factor => canvasHost?.zoomBy(factor)"
      />
      <EditorCanvas
        ref="canvasHost"
        :part="part"
        :ghost="ghost"
        :preview-part="previewPart"
        :measure="measure"
        :measure-text="measureText"
        :selected-bend-id="selectedBend?.id || ''"
        :selected-loop-id="selected?.loopId || ''"
        :tool="tool"
        @file="onFile"
        @point="point => onPoint(point, tool)"
        @cursor="cursor = $event"
        @context="onContext"
        @view="viewState = $event"
      />
      <EditorSidePanel
        :part="part"
        :tool="tool"
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
        :selected="selected"
        :selected-bend="selectedBend"
        :pick-message="pickMessage"
        :draft-diameter="draftDiameter"
        :proposals="proposals"
        :findings="findings"
        :findings-tick="findingsTick"
        :focus-target="focusTarget"
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
        @bend-angle="updateBend({ angleDeg: Number($event) })"
        @bend-direction="updateBend({ direction: $event || undefined })"
        @bend-radius="updateBend({ innerRadius: Number($event) })"
        @thickness="setThickness"
        @material="setMaterial"
        @select-bend="selectBend"
        @remove-bend="removeBend"
        @focus-finding="focusFinding"
      />
    </div>
    <EditorStatusBar
      :tool="tool"
      :cursor="cursor"
      :part="part"
      :scale="viewState.scale"
      :fit-scale="viewState.fitScale"
      :measure-text="measureText"
      :locked="locked"
      :density="density"
      @density="toggleDensity"
    />
    <p v-if="notice" class="editor-toast" role="status">{{ notice }}</p>

    <EditorDialog
      :open="askUnits"
      title="Conferma le unità"
      title-id="units-title"
      @close="cancelUnits"
    >
      <p class="dialog-copy">
        {{
          unitChoice === 'inch'
            ? 'Il file dichiara i pollici. Confermando, le quote vengono convertite in millimetri.'
            : 'Il file non dichiara le unità. Conferma come vanno lette le coordinate.'
        }}
      </p>
      <label class="technical-field"
        >Unità del file
        <select v-model="unitChoice">
          <option value="mm">Millimetri</option>
          <option value="inch">Pollici, convertiti in mm</option>
        </select>
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="cancelUnits">Annulla</button>
        <button type="button" class="btn btn-primary" @click="confirmUnits">Apri il pezzo</button>
      </div>
    </EditorDialog>

    <EditorDialog :open="askCurves" title="Curve non gestibili" title-id="curves-title">
      <p class="dialog-copy">
        Il file contiene spline o ellissi. Scegli se approssimarle o lasciare il pezzo in sola
        lettura.
      </p>
      <label class="technical-field"
        >Tolleranza mm
        <input v-model.number="approxTol" type="number" min="0.01" step="0.01" />
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="approximate">Approssima</button>
        <button type="button" class="btn btn-ghost" @click="rejectCurves">Sola lettura</button>
      </div>
    </EditorDialog>

    <EditorDialog
      :open="askExport"
      title="Esporta con controlli aperti"
      title-id="export-title"
      @close="askExport = false"
    >
      <p class="dialog-copy">Il DXF si può esportare. Restano questi controlli:</p>
      <ul class="export-warnings">
        <li v-for="item in exportWarnings" :key="item.code + item.message">{{ item.message }}</li>
      </ul>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="askExport = false">
          Torna al pezzo
        </button>
        <button type="button" class="btn btn-primary" @click="finishExport">
          Esporta comunque
        </button>
      </div>
    </EditorDialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { exportDecision } from '@sviluppolamiera/analyze';
import { commit } from '@sviluppolamiera/part-model';
import EditorCanvas from '@/components/editor/EditorCanvas.vue';
import EditorDialog from '@/components/editor/EditorDialog.vue';
import EditorSidePanel from '@/components/editor/EditorSidePanel.vue';
import EditorStatusBar from '@/components/editor/EditorStatusBar.vue';
import EditorToolbar from '@/components/editor/EditorToolbar.vue';
import EditorToolRail from '@/components/editor/EditorToolRail.vue';
import { editorLight, editorLightLabel } from '@/composables/editorStatus.js';
import { editorCommand } from '@/composables/editorShortcuts.js';
import { mergeFindings } from '@/composables/partSummary.js';
import { useEditorDocument } from '@/composables/useEditorDocument.js';
import { useEditorExport } from '@/composables/useEditorExport.js';
import { useEditorHistory } from '@/composables/useEditorHistory.js';
import { useEditorSelection } from '@/composables/useEditorSelection.js';
import { useEditorStretch } from '@/composables/useEditorStretch.js';
import '@/components/editor/editor.css';

const SITE_URL = 'https://www.sviluppolamiera.it';

useHead({
  title: 'Editor DXF | SviluppoLamiera',
  meta: [
    {
      name: 'description',
      content:
        'Apri uno sviluppo DXF, leggi dimensioni, pieghe, spessore e materiale, poi correggi una quota.',
    },
    { property: 'og:title', content: 'Editor DXF | SviluppoLamiera' },
    {
      property: 'og:description',
      content: 'Workspace per misurare, controllare ed esportare uno sviluppo lamiera DXF.',
    },
    { property: 'og:url', content: `${SITE_URL}/editor` },
  ],
  link: [{ rel: 'canonical', href: `${SITE_URL}/editor` }],
});

const canvasHost = ref(null);
const tool = ref('select');
const cursor = ref(null);
function storedDensity() {
  try {
    return localStorage.getItem('sl-density') === 'comfortable' ? 'comfortable' : 'compact';
  } catch {
    return 'compact';
  }
}

const density = ref(storedDensity());
const findingsTick = ref(0);
const focusTarget = ref('');
const askExport = ref(false);
const notice = ref('');
const viewState = ref({ scale: 1, fitScale: 1 });
let noticeTimer;

const {
  proposals,
  findings,
  importFindings,
  askCurves,
  askUnits,
  unitChoice,
  approxTol,
  part,
  banner,
  state,
  fileName,
  onFile: loadFile,
  applyUnits,
  cancelUnits,
  approximate,
  rejectCurves,
} = useEditorDocument();
const {
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  onUndo: undoState,
  onRedo: redoState,
} = useEditorHistory(state);
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
  selectBend,
  removeBend,
  clearSelection,
  acceptGroup,
  changeDiameter,
} = useEditorSelection(state, part, proposals, messages);
const { gate, onExport, openSheet } = useEditorExport(part, findings);

const light = computed(() => editorLight(part.value, gate.value.status));
const lightLabel = computed(() => editorLightLabel(light.value));
const locked = computed(() => part.value?.provenance.unsupportedCurvesDecision === 'rejected');
const warningCount = computed(
  () =>
    findings.value.filter(item => item.severity === 'warning' || item.severity === 'error').length
);
const exportWarnings = computed(() => findings.value.filter(item => item.severity === 'warning'));

function setTool(next) {
  tool.value = next;
  measure.value = [];
}

function toggleDensity() {
  density.value = density.value === 'compact' ? 'comfortable' : 'compact';
  localStorage.setItem('sl-density', density.value);
}

function notify(message) {
  notice.value = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    notice.value = '';
  }, 3200);
}

function openAnalysis() {
  findingsTick.value += 1;
}

function focusFinding(id) {
  if (id === 'units') {
    askUnits.value = true;
    return;
  }
  focusTarget.value = '';
  nextTick(() => {
    focusTarget.value = id;
  });
}

function onUndo() {
  undoState();
  clearPreview();
  pickMessage.value = '';
}

function onRedo() {
  redoState();
  clearPreview();
  pickMessage.value = '';
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
  if (
    patch.innerRadius !== undefined &&
    (!Number.isFinite(patch.innerRadius) || patch.innerRadius < 0)
  )
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

async function fitLoaded() {
  await nextTick();
  requestAnimationFrame(() => canvasHost.value?.fit());
}

async function onFile(event) {
  const staged = await loadFile(event);
  if (event?.target) event.target.value = '';
  if (staged && !staged.needsUnits) await fitLoaded();
}

async function confirmUnits() {
  applyUnits();
  await fitLoaded();
}

function requestExport() {
  if (!part.value || gate.value.status === 'blocked') {
    openAnalysis();
    notify('Esportazione bloccata: controlla la diagnostica.');
    return;
  }
  if (exportWarnings.value.length) {
    askExport.value = true;
    return;
  }
  finishExport();
}

function finishExport() {
  askExport.value = false;
  notify(onExport(fileName.value) ? 'DXF esportato.' : 'Esportazione non riuscita.');
}

function onContext(action) {
  if (action === 'fit') canvasHost.value?.fit();
  if (action === 'measure') setTool('measure');
  if (action === 'bend') setTool('bend');
  if (action === 'clear') clearSelection();
}

function onWindowKey(event) {
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const command = editorCommand(event);
  if (!command) return;
  if (command !== 'undo' && command !== 'redo' && !document.querySelector('.editor-page')) return;
  event.preventDefault();
  if (command === 'undo') onUndo();
  if (command === 'redo') onRedo();
  if (command === 'tool-select') setTool('select');
  if (command === 'tool-pan') setTool('pan');
  if (command === 'tool-measure') setTool('measure');
  if (command === 'tool-stretch') setTool('stretch');
  if (command === 'tool-bend') setTool('bend');
  if (command === 'delete-bend') removeBend();
  if (command === 'fit') canvasHost.value?.fit();
  if (command === 'zoom-in') canvasHost.value?.zoomBy(1.1);
  if (command === 'zoom-out') canvasHost.value?.zoomBy(0.9);
  if (command === 'clear') clearSelection();
}

watch(part, value => {
  if (!value) return;
  findings.value = mergeFindings(importFindings.value, exportDecision(value).findings);
  clearPreview();
});

onMounted(() => window.addEventListener('keydown', onWindowKey));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKey);
  clearTimeout(noticeTimer);
});
</script>

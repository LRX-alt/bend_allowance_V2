<template>
  <div
    class="canvas-stage"
    :class="`tool-${tool}`"
    @dragover.prevent
    @drop.prevent="onDrop"
    @contextmenu.prevent="onContext"
  >
    <canvas
      ref="canvas"
      role="img"
      :aria-label="part ? 'Disegno del pezzo' : 'Nessun disegno caricato'"
      @wheel.prevent="onWheel"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    ></canvas>
    <div v-if="!part" class="import-banner">
      <label class="btn btn-primary btn-sm">
        Apri DXF
        <input type="file" accept=".dxf" @change="$emit('file', $event)" />
      </label>
      <span>oppure trascina il file qui</span>
      <router-link to="/modifica-sviluppo-dxf">Istruzioni</router-link>
    </div>
    <div v-if="part" class="canvas-legend" aria-hidden="true">
      <span><i class="swatch sheet"></i> Geometria</span>
      <span><i class="swatch hole"></i> Fori</span>
      <span><i class="swatch bend-pos"></i> Piega +</span>
      <span><i class="swatch bend-neg"></i> Piega −</span>
      <span><i class="swatch dimension"></i> Quote</span>
      <span><i class="swatch preview"></i> Anteprima</span>
    </div>
    <input
      v-if="editing"
      ref="editInput"
      class="dimension-editor"
      type="number"
      min="0.01"
      step="0.01"
      :style="{ left: `${editing.x + editing.w / 2}px`, top: `${editing.y + editing.h / 2}px` }"
      :value="editing.draft"
      aria-label="Nuova quota in millimetri"
      @input="editing.draft = $event.target.value"
      @keydown.enter.prevent="commitEdit"
      @keydown.esc.prevent="editing = null"
      @blur="commitEdit"
    />
    <ul v-if="menu" class="context-menu" :style="{ left: `${menu.x}px`, top: `${menu.y}px` }">
      <li v-if="selectedBendId">
        <button type="button" @click="runMenu('delete-bend')">Elimina linea di piega</button>
      </li>
      <li><button type="button" @click="runMenu('fit')">Adatta al pezzo</button></li>
      <li><button type="button" @click="runMenu('bend')">Linea di piega</button></li>
      <li><button type="button" @click="runMenu('measure')">Misura</button></li>
      <li><button type="button" @click="runMenu('clear')">Deseleziona</button></li>
    </ul>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { useEditorViewport } from '@/composables/useEditorViewport.js';

const props = defineProps({
  part: { type: Object, default: null },
  ghost: { type: Object, default: null },
  previewPart: { type: Object, default: null },
  measure: { type: Array, default: () => [] },
  measureText: { type: String, default: '' },
  selectedBendId: { type: String, default: '' },
  selectedLoopId: { type: String, default: '' },
  tool: { type: String, default: 'select' },
  showDimensions: { type: Boolean, default: true },
});
const emit = defineEmits([
  'file',
  'point',
  'cursor',
  'context',
  'context-point',
  'view',
  'resize-dimension',
]);
const canvas = ref(null);
const menu = ref(null);
const editing = ref(null);
const editInput = ref(null);
const viewport = useEditorViewport(canvas, () => ({
  part: props.part,
  ghost: props.ghost,
  previewPart: props.previewPart,
  measure: props.measure,
  measureText: props.measureText,
  selectedBendId: props.selectedBendId,
  selectedLoopId: props.selectedLoopId,
  tool: props.tool,
  showDimensions: props.showDimensions,
  onCursor: point => emit('cursor', point),
  onView: payload => emit('view', payload),
}));

function onWheel(event) {
  menu.value = null;
  viewport.onWheel(event);
}
function onDown(event) {
  menu.value = null;
  viewport.onDown(event);
}
function onMove(event) {
  viewport.onMove(event);
  const hit = props.tool === 'select' ? viewport.dimensionAt(event) : null;
  if (canvas.value) canvas.value.style.cursor = hit ? 'pointer' : '';
}
function onPointerUp(event) {
  viewport.onUp(event, point => {
    const hit = props.tool === 'select' ? viewport.dimensionAt(event) : null;
    if (hit) {
      editing.value = {
        ...hit,
        draft: String(Math.round(hit.current * 100) / 100),
      };
      nextTick(() => {
        editInput.value?.focus();
        editInput.value?.select();
      });
      return;
    }
    emit('point', point);
  });
}
function commitEdit() {
  const hit = editing.value;
  if (!hit) return;
  editing.value = null;
  const next = Number(String(hit.draft).replace(',', '.'));
  if (!Number.isFinite(next) || next <= 0 || Math.abs(next - hit.current) < 0.001) return;
  emit('resize-dimension', { axis: hit.axis, from: hit.from, to: hit.to, next });
}
function onDrop(event) {
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  emit('file', { target: { files: [file] } });
}
function onContext(event) {
  if (!props.part) return;
  emit('context-point', viewport.worldFromEvent(event));
  const rect = event.currentTarget.getBoundingClientRect();
  menu.value = { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
function runMenu(action) {
  menu.value = null;
  emit('context', action);
}

watch(
  () => [
    props.part,
    props.ghost,
    props.previewPart,
    props.measure,
    props.measureText,
    props.selectedBendId,
    props.selectedLoopId,
    props.showDimensions,
  ],
  () => viewport.paint(),
  { deep: true }
);

defineExpose({
  fit: () => viewport.fit(props.previewPart || props.part),
  zoomBy: viewport.zoomBy,
});
</script>

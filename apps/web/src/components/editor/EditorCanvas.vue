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
    <div v-if="!part" class="empty-state canvas-empty">
      <p class="page-kicker">Editor DXF</p>
      <h2>Importa lo sviluppo</h2>
      <p>
        Trascina un DXF qui oppure sceglilo dal disco. Le quote di ingombro compaiono sul disegno.
      </p>
      <ul>
        <li>DXF in millimetri, oppure pollici da confermare</li>
        <li>Linee di piega verdi se il layer contiene PIEGA, BEND o FOLD</li>
        <li>Fori, asole e contorno chiuso</li>
      </ul>
      <label class="btn btn-primary">
        Apri DXF
        <input type="file" accept=".dxf" @change="$emit('file', $event)" />
      </label>
      <router-link to="/modifica-sviluppo-dxf">Come si modifica una quota</router-link>
    </div>
    <div v-if="part" class="canvas-legend" aria-hidden="true">
      <span><i class="swatch sheet"></i> Geometria</span>
      <span><i class="swatch hole"></i> Fori</span>
      <span><i class="swatch bend-pos"></i> Piega +</span>
      <span><i class="swatch bend-neg"></i> Piega −</span>
      <span><i class="swatch dimension"></i> Quote</span>
      <span><i class="swatch preview"></i> Anteprima</span>
    </div>
    <ul v-if="menu" class="context-menu" :style="{ left: `${menu.x}px`, top: `${menu.y}px` }">
      <li><button type="button" @click="runMenu('fit')">Adatta al pezzo</button></li>
      <li><button type="button" @click="runMenu('bend')">Linea di piega</button></li>
      <li><button type="button" @click="runMenu('measure')">Misura</button></li>
      <li><button type="button" @click="runMenu('clear')">Deseleziona</button></li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
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
const emit = defineEmits(['file', 'point', 'cursor', 'context', 'view']);
const canvas = ref(null);
const menu = ref(null);
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
}
function onPointerUp(event) {
  viewport.onUp(event, point => emit('point', point));
}
function onDrop(event) {
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  emit('file', { target: { files: [file] } });
}
function onContext(event) {
  if (!props.part) return;
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

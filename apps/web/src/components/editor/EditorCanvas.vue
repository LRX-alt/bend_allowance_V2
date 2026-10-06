<template>
  <div class="canvas-stage" @dragover.prevent @drop.prevent="onDrop">
    <canvas
      ref="canvas"
      role="img"
      :aria-label="part ? 'Disegno del pezzo' : 'Nessun disegno caricato'"
      @wheel.prevent="onWheel"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onPointerUp"
    ></canvas>
    <div v-if="!part" class="empty-state canvas-empty">
      <p class="page-kicker">Pezzo</p>
      <p class="empty-title">Apri uno sviluppo DXF</p>
      <p>
        Trascina il file sull’area oppure sceglilo dal disco. Misura, controlla e modifica solo dopo
        la conferma delle dimensioni.
      </p>
      <label class="btn btn-primary">
        Apri DXF
        <input type="file" accept=".dxf" @change="$emit('file', $event)" />
      </label>
    </div>
    <div class="canvas-legend" aria-hidden="true">
      <span><i class="swatch sheet"></i> Contorno</span>
      <span><i class="swatch bend"></i> Linea di piega</span>
      <span><i class="swatch preview"></i> Anteprima</span>
    </div>
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
  selectedBendId: { type: String, default: '' },
  selectedLoopId: { type: String, default: '' },
});
const emit = defineEmits(['file', 'point']);
const canvas = ref(null);
const viewport = useEditorViewport(canvas, () => ({
  part: props.part,
  ghost: props.ghost,
  previewPart: props.previewPart,
  measure: props.measure,
  selectedBendId: props.selectedBendId,
  selectedLoopId: props.selectedLoopId,
}));

function onWheel(event) {
  viewport.onWheel(event);
}
function onDown(event) {
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

watch(
  () => [
    props.part,
    props.ghost,
    props.previewPart,
    props.measure,
    props.selectedBendId,
    props.selectedLoopId,
  ],
  () => viewport.paint(),
  { deep: true }
);
watch(
  () => props.part,
  part => {
    if (part) viewport.fit(part);
  }
);

defineExpose({
  fit: () => viewport.fit(props.part),
  zoomBy: viewport.zoomBy,
});
</script>

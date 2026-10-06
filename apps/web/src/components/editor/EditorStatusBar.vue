<template>
  <footer class="editor-status" aria-live="polite">
    <span>{{ toolLabel }}</span>
    <span class="tech-num">{{ cursorText }}</span>
    <span>{{ part ? `${part.units || 'mm'}` : '—' }}</span>
    <span class="tech-num">Zoom {{ zoomLabel }}</span>
    <span v-if="part">{{ counts }}</span>
    <span v-if="measureText" class="tech-num">{{ tool === 'bend' ? 'Piega' : 'Misura' }} {{ measureText }}</span>
    <span v-else-if="locked">Sola lettura</span>
    <button type="button" class="status-link" @click="$emit('density')">
      {{ density === 'compact' ? 'Compatta' : 'Comoda' }}
    </button>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { featureCounts } from '@/composables/partSummary.js';

const props = defineProps({
  tool: { type: String, default: 'select' },
  cursor: { type: Object, default: null },
  part: { type: Object, default: null },
  scale: { type: Number, default: 1 },
  fitScale: { type: Number, default: 1 },
  measureText: { type: String, default: '' },
  locked: Boolean,
  density: { type: String, default: 'compact' },
});
defineEmits(['density']);

const labels = {
  select: 'Selezione',
  pan: 'Sposta vista',
  measure: 'Misura',
  stretch: 'Modifica quota',
  bend: 'Linea di piega',
};

const toolLabel = computed(() => labels[props.tool] || 'Selezione');
const cursorText = computed(() => {
  if (!props.cursor || !Number.isFinite(props.cursor.x)) return 'X —  Y —';
  return `X ${props.cursor.x.toFixed(2)}  Y ${props.cursor.y.toFixed(2)}`;
});
const zoomLabel = computed(() => {
  const base = props.fitScale > 0 ? props.fitScale : 1;
  return `${Math.round((props.scale / base) * 100)}%`;
});
const counts = computed(() => {
  const data = featureCounts(props.part);
  const label = (count, one, many) => `${count} ${count === 1 ? one : many}`;
  return `${label(data.bends, 'piega', 'pieghe')} · ${label(data.holes, 'foro', 'fori')} · ${label(data.slots, 'asola', 'asole')}`;
});
</script>

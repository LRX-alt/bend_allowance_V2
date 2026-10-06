<template>
  <div class="finding-stack">
    <p v-if="!items.length" class="section-note">Nessuna segnalazione sul pezzo aperto.</p>
    <article
      v-for="(item, index) in items"
      :key="`${item.code}-${index}`"
      class="finding-item"
      :class="item.severity"
    >
      <strong>{{ severityLabel(item.severity) }}</strong>
      <div>
        <p>{{ item.message }}</p>
        <p class="finding-code tech-num">{{ item.code }}</p>
        <button
          v-if="findingFocus(item)"
          type="button"
          class="btn btn-ghost btn-sm"
          @click="$emit('focus', findingFocus(item).id)"
        >
          {{ findingFocus(item).label }}
        </button>
      </div>
    </article>
  </div>
</template>

<script setup>
import { findingFocus } from '@/composables/partSummary.js';

defineProps({
  items: { type: Array, default: () => [] },
});
defineEmits(['focus']);

function severityLabel(severity) {
  if (severity === 'error') return 'Errore';
  if (severity === 'warning') return 'Controllo';
  return 'Info';
}
</script>

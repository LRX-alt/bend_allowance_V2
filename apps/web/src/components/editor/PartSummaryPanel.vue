<template>
  <section class="part-summary" aria-label="Pezzo">
    <header class="panel-heading">
      <h2>Pezzo</h2>
      <span v-if="part" class="tech-num">{{ part.units || 'mm' }}</span>
    </header>
    <p v-if="!part" class="section-note">I dati compaiono dopo l'importazione del DXF.</p>
    <dl v-else class="summary-grid">
      <div>
        <dt>Dimensioni</dt>
        <dd class="tech-num">{{ sizeText }}</dd>
      </div>
      <div>
        <dt>Spessore</dt>
        <dd class="tech-num">{{ part.thickness ? `${format(part.thickness)} mm` : 'Mancante' }}</dd>
      </div>
      <div>
        <dt>Materiale</dt>
        <dd>{{ material?.name || 'Non indicato' }}</dd>
      </div>
      <div>
        <dt>Pieghe</dt>
        <dd class="tech-num">{{ counts.bends }}</dd>
      </div>
      <div>
        <dt>Fori / asole</dt>
        <dd class="tech-num">{{ counts.holes }} / {{ counts.slots }}</dd>
      </div>
      <div>
        <dt>Fattore K</dt>
        <dd class="tech-num">{{ kText }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { featureCounts, kFactorOf, materialRecord, partBox } from '@/composables/partSummary.js';

const props = defineProps({
  part: { type: Object, default: null },
});

const box = computed(() => partBox(props.part));
const material = computed(() => materialRecord(props.part));
const counts = computed(() => featureCounts(props.part));
const sizeText = computed(() =>
  box.value ? `${format(box.value.width)} × ${format(box.value.height)} mm` : '—'
);
const kText = computed(() => {
  const value = kFactorOf(props.part);
  return value == null ? '—' : value.toFixed(2);
});

function format(value) {
  return Number(value).toFixed(2);
}
</script>

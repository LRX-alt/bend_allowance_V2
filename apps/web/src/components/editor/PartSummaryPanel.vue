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
    <div v-if="part" class="sheet-fields">
      <label class="technical-field" for="sheet-thickness"
        >Spessore mm
        <input
          id="sheet-thickness"
          type="number"
          min="0.1"
          step="0.1"
          :value="part.thickness ?? ''"
          placeholder="Es. 2"
          @change="$emit('thickness', $event.target.value)"
        />
      </label>
      <label class="technical-field" for="sheet-material"
        >Materiale
        <select
          id="sheet-material"
          :value="part.material?.dbId || ''"
          @change="$emit('material', $event.target.value)"
        >
          <option value="">Non indicato</option>
          <option v-for="item in materials" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { materialsDatabase } from '@sviluppolamiera/bend-core';
import { featureCounts, kFactorOf, partBox } from '@/composables/partSummary.js';

defineEmits(['thickness', 'material']);
const materials = materialsDatabase;

const props = defineProps({
  part: { type: Object, default: null },
});

const box = computed(() => partBox(props.part));
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

<template>
  <section class="bend-panel" aria-label="Pieghe">
    <header class="panel-heading">
      <h2>Pieghe</h2>
      <span class="tech-num">{{ bends.length }}</span>
    </header>
    <p v-if="!part" class="section-note">Nessun pezzo aperto.</p>
    <p v-else-if="!bends.length" class="section-note">
      Nessuna linea di piega. Con lo strumento Linea di piega clicca un segmento oppure traccia due
      punti.
    </p>
    <p v-else class="section-note">
      Un DXF spesso ripete la linea centrale e le linee del raggio. Elimina quelle che non sono la
      piega.
    </p>
    <div v-if="bends.length" class="table-container bend-table-wrap">
      <table class="table bend-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Angolo</th>
            <th>Direzione</th>
            <th>Raggio</th>
            <th>Lunghezza</th>
            <th>Stato</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(bend, index) in bends"
            :key="bend.id"
            :data-bend-id="bend.id"
            :class="{ selected: bend.id === selectedId }"
            @click="$emit('select', bend.id)"
          >
            <td class="tech-num">{{ index + 1 }}</td>
            <td class="tech-num">{{ bend.angleDeg ?? '—' }}</td>
            <td>{{ directionLabel(bend.direction) }}</td>
            <td class="tech-num">{{ bend.innerRadius ?? '—' }}</td>
            <td class="tech-num">{{ lengthOf(bend) }}</td>
            <td>
              <span class="bend-state" :class="bendStatus(bend) === 'Completa' ? 'ok' : 'warn'">
                {{ bendStatus(bend) }}
              </span>
            </td>
            <td>
              <button
                type="button"
                class="bend-remove"
                title="Elimina questa linea di piega"
                @click.stop="$emit('remove', bend.id)"
              >
                Elimina
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, watch } from 'vue';
import { bendLength, bendStatus, directionLabel } from '@/composables/partSummary.js';

const props = defineProps({
  part: { type: Object, default: null },
  selectedId: { type: String, default: '' },
});
defineEmits(['select', 'remove']);

const bends = computed(() => props.part?.bendLines ?? []);

function lengthOf(bend) {
  const length = bendLength(bend);
  return length == null ? '—' : length.toFixed(1);
}

watch(
  () => props.selectedId,
  async id => {
    if (!id) return;
    await nextTick();
    document
      .querySelector(`[data-bend-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }
);
</script>

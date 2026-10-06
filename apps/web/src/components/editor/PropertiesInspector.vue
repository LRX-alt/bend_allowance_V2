<template>
  <section class="inspector-block" aria-label="Proprietà">
    <h3>{{ title }}</h3>
    <template v-if="!part">
      <p class="section-note">Seleziona un elemento sul disegno dopo aver aperto il DXF.</p>
    </template>
    <template v-else-if="selectedBend">
      <dl>
        <div class="property-row">
          <dt>Lunghezza</dt>
          <dd class="tech-num">{{ lengthText }} mm</dd>
        </div>
        <div class="property-row">
          <dt>Layer</dt>
          <dd>{{ selectedBend.layer || 'Manuale' }}</dd>
        </div>
        <div class="property-row">
          <dt>Origine</dt>
          <dd>{{ selectedBend.source === 'layer' ? 'Layer DXF' : 'Manuale' }}</dd>
        </div>
      </dl>
      <label class="technical-field" for="bend-angle"
        >Angolo °
        <input
          id="bend-angle"
          type="number"
          min="1"
          step="1"
          :value="selectedBend.angleDeg ?? ''"
          @change="$emit('bend-angle', $event.target.value)"
        />
      </label>
      <label class="technical-field" for="bend-direction"
        >Direzione
        <select
          id="bend-direction"
          :value="selectedBend.direction || ''"
          @change="$emit('bend-direction', $event.target.value)"
        >
          <option value="">Non indicata</option>
          <option value="up">Positiva</option>
          <option value="down">Negativa</option>
        </select>
      </label>
      <label class="technical-field" for="bend-radius"
        >Raggio interno mm
        <input
          id="bend-radius"
          type="number"
          min="0"
          step="0.1"
          :value="selectedBend.innerRadius ?? ''"
          @change="$emit('bend-radius', $event.target.value)"
        />
      </label>
      <dl v-if="calc">
        <div class="property-row">
          <dt>Bend allowance</dt>
          <dd class="tech-num">{{ calc.bendAllowance.toFixed(3) }} mm</dd>
        </div>
        <div class="property-row">
          <dt>Bend deduction</dt>
          <dd class="tech-num">{{ calc.bendDeduction.toFixed(3) }} mm</dd>
        </div>
        <div class="property-row">
          <dt>Setback</dt>
          <dd class="tech-num">{{ calc.setback.toFixed(3) }} mm</dd>
        </div>
      </dl>
      <p v-else class="section-note">
        BA e BD compaiono quando ci sono angolo, raggio, spessore e fattore K.
      </p>
      <button type="button" class="btn btn-ghost btn-sm" @click="$emit('remove-bend')">
        Elimina linea di piega
      </button>
    </template>
    <template v-else-if="selected">
      <dl>
        <div class="property-row">
          <dt>Tipo</dt>
          <dd>{{ featureTitle(selected) }}</dd>
        </div>
        <div v-if="selected.kind === 'hole'" class="property-row">
          <dt>Centro</dt>
          <dd class="tech-num">
            {{ selected.center.x.toFixed(2) }}, {{ selected.center.y.toFixed(2) }}
          </dd>
        </div>
        <div v-if="selected.kind === 'slot'" class="property-row">
          <dt>Larghezza</dt>
          <dd class="tech-num">{{ selected.width.toFixed(2) }} mm</dd>
        </div>
        <div v-if="selected.kind === 'rect'" class="property-row">
          <dt>Dimensioni</dt>
          <dd class="tech-num">{{ selected.w.toFixed(2) }} × {{ selected.h.toFixed(2) }} mm</dd>
        </div>
      </dl>
      <label v-if="selected.kind === 'hole'" class="technical-field" for="hole-diameter"
        >Diametro mm
        <input
          id="hole-diameter"
          v-model.number="draftDiameter"
          type="number"
          min="0.1"
          step="0.1"
          @change="$emit('diameter')"
        />
      </label>
      <p v-else class="section-note">Questa lavorazione si seleziona, non si ridimensiona.</p>
    </template>
    <template v-else>
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
      <dl>
        <div class="property-row">
          <dt>Larghezza</dt>
          <dd class="tech-num">{{ size ? `${size.width} mm` : '—' }}</dd>
        </div>
        <div class="property-row">
          <dt>Altezza</dt>
          <dd class="tech-num">{{ size ? `${size.height} mm` : '—' }}</dd>
        </div>
        <div class="property-row">
          <dt>Unità</dt>
          <dd>{{ part.units || 'mm' }}</dd>
        </div>
        <div class="property-row">
          <dt>Metodo</dt>
          <dd>{{ part.bendSetup?.method || 'standard' }}</dd>
        </div>
      </dl>
      <p class="section-note">
        Spessore e materiale non arrivano dal DXF. Servono ai controlli di piega.
      </p>
    </template>
    <p v-if="pickMessage && !selected && !selectedBend" class="section-note">{{ pickMessage }}</p>
    <button
      v-for="proposal in proposals"
      :key="proposal.featureIds.join('-')"
      type="button"
      class="btn btn-ghost btn-sm proposal"
      @click="$emit('group', proposal)"
    >
      Gruppo di fori, passo {{ proposal.pitch }} mm
    </button>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { materialsDatabase } from '@sviluppolamiera/bend-core';
import { bendCalculation, bendLength, partBox } from '@/composables/partSummary.js';

const props = defineProps({
  part: { type: Object, default: null },
  selected: { type: Object, default: null },
  selectedBend: { type: Object, default: null },
  pickMessage: { type: String, default: '' },
  draftDiameter: Number,
  proposals: { type: Array, default: () => [] },
});
const emit = defineEmits([
  'update:draftDiameter',
  'thickness',
  'material',
  'bend-angle',
  'bend-direction',
  'bend-radius',
  'diameter',
  'group',
  'remove-bend',
]);

const materials = materialsDatabase;
const draftDiameter = ref(props.draftDiameter);
watch(draftDiameter, value => emit('update:draftDiameter', value));
watch(
  () => props.draftDiameter,
  value => {
    draftDiameter.value = value;
  }
);

const size = computed(() => {
  const box = partBox(props.part);
  if (!box) return null;
  return { width: box.width.toFixed(2), height: box.height.toFixed(2) };
});
const calc = computed(() => bendCalculation(props.part, props.selectedBend));
const lengthText = computed(() => {
  const length = bendLength(props.selectedBend);
  return length == null ? '—' : length.toFixed(2);
});
const title = computed(() => {
  if (props.selectedBend) return 'Linea di piega';
  if (props.selected) return featureTitle(props.selected);
  return 'Lamiera';
});

function featureTitle(feature) {
  if (feature.kind === 'hole') return 'Foro';
  if (feature.kind === 'slot') return 'Asola';
  if (feature.kind === 'rect') return 'Taglio rettangolare';
  return 'Lavorazione';
}
</script>

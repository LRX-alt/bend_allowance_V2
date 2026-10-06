<template>
  <section class="inspector-block">
    <h3>Modifica quota</h3>
    <p class="section-note">
      Allunga o accorcia il pezzo lungo la larghezza o l'altezza. Non sposta i vertici uno per uno.
    </p>
    <label class="technical-field"
      >Valore mm
      <input v-model.number="amount" type="number" min="0" step="0.1" :disabled="locked" />
    </label>
    <label class="technical-field"
      >Asse
      <select v-model="axis" :disabled="locked">
        <option value="x">Larghezza</option>
        <option value="y">Altezza</option>
      </select>
    </label>
    <label class="technical-field"
      >Verso
      <select v-model.number="sign" :disabled="locked">
        <option :value="1">Aumenta</option>
        <option :value="-1">Riduci</option>
      </select>
    </label>
    <label class="technical-field"
      >Riferimento
      <select v-model="mode" :disabled="locked">
        <option value="leftFixed">
          {{ axis === 'x' ? 'Lato sinistro fermo' : 'Lato basso fermo' }}
        </option>
        <option value="rightFixed">
          {{ axis === 'x' ? 'Lato destro fermo' : 'Lato alto fermo' }}
        </option>
        <option value="symmetric">Simmetrico</option>
      </select>
    </label>
    <label v-if="needsPolicy" class="technical-field"
      >Fori
      <select v-model="policy" :disabled="locked">
        <option value="followMinEdge">Seguono il lato minimo</option>
        <option value="followMaxEdge">Seguono il lato massimo</option>
        <option value="keepAbsolute">Restano in posizione</option>
      </select>
    </label>
    <div class="side-actions">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="locked"
        @click="$emit('preview')"
      >
        Anteprima
      </button>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        :disabled="locked || !canApply"
        @click="$emit('apply')"
      >
        Applica
      </button>
    </div>
    <p v-for="(item, index) in messages" :key="`${index}-${item}`" class="side-message">
      {{ item }}
    </p>
    <dl v-if="compare" class="summary-grid">
      <div>
        <dt>Larghezza</dt>
        <dd class="tech-num">
          {{ compare.widthBefore.toFixed(2) }} → {{ compare.widthAfter.toFixed(2) }}
        </dd>
      </div>
      <div>
        <dt>Fori</dt>
        <dd class="tech-num">{{ compare.holesBefore }} → {{ compare.holesAfter }}</dd>
      </div>
      <div>
        <dt>Diametri</dt>
        <dd>{{ compare.diametersUnchanged ? 'Invariati' : 'Modificati' }}</dd>
      </div>
      <div>
        <dt>Interassi</dt>
        <dd>{{ compare.pitchesUnchanged ? 'Invariati' : 'Modificati' }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  axis: String,
  amount: Number,
  sign: Number,
  mode: String,
  policy: String,
  needsPolicy: Boolean,
  locked: Boolean,
  canApply: Boolean,
  messages: { type: Array, default: () => [] },
  compare: { type: Object, default: null },
});
const emit = defineEmits([
  'update:axis',
  'update:amount',
  'update:sign',
  'update:mode',
  'update:policy',
  'preview',
  'apply',
]);

const axis = ref(props.axis);
const amount = ref(props.amount);
const sign = ref(props.sign);
const mode = ref(props.mode);
const policy = ref(props.policy);

watch(axis, value => emit('update:axis', value));
watch(amount, value => emit('update:amount', value));
watch(sign, value => emit('update:sign', value));
watch(mode, value => emit('update:mode', value));
watch(policy, value => emit('update:policy', value));
watch(
  () => props.axis,
  value => {
    axis.value = value;
  }
);
watch(
  () => props.amount,
  value => {
    amount.value = value;
  }
);
watch(
  () => props.sign,
  value => {
    sign.value = value;
  }
);
watch(
  () => props.mode,
  value => {
    mode.value = value;
  }
);
watch(
  () => props.policy,
  value => {
    policy.value = value;
  }
);
</script>

<template>
  <section v-if="part" class="bend-setup" aria-label="Setup piega">
    <h3>Setup piega</h3>
    <label class="technical-field catalog-field" for="setup-punch-type"
      >Punzone
      <select id="setup-punch-type" :value="punchPick" @change="onPunchPick">
        <option value="custom">Personalizzato</option>
        <optgroup v-for="group in punchGroups" :key="group.nome" :label="group.nome">
          <option v-for="item in group.items" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </optgroup>
      </select>
    </label>
    <label class="technical-field" for="setup-punch"
      >Raggio punta mm
      <input
        id="setup-punch"
        type="number"
        min="0"
        step="0.1"
        :value="punchText"
        @change="onPunch"
      />
    </label>
    <label class="technical-field" for="setup-process"
      >Processo
      <select id="setup-process" :value="process" @change="onProcess">
        <option v-for="item in processi" :key="item.id" :value="item.id">{{ item.label }}</option>
      </select>
    </label>
    <label class="technical-field catalog-field" for="setup-die-type"
      >Matrice
      <select id="setup-die-type" :value="diePick" @change="onDiePick">
        <option value="custom">Personalizzata</option>
        <optgroup v-for="group in dieGroups" :key="group.nome" :label="group.nome">
          <option v-for="item in group.items" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </optgroup>
      </select>
    </label>
    <label class="technical-field" for="setup-v"
      >Apertura V mm
      <input id="setup-v" type="number" min="0" step="0.5" :value="vText" @change="onOpening" />
    </label>
    <p class="section-note">Cava consigliata {{ consigliataText }}</p>
    <label class="technical-field" for="setup-origin"
      >Origine del raggio
      <select id="setup-origin" :value="source" @change="onSource">
        <option v-for="item in origini" :key="item.id" :value="item.id">{{ item.label }}</option>
      </select>
    </label>
    <label v-if="source === 'measured'" class="technical-field" for="setup-measured"
      >Raggio misurato mm
      <input
        id="setup-measured"
        type="number"
        min="0"
        step="0.1"
        :value="measuredText"
        @change="onMeasured"
      />
    </label>
    <label v-else-if="source === 'target'" class="technical-field" for="setup-target"
      >Raggio target mm
      <input
        id="setup-target"
        type="number"
        min="0"
        step="0.1"
        :value="targetText"
        @change="onTarget"
      />
    </label>
    <p v-if="resolved.stato === 'resolved' && source !== 'manual'" class="section-note">
      Raggio interno dello sviluppo {{ resolved.raggioSviluppo.toFixed(2) }} mm
    </p>
    <p v-if="resolved.assunzioneOperatore" class="section-note">{{ assunzione }}</p>
    <p v-else-if="source !== 'manual' && resolved.stato === 'incomplete'" class="section-note">
      {{ motivo }}
    </p>
    <aside v-if="stima != null" class="estimate-note" :aria-label="stimaTitolo">
      <p>{{ stimaTitolo }}</p>
      <p class="tech-num">{{ stima.toFixed(2) }} mm</p>
      <p>{{ stimaTesto }}</p>
    </aside>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { calcolaAperturaMatrice, risolviRaggioInterno } from '@sviluppolamiera/bend-core';
import {
  ASSUNZIONE,
  MOTIVI,
  ORIGINI,
  PROCESSI,
  STIMA_TITOLO,
  stimaEmpirica,
  testoStimaEmpirica,
} from '@/calculator/toolSetup.js';
import { MATRICI, PUNZONI, gruppiDi } from '@/calculator/toolCatalog.js';

const props = defineProps({
  part: { type: Object, default: null },
});
const emit = defineEmits(['setup']);

const processi = PROCESSI;
const origini = ORIGINI;
const punchGroups = gruppiDi(PUNZONI);
const dieGroups = gruppiDi(MATRICI);
const punchPick = ref('custom');
const diePick = ref('custom');
const assunzione = ASSUNZIONE;
const stimaTitolo = STIMA_TITOLO;

const process = computed(() => props.part?.bendSetup?.process || 'airBend');
const source = computed(() => props.part?.bendSetup?.radiusPolicy?.source || 'manual');
const punchText = computed(() => {
  const radius = props.part?.bendSetup?.punch?.radius;
  return radius == null ? '' : radius;
});
const vText = computed(() => {
  const opening = props.part?.bendSetup?.vOpening;
  return opening == null ? '' : opening;
});
const measuredText = computed(() => {
  const value = props.part?.bendSetup?.radiusPolicy?.measuredInside;
  return value == null ? '' : value;
});
const targetText = computed(() => {
  const value = props.part?.bendSetup?.radiusPolicy?.targetInside;
  return value == null ? '' : value;
});
const consigliataText = computed(() => {
  if (!props.part?.thickness || !props.part?.material?.dbId) return '—';
  const opening = calcolaAperturaMatrice(
    props.part.thickness,
    process.value,
    props.part.material.dbId
  );
  return `${opening.aperturaOttimale.toFixed(1)} mm`;
});
const resolved = computed(() =>
  risolviRaggioInterno({
    source:
      source.value === 'manual' && !props.part?.bendSetup?.radiusPolicy ? undefined : source.value,
    measuredInside: props.part?.bendSetup?.radiusPolicy?.measuredInside,
    targetInside: props.part?.bendSetup?.radiusPolicy?.targetInside,
    punchRadius: props.part?.bendSetup?.punch?.radius,
    manualInside: props.part?.bendLines?.find(bend => bend.innerRadius != null)?.innerRadius,
  })
);
const motivo = computed(() => MOTIVI[resolved.value.motivo] || '');
const stima = computed(() =>
  stimaEmpirica(
    props.part?.thickness,
    props.part?.bendSetup?.vOpening,
    props.part?.bendSetup?.punch?.radius,
    process.value
  )
);
const stimaTesto = computed(() =>
  testoStimaEmpirica({
    cava: props.part?.bendSetup?.vOpening,
    spessore: props.part?.thickness,
    processo: process.value,
  })
);

function numberOrNull(value) {
  if (value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

watch(
  () => props.part?.bendSetup?.punch?.radius,
  radius => {
    const current = PUNZONI.find(item => item.id === punchPick.value);
    if (current && current.radius === radius) return;
    punchPick.value = PUNZONI.find(item => item.radius === radius)?.id || 'custom';
  },
  { immediate: true }
);
watch(
  () => props.part?.bendSetup?.vOpening,
  opening => {
    const current = MATRICI.find(item => item.id === diePick.value);
    if (current && current.opening === opening) return;
    diePick.value = MATRICI.find(item => item.opening === opening)?.id || 'custom';
  },
  { immediate: true }
);

function onPunchPick(event) {
  punchPick.value = event.target.value;
  const item = PUNZONI.find(entry => entry.id === punchPick.value);
  if (!item) return;
  emit('setup', { punch: { radius: item.radius } });
}

function onDiePick(event) {
  diePick.value = event.target.value;
  const item = MATRICI.find(entry => entry.id === diePick.value);
  if (!item) return;
  emit('setup', { vOpening: item.opening });
}

function onPunch(event) {
  const radius = numberOrNull(event.target.value);
  const current = PUNZONI.find(item => item.id === punchPick.value);
  if (!current || current.radius !== radius) punchPick.value = 'custom';
  emit('setup', { punch: radius == null ? null : { radius } });
}

function onProcess(event) {
  emit('setup', { process: event.target.value });
}

function onOpening(event) {
  emit('setup', { vOpening: numberOrNull(event.target.value) });
}

function onSource(event) {
  emit('setup', {
    radiusPolicy: {
      source: event.target.value,
      measuredInside: props.part?.bendSetup?.radiusPolicy?.measuredInside,
      targetInside: props.part?.bendSetup?.radiusPolicy?.targetInside,
    },
  });
}

function onMeasured(event) {
  emit('setup', {
    radiusPolicy: {
      source: 'measured',
      measuredInside: numberOrNull(event.target.value) ?? undefined,
      targetInside: props.part?.bendSetup?.radiusPolicy?.targetInside,
    },
  });
}

function onTarget(event) {
  emit('setup', {
    radiusPolicy: {
      source: 'target',
      measuredInside: props.part?.bendSetup?.radiusPolicy?.measuredInside,
      targetInside: numberOrNull(event.target.value) ?? undefined,
    },
  });
}
</script>

<template>
  <aside class="editor-side">
    <section v-if="part" class="sheet-data">
      <h2>Lamiera</h2>
      <label for="sheet-thickness"
        >Spessore mm
        <input
          id="sheet-thickness"
          class="form-control"
          type="number"
          min="0.1"
          step="0.1"
          :value="part.thickness ?? ''"
          placeholder="Es. 2"
          @change="$emit('thickness', $event.target.value)"
        />
      </label>
      <label for="sheet-material"
        >Materiale
        <select
          id="sheet-material"
          class="form-control"
          :value="part.material?.dbId || ''"
          @change="$emit('material', $event.target.value)"
        >
          <option value="">Non indicato</option>
          <option v-for="item in materials" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </label>
      <p class="section-note">
        Il DXF non contiene questi dati: servono solo per i controlli di piega.
      </p>
    </section>

    <div class="side-tabs" role="tablist" aria-label="Pannello pezzo">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'modifica'"
        @click="tab = 'modifica'"
      >
        Modifica
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'elemento'"
        @click="tab = 'elemento'"
      >
        Elemento
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'diagnostica'"
        @click="tab = 'diagnostica'"
      >
        Diagnostica
      </button>
    </div>

    <section v-if="tab === 'modifica'" class="side-section">
      <p v-if="measureText" class="measure-readout">Misura: {{ measureText }}</p>
      <p v-else class="section-note">Due clic sul disegno misurano la distanza.</p>
      <template v-if="part">
        <h2>Modifica dimensione</h2>
        <label
          >Valore mm<input
            v-model.number="amount"
            class="form-control"
            type="number"
            min="0"
            step="0.1"
            :disabled="locked"
        /></label>
        <label
          >Asse
          <select v-model="axis" class="form-control" :disabled="locked">
            <option value="x">In larghezza</option>
            <option value="y">In altezza</option>
          </select>
        </label>
        <label
          >Verso
          <select v-model.number="sign" class="form-control" :disabled="locked">
            <option :value="1">Aumenta di</option>
            <option :value="-1">Riduci di</option>
          </select>
        </label>
        <label
          >Lato fermo
          <select v-model="mode" class="form-control" :disabled="locked">
            <option value="leftFixed">
              {{ axis === 'x' ? 'Tieni fermo il lato sinistro' : 'Tieni fermo il lato basso' }}
            </option>
            <option value="rightFixed">
              {{ axis === 'x' ? 'Tieni fermo il lato destro' : 'Tieni fermo il lato alto' }}
            </option>
            <option value="symmetric">Cresce in modo simmetrico</option>
          </select>
        </label>
        <label v-if="needsPolicy"
          >Fori
          <select v-model="policy" class="form-control" :disabled="locked">
            <option value="followMinEdge">
              {{
                axis === 'x'
                  ? 'Mantieni la distanza dal lato sinistro'
                  : 'Mantieni la distanza dal basso'
              }}
            </option>
            <option value="followMaxEdge">
              {{
                axis === 'x'
                  ? 'Mantieni la distanza dal lato destro'
                  : 'Mantieni la distanza dall’alto'
              }}
            </option>
            <option value="keepAbsolute">Lascia i fori dove sono</option>
          </select>
        </label>
        <div class="side-actions">
          <button type="button" class="btn btn-ghost" :disabled="locked" @click="$emit('preview')">
            Anteprima
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="locked || !canApply"
            @click="$emit('apply')"
          >
            Applica modifica
          </button>
        </div>
        <p v-for="(item, index) in messages" :key="`${index}-${item}`" class="side-message">
          {{ item }}
        </p>
        <dl v-if="compare" class="compare-grid">
          <div>
            <dt>Larghezza</dt>
            <dd>{{ compare.widthBefore.toFixed(2) }} → {{ compare.widthAfter.toFixed(2) }}</dd>
          </div>
          <div>
            <dt>Fori</dt>
            <dd>{{ compare.holesBefore }} → {{ compare.holesAfter }}</dd>
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
      </template>
      <p v-else class="section-note">Carica un DXF per modificare le dimensioni.</p>
    </section>

    <section v-else-if="tab === 'elemento'" class="side-section">
      <p v-if="part" class="section-note">
        Con il semaforo verde puoi esportare il DXF, misurare con due clic, cambiare una quota e
        aprire la scheda di piega. {{ inventory }}
      </p>
      <template v-if="selectedBend">
        <h2>Linea di piega</h2>
        <p class="section-note">Layer {{ selectedBend.layer || 'manuale' }}</p>
        <label
          >Angolo °
          <input
            class="form-control"
            type="number"
            min="1"
            step="1"
            :value="selectedBend.angleDeg ?? ''"
            @change="$emit('bend-angle', $event.target.value)"
          />
        </label>
        <label
          >Direzione
          <select
            class="form-control"
            :value="selectedBend.direction || ''"
            @change="$emit('bend-direction', $event.target.value)"
          >
            <option value="">Non indicata</option>
            <option value="up">Su</option>
            <option value="down">Giù</option>
          </select>
        </label>
      </template>
      <template v-else-if="selected">
        <h2>{{ featureTitle(selected) }}</h2>
        <label v-if="selected.kind === 'hole'"
          >Diametro mm
          <input
            v-model.number="draftDiameter"
            class="form-control"
            type="number"
            step="0.1"
            @change="$emit('diameter')"
          />
        </label>
        <p v-else class="section-note">
          Questa lavorazione si può selezionare, non ridimensionare.
        </p>
      </template>
      <p v-else class="section-note">
        {{ pickMessage || 'Clicca una linea arancione o un foro chiuso.' }}
      </p>
      <button
        v-for="proposal in proposals"
        :key="proposal.featureIds.join('-')"
        type="button"
        class="btn btn-ghost proposal"
        @click="$emit('group', proposal)"
      >
        Questi fori sembrano un gruppo, passo {{ proposal.pitch }} mm
      </button>
      <button v-if="part" type="button" class="btn btn-ghost" @click="$emit('sheet')">
        Scheda di piega
      </button>
    </section>

    <section v-else class="side-section">
      <p v-if="!findings.length" class="section-note">Nessuna segnalazione.</p>
      <ul v-else class="finding-list">
        <li v-for="(item, index) in findings" :key="index">{{ item.message }}</li>
      </ul>
    </section>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { materialsDatabase } from '@sviluppolamiera/bend-core';

const props = defineProps({
  part: { type: Object, default: null },
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
  measureText: { type: String, default: '' },
  selected: { type: Object, default: null },
  selectedBend: { type: Object, default: null },
  pickMessage: { type: String, default: '' },
  draftDiameter: Number,
  proposals: { type: Array, default: () => [] },
  findings: { type: Array, default: () => [] },
  showFindings: Boolean,
});
const emit = defineEmits([
  'update:axis',
  'update:amount',
  'update:sign',
  'update:mode',
  'update:policy',
  'update:draftDiameter',
  'preview',
  'apply',
  'diameter',
  'group',
  'sheet',
  'bend-angle',
  'bend-direction',
  'thickness',
  'material',
]);
const materials = materialsDatabase;
const tab = ref('modifica');

function featureTitle(feature) {
  if (feature.kind === 'hole') return 'Foro';
  if (feature.kind === 'slot') return 'Asola';
  if (feature.kind === 'rect') return 'Taglio rettangolare';
  return 'Lavorazione';
}

const inventory = computed(() => {
  if (!props.part) return '';
  const features = props.part.features ?? [];
  const holes = features.filter(item => item.kind === 'hole').length;
  const slots = features.filter(item => item.kind === 'slot').length;
  const other = features.length - holes - slots;
  const label = (count, one, many) => `${count} ${count === 1 ? one : many}`;
  return (
    [
      label(props.part.bendLines.length, 'linea di piega', 'linee di piega'),
      label(holes, 'foro', 'fori'),
      label(slots, 'asola', 'asole'),
      label(other, 'altro taglio', 'altri tagli'),
    ].join(', ') + '.'
  );
});
const axis = ref(props.axis);
const amount = ref(props.amount);
const sign = ref(props.sign);
const mode = ref(props.mode);
const policy = ref(props.policy);
const draftDiameter = ref(props.draftDiameter);

watch(axis, value => emit('update:axis', value));
watch(amount, value => emit('update:amount', value));
watch(sign, value => emit('update:sign', value));
watch(mode, value => emit('update:mode', value));
watch(policy, value => emit('update:policy', value));
watch(draftDiameter, value => emit('update:draftDiameter', value));
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
watch(
  () => props.draftDiameter,
  value => {
    draftDiameter.value = value;
  }
);
watch(
  () => props.showFindings,
  value => {
    if (value) tab.value = 'diagnostica';
  }
);
watch(
  () => props.selected,
  value => {
    if (value) tab.value = 'elemento';
  }
);
watch(
  () => props.selectedBend,
  value => {
    if (value) tab.value = 'elemento';
  }
);
</script>

<template>
  <div class="calc-page">
    <header class="calc-top">
      <div>
        <p class="page-kicker">Calcolatore</p>
        <h1>Sviluppo lamiera</h1>
        <p>Bend allowance e bend deduction, con quote esterne come percorso principale.</p>
      </div>
      <div class="export-actions">
        <button type="button" class="btn btn-primary" @click="exportPdf">Esporta PDF</button>
        <button
          type="button"
          class="btn btn-ghost"
          title="Sviluppo piatto con linee di piega e quote"
          @click="exportDxf"
        >
          Esporta DXF
        </button>
        <button type="button" class="btn btn-ghost" @click="share">Condividi</button>
      </div>
    </header>

    <div class="calc-layout">
      <section class="calc-panel">
        <div class="mode-row">
          <div class="segmented" role="tablist" aria-label="Modalità di calcolo">
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'esterne'"
              @click="mode = 'esterne'"
            >
              Quote esterne
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'profilo'"
              @click="mode = 'profilo'"
            >
              Profilo a segmenti
            </button>
          </div>
          <router-link class="guide-link" to="/guida-materiali">Guida ai materiali</router-link>
        </div>

        <div class="fields">
          <label for="spessore"
            >Spessore mm<input
              id="spessore"
              v-model.number="spessore"
              type="number"
              min="0.1"
              step="0.1"
          /></label>
          <label for="larghezza" title="Lato del pezzo lungo la linea di piega"
            >Larghezza mm<input
              id="larghezza"
              v-model.number="larghezza"
              type="number"
              min="1"
              step="1"
          /></label>
          <label for="materiale">
            Materiale
            <select id="materiale" v-model="materialId" @change="applyMaterial">
              <option v-for="item in materials" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </label>
          <label for="punzone"
            >Punzone mm<input
              id="punzone"
              type="number"
              min="0"
              step="0.1"
              :value="raggioPunzone ?? ''"
              @change="raggioPunzone = optionalNumber($event.target.value)"
          /></label>
          <label for="processo"
            >Processo
            <select id="processo" v-model="processo">
              <option v-for="item in processi" :key="item.id" :value="item.id">
                {{ item.label }}
              </option>
            </select>
          </label>
          <label for="cava"
            >Cava V usata
            <select id="cava" v-model="cavaScelta">
              <option value="consigliata">Consigliata ({{ apertura.toFixed(1) }} mm)</option>
              <option v-for="opening in caveStandard" :key="opening" :value="String(opening)">
                {{ opening }} mm
              </option>
              <option value="custom">Personalizzata</option>
            </select>
          </label>
          <label v-if="cavaScelta === 'custom'" for="cava-custom"
            >Apertura mm<input
              id="cava-custom"
              v-model.number="cavaCustom"
              type="number"
              min="1"
              step="0.5"
          /></label>
          <label for="origine-raggio"
            >Origine del raggio
            <select id="origine-raggio" v-model="raggioOrigine">
              <option v-for="item in origini" :key="item.id" :value="item.id">
                {{ item.label }}
              </option>
            </select>
          </label>
          <label v-if="raggioOrigine === 'manual'" for="raggio"
            >Raggio interno mm<input
              id="raggio"
              v-model.number="raggio"
              type="number"
              min="0"
              step="0.1"
          /></label>
          <label v-else-if="raggioOrigine === 'measured'" for="raggio-misurato"
            >Raggio misurato mm<input
              id="raggio-misurato"
              type="number"
              min="0"
              step="0.1"
              :value="raggioMisurato ?? ''"
              @change="raggioMisurato = optionalNumber($event.target.value)"
          /></label>
          <label v-else-if="raggioOrigine === 'target'" for="raggio-target"
            >Raggio target mm<input
              id="raggio-target"
              type="number"
              min="0"
              step="0.1"
              :value="raggioTarget ?? ''"
              @change="raggioTarget = optionalNumber($event.target.value)"
          /></label>
          <template v-if="mode === 'esterne'">
            <label for="angolo"
              >Angolo °<input
                id="angolo"
                v-model.number="angolo"
                type="number"
                min="1"
                max="179"
                step="1"
            /></label>
            <label for="lato-a"
              >Lato A mm<input
                id="lato-a"
                v-model.number="latoA"
                type="number"
                min="0.1"
                step="0.1"
            /></label>
            <label for="lato-b"
              >Lato B mm<input
                id="lato-b"
                v-model.number="latoB"
                type="number"
                min="0.1"
                step="0.1"
            /></label>
          </template>
          <label for="fattore-k"
            >Fattore K<input
              id="fattore-k"
              v-model.number="fattoreK"
              type="number"
              min="0.2"
              max="0.5"
              step="0.01"
          /></label>
        </div>
        <div class="quick" aria-label="Spessori rapidi">
          <button
            v-for="value in [1, 1.5, 2, 3, 4, 5]"
            :key="value"
            type="button"
            class="btn btn-ghost btn-sm"
            :aria-pressed="spessore === value"
            @click="spessore = value"
          >
            {{ value }} mm
          </button>
        </div>

        <div v-if="mode === 'profilo'" class="profile-workspace">
          <SegmentsList
            v-model="segments"
            :larghezza-matrice="cavaUsata"
            @add="add"
            @remove="remove"
          />
          <PreviewCanvas
            v-if="sviluppoPronto"
            :segments="segments"
            :spessore="spessore"
            :raggio-piega="raggioSviluppo"
            :fattore-k="fattoreK"
            tipo-matrice="V"
            :larghezza-matrice="cavaUsata"
            tipo-cava="standard"
          />
          <p v-else class="section-note">{{ motivoIncompleto }}</p>
        </div>

        <div class="result-card">
          <div>
            <p>{{ mode === 'esterne' ? 'Lunghezza da tagliare' : 'Sviluppo' }}</p>
            <strong v-if="sviluppoPronto">{{ resultNumber.toFixed(3) }} mm</strong>
            <strong v-else>—</strong>
          </div>
          <div class="section-note">
            <p>Cava usata {{ cavaUsata.toFixed(1) }} mm</p>
            <p>Cava consigliata {{ apertura.toFixed(1) }} mm</p>
            <p v-if="sviluppoPronto">
              Raggio interno dello sviluppo {{ formatMm(raggioSviluppo) }} mm ·
              {{ originLabel(raggioOrigine) }}
            </p>
            <p v-else>{{ motivoIncompleto }}</p>
            <p v-if="raggioRisolto.assunzioneOperatore">{{ assunzione }}</p>
          </div>
        </div>
        <aside v-if="stima != null" class="estimate-card" :aria-label="stimaTitolo">
          <p>{{ stimaTitolo }}</p>
          <strong>{{ stima.toFixed(2) }} mm</strong>
          <p>{{ stimaTesto }}</p>
        </aside>
        <details v-if="sviluppoPronto" class="explain">
          <summary>Come l'ho calcolato</summary>
          <p>
            Metodo standard. Raggio interno dello sviluppo {{ formatMm(raggioSviluppo) }} mm,
            fattore K {{ fattoreK }}, spessore {{ spessore }} mm.
          </p>
          <p v-if="mode === 'esterne'">
            Bend deduction {{ external.bendDeduction.toFixed(3) }} mm, bend allowance
            {{ external.bendAllowance.toFixed(3) }} mm.
          </p>
          <p v-else>
            Sviluppo {{ profile.sviluppoTotale.toFixed(3) }} mm su lunghezza lineare
            {{ profile.lunghezzaLineare.toFixed(3) }} mm.
          </p>
          <ul v-if="archi.length" class="arc-lengths">
            <li v-for="(arco, index) in archi" :key="index">
              Piega {{ index + 1 }}, {{ arco.angolo }}°: arco interno
              {{ arco.interno.toFixed(3) }} mm, arco esterno {{ arco.esterno.toFixed(3) }} mm.
            </li>
          </ul>
        </details>
        <div v-if="shareUrl" class="share-row">
          <code>{{ shareUrl }}</code>
          <button type="button" class="btn btn-ghost btn-sm" @click="copyShare">
            {{ copied ? 'Copiato' : 'Copia link' }}
          </button>
        </div>
      </section>

      <aside class="project-panel">
        <template v-if="props.record">
          <h2>{{ cloud.projectName.value || 'Profilo' }}</h2>
          <p v-if="cloud.readOnlyMessage.value" class="section-note">
            {{ cloud.readOnlyMessage.value }}
          </p>
          <p v-else-if="cloud.label.value" class="section-note" role="status">
            {{ cloud.label.value }}
          </p>
          <p v-if="cloud.recovery.value" class="section-note">
            C’è una bozza locale più recente.
            <button type="button" class="btn btn-ghost btn-sm" @click="cloud.restoreRecovery()">
              Ripristina
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="cloud.discardRecovery()">
              Scarta
            </button>
          </p>
          <button type="button" class="btn btn-primary" @click="cloud.save()">Salva</button>
          <button type="button" class="btn btn-ghost" @click="cloud.askSaveAs()">
            Salva con nome
          </button>
        </template>
        <template v-else>
          <h2>Progetti</h2>
          <label for="cerca-progetto"
            >Cerca<input
              id="cerca-progetto"
              v-model="search"
              type="search"
              placeholder="Nome progetto"
          /></label>
          <p v-if="saveState" class="section-note" role="status">{{ saveState }}</p>
          <p v-if="!filtered.length" class="project-empty">
            Nessun progetto salvato in questo browser.
          </p>
          <ul v-else class="project-list">
            <li v-for="project in filtered" :key="project.nome + project.data">
              <div class="project-main">
                <input
                  v-if="editing === projectKey(project)"
                  v-model="draftName"
                  type="text"
                  @keydown.enter="commitRename(project)"
                  @blur="commitRename(project)"
                />
                <button v-else type="button" class="btn btn-ghost" @click="loadProject(project)">
                  {{ project.nome }}
                </button>
              </div>
              <span class="project-actions">
                <button type="button" class="btn btn-ghost btn-sm" @click="startRename(project)">
                  Rinomina
                </button>
                <button type="button" class="btn btn-ghost btn-sm" @click="removeProject(project)">
                  Elimina
                </button>
              </span>
            </li>
          </ul>
          <label for="nome-progetto"
            >Nome<input
              id="nome-progetto"
              v-model="projectName"
              type="text"
              placeholder="Nuovo progetto"
          /></label>
          <button type="button" class="btn btn-primary" @click="saveProject">Salva progetto</button>
          <button type="button" class="btn btn-ghost" @click="cloud.saveToAccount()">
            Salva nel tuo account
          </button>
          <p v-if="cloud.label.value" class="section-note" role="status">{{ cloud.label.value }}</p>
        </template>
      </aside>
    </div>

    <EditorDialog
      :open="cloud.nameOpen.value"
      title="Salva nel tuo account"
      title-id="account-save-title"
      @close="cloud.nameOpen.value = false"
    >
      <label class="technical-field"
        >Nome
        <input
          v-model="cloud.nameDraft.value"
          type="text"
          maxlength="120"
          @keydown.enter="cloud.confirmName()"
        />
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="cloud.nameOpen.value = false">
          Annulla
        </button>
        <button type="button" class="btn btn-primary" @click="cloud.confirmName()">Salva</button>
      </div>
    </EditorDialog>
    <EditorDialog
      :open="cloud.conflictOpen.value"
      title="Progetto modificato altrove"
      title-id="profile-conflict-title"
      @close="cloud.conflictOpen.value = false"
    >
      <p class="dialog-copy">Una versione più recente è già nel tuo account.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="cloud.reloadRemote()">Ricarica</button>
        <button type="button" class="btn btn-ghost" @click="cloud.saveCopy()">
          Salva come copia
        </button>
        <button type="button" class="btn btn-primary" @click="cloud.overwrite()">
          Sovrascrivi
        </button>
      </div>
    </EditorDialog>

    <details class="seo-calculator-section">
      <summary>Formule e limiti del calcolo</summary>
      <h2>Calcolo Sviluppo Lamiera: Piegatura, Bend Allowance e Bend Deduction</h2>
      <div class="seo-content-blocks">
        <div>
          <h3>Come Calcolare il Bend Allowance</h3>
          <p>
            Il bend allowance lamiera è la lunghezza aggiuntiva necessaria per ottenere l'angolo
            desiderato dopo la piegatura. La formula principale per il calcolo bend allowance è:
            <strong>BA = α × (R + K × T)</strong> dove α è l'angolo in radianti, R il raggio
            interno, K il fattore K e T lo spessore.
          </p>
        </div>
        <div>
          <h3>Bend Deduction Calculator Online</h3>
          <p>
            Il bend deduction rappresenta la differenza tra la lunghezza sviluppata e la lunghezza
            finale del pezzo piegato. Formula standard: <strong>BD = 2 × SB - BA</strong> dove SB è
            il setback calcolato come <strong>SB = (R + T) × tan(α/2)</strong>.
          </p>
        </div>
        <div>
          <h3>Calcolo Sviluppo Lamiera Professionale</h3>
          <p>
            Il calcolatore usa BA = α × (R + K × T), con α in radianti. Il fattore K è quello del
            materiale scelto. La cava V è un valore consigliato per lo spessore, non un programma
            macchina.
          </p>
        </div>
        <div>
          <h3>Fattore K per Materiali Lamiera</h3>
          <p>
            Il fattore K dipende dal materiale utilizzato e influenza direttamente il calcolo del
            bend allowance. Valori tipici: acciaio dolce K=0.33, alluminio K=0.40, acciaio inox
            K=0.38, rame K=0.45. Il mio strumento seleziona automaticamente il valore corretto per
            ogni materiale.
          </p>
        </div>
      </div>
      <router-link to="/bend-allowance">Bend allowance</router-link>
      <router-link to="/bend-deduction">Bend deduction</router-link>
      <router-link to="/">Torna alla Home</router-link>
    </details>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useHead } from '@unhead/vue';
import { materialsDatabase, resolveMaterial } from '@sviluppolamiera/bend-core';
import EditorDialog from '@/components/editor/EditorDialog.vue';
import PreviewCanvas from '@/components/calculator/PreviewCanvas.vue';
import SegmentsList from '@/components/calculator/SegmentsList.vue';
import { computeExternal, computeProfile } from '@/calculator/compute.js';
import { lunghezzeArco } from '@/calculator/profileGeometry.js';
import { decodeShare, readProjects, toolFromRecord, writeProjects } from '@/calculator/projects.js';
import { useCalculatorProject } from '@/composables/useCalculatorProject.js';
import {
  profileFingerprint,
  profileFromCalculator,
  profileFromLocal,
} from '@/persistence/profileAdapter.js';
import { addSegment, removeSegment } from '@/calculator/segments.js';
import {
  ASSUNZIONE,
  MOTIVI,
  ORIGINI,
  PROCESSI,
  STIMA_TITOLO,
  testoStimaEmpirica,
  cavaConsigliata,
  developmentRadius,
  optionalNumber,
  originLabel,
  processLabel,
  stimaEmpirica,
} from '@/calculator/toolSetup.js';
import '@/calculator/calculator.css';

const SITE_URL = 'https://www.sviluppolamiera.it';

useHead({
  title: 'Calcolatore sviluppo lamiera | Bend allowance',
  meta: [
    {
      name: 'description',
      content:
        'Calcola bend allowance e bend deduction da quote esterne o da un profilo. Fattore K del materiale e cava V consigliata.',
    },
    { property: 'og:title', content: 'Calcolatore sviluppo lamiera | Bend allowance' },
    {
      property: 'og:description',
      content: 'Calcola bend allowance e bend deduction. Il fattore K segue il materiale scelto.',
    },
    { property: 'og:url', content: `${SITE_URL}/calcolatore-sviluppo-lamiera` },
  ],
  link: [{ rel: 'canonical', href: `${SITE_URL}/calcolatore-sviluppo-lamiera` }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'SviluppoLamiera — calcolatore',
        description:
          'Calcola bend allowance e bend deduction da quote esterne o da un profilo a segmenti. Il fattore K è quello del materiale scelto.',
        url: `${SITE_URL}/calcolatore-sviluppo-lamiera`,
        applicationCategory: 'EngineeringApplication',
        operatingSystem: 'All',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      }),
    },
  ],
});

const props = defineProps({
  record: { type: Object, default: null },
});

const materials = materialsDatabase;
const processi = PROCESSI;
const origini = ORIGINI;
const assunzione = ASSUNZIONE;
const stimaTitolo = STIMA_TITOLO;
const stimaTesto = computed(() =>
  testoStimaEmpirica({
    cava: cavaUsata.value,
    spessore: spessore.value,
    processo: processo.value,
  })
);
const mode = ref('esterne');
const spessore = ref(2);
const larghezza = ref(100);
const raggio = ref(1);
const fattoreK = ref(0.33);
const materialId = ref('steel_mild');
const processo = ref('airBend');
const raggioPunzone = ref(null);
const raggioOrigine = ref('manual');
const raggioMisurato = ref(null);
const raggioTarget = ref(null);
const angolo = ref(90);
const latoA = ref(50);
const latoB = ref(50);
const segments = ref([
  { length: 50, angle: 0 },
  { length: 30, angle: 90 },
  { length: 40, angle: 45 },
]);
const projects = ref([]);
const search = ref('');
const projectName = ref('');
const shareUrl = ref('');
const copied = ref(false);
const saveState = ref('');
const editing = ref('');
const draftName = ref('');

const pageState = computed(() => ({
  raggio: raggio.value,
  raggioOrigine: raggioOrigine.value,
  raggioMisurato: raggioMisurato.value,
  raggioTarget: raggioTarget.value,
  raggioPunzone: raggioPunzone.value,
}));
const raggioRisolto = computed(() => developmentRadius(pageState.value));
const sviluppoPronto = computed(() => raggioRisolto.value.stato === 'resolved');
const raggioSviluppo = computed(() => raggioRisolto.value.raggioSviluppo);
const motivoIncompleto = computed(() => MOTIVI[raggioRisolto.value.motivo] || '');
const external = computed(() => {
  if (!sviluppoPronto.value) return null;
  return computeExternal({
    angolo: angolo.value,
    latoA: latoA.value,
    latoB: latoB.value,
    fattoreK: fattoreK.value,
    raggio: raggioSviluppo.value,
    spessore: spessore.value,
  });
});
const profile = computed(() => {
  if (!sviluppoPronto.value) return null;
  return computeProfile({
    segments: segments.value,
    spessore: spessore.value,
    raggio: raggioSviluppo.value,
    fattoreK: fattoreK.value,
  });
});
const resultNumber = computed(() => {
  if (!sviluppoPronto.value) return null;
  return mode.value === 'esterne'
    ? external.value.lunghezzaDaTagliare
    : profile.value.sviluppoTotale;
});
const caveStandard = [6, 8, 12, 16, 20, 24, 32, 40, 50, 60, 80, 100, 120, 140, 160];
const cavaScelta = ref('consigliata');
const cavaCustom = ref(16);
const apertura = computed(() => cavaConsigliata(spessore.value, processo.value, materialId.value));
const cavaUsata = computed(() => {
  if (cavaScelta.value === 'custom') {
    const custom = Number(cavaCustom.value);
    return custom > 0 ? custom : apertura.value;
  }
  if (cavaScelta.value === 'consigliata') return apertura.value;
  const chosen = Number(cavaScelta.value);
  return chosen > 0 ? chosen : apertura.value;
});
const stima = computed(() =>
  stimaEmpirica(spessore.value, cavaUsata.value, raggioPunzone.value, processo.value)
);
const archi = computed(() => {
  if (!sviluppoPronto.value) return [];
  if (mode.value === 'esterne') {
    const angoloPiega = Math.abs(Number(angolo.value) || 0);
    if (!angoloPiega) return [];
    const lengths = lunghezzeArco(angoloPiega, raggioSviluppo.value, spessore.value);
    return [{ angolo: angoloPiega, ...lengths }];
  }
  return segments.value.flatMap((segment, index) => {
    if (index === 0) return [];
    const angoloPiega = Math.abs(Number(segment.angle) || 0);
    if (!angoloPiega) return [];
    const lengths = lunghezzeArco(angoloPiega, raggioSviluppo.value, spessore.value);
    return [{ angolo: angoloPiega, ...lengths }];
  });
});
const filtered = computed(() =>
  projects.value.filter(project =>
    (project.nome || '').toLowerCase().includes(search.value.toLowerCase())
  )
);

function projectKey(project) {
  return `${project.nome}|${project.data || ''}`;
}

function add() {
  segments.value = addSegment(segments.value);
}

function remove(index) {
  segments.value = removeSegment(segments.value, index);
}

function applyMaterial() {
  const material = materials.find(item => item.id === materialId.value);
  if (material) fattoreK.value = material.bending.kFactor;
}

function refresh() {
  projects.value = readProjects();
}

function currentProfile() {
  return profileFromCalculator({
    spessore: spessore.value,
    raggioPiega: raggio.value,
    fattoreK: fattoreK.value,
    materialeSelezionato: materialId.value,
    segments: segments.value,
    modo: mode.value,
    angolo: angolo.value,
    latoA: latoA.value,
    latoB: latoB.value,
    larghezza: larghezza.value,
    processo: processo.value,
    cavaScelta: cavaScelta.value,
    cavaCustom: cavaCustom.value,
    raggioPunzone: raggioPunzone.value,
    raggioOrigine: raggioOrigine.value,
    raggioMisurato: raggioMisurato.value,
    raggioTarget: raggioTarget.value,
  });
}

function currentProject(nome) {
  return {
    nome,
    data: new Date().toISOString(),
    ...currentProfile(),
  };
}

function applyProfile(profile) {
  const next = profileFromLocal(profile);
  spessore.value = next.spessore ?? 2;
  larghezza.value = Number(next.larghezza) > 0 ? Number(next.larghezza) : 100;
  raggio.value = next.raggioPiega ?? 1;
  fattoreK.value = next.fattoreK ?? 0.33;
  materialId.value = next.materialeSelezionato || 'steel_mild';
  if (Array.isArray(next.segments) && next.segments.length) {
    segments.value = next.segments.map(segment => ({
      length: segment.length,
      angle: segment.angle,
    }));
    mode.value = next.modo === 'esterne' ? 'esterne' : 'profilo';
  }
  if (next.latoA) {
    latoA.value = next.latoA;
    latoB.value = next.latoB;
    angolo.value = next.angolo ?? 90;
    if (next.modo === 'esterne') mode.value = 'esterne';
  }
  applyTool(next);
}

const fingerprint = computed(() => profileFingerprint(currentProfile()));
const cloud = useCalculatorProject({
  fingerprint,
  readProfile: currentProfile,
  applyProfile,
  record: props.record,
});

function applyTool(record) {
  const tool = toolFromRecord(record);
  processo.value = tool.processo;
  cavaScelta.value = tool.cavaScelta;
  cavaCustom.value = tool.cavaCustom;
  raggioPunzone.value = tool.raggioPunzone;
  raggioOrigine.value = tool.raggioOrigine;
  raggioMisurato.value = tool.raggioMisurato;
  raggioTarget.value = tool.raggioTarget;
}

function formatMm(value) {
  return Number(value).toFixed(2);
}

function saveProject() {
  const name = projectName.value.trim();
  if (!name) {
    saveState.value = 'Indica un nome prima di salvare.';
    return;
  }
  const existing = readProjects();
  const replaced = existing.some(project => project.nome === name);
  writeProjects([...existing.filter(project => project.nome !== name), currentProject(name)]);
  refresh();
  saveState.value = replaced
    ? `Progetto “${name}” aggiornato in questo browser.`
    : `Progetto “${name}” salvato in questo browser.`;
}

function loadProject(project) {
  applyProfile(profileFromLocal(project));
}

function startRename(project) {
  editing.value = projectKey(project);
  draftName.value = project.nome;
}

function commitRename(project) {
  const name = draftName.value.trim();
  editing.value = '';
  if (!name || name === project.nome) return;
  const next = readProjects();
  const stored = next.find(item => item.nome === project.nome && item.data === project.data);
  if (stored) stored.nome = name;
  writeProjects(next);
  refresh();
}

function removeProject(project) {
  writeProjects(
    readProjects().filter(item => !(item.nome === project.nome && item.data === project.data))
  );
  refresh();
}

function payload() {
  return {
    v: 3,
    t: spessore.value,
    w: larghezza.value,
    mat: materialId.value,
    r: raggio.value,
    k: fattoreK.value,
    m: 'standard',
    s: segments.value.map(segment => [segment.length, segment.angle]),
    la: latoA.value,
    lb: latoB.value,
    an: angolo.value,
    modo: mode.value,
    processo: processo.value,
    cavaScelta: cavaScelta.value,
    cavaCustom: cavaCustom.value,
    raggioPunzone: raggioPunzone.value,
    raggioOrigine: raggioOrigine.value,
    raggioMisurato: raggioMisurato.value,
    raggioTarget: raggioTarget.value,
  };
}

function share() {
  copied.value = false;
  shareUrl.value = `${window.location.origin}${window.location.pathname}?share=${btoa(JSON.stringify(payload()))}`;
}

async function copyShare() {
  if (!shareUrl.value) return;
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
  } catch {
    copied.value = false;
  }
}

function exportMeta() {
  return {
    raggioSviluppo: raggioSviluppo.value,
    raggioPunzone: raggioPunzone.value,
    cavaUsata: cavaUsata.value,
    processo: processLabel(processo.value),
    origineRaggio: originLabel(raggioOrigine.value),
  };
}

async function exportPdf() {
  if (!sviluppoPronto.value) return;
  const { esportaPDF } = await import('@/utils/exporters.js');
  esportaPDF({
    spessore: spessore.value,
    raggioPiega: raggioSviluppo.value,
    fattoreK: fattoreK.value,
    materiale: resolveMaterial(materialId.value).name,
    ...exportMeta(),
    sviluppoTotale: resultNumber.value,
    segments:
      mode.value === 'profilo'
        ? segments.value
        : [
            { length: latoA.value, angle: 0 },
            { length: latoB.value, angle: angolo.value },
          ],
    dettagli:
      mode.value === 'esterne'
        ? [
            {
              segmento: 1,
              bendAllowance: external.value.bendAllowance,
              setback: external.value.setback,
              bendDeduction: external.value.bendDeduction,
            },
          ]
        : profile.value.dettagli,
    unitLabel: 'mm',
  });
}

async function exportDxf() {
  if (!sviluppoPronto.value) return;
  const { esportaDXF } = await import('@/utils/exporters.js');
  esportaDXF({
    spessore: spessore.value,
    raggioPiega: raggioSviluppo.value,
    fattoreK: fattoreK.value,
    larghezza: larghezza.value,
    materiale: resolveMaterial(materialId.value).name,
    sviluppoTotale: resultNumber.value,
    segments:
      mode.value === 'profilo'
        ? segments.value
        : [
            { length: latoA.value, angle: 0 },
            { length: latoB.value, angle: angolo.value },
          ],
    dettagli: [],
    unitLabel: 'mm',
  });
}

function onCalcKey(event) {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
  if (!document.querySelector('.calc-page')) return;
  event.preventDefault();
  if (event.shiftKey) cloud.askSaveAs();
  else if (props.record) void cloud.save();
  else void cloud.saveToAccount();
}

onMounted(async () => {
  window.addEventListener('beforeunload', cloud.beforeUnload);
  window.addEventListener('keydown', onCalcKey);
  const draft = await cloud.pendingDraft();
  if (props.record?.kind === 'profile' || draft?.intent === 'save') {
    await cloud.resumeDraft();
    return;
  }
  refresh();
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('share');
  if (encoded) {
    try {
      const shared = decodeShare(encoded);
      const raw = JSON.parse(atob(encoded));
      if (shared) {
        spessore.value = shared.spessore;
        if (Number(shared.larghezza) > 0) larghezza.value = shared.larghezza;
        raggio.value = shared.raggioPiega;
        fattoreK.value = shared.fattoreK;
        if (shared.materialId) materialId.value = shared.materialId;
        if (shared.segments.length) segments.value = shared.segments;
        mode.value = shared.modo === 'esterne' || raw.modo === 'esterne' ? 'esterne' : 'profilo';
        if (mode.value === 'esterne') {
          latoA.value = shared.latoA ?? raw.la ?? latoA.value;
          latoB.value = shared.latoB ?? raw.lb ?? latoB.value;
          angolo.value = shared.angolo ?? raw.an ?? angolo.value;
        }
        applyTool(raw.v === 3 ? shared : {});
      }
    } catch {
      shareUrl.value = '';
    }
  }
  const requested = params.get('progetto');
  if (!encoded && requested) {
    const found = readProjects().find(project => project.nome === requested);
    if (found) loadProject(found);
  }
  if (draft) await cloud.resumeDraft();
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', cloud.beforeUnload);
  window.removeEventListener('keydown', onCalcKey);
});
</script>

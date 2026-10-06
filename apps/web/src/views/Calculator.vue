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
        <button type="button" class="btn btn-ghost" @click="exportDxf">Esporta DXF</button>
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
          <label for="raggio"
            >Raggio interno mm<input
              id="raggio"
              v-model.number="raggio"
              type="number"
              min="0"
              step="0.1"
          /></label>
          <label for="materiale">
            Materiale
            <select id="materiale" v-model="materialId" @change="applyMaterial">
              <option v-for="item in materials" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </label>
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
          <label for="cava"
            >Cava V
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
            :segments="segments"
            :spessore="spessore"
            :raggio-piega="raggio"
            :fattore-k="fattoreK"
            tipo-matrice="V"
            :larghezza-matrice="cavaUsata"
            tipo-cava="standard"
          />
        </div>

        <div class="result-card">
          <div>
            <p>{{ mode === 'esterne' ? 'Lunghezza da tagliare' : 'Sviluppo' }}</p>
            <strong>{{ resultNumber.toFixed(3) }} mm</strong>
          </div>
          <p class="section-note">
            Cava V {{ cavaUsata.toFixed(1) }} mm
            <template v-if="Math.abs(cavaUsata - apertura) > 0.05">
              · consigliata {{ apertura.toFixed(1) }} mm
            </template>
          </p>
        </div>
        <details class="explain">
          <summary>Come l'ho calcolato</summary>
          <p>
            Metodo standard. Raggio interno {{ raggio }} mm, fattore K {{ fattoreK }}, spessore
            {{ spessore }} mm.
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
      </aside>
    </div>

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
import { computed, onMounted, ref } from 'vue';
import { useHead } from '@unhead/vue';
import {
  calcolaAperturaMatrice,
  materialsDatabase,
  resolveMaterial,
} from '@sviluppolamiera/bend-core';
import PreviewCanvas from '@/components/calculator/PreviewCanvas.vue';
import SegmentsList from '@/components/calculator/SegmentsList.vue';
import { computeExternal, computeProfile } from '@/calculator/compute.js';
import { lunghezzeArco } from '@/calculator/profileGeometry.js';
import { decodeShare, readProjects, writeProjects } from '@/calculator/projects.js';
import { addSegment, removeSegment } from '@/calculator/segments.js';
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

const materials = materialsDatabase;
const mode = ref('esterne');
const spessore = ref(2);
const raggio = ref(1);
const fattoreK = ref(0.33);
const materialId = ref('steel_mild');
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

const external = computed(() =>
  computeExternal({
    angolo: angolo.value,
    latoA: latoA.value,
    latoB: latoB.value,
    fattoreK: fattoreK.value,
    raggio: raggio.value,
    spessore: spessore.value,
  })
);
const profile = computed(() =>
  computeProfile({
    segments: segments.value,
    spessore: spessore.value,
    raggio: raggio.value,
    fattoreK: fattoreK.value,
  })
);
const resultNumber = computed(() =>
  mode.value === 'esterne' ? external.value.lunghezzaDaTagliare : profile.value.sviluppoTotale
);
const caveStandard = [6, 8, 12, 16, 20, 24, 32, 40, 50, 60, 80, 100, 120, 140, 160];
const cavaScelta = ref('consigliata');
const cavaCustom = ref(16);
const apertura = computed(
  () => calcolaAperturaMatrice(spessore.value || 0, 'airBend', 'acciaio').aperturaOttimale
);
const cavaUsata = computed(() => {
  if (cavaScelta.value === 'custom') {
    const custom = Number(cavaCustom.value);
    return custom > 0 ? custom : apertura.value;
  }
  if (cavaScelta.value === 'consigliata') return apertura.value;
  const chosen = Number(cavaScelta.value);
  return chosen > 0 ? chosen : apertura.value;
});
const archi = computed(() => {
  if (mode.value === 'esterne') {
    const angoloPiega = Math.abs(Number(angolo.value) || 0);
    if (!angoloPiega) return [];
    const lengths = lunghezzeArco(angoloPiega, raggio.value, spessore.value);
    return [{ angolo: angoloPiega, ...lengths }];
  }
  return segments.value.flatMap((segment, index) => {
    if (index === 0) return [];
    const angoloPiega = Math.abs(Number(segment.angle) || 0);
    if (!angoloPiega) return [];
    const lengths = lunghezzeArco(angoloPiega, raggio.value, spessore.value);
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

function currentProject(nome) {
  return {
    nome,
    data: new Date().toISOString(),
    spessore: spessore.value,
    raggioPiega: raggio.value,
    fattoreK: fattoreK.value,
    materialeSelezionato: materialId.value,
    metodoDiCalcolo: 'standard',
    segments: segments.value,
    modo: mode.value,
    angolo: angolo.value,
    latoA: latoA.value,
    latoB: latoB.value,
  };
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
  spessore.value = project.spessore ?? 2;
  raggio.value = project.raggioPiega ?? 1;
  fattoreK.value = project.fattoreK ?? 0.33;
  materialId.value = project.materialeSelezionato || 'steel_mild';
  if (Array.isArray(project.segments) && project.segments.length) {
    segments.value = project.segments.map(segment => ({
      length: segment.length,
      angle: segment.angle,
    }));
    mode.value = project.modo === 'esterne' ? 'esterne' : 'profilo';
  }
  if (project.latoA) {
    latoA.value = project.latoA;
    latoB.value = project.latoB;
    angolo.value = project.angolo ?? 90;
    if (project.modo === 'esterne') mode.value = 'esterne';
  }
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
    v: 2,
    t: spessore.value,
    mat: materialId.value,
    r: raggio.value,
    k: fattoreK.value,
    m: 'standard',
    s: segments.value.map(segment => [segment.length, segment.angle]),
    la: latoA.value,
    lb: latoB.value,
    an: angolo.value,
    modo: mode.value,
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

async function exportPdf() {
  const { esportaPDF } = await import('@/utils/exporters.js');
  esportaPDF({
    spessore: spessore.value,
    raggioPiega: raggio.value,
    fattoreK: fattoreK.value,
    materiale: resolveMaterial(materialId.value).name,
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
  const { esportaDXF } = await import('@/utils/exporters.js');
  esportaDXF({
    spessore: spessore.value,
    raggioPiega: raggio.value,
    fattoreK: fattoreK.value,
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

onMounted(() => {
  refresh();
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('share');
  if (encoded) {
    try {
      const shared = decodeShare(encoded);
      const raw = JSON.parse(atob(encoded));
      if (shared) {
        spessore.value = shared.spessore;
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
});
</script>

<template>
  <div class="work-home">
    <section class="work-hero">
      <div>
        <p class="page-kicker">SviluppoLamiera</p>
        <h1>Lavori di piegatura</h1>
        <p>
          Apri uno sviluppo DXF oppure calcola la lunghezza da tagliare. I progetti restano in
          questo browser.
        </p>
      </div>
      <div class="work-actions">
        <router-link to="/editor" class="btn btn-primary">Apri DXF</router-link>
        <router-link to="/calcolatore-sviluppo-lamiera" class="btn btn-ghost"
          >Nuovo calcolo</router-link
        >
        <router-link to="/guida-materiali" class="btn btn-ghost">Materiali</router-link>
      </div>
    </section>

    <section class="work-grid">
      <article>
        <h2>Editor DXF</h2>
        <p>Dimensioni, pieghe, fori, spessore, materiale e modifica di una quota sullo sviluppo.</p>
        <router-link to="/editor">Apri l'editor</router-link>
      </article>
      <article>
        <h2>Calcolatore</h2>
        <p>Quote esterne o profilo a segmenti, con fattore K del materiale e cava V consigliata.</p>
        <router-link to="/calcolatore-sviluppo-lamiera">Apri il calcolatore</router-link>
      </article>
      <article>
        <h2>Ultimi calcoli</h2>
        <p v-if="!recent.length">Nessun progetto salvato in questo browser.</p>
        <ul v-else>
          <li v-for="project in recent" :key="project.nome + project.data">
            <router-link
              :to="`/calcolatore-sviluppo-lamiera?progetto=${encodeURIComponent(project.nome)}`"
            >
              {{ project.nome }}
            </router-link>
            <span>{{ project.spessore || '—' }} mm</span>
          </li>
        </ul>
      </article>
    </section>

    <details class="work-reference">
      <summary>Formule e riferimenti</summary>
      <div class="reference-links">
        <router-link to="/bend-allowance">Bend allowance</router-link>
        <router-link to="/bend-deduction">Bend deduction</router-link>
        <router-link to="/fattore-k">Fattore K</router-link>
        <router-link to="/cava-v-pressopiegatrice">Cava V</router-link>
        <router-link to="/ritorno-elastico">Ritorno elastico</router-link>
        <router-link to="/modifica-sviluppo-dxf">Modifica DXF</router-link>
      </div>
      <div class="reference-copy">
        <h2>Calcolo sviluppo lamiera e bend allowance</h2>
        <p>
          Il calcolatore determina lo sviluppo con il bend allowance: BA = α × (R + K × T), dove α è
          l'angolo di piega in radianti, R il raggio interno, K il fattore K e T lo spessore. Il
          fattore K è quello del materiale selezionato.
        </p>
        <p>
          Il bend deduction è la differenza usata con le quote esterne:
          <strong>Bend Deduction = 2 × Setback − Bend Allowance</strong>. Lo sviluppo da tagliare è
          la somma dei lati meno questa deduzione.
        </p>
        <p>
          Il setback è <strong>Setback = (R + T) × tan(α/2)</strong>. La cava V mostrata è un valore
          consigliato per lo spessore, non un programma della pressa. Il ritorno elastico è in
          tabella e non viene sottratto in automatico.
        </p>
      </div>
    </details>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useHead } from '@unhead/vue';
import { readProjects } from '@/calculator/projects.js';

const SITE_URL = 'https://www.sviluppolamiera.it';

export default {
  name: 'Home',
  setup() {
    useHead({
      title: 'Sviluppo lamiera: calcolatore di piega e DXF',
      meta: [
        {
          name: 'description',
          content:
            'Calcola bend allowance e bend deduction, consulta il fattore K dei materiali e modifica uno sviluppo DXF. Gratuito, nel browser.',
        },
        { property: 'og:title', content: 'Sviluppo lamiera: calcolatore di piega e DXF' },
        {
          property: 'og:description',
          content:
            'Bend allowance, bend deduction, fattore K e modifica di uno sviluppo DXF. SviluppoLamiera è gratuito e funziona nel browser.',
        },
        { property: 'og:url', content: `${SITE_URL}/` },
      ],
      link: [{ rel: 'canonical', href: `${SITE_URL}/` }],
    });

    const recent = ref([]);
    onMounted(() => {
      recent.value = readProjects().slice().reverse().slice(0, 5);
    });
    return { recent };
  },
};
</script>

<style scoped>
.work-home {
  width: min(1100px, calc(100% - 32px));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-hero,
.work-grid article,
.work-reference {
  background: white;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 16px;
}

.work-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-end;
}

.work-hero h1,
.work-grid h2 {
  margin: 0;
  color: var(--ink);
}

.work-hero p,
.work-grid p {
  margin: 8px 0 0;
  color: var(--gray-600);
}

.work-actions,
.reference-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.work-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.1fr 0.9fr;
  gap: 16px;
}

.work-grid a,
.reference-links a,
.reference-copy a {
  color: var(--primary-800);
  font-weight: 600;
  text-decoration: none;
}

.work-grid ul {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
}

.work-grid li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
  font-size: 14px;
}

.work-reference summary {
  cursor: pointer;
  font-weight: 700;
}

.reference-links {
  margin-top: 12px;
}

.reference-copy {
  margin-top: 16px;
  color: var(--gray-700);
}

.reference-copy h2 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

@media (max-width: 900px) {
  .work-hero,
  .work-grid {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

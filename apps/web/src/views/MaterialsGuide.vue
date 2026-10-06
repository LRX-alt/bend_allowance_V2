<template>
  <div class="materials-page">
    <header>
      <p class="page-kicker">Riferimento</p>
      <h1>Guida ai materiali</h1>
      <p>
        Il fattore K è la posizione dell'asse neutro, come frazione dello spessore misurata dalla
        faccia interna. Il calcolatore usa questo valore nello sviluppo. Il ritorno elastico è la
        percentuale indicativa di apertura dopo la piega: la tabella lo mostra, lo sviluppo non lo
        sottrae da solo.
      </p>
    </header>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Materiale</th>
            <th>Fattore K</th>
            <th>Ritorno elastico</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in materials" :key="item.id">
            <td>{{ item.name }}</td>
            <td class="tech-num">{{ item.bending.kFactor }}</td>
            <td class="tech-num">{{ Math.round(item.bending.springback * 100) }}%</td>
            <td>{{ item.notes }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav>
      <router-link to="/calcolatore-sviluppo-lamiera">Apri il calcolatore</router-link>
      <router-link to="/fattore-k">Come si legge il fattore K</router-link>
    </nav>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { materialsDatabase } from '@sviluppolamiera/bend-core';

const SITE_URL = 'https://www.sviluppolamiera.it';

useHead({
  title: 'Fattore K dei materiali | SviluppoLamiera',
  meta: [
    {
      name: 'description',
      content:
        'Tabella del fattore K e del ritorno elastico per acciaio, alluminio, inox, rame, ottone e titanio usati dal calcolatore.',
    },
    { property: 'og:title', content: 'Fattore K dei materiali | SviluppoLamiera' },
    {
      property: 'og:description',
      content:
        'Fattore K usato nello sviluppo e ritorno elastico indicato, non applicato in automatico.',
    },
    { property: 'og:url', content: `${SITE_URL}/guida-materiali` },
  ],
  link: [{ rel: 'canonical', href: `${SITE_URL}/guida-materiali` }],
});

const materials = materialsDatabase;
</script>

<style scoped>
.materials-page {
  width: min(1100px, calc(100% - 32px));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.materials-page header,
.table-container {
  background: white;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.materials-page header {
  padding: 16px;
}

.materials-page h1 {
  margin: 0;
}

.materials-page p {
  margin: 8px 0 0;
  max-width: 72ch;
  color: var(--gray-700);
}

.materials-page nav {
  display: flex;
  gap: 16px;
}

.materials-page a {
  color: var(--primary-800);
  font-weight: 600;
  text-decoration: none;
}
</style>

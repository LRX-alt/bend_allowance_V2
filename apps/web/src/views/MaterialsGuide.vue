<template>
  <div class="materials-page">
    <h1>Guida ai materiali</h1>
    <p>
      Il fattore K è la posizione dell'asse neutro, come frazione dello spessore misurata dalla
      faccia interna. Il calcolatore usa questo valore nello sviluppo. Il ritorno elastico è la
      percentuale indicativa di apertura dopo la piega: la tabella lo mostra, lo sviluppo non lo
      sottrae da solo.
    </p>
    <table>
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
          <td>{{ item.bending.kFactor }}</td>
          <td>{{ Math.round(item.bending.springback * 100) }}%</td>
          <td>{{ item.notes }}</td>
        </tr>
      </tbody>
    </table>
    <router-link to="/calcolatore-sviluppo-lamiera">Torna al calcolatore</router-link>
    <router-link to="/fattore-k">Come si legge il fattore K</router-link>
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
  padding: 24px;
  max-width: 960px;
}
.materials-page a {
  margin-right: 16px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
td,
th {
  border-bottom: 1px solid #d7dee8;
  text-align: left;
  padding: 8px;
}
</style>

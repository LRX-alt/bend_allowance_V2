<template>
  <article class="tech-article">
    <h1>Ritorno elastico</h1>
    <p class="direct-answer">
      Il ritorno elastico è l'angolo che la lamiera riapre quando il punzone sale. Nella guida
      materiali è una percentuale per lega. Per l'acciaio dolce in piega in aria la tabella indica
      4%. Lo sviluppo calcolato con il fattore K non sottrae questa percentuale: restano due conti
      distinti.
    </p>
    <h2>Cosa entra nello sviluppo</h2>
    <p>
      Lo sviluppo da 96,608 mm dell'esempio (lati 50 e 50, piega 90°, spessore 2 mm, raggio 1 mm, K
      0,33) è la lunghezza piana prima della piega. Il 4% di ritorno elastico dice quanto la piega
      tende a riaprirsi, non quanti millimetri togliere allo sviluppo.
    </p>
    <table>
      <thead>
        <tr>
          <th>Dato in tabella</th>
          <th>Acciaio dolce S235</th>
          <th>Effetto sullo sviluppo del calcolatore</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Fattore K</td>
          <td>0,33</td>
          <td>Entra in BA = α × (R + K × T)</td>
        </tr>
        <tr>
          <td>Ritorno elastico, piega in aria</td>
          <td>4%</td>
          <td>Nessuno: è solo indicato</td>
        </tr>
      </tbody>
    </table>
    <h2>Domande</h2>
    <h3>Devo piegare oltre i 90° per restare a 90°?</h3>
    <p>
      Spesso sì, in piega in aria. La sovra-piega dipende da materiale, spessore, cava e macchina.
      La percentuale in tabella è un ordine di grandezza, da confermare con un campione sulla tua
      pressa.
    </p>
    <h3>Perché il pezzo torna lungo anche con il K giusto?</h3>
    <p>
      Il fattore K sistema la lunghezza sviluppata. Il ritorno elastico sistema l'angolo dopo il
      rilascio. Un pezzo lungo e un pezzo aperto non hanno la stessa causa.
    </p>
    <nav aria-label="Pagine collegate">
      <router-link to="/fattore-k">Fattore K</router-link>
      <router-link to="/guida-materiali">Guida ai materiali</router-link>
      <router-link to="/cava-v-pressopiegatrice">Cava V</router-link>
    </nav>
  </article>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { techArticleHead } from '@/seo/techArticle.js';

const faqs = [
  {
    q: 'Devo piegare oltre i 90° per restare a 90°?',
    a: 'Spesso sì, in piega in aria. La sovra-piega dipende da materiale, spessore, cava e macchina. La percentuale in tabella è un ordine di grandezza, da confermare con un campione sulla tua pressa.',
  },
  {
    q: 'Perché il pezzo torna lungo anche con il K giusto?',
    a: "Il fattore K sistema la lunghezza sviluppata. Il ritorno elastico sistema l'angolo dopo il rilascio. Un pezzo lungo e un pezzo aperto non hanno la stessa causa.",
  },
];

useHead(
  techArticleHead({
    path: '/ritorno-elastico',
    title: 'Ritorno elastico in piegatura | SviluppoLamiera',
    description:
      "Il ritorno elastico è l'angolo che la lamiera riapre. Per l'acciaio dolce la tabella indica 4% in piega in aria e non lo sottrae allo sviluppo.",
    headline: 'Ritorno elastico',
    faqs,
  })
);
</script>

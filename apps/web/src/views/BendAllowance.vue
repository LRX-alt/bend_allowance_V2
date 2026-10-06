<template>
  <article class="tech-article">
    <h1>Bend allowance</h1>
    <p class="direct-answer">
      Il bend allowance è la lunghezza dell'arco sulla fibra neutra, dentro la piega. Si somma ai
      tratti rettilinei misurati fino alle tangenze. Con angolo 90°, spessore 2 mm, raggio interno 1
      mm e fattore K 0,33 vale 2,608 mm.
    </p>
    <h2>Formula</h2>
    <p>
      BA = α × (R + K × T). α è l'angolo di piega in radianti, R il raggio interno, K il fattore K,
      T lo spessore.
    </p>
    <h2>Esempio</h2>
    <p>
      90° sono π/2 radianti. R + K × T = 1 + 0,33 × 2 = 1,66 mm. BA = (π/2) × 1,66 = 2,608 mm. Gli
      stessi dati nel calcolatore danno uno sviluppo di 96,608 mm sui lati esterni da 50 mm e 50 mm,
      perché lì si usa il bend deduction.
    </p>
    <table>
      <thead>
        <tr>
          <th>Dato</th>
          <th>Valore</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Angolo di piega</td>
          <td>90°</td>
        </tr>
        <tr>
          <td>Spessore T</td>
          <td>2 mm</td>
        </tr>
        <tr>
          <td>Raggio interno R</td>
          <td>1 mm</td>
        </tr>
        <tr>
          <td>Fattore K</td>
          <td>0,33</td>
        </tr>
        <tr>
          <td>Bend allowance</td>
          <td>2,608 mm</td>
        </tr>
      </tbody>
    </table>
    <h2>Domande</h2>
    <h3>Il bend allowance è la lunghezza da tagliare?</h3>
    <p>
      No da solo. È solo l'arco della piega. Lo sviluppo completo somma i tratti piani e questo
      arco, oppure parte dalle quote esterne e sottrae il bend deduction.
    </p>
    <h3>Quale fattore K usa SviluppoLamiera?</h3>
    <p>
      Quello del materiale scelto nel calcolatore. Per l'acciaio dolce S235 il valore in tabella è
      0,33. Il calcolatore visibile non ricava il K dal rapporto raggio/spessore.
    </p>
    <nav aria-label="Pagine collegate">
      <router-link to="/bend-deduction">Bend deduction</router-link>
      <router-link to="/fattore-k">Fattore K</router-link>
      <router-link to="/calcolatore-sviluppo-lamiera">Apri il calcolatore</router-link>
    </nav>
  </article>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { techArticleHead } from '@/seo/techArticle.js';

const faqs = [
  {
    q: 'Il bend allowance è la lunghezza da tagliare?',
    a: "No da solo. È solo l'arco della piega. Lo sviluppo completo somma i tratti piani e questo arco, oppure parte dalle quote esterne e sottrae il bend deduction.",
  },
  {
    q: 'Quale fattore K usa SviluppoLamiera?',
    a: "Quello del materiale scelto nel calcolatore. Per l'acciaio dolce S235 il valore in tabella è 0,33. Il calcolatore visibile non ricava il K dal rapporto raggio/spessore.",
  },
];

useHead(
  techArticleHead({
    path: '/bend-allowance',
    title: 'Bend allowance: formula e esempio | SviluppoLamiera',
    description:
      "Il bend allowance è l'arco sulla fibra neutra. Formula BA = α × (R + K × T) ed esempio da 2,608 mm.",
    headline: 'Bend allowance',
    faqs,
  })
);
</script>

<template>
  <article class="tech-article">
    <h1>Bend deduction</h1>
    <p class="direct-answer">
      Il bend deduction è quanto si sottrae alla somma delle quote esterne per ottenere lo sviluppo.
      Con lati 50 mm e 50 mm, piega a 90°, spessore 2 mm, raggio interno 1 mm e K 0,33 vale 3,392
      mm. Lo sviluppo da tagliare è 96,608 mm.
    </p>
    <h2>Formula</h2>
    <p>
      Setback = (R + T) × tan(α / 2). Bend deduction = 2 × setback − bend allowance. Sviluppo = A +
      B − bend deduction, con A e B quote esterne fino allo spigolo teorico.
    </p>
    <h2>Esempio</h2>
    <p>
      A 90° la tangente di metà angolo è 1, quindi il setback è 1 + 2 = 3 mm. Due setback fanno 6
      mm. Il bend allowance degli stessi dati è 2,608 mm. Deduzione = 6 − 2,608 = 3,392 mm. Sviluppo
      = 50 + 50 − 3,392 = 96,608 mm. È il risultato del calcolatore in modalità quote esterne.
    </p>
    <table>
      <thead>
        <tr>
          <th>Grandezza</th>
          <th>Valore</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Quote esterne A e B</td>
          <td>50 mm + 50 mm</td>
        </tr>
        <tr>
          <td>Setback</td>
          <td>3 mm</td>
        </tr>
        <tr>
          <td>Bend allowance</td>
          <td>2,608 mm</td>
        </tr>
        <tr>
          <td>Bend deduction</td>
          <td>3,392 mm</td>
        </tr>
        <tr>
          <td>Sviluppo</td>
          <td>96,608 mm</td>
        </tr>
      </tbody>
    </table>
    <h2>Domande</h2>
    <h3>Bend allowance e bend deduction sono la stessa cosa?</h3>
    <p>
      Descrivono la stessa piega con due riferimenti. Il bend allowance si somma ai tratti fino alle
      tangenze. Il bend deduction si sottrae alle quote esterne. Sommare l'uno e sottrarre l'altro
      nello stesso conto allunga o accorcia il pezzo due volte.
    </p>
    <h3>Perché lo sviluppo è più corto della somma dei lati?</h3>
    <p>
      Le quote esterne includono lo spigolo teorico, che nel pezzo piegato non esiste come
      materiale. La deduzione toglie quella sovrapposizione e lascia l'arco reale della fibra
      neutra.
    </p>
    <nav aria-label="Pagine collegate">
      <router-link to="/bend-allowance">Bend allowance</router-link>
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
    q: 'Bend allowance e bend deduction sono la stessa cosa?',
    a: "Descrivono la stessa piega con due riferimenti. Il bend allowance si somma ai tratti fino alle tangenze. Il bend deduction si sottrae alle quote esterne. Sommare l'uno e sottrarre l'altro nello stesso conto allunga o accorcia il pezzo due volte.",
  },
  {
    q: 'Perché lo sviluppo è più corto della somma dei lati?',
    a: "Le quote esterne includono lo spigolo teorico, che nel pezzo piegato non esiste come materiale. La deduzione toglie quella sovrapposizione e lascia l'arco reale della fibra neutra.",
  },
];

useHead(
  techArticleHead({
    path: '/bend-deduction',
    title: 'Bend deduction: formula e sviluppo | SviluppoLamiera',
    description:
      'Il bend deduction si sottrae alle quote esterne. Esempio: 3,392 mm e sviluppo 96,608 mm.',
    headline: 'Bend deduction',
    faqs,
  })
);
</script>

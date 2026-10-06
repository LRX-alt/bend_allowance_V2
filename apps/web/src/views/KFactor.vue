<template>
  <article class="tech-article">
    <h1>Fattore K</h1>
    <p class="direct-answer">
      Il fattore K indica dove sta la fibra neutra, come frazione dello spessore misurata dalla
      faccia interna. K = 0,33 significa che la fibra che non si allunga né si accorcia sta a un
      terzo dello spessore, verso l'interno. SviluppoLamiera legge questo numero dalla tabella
      materiali e lo inserisce in BA = α × (R + K × T).
    </p>
    <h2>Nel calcolatore</h2>
    <p>
      L'acciaio dolce S235 è a 0,33. Con spessore 2 mm e raggio interno 1 mm, una piega a 90° ha
      bend allowance 2,608 mm. Cambiare materiale cambia il K e quindi lo sviluppo. Il ritorno
      elastico della stessa tabella non entra in questa formula.
    </p>
    <h2>DIN 6935 nel motore</h2>
    <p>
      Il motore contiene un metodo alternativo, chiamato DIN 6935, che con raggio interno fino a
      cinque volte lo spessore calcola il bend allowance come α × (R + 0,65 × T). La pagina del
      calcolatore non usa questo metodo: usa il K del materiale. I due risultati, sullo stesso
      pezzo, non coincidono.
    </p>
    <table>
      <thead>
        <tr>
          <th>Metodo</th>
          <th>Cosa entra nella formula</th>
          <th>Bend allowance dell'esempio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Calcolatore, K del materiale</td>
          <td>K = 0,33</td>
          <td>2,608 mm</td>
        </tr>
        <tr>
          <td>Metodo DIN 6935 del motore, non mostrato nel calcolatore</td>
          <td>0,65 × T al posto di K × T</td>
          <td>α × (1 + 0,65 × 2) = 3,613 mm</td>
        </tr>
      </tbody>
    </table>
    <h2>Domande</h2>
    <h3>Posso sovrascrivere il fattore K?</h3>
    <p>
      Sì. Nel calcolatore il campo Fattore K parte dal materiale e si può correggere. Il valore
      corretto per la tua pressa è quello ricavato da una piega di prova, non il numero di partenza.
    </p>
    <h3>Dove vedo i K degli altri materiali?</h3>
    <p>Nella guida ai materiali, la stessa tabella letta dal calcolatore.</p>
    <nav aria-label="Pagine collegate">
      <router-link to="/guida-materiali">Guida ai materiali</router-link>
      <router-link to="/bend-allowance">Bend allowance</router-link>
      <router-link to="/ritorno-elastico">Ritorno elastico</router-link>
    </nav>
  </article>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { techArticleHead } from '@/seo/techArticle.js';

const faqs = [
  {
    q: 'Posso sovrascrivere il fattore K?',
    a: 'Sì. Nel calcolatore il campo Fattore K parte dal materiale e si può correggere. Il valore corretto per la tua pressa è quello ricavato da una piega di prova, non il numero di partenza.',
  },
  {
    q: 'Dove vedo i K degli altri materiali?',
    a: 'Nella guida ai materiali, la stessa tabella letta dal calcolatore.',
  },
];

useHead(
  techArticleHead({
    path: '/fattore-k',
    title: 'Fattore K lamiera | SviluppoLamiera',
    description:
      "Il fattore K è la posizione della fibra neutra. Il calcolatore usa il K del materiale, per l'acciaio dolce 0,33.",
    headline: 'Fattore K',
    faqs,
  })
);
</script>

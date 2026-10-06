<template>
  <article class="tech-article">
    <h1>Cava V della pressopiegatrice</h1>
    <p class="direct-answer">
      La cava V è l'apertura della matrice su cui appoggia la lamiera. Nel calcolatore, per la piega
      in aria con il coefficiente dell'acciaio, l'apertura consigliata è 8 volte lo spessore. A 2 mm
      la cava mostrata è 16,0 mm. Il menu materiale non cambia questo numero: il calcolo in pagina
      usa sempre quel coefficiente.
    </p>
    <h2>Lembo minimo</h2>
    <p>
      In piega in aria la lamiera poggia sulle due spalle della V. Il bordo deve restare fuori dalla
      luce della cava. Il controllo del lembo usa due soglie: V/2 come limite geometrico e 0,63 × V
      come soglia pratica per una piega intorno ai 90°. Con V = 16 mm sono 8 mm e 10,08 mm.
    </p>
    <table>
      <thead>
        <tr>
          <th>Spessore</th>
          <th>Cava consigliata nel calcolatore</th>
          <th>Limite geometrico V/2</th>
          <th>Soglia pratica 0,63 × V</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1 mm</td>
          <td>8 mm</td>
          <td>4 mm</td>
          <td>5,04 mm</td>
        </tr>
        <tr>
          <td>2 mm</td>
          <td>16 mm</td>
          <td>8 mm</td>
          <td>10,08 mm</td>
        </tr>
        <tr>
          <td>3 mm</td>
          <td>24 mm</td>
          <td>12 mm</td>
          <td>15,12 mm</td>
        </tr>
      </tbody>
    </table>
    <h2>Domande</h2>
    <h3>La cava scelta cambia il raggio interno del calcolatore?</h3>
    <p>
      No. Il raggio interno resta il valore che inserisci. Nel calcolatore puoi lasciare la cava
      consigliata, 8 × spessore, oppure sceglierne un'altra: serve al controllo del lembo.
    </p>
    <h3>SviluppoLamiera programma la pressa?</h3>
    <p>
      No. Non sceglie la sequenza, gli utensili a magazzino né il programma CNC. Indica un'apertura
      e lo sviluppo piano.
    </p>
    <nav aria-label="Pagine collegate">
      <router-link to="/bend-allowance">Bend allowance</router-link>
      <router-link to="/ritorno-elastico">Ritorno elastico</router-link>
      <router-link to="/calcolatore-sviluppo-lamiera">Apri il calcolatore</router-link>
    </nav>
  </article>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { techArticleHead } from '@/seo/techArticle.js';

const faqs = [
  {
    q: 'La cava scelta cambia il raggio interno del calcolatore?',
    a: "No. Il raggio interno resta il valore che inserisci. Nel calcolatore puoi lasciare la cava consigliata, 8 × spessore, oppure sceglierne un'altra: serve al controllo del lembo.",
  },
  {
    q: 'SviluppoLamiera programma la pressa?',
    a: "No. Non sceglie la sequenza, gli utensili a magazzino né il programma CNC. Indica un'apertura e lo sviluppo piano.",
  },
];

useHead(
  techArticleHead({
    path: '/cava-v-pressopiegatrice',
    title: 'Cava V della pressopiegatrice | SviluppoLamiera',
    description:
      'Nel calcolatore la cava consigliata in piega in aria è 8 volte lo spessore: 16 mm per lamiera da 2 mm.',
    headline: 'Cava V della pressopiegatrice',
    faqs,
  })
);
</script>

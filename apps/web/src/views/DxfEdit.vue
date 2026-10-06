<template>
  <article class="tech-article">
    <h1>Modificare uno sviluppo DXF</h1>
    <p class="direct-answer">
      L'editor apre un DXF piano e permette di allungare o accorciare il pezzo lungo un asse. Se il
      file è in pollici o non dichiara le unità, la lettura va confermata. Se i fori non hanno già
      un vincolo, puoi scegliere «Restano in posizione»: restano alle coordinate assolute mentre il
      contorno cambia. Non genera il programma della pressopiegatrice.
    </p>
    <h2>Sequenza</h2>
    <ol>
      <li>Apri il DXF. Se le unità non sono millimetri, confermale prima di lavorare.</li>
      <li>Indica spessore e materiale: servono ai controlli di piega, non sono dentro il DXF.</li>
      <li>Lo strumento Misura chiede due clic e mostra la distanza.</li>
      <li>
        Lo strumento Modifica quota chiede asse, valore e lato fermo. Guarda l'anteprima prima di
        applicare.
      </li>
      <li>Se compare la scelta sui fori, «Lascia i fori dove sono» li tiene fermi nel piano.</li>
    </ol>
    <h2>Cosa si seleziona</h2>
    <p>
      Una linea verde continua è una piega positiva, una verde tratteggiata è una piega negativa. La
      tabella e il pannello proprietà mostrano gli stessi dati. Un foro circolare chiuso si
      seleziona e se ne cambia il diametro. La misura non modifica il pezzo.
    </p>
    <h2>Domande</h2>
    <h3>I fori si spostano sempre insieme al contorno?</h3>
    <p>
      Solo se scegli di mantenere la distanza da un lato. L'altra voce li lascia alle coordinate di
      partenza. La scelta appare quando il pezzo ha fori senza un vincolo già definito.
    </p>
    <h3>La scheda di piega esce dal DXF da sola?</h3>
    <p>
      Le linee di piega arrivano da layer il cui nome contiene PIEGA, BEND o FOLD. Sul disegno sono
      verdi: continue se la piega è positiva, tratteggiate se è negativa. Se il DXF ripete anche le
      linee del raggio, eliminale dalla tabella o con Canc. Per aggiungerne una, usa lo strumento
      Linea di piega: un clic su un segmento, oppure due clic. Angolo e direzione, se il nome del
      layer non li contiene, restano da compilare. Spessore e materiale si inseriscono a mano.
    </p>
    <nav aria-label="Pagine collegate">
      <router-link to="/editor">Apri l'editor DXF</router-link>
      <router-link to="/bend-allowance">Bend allowance</router-link>
      <router-link to="/calcolatore-sviluppo-lamiera">Calcolatore</router-link>
    </nav>
  </article>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import { techArticleHead } from '@/seo/techArticle.js';

const faqs = [
  {
    q: 'I fori si spostano sempre insieme al contorno?',
    a: "Solo se scegli di mantenere la distanza da un lato. L'altra voce li lascia alle coordinate di partenza. La scelta appare quando il pezzo ha fori senza un vincolo già definito.",
  },
  {
    q: 'La scheda di piega esce dal DXF da sola?',
    a: 'Le linee di piega arrivano da layer il cui nome contiene PIEGA, BEND o FOLD. Sul disegno sono verdi: continue se la piega è positiva, tratteggiate se è negativa. Le linee del raggio si eliminano dalla tabella o con Canc. Se ne aggiunge una con lo strumento Linea di piega. Angolo e direzione, se il nome del layer non li contiene, restano da compilare. Spessore e materiale si inseriscono a mano.',
  },
];

useHead(
  techArticleHead({
    path: '/modifica-sviluppo-dxf',
    title: 'Modificare uno sviluppo DXF | SviluppoLamiera',
    description:
      'Apri un DXF, conferma le unità e allunga il pezzo. Puoi lasciare i fori alle coordinate di partenza.',
    headline: 'Modificare uno sviluppo DXF',
    faqs,
  })
);
</script>

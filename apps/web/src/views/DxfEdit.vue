<template>
  <article class="tech-article">
    <h1>Modificare uno sviluppo DXF</h1>
    <p class="direct-answer">
      L'editor apre un DXF piano, chiede se le quote sono in millimetri o in pollici e permette di
      allungare o accorciare il pezzo lungo un asse. Se i fori non hanno già un vincolo, puoi
      scegliere «Lascia i fori dove sono»: restano alle coordinate assolute mentre il contorno
      cambia. Non genera il programma della pressopiegatrice.
    </p>
    <h2>Sequenza</h2>
    <ol>
      <li>Apri il DXF e conferma l'unità. Il file non viene dato per buono in automatico.</li>
      <li>Indica spessore e materiale: servono ai controlli di piega, non sono dentro il DXF.</li>
      <li>Due clic sul disegno misurano una distanza.</li>
      <li>
        In Modifica scegli asse, valore e lato fermo, poi guarda l'anteprima prima di applicare.
      </li>
      <li>Se compare la scelta sui fori, «Lascia i fori dove sono» li tiene fermi nel piano.</li>
    </ol>
    <h2>Cosa si seleziona</h2>
    <p>
      Una linea arancione è una linea di piega: in Elemento leggi layer, angolo e direzione. Un foro
      circolare chiuso si seleziona e se ne cambia il diametro. Due clic nel vuoto misurano, non
      modificano il pezzo.
    </p>
    <h2>Domande</h2>
    <h3>I fori si spostano sempre insieme al contorno?</h3>
    <p>
      Solo se scegli di mantenere la distanza da un lato. L'altra voce li lascia alle coordinate di
      partenza. La scelta appare quando il pezzo ha fori senza un vincolo già definito.
    </p>
    <h3>La scheda di piega esce dal DXF da sola?</h3>
    <p>
      Le linee arancioni arrivano da layer il cui nome contiene PIEGA, BEND o FOLD. Angolo e
      direzione, se il nome del layer non li contiene, restano da compilare. Spessore e materiale si
      inseriscono a mano.
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
    a: 'Le linee arancioni arrivano da layer il cui nome contiene PIEGA, BEND o FOLD. Angolo e direzione, se il nome del layer non li contiene, restano da compilare. Spessore e materiale si inseriscono a mano.',
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

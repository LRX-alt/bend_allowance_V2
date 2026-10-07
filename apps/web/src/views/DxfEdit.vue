<template>
  <article class="tech-article">
    <p class="page-kicker">Editor DXF</p>
    <h1>Come usare l'editor DXF</h1>
    <p class="direct-answer">
      L'editor apre uno sviluppo piano, mostra le quote e le linee di piega, e permette di
      correggere il pezzo. Non genera il programma della pressopiegatrice. Spessore, materiale e
      raggio interno non arrivano dal DXF: vanno indicati nel pannello a destra.
    </p>

    <h2>Aprire il disegno</h2>
    <ol>
      <li>Da Home scegli Apri DXF, oppure nell'editor usa Importa DXF o trascina il file.</li>
      <li>Le coordinate si leggono in millimetri. Non c'è conversione dai pollici.</li>
      <li>
        Le linee verdi sono pieghe. Il nome del layer deve contenere PIEGA, BEND o FOLD. Una linea
        continua è una piega positiva, una tratteggiata è negativa. Se il nome contiene l'angolo,
        per esempio PIEGA_90_SU, angolo e direzione sono già compilati.
      </li>
    </ol>

    <h2>Il pannello a destra</h2>
    <p>Scorre in un'unica colonna, dall'alto verso il basso.</p>
    <ol>
      <li>
        <strong>Pezzo.</strong> Ingombro, numero di pieghe e fori, fattore K del materiale. Spessore
        e materiale si inseriscono qui: non sono nel DXF.
      </li>
      <li>
        <strong>Pieghe.</strong> Angolo, direzione, raggio e lunghezza di ogni linea. Il trattino
        nella colonna Raggio non è un campo: la riga si clicca per selezionarla.
      </li>
      <li>
        <strong>Setup piega.</strong> Punzone, matrice, processo e origine del raggio. Vale per
        tutto il pezzo.
      </li>
      <li>
        <strong>Proprietà.</strong> Compare sotto il setup, nella scheda Proprietà. Con una piega
        selezionata trovi Angolo, Direzione e Raggio interno mm.
      </li>
    </ol>

    <h2>Modificare una quota</h2>
    <p>
      Con lo strumento Selezione, clicca il numero della quota sul disegno. Compare un campo sul
      testo: scrivi il nuovo valore e premi Invio. Il comportamento dipende da quale quota clicchi.
    </p>
    <ul>
      <li>
        <strong>Quota d'ingombro</strong> (larghezza o altezza del pezzo): la correzione va tutta
        nel corpo, tra le pieghe. Flange e pieghe non si spostano rispetto al loro bordo, quindi
        anche una scantonatura tenuta al centro di una piega resta centrata. Ogni foro mantiene la
        distanza dalla sua piega: cresce solo lo spazio libero del corpo più vicino al centro del
        pezzo, cioè l'interasse tra il gruppo di fori di sinistra e quello di destra. Se nel corpo
        non c'è spazio libero dalle lavorazioni, la modifica viene bloccata.
      </li>
      <li>
        <strong>Quota di una flangia</strong> (dal bordo alla piega): qui la piega resta ferma e si
        allunga o accorcia solo il bordo esterno.
      </li>
      <li>
        <strong>Quota tra due pieghe</strong>: resta fermo il lato verso l'origine del disegno.
      </li>
    </ul>
    <p>
      Lo strumento Modifica sviluppo, nel pannello a destra sotto Pezzo, fa la stessa correzione:
      scegli asse, valore e riferimento (Simmetrico è il predefinito), guarda l'anteprima e poi
      applica. Se i fori non hanno un vincolo, puoi lasciarli alle coordinate di partenza oppure
      farli seguire il lato.
    </p>

    <h2>Quote di flangia</h2>
    <p>
      Per ogni lato con una piega, l'editor disegna una quota in più, più vicina al pezzo rispetto
      all'ingombro: va dal bordo del contorno alla piega più esterna. Si clicca e si modifica come
      le altre quote. Se nel disegno c'è già un testo DXF con la stessa misura, non viene ripetuto.
    </p>
    <p>
      Un DXF spesso ha due linee molto vicine per la stessa piega, per esempio sui layer BEND e
      BEND_EXTENT: la quota segue sempre quella più vicina al bordo. Se la elimini dalla tabella
      Pieghe, la quota si aggiorna da sola sulla piega successiva.
    </p>

    <h2>Raggio interno e scheda di piega</h2>
    <p>
      La scheda di piega riporta il raggio scritto su ogni linea. Il riquadro «Raggio interno
      stimato dalla cava» è solo una nota: non entra nello sviluppo e non entra nella scheda.
    </p>
    <p>Per compilare il raggio hai due strade.</p>
    <ul>
      <li>
        Un valore per tutte le pieghe: in Setup piega apri Origine del raggio. Assunzione sul
        punzone copia il raggio punta. Misurato e Target chiedono il numero nel campo che compare
        sotto il menu.
      </li>
      <li>
        Un valore per una sola piega: clicca la riga in Pieghe, scendi a Proprietà e compila Raggio
        interno mm. L'origine deve restare su Manuale.
      </li>
    </ul>
    <p>
      Scheda piega, in alto, apre il riepilogo. Mostra angolo, direzione e raggio interno solo se
      quel raggio è stato scritto sulla linea.
    </p>

    <h2>Punzone e matrice</h2>
    <p>
      I menu Punzone e Matrice elencano utensili di uso comune, raggruppati per tipo: dritto 88°,
      acuto 30°, collo di cigno, punzone a raggio, matrici 88° e matrici acute 30°. La scelta
      imposta il raggio di punta o l'apertura V. Personalizzato lascia il numero libero. La cava
      consigliata è un suggerimento in base a spessore, materiale e processo: non sostituisce la V
      scelta.
    </p>

    <h2>Strumenti</h2>
    <table>
      <thead>
        <tr>
          <th>Strumento</th>
          <th>Tasto</th>
          <th>A cosa serve</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Selezione</td>
          <td>V</td>
          <td>Clicca una quota per cambiarla, oppure una piega o un foro.</td>
        </tr>
        <tr>
          <td>Sposta vista</td>
          <td>H</td>
          <td>Trascina il disegno. La rotella zooma.</td>
        </tr>
        <tr>
          <td>Misura</td>
          <td>M</td>
          <td>Due clic: mostra la distanza, senza modificare il pezzo.</td>
        </tr>
        <tr>
          <td>Modifica quota</td>
          <td>Q</td>
          <td>Allunga o accorcia lungo un asse, con anteprima.</td>
        </tr>
        <tr>
          <td>Linea di piega</td>
          <td>B</td>
          <td>Un clic su un segmento, oppure due clic per tracciare la linea.</td>
        </tr>
      </tbody>
    </table>
    <p>
      Adatta, tasto F, rimette il pezzo in vista. Canc elimina la piega selezionata. Annulla e
      Ripeti sono nella barra in alto.
    </p>

    <h2>Domande</h2>
    <h3>Perché la scheda di piega mostra il raggio come un trattino?</h3>
    <p>
      Perché sulla linea non c'è un raggio interno. Punzone, cava, spessore e fattore K non lo
      sostituiscono. Imposta Origine del raggio, oppure scrivi Raggio interno mm in Proprietà dopo
      aver selezionato la piega.
    </p>
    <h3>I fori si spostano sempre insieme al contorno?</h3>
    <p>
      Solo se scegli di mantenere la distanza da un lato. L'altra voce li lascia alle coordinate di
      partenza. La scelta appare quando il pezzo ha fori senza un vincolo già definito.
    </p>
    <h3>La scheda di piega esce dal DXF da sola?</h3>
    <p>
      Le linee di piega arrivano dai layer. Angolo e direzione arrivano se il nome del layer li
      contiene. Il raggio interno, lo spessore e il materiale si inseriscono a mano. Se il DXF
      ripete anche le linee del raggio, eliminale dalla tabella o con Canc.
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
    q: 'Perché la scheda di piega mostra il raggio come un trattino?',
    a: "Perché sulla linea non c'è un raggio interno. Punzone, cava, spessore e fattore K non lo sostituiscono. Imposta Origine del raggio, oppure scrivi Raggio interno mm in Proprietà dopo aver selezionato la piega.",
  },
  {
    q: 'I fori si spostano sempre insieme al contorno?',
    a: "Solo se scegli di mantenere la distanza da un lato. L'altra voce li lascia alle coordinate di partenza. La scelta appare quando il pezzo ha fori senza un vincolo già definito.",
  },
  {
    q: 'La scheda di piega esce dal DXF da sola?',
    a: 'Le linee di piega arrivano dai layer. Angolo e direzione arrivano se il nome del layer li contiene. Il raggio interno, lo spessore e il materiale si inseriscono a mano. Se il DXF ripete anche le linee del raggio, eliminale dalla tabella o con Canc.',
  },
];

useHead(
  techArticleHead({
    path: '/modifica-sviluppo-dxf',
    title: "Come usare l'editor DXF | SviluppoLamiera",
    description:
      'Apri uno sviluppo, modifica le quote cliccandole, imposta pieghe, punzone e raggio interno, poi genera la scheda di piega.',
    headline: "Come usare l'editor DXF",
    faqs,
  })
);
</script>

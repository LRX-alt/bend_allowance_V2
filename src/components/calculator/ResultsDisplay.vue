<template>
  <section class="results-section" v-if="dettagli && dettagli.length > 0">
    <h2>Risultati</h2>
    <p><strong>Lunghezza totale di taglio:</strong> {{ risultato.toFixed(2) }} mm</p>
    <ul class="results-list">
      <li v-for="(dettaglio, index) in dettagli" :key="index" class="result-item">
        <strong>Segmento {{ dettaglio.segmento }}:</strong><br>
        Lunghezza Effettiva: {{ dettaglio.lunghezzaEffettiva.toFixed(2) }} mm<br>
        <template v-if="dettaglio.bendAllowance !== null">
          Bend Allowance: {{ dettaglio.bendAllowance.toFixed(2) }} mm<br>
        </template>
        <template v-if="dettaglio.setback !== null">
          Setback: {{ dettaglio.setback.toFixed(2) }} mm<br>
        </template>
        <template v-if="dettaglio.bendDeduction !== null">
          Bend Deduction: {{ dettaglio.bendDeduction.toFixed(2) }} mm
        </template>
      </li>
    </ul>
    
    <section class="riepilogo-dimensioni" v-if="segments.length > 0">
      <h3>Riepilogo Visivo delle Dimensioni</h3>
      <div class="riepilogo">
        <ul>
          <li v-for="(segment, index) in segments" :key="index">
            <strong>Segmento {{ index + 1 }}:</strong> Lunghezza: {{ segment.length }} mm, 
            Angolo: {{ segment.angle }}°, 
            Tipo di Piega: {{ segment.tipoPiega }}
          </li>
        </ul>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  name: 'ResultsDisplay',
  props: {
    dettagli: {
      type: Array,
      required: true
    },
    risultato: {
      type: Number,
      required: true
    },
    segments: {
      type: Array,
      required: true
    }
  }
};
</script>

<style scoped>
.results-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.results-list {
  list-style-type: none;
  padding: 0;
}

.result-item {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
}

.riepilogo {
  background: #f1f1f1;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-top: 15px;
}
</style>
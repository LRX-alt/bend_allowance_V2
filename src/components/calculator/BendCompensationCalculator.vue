<template>
  <section class="bend-compensation-calculator">
    <h2>Calcolatore di Compensazione Piega</h2>

    <p class="intro-text">
      Questo strumento ti aiuta a calcolare la compensazione esatta per le tue pieghe basandosi su
      misurazioni reali. Utile per calibrare i calcoli teorici con i risultati effettivi.
    </p>

    <div class="calculator-inputs">
      <div class="form-group">
        <h3>Misurazioni del Progetto</h3>

        <div class="form-row">
          <label>Lunghezza piatta teorica (mm):</label>
          <input v-model.number="lunghezzaTeorica" type="number" step="0.1" min="0" />
        </div>

        <div class="form-row">
          <label>Lunghezza misurata dopo piega (mm):</label>
          <input v-model.number="lunghezzaMisurata" type="number" step="0.1" min="0" />
        </div>

        <div class="form-row">
          <label>Numero di pieghe:</label>
          <input v-model.number="numeroPieghe" type="number" step="1" min="1" />
        </div>

        <div class="form-row">
          <label>Spessore materiale (mm):</label>
          <input v-model.number="spessoreMateriale" type="number" step="0.1" min="0.1" />
        </div>

        <div class="form-row">
          <label>Angolo di piega (°):</label>
          <input v-model.number="angoloPiega" type="number" step="1" min="0" max="180" />
        </div>

        <div class="form-row">
          <label>Raggio interno (mm):</label>
          <input v-model.number="raggioInterno" type="number" step="0.1" min="0" />
        </div>

        <button @click="calcolaCompensazione" class="btn-calculate">Calcola Compensazione</button>
      </div>

      <div class="results-container" v-if="risultati.fattoreK !== null">
        <h3>Risultati Calcolati</h3>

        <div class="result-card">
          <h4>Fattore K Effettivo</h4>
          <div class="result-value">{{ risultati.fattoreK.toFixed(4) }}</div>
          <p class="result-note">Questo è il fattore K reale calcolato dalle tue misurazioni</p>
        </div>

        <div class="result-card">
          <h4>Bend Allowance per Piega</h4>
          <div class="result-value">{{ risultati.bendAllowancePerPiega.toFixed(2) }} mm</div>
        </div>

        <div class="result-card">
          <h4>Differenza per Piega</h4>
          <div
            class="result-value"
            :class="{
              positive: risultati.differenzaPerPiega > 0,
              negative: risultati.differenzaPerPiega < 0,
            }"
          >
            {{ risultati.differenzaPerPiega.toFixed(2) }} mm
          </div>
          <p class="result-note">
            {{ risultati.differenzaPerPiega > 0 ? 'Materiale aggiunto' : 'Materiale rimosso' }}
            rispetto al teorico
          </p>
        </div>

        <div class="recommendation">
          <h4>Raccomandazione</h4>
          <p>
            Per future pieghe simili con questo materiale e configurazione, utilizza un fattore K di
            <strong>{{ risultati.fattoreK.toFixed(4) }}</strong>
            per ottenere calcoli più precisi.
          </p>
          <button @click="applicaFattoreK" class="btn-apply">Applica questo Fattore K</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'BendCompensationCalculator',
  emits: ['update:fattoreK'],
  setup(props, { emit }) {
    // Input
    const lunghezzaTeorica = ref(100);
    const lunghezzaMisurata = ref(98.5);
    const numeroPieghe = ref(1);
    const spessoreMateriale = ref(2.0);
    const angoloPiega = ref(90);
    const raggioInterno = ref(1.0);

    // Risultati
    const risultati = ref({
      fattoreK: null,
      bendAllowancePerPiega: null,
      differenzaPerPiega: null,
    });

    const calcolaCompensazione = () => {
      if (numeroPieghe.value <= 0 || !lunghezzaTeorica.value || !lunghezzaMisurata.value) {
        return;
      }

      // Differenza totale
      const differenzaTotale = lunghezzaMisurata.value - lunghezzaTeorica.value;

      // Differenza per piega
      const differenzaPerPiega = differenzaTotale / numeroPieghe.value;

      // Conversione angolo in radianti
      const angoloRad = (Math.PI / 180) * angoloPiega.value;

      // Calcolo del fattore K
      // BA = α * (R + K*T)
      // Quindi K = (BA/(α) - R) / T
      const bendAllowancePerPiega =
        Math.abs(differenzaPerPiega) + 2 * raggioInterno.value * Math.tan(angoloRad / 2);
      const fattoreK =
        (bendAllowancePerPiega / angoloRad - raggioInterno.value) / spessoreMateriale.value;

      risultati.value = {
        fattoreK: fattoreK,
        bendAllowancePerPiega: bendAllowancePerPiega,
        differenzaPerPiega: differenzaPerPiega,
      };
    };

    const applicaFattoreK = () => {
      if (risultati.value.fattoreK !== null) {
        emit('update:fattoreK', risultati.value.fattoreK);
      }
    };

    return {
      lunghezzaTeorica,
      lunghezzaMisurata,
      numeroPieghe,
      spessoreMateriale,
      angoloPiega,
      raggioInterno,
      risultati,
      calcolaCompensazione,
      applicaFattoreK,
    };
  },
};
</script>

<style scoped>
.bend-compensation-calculator {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.intro-text {
  margin-bottom: 20px;
  color: #555;
}

.calculator-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
}

.form-row {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.form-row label {
  margin-bottom: 5px;
  font-weight: bold;
}

.btn-calculate {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  font-weight: bold;
}

.results-container {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
}

.result-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.result-value {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
  color: #007bff;
  text-align: center;
}

.result-value.positive {
  color: #28a745;
}

.result-value.negative {
  color: #dc3545;
}

.result-note {
  font-size: 0.85em;
  color: #666;
  text-align: center;
}

.recommendation {
  background: #e8f4ff;
  border: 1px solid #b8daff;
  border-radius: 4px;
  padding: 15px;
  margin-top: 20px;
}

.btn-apply {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .calculator-inputs {
    grid-template-columns: 1fr;
  }
}
</style>

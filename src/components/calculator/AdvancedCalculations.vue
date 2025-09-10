<template>
  <section class="advanced-calculations">
    <h2>Calcoli Avanzati</h2>

    <!-- Parametri condivisi con il componente principale -->
    <div class="shared-parameters-info">
      <p>
        I parametri di base (processo, direzione, tipo matrice, ecc.) vengono sincronizzati con
        quelli della pagina principale.
      </p>
      <div class="current-params">
        <div><strong>Processo di piega:</strong> {{ processo }}</div>
        <div><strong>Direzione grana:</strong> {{ direzione }}</div>
        <div><strong>Tipo di matrice:</strong> {{ tipoMatrice }}</div>
        <div><strong>Larghezza matrice:</strong> {{ larghezzaMatrice }} mm</div>
      </div>
    </div>

    <!-- Controlli per larghezza matrice e processo -->
    <div class="matrix-controls">
      <h3>Impostazioni Matrice</h3>

      <div class="form-row">
        <label>Processo di Piegatura:</label>
        <select v-model="processoAttuale" @change="updateProcesso">
          <option value="airBend">Air Bending</option>
          <option value="bottoming">Bottoming</option>
          <option value="coining">Coining</option>
        </select>
        <i class="info-icon" title="Il processo di piegatura influenza il raggio effettivo">i</i>
      </div>

      <div class="form-row">
        <label>Larghezza Matrice (V-die):</label>
        <div class="input-with-unit">
          <input
            type="number"
            v-model.number="matriceWidth"
            @input="updateMatriceWidth"
            step="0.1"
            min="0.1"
          />
          <span>mm</span>
        </div>
        <i
          class="info-icon"
          title="La larghezza della matrice influenza il raggio effettivo di piega"
          >i</i
        >
        <button @click="useRecommendedWidth" class="btn-small">Consigliata</button>
      </div>

      <!-- Mostra il raggio effettivo calcolato quando larghezzaMatrice è impostata -->
      <div v-if="larghezzaMatrice > 0 && raggioEffettivoCalcolato > 0" class="info-box">
        <p>
          <strong>Raggio effettivo stimato:</strong>
          {{ raggioEffettivoCalcolato.toFixed(2) }} mm
        </p>
        <p class="info-note">
          Con processo di {{ getProcessoLabel(processoAttuale) }}, una matrice di larghezza
          {{ larghezzaMatrice.toFixed(2) }} mm produce un raggio interno di circa
          {{ raggioEffettivoCalcolato.toFixed(2) }} mm.
        </p>
      </div>
    </div>

    <!-- Parametri avanzati (solo per questo tab) -->
    <div class="parameters-advanced">
      <h3>Parametri di Calcolo Avanzati</h3>

      <div class="form-row">
        <label>Metodo di calcolo:</label>
        <select v-model="metodo" @change="aggiornaCalcoli">
          <option value="standard">Standard</option>
          <option value="DIN6935">DIN 6935</option>
          <option value="ANSI">ANSI/ASME</option>
          <option value="pressbrake">Press Brake</option>
          <option value="customK">Custom K</option>
        </select>
        <i class="info-icon" title="Formula utilizzata per il calcolo">i</i>
      </div>

      <div class="form-row">
        <label>Materiale:</label>
        <select v-model="materiale" @change="aggiornaCalcoli">
          <option value="acciaio">Acciaio</option>
          <option value="alluminio">Alluminio</option>
          <option value="rame">Rame</option>
          <option value="ottone">Ottone</option>
          <option value="inox">Acciaio Inox</option>
          <option value="titanio">Titanio</option>
        </select>
        <i class="info-icon" title="Materiale utilizzato per calcoli avanzati">i</i>
      </div>
    </div>

    <!-- Risultati dei calcoli avanzati -->
    <div v-if="hasBend && risultatiInterni" class="results-advanced">
      <div class="result-card-group">
        <div class="result-card">
          <h3>Bend Allowance</h3>
          <div class="result-value">{{ risultatiInterni.bendAllowance.toFixed(2) }} mm</div>
        </div>

        <div class="result-card">
          <h3>Springback</h3>
          <div class="result-value">{{ risultatiInterni.springback.toFixed(2) }}°</div>
          <div class="result-note">Compensazione necessaria</div>
        </div>

        <div class="result-card">
          <h3>Angolo Macchina</h3>
          <div class="result-value">{{ risultatiInterni.angoloEffettivo.toFixed(2) }}°</div>
          <div class="result-note">Per ottenere {{ currentBendAngle }}°</div>
        </div>
      </div>

      <div class="result-card-group">
        <div class="result-card">
          <h3>Forza Richiesta</h3>
          <div class="result-value">{{ risultatiInterni.forzaPiega.forzaTon.toFixed(2) }} t</div>
          <div class="result-note">{{ risultatiInterni.forzaPiega.forzaKN.toFixed(2) }} kN</div>
        </div>

        <div class="result-card">
          <h3>V-Die Ottimale</h3>
          <div class="result-value">
            {{ risultatiInterni.aperturaMatrice.aperturaOttimale.toFixed(2) }} mm
          </div>
          <div class="result-note">
            Range: {{ risultatiInterni.aperturaMatrice.rangeConsigliato.min.toFixed(2) }} -
            {{ risultatiInterni.aperturaMatrice.rangeConsigliato.max.toFixed(2) }} mm
          </div>
        </div>

        <div class="result-card" :class="{ warning: !risultatiInterni.raggioAdeguato }">
          <h3>Raggio Minimo</h3>
          <div class="result-value">{{ risultatiInterni.raggioMinimo.toFixed(2) }} mm</div>
          <div v-if="!risultatiInterni.raggioAdeguato" class="result-warning">
            Raggio attuale troppo piccolo!
          </div>
        </div>
      </div>

      <!-- Aggiungiamo una card per il raggio effettivo -->
      <div v-if="larghezzaMatrice > 0" class="result-card-group">
        <div class="result-card special-card">
          <h3>Raggio Effettivo</h3>
          <div class="result-value">{{ risultatiInterni.raggioEffettivo.toFixed(2) }} mm</div>
          <div class="result-note">Calcolato dalla larghezza matrice</div>
        </div>
        <div class="result-card">
          <h3>Sviluppo Totale</h3>
          <div class="result-value">{{ sviluppoTotaleCalcolato.toFixed(2) }} mm</div>
          <div class="result-note">Con raggio effettivo applicato</div>
        </div>
      </div>

      <div class="technical-details">
        <h3>Dettagli Tecnici</h3>
        <table>
          <tbody>
            <tr>
              <td>Pressione Massima:</td>
              <td>{{ risultatiInterni.forzaPiega.pressioneMax.toFixed(2) }} N/mm²</td>
            </tr>
            <tr>
              <td>Setback:</td>
              <td>{{ risultatiInterni.setback.toFixed(2) }} mm</td>
            </tr>
            <tr>
              <td>Bend Deduction:</td>
              <td>{{ risultatiInterni.bendDeduction.toFixed(2) }} mm</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pulsante per applicare i risultati -->
      <div class="apply-results">
        <button @click="applicaRisultati" class="btn-apply">Applica Questi Risultati</button>
        <p class="note">Clicca per utilizzare questi calcoli nella visualizzazione principale</p>
      </div>
    </div>

    <div v-else-if="!hasBend" class="no-data-message">
      Aggiungi almeno un segmento con un angolo di piega per visualizzare i calcoli avanzati.
    </div>
  </section>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import {
  calcoliAvanzatiPiegatura,
  calcolaAperturaMatrice,
  calcolaRaggioEffettivo,
} from '@/utils/BendingCalculatorAdvanced';
import { calcolaDettagliSegmenti } from '@/utils/BendingCalculator';

export default {
  name: 'AdvancedCalculations',
  props: {
    spessore: {
      type: Number,
      required: true,
    },
    raggioPiega: {
      type: Number,
      required: true,
    },
    segments: {
      type: Array,
      required: true,
    },
    fattoreK: {
      type: Number,
      required: true,
    },
    unitFactor: {
      type: Number,
      default: 1,
    },
    unitLabel: {
      type: String,
      default: 'mm',
    },
    // Parametri sincronizzati con il componente principale
    processo: {
      type: String,
      default: 'airBend',
    },
    direzione: {
      type: String,
      default: 'parallelaPiega',
    },
    tipoMatrice: {
      type: String,
      default: 'vDie',
    },
    larghezzaMatrice: {
      type: Number,
      default: 0,
    },
    tipoCava: {
      type: String,
      default: 'standard',
    },
    risultatiAvanzati: {
      type: Object,
      default: null,
    },
  },
  emits: [
    'update:risultatiAvanzati',
    'update:larghezzaMatrice',
    'update:processo',
    'calcoliAggiornati',
  ],
  setup(props, { emit }) {
    // Utilizziamo solo i parametri che sono esclusivi di questo componente
    const metodo = ref('standard');
    const materiale = ref('acciaio');

    // Tabella matrici standard per spessore (allineata a ParametersInput.vue)
    const matriciStandardIndustriali = [
      { value: 6, label: '6mm (0.5-1mm)', spessoreMin: 0.5, spessoreMax: 1.0 },
      { value: 8, label: '8mm (1-1.5mm)', spessoreMin: 1.0, spessoreMax: 1.5 },
      { value: 12, label: '12mm (1.5-2mm)', spessoreMin: 1.5, spessoreMax: 2.0 },
      { value: 16, label: '16mm (2-2.5mm)', spessoreMin: 2.0, spessoreMax: 2.5 },
      { value: 20, label: '20mm (2.5-3mm)', spessoreMin: 2.5, spessoreMax: 3.0 },
      { value: 24, label: '24mm (3-4mm)', spessoreMin: 3.0, spessoreMax: 4.0 },
      { value: 32, label: '32mm (4-5mm)', spessoreMin: 4.0, spessoreMax: 5.0 },
      { value: 40, label: '40mm (5-6mm)', spessoreMin: 5.0, spessoreMax: 6.0 },
      { value: 50, label: '50mm (6-8mm)', spessoreMin: 6.0, spessoreMax: 8.0 },
      { value: 60, label: '60mm (8-10mm)', spessoreMin: 8.0, spessoreMax: 10.0 },
      { value: 80, label: '80mm (10-12mm)', spessoreMin: 10.0, spessoreMax: 12.0 },
      { value: 100, label: '100mm (12-14mm)', spessoreMin: 12.0, spessoreMax: 14.0 },
      { value: 120, label: '120mm (14-16mm)', spessoreMin: 14.0, spessoreMax: 16.0 },
      { value: 140, label: '140mm (16-18mm)', spessoreMin: 16.0, spessoreMax: 18.0 },
      { value: 160, label: '160mm (18-20mm)', spessoreMin: 18.0, spessoreMax: 20.0 },
    ];

    // Valori per larghezza matrice e processo
    const matriceWidth = ref(props.larghezzaMatrice || calcolaAperturaMatriceDefault());
    const processoAttuale = ref(props.processo);

    // Manteniamo una copia locale dei risultati
    const risultatiInterni = ref(props.risultatiAvanzati || null);

    // Funzione per calcolare la larghezza matrice consigliata (preferisci standard)
    function calcolaAperturaMatriceDefault() {
      // Cerca una matrice standard per lo spessore
      const m = matriciStandardIndustriali.find(m => props.spessore >= m.spessoreMin && props.spessore <= m.spessoreMax);
      if (m) return m.value;
      // Fallback alla funzione avanzata se fuori range
      const apertura = calcolaAperturaMatrice(props.spessore, props.processo, materiale.value);
      return apertura.aperturaOttimale;
    }

    // Calcola il raggio effettivo in base alla larghezza matrice
    const raggioEffettivoCalcolato = computed(() => {
      if (matriceWidth.value > 0) {
        return calcolaRaggioEffettivo(
          props.spessore,
          matriceWidth.value,
          props.raggioPiega,
          processoAttuale.value
        );
      }
      return props.raggioPiega;
    });

    // Calcola la lunghezza della piega attiva e l'angolo di piega
    const currentBend = computed(() => {
      if (!props.segments || props.segments.length < 2) return null;

      // Trova il primo segmento con angolo non zero
      for (let i = 1; i < props.segments.length; i++) {
        if (
          props.segments[i - 1] &&
          props.segments[i - 1].angle &&
          props.segments[i - 1].angle !== 0
        ) {
          return {
            angolo: props.segments[i - 1].angle,
            lunghezza: props.segments[i].length,
          };
        }
      }
      return null;
    });

    const hasBend = computed(() => {
      return currentBend.value !== null;
    });

    const currentBendAngle = computed(() => {
      return hasBend.value ? Math.abs(currentBend.value.angolo) : 0;
    });

    // Calcolo dello sviluppo totale con raggio effettivo
    const sviluppoTotaleCalcolato = computed(() => {
      if (!props.segments || props.segments.length === 0) return 0;

      try {
        // Usa il raggio effettivo per calcolare lo sviluppo
        const { sviluppoTotale } = calcolaDettagliSegmenti(
          props.segments,
          props.spessore,
          raggioEffettivoCalcolato.value, // Usa il raggio effettivo
          props.fattoreK
        );
        return sviluppoTotale;
      } catch (error) {
        console.error('Errore nel calcolo sviluppo totale:', error);
        return 0;
      }
    });

    // Gestione della modifica della larghezza matrice
    const updateMatriceWidth = () => {
      // Verifica se il valore è valido
      if (matriceWidth.value <= 0) {
        matriceWidth.value = calcolaAperturaMatriceDefault();
      }

      // Aggiorna il valore nel componente principale
      emit('update:larghezzaMatrice', matriceWidth.value);

      // Ricalcola con la nuova larghezza matrice
      aggiornaCalcoli();

      // Emetti i risultati aggiornati
      emit('calcoliAggiornati', {
        raggioEffettivo: raggioEffettivoCalcolato.value,
        larghezzaMatrice: matriceWidth.value,
        processo: processoAttuale.value,
      });
    };

    // Gestione della modifica del processo
    const updateProcesso = () => {
      // Aggiorna il valore nel componente principale
      emit('update:processo', processoAttuale.value);

      // Ricalcola con il nuovo processo
      aggiornaCalcoli();

      // Emetti i risultati aggiornati
      emit('calcoliAggiornati', {
        raggioEffettivo: raggioEffettivoCalcolato.value,
        larghezzaMatrice: matriceWidth.value,
        processo: processoAttuale.value,
      });
    };

    // Usa la larghezza matrice consigliata
    const useRecommendedWidth = () => {
      matriceWidth.value = calcolaAperturaMatriceDefault();
      updateMatriceWidth();
    };

    // Funzione helper per mostrare il nome del processo
    const getProcessoLabel = processo => {
      const labels = {
        airBend: 'Air Bending',
        bottoming: 'Bottoming',
        coining: 'Coining',
      };
      return labels[processo] || processo;
    };

    // Aggiorna i calcoli usando i parametri dal componente padre
    const aggiornaCalcoli = () => {
      if (!hasBend.value) return;

      try {
        // Usiamo i parametri dal componente padre per i calcoli
        const params = {
          spessore: props.spessore || 0,
          raggioPiega: props.raggioPiega || 0,
          angolo: currentBend.value?.angolo || 0,
          lunghezzaPiega: currentBend.value?.lunghezza || 100,
          materiale: materiale.value || 'acciaio',
          processo: processoAttuale.value || 'airBend',
          metodo: metodo.value || 'standard',
          fattoreK: props.fattoreK || 0.33,
          direzione: props.direzione || 'parallelaPiega',
          tipoMatrice: props.tipoMatrice || 'vDie',
          larghezzaMatrice: matriceWidth.value || 8 * props.spessore,
          tipoCava: props.tipoCava || 'standard',
        };

        console.log('Parametri usati per calcoli avanzati:', params);

        // Esegui i calcoli
        const nuoviRisultati = calcoliAvanzatiPiegatura(params);

        // Aggiorna la copia locale e monitora eventuali problemi
        risultatiInterni.value = JSON.parse(JSON.stringify(nuoviRisultati));

        console.log('Risultati avanzati aggiornati');
      } catch (error) {
        console.error('Errore nei calcoli avanzati:', error);
      }
    };

    // Funzione per applicare i risultati al componente padre
    const applicaRisultati = () => {
      // Notifica il componente padre con i nuovi risultati
      if (risultatiInterni.value) {
        emit('update:risultatiAvanzati', JSON.parse(JSON.stringify(risultatiInterni.value)));
        emit('update:larghezzaMatrice', matriceWidth.value);
        emit('update:processo', processoAttuale.value);
        emit('calcoliAggiornati', {
          raggioEffettivo: raggioEffettivoCalcolato.value,
          larghezzaMatrice: matriceWidth.value,
          processo: processoAttuale.value,
        });
        console.log('Risultati applicati al componente padre');
      }
    };

    // Sincronizza matriceWidth con larghezzaMatrice prop
    watch(
      () => props.larghezzaMatrice,
      newValue => {
        if (newValue !== null && newValue !== undefined && newValue !== matriceWidth.value) {
          matriceWidth.value = newValue;
        }
      }
    );

    // Sincronizza processoAttuale con processo prop
    watch(
      () => props.processo,
      newValue => {
        if (newValue !== processoAttuale.value) {
          processoAttuale.value = newValue;
        }
      }
    );

    // Aggiorna i nostri risultati interni quando cambiano i parametri del padre
    watch(
      [
        () => props.spessore,
        () => props.raggioPiega,
        () => props.segments,
        () => props.fattoreK,
        () => props.direzione,
        () => props.tipoMatrice,
        () => props.tipoCava,
      ],
      () => {
        console.log('Parametri dal componente padre cambiati, aggiornamento...');
        nextTick(() => {
          aggiornaCalcoli();
        });
      },
      { deep: true }
    );

    // Aggiorna i nostri risultati interni quando cambiano i parametri locali
    watch([metodo, materiale], () => {
      console.log('Parametri locali cambiati, aggiornamento...');
      nextTick(() => {
        aggiornaCalcoli();
      });
    });

    // Aggiorna i risultati quando viene montato il componente
    nextTick(() => {
      aggiornaCalcoli();
    });

    return {
      metodo,
      materiale,
      matriceWidth,
      processoAttuale,
      risultatiInterni,
      hasBend,
      currentBendAngle,
      raggioEffettivoCalcolato,
      sviluppoTotaleCalcolato,
      aggiornaCalcoli,
      applicaRisultati,
      updateMatriceWidth,
      updateProcesso,
      useRecommendedWidth,
      getProcessoLabel,
    };
  },
};
</script>

<style scoped>
.advanced-calculations {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.shared-parameters-info {
  background: #f0f7ff;
  border: 1px dashed #b8daff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.current-params {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.matrix-controls {
  margin-top: 20px;
  margin-bottom: 20px;
  background: #f0f7ff;
  border: 1px solid #d0e3f6;
  border-radius: 8px;
  padding: 15px;
}

.matrix-controls h3 {
  margin-bottom: 15px;
  color: #0056b3;
}

.input-with-unit {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.input-with-unit input {
  width: 100px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-with-unit span {
  margin-left: 5px;
}

.info-box {
  background-color: #edf8ff;
  border: 1px solid #c9e3f9;
  border-radius: 4px;
  padding: 10px 15px;
  margin-top: 15px;
  font-size: 14px;
}

.info-note {
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}

.parameters-advanced {
  margin-top: 20px;
  margin-bottom: 20px;
}

.parameters-advanced h3 {
  margin-bottom: 15px;
  color: #0056b3;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.form-row label {
  min-width: 150px;
}

.btn-small {
  background: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.result-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.result-card {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
}

.special-card {
  background: #e7f9ff;
  border: 1px solid #b0e3ff;
}

.result-value {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
  color: #007bff;
}

.special-card .result-value {
  color: #0056b3;
}

.result-note {
  font-size: 0.85em;
  color: #666;
}

.warning .result-value {
  color: #dc3545;
}

.result-warning {
  color: #dc3545;
  font-weight: bold;
  margin-top: 5px;
}

.technical-details {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.technical-details table {
  width: 100%;
}

.technical-details td {
  padding: 5px 10px;
}

.technical-details td:first-child {
  font-weight: bold;
  width: 40%;
}

.apply-results {
  margin-top: 20px;
  text-align: center;
  padding: 15px;
  background: #f0f7ff;
  border-radius: 8px;
}

.btn-apply {
  background: #9c27b0;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  min-width: 250px;
}

.btn-apply:hover {
  background: #8e24aa;
}

.note {
  margin-top: 10px;
  font-size: 0.85em;
  color: #666;
}

.info-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 16px;
  font-size: 12px;
  cursor: help;
}

.no-data-message {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border: 1px dashed #ccc;
  border-radius: 6px;
  color: #666;
}
</style>

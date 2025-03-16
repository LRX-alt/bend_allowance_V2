<template>
  <section class="advanced-calculations">
    <h2>Calcoli Avanzati</h2>
    
    <div class="parameters-advanced">
      <div class="form-row">
        <label>Processo di piega:</label>
        <select v-model="processo">
          <option value="airBend">Air Bending</option>
          <option value="bottoming">Bottoming</option>
          <option value="coining">Coining</option>
        </select>
        <i class="info-icon" title="Metodo utilizzato per la piegatura">i</i>
      </div>
      
      <div class="form-row">
        <label>Metodo di calcolo:</label>
        <select v-model="metodo">
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
        <select v-model="materiale">
          <option value="acciaio">Acciaio</option>
          <option value="alluminio">Alluminio</option>
          <option value="rame">Rame</option>
          <option value="ottone">Ottone</option>
          <option value="inox">Acciaio Inox</option>
          <option value="titanio">Titanio</option>
        </select>
      </div>
      
      <div class="form-row">
        <label>Direzione grana:</label>
        <select v-model="direzione">
          <option value="parallelaPiega">Parallela alla piega</option>
          <option value="perpendicolarePiega">Perpendicolare alla piega</option>
        </select>
        <i class="info-icon" title="Orientamento della grana del materiale rispetto alla linea di piega">i</i>
      </div>
      
      <div class="form-row" v-if="hasBend">
        <label>Larghezza matrice (mm):</label>
        <input v-model.number="larghezzaMatrice" type="number" min="0" step="0.1" />
        <button @click="calcolaMatriceOttimale" class="btn-small">Auto</button>
      </div>
    </div>
    
    <div v-if="hasBend && risultatiAvanzati" class="results-advanced">
      <div class="result-card-group">
        <div class="result-card">
          <h3>Bend Allowance</h3>
          <div class="result-value">{{ risultatiAvanzati.bendAllowance.toFixed(2) }} mm</div>
        </div>
        
        <div class="result-card">
          <h3>Springback</h3>
          <div class="result-value">{{ risultatiAvanzati.springback.toFixed(2) }}°</div>
          <div class="result-note">Compensazione necessaria</div>
        </div>
        
        <div class="result-card">
          <h3>Angolo Macchina</h3>
          <div class="result-value">{{ risultatiAvanzati.angoloEffettivo.toFixed(2) }}°</div>
          <div class="result-note">Per ottenere {{ currentBendAngle }}°</div>
        </div>
      </div>
      
      <div class="result-card-group">
        <div class="result-card">
          <h3>Forza Richiesta</h3>
          <div class="result-value">{{ risultatiAvanzati.forzaPiega.forzaTon.toFixed(2) }} t</div>
          <div class="result-note">{{ risultatiAvanzati.forzaPiega.forzaKN.toFixed(2) }} kN</div>
        </div>
        
        <div class="result-card">
          <h3>V-Die Ottimale</h3>
          <div class="result-value">{{ risultatiAvanzati.aperturaMatrice.aperturaOttimale.toFixed(2) }} mm</div>
          <div class="result-note">Range: {{ risultatiAvanzati.aperturaMatrice.rangeConsigliato.min.toFixed(2) }} - {{ risultatiAvanzati.aperturaMatrice.rangeConsigliato.max.toFixed(2) }} mm</div>
        </div>
        
        <div class="result-card" :class="{ warning: !risultatiAvanzati.raggioAdeguato }">
          <h3>Raggio Minimo</h3>
          <div class="result-value">{{ risultatiAvanzati.raggioMinimo.toFixed(2) }} mm</div>
          <div v-if="!risultatiAvanzati.raggioAdeguato" class="result-warning">
            Raggio attuale troppo piccolo!
          </div>
        </div>
      </div>
      
      <div class="technical-details">
        <h3>Dettagli Tecnici</h3>
        <table>
          <tr>
            <td>Pressione Massima:</td>
            <td>{{ risultatiAvanzati.forzaPiega.pressioneMax.toFixed(2) }} N/mm²</td>
          </tr>
          <tr>
            <td>Setback:</td>
            <td>{{ risultatiAvanzati.setback.toFixed(2) }} mm</td>
          </tr>
          <tr>
            <td>Bend Deduction:</td>
            <td>{{ risultatiAvanzati.bendDeduction.toFixed(2) }} mm</td>
          </tr>
        </table>
      </div>
    </div>
    
    <div v-else-if="!hasBend" class="no-data-message">
      Aggiungi almeno un segmento con un angolo di piega per visualizzare i calcoli avanzati.
    </div>
  </section>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { calcoliAvanzatiPiegatura, calcolaAperturaMatrice } from '@/utils/BendingCalculatorAdvanced';

export default {
  name: 'AdvancedCalculations',
  props: {
    spessore: {
      type: Number,
      required: true
    },
    raggioPiega: {
      type: Number,
      required: true
    },
    segments: {
      type: Array,
      required: true
    },
    fattoreK: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // Parametri avanzati
    const processo = ref('airBend');
    const metodo = ref('standard');
    const materiale = ref('acciaio');
    const direzione = ref('parallelaPiega');
    const larghezzaMatrice = ref(0);
    const risultatiAvanzati = ref(null);
    
    // Calcola la lunghezza della piega attiva e l'angolo di piega
    const currentBend = computed(() => {
      if (props.segments.length < 2) return null;
      
      // Trova il primo segmento con angolo non zero
      for (let i = 1; i < props.segments.length; i++) {
        if (props.segments[i-1].angle && props.segments[i-1].angle !== 0) {
          return {
            angolo: props.segments[i-1].angle,
            lunghezza: props.segments[i].length
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
    
    // Calcola l'apertura ottimale della matrice
    const calcolaMatriceOttimale = () => {
      const apertura = calcolaAperturaMatrice(
        props.spessore,
        processo.value,
        materiale.value
      );
      larghezzaMatrice.value = apertura.aperturaOttimale;
    };
    
    // Esegui i calcoli avanzati
    const eseguiCalcoliAvanzati = () => {
      if (!hasBend.value) return;
      
      const params = {
        spessore: props.spessore,
        raggioPiega: props.raggioPiega,
        angolo: currentBend.value.angolo,
        lunghezzaPiega: currentBend.value.lunghezza,
        materiale: materiale.value,
        processo: processo.value,
        metodo: metodo.value,
        fattoreK: props.fattoreK,
        direzione: direzione.value,
        larghezzaMatrice: larghezzaMatrice.value || null
      };
      
      risultatiAvanzati.value = calcoliAvanzatiPiegatura(params);
    };
    
    // Inizializza la larghezza matrice
    watch(() => props.spessore, (newSpessore) => {
      calcolaMatriceOttimale();
    }, { immediate: true });
    
    // Aggiorna i calcoli quando cambiano i parametri
    watch(
      [
        () => props.spessore,
        () => props.raggioPiega,
        () => props.segments,
        () => props.fattoreK,
        processo,
        metodo,
        materiale,
        direzione,
        larghezzaMatrice
      ],
      eseguiCalcoliAvanzati,
      { deep: true }
    );
    
    return {
      processo,
      metodo,
      materiale,
      direzione,
      larghezzaMatrice,
      risultatiAvanzati,
      hasBend,
      currentBendAngle,
      calcolaMatriceOttimale
    };
  }
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

.parameters-advanced {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
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

.result-value {
  font-size: 24px;
  font-weight: bold;
  margin: 10px 0;
  color: #007bff;
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
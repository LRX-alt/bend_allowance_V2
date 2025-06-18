<template>
  <div class="di-furio-calculator">
    <h3>🏭 Calcolatore Di Furio</h3>
    <p class="subtitle">Metodo industriale con misure esterne delle flange</p>
    
    <div class="input-grid">
      <div class="input-group">
        <label for="angolo">Angolo O [°]:</label>
        <input 
          id="angolo"
          type="number" 
          v-model.number="angolo" 
          min="1" 
          max="180" 
          step="1"
          @input="calcolaRisultato"
        />
      </div>
      
      <div class="input-group">
        <label for="latoA">Lato A [mm]:</label>
        <input 
          id="latoA"
          type="number" 
          v-model.number="latoA" 
          min="0.1" 
          step="0.1"
          @input="calcolaRisultato"
        />
        <small>Misura esterna prima flangia</small>
      </div>
      
      <div class="input-group">
        <label for="latoB">Lato B [mm]:</label>
        <input 
          id="latoB"
          type="number" 
          v-model.number="latoB" 
          min="0.1" 
          step="0.1"
          @input="calcolaRisultato"
        />
        <small>Misura esterna seconda flangia</small>
      </div>
      
      <div class="input-group">
        <label for="fattoreK">Fattore K:</label>
        <input 
          id="fattoreK"
          type="number" 
          v-model.number="fattoreK" 
          min="0.1" 
          max="0.9" 
          step="0.01"
          @input="calcolaRisultato"
        />
      </div>
      
      <div class="input-group">
        <label for="raggioPiega">Raggio interno R [mm]:</label>
        <input 
          id="raggioPiega"
          type="number" 
          v-model.number="raggioPiega" 
          min="0.1" 
          step="0.1"
          @input="calcolaRisultato"
        />
      </div>
      
      <div class="input-group">
        <label for="spessore">Spessore T [mm]:</label>
        <input 
          id="spessore"
          type="number" 
          v-model.number="spessore" 
          min="0.1" 
          step="0.1"
          @input="calcolaRisultato"
        />
      </div>
    </div>
    
    <div class="results-section" v-if="risultato">
      <h4>📊 Risultati</h4>
      
      <div class="results-grid">
        <div class="result-card primary">
          <label>Bend Deduction:</label>
          <span class="value">{{ risultato.bendDeduction.toFixed(2) }} mm</span>
        </div>
        
        <div class="result-card primary">
          <label>Lunghezza da tagliare L:</label>
          <span class="value highlight">{{ risultato.lunghezzaDaTagliare.toFixed(2) }} mm</span>
        </div>
      </div>
      
      <div class="details-section">
        <h5>Dettagli calcoli</h5>
        <div class="details-grid">
          <div class="detail-item">
            <span>Bend Allowance:</span>
            <span>{{ risultato.bendAllowance.toFixed(2) }} mm</span>
          </div>
          <div class="detail-item">
            <span>Setback:</span>
            <span>{{ risultato.setback.toFixed(2) }} mm</span>
          </div>
          <div class="detail-item">
            <span>Formula:</span>
            <span>L = {{ latoA }} + {{ latoB }} - {{ risultato.bendDeduction.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { calcolaBendDeductionDiFurio } from '@/utils/BendingCalculator.js';

export default {
  name: 'DiFurioCalculator',
  props: {
    // Props dal calcolatore principale per confronto
    currentSpessore: {
      type: Number,
      default: 2.0
    },
    currentRaggioPiega: {
      type: Number,
      default: 1.0
    },
    currentFattoreK: {
      type: Number,
      default: 0.33
    }
  },
  setup(props) {
    // Stati locali del calcolatore Gasparini
    const angolo = ref(90);
    const latoA = ref(50);
    const latoB = ref(50);
    const fattoreK = ref(props.currentFattoreK);
    const raggioPiega = ref(props.currentRaggioPiega);
    const spessore = ref(props.currentSpessore);
    
    const risultato = ref(null);
    
    // Sincronizza con i props quando cambiano
    watch(() => props.currentSpessore, (newVal) => {
      spessore.value = newVal;
      calcolaRisultato();
    });
    
    watch(() => props.currentRaggioPiega, (newVal) => {
      raggioPiega.value = newVal;
      calcolaRisultato();
    });
    
    watch(() => props.currentFattoreK, (newVal) => {
      fattoreK.value = newVal;
      calcolaRisultato();
    });
    
    const calcolaRisultato = () => {
      if (angolo.value > 0 && latoA.value > 0 && latoB.value > 0 && 
          fattoreK.value > 0 && raggioPiega.value > 0 && spessore.value > 0) {
        
        risultato.value = calcolaBendDeductionDiFurio(
          angolo.value,
          latoA.value,
          latoB.value,
          fattoreK.value,
          raggioPiega.value,
          spessore.value
        );
      }
    };
    
    // Calcolo iniziale
    calcolaRisultato();
    
    return {
      angolo,
      latoA,
      latoB,
      fattoreK,
      raggioPiega,
      spessore,
      risultato,
      calcolaRisultato
    };
  }
};
</script>

<style scoped>
.di-furio-calculator {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #007bff;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.subtitle {
  color: #6c757d;
  font-style: italic;
  margin-bottom: 20px;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #495057;
}

.input-group input {
  padding: 8px 12px;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
}

.input-group small {
  color: #6c757d;
  font-size: 12px;
  margin-top: 3px;
}

.results-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.result-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
}

.result-card.primary {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left-color: #1976d2;
}

.result-card label {
  font-weight: 600;
  color: #495057;
}

.result-card .value {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
}

.result-card .value.highlight {
  background: #4caf50;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
}

.details-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}
</style> 
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
          min="0.2" 
          max="0.6" 
          step="0.01"
          @input="calcolaRisultato"
        />
        <small>Range tipico: 0.2 0.6. Cambia automaticamente con il materiale.</small>
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
        <div class="status-row">
          <span class="radius-badge" :class="raggioNonValido ? 'critical' : 'ok'">
            {{ raggioNonValido ? 'Critico' : 'OK' }}
          </span>
          <button type="button" class="set-radius-btn" @click="impostaRaggioConsigliato">
            Imposta R consigliato ({{ raggioMinimoConsigliato.toFixed(2) }} mm)
          </button>
        </div>
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

      <div class="input-group">
        <label for="materiale">Materiale:</label>
        <select id="materiale" v-model="materialeSelezionatoId" @change="onMaterialChange">
          <option v-for="materiale in materiali" :key="materiale.id" :value="materiale.id">
            {{ materiale.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="validation-warning" v-if="raggioNonValido">
      ⚠️ Attenzione: Il raggio di piega inserito ({{ raggioPiega }} mm) è inferiore al raggio minimo consigliato 
      ({{ raggioMinimoConsigliato.toFixed(2) }} mm) per questo materiale e spessore. La piega potrebbe causare cricche.
    </div>

    <div class="work-suggestions">
      <h5>Consigli di lavorazione</h5>
      <div class="suggestions-grid">
        <div class="suggestion-item">
          <span>V consigliata:</span>
          <span>{{ vDieConsigliata.toFixed(1) }} mm</span>
        </div>
        <div class="suggestion-item">
          <span>Angolo pressa (comp. springback):</span>
          <span>{{ angoloPressaConsigliato.toFixed(1) }}°</span>
        </div>
      </div>
      <small class="hint-note">Basato su materiale selezionato (V ≈ fattore × T, springback ≈ {{ (springbackPercent*100).toFixed(0) }}%).</small>
      <div v-if="isSpessoreAlto" class="thickness-warning">
        ⚠️ Spessore elevato: usa V più ampie (es. {{ vDieConsigliata.toFixed(1) }} mm) e verifica la forza pressa.
      </div>
      <div v-if="materialeAvviso" class="material-warning">
        {{ materialeAvviso }}
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
import { ref, computed, watch, onMounted } from 'vue';
import { calcolaBendDeductionDiFurio } from '@/utils/BendingCalculator.js';
import { materialsDatabase, getMaterialById } from '@/utils/MaterialsDatabase.js';
import { calcolaAperturaMatrice } from '@/utils/BendingCalculatorAdvanced.js';

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
    const materiali = ref(materialsDatabase);
    const materialeSelezionatoId = ref('steel_mild'); // Default
    const materialeSelezionato = ref(getMaterialById(materialeSelezionatoId.value));

    const raggioMinimoConsigliato = computed(() => {
      if (!materialeSelezionato.value || !spessore.value) return 0;
      // Usiamo il raggio minimo perpendicolare, che è più restrittivo
      const minRadiusFactor = materialeSelezionato.value.bending.minRadiusPerpendicular || 0.5;
      return minRadiusFactor * spessore.value;
    });

    const raggioNonValido = computed(() => {
      return raggioPiega.value < raggioMinimoConsigliato.value;
    });

    // Mappa l'ID del materiale (database) alla chiave usata nei calcoli avanzati
    const materialeKey = computed(() => {
      const id = materialeSelezionatoId.value || '';
      if (id.startsWith('steel_stainless')) return 'inox';
      if (id.startsWith('steel_')) return 'acciaio';
      if (id.startsWith('aluminum_')) return 'alluminio';
      if (id.startsWith('copper_')) return 'rame';
      if (id.startsWith('brass_')) return 'ottone';
      if (id.startsWith('titanium_')) return 'titanio';
      return 'acciaio';
    });
    
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
    
    const onMaterialChange = () => {
      materialeSelezionato.value = getMaterialById(materialeSelezionatoId.value);
      if (materialeSelezionato.value) {
        fattoreK.value = materialeSelezionato.value.bending.kFactor;
        // Potremmo anche suggerire un raggio di piega, ma per ora aggiorniamo solo K
      }
      calcolaRisultato();
    };

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
    
    const impostaRaggioConsigliato = () => {
      if (raggioMinimoConsigliato.value > 0) {
        raggioPiega.value = Number(raggioMinimoConsigliato.value.toFixed(2));
        calcolaRisultato();
      }
    };

    const springbackPercent = computed(() => {
      return (materialeSelezionato.value && materialeSelezionato.value.bending?.springback) || 0;
    });

    const vDieConsigliata = computed(() => {
      const apertura = calcolaAperturaMatrice(
        spessore.value || 0,
        'airBend',
        materialeKey.value
      );
      return apertura.aperturaOttimale;
    });

    const angoloPressaConsigliato = computed(() => {
      const s = (materialeSelezionato.value && materialeSelezionato.value.bending?.springback) || 0;
      const val = angolo.value * (1 - s);
      return Math.max(1, val);
    });

    const isSpessoreAlto = computed(() => spessore.value >= 10);

    const materialeAvviso = computed(() => {
      const m = (materialeKey.value || '').toLowerCase();
      if (m === 'inox') {
        return 'Acciaio Inox: maggiore forza e springback (~7–10%). Preferisci V più ampia e raggio ≥ 1.0×T.';
      }
      if (m === 'titanio') {
        return 'Titanio: forza elevata e springback (~12%). Usa V molto ampia (+20%) e raggio ≥ 2.5–3.5×T.';
      }
      if (m === 'alluminio') {
        return 'Alluminio: springback ~8%. Considera sovra-piega e protezioni anti-segno.';
      }
      return null;
    });
    
    // Calcolo iniziale all'avvio
    onMounted(() => {
      onMaterialChange(); // Per impostare i valori iniziali del materiale di default
    });
    
    return {
      angolo,
      latoA,
      latoB,
      fattoreK,
      raggioPiega,
      spessore,
      risultato,
      calcolaRisultato,
      materiali,
      materialeSelezionatoId,
      onMaterialChange,
      raggioMinimoConsigliato,
      raggioNonValido,
      impostaRaggioConsigliato,
      springbackPercent,
      vDieConsigliata,
      angoloPressaConsigliato,
      isSpessoreAlto,
      materialeAvviso
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

.validation-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  font-weight: 500;
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

.work-suggestions {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px 12px;
}

.hint-note {
  color: #6c757d;
}

.thickness-warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 13px;
}

.material-warning {
  background: #e7f3ff;
  border: 1px solid #b6daff;
  color: #084298;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 13px;
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

.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.radius-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.radius-badge.ok {
  background-color: #e6f4ea;
  color: #1e7e34;
  border: 1px solid #c3e6cb;
}

.radius-badge.critical {
  background-color: #fce8e6;
  color: #b21f2d;
  border: 1px solid #f5c6cb;
}

.set-radius-btn {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
}

.set-radius-btn:hover {
  background: #125a9c;
}
</style> 
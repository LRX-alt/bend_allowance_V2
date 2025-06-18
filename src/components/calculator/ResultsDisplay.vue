<template>
  <div class="modern-results">
    <h2 class="panel-title">Risultati</h2>

    <!-- Risultato principale: sviluppo totale -->
    <div class="main-result">
      <div class="result-label">Sviluppo Totale</div>
      <div class="result-value">{{ (risultato * unitFactor).toFixed(2) }} {{ unitLabel }}</div>
    </div>

    <!-- Altri risultati in grid -->
    <div class="results-grid">
      <!-- Bend Allowance -->
      <div class="result-card" v-if="hasBendAllowance">
        <div class="result-label">Bend Allowance</div>
        <div class="result-value">{{ formatValue(bendAllowance) }}</div>
      </div>

      <!-- Setback -->
      <div class="result-card" v-if="hasSetback">
        <div class="result-label">Setback</div>
        <div class="result-value">{{ formatValue(setback) }}</div>
      </div>

      <!-- Bend Deduction -->
      <div class="result-card" v-if="hasBendDeduction">
        <div class="result-label">Bend Deduction</div>
        <div class="result-value">{{ formatValue(bendDeduction) }}</div>
      </div>

      <!-- Raggio Effettivo -->
      <div class="result-card highlight" v-if="hasRaggioEffettivo">
        <div class="result-label">Raggio Effettivo</div>
        <div class="result-value">{{ formatValue(raggioEffettivo) }}</div>
        <div class="result-note">
          Calcolato dalla matrice (V-die: {{ formatValue(larghezzaMatrice) }})
        </div>
      </div>
    </div>

    <!-- Toggles per modalità avanzata e altre opzioni -->
    <div class="results-options">
      <label class="toggle-switch">
        <input
          type="checkbox"
          v-model="usaCalcoliAvanzatiLocal"
          @change="$emit('update:usaCalcoliAvanzati', usaCalcoliAvanzatiLocal)"
        />
        <span class="toggle-slider"></span>
        <span class="toggle-label">Modalità avanzata</span>
      </label>
      
      <div class="calculation-mode-info" v-if="hasRaggioEffettivo">
        <div class="info-card warning">
          <h4>⚠️ Attenzione</h4>
          <p><strong>Modalità Standard:</strong> Usa il raggio interno nominale ({{ formatValue(raggioPiega) }})</p>
          <p><strong>Modalità Avanzata:</strong> Usa il raggio effettivo dalla matrice ({{ formatValue(raggioEffettivo) }})</p>
          <p class="recommendation">
            💡 <strong>Consiglio:</strong> Usa la modalità standard per confronti con tabelle/referenze industriali, 
            e la modalità avanzata per calcoli precisi con la tua macchina specifica.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'ResultsDisplay',
  props: {
    dettagli: {
      type: Array,
      required: true,
    },
    risultato: {
      type: Number,
      required: true,
    },
    segments: {
      type: Array,
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
    usaCalcoliAvanzati: {
      type: Boolean,
      default: false,
    },
    risultatiAvanzati: {
      type: Object,
      default: null,
    },
    dettagliStandard: {
      type: Array,
      default: () => [],
    },
    isAdvancedRecommended: {
      type: Boolean,
      default: false,
    },
    raggioEffettivo: {
      type: Number,
      default: null,
    },
    larghezzaMatrice: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:usaCalcoliAvanzati'],
  setup(props) {
    const usaCalcoliAvanzatiLocal = ref(props.usaCalcoliAvanzati);

    // Watch per sincronizzare lo stato
    watch(
      () => props.usaCalcoliAvanzati,
      newValue => {
        usaCalcoliAvanzatiLocal.value = newValue;
      }
    );

    // Computed per verificare se ci sono valori da mostrare
    const hasBendAllowance = computed(() => {
      if (props.usaCalcoliAvanzati && props.risultatiAvanzati) {
        return props.risultatiAvanzati.bendAllowance > 0;
      }
      return props.dettagli.length > 1 && props.dettagli[1]?.bendAllowance > 0;
    });

    const hasSetback = computed(() => {
      if (props.usaCalcoliAvanzati && props.risultatiAvanzati) {
        return props.risultatiAvanzati.setback > 0;
      }
      return props.dettagli.length > 1 && props.dettagli[1]?.setback > 0;
    });

    const hasBendDeduction = computed(() => {
      if (props.usaCalcoliAvanzati && props.risultatiAvanzati) {
        return props.risultatiAvanzati.bendDeduction !== null;
      }
      return props.dettagli.length > 1 && props.dettagli[1]?.bendDeduction !== null;
    });

    const hasRaggioEffettivo = computed(() => {
      return props.raggioEffettivo !== null && props.larghezzaMatrice > 0;
    });

    // Computed per ottenere i valori corretti
    const bendAllowance = computed(() => {
      if (props.usaCalcoliAvanzati && props.risultatiAvanzati) {
        return props.risultatiAvanzati.bendAllowance;
      }
      return props.dettagli.length > 1 ? props.dettagli[1]?.bendAllowance : 0;
    });

    const setback = computed(() => {
      if (props.usaCalcoliAvanzati && props.risultatiAvanzati) {
        return props.risultatiAvanzati.setback;
      }
      return props.dettagli.length > 1 ? props.dettagli[1]?.setback : 0;
    });

    const bendDeduction = computed(() => {
      if (props.usaCalcoliAvanzati && props.risultatiAvanzati) {
        return props.risultatiAvanzati.bendDeduction;
      }
      return props.dettagli.length > 1 ? props.dettagli[1]?.bendDeduction : 0;
    });

    // Helper per formattare i valori
    const formatValue = value => {
      if (value === null || value === undefined) return '-';
      return `${(value * props.unitFactor).toFixed(2)} ${props.unitLabel}`;
    };

    return {
      usaCalcoliAvanzatiLocal,
      hasBendAllowance,
      hasSetback,
      hasBendDeduction,
      hasRaggioEffettivo,
      bendAllowance,
      setback,
      bendDeduction,
      formatValue,
    };
  },
};
</script>

<style scoped>
.modern-results {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #212529;
}

.main-result {
  background-color: #d1e7dd;
  color: #0f5132;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.main-result .result-label {
  font-size: 16px;
  font-weight: 400;
}

.main-result .result-value {
  font-size: 32px;
  font-weight: 700;
  margin-top: 5px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.result-card {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.result-card .result-label {
  font-size: 14px;
  color: #495057;
}

.result-card .result-value {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  margin-top: 5px;
}

.result-card .result-note {
  font-size: 12px;
  color: #6c757d;
  margin-top: 5px;
}

.result-card.highlight {
  background-color: #cff4fc;
}

.result-card.highlight .result-label {
  color: #055160;
}

.result-card.highlight .result-value {
  color: #055160;
}

.results-options {
  border-top: 1px solid #e9ecef;
  padding-top: 15px;
  margin-top: 15px;
}

.toggle-switch {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  background-color: #ced4da;
  border-radius: 20px;
  margin-right: 10px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s;
}

input:checked + .toggle-slider {
  background-color: #0d6efd;
}

input:checked + .toggle-slider:before {
  transform: translateX(16px);
}

.toggle-label {
  font-size: 14px;
  color: #495057;
}

.calculation-mode-info {
  margin-top: 15px;
}

.info-card {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
}

.info-card h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.info-card p {
  margin-bottom: 10px;
}

.info-card .recommendation {
  font-size: 14px;
  color: #6c757d;
}
</style>

<template>
  <div class="modern-parameters-panel">
    <h2 class="panel-title">Materiale</h2>

    <!-- Selezione materiale -->
    <div class="parameter-row">
      <label class="parameter-label">Materiale</label>
      <select
        v-model="materialeSelezionatoLocal"
        class="parameter-select"
        @change="updateMateriale"
      >
        <option value="acciaio">Acciaio</option>
        <option value="alluminio">Alluminio</option>
        <option value="rame">Rame</option>
        <option value="ottone">Ottone</option>
        <option value="inox">Acciaio Inox</option>
        <option value="titanio">Titanio</option>
      </select>
    </div>

    <!-- Spessore -->
    <div class="parameter-row">
      <div class="parameter-header">
        <label class="parameter-label">Spessore</label>
        <span class="parameter-value"
          >{{ (spessoreLocal * unitFactor).toFixed(1) }} {{ unitLabel }}</span
        >
      </div>
      <div class="parameter-slider-container">
        <input
          type="range"
          v-model.number="spessoreIndex"
          :min="0"
          :max="spessoriStandard.length - 1"
          :step="1"
          class="parameter-slider"
          @input="updateSpessore"
        />
      </div>
      <div class="parameter-input-group" style="margin-top: 8px;">
        <select
          v-model.number="quickSpessoreSelezionato"
          class="parameter-select"
          @change="applyQuickSpessore"
        >
          <option :value="null">Seleziona spessore rapido</option>
          <option v-for="qs in quickSpessori" :key="qs" :value="qs">{{ qs }} mm</option>
        </select>
      </div>
      <div v-if="isSpessoreAlto" class="thickness-warning">
        ⚠️ Spessore elevato: usa V più ampie (es. {{ matriceConsigliata }} mm) e verifica la forza pressa.
      </div>
      <div v-if="materialeAvviso" class="material-warning">
        {{ materialeAvviso }}
      </div>
    </div>

    <!-- Raggio piega -->
    <div class="parameter-row">
      <div class="parameter-header">
        <label class="parameter-label">Raggio di piega</label>
        <span class="parameter-value"
          >{{ (raggioPiegaLocal * unitFactor).toFixed(1) }} {{ unitLabel }}</span
        >
      </div>
      <div class="parameter-slider-container">
        <input
          type="range"
          v-model.number="raggioPiegaLocal"
          min="0.1"
          max="10"
          step="0.1"
          class="parameter-slider"
          @input="updateRaggioPiega"
        />
      </div>
    </div>

    <!-- Fattore K -->
    <div class="parameter-row">
      <div class="parameter-header">
        <label class="parameter-label">Fattore K</label>
        <span class="parameter-value">{{ fattoreKLocal.toFixed(2) }}</span>
      </div>
      <div class="parameter-input-group">
        <input
          type="number"
          v-model.number="fattoreKLocal"
          min="0.01"
          max="0.5"
          step="0.01"
          class="parameter-input"
          @input="updateFattoreK"
        />
        <button class="btn-auto" @click="setDynamicK">Auto</button>
      </div>
    </div>

    <h2 class="panel-title process-title">Processo</h2>

    <!-- Processo di piegatura -->
    <div class="parameter-row">
      <label class="parameter-label">Processo</label>
      <select v-model="processoLocal" class="parameter-select" @change="updateProcesso">
        <option value="airBend">Air Bending</option>
        <option value="bottoming">Bottoming</option>
        <option value="coining">Coining</option>
      </select>
    </div>

    <!-- Larghezza matrice -->
    <div class="parameter-row">
      <div class="parameter-header">
        <label class="parameter-label">Larghezza Matrice (V-die)</label>
        <span class="parameter-value formula-indicator">
          {{ (larghezzaMatriceLocal * unitFactor).toFixed(1) }} {{ unitLabel }}
          <small v-if="matriceStandardSelezionata !== 'custom'">(Standard)</small>
          <small v-else>(Personalizzata)</small>
        </span>
      </div>
      <div class="parameter-input-group">
        <!-- Dropdown matrici standard -->
        <select
          v-model="matriceStandardSelezionata"
          class="parameter-select matrix-select"
          @change="aggiornaMatriceStandard"
        >
          <option v-for="matrice in matriciStandardIndustriali" :key="matrice.value" :value="matrice.value">
            {{ matrice.label }}
          </option>
          <option value="custom">Personalizzata</option>
        </select>

        <!-- Input per valore personalizzato -->
        <input
          v-if="matriceStandardSelezionata === 'custom'"
          type="number"
          v-model.number="larghezzaMatriceCustom"
          min="1"
          step="0.5"
          class="parameter-input matrix-custom-input"
          placeholder="mm"
          @input="updateLarghezzaMatriceCustom"
        />

        <button class="btn-auto" @click="calcolaMatriceOttimale" title="Seleziona matrice ottimale per lo spessore">
          Auto
        </button>
      </div>

      <!-- Info matrici consigliate -->
      <div class="matrix-hint">
        <small>Consigliata per {{ spessoreLocal }}mm: <strong>{{ matriceConsigliata }}mm</strong></small>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue';
import { calcolaAperturaMatrice } from '@/utils/BendingCalculatorAdvanced.js';

export default {
  name: 'ParametersInput',
  props: {
    spessore: {
      type: Number,
      required: true,
    },
    raggioPiega: {
      type: Number,
      required: true,
    },
    materialeSelezionato: {
      type: String,
      default: 'acciaio',
    },
    fattoreK: {
      type: Number,
      default: 0.33,
    },
    fattoreKDinamico: {
      type: Boolean,
      default: false,
    },
    metodoDiCalcolo: {
      type: String,
      default: 'standard',
    },
    processo: {
      type: String,
      default: 'airBend',
    },
    larghezzaMatrice: {
      type: Number,
      default: 0,
    },
    fattoriKMateriali: {
      type: Object,
      default: () => ({
        acciaio: 0.33,
        alluminio: 0.4,
        rame: 0.45,
        ottone: 0.42,
        inox: 0.38,
        titanio: 0.35,
      }),
    },
    unitFactor: {
      type: Number,
      default: 1,
    },
    unitLabel: {
      type: String,
      default: 'mm',
    },
    
  },
  emits: [
    'update:spessore',
    'update:raggioPiega',
    'update:materialeSelezionato',
    'update:fattoreK',
    'update:fattoreKDinamico',
    'update:metodoDiCalcolo',
    'update:processo',
          'update:larghezzaMatrice',
      'update:fattoriKMateriali',
  ],
  setup(props, { emit }) {
    // Definizione delle matrici V-die standard industriali
    const matriciStandardIndustriali = [
      { value: 6, label: '6mm (per spessori 0.5-1mm)', spessoreMin: 0.5, spessoreMax: 1.0 },
      { value: 8, label: '8mm (per spessori 1-1.5mm)', spessoreMin: 1.0, spessoreMax: 1.5 },
      { value: 12, label: '12mm (per spessori 1.5-2mm)', spessoreMin: 1.5, spessoreMax: 2.0 },
      { value: 16, label: '16mm (per spessori 2-2.5mm)', spessoreMin: 2.0, spessoreMax: 2.5 },
      { value: 20, label: '20mm (per spessori 2.5-3mm)', spessoreMin: 2.5, spessoreMax: 3.0 },
      { value: 24, label: '24mm (per spessori 3-4mm)', spessoreMin: 3.0, spessoreMax: 4.0 },
      { value: 32, label: '32mm (per spessori 4-5mm)', spessoreMin: 4.0, spessoreMax: 5.0 },
      { value: 40, label: '40mm (per spessori 5-6mm)', spessoreMin: 5.0, spessoreMax: 6.0 },
      { value: 50, label: '50mm (per spessori 6-8mm)', spessoreMin: 6.0, spessoreMax: 8.0 },
      { value: 60, label: '60mm (per spessori 8-10mm)', spessoreMin: 8.0, spessoreMax: 10.0 },
      { value: 80, label: '80mm (per spessori 10-12mm)', spessoreMin: 10.0, spessoreMax: 12.0 },
      { value: 100, label: '100mm (per spessori 12-14mm)', spessoreMin: 12.0, spessoreMax: 14.0 },
      { value: 120, label: '120mm (per spessori 14-16mm)', spessoreMin: 14.0, spessoreMax: 16.0 },
      { value: 140, label: '140mm (per spessori 16-18mm)', spessoreMin: 16.0, spessoreMax: 18.0 },
      { value: 160, label: '160mm (per spessori 18-20mm)', spessoreMin: 18.0, spessoreMax: 20.0 },
    ];

    // Lista di spessori standard per lamiera (mm)
    const spessoriStandard = [
      0.5, 0.6, 0.7, 0.8, 0.9,
      1.0, 1.2, 1.5, 2.0, 2.5,
      3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 15.0, 20.0
    ];

    // Quick select: spessori comuni
    const quickSpessori = [2.0, 3.0, 5.0, 10.0, 15.0, 20.0];
    const quickSpessoreSelezionato = ref(null);

    // Stati reattivi locali
    const spessoreLocal = ref(props.spessore);
    const spessoreIndex = ref(0);
    const raggioPiegaLocal = ref(props.raggioPiega);
    const materialeSelezionatoLocal = ref(props.materialeSelezionato);
    const fattoreKLocal = ref(props.fattoreK);
    const processoLocal = ref(props.processo);
    const larghezzaMatriceLocal = ref(props.larghezzaMatrice);
    
    // Trova la matrice standard corrispondente al valore attuale
    const trovaMatriceStandard = (larghezza) => {
      return matriciStandardIndustriali.find(m => m.value === larghezza);
    };
    
    const matriceStandardSelezionata = ref(
      trovaMatriceStandard(props.larghezzaMatrice)?.value || 'custom'
    );
    const larghezzaMatriceCustom = ref(props.larghezzaMatrice);

    // Calcola la matrice consigliata per lo spessore attuale
    const matriceConsigliata = computed(() => {
      const spessore = spessoreLocal.value;
      const matrice = matriciStandardIndustriali.find(m => 
        spessore >= m.spessoreMin && spessore <= m.spessoreMax
      );
      return matrice ? matrice.value : Math.max(16, Math.round(spessore * 8));
    });

    // Helper: trova l'indice nello slider più vicino allo spessore richiesto
    const findClosestIndex = (value) => {
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < spessoriStandard.length; i++) {
        const diff = Math.abs(spessoriStandard[i] - value);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      return closestIdx;
    };

    // Inizializza lo slider in base allo spessore iniziale
    spessoreIndex.value = findClosestIndex(spessoreLocal.value);
    spessoreLocal.value = spessoriStandard[spessoreIndex.value];

    const isSpessoreAlto = computed(() => spessoreLocal.value >= 10);

    // Avvisi dinamici per materiale
    const materialeAvviso = computed(() => {
      const m = (materialeSelezionatoLocal.value || '').toLowerCase();
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

    // Handlers per aggiornare i valori
    const updateSpessore = () => {
      spessoreLocal.value = spessoriStandard[spessoreIndex.value];
      emit('update:spessore', spessoreLocal.value);
    };

    const applyQuickSpessore = () => {
      if (quickSpessoreSelezionato.value !== null) {
        spessoreIndex.value = findClosestIndex(quickSpessoreSelezionato.value);
        updateSpessore();
      }
    };

    const updateRaggioPiega = () => {
      emit('update:raggioPiega', raggioPiegaLocal.value);
    };

    const updateMateriale = () => {
      emit('update:materialeSelezionato', materialeSelezionatoLocal.value);
      // Aggiorna anche il fattore K in base al materiale selezionato
      if (props.fattoriKMateriali[materialeSelezionatoLocal.value]) {
        fattoreKLocal.value = props.fattoriKMateriali[materialeSelezionatoLocal.value];
        emit('update:fattoreK', fattoreKLocal.value);
      }
    };

    const updateFattoreK = () => {
      emit('update:fattoreK', fattoreKLocal.value);
      emit('update:fattoreKDinamico', false); // Disattiva la modalità dinamica
    };

    const setDynamicK = () => {
      emit('update:fattoreKDinamico', true);
      // Ricarica il fattore K dal materiale come valore iniziale
      if (props.fattoriKMateriali[materialeSelezionatoLocal.value]) {
        fattoreKLocal.value = props.fattoriKMateriali[materialeSelezionatoLocal.value];
        emit('update:fattoreK', fattoreKLocal.value);
      }
    };

    const updateProcesso = () => {
      emit('update:processo', processoLocal.value);
    };

    const updateLarghezzaMatrice = () => {
      emit('update:larghezzaMatrice', larghezzaMatriceLocal.value);
    };

    const aggiornaMatriceStandard = () => {
      if (matriceStandardSelezionata.value !== 'custom') {
        const matrice = matriciStandardIndustriali.find(m => m.value === matriceStandardSelezionata.value);
        if (matrice) {
          larghezzaMatriceLocal.value = matrice.value;
          updateLarghezzaMatrice();
        }
      }
    };

    const updateLarghezzaMatriceCustom = () => {
      larghezzaMatriceLocal.value = larghezzaMatriceCustom.value;
      updateLarghezzaMatrice();
    };

    const calcolaMatriceOttimale = () => {
      const matriceOttimale = matriceConsigliata.value;
      const matriceStandard = trovaMatriceStandard(matriceOttimale);
      
      if (matriceStandard) {
        // Usa matrice standard
        matriceStandardSelezionata.value = matriceStandard.value;
        larghezzaMatriceLocal.value = matriceStandard.value;
      } else {
        // Usa valore personalizzato
        matriceStandardSelezionata.value = 'custom';
        larghezzaMatriceCustom.value = matriceOttimale;
        larghezzaMatriceLocal.value = matriceOttimale;
      }
      
      updateLarghezzaMatrice();
    };

    // Watch per aggiornare i valori locali quando cambiano le props
    watch(
      () => props.spessore,
      newValue => {
        spessoreIndex.value = findClosestIndex(newValue);
        spessoreLocal.value = spessoriStandard[spessoreIndex.value];
        // Non aggiorniamo più automaticamente - l'utente può scegliere
        // usando il pulsante "Auto" o selezionando dalla lista
      }
    );

    watch(
      () => props.raggioPiega,
      newValue => {
        raggioPiegaLocal.value = newValue;
      }
    );

    watch(
      () => props.materialeSelezionato,
      newValue => {
        materialeSelezionatoLocal.value = newValue;
      }
    );

    watch(
      () => props.fattoreK,
      newValue => {
        fattoreKLocal.value = newValue;
      }
    );

    watch(
      () => props.processo,
      newValue => {
        processoLocal.value = newValue;
      }
    );

    watch(
      () => props.larghezzaMatrice,
      newValue => {
        larghezzaMatriceLocal.value = newValue;
      }
    );



    return {
      spessoreLocal,
      spessoreIndex,
      spessoriStandard,
      quickSpessori,
      quickSpessoreSelezionato,
      isSpessoreAlto,
      materialeAvviso,
      raggioPiegaLocal,
      materialeSelezionatoLocal,
      fattoreKLocal,
      processoLocal,
      larghezzaMatriceLocal,
      matriceStandardSelezionata,
      larghezzaMatriceCustom,
      matriciStandardIndustriali,
      matriceConsigliata,
      trovaMatriceStandard,
      updateSpessore,
      applyQuickSpessore,
      updateRaggioPiega,
      updateMateriale,
      updateFattoreK,
      setDynamicK,
      updateProcesso,
      updateLarghezzaMatrice,
      aggiornaMatriceStandard,
      updateLarghezzaMatriceCustom,
      calcolaMatriceOttimale,
    };
  },
};
</script>

<style scoped>
.modern-parameters-panel {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #212529;
}

.process-title {
  margin-top: 20px;
}

.parameter-row {
  margin-bottom: 20px;
}

.parameter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.parameter-label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.parameter-value {
  font-size: 14px;
  color: #6c757d;
}

.parameter-slider-container {
  width: 100%;
  padding: 0 4px;
}

.parameter-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #dee2e6;
  outline: none;
  border-radius: 4px;
}

.parameter-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #0d6efd;
  cursor: pointer;
  border-radius: 50%;
}

.parameter-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #0d6efd;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}

.parameter-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  color: #212529;
}

.parameter-input-group {
  display: flex;
  gap: 10px;
}

.parameter-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.btn-auto {
  padding: 8px 12px;
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-auto:hover {
  background-color: #0b5ed7;
}

.formula-indicator small {
  color: #6c757d;
  font-weight: normal;
}

.matrix-hint {
  margin-top: 5px;
  text-align: center;
}

.matrix-hint small {
  color: #28a745;
  font-style: italic;
}

.parameter-select {
  padding: 8px 12px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  flex: 1;
  margin-right: 8px;
  transition: border-color 0.2s ease;
}

.parameter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.matrix-select {
  min-width: 200px;
}

.matrix-custom-input {
  flex: 0 0 80px;
  margin-left: 8px;
  margin-right: 8px;
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
</style>

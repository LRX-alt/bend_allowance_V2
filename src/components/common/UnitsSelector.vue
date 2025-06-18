<template>
  <div class="units-selector">
    <label>Unità di misura:</label>
    <select v-model="selectedUnit" @change="updateUnits">
      <option value="mm">Millimetri (mm)</option>
      <option value="inch">Pollici (in)</option>
      <option value="gauge">Gauge (ga)</option>
    </select>

    <div class="unit-conversion" v-if="showConversionInfo">
      <div class="conversion-info">
        <p>
          <strong>Conversione attuale:</strong><br />
          1 {{ unitLabels[selectedUnit] }} = {{ conversionFactors[selectedUnit].toFixed(4) }} mm
        </p>
        <button @click="showConversionInfo = false" class="btn-close">Chiudi</button>
      </div>
    </div>

    <button @click="showConversionInfo = true" class="btn-info">i</button>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'UnitsSelector',
  emits: ['update:unit'],
  setup(props, { emit }) {
    const selectedUnit = ref('mm');
    const showConversionInfo = ref(false);

    const unitLabels = {
      mm: 'millimetro',
      inch: 'pollice',
      gauge: 'gauge',
    };

    const conversionFactors = {
      mm: 1,
      inch: 25.4,
      gauge: 0.335, // Questo valore cambia in base allo standard di gauge (qui è un esempio)
    };

    // Gauge to mm conversion chart (esempio)
    const gaugeToMm = {
      10: 3.4,
      12: 2.7,
      14: 1.9,
      16: 1.5,
      18: 1.2,
      20: 0.9,
      22: 0.7,
      24: 0.6,
      26: 0.5,
      28: 0.4,
      30: 0.3,
    };

    const updateUnits = () => {
      emit('update:unit', {
        unit: selectedUnit.value,
        factor: conversionFactors[selectedUnit.value],
      });
    };

    // Emetti l'unità iniziale
    watch(selectedUnit, updateUnits, { immediate: true });

    return {
      selectedUnit,
      showConversionInfo,
      unitLabels,
      conversionFactors,
      updateUnits,
    };
  },
};
</script>

<style scoped>
.units-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.btn-info {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  border: none;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unit-conversion {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  margin-top: 5px;
}

.conversion-info {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  min-width: 250px;
}

.btn-close {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 10px;
}
</style>

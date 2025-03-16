<template>
  <section class="parameters-section">
    <h2>Parametri Generali</h2>
    <div class="form-row">
      <label>Spessore lamiera (mm) (T):</label>
      <input 
        :value="spessore" 
        @input="$emit('update:spessore', parseFloat($event.target.value))" 
        type="number" 
        step="0.1" 
        min="0.1" 
        required 
        @change="validateThickness"
      />
      <p v-if="errors.spessore" class="error-message">
        Il valore dello spessore deve essere maggiore di 0.
      </p>
    </div>
    <!-- Altri parametri... -->
  </section>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'ParametersInput',
  props: {
    spessore: Number,
    raggioPiega: Number,
    materialeSelezionato: String,
    fattoreK: Number,
    fattoreKDinamico: Boolean,
    fattoriKMateriali: Object
  },
  emits: [
    'update:spessore',
    'update:raggioPiega',
    'update:materialeSelezionato',
    'update:fattoreK',
    'update:fattoreKDinamico',
    'update:fattoriKMateriali'
  ],
  setup(props, { emit }) {
    const errors = ref({
      spessore: false,
      raggioPiega: false
    });
    
    const nuovoMateriale = ref({
      nome: '',
      fattoreK: 0
    });
    
    const validateThickness = () => {
      errors.value.spessore = props.spessore <= 0;
    };
    
    const validateRadius = () => {
      errors.value.raggioPiega = props.raggioPiega < 0;
    };
    
    const aggiornaFattoreK = () => {
      if (props.materialeSelezionato && props.fattoriKMateriali[props.materialeSelezionato]) {
        emit('update:fattoreK', props.fattoriKMateriali[props.materialeSelezionato]);
      }
    };
    
    const aggiungiMateriale = () => {
      if (nuovoMateriale.value.nome && nuovoMateriale.value.fattoreK > 0) {
        const nuoviFattori = { ...props.fattoriKMateriali };
        nuoviFattori[nuovoMateriale.value.nome] = nuovoMateriale.value.fattoreK;
        emit('update:fattoriKMateriali', nuoviFattori);
        
        nuovoMateriale.value.nome = '';
        nuovoMateriale.value.fattoreK = 0;
      }
    };
    
    // Watch per validare automaticamente dopo cambiamenti
    watch(() => props.spessore, validateThickness);
    watch(() => props.raggioPiega, validateRadius);
    
    return {
      errors,
      nuovoMateriale,
      validateThickness,
      validateRadius,
      aggiornaFattoreK,
      aggiungiMateriale
    };
  }
};
</script>

<style scoped>
.parameters-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.form-row {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

/* Altri stili... */
</style>
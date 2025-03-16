<template>
  <section class="segments-section">
    <h2>Segmenti</h2>
    <div v-for="(segment, index) in modelValue" :key="index" class="segmento">
      <div class="form-row">
        <label>Lunghezza segmento {{ index + 1 }} (mm):</label>
        <input 
          v-model.number="segment.length" 
          type="number" 
          step="0.1" 
          min="0.1" 
          required 
          @input="validateLength(segment)" 
        />
        <p v-if="segment.errorLength" class="error-message">La lunghezza deve essere maggiore di 0.</p>
      </div>
      <div class="form-row">
        <label>Angolo piega (°):</label>
        <input
          v-model.number="segment.angle"
          type="number"
          step="1"
          min="-180"
          max="180"
          @input="validateAngle(segment)"
          required
        />
        <p v-if="segment.errorAngle" class="error-message">Angolo non valido! Deve essere tra -180° e 180°.</p>
      </div>
      <div class="form-row">
        <label>Tipologia di piega:</label>
        <select v-model="segment.tipoPiega">
          <option value="su">In su</option>
          <option value="giu">In giù</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" @click="removeSegment(index)" class="btn-remove">Rimuovi Segmento</button>
      </div>
    </div>
    <button type="button" @click="addSegment" class="btn-add">Aggiungi Segmento</button>
  </section>
</template>

<script>
export default {
  name: 'SegmentsList',
  props: {
    modelValue: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modelValue', 'add', 'remove'],
  setup(props, { emit }) {
    const validateLength = (segment) => {
      segment.errorLength = segment.length <= 0;
      updateModelValue();
    };
    
    const validateAngle = (segment) => {
      segment.errorAngle = segment.angle < -180 || segment.angle > 180;
      updateModelValue();
    };
    
    const addSegment = () => {
      emit('add');
    };
    
    const removeSegment = (index) => {
      emit('remove', index);
    };
    
    const updateModelValue = () => {
      emit('update:modelValue', [...props.modelValue]);
    };
    
    return {
      validateLength,
      validateAngle,
      addSegment,
      removeSegment
    };
  }
};
</script>

<style scoped>
.segments-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.segmento {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

.form-row {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-add,
.btn-remove {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-remove {
  background: #dc3545;
}

.btn-add:hover {
  background: #0056b3;
}

.btn-remove:hover {
  background: #c82333;
}

.error-message {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}
</style>
<template>
  <div class="modern-segments-panel">
    <h2 class="panel-title">Segmenti</h2>

    <div class="segments-table">
      <div class="segments-header">
        <div class="segment-cell">#</div>
        <div class="segment-cell">Lunghezza</div>
        <div class="segment-cell">Angolo</div>
        <div class="segment-cell">Azioni</div>
      </div>

      <div v-for="(segment, index) in modelValue" :key="index" class="segment-row">
        <div class="segment-cell">{{ index + 1 }}</div>
        <div class="segment-cell">
          <input
            type="number"
            v-model.number="segment.length"
            min="0.1"
            step="1"
            class="segment-input"
            @input="updateModel"
          />
        </div>
        <div class="segment-cell">
          <input
            type="number"
            v-model.number="segment.angle"
            min="-180"
            max="180"
            step="1"
            class="segment-input"
            @input="updateModel"
          />
        </div>
        <div class="segment-cell">
          <button @click="$emit('remove', index)" class="btn-icon" title="Rimuovi segmento">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    </div>

    <div class="segments-actions">
      <button @click="$emit('add')" class="btn-primary">+ Aggiungi Segmento</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SegmentsList',
  props: {
    modelValue: {
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
  },
  emits: ['update:modelValue', 'add', 'remove'],
  setup(props, { emit }) {
    const updateModel = () => {
      emit('update:modelValue', props.modelValue);
    };

    return {
      updateModel,
    };
  },
};
</script>

<style scoped>
.modern-segments-panel {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #212529;
}

.segments-table {
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.segments-header {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 50px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.segment-row {
  display: grid;
  grid-template-columns: 50px 1fr 1fr 50px;
  border-bottom: 1px solid #e9ecef;
}

.segment-row:last-child {
  border-bottom: none;
}

.segment-cell {
  padding: 10px;
  display: flex;
  align-items: center;
}

.segment-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.segment-input:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: none;
  background-color: #f8f9fa;
  color: #dc3545;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #ffd5d9;
}

.segments-actions {
  margin-top: 15px;
}

.btn-primary {
  padding: 8px 16px;
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #0b5ed7;
}
</style>

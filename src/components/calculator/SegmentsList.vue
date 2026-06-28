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

      <template v-for="(segment, index) in modelValue" :key="index">
        <div class="segment-row">
          <div class="segment-cell">{{ index + 1 }}</div>
          <div class="segment-cell">
            <input
              type="number"
              v-model.number="segment.length"
              min="0.1"
              step="1"
              class="segment-input"
              :class="{ invalid: isLengthInvalid(segment) }"
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
              :class="{ invalid: isAngleInvalid(segment) }"
              :disabled="index === 0"
              :title="index === 0 ? 'Il primo segmento non ha piega in ingresso' : ''"
              @input="updateModel"
            />
          </div>
          <div class="segment-cell">
            <button @click="$emit('remove', index)" class="btn-icon" title="Rimuovi segmento">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
        <div v-if="rowMessage(segment, index)" class="segment-message">
          {{ rowMessage(segment, index) }}
        </div>
      </template>
    </div>

    <div class="segments-actions">
      <button @click="$emit('add')" class="btn-primary">+ Aggiungi Segmento</button>
    </div>

    <p v-if="modelValue.length === 0" class="segments-empty">
      Aggiungi almeno un segmento per calcolare lo sviluppo.
    </p>
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

    const isLengthInvalid = segment =>
      typeof segment.length !== 'number' || Number.isNaN(segment.length) || segment.length <= 0;

    const isAngleInvalid = segment => {
      const a = segment.angle;
      if (typeof a !== 'number' || Number.isNaN(a)) return true;
      return a < -180 || a > 180;
    };

    // Messaggio per riga (validazione non bloccante: il calcolo prosegue).
    const rowMessage = (segment, index) => {
      if (isLengthInvalid(segment)) {
        return 'Lunghezza non valida: deve essere maggiore di 0.';
      }
      if (index > 0 && isAngleInvalid(segment)) {
        return 'Angolo non valido: usa un valore tra -180 e 180 gradi.';
      }
      return '';
    };

    return {
      updateModel,
      isLengthInvalid,
      isAngleInvalid,
      rowMessage,
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
  width: 100%;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.segments-header {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr) 48px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
}

.segment-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) minmax(0, 1fr) 48px;
  border-bottom: 1px solid #e9ecef;
}

.segment-row:last-child {
  border-bottom: none;
}

.segment-cell {
  min-width: 0;
  padding: 8px;
  display: flex;
  align-items: center;
}

/* Colonne numero e azioni: contenuto centrato e compatto */
.segment-header-num,
.segment-cell:first-child {
  justify-content: center;
  padding-left: 4px;
  padding-right: 4px;
}

.segments-header .segment-cell:last-child,
.segment-row .segment-cell:last-child {
  justify-content: center;
  padding-left: 4px;
  padding-right: 4px;
}

.segment-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
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

.segment-input:disabled {
  background-color: #f1f3f5;
  color: #adb5bd;
  cursor: not-allowed;
}

.segment-input.invalid {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.segment-input.invalid:focus {
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.2);
}

.segment-message {
  grid-column: 1 / -1;
  padding: 6px 10px;
  margin: -6px 0 6px;
  font-size: 12px;
  color: #b21f2d;
  background: #fce8e6;
  border-radius: 4px;
}

.segments-empty {
  margin-top: 10px;
  font-size: 13px;
  color: #6c757d;
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

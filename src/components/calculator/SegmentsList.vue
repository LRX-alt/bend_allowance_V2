<template>
  <div class="modern-segments-panel">
    <h2 class="panel-title">Segmenti</h2>

    <div class="segments-table table-container">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Lunghezza</th>
            <th>Angolo</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(segment, index) in modelValue" :key="index">
            <tr class="segment-row">
              <td>{{ index + 1 }}</td>
              <td>
                <input
                  type="number"
                  v-model.number="segment.length"
                  min="0.1"
                  step="1"
                  class="form-control segment-input"
                  :class="{ invalid: isLengthInvalid(segment) }"
                  @input="updateModel"
                />
              </td>
              <td>
                <input
                  type="number"
                  v-model.number="segment.angle"
                  min="-180"
                  max="180"
                  step="1"
                  class="form-control segment-input"
                  :class="{ invalid: isAngleInvalid(segment) }"
                  :disabled="index === 0"
                  :title="index === 0 ? 'Il primo segmento non ha piega in ingresso' : ''"
                  @input="updateModel"
                />
              </td>
              <td>
                <button
                  @click="$emit('remove', index)"
                  class="btn btn-secondary btn-icon"
                  title="Rimuovi segmento"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </td>
            </tr>
            <tr v-if="rowMessage(segment, index)" class="segment-message-row">
              <td colspan="4">
                <div class="segment-message validation-warning d-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="alert-icon"
                  >
                    <path
                      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
                    />
                    <line x1="12" x2="12" y1="9" y2="13" />
                    <line x1="12" x2="12.01" y1="17" y2="17" />
                  </svg>
                  <span>{{ rowMessage(segment, index) }}</span>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="segments-actions">
      <button @click="$emit('add')" class="btn btn-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="btn-icon"
        >
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
        Aggiungi Segmento
      </button>
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
  display: none;
}

.segment-row {
  display: none;
}

.segment-cell {
  display: none;
}

/* Colonne numero e azioni: contenuto centrato e compatto */
.segment-header-num,
.segment-cell:first-child {
  display: none;
}

.segments-header .segment-cell:last-child,
.segment-row .segment-cell:last-child {
  display: none;
}

.segment-input {
  min-width: 0;
  box-sizing: border-box;
}

.segment-input.invalid {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.segment-message {
  padding: 6px 10px;
  margin: -6px 0 6px;
  font-size: 12px;
  border-radius: 4px;
}

.segments-empty {
  margin-top: 10px;
  font-size: 13px;
  color: #6c757d;
}

.btn-icon {
  background-color: transparent;
  color: #dc3545;
}

.btn-icon:hover {
  background-color: #fee2e2;
}

.segments-actions {
  margin-top: 15px;
}

.btn-primary {
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

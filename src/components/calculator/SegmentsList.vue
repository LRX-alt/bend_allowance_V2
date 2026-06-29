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
                  :class="{ invalid: isLengthCellInvalid(segment, index) }"
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
            <tr v-if="rowAlert(segment, index)" class="segment-message-row">
              <td colspan="4">
                <div
                  class="segment-message d-flex"
                  :class="
                    rowAlert(segment, index).level === 'error'
                      ? 'segment-message-error'
                      : 'validation-warning'
                  "
                >
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
                  <span>{{ rowAlert(segment, index).text }}</span>
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
import { calcolaLatoMinimo } from '@/utils/bendingEngine.js';

export default {
  name: 'SegmentsList',
  props: {
    modelValue: {
      type: Array,
      required: true,
    },
    larghezzaMatrice: {
      type: Number,
      default: 0,
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

    const hasBend = segment =>
      segment && typeof segment.angle === 'number' && Math.abs(segment.angle) > 0;

    // Numero di pieghe adiacenti al lato: angle e la piega al giunto che PRECEDE
    // il segmento (tra index-1 e index). Quindi un lato confina con una piega a
    // sinistra se ha angle != 0, a destra se il segmento successivo ha angle != 0.
    const pieghAdiacenti = index => {
      const list = props.modelValue;
      const sinistra = index > 0 && hasBend(list[index]) ? 1 : 0;
      const destra = index < list.length - 1 && hasBend(list[index + 1]) ? 1 : 0;
      return sinistra + destra;
    };

    // Verifica lunghezza minima del lato rispetto all'apertura cava V.
    // Restituisce { level: 'error' | 'warning', text } oppure null.
    const latoCortoInfo = (segment, index) => {
      const V = props.larghezzaMatrice;
      if (!V || V <= 0 || isLengthInvalid(segment)) return null;

      const pieghe = pieghAdiacenti(index);
      if (pieghe < 1) return null;

      const { geometrico, consigliato } = calcolaLatoMinimo({ V, pieghe });
      const u = props.unitLabel;

      if (segment.length < geometrico) {
        return {
          level: 'error',
          text: `Lato troppo corto per l'apertura cava V=${V.toFixed(1)} ${u}: minimo fisico ${geometrico.toFixed(1)} ${u} (il bordo cade nella cava).`,
        };
      }
      if (segment.length < consigliato) {
        return {
          level: 'warning',
          text: `Lato corto per la cava V=${V.toFixed(1)} ${u}: consigliati almeno ${consigliato.toFixed(1)} ${u} per una piega stabile.`,
        };
      }
      return null;
    };

    // Avviso per riga (validazione non bloccante: il calcolo prosegue).
    // Restituisce { level: 'error' | 'warning', text } oppure null.
    const rowAlert = (segment, index) => {
      if (isLengthInvalid(segment)) {
        return { level: 'error', text: 'Lunghezza non valida: deve essere maggiore di 0.' };
      }
      if (index > 0 && isAngleInvalid(segment)) {
        return {
          level: 'error',
          text: 'Angolo non valido: usa un valore tra -180 e 180 gradi.',
        };
      }
      return latoCortoInfo(segment, index);
    };

    const isLengthCellInvalid = (segment, index) => {
      if (isLengthInvalid(segment)) return true;
      return latoCortoInfo(segment, index) !== null;
    };

    return {
      updateModel,
      isLengthInvalid,
      isAngleInvalid,
      isLengthCellInvalid,
      rowAlert,
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

.segment-message.validation-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.segment-message.segment-message-error {
  background-color: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
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

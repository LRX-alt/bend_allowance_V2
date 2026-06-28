import { computed, watch, ref } from 'vue';
import { calcolaSviluppo, calcolaRaggioEffettivo } from '@/utils/bendingEngine.js';
import { kFactorDynamic } from '@/utils/materials.js';

/**
 * Composable per il calcolo dello sviluppo lamiera (modalita standard, per-piega).
 * Usa il motore unificato `bendingEngine.js`.
 */
export function useBendCalculator(
  segments,
  spessore,
  raggioPiega,
  fattoreK,
  larghezzaMatrice = null,
  processo = 'airBend'
) {
  const raggioEffettivo = ref(raggioPiega.value);

  watch(
    [spessore, raggioPiega, larghezzaMatrice, processo],
    ([newSpessore, newRaggioPiega, newLarghezzaMatrice, newProcesso]) => {
      if (newLarghezzaMatrice && newLarghezzaMatrice > 0) {
        raggioEffettivo.value = calcolaRaggioEffettivo(
          newSpessore,
          newLarghezzaMatrice,
          newRaggioPiega,
          newProcesso
        );
      } else {
        raggioEffettivo.value = newRaggioPiega;
      }
    },
    { immediate: true }
  );

  // Raggio usato nei calcoli: effettivo se la matrice e impostata, altrimenti nominale.
  const raggioCalcolo = computed(() =>
    larghezzaMatrice && larghezzaMatrice.value && larghezzaMatrice.value > 0
      ? raggioEffettivo.value
      : raggioPiega.value
  );

  const risultato = computed(() =>
    calcolaSviluppo({
      segments: segments.value,
      T: spessore.value,
      R: raggioCalcolo.value,
      K: fattoreK.value,
      metodo: 'standard',
    })
  );

  const dettagli = computed(() => risultato.value.dettagli);
  const sviluppoTotale = computed(() => risultato.value.sviluppoTotale);
  const lunghezzaLineare = computed(() => risultato.value.lunghezzaLineare);

  // Mantenuta per compatibilita con la UI: delega al motore.
  const calcolaFattoreKDinamico = () => kFactorDynamic(raggioPiega.value, spessore.value);

  return {
    dettagli,
    sviluppoTotale,
    lunghezzaLineare,
    calcolaFattoreKDinamico,
    raggioEffettivo,
  };
}

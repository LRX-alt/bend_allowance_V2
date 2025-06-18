import { computed, watch, ref } from 'vue';
import { calcolaDettagliSegmenti } from '@/utils/BendingCalculator.js';
import { calcolaRaggioEffettivo } from '@/utils/BendingCalculatorAdvanced.js';

export function useBendCalculator(
  segments,
  spessore,
  raggioPiega,
  fattoreK,
  metodoDiCalcolo = 'standard',
  larghezzaMatrice = null,
  processo = 'airBend'
) {
  // Riferimento per il raggio effettivo calcolato
  const raggioEffettivo = ref(raggioPiega.value);

  // Calcolo del raggio effettivo quando larghezzaMatrice è fornito
  watch(
    [spessore, raggioPiega, larghezzaMatrice, processo],
    ([newSpessore, newRaggioPiega, newLarghezzaMatrice, newProcesso]) => {
      if (newLarghezzaMatrice && newLarghezzaMatrice > 0) {
        // Calcola il raggio effettivo basato sulla larghezza matrice
        raggioEffettivo.value = calcolaRaggioEffettivo(
          newSpessore,
          newLarghezzaMatrice,
          newRaggioPiega,
          newProcesso
        );
      } else {
        // Se larghezzaMatrice non è specificata, usa il raggio nominale
        raggioEffettivo.value = newRaggioPiega;
      }
    },
    { immediate: true }
  );

  // Calcolo dei dettagli con raggio effettivo
  const dettagli = computed(() => {
    // Utilizza il raggio effettivo nei calcoli invece del raggio nominale
    const raggioCalcolo =
      larghezzaMatrice.value && larghezzaMatrice.value > 0
        ? raggioEffettivo.value
        : raggioPiega.value;

    const { dettagli } = calcolaDettagliSegmenti(
      segments.value,
      spessore.value,
      raggioCalcolo, // Usa il raggio effettivo
      fattoreK.value,
      metodoDiCalcolo.value
    );
    return dettagli;
  });

  // Calcolo dello sviluppo totale con raggio effettivo
  const sviluppoTotale = computed(() => {
    // Utilizza il raggio effettivo nei calcoli invece del raggio nominale
    const raggioCalcolo =
      larghezzaMatrice.value && larghezzaMatrice.value > 0
        ? raggioEffettivo.value
        : raggioPiega.value;

    const { sviluppoTotale } = calcolaDettagliSegmenti(
      segments.value,
      spessore.value,
      raggioCalcolo, // Usa il raggio effettivo
      fattoreK.value,
      metodoDiCalcolo.value
    );
    return sviluppoTotale;
  });

  // Calcolo della lunghezza lineare (senza pieghe)
  const lunghezzaLineare = computed(() => {
    return segments.value.reduce((total, segment) => total + segment.length, 0);
  });

  // Calcolo del fattore K dinamico
  const calcolaFattoreKDinamico = () => {
    const rapporto =
      spessore.value > 0 && raggioPiega.value > 0 ? raggioPiega.value / spessore.value : 0;

    if (rapporto < 1) {
      return 0.33; // Per rapporti molto bassi
    } else if (rapporto < 2) {
      return 0.35; // Per rapporti bassi
    } else if (rapporto < 4) {
      return 0.38; // Per rapporti medi
    } else if (rapporto < 8) {
      return 0.4; // Per rapporti alti
    } else {
      return 0.42; // Per rapporti molto alti
    }
  };

  return {
    dettagli,
    sviluppoTotale,
    lunghezzaLineare,
    calcolaFattoreKDinamico,
    raggioEffettivo, // Esponiamo il raggio effettivo calcolato
  };
}

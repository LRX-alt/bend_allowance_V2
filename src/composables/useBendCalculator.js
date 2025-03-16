import { computed } from 'vue';
import { calcolaDettagliSegmenti } from '@/utils/BendingCalculator.js';

export function useBendCalculator(segments, spessore, raggioPiega, fattoreK, metodoDiCalcolo = 'standard') {
  // Calcolo dei dettagli
  const dettagli = computed(() => {
    const { dettagli } = calcolaDettagliSegmenti(
      segments.value,
      spessore.value,
      raggioPiega.value,
      fattoreK.value,
      metodoDiCalcolo.value
    );
    return dettagli;
  });
  
  // Calcolo dello sviluppo totale
  const sviluppoTotale = computed(() => {
    const { sviluppoTotale } = calcolaDettagliSegmenti(
      segments.value,
      spessore.value,
      raggioPiega.value,
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
    const rapporto = (spessore.value > 0 && raggioPiega.value > 0) 
      ? raggioPiega.value / spessore.value 
      : 0;
      
    if (rapporto < 1) {
      return 0.33; // Per rapporti molto bassi
    } else if (rapporto < 2) {
      return 0.35; // Per rapporti bassi
    } else if (rapporto < 4) {
      return 0.38; // Per rapporti medi
    } else if (rapporto < 8) {
      return 0.40; // Per rapporti alti
    } else {
      return 0.42; // Per rapporti molto alti
    }
  };
  
  return {
    dettagli,
    sviluppoTotale,
    lunghezzaLineare,
    calcolaFattoreKDinamico
  };
}
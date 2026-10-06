import {
  calcolaAperturaMatrice,
  calcolaRaggioEffettivo,
  risolviRaggioInterno,
} from '@sviluppolamiera/bend-core';

export const PROCESSI = [
  { id: 'airBend', label: 'Piega in aria' },
  { id: 'bottoming', label: 'Piega a fondo cava' },
  { id: 'coining', label: 'Coniatura' },
];

export const ORIGINI = [
  { id: 'manual', label: 'Manuale' },
  { id: 'measured', label: 'Misurato' },
  { id: 'target', label: 'Target' },
  { id: 'punchAssumption', label: 'Assunzione sul punzone' },
];

export const ASSUNZIONE =
  'Assunzione dell’operatore: il raggio del punzone è usato come raggio interno. Non è un risultato di calcolo.';

export const STIMA_TITOLO = 'Raggio interno stimato dalla cava';

export function testoStimaEmpirica({ cava, spessore, processo }) {
  const apertura = Number(cava).toFixed(1);
  const spessoreTesto = Number.isFinite(Number(spessore)) ? `${spessore} mm` : 'lo spessore indicato';
  const base = `Ricavato dalla cava usata ${apertura} mm e dallo spessore ${spessoreTesto}. Lo sviluppo non usa questo raggio.`;
  if (!processo || processo === 'airBend') {
    return `${base} In piega in aria il punzone non entra in questo conto.`;
  }
  return base;
}

export const MOTIVI = {
  manca_manuale: 'Manca il raggio interno.',
  manca_misura: 'Manca il raggio misurato.',
  manca_target: 'Manca il raggio target.',
  manca_punzone: 'Manca il raggio del punzone.',
};

export function processLabel(id) {
  return PROCESSI.find(item => item.id === id)?.label || PROCESSI[0].label;
}

export function originLabel(id) {
  return ORIGINI.find(item => item.id === id)?.label || ORIGINI[0].label;
}

export function optionalNumber(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function developmentRadius(state) {
  return risolviRaggioInterno({
    source: state.raggioOrigine || 'manual',
    manualInside: state.raggio ?? undefined,
    measuredInside: state.raggioMisurato ?? undefined,
    targetInside: state.raggioTarget ?? undefined,
    punchRadius: state.raggioPunzone ?? undefined,
  });
}

export function cavaConsigliata(spessore, processo, materialId) {
  return calcolaAperturaMatrice(
    spessore || 0,
    processo || 'airBend',
    materialId || 'acciaio'
  ).aperturaOttimale;
}

export function stimaEmpirica(spessore, cava, raggioPunzone, processo) {
  if (!(cava > 0)) return null;
  return calcolaRaggioEffettivo(spessore || 0, cava, raggioPunzone, processo || 'airBend');
}

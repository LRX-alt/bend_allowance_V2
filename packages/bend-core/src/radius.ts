export type RadiusSource = 'manual' | 'measured' | 'target' | 'punchAssumption';

export type RadiusIncompleteReason =
  | 'manca_manuale'
  | 'manca_misura'
  | 'manca_target'
  | 'manca_punzone';

export interface RisolviRaggioInternoInput {
  source?: RadiusSource;
  manualInside?: number;
  targetInside?: number;
  measuredInside?: number;
  punchRadius?: number;
}

export interface RaggioInternoRisolto {
  stato: 'resolved';
  raggioSviluppo: number;
  origine: RadiusSource | 'legacy';
  assunzioneOperatore: boolean;
}

export interface RaggioInternoIncompleto {
  stato: 'incomplete';
  raggioSviluppo: null;
  origine: RadiusSource | 'legacy';
  assunzioneOperatore: false;
  motivo: RadiusIncompleteReason;
}

export type RaggioInterno = RaggioInternoRisolto | RaggioInternoIncompleto;

function usable(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function incomplete(
  origine: RadiusSource | 'legacy',
  motivo: RadiusIncompleteReason
): RaggioInternoIncompleto {
  return {
    stato: 'incomplete',
    raggioSviluppo: null,
    origine,
    assunzioneOperatore: false,
    motivo,
  };
}

function resolved(
  raggioSviluppo: number,
  origine: RadiusSource | 'legacy',
  assunzioneOperatore = false
): RaggioInternoRisolto {
  return {
    stato: 'resolved',
    raggioSviluppo,
    origine,
    assunzioneOperatore,
  };
}

/**
 * Sceglie il raggio interno di sviluppo da un'origine esplicita.
 * Non legge la V, il materiale, né stima il raggio dalla cava.
 */
export function risolviRaggioInterno(input: RisolviRaggioInternoInput = {}): RaggioInterno {
  const source = input.source;
  if (source === undefined || source === 'manual') {
    const origine = source === undefined ? 'legacy' : 'manual';
    return usable(input.manualInside)
      ? resolved(input.manualInside, origine)
      : incomplete(origine, 'manca_manuale');
  }
  if (source === 'measured') {
    return usable(input.measuredInside)
      ? resolved(input.measuredInside, 'measured')
      : incomplete('measured', 'manca_misura');
  }
  if (source === 'target') {
    return usable(input.targetInside)
      ? resolved(input.targetInside, 'target')
      : incomplete('target', 'manca_target');
  }
  return usable(input.punchRadius)
    ? resolved(input.punchRadius, 'punchAssumption', true)
    : incomplete('punchAssumption', 'manca_punzone');
}

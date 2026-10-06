import { risolviRaggioInterno } from '@sviluppolamiera/bend-core';

function usable(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function cleanPolicy(policy) {
  if (!policy?.source) return undefined;
  if (policy.source === 'manual') return { source: 'manual' };
  const next = { source: policy.source };
  if (policy.source === 'measured' && usable(policy.measuredInside)) {
    next.measuredInside = policy.measuredInside;
  }
  if (policy.source === 'target' && usable(policy.targetInside)) {
    next.targetInside = policy.targetInside;
  }
  return next;
}

function restoreBend(bend, memory) {
  if (!Object.prototype.hasOwnProperty.call(memory, bend.id)) return bend;
  const next = { ...bend };
  if (memory[bend.id] == null) delete next.innerRadius;
  else next.innerRadius = memory[bend.id];
  return next;
}

/**
 * Aggiorna il setup del pezzo. Riscrive innerRadius solo se l'origine
 * non manuale è risolta. La mappa dei raggi manuali resta fuori dal pezzo.
 */
export function applyBendSetup(part, patch, saved = {}) {
  const setup = { ...part.bendSetup };
  if (patch.process) setup.process = patch.process;
  if ('vOpening' in patch) {
    const opening = Number(patch.vOpening);
    if (Number.isFinite(opening) && opening > 0) setup.vOpening = opening;
    else delete setup.vOpening;
  }
  if ('punch' in patch) {
    const radius = patch.punch?.radius;
    if (usable(radius)) setup.punch = { radius };
    else delete setup.punch;
  }
  if ('radiusPolicy' in patch) {
    const policy = cleanPolicy(patch.radiusPolicy);
    if (policy) setup.radiusPolicy = policy;
    else delete setup.radiusPolicy;
  }

  const source = setup.radiusPolicy?.source;
  const policyTouched = Object.prototype.hasOwnProperty.call(patch, 'radiusPolicy');
  const punchTouched = Object.prototype.hasOwnProperty.call(patch, 'punch');
  const rewrite =
    (policyTouched && (!source || source === 'manual')) ||
    (policyTouched && source !== 'manual') ||
    (punchTouched && source === 'punchAssumption');
  let memory = { ...saved };
  let bendLines = part.bendLines;

  if (rewrite && (!source || source === 'manual')) {
    if (Object.keys(memory).length) {
      bendLines = part.bendLines.map(bend => restoreBend(bend, memory));
      memory = {};
    }
  } else if (rewrite) {
    const resolved = risolviRaggioInterno({
      source,
      measuredInside: setup.radiusPolicy?.measuredInside,
      targetInside: setup.radiusPolicy?.targetInside,
      punchRadius: setup.punch?.radius,
    });
    if (resolved.stato === 'resolved') {
      const eligible = part.bendLines.filter(
        bend => bend.angleDeg != null || bend.innerRadius != null
      );
      if (Object.keys(memory).length === 0) {
        memory = {};
        for (const bend of eligible) memory[bend.id] = bend.innerRadius;
      }
      const ids = new Set(eligible.map(bend => bend.id));
      bendLines = part.bendLines.map(bend =>
        ids.has(bend.id) ? { ...bend, innerRadius: resolved.raggioSviluppo } : bend
      );
    }
  }

  return {
    part: { ...part, bendSetup: setup, bendLines },
    savedManualRadii: memory,
  };
}

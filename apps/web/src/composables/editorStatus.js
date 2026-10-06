export function needsUnitConfirmation(part) {
  return Boolean(part && !part.provenance.unitsConfirmedByUser);
}

export function editorBanner(part) {
  if (needsUnitConfirmation(part))
    return 'Dimensioni da confermare: non posso modificare né esportare';
  if (part?.provenance.unsupportedCurvesDecision === 'rejected')
    return 'File in sola lettura: contiene geometrie che non posso modificare';
  return '';
}

export function editorLight(part, gateStatus) {
  if (!part) return 'idle';
  if (gateStatus === 'blocked') return 'bad';
  if (needsUnitConfirmation(part) || gateStatus === 'warnings') return 'warn';
  return 'ok';
}

export function editorLightLabel(light) {
  if (light === 'ok') return 'Pronto';
  if (light === 'warn') return 'Da controllare';
  if (light === 'bad') return 'Problemi da risolvere';
  return 'Nessun file';
}

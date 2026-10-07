import { resetIds, serialize, validatePart } from '@sviluppolamiera/part-model';
import { clampName } from './envelope.js';

export function collectIds(part) {
  const ids = [];
  const pushLoop = loop => {
    if (!loop) return;
    if (loop.id) ids.push(loop.id);
    for (const curve of loop.curves || []) {
      if (curve?.id) ids.push(curve.id);
    }
  };
  pushLoop(part?.outer);
  for (const loop of part?.inner || []) pushLoop(loop);
  for (const loop of part?.openPaths || []) pushLoop(loop);
  for (const feature of part?.features || []) if (feature?.id) ids.push(feature.id);
  for (const bend of part?.bendLines || []) if (bend?.id) ids.push(bend.id);
  for (const note of part?.annotations || []) if (note?.id) ids.push(note.id);
  return ids;
}

export function maxSuffix(part) {
  let max = 0;
  for (const id of collectIds(part)) {
    const match = /-(\d+)$/.exec(String(id));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

export function assertPartShape(part) {
  if (!part || typeof part !== 'object' || !part.outer || !Array.isArray(part.outer.curves)) {
    const error = new Error('Pezzo non valido');
    error.code = 'validation';
    throw error;
  }
  for (const key of ['inner', 'features', 'bendLines', 'openPaths', 'annotations']) {
    if (!Array.isArray(part[key])) {
      const error = new Error('Pezzo non valido');
      error.code = 'validation';
      throw error;
    }
  }
  return part;
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function summaryOf(part) {
  const bbox = part.outer?.bbox;
  const validation = validatePart(part);
  return {
    units: part.units === 'inch' ? 'inch' : 'mm',
    material_id: part.material?.dbId || null,
    thickness: finite(part.thickness),
    width: bbox ? finite(bbox.maxX - bbox.minX) : null,
    height: bbox ? finite(bbox.maxY - bbox.minY) : null,
    bend_count: Array.isArray(part.bendLines) ? part.bendLines.length : 0,
    part_status: validation.status,
    source_file_name: part.provenance?.sourceFileName || null,
  };
}

export function partEnvelope(part) {
  return { part: JSON.parse(serialize(part)) };
}

export function partRow(part, name) {
  return {
    kind: 'part',
    name: clampName(name || part.name, 'Pezzo'),
    description: null,
    schema_version: 1,
    data: partEnvelope(part),
    ...summaryOf(part),
  };
}

export function restorePart(data) {
  const part = assertPartShape(data?.part);
  resetIds(maxSuffix(part));
  return part;
}

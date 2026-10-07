import { computed, ref } from 'vue';
import { confirmGroup, commit } from '@sviluppolamiera/part-model';
import { editFeature } from '@sviluppolamiera/ops';

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function sameSegment(a, b, c, d, tolerance) {
  const close = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) <= tolerance;
  return (close(a, c) && close(b, d)) || (close(a, d) && close(b, c));
}

function lineCurves(part) {
  return [part.outer, ...(part.inner || [])].flatMap(loop =>
    (loop?.curves || []).filter(curve => curve.kind === 'line')
  );
}

function hitsFeature(feature, point, part) {
  if (feature.kind === 'hole') {
    return (
      Math.hypot(feature.center.x - point.x, feature.center.y - point.y) <= feature.diameter / 2
    );
  }
  if (feature.kind === 'slot') {
    return distanceToSegment(point, feature.p0, feature.p1) <= feature.width / 2;
  }
  const loop = part.inner.find(item => item.id === feature.loopId);
  const box = loop?.bbox;
  if (!box) return false;
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
}

export function useEditorSelection(state, part, proposals, messages) {
  const selectedId = ref('');
  const selectedBendId = ref('');
  const draftDiameter = ref(0);
  const measure = ref([]);
  const pickMessage = ref('');

  const selected = computed(
    () => part.value?.features.find(feature => feature.id === selectedId.value) ?? null
  );
  const selectedBend = computed(
    () => part.value?.bendLines.find(bend => bend.id === selectedBendId.value) ?? null
  );
  const measureText = computed(() => {
    if (!part.value || !measure.value.length) return '';
    const unit = part.value.units ?? 'mm';
    const pending = part.value.provenance.unitsConfirmedByUser ? '' : ' · unità da confermare';
    if (measure.value.length < 2) return `Punto 1/2${pending}`;
    const [a, b] = measure.value;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    return `${distance.toFixed(2)} ${unit}${pending}`;
  });

  function clearSelection() {
    selectedId.value = '';
    selectedBendId.value = '';
    measure.value = [];
    pickMessage.value = '';
  }

  function selectBend(id) {
    selectedBendId.value = id || '';
    selectedId.value = '';
    measure.value = [];
    pickMessage.value = '';
  }

  function pickBend(point) {
    if (!part.value) return false;
    const bend = nearestBend(point, toleranceOf());
    if (!bend) return false;
    selectBend(bend.id);
    return true;
  }

  function onPoint(point, tool = 'select') {
    if (!part.value) return 'miss';
    if (tool === 'pan') return 'pan';
    if (tool === 'measure') {
      selectedId.value = '';
      selectedBendId.value = '';
      measure.value = measure.value.length >= 2 ? [point] : [...measure.value, point];
      pickMessage.value = measure.value.length < 2 ? 'Secondo clic per chiudere la misura.' : '';
      return 'measure';
    }
    if (tool === 'bend') return placeBend(point);
    const span = Math.max(
      part.value.outer.bbox.maxX - part.value.outer.bbox.minX,
      part.value.outer.bbox.maxY - part.value.outer.bbox.minY,
      1
    );
    const tolerance = Math.max(span * 0.015, 2);
    const bend = nearestBend(point, tolerance);
    const feature = [...part.value.features]
      .reverse()
      .find(item => hitsFeature(item, point, part.value));
    if (feature) {
      selectedId.value = feature.id;
      selectedBendId.value = '';
      measure.value = [];
      draftDiameter.value = feature.kind === 'hole' ? feature.diameter : 0;
      pickMessage.value = '';
      return 'feature';
    }
    if (bend) {
      selectedBendId.value = bend.id;
      selectedId.value = '';
      measure.value = [];
      pickMessage.value = '';
      return 'bend';
    }
    clearSelection();
    pickMessage.value = 'Nessun foro, asola o linea di piega in questo punto.';
    return 'miss';
  }

  function toleranceOf(current = part.value) {
    const span = Math.max(
      current.outer.bbox.maxX - current.outer.bbox.minX,
      current.outer.bbox.maxY - current.outer.bbox.minY,
      1
    );
    return Math.max(span * 0.015, 2);
  }

  function nearestBend(point, tolerance) {
    let best = null;
    let bestDistance = tolerance;
    for (const item of part.value.bendLines) {
      const distance = distanceToSegment(point, item.a, item.b);
      if (distance <= bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    return best;
  }

  function nearestCutLine(point, tolerance) {
    let best = null;
    let bestDistance = tolerance;
    for (const curve of lineCurves(part.value)) {
      const distance = distanceToSegment(point, curve.a, curve.b);
      if (distance <= bestDistance) {
        best = curve;
        bestDistance = distance;
      }
    }
    return best;
  }

  function snapVertex(point, tolerance) {
    let best = null;
    let bestDistance = tolerance;
    const candidates = [
      ...lineCurves(part.value).flatMap(curve => [curve.a, curve.b]),
      ...part.value.bendLines.flatMap(bend => [bend.a, bend.b]),
    ];
    for (const candidate of candidates) {
      const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
      if (distance <= bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    return best ? { x: best.x, y: best.y } : null;
  }

  function commitBend(a, b) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < 0.05) {
      pickMessage.value = 'La linea di piega è troppo corta.';
      return 'short';
    }
    const existing = part.value.bendLines.find(bend => sameSegment(bend.a, bend.b, a, b, 0.2));
    if (existing) {
      selectBend(existing.id);
      pickMessage.value = 'Questa linea di piega è già presente.';
      return 'duplicate';
    }
    const bend = {
      id: `bend-manual-${part.value.bendLines.length + 1}-${Math.round(length)}`,
      a: { x: a.x, y: a.y },
      b: { x: b.x, y: b.y },
      source: 'manual',
    };
    while (part.value.bendLines.some(item => item.id === bend.id)) bend.id = `${bend.id}-b`;
    state.value = commit(
      state.value,
      { ...part.value, bendLines: [...part.value.bendLines, bend] },
      'Aggiungi linea di piega'
    );
    selectBend(bend.id);
    pickMessage.value = 'Linea di piega aggiunta. Indica angolo e direzione.';
    return 'added';
  }

  function placeBend(point) {
    const tolerance = toleranceOf();
    const bend = nearestBend(point, tolerance);
    if (bend) {
      measure.value = [];
      selectBend(bend.id);
      pickMessage.value = 'Linea di piega selezionata. Eliminala se descrive solo il raggio.';
      return 'bend';
    }
    const curve = nearestCutLine(point, tolerance);
    if (curve && measure.value.length === 0) {
      return commitBend(curve.a, curve.b);
    }
    const snapped = snapVertex(point, tolerance) || point;
    if (measure.value.length === 0) {
      measure.value = [snapped];
      pickMessage.value = 'Secondo clic: fine della linea di piega.';
      return 'draft';
    }
    const origin = measure.value[0];
    const vertex = snapVertex(point, tolerance);
    let end = vertex || point;
    if (!vertex) {
      const dx = Math.abs(end.x - origin.x);
      const dy = Math.abs(end.y - origin.y);
      if (dx <= tolerance && dy > dx) end = { x: origin.x, y: end.y };
      else if (dy <= tolerance && dx > dy) end = { x: end.x, y: origin.y };
    }
    measure.value = [];
    return commitBend(origin, end);
  }

  function removeBend(id = selectedBendId.value) {
    if (!part.value || !id) return false;
    if (!part.value.bendLines.some(bend => bend.id === id)) return false;
    state.value = commit(
      state.value,
      { ...part.value, bendLines: part.value.bendLines.filter(bend => bend.id !== id) },
      'Elimina linea di piega'
    );
    if (selectedBendId.value === id) clearSelection();
    pickMessage.value = 'Linea di piega eliminata.';
    return true;
  }

  function acceptGroup(proposal) {
    if (!part.value) return;
    const next = confirmGroup(part.value, proposal.featureIds, `gruppo-${proposal.featureIds[0]}`);
    state.value = commit(state.value, next, 'Gruppo di fori');
    proposals.value = proposals.value.filter(item => item !== proposal);
  }

  function changeDiameter() {
    if (!part.value || selected.value?.kind !== 'hole') return;
    const result = editFeature(part.value, selected.value.id, { diameter: draftDiameter.value });
    messages.value = [...new Set(result.blocking.map(item => item.message))];
    if (result.ok && result.part) state.value = commit(state.value, result.part, 'Modifica foro');
  }

  return {
    selectedId,
    selectedBendId,
    selectedBend,
    draftDiameter,
    measure,
    selected,
    measureText,
    pickMessage,
    onPoint,
    selectBend,
    pickBend,
    removeBend,
    clearSelection,
    acceptGroup,
    changeDiameter,
  };
}

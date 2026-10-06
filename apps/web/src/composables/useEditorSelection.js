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
    if (!part.value) return '';
    if (measure.value.length < 2)
      return part.value.provenance.unitsConfirmedByUser ? '' : 'Unità da confermare';
    const [a, b] = measure.value;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const unit = part.value.units ?? 'mm';
    const pending = part.value.provenance.unitsConfirmedByUser ? '' : ' · unità da confermare';
    return `${distance.toFixed(2)} ${unit}${pending}`;
  });

  function onPoint(point) {
    if (!part.value) return 'miss';
    const span = Math.max(
      part.value.outer.bbox.maxX - part.value.outer.bbox.minX,
      part.value.outer.bbox.maxY - part.value.outer.bbox.minY,
      1
    );
    const tolerance = Math.max(span * 0.015, 2);
    const bend = part.value.bendLines.find(
      item => distanceToSegment(point, item.a, item.b) <= tolerance
    );
    const feature = [...part.value.features]
      .reverse()
      .find(item => hitsFeature(item, point, part.value));
    if (feature) {
      selectedId.value = feature.id;
      selectedBendId.value = '';
      draftDiameter.value = feature.kind === 'hole' ? feature.diameter : 0;
      pickMessage.value = '';
      return 'feature';
    }
    if (bend) {
      selectedBendId.value = bend.id;
      selectedId.value = '';
      pickMessage.value = '';
      return 'bend';
    }
    selectedId.value = '';
    selectedBendId.value = '';
    measure.value = measure.value.length >= 2 ? [point] : [...measure.value, point];
    pickMessage.value =
      'Nessun foro, asola o linea di piega in questo punto. Due clic misurano una distanza.';
    return 'miss';
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
    acceptGroup,
    changeDiameter,
  };
}

import { computed, ref } from 'vue';
import { commit } from '@sviluppolamiera/part-model';
import { compareParts, stretchAlongAxis } from '@sviluppolamiera/ops';

export function useEditorStretch(state, part) {
  const axis = ref('x');
  const amount = ref(5);
  const sign = ref(1);
  const mode = ref('leftFixed');
  const policy = ref('followMinEdge');
  const messages = ref([]);
  const compare = ref(null);
  const ghost = ref(null);
  const previewPart = ref(null);

  const delta = computed(() => (amount.value || 0) * (sign.value || 1));
  const needsPolicy = computed(() =>
    part.value?.features.some(feature => !feature.groupId && feature.anchor[axis.value] === 'unset')
  );

  function params() {
    return {
      axis: axis.value,
      delta: delta.value,
      mode: mode.value,
      anchorPolicy: needsPolicy.value ? { kind: policy.value } : undefined,
      confirmWarnings: true,
    };
  }

  function clearPreview() {
    ghost.value = null;
    previewPart.value = null;
  }

  function preview() {
    if (!part.value) return;
    const base = part.value;
    const result = stretchAlongAxis(base, params());
    messages.value = [
      ...new Set([...result.blocking, ...result.warnings].map(item => item.message)),
    ];
    if (result.ok && result.part) {
      ghost.value = base;
      previewPart.value = result.part;
      compare.value = compareParts(base, result.part);
    }
  }

  function apply() {
    if (!part.value || !previewPart.value || !ghost.value) return;
    compare.value = compareParts(ghost.value, previewPart.value);
    state.value = commit(state.value, previewPart.value, 'Modifica dimensione');
    clearPreview();
  }

  return {
    axis,
    amount,
    sign,
    mode,
    policy,
    messages,
    compare,
    ghost,
    previewPart,
    needsPolicy,
    preview,
    apply,
    clearPreview,
  };
}

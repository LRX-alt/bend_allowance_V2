import { computed } from 'vue';
import { redo, undo } from '@sviluppolamiera/part-model';

export function useEditorHistory(state) {
  const canUndo = computed(() => (state.value?.past.length ?? 0) > 0);
  const canRedo = computed(() => (state.value?.future.length ?? 0) > 0);

  function onUndo() {
    state.value = undo(state.value);
  }

  function onRedo() {
    state.value = redo(state.value);
  }

  return { canUndo, canRedo, onUndo, onRedo };
}

<template>
  <header class="editor-toolbar">
    <div class="toolbar-group">
      <label class="btn btn-primary">
        Apri DXF
        <input type="file" accept=".dxf" @change="$emit('file', $event)" />
      </label>
      <button type="button" class="btn btn-ghost" :disabled="!canUndo" @click="$emit('undo')">
        Annulla
      </button>
      <button type="button" class="btn btn-ghost" :disabled="!canRedo" @click="$emit('redo')">
        Ripeti
      </button>
      <p v-if="fileName" class="file-name">{{ fileName }}</p>
    </div>
    <div class="toolbar-group">
      <button type="button" class="status-badge" :class="light" @click="$emit('findings')">
        {{ label }}
      </button>
      <button type="button" class="btn btn-ghost" :disabled="!part" @click="$emit('fit')">
        Adatta
      </button>
      <button type="button" class="btn btn-ghost" :disabled="!part" @click="$emit('zoom', 1.1)">
        +
      </button>
      <button type="button" class="btn btn-ghost" :disabled="!part" @click="$emit('zoom', 0.9)">
        −
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="!part || gateStatus === 'blocked'"
        @click="$emit('export')"
      >
        Esporta
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  fileName: { type: String, default: '' },
  canUndo: Boolean,
  canRedo: Boolean,
  light: { type: String, default: 'idle' },
  label: { type: String, default: 'Nessun file' },
  part: { type: Object, default: null },
  gateStatus: { type: String, default: 'blocked' },
});
defineEmits(['file', 'undo', 'redo', 'findings', 'fit', 'zoom', 'export']);
</script>

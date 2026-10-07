<template>
  <header class="editor-toolbar">
    <div class="toolbar-group doc-identity">
      <label class="btn btn-primary btn-sm">
        Importa DXF
        <input type="file" accept=".dxf,image/vnd.dxf" @change="$emit('file', $event)" />
      </label>
      <div class="doc-name">
        <strong>{{ fileName || 'Nessun file' }}</strong>
        <span>{{ part ? 'Sviluppo lamiera' : 'Apri un DXF per iniziare' }}</span>
      </div>
      <button type="button" class="status-badge" :class="light" @click="$emit('findings')">
        {{ label }}
        <span v-if="warningCount" class="tech-num">{{ warningCount }}</span>
      </button>
    </div>
    <div class="toolbar-group">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="!canUndo"
        :title="undoLabel ? `Annulla: ${undoLabel}` : 'Annulla'"
        @click="$emit('undo')"
      >
        Annulla
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="!canRedo"
        :title="redoLabel ? `Ripeti: ${redoLabel}` : 'Ripeti'"
        @click="$emit('redo')"
      >
        Ripeti
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="!part"
        @click="$emit('analyze')"
      >
        Analizza
      </button>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="!part" @click="$emit('sheet')">
        Scheda piega
      </button>
      <button
        type="button"
        class="btn btn-primary btn-sm"
        :disabled="!part || gateStatus === 'blocked'"
        @click="$emit('export')"
      >
        Esporta DXF
      </button>
      <router-link class="btn btn-ghost btn-sm" to="/modifica-sviluppo-dxf" target="_blank">
        Istruzioni
      </router-link>
    </div>
  </header>
</template>

<script setup>
defineProps({
  fileName: { type: String, default: '' },
  canUndo: Boolean,
  canRedo: Boolean,
  undoLabel: { type: String, default: '' },
  redoLabel: { type: String, default: '' },
  light: { type: String, default: 'idle' },
  label: { type: String, default: 'Nessun file' },
  warningCount: { type: Number, default: 0 },
  part: { type: Object, default: null },
  gateStatus: { type: String, default: 'blocked' },
});
defineEmits(['file', 'undo', 'redo', 'findings', 'analyze', 'sheet', 'export']);
</script>

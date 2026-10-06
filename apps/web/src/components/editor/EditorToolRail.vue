<template>
  <nav class="editor-rail" aria-label="Strumenti">
    <button
      v-for="item in tools"
      :key="item.id"
      type="button"
      class="tool-button"
      :aria-pressed="tool === item.id"
      :aria-keyshortcuts="item.key"
      :title="`${item.label} (${item.key})`"
      :disabled="!enabled"
      @click="$emit('tool', item.id)"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          :d="item.icon"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="sr-only">{{ item.label }}</span>
    </button>
    <span class="rail-gap"></span>
    <button
      type="button"
      class="tool-button"
      title="Adatta (F)"
      :disabled="!enabled"
      @click="$emit('fit')"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        />
      </svg>
      <span class="sr-only">Adatta</span>
    </button>
    <button
      type="button"
      class="tool-button"
      title="Zoom avanti (+)"
      :disabled="!enabled"
      @click="$emit('zoom', 1.1)"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M11 8v6M8 11h6M16 16l4 4" fill="none" stroke="currentColor" stroke-width="1.8" />
      </svg>
      <span class="sr-only">Zoom avanti</span>
    </button>
    <button
      type="button"
      class="tool-button"
      title="Zoom indietro (-)"
      :disabled="!enabled"
      @click="$emit('zoom', 0.9)"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="M8 11h6M16 16l4 4" fill="none" stroke="currentColor" stroke-width="1.8" />
      </svg>
      <span class="sr-only">Zoom indietro</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  tool: { type: String, default: 'select' },
  enabled: Boolean,
});
defineEmits(['tool', 'fit', 'zoom']);

const tools = [
  { id: 'select', label: 'Selezione', key: 'V', icon: 'M5 4l6 16 2-6 6-2z' },
  { id: 'pan', label: 'Sposta vista', key: 'H', icon: 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4M3 12h18' },
  { id: 'measure', label: 'Misura', key: 'M', icon: 'M4 17l13-13M7 14l2 2M11 10l2 2M15 6l2 2' },
  { id: 'stretch', label: 'Modifica quota', key: 'Q', icon: 'M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4' },
  { id: 'bend', label: 'Linea di piega', key: 'B', icon: 'M12 4v16M8 8h8M8 16h8' },
];
</script>

<template>
  <div class="accordion-section">
    <button type="button" class="accordion-header" :aria-expanded="isOpen" @click="toggle">
      <span class="accordion-title">
        {{ title }}
        <small v-if="hint" class="accordion-hint">{{ hint }}</small>
      </span>
      <span class="accordion-icon" :class="{ open: isOpen }" aria-hidden="true">&#9656;</span>
    </button>
    <div v-show="isOpen" class="accordion-body">
      <slot />
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'AccordionSection',
  props: {
    title: { type: String, required: true },
    hint: { type: String, default: '' },
    open: { type: Boolean, default: false },
  },
  setup(props) {
    const isOpen = ref(props.open);
    watch(
      () => props.open,
      v => {
        isOpen.value = v;
      }
    );
    const toggle = () => {
      isOpen.value = !isOpen.value;
    };
    return { isOpen, toggle };
  },
};
</script>

<style scoped>
.accordion-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #212529;
  text-align: left;
}

.accordion-header:hover {
  background: #eef1f4;
}

.accordion-title {
  display: flex;
  flex-direction: column;
}

.accordion-hint {
  font-weight: 400;
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.accordion-icon {
  transition: transform 0.2s ease;
  color: #6c757d;
}

.accordion-icon.open {
  transform: rotate(90deg);
}

.accordion-body {
  padding: 16px;
  border-top: 1px solid #e9ecef;
}
</style>

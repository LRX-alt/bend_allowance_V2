<template>
  <aside class="editor-side">
    <PartSummaryPanel :part="part" />
    <BendTable
      :part="part"
      :selected-id="selectedBend?.id || ''"
      @select="$emit('select-bend', $event)"
      @remove="$emit('remove-bend', $event)"
    />
    <div class="side-tabs" role="tablist" aria-label="Dettaglio pezzo">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'proprieta'"
        @click="tab = 'proprieta'"
      >
        Proprietà
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'diagnostica'"
        @click="tab = 'diagnostica'"
      >
        Diagnostica
        <span v-if="issueCount" class="tab-count tech-num">{{ issueCount }}</span>
      </button>
    </div>
    <div class="side-scroll">
      <template v-if="tab === 'proprieta'">
        <StretchInspector
          v-if="tool === 'stretch'"
          :axis="axis"
          :amount="amount"
          :sign="sign"
          :mode="mode"
          :policy="policy"
          :needs-policy="needsPolicy"
          :locked="locked"
          :can-apply="canApply"
          :messages="messages"
          :compare="compare"
          @update:axis="$emit('update:axis', $event)"
          @update:amount="$emit('update:amount', $event)"
          @update:sign="$emit('update:sign', $event)"
          @update:mode="$emit('update:mode', $event)"
          @update:policy="$emit('update:policy', $event)"
          @preview="$emit('preview')"
          @apply="$emit('apply')"
        />
        <PropertiesInspector
          :part="part"
          :selected="selected"
          :selected-bend="selectedBend"
          :pick-message="pickMessage"
          :draft-diameter="draftDiameter"
          :proposals="proposals"
          @update:draft-diameter="$emit('update:draftDiameter', $event)"
          @thickness="$emit('thickness', $event)"
          @material="$emit('material', $event)"
          @bend-angle="$emit('bend-angle', $event)"
          @bend-direction="$emit('bend-direction', $event)"
          @bend-radius="$emit('bend-radius', $event)"
          @diameter="$emit('diameter')"
          @group="$emit('group', $event)"
          @remove-bend="$emit('remove-bend', selectedBend?.id)"
        />
      </template>
      <FindingList v-else :items="findings" @focus="$emit('focus-finding', $event)" />
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import BendTable from '@/components/editor/BendTable.vue';
import FindingList from '@/components/editor/FindingList.vue';
import PartSummaryPanel from '@/components/editor/PartSummaryPanel.vue';
import PropertiesInspector from '@/components/editor/PropertiesInspector.vue';
import StretchInspector from '@/components/editor/StretchInspector.vue';

const props = defineProps({
  part: { type: Object, default: null },
  tool: { type: String, default: 'select' },
  axis: String,
  amount: Number,
  sign: Number,
  mode: String,
  policy: String,
  needsPolicy: Boolean,
  locked: Boolean,
  canApply: Boolean,
  messages: { type: Array, default: () => [] },
  compare: { type: Object, default: null },
  selected: { type: Object, default: null },
  selectedBend: { type: Object, default: null },
  pickMessage: { type: String, default: '' },
  draftDiameter: Number,
  proposals: { type: Array, default: () => [] },
  findings: { type: Array, default: () => [] },
  findingsTick: { type: Number, default: 0 },
  focusTarget: { type: String, default: '' },
});
defineEmits([
  'update:axis',
  'update:amount',
  'update:sign',
  'update:mode',
  'update:policy',
  'update:draftDiameter',
  'preview',
  'apply',
  'diameter',
  'group',
  'bend-angle',
  'bend-direction',
  'bend-radius',
  'thickness',
  'material',
  'select-bend',
  'remove-bend',
  'focus-finding',
]);

const tab = ref('proprieta');
const issueCount = computed(
  () =>
    props.findings.filter(item => item.severity === 'error' || item.severity === 'warning').length
);

watch(
  () => props.findingsTick,
  value => {
    if (value) tab.value = 'diagnostica';
  }
);
watch(
  () => props.focusTarget,
  async value => {
    if (!value || value === 'units') return;
    tab.value = 'proprieta';
    await nextTick();
    const id = value === 'material' ? 'sheet-material' : 'sheet-thickness';
    document.getElementById(id)?.focus();
  }
);
watch(
  () => props.tool,
  value => {
    if (value === 'stretch') tab.value = 'proprieta';
  }
);
watch(
  () => props.selected,
  value => {
    if (value) tab.value = 'proprieta';
  }
);
watch(
  () => props.selectedBend,
  value => {
    if (value) tab.value = 'proprieta';
  }
);
</script>

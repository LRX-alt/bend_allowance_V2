import { computed, ref } from 'vue';
import { importDxf } from '@sviluppolamiera/dxf';
import { commit, createEditorState } from '@sviluppolamiera/part-model';
import { editorBanner, needsUnitConfirmation } from './editorStatus.js';

export function useEditorDocument() {
  const source = ref('');
  const fileName = ref('');
  const state = ref(null);
  const proposals = ref([]);
  const findings = ref([]);
  const askUnits = ref(false);
  const askCurves = ref(false);
  const approxTol = ref(0.1);

  const part = computed(() => state.value?.current ?? null);
  const needsUnits = computed(() => needsUnitConfirmation(part.value));
  const banner = computed(() => editorBanner(part.value));

  function openSource(decisions) {
    const result = importDxf(source.value, decisions);
    findings.value = result.findings;
    proposals.value = result.groupProposals;
    if (!result.part) return null;
    state.value = createEditorState(result.part);
    askUnits.value = !result.part.provenance.unitsConfirmedByUser;
    askCurves.value = Boolean(
      result.part.provenance.hadUnsupportedCurves &&
        !result.part.provenance.unsupportedCurvesDecision
    );
    return result.part;
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return null;
    fileName.value = file.name;
    source.value = await file.text();
    return openSource({});
  }

  function confirmUnits(unit) {
    askUnits.value = false;
    return openSource({ confirmUnits: unit });
  }

  function approximate() {
    askCurves.value = false;
    return openSource({
      confirmUnits: 'mm',
      approximateUnsupported: { tolerance: approxTol.value },
    });
  }

  function rejectCurves() {
    askCurves.value = false;
    if (!part.value) return;
    const next = {
      ...part.value,
      provenance: { ...part.value.provenance, unsupportedCurvesDecision: 'rejected' },
    };
    state.value = commit(state.value, next, 'File in sola lettura');
  }

  return {
    source,
    fileName,
    state,
    proposals,
    findings,
    askUnits,
    askCurves,
    approxTol,
    part,
    needsUnits,
    banner,
    openSource,
    onFile,
    confirmUnits,
    approximate,
    rejectCurves,
  };
}

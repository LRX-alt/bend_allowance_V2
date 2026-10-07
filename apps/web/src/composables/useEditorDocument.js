import { computed, ref } from 'vue';
import { importDxf } from '@sviluppolamiera/dxf';
import { commit, createEditorState } from '@sviluppolamiera/part-model';
import { editorBanner } from './editorStatus.js';

export function useEditorDocument() {
  const source = ref('');
  const fileName = ref('');
  const state = ref(null);
  const proposals = ref([]);
  const findings = ref([]);
  const askCurves = ref(false);
  const approxTol = ref(0.1);
  const importFindings = ref([]);

  const part = computed(() => state.value?.current ?? null);
  const banner = computed(() => editorBanner(part.value));

  function openSource(decisions = {}) {
    const result = importDxf(source.value, { confirmUnits: 'mm', ...decisions });
    importFindings.value = result.findings;
    findings.value = result.findings;
    proposals.value = result.groupProposals;
    if (!result.part) return null;
    state.value = createEditorState(result.part);
    askCurves.value = Boolean(
      result.part.provenance.hadUnsupportedCurves &&
        !result.part.provenance.unsupportedCurvesDecision
    );
    return result.part;
  }

  function stageSource(name = fileName.value) {
    fileName.value = name || fileName.value;
    askCurves.value = false;
    const probe = importDxf(source.value);
    if (!probe.part) {
      importFindings.value = probe.findings;
      findings.value = probe.findings;
      proposals.value = [];
      state.value = null;
      return { part: null };
    }
    return { part: openSource({ confirmUnits: 'mm' }) };
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return null;
    fileName.value = file.name;
    source.value = await file.text();
    return stageSource(file.name);
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

  function replaceDocument(nextPart, options = {}) {
    if (options.fileName !== undefined) fileName.value = options.fileName || '';
    if (options.sourceText !== undefined) source.value = options.sourceText || '';
    state.value = nextPart ? createEditorState(nextPart) : null;
    proposals.value = [];
    findings.value = [];
    importFindings.value = [];
    askCurves.value = false;
  }

  return {
    source,
    fileName,
    state,
    proposals,
    findings,
    askCurves,
    approxTol,
    importFindings,
    part,
    banner,
    openSource,
    stageSource,
    onFile,
    approximate,
    rejectCurves,
    replaceDocument,
  };
}

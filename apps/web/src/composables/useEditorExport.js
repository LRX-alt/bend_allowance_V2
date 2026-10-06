import { computed } from 'vue';
import { exportDxf } from '@sviluppolamiera/dxf';
import { bendSheetHtml, exportDecision } from '@sviluppolamiera/analyze';

export function useEditorExport(part, findings) {
  const gate = computed(() =>
    part.value ? exportDecision(part.value, findings.value) : { status: 'blocked', findings: [] }
  );

  function onExport(fileName = '') {
    if (!part.value) return false;
    const exported = exportDxf(part.value, findings.value);
    if (!exported.dxf) return false;
    const blob = new Blob([exported.dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const base = String(fileName || 'sviluppo.dxf').replace(/\.dxf$/i, '');
    link.href = url;
    link.download = `${base}-sviluppo.dxf`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  }

  function openSheet() {
    if (!part.value) return false;
    const blob = new Blob([bendSheetHtml(part.value)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const popup = window.open(url, '_blank');
    if (!popup) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }

  return { gate, onExport, openSheet };
}

import { computed, ref } from 'vue';
import { serialize } from '@sviluppolamiera/part-model';
import { clearDraft } from '@/persistence/drafts.js';
import { migrate } from '@/persistence/envelope.js';
import { partRow, restorePart } from '@/persistence/partAdapter.js';
import { userMessage } from '@/services/supabase/errors.js';
import { useAuth } from './useAuth.js';
import { useProjectSync } from './useProjectSync.js';

function fileTitle(name) {
  return String(name || '').replace(/\.dxf$/i, '');
}

export function useEditorProject({ part, source, fileName, replaceDocument, record }) {
  const auth = useAuth();
  const projectName = ref('');
  const savedFingerprint = ref('');
  const recovery = ref(null);
  const readOnlyMessage = ref('');
  const returnPath = record?.id ? `/progetti/${record.id}` : '/editor';

  const dirty = computed(() => {
    if (!part.value) return false;
    return serialize(part.value) !== savedFingerprint.value;
  });

  function capture(overrideName) {
    if (!part.value) return null;
    const name = overrideName || projectName.value || fileTitle(fileName.value) || part.value.name;
    return {
      name,
      sourceText: source.value || null,
      row: partRow(part.value, name),
    };
  }

  function restore(data, meta = {}) {
    const restored = restorePart(data);
    replaceDocument(restored, {
      fileName: meta.source_file_name || meta.name || restored.provenance?.sourceFileName || '',
      sourceText: meta.sourceText || source.value || '',
    });
    if (meta.name) projectName.value = meta.name;
  }

  const sync = useProjectSync({
    kind: 'part',
    dirty,
    capture,
    restore,
    returnPath,
    fallbackName: 'Pezzo',
    onIdentity(name) {
      projectName.value = name;
    },
  });

  function adoptRecord(row) {
    const migrated = migrate('part', row.schema_version, row.data);
    if (migrated.status === 'too-new') {
      readOnlyMessage.value = userMessage('too_new');
      return false;
    }
    restore(migrated.data, row);
    savedFingerprint.value = part.value ? serialize(part.value) : '';
    sync.adopt(row);
    return true;
  }

  if (record?.kind === 'part') adoptRecord(record);

  async function resumeDraft() {
    const draft = await sync.pendingDraft();
    if (!draft || draft.kind !== 'part') return;
    const sameProject = !record?.id || draft.projectId === record.id;
    if (!sameProject) return;
    if (draft.intent === 'save') {
      restore(draft.row.data, {
        name: draft.name,
        source_file_name: draft.name,
        sourceText: draft.sourceText,
      });
      sync.bindDraft(draft);
      await auth.whenReady();
      if (auth.isAuthenticated.value) await sync.save();
      return;
    }
    if (!record?.id || draft.projectId === record.id) recovery.value = draft;
  }

  function restoreRecovery() {
    const draft = recovery.value;
    if (!draft) return;
    restore(draft.row.data, {
      name: draft.name,
      source_file_name: draft.name,
      sourceText: draft.sourceText,
    });
    sync.bindDraft(draft);
    savedFingerprint.value = '';
    recovery.value = null;
  }

  async function discardRecovery() {
    recovery.value = null;
    await clearDraft('part');
  }

  return {
    ...sync,
    projectName,
    recovery,
    readOnlyMessage,
    resumeDraft,
    restoreRecovery,
    discardRecovery,
    dirty,
  };
}

import { computed, ref } from 'vue';
import { clearDraft } from '@/persistence/drafts.js';
import { migrate } from '@/persistence/envelope.js';
import { assertProfileShape, profileRow } from '@/persistence/profileAdapter.js';
import { userMessage } from '@/services/supabase/errors.js';
import { useAuth } from './useAuth.js';
import { useProjectSync } from './useProjectSync.js';

export function useCalculatorProject({ fingerprint, readProfile, applyProfile, record }) {
  const auth = useAuth();
  const projectName = ref(record?.name || '');
  const savedFingerprint = ref('');
  const armed = ref(false);
  const recovery = ref(null);
  const readOnlyMessage = ref('');
  const returnPath = record?.id ? `/progetti/${record.id}` : '/calcolatore-sviluppo-lamiera';

  const dirty = computed(
    () => armed.value && fingerprint.value !== savedFingerprint.value && Boolean(fingerprint.value)
  );

  function capture(overrideName) {
    const profile = readProfile();
    const name = overrideName || projectName.value;
    return {
      name,
      sourceText: null,
      row: profileRow(profile, name || 'Profilo'),
    };
  }

  function restore(data, meta = {}) {
    applyProfile(assertProfileShape(data?.profile));
    if (meta.name) projectName.value = meta.name;
    armed.value = true;
  }

  const sync = useProjectSync({
    kind: 'profile',
    dirty,
    capture,
    restore,
    returnPath,
    fallbackName: 'Profilo',
    onIdentity(name) {
      projectName.value = name;
    },
  });

  function adoptRecord(row) {
    const migrated = migrate('profile', row.schema_version, row.data);
    if (migrated.status === 'too-new') {
      readOnlyMessage.value = userMessage('too_new');
      return;
    }
    restore(migrated.data, row);
    savedFingerprint.value = fingerprint.value;
    sync.adopt(row);
  }

  if (record?.kind === 'profile') adoptRecord(record);

  async function saveToAccount() {
    armed.value = true;
    if (!projectName.value) {
      sync.askSaveAs();
      return;
    }
    await sync.save();
  }

  async function resumeDraft() {
    const draft = await sync.pendingDraft();
    if (!draft || draft.kind !== 'profile') return;
    const sameProject = !record?.id || draft.projectId === record.id;
    if (!sameProject) return;
    if (draft.intent === 'save') {
      restore(draft.row.data, { name: draft.name });
      sync.bindDraft(draft);
      await auth.whenReady();
      if (auth.isAuthenticated.value) await sync.save();
      return;
    }
    recovery.value = draft;
  }

  function restoreRecovery() {
    const draft = recovery.value;
    if (!draft) return;
    restore(draft.row.data, { name: draft.name });
    sync.bindDraft(draft);
    savedFingerprint.value = '';
    recovery.value = null;
  }

  async function discardRecovery() {
    recovery.value = null;
    await clearDraft('profile');
  }

  async function confirmName() {
    armed.value = true;
    return sync.confirmName();
  }

  return {
    ...sync,
    confirmName,
    projectName,
    recovery,
    readOnlyMessage,
    armed,
    saveToAccount,
    resumeDraft,
    restoreRecovery,
    discardRecovery,
    dirty,
  };
}

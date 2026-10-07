import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { clearDraft, readDraft, writeDraft } from '@/persistence/drafts.js';
import { clampName, migrate, statusLabel as labelFor } from '@/persistence/envelope.js';
import { runSave } from '@/persistence/saveDocument.js';
import { useAuth } from '@/composables/useAuth.js';
import { toUserError, userMessage } from '@/services/supabase/errors.js';
import { createProject, getProject, updateProject } from '@/services/supabase/projects.js';
import { downloadSource, uploadSource } from '@/services/supabase/storage.js';

export function useProjectSync({
  kind,
  dirty,
  capture,
  restore,
  returnPath,
  fallbackName,
  onIdentity,
}) {
  const auth = useAuth();
  const router = useRouter();
  const status = ref('idle');
  const detail = ref('');
  const projectId = ref('');
  const revision = ref(null);
  const savedAt = ref('');
  const sourcePath = ref('');
  const nameOpen = ref(false);
  const conflictOpen = ref(false);
  const nameDraft = ref('');
  let pending = null;
  let timer = null;

  const label = computed(() =>
    labelFor({ status: status.value, savedAt: savedAt.value, detail: detail.value })
  );

  function note(row) {
    projectId.value = row.id || projectId.value;
    revision.value = row.revision ?? revision.value;
    savedAt.value = row.updated_at || savedAt.value;
    sourcePath.value = row.source_path || sourcePath.value;
    if (row.name) onIdentity?.(row.name);
  }

  function adopt(row) {
    note(row);
    status.value = 'saved';
    detail.value = '';
  }

  function bindDraft(draft) {
    projectId.value = draft.projectId || '';
    revision.value = draft.revision ?? null;
    sourcePath.value = draft.sourcePath || '';
    if (draft.name) onIdentity?.(draft.name);
  }

  function repository() {
    return {
      create: createProject,
      update: updateProject,
      upload: uploadSource,
      download: downloadSource,
    };
  }

  async function execute({ mode, name, copyFromPath = null }) {
    const captured = capture(name);
    if (!captured) return { status: 'idle' };
    try {
      return await executeCaptured(captured, { mode, name, copyFromPath });
    } catch (error) {
      status.value = 'error';
      detail.value = toUserError(error).message;
      return { status: 'error', error };
    }
  }

  async function executeCaptured(captured, { mode, name, copyFromPath }) {
    await auth.whenReady();
    if (!auth.isAuthenticated.value) {
      await writeDraft({
        intent: 'save',
        kind,
        name: captured.name,
        sourceText: captured.sourceText || null,
        row: captured.row,
        projectId: mode === 'update' ? projectId.value : null,
        revision: revision.value,
        sourcePath: sourcePath.value || null,
        returnPath,
        savedAt: new Date().toISOString(),
      });
      await router.push({ name: 'Login', query: { next: returnPath } });
      return { status: 'login' };
    }
    status.value = 'saving';
    detail.value = '';
    const result = await runSave({
      repo: repository(),
      projectId: mode === 'create' ? '' : projectId.value,
      revision: revision.value,
      row: captured.row,
      sourceText: mode === 'create' ? captured.sourceText : null,
      userId: auth.user.value?.id,
      copyFromPath: mode === 'create' ? copyFromPath : null,
    });
    if (result.status === 'offline') {
      pending = { mode, name, copyFromPath };
      status.value = 'offline';
      detail.value = userMessage('offline');
      return result;
    }
    if (result.status === 'conflict') {
      status.value = 'conflict';
      conflictOpen.value = true;
      return result;
    }
    if (result.status === 'error') {
      status.value = 'error';
      detail.value = toUserError(result.error).message;
      return result;
    }
    adopt(result.row);
    if (result.fileWarning) detail.value = userMessage('storage');
    await clearDraft(kind);
    if (mode === 'create' && result.row?.id) await router.replace(`/progetti/${result.row.id}`);
    return result;
  }

  async function save() {
    if (projectId.value) return execute({ mode: 'update' });
    const captured = capture();
    if (!captured?.name) {
      nameDraft.value = '';
      nameOpen.value = true;
      return { status: 'name' };
    }
    return execute({ mode: 'create', name: captured.name });
  }

  function askSaveAs() {
    const captured = capture();
    nameDraft.value = captured?.name || '';
    nameOpen.value = true;
  }

  async function confirmName() {
    const name = clampName(nameDraft.value, fallbackName);
    nameOpen.value = false;
    return execute({
      mode: 'create',
      name,
      copyFromPath: projectId.value ? sourcePath.value : null,
    });
  }

  async function overwrite() {
    try {
      const remote = await getProject(projectId.value);
      if (!remote) {
        status.value = 'error';
        detail.value = userMessage('not_found');
        return;
      }
      revision.value = remote.revision;
      conflictOpen.value = false;
      return execute({ mode: 'update' });
    } catch (error) {
      status.value = 'error';
      detail.value = toUserError(error).message;
    }
  }

  async function reloadRemote() {
    try {
      const remote = await getProject(projectId.value);
      if (!remote) {
        status.value = 'error';
        detail.value = userMessage('not_found');
        return;
      }
      const migrated = migrate(kind, remote.schema_version, remote.data);
      if (migrated.status === 'too-new') {
        status.value = 'error';
        detail.value = userMessage('too_new');
        return;
      }
      restore(migrated.data, remote);
      adopt(remote);
      conflictOpen.value = false;
    } catch (error) {
      status.value = 'error';
      detail.value = toUserError(error).message;
    }
  }

  async function saveCopy() {
    conflictOpen.value = false;
    const captured = capture();
    return execute({
      mode: 'create',
      name: clampName(`Copia di ${captured?.name || ''}`, fallbackName),
      copyFromPath: sourcePath.value || null,
    });
  }

  async function retry() {
    if (!pending) return save();
    const job = pending;
    pending = null;
    return execute(job);
  }

  function onOnline() {
    if (status.value === 'offline') void retry();
  }

  function scheduleRecovery() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (!dirty.value) return;
      const existing = await readDraft(kind);
      if (existing?.intent === 'save') return;
      const captured = capture();
      if (!captured) return;
      await writeDraft({
        intent: null,
        kind,
        name: captured.name,
        sourceText: captured.sourceText || null,
        row: captured.row,
        projectId: projectId.value || null,
        revision: revision.value,
        sourcePath: sourcePath.value || null,
        returnPath,
        savedAt: new Date().toISOString(),
      });
    }, 2000);
  }

  watch(dirty, value => {
    if (status.value === 'saving') return;
    if (value) status.value = projectId.value ? 'unsaved' : 'new';
    else if (projectId.value && status.value !== 'error' && status.value !== 'offline') {
      status.value = 'saved';
    }
    scheduleRecovery();
  });

  if (typeof window !== 'undefined') window.addEventListener('online', onOnline);
  onBeforeUnmount(() => {
    clearTimeout(timer);
    if (typeof window !== 'undefined') window.removeEventListener('online', onOnline);
  });

  function beforeUnload(event) {
    if (!dirty.value) return;
    event.preventDefault();
    event.returnValue = '';
  }

  return {
    status,
    detail,
    label,
    projectId,
    nameOpen,
    conflictOpen,
    nameDraft,
    adopt,
    bindDraft,
    save,
    askSaveAs,
    confirmName,
    overwrite,
    reloadRemote,
    saveCopy,
    retry,
    beforeUnload,
    pendingDraft: () => readDraft(kind),
  };
}

<template>
  <p v-if="phase === 'loading'" class="workspace-state" role="status">Caricamento...</p>
  <section v-else-if="phase !== 'ready'" class="account-page">
    <h1>Progetto</h1>
    <p class="account-lead" role="alert">{{ message }}</p>
    <router-link class="btn btn-ghost" to="/progetti">I miei progetti</router-link>
  </section>
  <Editor v-else-if="record?.kind === 'part'" :record="record" />
  <Calculator v-else-if="record?.kind === 'profile'" :record="record" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useAuth } from '@/composables/useAuth.js';
import { useShell } from '@/composables/useShell.js';
import { migrate } from '@/persistence/envelope.js';
import { getProject } from '@/services/supabase/projects.js';
import { toUserError, userMessage } from '@/services/supabase/errors.js';
import Calculator from './Calculator.vue';
import Editor from './Editor.vue';
import '@/assets/styles/account.css';

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const shell = useShell();
const phase = ref('loading');
const message = ref('');
const record = ref(null);

async function load(id) {
  phase.value = 'loading';
  message.value = '';
  record.value = null;
  shell.value = 'page';
  await auth.whenReady();
  if (!auth.isAuthenticated.value) {
    await router.replace({ name: 'Login', query: { next: route.fullPath } });
    return;
  }
  try {
    const row = await getProject(id);
    if (!row) {
      phase.value = 'missing';
      message.value = userMessage('not_found');
      return;
    }
    const migrated = migrate(row.kind, row.schema_version, row.data);
    if (migrated.status === 'too-new') {
      phase.value = 'too-new';
      message.value = userMessage('too_new');
      return;
    }
    record.value = { ...row, data: migrated.data, schema_version: migrated.schemaVersion };
    shell.value = row.kind === 'part' ? 'editor' : 'page';
    phase.value = 'ready';
  } catch (error) {
    phase.value = 'error';
    message.value = toUserError(error).message;
  }
}

onMounted(() => {
  if (route.name === 'ProjectShell') {
    phase.value = 'missing';
    message.value = userMessage('not_found');
    return;
  }
  if (!route.params.id || route.params.id === 'id') return;
  void load(route.params.id);
});

watch(
  () => route.params.id,
  id => {
    if (!id || id === 'id') return;
    void load(id);
  }
);

onBeforeUnmount(() => {
  shell.value = 'page';
});
</script>

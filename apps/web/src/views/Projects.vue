<template>
  <section class="account-page projects-page">
    <p v-if="!ready" role="status">Caricamento...</p>
    <template v-else>
      <header class="projects-head">
        <div>
          <p class="page-kicker">Account</p>
          <h1>I miei progetti</h1>
        </div>
        <div class="account-actions">
          <router-link class="btn btn-primary" to="/editor">Nuovo pezzo da DXF</router-link>
          <router-link class="btn btn-ghost" to="/calcolatore-sviluppo-lamiera"
            >Nuovo profilo</router-link
          >
        </div>
      </header>

      <p v-if="localCount" class="account-note">
        Hai {{ localCount }} progetti salvati in questo browser.
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="importing"
          @click="importLocal"
        >
          Importali nell’account
        </button>
      </p>
      <p v-if="banner" class="account-note" role="status">{{ banner }}</p>

      <div class="projects-tools">
        <label for="project-search"
          >Cerca
          <input
            id="project-search"
            v-model="search"
            class="form-input"
            type="search"
            placeholder="Nome"
          />
        </label>
        <label for="project-sort"
          >Ordina
          <select id="project-sort" v-model="sort" class="form-input">
            <option value="updated_at">Ultima modifica</option>
            <option value="name">Nome</option>
          </select>
        </label>
      </div>

      <p v-if="loading" role="status">Caricamento...</p>
      <p v-else-if="error" role="alert">{{ error }}</p>
      <p v-else-if="!rows.length" class="project-empty">Nessun progetto in questo account.</p>
      <table v-else class="projects-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Materiale</th>
            <th>Spessore</th>
            <th>Pieghe</th>
            <th>Modifica</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in rows" :key="project.id">
            <td>
              <router-link :to="`/progetti/${project.id}`">{{ project.name }}</router-link>
            </td>
            <td>{{ project.kind === 'part' ? 'Pezzo' : 'Profilo' }}</td>
            <td>{{ materialLabel(project.material_id) }}</td>
            <td>{{ project.thickness ?? '—' }}</td>
            <td>{{ project.bend_count ?? '—' }}</td>
            <td>{{ formatUpdatedAt(project.updated_at) }}</td>
            <td class="projects-row-actions">
              <router-link class="btn btn-ghost btn-sm" :to="`/progetti/${project.id}`"
                >Apri</router-link
              >
              <button type="button" class="btn btn-ghost btn-sm" @click="duplicate(project)">
                Duplica
              </button>
              <button type="button" class="btn btn-ghost btn-sm" @click="askDelete(project)">
                Elimina
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="count > pageSize" class="account-actions">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="page === 0"
          @click="changePage(-1)"
        >
          Precedenti
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="(page + 1) * pageSize >= count"
          @click="changePage(1)"
        >
          Successivi
        </button>
      </div>
    </template>

    <EditorDialog
      :open="Boolean(pendingDelete)"
      title="Elimina progetto"
      title-id="delete-project-title"
      @close="pendingDelete = null"
    >
      <p class="dialog-copy">
        Eliminare “{{ pendingDelete?.name }}”? Il DXF originale viene rimosso insieme al progetto.
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="pendingDelete = null">Annulla</button>
        <button type="button" class="btn btn-primary" @click="confirmDelete">Elimina</button>
      </div>
    </EditorDialog>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import EditorDialog from '@/components/editor/EditorDialog.vue';
import { readProjects } from '@/calculator/projects.js';
import { useAuth } from '@/composables/useAuth.js';
import { formatUpdatedAt } from '@/persistence/envelope.js';
import { materialLabel, profileFromLocal, profileRow } from '@/persistence/profileAdapter.js';
import { duplicateOwnedProject, removeOwnedProject } from '@/persistence/projectActions.js';
import { createProject, listProjects } from '@/services/supabase/projects.js';
import { toUserError } from '@/services/supabase/errors.js';
import '@/assets/styles/account.css';

useHead({
  title: 'I miei progetti | SviluppoLamiera',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const pageSize = 50;
const auth = useAuth();
const route = useRoute();
const router = useRouter();
const ready = ref(false);
const loading = ref(true);
const importing = ref(false);
const rows = ref([]);
const count = ref(0);
const search = ref('');
const sort = ref('updated_at');
const page = ref(0);
const error = ref('');
const banner = ref('');
const pendingDelete = ref(null);
const localCount = ref(0);
let searchTimer = null;

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const result = await listProjects({
      search: search.value,
      sort: sort.value,
      page: page.value,
      pageSize,
    });
    rows.value = result.rows;
    count.value = result.count;
  } catch (cause) {
    error.value = toUserError(cause).message;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await auth.whenReady();
  if (!auth.isAuthenticated.value) {
    await router.replace({ name: 'Login', query: { next: route.fullPath } });
    return;
  }
  localCount.value = readProjects().length;
  ready.value = true;
  await load();
});

watch(sort, () => {
  page.value = 0;
  void load();
});

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 0;
    void load();
  }, 300);
});

function changePage(delta) {
  page.value += delta;
  void load();
}

function askDelete(project) {
  pendingDelete.value = project;
}

async function confirmDelete() {
  const project = pendingDelete.value;
  pendingDelete.value = null;
  if (!project) return;
  try {
    await removeOwnedProject(project);
    banner.value = `Progetto “${project.name}” eliminato.`;
    await load();
  } catch (cause) {
    banner.value = toUserError(cause).message;
  }
}

async function duplicate(project) {
  try {
    await duplicateOwnedProject(project, auth.user.value?.id);
    banner.value = `Copia di “${project.name}” creata.`;
    await load();
  } catch (cause) {
    banner.value = toUserError(cause).message;
  }
}

async function importLocal() {
  importing.value = true;
  banner.value = '';
  const local = readProjects();
  let imported = 0;
  try {
    for (const item of local) {
      await createProject(profileRow(profileFromLocal(item), item.nome || 'Profilo'));
      imported += 1;
    }
    banner.value = imported
      ? `Importati ${imported} progetti. Le copie in questo browser restano dove sono.`
      : 'Nessun progetto locale da importare.';
    localCount.value = readProjects().length;
    await load();
  } catch (cause) {
    banner.value = toUserError(cause).message;
  } finally {
    importing.value = false;
  }
}
</script>

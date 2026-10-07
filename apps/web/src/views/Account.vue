<template>
  <section class="account-page">
    <p v-if="!ready" role="status">Caricamento...</p>
    <template v-else>
      <p class="page-kicker">Account</p>
      <h1>Il tuo account</h1>
      <div class="account-card">
        <img
          v-if="auth.avatarUrl.value"
          :src="auth.avatarUrl.value"
          alt=""
          class="account-avatar"
        />
        <label for="display-name"
          >Nome
          <input id="display-name" v-model="name" class="form-input" type="text" maxlength="120" />
        </label>
        <p class="account-meta">Email: {{ auth.user.value?.email }}</p>
        <p v-if="auth.profile.value?.created_at" class="account-meta">
          Account creato il {{ created }}
        </p>
        <p v-if="notice" class="account-note" role="status">{{ notice }}</p>
        <div class="account-actions">
          <button type="button" class="btn btn-primary" :disabled="saving" @click="saveName">
            Salva nome
          </button>
          <button type="button" class="btn btn-ghost" :disabled="exporting" @click="downloadData">
            Scarica i miei dati
          </button>
          <router-link class="btn btn-ghost" to="/progetti">I miei progetti</router-link>
        </div>
      </div>

      <div class="account-card account-danger">
        <h2>Elimina account</h2>
        <p>
          Vengono eliminati il profilo, i progetti e i DXF originali. L’operazione non si può
          annullare.
        </p>
        <label for="confirm-email"
          >Digita {{ auth.user.value?.email }} per confermare
          <input
            id="confirm-email"
            v-model="confirmEmail"
            class="form-input"
            type="email"
            autocomplete="off"
          />
        </label>
        <p v-if="deleteError" class="account-note" role="alert">{{ deleteError }}</p>
        <button type="button" class="btn btn-primary" :disabled="deleting" @click="remove">
          {{ deleting ? 'Eliminazione...' : 'Elimina account' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useAuth } from '@/composables/useAuth.js';
import { formatUpdatedAt } from '@/persistence/envelope.js';
import { buildAccountExport } from '@/persistence/exportAccount.js';
import { deleteAccount } from '@/services/supabase/account.js';
import { toUserError } from '@/services/supabase/errors.js';
import '@/assets/styles/account.css';

useHead({
  title: 'Account | SviluppoLamiera',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const auth = useAuth();
const route = useRoute();
const router = useRouter();
const ready = ref(false);
const name = ref('');
const notice = ref('');
const saving = ref(false);
const exporting = ref(false);
const deleting = ref(false);
const deleteError = ref('');
const confirmEmail = ref('');
const created = computed(() => formatUpdatedAt(auth.profile.value?.created_at));

onMounted(async () => {
  await auth.whenReady();
  if (!auth.isAuthenticated.value) {
    await router.replace({ name: 'Login', query: { next: route.fullPath } });
    return;
  }
  name.value = auth.displayName.value;
  ready.value = true;
});

async function saveName() {
  saving.value = true;
  notice.value = '';
  try {
    await auth.saveDisplayName(name.value);
    notice.value = 'Nome aggiornato.';
  } catch (error) {
    notice.value = toUserError(error).message;
  } finally {
    saving.value = false;
  }
}

async function downloadData() {
  exporting.value = true;
  notice.value = '';
  try {
    const payload = await buildAccountExport({
      email: auth.user.value?.email || '',
      profile: auth.profile.value,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sviluppolamiera-dati.json';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    notice.value = toUserError(error).message;
  } finally {
    exporting.value = false;
  }
}

async function remove() {
  deleteError.value = '';
  if (
    confirmEmail.value.trim().toLowerCase() !== String(auth.user.value?.email || '').toLowerCase()
  ) {
    deleteError.value = 'Digita l’email dell’account per confermare.';
    return;
  }
  deleting.value = true;
  try {
    await deleteAccount();
    await auth.signOut();
    await router.replace('/');
  } catch (error) {
    deleteError.value = toUserError(error).message;
    deleting.value = false;
  }
}
</script>

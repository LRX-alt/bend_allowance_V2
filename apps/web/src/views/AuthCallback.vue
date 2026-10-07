<template>
  <section class="account-page">
    <h1>Accesso</h1>
    <p class="account-lead" role="status">{{ message }}</p>
    <router-link v-if="failed" class="btn btn-primary" to="/login">Torna all’accesso</router-link>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useAuth } from '@/composables/useAuth.js';
import { safeNext } from '@/services/supabase/auth.js';
import { oauthErrorMessage } from '@/services/supabase/errors.js';
import '@/assets/styles/account.css';

useHead({
  title: 'Accesso | SviluppoLamiera',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const auth = useAuth();
const route = useRoute();
const router = useRouter();
const message = ref('Caricamento...');
const failed = ref(false);

onMounted(async () => {
  const oauthError = new URLSearchParams(window.location.search).get('error');
  if (oauthError) {
    message.value = oauthErrorMessage(oauthError);
    failed.value = true;
    return;
  }
  await auth.whenReady();
  if (!auth.isAuthenticated.value) {
    message.value = 'Accesso non riuscito. Riprova.';
    failed.value = true;
    return;
  }
  await router.replace(safeNext(route.query.next));
});
</script>

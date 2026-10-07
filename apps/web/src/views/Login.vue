<template>
  <section class="account-page">
    <p class="page-kicker">Account</p>
    <h1>Accedi</h1>
    <p class="account-lead">
      Il calcolatore e l’editor restano utilizzabili senza account. L’accesso serve per salvare i
      progetti e riaprirli da un altro dispositivo.
    </p>
    <p v-if="!auth.configured" class="account-note" role="status">
      L’accesso non è ancora configurato su questo ambiente.
    </p>
    <p v-if="auth.errorMessage.value" class="account-note" role="alert">
      {{ auth.errorMessage.value }}
    </p>
    <button
      type="button"
      class="btn btn-primary"
      :disabled="!auth.configured || pending"
      @click="enter"
    >
      {{ pending ? 'Reindirizzamento…' : 'Continua con Google' }}
    </button>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useAuth } from '@/composables/useAuth.js';
import { safeNext } from '@/services/supabase/auth.js';
import '@/assets/styles/account.css';

useHead({
  title: 'Accedi | SviluppoLamiera',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const auth = useAuth();
const route = useRoute();
const router = useRouter();
const pending = ref(false);

async function enter() {
  pending.value = true;
  try {
    await auth.signInWithGoogle(safeNext(route.query.next));
  } catch {
    pending.value = false;
  }
}

onMounted(async () => {
  await auth.whenReady();
  if (auth.isAuthenticated.value) {
    await router.replace(safeNext(route.query.next));
  }
});
</script>

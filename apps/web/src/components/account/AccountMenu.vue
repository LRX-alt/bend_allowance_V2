<template>
  <details class="account-menu">
    <summary>
      <img
        v-if="auth.avatarUrl.value && showAvatar"
        :src="auth.avatarUrl.value"
        alt=""
        @error="showAvatar = false"
      />
      <span>{{ auth.displayName.value }}</span>
    </summary>
    <div class="account-menu-panel">
      <p>{{ auth.user.value?.email }}</p>
      <router-link to="/progetti" @click="close">I miei progetti</router-link>
      <router-link to="/account" @click="close">Account</router-link>
      <button type="button" @click="logout">Esci</button>
    </div>
  </details>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth.js';

const auth = useAuth();
const router = useRouter();
const showAvatar = ref(true);

function close(event) {
  event.currentTarget.closest('details')?.removeAttribute('open');
}

async function logout() {
  await auth.signOut();
  await router.push('/');
}
</script>

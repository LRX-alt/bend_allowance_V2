import { ViteSSG } from 'vite-ssg';
import App from './App.vue';
import { routes } from './router/index.js';

// Import design system
import './assets/styles/design-system.css';

// ViteSSG sostituisce createApp(App).mount('#app'): crea l'app, il router
// (con createWebHistory) e gestisce sia il pre-render statico (build) sia
// l'idratazione lato client. La gestione del <head> avviene tramite
// @unhead/vue (useHead) nei singoli componenti.
export const createApp = ViteSSG(
  App,
  { routes },
  ({ app, router }) => {
    void app;
    void router;
  }
);

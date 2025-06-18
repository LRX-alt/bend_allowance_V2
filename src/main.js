import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js'; // Importa il router

// Import design system
import './assets/styles/design-system.css';

createApp(App)
  .use(router) // Usa il router nell'app
  .mount('#app');

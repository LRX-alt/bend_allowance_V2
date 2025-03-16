import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importa il router

createApp(App)
  .use(router) // Usa il router nell'app
  .mount('#app');

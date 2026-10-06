import Home from '../views/Home.vue';
import Calculator from '../views/Calculator.vue';
import Editor from '../views/Editor.vue';
import MaterialsGuide from '../views/MaterialsGuide.vue';

// Le route sono passate a ViteSSG (vedi src/main.js), che si occupa di creare
// il router e la history. I meta tag SEO per pagina sono gestiti tramite
// `useHead` nei rispettivi componenti, così da essere "cotti" nell'HTML
// statico durante il pre-render.
export const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/calcolatore-sviluppo-lamiera',
    name: 'Calculator',
    component: Calculator,
  },
  {
    path: '/editor',
    name: 'Editor',
    component: Editor,
  },
  {
    path: '/guida-materiali',
    name: 'MaterialsGuide',
    component: MaterialsGuide,
  },
  // Redirect dalla vecchia URL per SEO
  {
    path: '/calculator',
    redirect: '/calcolatore-sviluppo-lamiera',
  },
];

export default routes;

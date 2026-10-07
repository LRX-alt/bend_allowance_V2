import Home from '../views/Home.vue';
import Calculator from '../views/Calculator.vue';
import Editor from '../views/Editor.vue';
import MaterialsGuide from '../views/MaterialsGuide.vue';
import BendAllowance from '../views/BendAllowance.vue';
import BendDeduction from '../views/BendDeduction.vue';
import KFactor from '../views/KFactor.vue';
import DieOpening from '../views/DieOpening.vue';
import Springback from '../views/Springback.vue';
import DxfEdit from '../views/DxfEdit.vue';
import Login from '../views/Login.vue';
import AuthCallback from '../views/AuthCallback.vue';
import Account from '../views/Account.vue';
import Projects from '../views/Projects.vue';
import ProjectWorkspace from '../views/ProjectWorkspace.vue';

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
  {
    path: '/bend-allowance',
    name: 'BendAllowance',
    component: BendAllowance,
  },
  {
    path: '/bend-deduction',
    name: 'BendDeduction',
    component: BendDeduction,
  },
  {
    path: '/fattore-k',
    name: 'KFactor',
    component: KFactor,
  },
  {
    path: '/cava-v-pressopiegatrice',
    name: 'DieOpening',
    component: DieOpening,
  },
  {
    path: '/ritorno-elastico',
    name: 'Springback',
    component: Springback,
  },
  {
    path: '/modifica-sviluppo-dxf',
    name: 'DxfEdit',
    component: DxfEdit,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: AuthCallback,
  },
  {
    path: '/account',
    name: 'Account',
    component: Account,
    meta: { requiresAuth: true },
  },
  {
    path: '/progetti',
    name: 'Projects',
    component: Projects,
    meta: { requiresAuth: true },
  },
  {
    path: '/progetti/:id',
    name: 'ProjectWorkspace',
    component: ProjectWorkspace,
    meta: { requiresAuth: true },
  },
  {
    path: '/apertura-progetto',
    name: 'ProjectShell',
    component: ProjectWorkspace,
    meta: { requiresAuth: true },
  },
  // Redirect dalla vecchia URL per SEO
  {
    path: '/calculator',
    redirect: '/calcolatore-sviluppo-lamiera',
  },
];

export default routes;

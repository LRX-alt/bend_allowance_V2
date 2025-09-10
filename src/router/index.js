import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Calculator from '../views/Calculator.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Calcolatore Sviluppo Lamiera | Bend Allowance Calculator Online Gratuito',
      description: 'Calcolatore professionale per sviluppo lamiera, bend allowance, bend deduction e setback. Strumento avanzato per calcolo piegatura lamiera, ottimizzato per industria metalmeccanica.',
      keywords: 'calcolatore sviluppo lamiera, bend allowance calculator, calcolo piegatura lamiera, bend deduction, setback lamiera',
      ogTitle: 'Calcolatore Sviluppo Lamiera | Bend Allowance Calculator Online',
      ogDescription: 'Calcolatore professionale per calcolo piegatura lamiera. Bend allowance, bend deduction, setback online gratuitamente.',
    },
  },
  {
    path: '/calcolatore-sviluppo-lamiera',
    name: 'Calculator',
    component: Calculator,
    meta: {
      title: 'Calcolatore Piegatura Lamiera | Bend Allowance Calculator Online',
      description: 'Calcola bend allowance, bend deduction e setback per piegatura lamiera. Strumento professionale con formule DIN 6935, supporto multi-materiale e ottimizzazione matrice V-die.',
      keywords: 'calcolatore piegatura lamiera, bend allowance online, bend deduction calculator, calcolo setback lamiera, formula piegatura',
      ogTitle: 'Calcolatore Piegatura Lamiera | Bend Allowance Calculator',
      ogDescription: 'Calcola bend allowance, bend deduction e setback per piegatura lamiera professionale. Formule DIN 6935, multi-materiale.',
    },
  },
  // Redirect dalla vecchia URL per SEO
  {
    path: '/calculator',
    redirect: '/calcolatore-sviluppo-lamiera',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Gestione dinamica dei meta tags per SEO
router.beforeEach((to, from, next) => {
  // Aggiorna il titolo della pagina
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // Aggiorna meta description
  if (to.meta.description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', to.meta.description);
    }
  }

  // Aggiorna keywords
  if (to.meta.keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', to.meta.keywords);
    }
  }

  // Aggiorna Open Graph tags
  if (to.meta.ogTitle) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', to.meta.ogTitle);
    }
  }

  if (to.meta.ogDescription) {
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', to.meta.ogDescription);
    }
  }

  // Aggiorna canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const baseUrl = 'https://bend-allowance-calculator.com';
    canonical.setAttribute('href', baseUrl + to.path);
  }

  next();
});

export default router;

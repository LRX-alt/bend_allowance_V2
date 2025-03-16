import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Calculator from '../views/Calculator.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/calculator',
    name: 'Calculator',
    component: Calculator
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
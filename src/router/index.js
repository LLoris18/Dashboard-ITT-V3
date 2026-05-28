import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  { path: '/', redirect: '/lots' },
  { path: '/login',           name: 'Login',          component: () => import('@/views/LoginView.vue'),          meta: { public: true } },
  { path: '/lots',            name: 'Lots',            component: () => import('@/views/LotsView.vue'),           meta: { requiresAuth: true, feature: 'lots' } },
  { path: '/my-requests',     name: 'MyRequests',      component: () => import('@/views/MyRequestsView.vue'),     meta: { requiresAuth: true, feature: 'my-requests' } },
  { path: '/manage-requests', name: 'ManageRequests',  component: () => import('@/views/ManageRequestsView.vue'), meta: { requiresAuth: true, feature: 'manage-requests' } },
  { path: '/verifica',        name: 'Verifica',        component: () => import('@/views/VerificaView.vue'),       meta: { requiresAuth: true, feature: 'verifica' } },
  { path: '/bom',             name: 'Bom',             component: () => import('@/views/BomView.vue'),            meta: { requiresAuth: true, feature: 'bom' } },
  { path: '/jobs',            name: 'Jobs',            component: () => import('@/views/JobsView.vue'),           meta: { requiresAuth: true, feature: 'jobs' } },
  { path: '/fatturazione',    name: 'Fatturazione',    component: () => import('@/views/FatturazioneView.vue'),   meta: { requiresAuth: true, feature: 'billing' } },
  { path: '/bolle-editabili', name: 'BolleEditabili',  component: () => import('@/views/DeliveryNotesView.vue'), meta: { requiresAuth: true, feature: 'delivery-notes' } },
  { path: '/clf-produzione',  name: 'ClfProduzione',       component: () => import('@/views/ClfProduzioneView.vue'),        meta: { requiresAuth: true, feature: 'clf-produzione' } },
  { path: '/ddt-spedizione', name: 'StockDeliveryNote',   component: () => import('@/views/StockDeliveryNoteView.vue'),    meta: { requiresAuth: true, feature: 'stock-delivery-note' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.public) { return auth.isAuthenticated ? next('/lots') : next() }
  if (to.meta.requiresAuth && !auth.isAuthenticated) return next('/login')
  // Controlla il permesso feature
  if (to.meta.feature && !auth.can(to.meta.feature)) return next('/lots')
  next()
})

export default router

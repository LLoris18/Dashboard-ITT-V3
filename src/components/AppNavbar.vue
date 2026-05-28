<template>
  <aside class="fixed inset-y-0 left-0 z-50 flex flex-col w-14 md:w-52"
    style="background-color:#1A1714; border-right:1px solid rgba(255,255,255,0.06);">

    <!-- Logo + brand -->
    <div class="flex items-center justify-center md:justify-start gap-2.5 px-2 md:px-3 py-3.5"
      style="border-bottom:1px solid rgba(255,255,255,0.06);">
      <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style="background-color:#D97706;">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:15px;height:15px;color:#fff;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
        </svg>
      </div>
      <div class="hidden md:block min-w-0">
        <p class="font-bold text-white text-xs tracking-tight leading-tight">Warehouse</p>
        <span :class="['text-[10px] px-1.5 py-px rounded font-semibold mt-0.5 inline-block', roleBadgeClass]">
          {{ roleLabel }}
        </span>
      </div>
    </div>

    <!-- Navigation — no overflow scroll, compact -->
    <nav class="flex-1 px-1.5 md:px-2 py-2 space-y-px">

      <p class="nav-group-label">Magazzino</p>

      <RouterLink v-if="auth.can('lots')" to="/lots"
        class="nav-link" :class="{ active: route.name === 'Lots' }" title="Lotti CDP">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        <span class="nav-label">Lotti CDP</span>
      </RouterLink>

      <RouterLink v-if="auth.can('my-requests')" to="/my-requests"
        class="nav-link" :class="{ active: route.name === 'MyRequests' }" title="Le mie Richieste">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <span class="nav-label">Richieste</span>
      </RouterLink>

      <RouterLink v-if="auth.can('manage-requests')" to="/manage-requests"
        class="nav-link" :class="{ active: route.name === 'ManageRequests' }" title="Gestione Richieste">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
        </svg>
        <span class="nav-label">Gestione</span>
      </RouterLink>

      <div v-if="auth.can('clf-produzione')" class="pt-1">
        <p class="nav-group-label">Produzione</p>
      </div>

      <RouterLink v-if="auth.can('clf-produzione')" to="/clf-produzione"
        class="nav-link" :class="{ active: route.name === 'ClfProduzione' }" title="CLF Produzione">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
        </svg>
        <span class="nav-label">CLF Produzione</span>
      </RouterLink>

      <div v-if="auth.can('verifica') || auth.can('jobs') || auth.can('delivery-notes') || auth.can('stock-delivery-note')"
        class="pt-1">
        <p class="nav-group-label">Operazioni</p>
      </div>

      <RouterLink v-if="auth.can('verifica')" to="/verifica"
        class="nav-link" :class="{ active: route.name === 'Verifica' }" title="Verifica">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m0 10l2 2 4-4"/>
        </svg>
        <span class="nav-label">Verifica</span>
      </RouterLink>

      <RouterLink v-if="auth.can('jobs')" to="/jobs"
        class="nav-link" :class="{ active: route.name === 'Jobs' }" title="Jobs">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        </svg>
        <span class="nav-label">Jobs</span>
      </RouterLink>

      <RouterLink v-if="auth.can('delivery-notes')" to="/bolle-editabili"
        class="nav-link" :class="{ active: route.name === 'BolleEditabili' }" title="Bolle Modificabili">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span class="nav-label">Bolle Editabili</span>
      </RouterLink>

      <RouterLink v-if="auth.can('stock-delivery-note')" to="/ddt-spedizione"
        class="nav-link" :class="{ active: route.name === 'StockDeliveryNote' }" title="DDT Spedizione">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
        </svg>
        <span class="nav-label">DDT Spedizione</span>
      </RouterLink>

      <div v-if="auth.can('bom') || auth.can('billing')" class="pt-1">
        <p class="nav-group-label">Amministrazione</p>
      </div>

      <RouterLink v-if="auth.can('bom')" to="/bom"
        class="nav-link" :class="{ active: route.name === 'Bom' }" title="BOM">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h6"/>
        </svg>
        <span class="nav-label">BOM</span>
      </RouterLink>

      <RouterLink v-if="auth.can('billing')" to="/fatturazione"
        class="nav-link" :class="{ active: route.name === 'Fatturazione' }" title="Fatturazione">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span class="nav-label">Fatturazione</span>
      </RouterLink>

    </nav>

    <!-- User info + logout -->
    <div class="px-1.5 md:px-2 py-2.5 shrink-0 space-y-px"
      style="border-top:1px solid rgba(255,255,255,0.06);">
      <div class="hidden md:flex items-center gap-2 px-2 py-1.5 mb-1">
        <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <span class="text-[10px] font-bold text-white/80">{{ initials }}</span>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold text-white/90 leading-tight truncate">{{ auth.userName }}</p>
          <p class="text-[10px] leading-tight" style="color:rgba(255,255,255,0.4);">{{ roleLabel }}</p>
        </div>
      </div>

      <button @click="handleLogout" title="Esci"
        class="nav-link w-full" style="color:rgba(255,255,255,0.4);">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <span class="nav-label">Esci</span>
      </button>
    </div>

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const roleLabel = computed(() => ({
  internal: 'Staff ITT',
  manager:  'Magazzino',
  external: 'Esterno',
}[auth.role] || 'Ospite'))

const roleBadgeClass = computed(() => ({
  internal: 'bg-violet-500/20 text-violet-300',
  manager:  'bg-amber-500/20 text-amber-300',
  external: 'bg-white/10 text-white/50',
}[auth.role] || 'bg-white/10 text-white/50'))

const initials = computed(() => {
  const name = auth.userName || ''
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
})

function handleLogout() {
  auth.doLogout()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  transition: background-color 0.15s, color 0.15s;
  width: 100%;
}
@media (min-width: 768px) {
  .nav-link {
    justify-content: flex-start;
    padding: 0.4rem 0.625rem;
  }
}
.nav-link:hover {
  background-color: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
}
.nav-link.active {
  background-color: rgba(217,119,6,0.18);
  color: #FBB040;
  font-weight: 600;
}
.nav-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
.nav-label {
  display: none;
  white-space: nowrap;
}
@media (min-width: 768px) {
  .nav-label { display: block; }
}
.nav-group-label {
  display: none;
  padding: 0.375rem 0.625rem 0.25rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
}
@media (min-width: 768px) {
  .nav-group-label { display: block; }
}
</style>

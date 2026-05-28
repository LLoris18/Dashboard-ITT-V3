<template>
  <div class="min-h-screen flex bg-gray-50">

    <!-- Sidebar -->
    <aside class="w-64 bg-brand-900 text-white flex flex-col flex-shrink-0">

      <!-- Header sidebar -->
      <div class="px-6 py-5 border-b border-brand-700">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold leading-tight">Warehouse</p>
            <p class="text-xs text-brand-300">Dashboard</p>
          </div>
        </div>
      </div>

      <!-- Navigazione -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.routeName }"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="[
            $route.name === item.routeName
              ? 'bg-brand-600 text-white'
              : 'text-brand-200 hover:bg-brand-800 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Footer sidebar: info utente + logout -->
      <div class="px-4 py-4 border-t border-brand-700">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ auth.displayName }}</p>
            <p class="text-xs text-brand-300">{{ auth.isManager ? 'Gestore Magazzino' : 'Casa Madre' }}</p>
          </div>
        </div>
        <button @click="handleLogout"
          class="w-full flex items-center gap-2 px-3 py-2 text-brand-300 hover:text-white hover:bg-brand-800
                 rounded-lg text-sm transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Esci
        </button>
      </div>
    </aside>

    <!-- Contenuto principale -->
    <main class="flex-1 min-w-0 flex flex-col">
      <RouterView />
    </main>

  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const initials = computed(() => {
  const name = auth.displayName || '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

// Icone inline SVG come componenti funzionali
const IconLots = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
    d: 'M4 6h16M4 10h16M4 14h16M4 18h16' })
])
const IconMyRequests = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
    d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
])
const IconAllRequests = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2',
    d: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' })
])

const navItems = computed(() => {
  const items = [
    { routeName: 'lots',        label: 'Lotti in Magazzino', icon: IconLots },
    { routeName: 'my-requests', label: 'Le mie Richieste',   icon: IconMyRequests },
  ]
  if (auth.isManager) {
    items.push({ routeName: 'all-requests', label: 'Gestione Richieste', icon: IconAllRequests })
  }
  return items
})

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

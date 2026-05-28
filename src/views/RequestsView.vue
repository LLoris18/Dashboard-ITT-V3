<template>
  <div class="flex flex-col h-full">

    <div class="px-8 py-6 bg-white border-b border-gray-200">
      <h1 class="text-xl font-semibold text-gray-900">Le mie Richieste</h1>
      <p class="text-sm text-gray-500 mt-0.5">Storico delle richieste effettuate al magazzino</p>
    </div>

    <div class="flex-1 overflow-auto px-8 py-6">

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg class="animate-spin w-8 h-8 mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-sm">Caricamento richieste...</p>
      </div>

      <!-- Errore -->
      <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        {{ error }}
        <button @click="loadRequests" class="ml-2 underline">Riprova</button>
      </div>

      <!-- Nessuna richiesta -->
      <div v-else-if="requests.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg class="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p class="text-sm font-medium">Nessuna richiesta effettuata</p>
        <p class="text-xs mt-1">Le tue richieste al magazzino appariranno qui</p>
      </div>

      <!-- Lista richieste -->
      <div v-else class="space-y-3">
        <div
          v-for="req in requests"
          :key="req.id"
          class="card p-5 cursor-pointer hover:shadow-md transition-shadow"
          @click="toggleExpand(req.id)"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              <div>
                <p class="font-semibold text-gray-900 font-mono">{{ req.name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(req.request_date) }}</p>
              </div>
              <div class="text-sm text-gray-500">
                <span class="font-medium text-gray-700">{{ req.lot_count }}</span> lotti
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <StateBadge :state="req.state" />
              <svg class="w-4 h-4 text-gray-400 transition-transform"
                :class="expanded.has(req.id) ? 'rotate-180' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          <!-- Dettaglio espanso -->
          <div v-if="expanded.has(req.id)" class="mt-4 pt-4 border-t border-gray-100 space-y-3">

            <!-- Progressione stati -->
            <div class="flex items-center gap-2">
              <template v-for="(step, idx) in stateSteps" :key="step.key">
                <div class="flex items-center gap-1">
                  <div :class="[
                    'w-2 h-2 rounded-full',
                    stateIndex(req.state) >= idx ? 'bg-brand-500' : 'bg-gray-200'
                  ]"/>
                  <span :class="['text-xs', stateIndex(req.state) >= idx ? 'text-brand-600 font-medium' : 'text-gray-400']">
                    {{ step.label }}
                  </span>
                </div>
                <div v-if="idx < stateSteps.length - 1"
                  :class="['flex-1 h-px', stateIndex(req.state) > idx ? 'bg-brand-300' : 'bg-gray-200']"/>
              </template>
            </div>

            <!-- Note -->
            <div v-if="req.notes" class="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span class="font-medium text-amber-700">Note: </span>{{ req.notes }}
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchMyRequests } from '@/api/odoo'
import StateBadge from '@/components/shared/StateBadge.vue'

const auth     = useAuthStore()
const requests = ref([])
const loading  = ref(false)
const error    = ref(null)
const expanded = reactive(new Set())

const stateSteps = [
  { key: 'draft',     label: 'In attesa' },
  { key: 'taken',     label: 'Presa in carico' },
  { key: 'preparing', label: 'In preparazione' },
  { key: 'done',      label: 'Spedita' },
]
const stateOrder = ['draft', 'taken', 'preparing', 'done']
const stateIndex = (state) => stateOrder.indexOf(state)

async function loadRequests() {
  loading.value = true
  error.value   = null
  try {
    requests.value = await fetchMyRequests(auth.uid, auth.password)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function toggleExpand(id) {
  expanded.has(id) ? expanded.delete(id) : expanded.add(id)
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt.replace(' ', 'T')).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(loadRequests)
</script>

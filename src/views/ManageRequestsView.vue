<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestione Richieste</h1>
        <p class="text-gray-500 text-sm mt-1">{{ requests.length }} richieste totali</p>
      </div>
      <button @click="loadRequests" class="btn-secondary text-xs">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Aggiorna
      </button>
    </div>

    <!-- Filtri per stato -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button v-for="f in filters" :key="f.key"
        @click="activeFilter = f.key"
        :class="['px-3 py-1.5 text-xs rounded-lg border transition-colors',
          activeFilter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50']">
        {{ f.label }}
        <span class="ml-1 opacity-70">({{ countByState(f.key) }})</span>
      </button>
    </div>

    <div v-if="loading" class="card flex items-center justify-center py-16 gap-3 text-gray-500">
      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Caricamento...
    </div>

    <div v-else class="card !p-0 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-600">N° Pratica</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Richiedente</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Data</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">Lotti</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600">Stato</th>
            <th class="px-4 py-3 text-right font-medium text-gray-600">Azioni</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="filteredRequests.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-400">Nessuna richiesta in questo stato</td>
          </tr>
          <tr v-for="req in filteredRequests" :key="req.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-mono font-bold text-gray-900">{{ req.name }}</td>
            <td class="px-4 py-3 text-gray-700">{{ req.user_id?.[1] || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(req.request_date) }}</td>
            <td class="px-4 py-3 text-center font-semibold">{{ req.lot_count }}</td>
            <td class="px-4 py-3"><StatusBadge :state="req.state" /></td>
            <td class="px-4 py-3 text-right">
              <div class="flex gap-1 justify-end">
                <button v-if="req.state === 'draft'" @click="changeState(req, 'action_take_charge')"
                  class="btn-secondary !px-2 !py-1 !text-xs">Prendi in carico</button>
                <button v-if="req.state === 'taken'" @click="changeState(req, 'action_start_preparing')"
                  class="btn-secondary !px-2 !py-1 !text-xs">Inizia preparazione</button>
                <button v-if="req.state === 'preparing'" @click="changeState(req, 'action_mark_done')"
                  class="btn-success !px-2 !py-1 !text-xs">Segna Spedita</button>
                <button v-if="req.notes" @click="showNotes(req)"
                  class="btn-secondary !px-2 !py-1 !text-xs text-gray-400" title="Vedi note">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal note -->
    <Teleport to="body">
      <div v-if="notesModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-gray-900">Note — {{ notesModal.name }}</h3>
            <button @click="notesModal = null" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-700 whitespace-pre-line">{{ notesModal.notes }}</p>
          <button @click="notesModal = null" class="mt-4 btn-secondary w-full justify-center">Chiudi</button>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { fetchAllRequests, updateRequestState } from '@/api/odoo-service.js'
import StatusBadge from '@/components/StatusBadge.vue'

const auth     = useAuthStore()
const requests = ref([])
const loading  = ref(false)
const activeFilter = ref('all')
const notesModal   = ref(null)

const filters = [
  { key: 'all',       label: 'Tutte' },
  { key: 'draft',     label: 'In attesa' },
  { key: 'taken',     label: 'Prese in carico' },
  { key: 'preparing', label: 'In preparazione' },
  { key: 'done',      label: 'Evase' },
]

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return requests.value
  return requests.value.filter(r => r.state === activeFilter.value)
})

function countByState(key) {
  if (key === 'all') return requests.value.length
  return requests.value.filter(r => r.state === key).length
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function showNotes(req) { notesModal.value = req }

async function loadRequests() {
  loading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    requests.value = await fetchAllRequests(uid, password)
  } finally { loading.value = false }
}

async function changeState(req, action) {
  try {
    const { uid, password } = auth.getCredentials()
    await updateRequestState(uid, password, req.id, action)
    await loadRequests()
  } catch (err) { alert('Errore: ' + err.message) }
}

onMounted(loadRequests)
</script>

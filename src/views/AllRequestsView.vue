<template>
  <div class="flex flex-col h-full">

    <div class="px-8 py-6 bg-white border-b border-gray-200 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Gestione Richieste</h1>
        <p class="text-sm text-gray-500 mt-0.5">Tutte le richieste ricevute dalla casa madre</p>
      </div>
      <button @click="loadRequests" :disabled="loading" class="btn-secondary">
        <svg class="w-4 h-4" :class="loading ? 'animate-spin' : ''"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Aggiorna
      </button>
    </div>

    <!-- Filtri -->
    <div class="px-8 py-3 bg-white border-b border-gray-100 flex items-center gap-3 flex-wrap">
      <button
        v-for="f in filters" :key="f.key"
        @click="activeFilter = f.key"
        :class="['px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
          activeFilter === f.key
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400']"
      >
        {{ f.label }}
        <span class="ml-1 opacity-70">({{ countByState(f.key) }})</span>
      </button>
    </div>

    <div class="flex-1 overflow-auto px-8 py-6">

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
        <svg class="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>

      <!-- Errore -->
      <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        {{ error }}
      </div>

      <!-- Tabella richieste -->
      <div v-else class="card overflow-hidden">
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
              <td colspan="6" class="text-center py-10 text-gray-400 text-sm">
                Nessuna richiesta in questo stato
              </td>
            </tr>
            <tr
              v-for="req in filteredRequests"
              :key="req.id"
              class="hover:bg-gray-50"
            >
              <td class="px-4 py-3 font-mono font-semibold text-gray-900">{{ req.name }}</td>
              <td class="px-4 py-3 text-gray-700">{{ req.user_id?.[1] || '—' }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDate(req.request_date) }}</td>
              <td class="px-4 py-3 text-center font-medium">{{ req.lot_count }}</td>
              <td class="px-4 py-3">
                <StateBadge :state="req.state" />
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">

                  <!-- Pulsante azione contestuale -->
                  <button
                    v-if="nextAction(req.state)"
                    @click="handleStateChange(req, nextAction(req.state).action)"
                    :disabled="updatingId === req.id"
                    class="btn-primary text-xs py-1.5"
                  >
                    <svg v-if="updatingId === req.id" class="animate-spin w-3 h-3"
                      fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {{ nextAction(req.state).label }}
                  </button>
                  <span v-else class="text-xs text-gray-400 italic">Evasa</span>

                  <!-- Dettaglio note -->
                  <button
                    v-if="req.notes"
                    @click="viewNotes(req)"
                    class="btn-secondary text-xs py-1.5"
                    title="Visualizza note"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    </div>

    <!-- Modal note -->
    <div v-if="notesModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="card w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900">Note — {{ notesModal.name }}</h3>
          <button @click="notesModal = null" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ notesModal.notes }}</p>
      </div>
    </div>

    <!-- Toast successo -->
    <SuccessToast v-if="successMessage" :message="successMessage" @close="successMessage = null"/>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchAllRequests, updateRequestState } from '@/api/odoo'
import StateBadge  from '@/components/shared/StateBadge.vue'
import SuccessToast from '@/components/shared/SuccessToast.vue'

const auth       = useAuthStore()
const requests   = ref([])
const loading    = ref(false)
const error      = ref(null)
const updatingId = ref(null)
const notesModal = ref(null)
const successMessage = ref(null)
const activeFilter   = ref('all')

const filters = [
  { key: 'all',       label: 'Tutte'           },
  { key: 'draft',     label: 'In attesa'        },
  { key: 'taken',     label: 'Presa in carico'  },
  { key: 'preparing', label: 'In preparazione'  },
  { key: 'done',      label: 'Evase'            },
]

const actions = {
  draft:     { action: 'action_take_charge',    label: 'Prendi in carico'  },
  taken:     { action: 'action_start_preparing', label: 'Inizia preparazione' },
  preparing: { action: 'action_mark_done',       label: 'Segna Spedita'     },
  done:      null,
}
const nextAction = (state) => actions[state] || null

const countByState = (key) => key === 'all'
  ? requests.value.length
  : requests.value.filter((r) => r.state === key).length

const filteredRequests = computed(() =>
  activeFilter.value === 'all'
    ? requests.value
    : requests.value.filter((r) => r.state === activeFilter.value)
)

async function loadRequests() {
  loading.value = true
  error.value   = null
  try {
    requests.value = await fetchAllRequests(auth.uid, auth.password)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleStateChange(req, action) {
  updatingId.value = req.id
  try {
    await updateRequestState(auth.uid, auth.password, req.id, action)
    await loadRequests()
    successMessage.value = `Stato richiesta ${req.name} aggiornato.`
    setTimeout(() => (successMessage.value = null), 4000)
  } catch (e) {
    alert('Errore aggiornamento stato: ' + e.message)
  } finally {
    updatingId.value = null
  }
}

function viewNotes(req) {
  notesModal.value = req
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

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.visible" :class="[
        'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium',
        toast.type === 'success' ? 'bg-green-600'
        : toast.type === 'warning' ? 'bg-orange-500'
        : 'bg-red-600'
      ]">
        <span>{{ toast.message }}</span>
        <button @click="toast.visible = false" class="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </Transition>

    <!-- Header -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Le mie Richieste</h1>
        <p class="text-gray-500 text-sm mt-1">Storico e stato delle tue richieste al magazzino</p>
      </div>
      <button @click="loadRequests" class="btn-secondary text-xs self-start sm:self-auto">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Aggiorna
      </button>
    </div>

    <!-- Filtro stati -->
    <div class="flex flex-wrap gap-2 mb-5">
      <button
        v-for="f in stateFilters" :key="f.key"
        @click="activeFilter = f.key"
        :class="[
          'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
          activeFilter === f.key
            ? f.activeClass
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        ]">
        {{ f.label }}
        <span v-if="countByState(f.key) > 0" class="ml-1 opacity-70">({{ countByState(f.key) }})</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card flex items-center justify-center py-16 gap-3 text-gray-500">
      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Caricamento richieste...
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredRequests.length === 0" class="card text-center py-16 text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
      </svg>
      <p class="font-medium">Nessuna richiesta trovata</p>
      <p class="text-sm mt-1">
        {{ activeFilter === 'all' ? 'Le tue richieste al magazzino appariranno qui' : 'Nessuna richiesta con questo stato' }}
      </p>
    </div>

    <!-- Lista richieste — accordion -->
    <div v-else class="space-y-3">
      <div v-for="req in filteredRequests" :key="req.id"
        class="card !p-0 overflow-hidden transition-shadow hover:shadow-md">

        <!-- Riga header (sempre visibile, cliccabile) -->
        <div
          @click="toggleAccordion(req.id)"
          class="flex items-center gap-4 px-5 py-4 cursor-pointer select-none">

          <!-- Freccia accordion -->
          <svg :class="['w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200',
            openIds.has(req.id) ? 'rotate-90' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>

          <!-- Numero pratica + badge -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono font-bold text-gray-900">{{ req.name }}</span>
              <StatusBadge :state="req.state" />
              <span v-if="req.delivery_mode" :class="['text-xs px-2 py-0.5 rounded-full font-medium', deliveryModeClass(req.delivery_mode)]">
                {{ deliveryModeIcon(req.delivery_mode) }} {{ deliveryModeLabel(req.delivery_mode) }}
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(req.request_date) }}</p>
          </div>

          <!-- Tempo stimato -->
          <div v-if="req.estimated_shipping_time" class="hidden sm:flex flex-col items-end shrink-0">
            <span class="text-xs text-gray-400">Tempo stimato</span>
            <span class="text-xs font-medium text-gray-700">{{ req.estimated_shipping_time }}</span>
          </div>

          <!-- Contatore lotti -->
          <div class="text-right shrink-0">
            <span class="text-xl font-bold text-gray-900">{{ req.lot_count }}</span>
            <p class="text-xs text-gray-400">lotti</p>
          </div>
        </div>

        <!-- Progress bar stati (sempre visibile) -->
        <div class="px-5 pb-3 border-t border-gray-50">
          <div class="flex items-center gap-1 mt-2">
            <div v-for="(step, i) in steps" :key="step.key" class="flex items-center gap-1">
              <div :class="['w-2 h-2 rounded-full transition-colors',
                stepReached(req.state, step.key) ? step.color : 'bg-gray-200']"/>
              <span :class="['text-xs transition-colors',
                stepReached(req.state, step.key) ? 'text-gray-700 font-medium' : 'text-gray-400']">
                {{ step.label }}
              </span>
              <div v-if="i < steps.length - 1" class="w-6 h-px bg-gray-200 mx-1"/>
            </div>
          </div>
        </div>

        <!-- Contenuto accordion (dettagli) -->
        <Transition name="accordion">
          <div v-if="openIds.has(req.id)" class="border-t border-gray-100 bg-gray-50">

            <div class="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

              <!-- Info consegna -->
              <div class="space-y-2">
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dettagli Consegna</h3>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">Modalità</span>
                  <span v-if="req.delivery_mode"
                    :class="['text-xs font-medium px-2 py-0.5 rounded-full', deliveryModeClass(req.delivery_mode)]">
                    {{ deliveryModeIcon(req.delivery_mode) }} {{ deliveryModeLabel(req.delivery_mode) }}
                  </span>
                  <span v-else class="text-xs text-gray-400">—</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">Tempo stimato</span>
                  <span class="text-xs font-medium text-gray-700">
                    {{ req.estimated_shipping_time || '—' }}
                  </span>
                </div>
                <!-- Lead time -->
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">Lead time</span>
                  <span class="text-xs font-medium text-gray-700">
                    {{ getLeadTime(req) }}
                  </span>
                </div>
                <!-- Data evasione -->
                <div v-if="req.tempo_evasione" class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">Evasa il</span>
                  <span class="text-xs font-medium text-green-700">
                    {{ formatDate(req.tempo_evasione) }}
                  </span>
                </div>
                <div v-if="req.picking_id" class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">Picking</span>
                  <span class="text-xs font-mono text-gray-700">{{ req.picking_id[1] || req.picking_id }}</span>
                </div>
              </div>

              <!-- Info lotti -->
              <div class="space-y-2">
                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lotti Richiesti</h3>

                <!-- Badge lotti Odoo -->
                <div v-if="req.lot_names && req.lot_names.length > 0" class="flex flex-wrap gap-1.5">
                  <span v-for="ln in req.lot_names" :key="ln"
                    class="inline-block bg-blue-100 text-blue-800 text-xs font-mono px-2 py-0.5 rounded-md border border-blue-200">
                    {{ ln }}
                  </span>
                </div>
                <div v-else-if="req.lot_count > 0" class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <span class="text-xs text-gray-700">
                    <strong>{{ req.lot_count }}</strong> lotto/i Odoo
                  </span>
                </div>

                <!-- Lotti manuali -->
                <div v-if="req.manual_lot_count > 0" class="flex items-center gap-2 mt-1">
                  <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-xs text-amber-700">
                    <strong>{{ req.manual_lot_count }}</strong> lotto/i manuale/i (non in Odoo)
                  </span>
                </div>
              </div>

            </div>

            <!-- Note -->
            <div v-if="req.notes" class="px-5 pb-4">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note</h3>
              <p class="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200">
                {{ req.notes }}
              </p>
            </div>

            <!-- Tasto Sollecita -->
            <div v-if="req.state !== 'done'" class="px-5 pb-4 flex justify-end">
              <button
                @click.stop="onSollecita(req)"
                :disabled="sollecitaLoading[req.id]"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600
                       text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <svg v-if="sollecitaLoading[req.id]" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {{ sollecitaLoading[req.id] ? 'Invio...' : 'Sollecita Richiesta' }}
              </button>
            </div>

          </div>
        </Transition>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { fetchMyRequests, sendSollecito } from '@/api/odoo-service.js'
import StatusBadge from '@/components/StatusBadge.vue'

const auth     = useAuthStore()
const requests = ref([])
const loading  = ref(false)
const openIds  = ref(new Set())
const activeFilter = ref('all')
const sollecitaLoading = reactive({})

// Toast
const toast = reactive({ visible: false, message: '', type: 'success' })
function showToast(message, type = 'success', duration = 4000) {
  toast.message = message
  toast.type = type
  toast.visible = true
  setTimeout(() => { toast.visible = false }, duration)
}

// Filtri stato
const stateFilters = [
  { key: 'all',      label: 'Tutte',            activeClass: 'bg-[#1A1714] border-[#1A1714] text-white' },
  { key: 'draft',    label: 'In attesa',         activeClass: 'bg-blue-100 border-blue-400 text-blue-800' },
  { key: 'taken',    label: 'Presa in carico',   activeClass: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { key: 'preparing',label: 'In preparazione',   activeClass: 'bg-orange-100 border-orange-400 text-orange-800' },
  { key: 'ready',    label: 'Pronto Spedizione',  activeClass: 'bg-purple-100 border-purple-400 text-purple-800' },
  { key: 'done',     label: 'Spedita / Evasa',   activeClass: 'bg-green-100 border-green-400 text-green-800' },
]

// Progress bar
const steps = [
  { key: 'draft',     label: 'In attesa',       color: 'bg-blue-500'   },
  { key: 'taken',     label: 'Presa in carico', color: 'bg-yellow-500' },
  { key: 'preparing', label: 'Preparazione',    color: 'bg-orange-500' },
  { key: 'ready',     label: 'Pronto',          color: 'bg-purple-500' },
  { key: 'done',      label: 'Spedita',         color: 'bg-green-500'  },
]
const stateOrder = { draft: 0, taken: 1, preparing: 2, ready: 3, done: 4 }

// Modalità consegna
const deliveryModeMeta = {
  standard: { label: 'Standard', icon: '📦', cls: 'bg-blue-100 text-blue-700'    },
  priority:  { label: 'Priority', icon: '⚡', cls: 'bg-yellow-100 text-yellow-700' },
  express:   { label: 'Express',  icon: '🚀', cls: 'bg-red-100 text-red-700'      },
}
function deliveryModeLabel(mode) { return deliveryModeMeta[mode]?.label || mode }
function deliveryModeIcon(mode)  { return deliveryModeMeta[mode]?.icon  || '' }
function deliveryModeClass(mode) { return deliveryModeMeta[mode]?.cls   || '' }

// Lead time
function computeLeadTime(req) {
  if (!req.request_date || !req.tempo_evasione) return null
  try {
    const start = new Date(req.request_date)
    const end   = new Date(req.tempo_evasione)
    if (isNaN(start) || isNaN(end)) return null
    const diffMs   = end - start
    if (diffMs < 0) return null
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHrs  = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (diffDays > 0) return `${diffDays}g ${diffHrs}h`
    return `${diffHrs}h`
  } catch { return null }
}

function getLeadTime(req) {
  if (req.lead_time) return req.lead_time
  const computed = computeLeadTime(req)
  return computed || '—'
}

// Computed
const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return requests.value
  return requests.value.filter(r => r.state === activeFilter.value)
})

function countByState(key) {
  if (key === 'all') return requests.value.length
  return requests.value.filter(r => r.state === key).length
}

function stepReached(current, step) {
  return (stateOrder[current] ?? -1) >= (stateOrder[step] ?? 99)
}

function toggleAccordion(id) {
  const s = new Set(openIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openIds.value = s
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function onSollecita(req) {
  if (sollecitaLoading[req.id]) return
  sollecitaLoading[req.id] = true
  try {
    const { uid, password } = auth.getCredentials()
    await sendSollecito(uid, password, req)
    showToast(`✅ Sollecito inviato per la richiesta ${req.name}`, 'warning')
  } catch (err) {
    console.error('Sollecito error:', err)
    showToast(`❌ Errore nell'invio del sollecito: ${err.message || 'Riprova'}`, 'error')
  } finally {
    sollecitaLoading[req.id] = false
  }
}

async function loadRequests() {
  loading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    requests.value = await fetchMyRequests(uid, password)
  } finally { loading.value = false }
}
onMounted(loadRequests)
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 800px;
}
.toast-enter-active,
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(1rem); }
</style>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Header -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lotti — Magazzino CDP</h1>
        <p class="text-gray-500 text-sm mt-1">
          {{ filteredLots.length }} lotti disponibili
          <span v-if="selectedLotIds.size > 0" class="ml-2 text-blue-600 font-medium">
            · {{ selectedLotIds.size }} selezionati
          </span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button @click="viewMode = 'flat'" :class="['px-3 py-1.5 text-xs rounded-md transition-colors',
            viewMode === 'flat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700']">
            Lista
          </button>
          <button @click="viewMode = 'grouped'" :class="['px-3 py-1.5 text-xs rounded-md transition-colors',
            viewMode === 'grouped' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700']">
            Per Prodotto
          </button>
        </div>
        <button @click="openRequestModal" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
          </svg>
          Effettua Richiesta
          <span v-if="selectedLotIds.size > 0" class="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {{ selectedLotIds.size }}
          </span>
        </button>
      </div>
    </div>

    <!-- Ricerca -->
    <div class="card mb-4 !p-4">
      <div class="relative">
        <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="searchTerm" type="text"
          placeholder="Cerca per numero lotto o codice prodotto..." class="input-field pl-9" />
        <button v-if="searchTerm" @click="searchTerm = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card flex items-center justify-center py-16 gap-3 text-gray-500">
      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Caricamento lotti in corso...
    </div>

    <!-- Errore -->
    <div v-else-if="loadError" class="card border-red-200 bg-red-50 text-red-700 flex items-center gap-2">
      <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ loadError }}
      <button @click="loadLots" class="ml-auto btn-secondary !text-red-600 !border-red-300 !text-xs">Riprova</button>
    </div>

    <!-- Vista PIATTA -->
    <div v-else-if="viewMode === 'flat'">
      <div class="card !p-0 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="w-10 px-4 py-3">
                <input type="checkbox" :checked="allVisibleSelected" @change="toggleSelectAll"
                  class="rounded border-gray-300 text-blue-600" />
              </th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Numero Lotto</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Prodotto</th>
              <th class="px-4 py-3 text-left font-medium text-gray-600">Ubicazione</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600">Qtà Disp.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filteredLots.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-gray-400">Nessun lotto trovato</td>
            </tr>
            <tr v-for="lot in paginatedLots" :key="lot.lotId"
              @click="toggleLot(lot.lotId)"
              :class="['cursor-pointer hover:bg-blue-50 transition-colors',
                selectedLotIds.has(lot.lotId) ? 'bg-blue-50' : '']">
              <td class="px-4 py-3">
                <input type="checkbox" :checked="selectedLotIds.has(lot.lotId)"
                  @click.stop @change="toggleLot(lot.lotId)" class="rounded border-gray-300 text-blue-600" />
              </td>
              <td class="px-4 py-3 font-mono font-medium text-gray-900">{{ lot.lotName }}</td>
              <td class="px-4 py-3 text-gray-700">{{ lot.productName }}</td>
              <td class="px-4 py-3">
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{{ lot.locationName }}</span>
              </td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ lot.availableQty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Paginazione piatta -->
      <div v-if="totalPagesFlat > 1" class="flex items-center justify-between mt-3 px-1">
        <p class="text-xs text-gray-500">
          {{ (currentPageFlat - 1) * PAGE_SIZE_FLAT + 1 }}–{{ Math.min(currentPageFlat * PAGE_SIZE_FLAT, filteredLots.length) }}
          di {{ filteredLots.length }} lotti
        </p>
        <div class="flex items-center gap-1">
          <button @click="currentPageFlat--" :disabled="currentPageFlat === 1"
            class="px-2.5 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors">
            ‹ Prec
          </button>
          <span class="px-3 py-1 text-xs text-gray-600">{{ currentPageFlat }} / {{ totalPagesFlat }}</span>
          <button @click="currentPageFlat++" :disabled="currentPageFlat === totalPagesFlat"
            class="px-2.5 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors">
            Succ ›
          </button>
        </div>
      </div>
    </div>

    <!-- Vista RAGGRUPPATA -->
    <div v-else class="space-y-3">
      <div v-if="filteredLots.length === 0" class="card text-center text-gray-400 py-12">Nessun lotto trovato</div>
      <div v-for="group in paginatedGroups" :key="group.productId" class="card !p-0 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
          @click="toggleGroup(group.productId)">
          <div class="flex items-center gap-3">
            <input type="checkbox"
              :checked="isGroupSelected(group)"
              :indeterminate="isGroupIndeterminate(group)"
              @click.stop @change="toggleGroupSelection(group)"
              class="rounded border-gray-300 text-blue-600" />
            <span class="font-medium text-gray-900 text-sm">{{ group.productName }}</span>
            <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{{ group.lots.length }} lotti</span>
          </div>
          <svg :class="['w-4 h-4 text-gray-400 transition-transform', expandedGroups.has(group.productId) ? 'rotate-180' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
        <div v-if="expandedGroups.has(group.productId)">
          <table class="w-full text-sm">
            <tbody class="divide-y divide-gray-100">
              <tr v-for="lot in group.lots" :key="lot.lotId"
                @click="toggleLot(lot.lotId)"
                :class="['cursor-pointer hover:bg-blue-50 transition-colors', selectedLotIds.has(lot.lotId) ? 'bg-blue-50' : '']">
                <td class="w-10 px-4 py-2.5">
                  <input type="checkbox" :checked="selectedLotIds.has(lot.lotId)"
                    @click.stop @change="toggleLot(lot.lotId)" class="rounded border-gray-300 text-blue-600" />
                </td>
                <td class="px-4 py-2.5 font-mono font-medium text-gray-900">{{ lot.lotName }}</td>
                <td class="px-4 py-2.5">
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{{ lot.locationName }}</span>
                </td>
                <td class="px-4 py-2.5 text-right font-semibold text-gray-900 pr-6">{{ lot.availableQty }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Paginazione raggruppata -->
      <div v-if="totalPagesGrouped > 1" class="flex items-center justify-between px-1">
        <p class="text-xs text-gray-500">
          Prodotti {{ (currentPageGrouped - 1) * PAGE_SIZE_GROUPED + 1 }}–{{ Math.min(currentPageGrouped * PAGE_SIZE_GROUPED, groupedLots.length) }}
          di {{ groupedLots.length }}
        </p>
        <div class="flex items-center gap-1">
          <button @click="currentPageGrouped--" :disabled="currentPageGrouped === 1"
            class="px-2.5 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors">
            ‹ Prec
          </button>
          <span class="px-3 py-1 text-xs text-gray-600">{{ currentPageGrouped }} / {{ totalPagesGrouped }}</span>
          <button @click="currentPageGrouped++" :disabled="currentPageGrouped === totalPagesGrouped"
            class="px-2.5 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors">
            Succ ›
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Richiesta -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-bold text-gray-900">Effettua Richiesta al Magazzino</h2>
            <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-5">

            <!-- Modalità di consegna -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Modalità di Consegna</label>
              <div class="grid grid-cols-3 gap-2">
                <div v-for="mode in deliveryModes" :key="mode.key" class="relative group">
                  <!-- Tooltip -->
                  <div v-if="mode.hint" class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                    hidden group-hover:block pointer-events-none
                    text-white text-xs rounded-lg px-3 py-2 w-44 text-center shadow-xl" style="background-color:#1A1714;">
                    <span class="font-semibold block mb-0.5">{{ mode.label }}</span>
                    {{ mode.hint }}
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style="border-top-color:#1A1714;"/>
                  </div>
                  <button
                    type="button"
                    @click="deliveryMode = mode.key"
                    :class="[
                      'w-full flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all text-left',
                      deliveryMode === mode.key
                        ? mode.activeClass
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    ]">
                    <span class="text-lg">{{ mode.icon }}</span>
                    <span class="text-xs font-semibold" :class="deliveryMode === mode.key ? '' : 'text-gray-700'">
                      {{ mode.label }}
                    </span>
                    <span class="text-xs opacity-70 text-center leading-tight">{{ mode.hint }}</span>
                  </button>
                </div>
              </div>
            </div>
            <div v-if="selectedLotsData.length > 0">
              <p class="text-sm font-medium text-gray-700 mb-2">Lotti selezionati ({{ selectedLotsData.length }}):</p>
              <div class="max-h-40 overflow-y-auto space-y-1 bg-gray-50 rounded-lg p-3">
                <div v-for="lot in selectedLotsData" :key="lot.lotId"
                  class="flex items-center justify-between text-sm">
                  <span class="font-mono text-gray-800">{{ lot.lotName }}</span>
                  <span class="text-gray-500 text-xs">{{ lot.productName }}</span>
                </div>
              </div>
            </div>

            <!-- Lotti manuali (non presenti in Odoo) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-700">
                  Lotti non presenti in Odoo
                  <span class="text-gray-400 font-normal">(opzionale)</span>
                </p>
                <button @click="addManualLot" type="button"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Aggiungi lotto
                </button>
              </div>

              <div v-if="manualLots.length === 0" class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                Usa questa sezione per richiedere lotti fisicamente presenti ma non ancora registrati in Odoo.
              </div>

              <div v-else class="space-y-2">
                <div v-for="(ml, idx) in manualLots" :key="idx"
                  class="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <div class="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs text-gray-500 mb-0.5">Codice Lotto *</label>
                      <input v-model="ml.lot_code" type="text" placeholder="es. LOT-2024-001"
                        class="input-field !text-xs !py-1.5 font-mono" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500 mb-0.5">Prodotto</label>
                      <input v-model="ml.product_name" type="text" placeholder="descrizione prodotto"
                        class="input-field !text-xs !py-1.5" />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-xs text-gray-500 mb-0.5">Note</label>
                      <input v-model="ml.notes" type="text" placeholder="es. consegnato il 10/01 con DDT 123"
                        class="input-field !text-xs !py-1.5" />
                    </div>
                  </div>
                  <button @click="removeManualLot(idx)" type="button"
                    class="text-gray-400 hover:text-red-500 mt-1 shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Validazione: almeno un lotto (Odoo o manuale) -->
            <div v-if="selectedLotsData.length === 0 && manualLots.length === 0"
              class="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              Seleziona almeno un lotto dalla lista oppure aggiungi un lotto manuale.
            </div>

            <!-- Note generali -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Note generali <span class="text-gray-400 font-normal">(opzionale)</span>
              </label>
              <textarea v-model="requestNotes" rows="2"
                placeholder="Inserire note, eventuali lotti mancanti o anomalie..."
                class="input-field resize-none" />
            </div>

          </div>
          <div class="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button @click="showModal = false" class="btn-secondary flex-1 justify-center" :disabled="submitting">Annulla</button>
            <button @click="submitRequest" class="btn-primary flex-1 justify-center"
              :disabled="submitting || (selectedLotsData.length === 0 && manualLots.length === 0) || manualLots.some(ml => !ml.lot_code.trim())">
              <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ submitting ? 'Invio...' : 'Invia Richiesta' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="successToast"
          class="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <div>
            <p class="font-medium text-sm">Richiesta inviata con successo!</p>
            <p class="text-green-200 text-xs">Pratica: <strong>{{ lastRequestName }}</strong></p>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { fetchCdpLots, filterLots, groupLotsByProduct, createRequest, fetchShippingTimes } from '@/api/odoo-service.js'

const auth = useAuthStore()
const allLots        = ref([])
const loading        = ref(false)
const loadError      = ref(null)
const searchTerm     = ref('')
const viewMode       = ref('flat')
const selectedLotIds = ref(new Set())
const expandedGroups = ref(new Set())
const showModal      = ref(false)
const requestNotes   = ref('')
const manualLots     = ref([])
const deliveryMode   = ref('standard')

// Paginazione
const PAGE_SIZE_FLAT    = 50
const PAGE_SIZE_GROUPED = 15
const currentPageFlat    = ref(1)
const currentPageGrouped = ref(1)

// Tempi di spedizione — caricati da res.company
const shippingTimes = ref({ standard: '', priority: '', express: '' })
const deliveryModes = computed(() => [
  {
    key: 'standard',
    label: 'Standard',
    icon: '📦',
    hint: shippingTimes.value.standard,
    activeClass: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  {
    key: 'priority',
    label: 'Priority',
    icon: '⚡',
    hint: shippingTimes.value.priority,
    activeClass: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  },
  {
    key: 'express',
    label: 'Express',
    icon: '🚀',
    hint: shippingTimes.value.express,
    activeClass: 'border-red-500 bg-red-50 text-red-700',
  },
])
const submitting     = ref(false)
const successToast   = ref(false)
const lastRequestName = ref('')

const filteredLots = computed(() => filterLots(allLots.value, searchTerm.value))
const groupedLots  = computed(() => groupLotsByProduct(filteredLots.value))

// Paginazione — vista piatta
const totalPagesFlat = computed(() => Math.max(1, Math.ceil(filteredLots.value.length / PAGE_SIZE_FLAT)))
const paginatedLots  = computed(() => {
  const start = (currentPageFlat.value - 1) * PAGE_SIZE_FLAT
  return filteredLots.value.slice(start, start + PAGE_SIZE_FLAT)
})

// Paginazione — vista raggruppata
const totalPagesGrouped  = computed(() => Math.max(1, Math.ceil(groupedLots.value.length / PAGE_SIZE_GROUPED)))
const paginatedGroups    = computed(() => {
  const start = (currentPageGrouped.value - 1) * PAGE_SIZE_GROUPED
  return groupedLots.value.slice(start, start + PAGE_SIZE_GROUPED)
})

// Resetta le pagine quando cambia la ricerca o la vista
watch(searchTerm, () => { currentPageFlat.value = 1; currentPageGrouped.value = 1 })
watch(viewMode,   () => { currentPageFlat.value = 1; currentPageGrouped.value = 1 })

const allVisibleSelected = computed(() =>
  paginatedLots.value.length > 0 && paginatedLots.value.every(l => selectedLotIds.value.has(l.lotId))
)
const selectedLotsData = computed(() => allLots.value.filter(l => selectedLotIds.value.has(l.lotId)))

async function loadLots() {
  loading.value = true; loadError.value = null
  try {
    const { uid, password } = auth.getCredentials()
    allLots.value = await fetchCdpLots(uid, password)
    groupedLots.value.forEach(g => expandedGroups.value.add(g.productId))
  } catch (err) {
    loadError.value = err.message || 'Errore nel caricamento dei lotti.'
  } finally { loading.value = false }
}

function toggleLot(lotId) {
  const s = new Set(selectedLotIds.value)
  s.has(lotId) ? s.delete(lotId) : s.add(lotId)
  selectedLotIds.value = s
}
function toggleSelectAll() {
  if (allVisibleSelected.value) {
    const s = new Set(selectedLotIds.value); paginatedLots.value.forEach(l => s.delete(l.lotId)); selectedLotIds.value = s
  } else {
    const s = new Set(selectedLotIds.value); paginatedLots.value.forEach(l => s.add(l.lotId)); selectedLotIds.value = s
  }
}
function toggleGroup(productId) {
  const e = new Set(expandedGroups.value); e.has(productId) ? e.delete(productId) : e.add(productId); expandedGroups.value = e
}
function isGroupSelected(group) { return group.lots.every(l => selectedLotIds.value.has(l.lotId)) }
function isGroupIndeterminate(group) { return group.lots.some(l => selectedLotIds.value.has(l.lotId)) && !isGroupSelected(group) }
function toggleGroupSelection(group) {
  const s = new Set(selectedLotIds.value)
  isGroupSelected(group) ? group.lots.forEach(l => s.delete(l.lotId)) : group.lots.forEach(l => s.add(l.lotId))
  selectedLotIds.value = s
}
function openRequestModal() {
  requestNotes.value = ''
  manualLots.value = []
  deliveryMode.value = 'standard'
  showModal.value = true
}
function addManualLot() {
  manualLots.value.push({ lot_code: '', product_name: '', notes: '' })
}
function removeManualLot(idx) {
  manualLots.value.splice(idx, 1)
}
async function submitRequest() {
  if (selectedLotsData.value.length === 0 && manualLots.value.length === 0) return
  if (manualLots.value.some(ml => !ml.lot_code.trim())) return
  submitting.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const cleanManualLots = manualLots.value.map(ml => ({
      lot_code:     ml.lot_code.trim(),
      product_name: ml.product_name.trim() || false,
      notes:        ml.notes.trim() || false,
    }))
    const result = await createRequest(
      uid, password,
      Array.from(selectedLotIds.value),
      requestNotes.value,
      cleanManualLots,
      deliveryMode.value
    )
    lastRequestName.value = result.name
    showModal.value = false
    selectedLotIds.value = new Set()
    manualLots.value = []
    successToast.value = true
    setTimeout(() => { successToast.value = false }, 4000)
  } catch (err) {
    console.error('[submitRequest] Errore completo:', err)
    console.error('[submitRequest] faultCode:', err.faultCode)
    console.error('[submitRequest] faultString:', err.faultString)
    console.error('[submitRequest] message:', err.message)
    alert('Errore: ' + err.message)
  }
  finally { submitting.value = false }
}
onMounted(() => {
  const { uid, password } = auth.getCredentials()
  loadLots()
  fetchShippingTimes(uid, password).then(t => { shippingTimes.value = t })
})
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(1rem); }
</style>

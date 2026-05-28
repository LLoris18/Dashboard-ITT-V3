<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.visible" :class="[
        'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm',
        toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-orange-500' : 'bg-red-600'
      ]">
        <span>{{ toast.message }}</span>
        <button @click="toast.visible = false" class="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </Transition>

    <!-- Header -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Rientro Supporti</h1>
          <p class="text-sm text-gray-500">Importazione e gestione Rientro Supporti da Excel (ddt.itt.rientro)</p>
        </div>
      </div>
      <div class="shrink-0 space-y-1">
        <input ref="xlsxInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange"/>
        <button @click="$refs.xlsxInput.click()" :disabled="importing"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                 bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg v-if="importing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          {{ importing ? importStep : 'Carica Excel Rientro' }}
        </button>
        <div v-if="importing" class="bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div class="h-full bg-rose-500 transition-all duration-300 rounded-full" :style="{ width: importProgress + '%' }"/>
        </div>
        <p v-if="importError" class="text-xs text-red-600 max-w-xs">{{ importError }}</p>
      </div>
    </div>

    <!-- Formato file -->
    <div class="mb-5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
      <p class="text-xs font-semibold text-rose-800 mb-1">Formato Excel atteso (riga 1 = intestazione, dati da riga 2 — 18 colonne)</p>
      <p class="text-xs text-rose-700 font-mono">Divisione · Tipo mag. · Magazzino · Ubicazione · Materiale* · Stock tot. · Partita · Data entrata · Stock imm. · Unità mag.* · Tipo stock · Ultimo mov. · N.OT · N.Fabbis · Peso · Tipo UM · Stock spec. · Carico</p>
    </div>

    <!-- Loading -->
    <div v-if="loadingBatches" class="card flex items-center justify-center py-12 gap-3 text-gray-400">
      <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Caricamento storico batch...
    </div>

    <!-- Nessun batch -->
    <div v-else-if="batches.length === 0" class="card text-center py-16 text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="font-medium text-gray-500">Nessun batch importato</p>
      <p class="text-sm mt-1">Carica un file Excel per creare il primo batch Rientro Supporti</p>
    </div>

    <!-- Lista batch -->
    <div v-else class="space-y-3">
      <div v-for="batch in batches" :key="batch.id" class="card !p-0 overflow-hidden">

        <!-- Header batch -->
        <div @click="toggleBatch(batch.id)"
          class="flex items-center gap-4 px-5 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors">
          <svg :class="['w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200', openBatches.has(batch.id) ? 'rotate-90' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-gray-900 text-sm">{{ batch.name }}</span>
              <span v-if="batch.file_name" class="text-xs text-gray-400 font-mono">{{ batch.file_name }}</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDateTime(batch.import_date) }}</p>
          </div>
          <div class="hidden sm:flex items-center gap-2 shrink-0">
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{{ batch.total_records }} tot.</span>
            <span v-if="batch.imported_records > 0" class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{{ batch.imported_records }} imp.</span>
            <span v-if="batch.processed_records > 0" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{{ batch.processed_records }} elab.</span>
            <span v-if="batch.error_records > 0" class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{{ batch.error_records }} err.</span>
          </div>
        </div>

        <!-- Accordion: righe batch -->
        <Transition name="accordion">
          <div v-if="openBatches.has(batch.id)" class="border-t border-gray-100">
            <div v-if="loadingRows[batch.id]" class="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Caricamento righe...
            </div>
            <template v-else-if="batchRows[batch.id]">
              <!-- Filtri stato -->
              <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-2">
                <span class="text-xs text-gray-500 font-medium mr-1">Filtra per stato:</span>
                <button v-for="f in stateFilters" :key="f.key"
                  @click="setRowFilter(batch.id, f.key)"
                  :class="['px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                    (rowFilters[batch.id] || 'all') === f.key ? f.activeClass : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300']">
                  {{ f.label }} ({{ countByState(batchRows[batch.id], f.key) }})
                </button>
              </div>
              <!-- Tabella -->
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-100">
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Stato</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Materiale</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Unità mag.</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Prodotto Odoo</th>
                      <th class="text-right px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Stock tot.</th>
                      <th class="text-right px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Stock imm.</th>
                      <th class="text-right px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Peso</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Ubicazione</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Magazzino</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">N. OT</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Partita</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Carico</th>
                      <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Esito</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                    <tr v-if="filteredRows(batch.id).length === 0">
                      <td colspan="13" class="text-center py-8 text-gray-400 text-sm">Nessuna riga per questo filtro</td>
                    </tr>
                    <tr v-for="row in filteredRows(batch.id)" :key="row.id"
                      :class="['transition-colors', rowBgClass(row.state)]">
                      <td class="px-4 py-2.5">
                        <span :class="['inline-block text-xs font-semibold px-2 py-0.5 rounded-full', stateBadgeClass(row.state)]">
                          {{ stateLabel(row.state) }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5 font-mono font-semibold text-gray-900">{{ row.materiale }}</td>
                      <td class="px-4 py-2.5 font-mono text-gray-700">
                        {{ row.unita_magazzino || '—' }}
                        <span v-if="!row.lot_found && row.unita_magazzino" class="ml-1 text-amber-500" title="Lotto non trovato">⚠</span>
                      </td>
                      <td class="px-4 py-2.5 text-gray-600 max-w-xs truncate" :title="row.product_name">{{ row.product_name || '—' }}</td>
                      <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ row.stock_totale }}</td>
                      <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ row.stock_da_immagazz }}</td>
                      <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ row.peso || '—' }}</td>
                      <td class="px-4 py-2.5 text-gray-600">{{ row.ubicazione || '—' }}</td>
                      <td class="px-4 py-2.5 text-gray-600">{{ row.magazzino || '—' }}</td>
                      <td class="px-4 py-2.5 font-mono text-gray-600">{{ row.numero_ot || '—' }}</td>
                      <td class="px-4 py-2.5 font-mono text-gray-600">{{ row.partita || '—' }}</td>
                      <td class="px-4 py-2.5 text-gray-600">{{ row.carico || '—' }}</td>
                      <td class="px-4 py-2.5 text-gray-500 max-w-xs truncate" :title="row.error_message">
                        {{ row.error_message || (row.state === 'elaborato' ? '✓ Elaborato' : '—') }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="px-5 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                {{ filteredRows(batch.id).length }} righe visualizzate · {{ batchRows[batch.id].length }} totali nel batch
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'
import { useAuthStore } from '@/stores/auth.js'
import { importRientroExcel, fetchRientroBatches, fetchRientroRows } from '@/api/odoo-service.js'

const auth = useAuthStore()
const batches        = ref([])
const loadingBatches = ref(true)
const openBatches    = ref(new Set())
const batchRows      = reactive({})
const loadingRows    = reactive({})
const rowFilters     = reactive({})
const importing      = ref(false)
const importStep     = ref('')
const importProgress = ref(0)
const importError    = ref('')
const toast          = reactive({ visible: false, message: '', type: 'success' })

function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.visible = true
  setTimeout(() => { toast.visible = false }, 5000)
}

const stateFilters = [
  { key: 'all',            label: 'Tutti',          activeClass: 'bg-gray-700 border-gray-700 text-white' },
  { key: 'importato',      label: 'Importato',       activeClass: 'bg-blue-100 border-blue-400 text-blue-800' },
  { key: 'in_elaborazione',label: 'In elaborazione', activeClass: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { key: 'elaborato',      label: 'Elaborato',       activeClass: 'bg-green-100 border-green-400 text-green-800' },
  { key: 'errore',         label: 'Errore',          activeClass: 'bg-red-100 border-red-400 text-red-800' },
]

function stateLabel(s) {
  return { importato:'Importato', in_elaborazione:'In elab.', elaborato:'Elaborato', errore:'Errore' }[s] || s
}
function stateBadgeClass(s) {
  return { importato:'bg-blue-100 text-blue-700', in_elaborazione:'bg-yellow-100 text-yellow-700',
           elaborato:'bg-green-100 text-green-700', errore:'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600'
}
function rowBgClass(s) {
  return { elaborato:'bg-green-50/50 hover:bg-green-50', errore:'bg-red-50/40 hover:bg-red-50' }[s] || 'hover:bg-gray-50'
}
function countByState(rows, key) {
  return key === 'all' ? rows.length : rows.filter(r => r.state === key).length
}
function setRowFilter(batchId, key) { rowFilters[batchId] = key }
function filteredRows(batchId) {
  const rows = batchRows[batchId] || []
  const f = rowFilters[batchId] || 'all'
  return f === 'all' ? rows : rows.filter(r => r.state === f)
}

// Parsing date da Excel (numero seriale o stringa)
function parseExcelDate(val) {
  if (!val || val === '') return false
  if (typeof val === 'number') {
    // Numero seriale Excel → JS Date
    const d = new Date(Math.round((val - 25569) * 864e5))
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }
  const s = String(val).trim()
  if (!s || s === '0') return false
  // Prova a parsare come data
  const d = new Date(s)
  return isNaN(d) ? false : d.toISOString().replace('T', ' ').slice(0, 19)
}

onMounted(loadBatches)

async function loadBatches() {
  loadingBatches.value = true
  try {
    const { uid, password } = auth.getCredentials()
    batches.value = await fetchRientroBatches(uid, password)
  } catch (e) { console.error(e) }
  finally { loadingBatches.value = false }
}

async function toggleBatch(id) {
  const s = new Set(openBatches.value)
  if (s.has(id)) { s.delete(id) }
  else { s.add(id); if (!batchRows[id]) await loadBatchRows(id) }
  openBatches.value = s
}

async function loadBatchRows(batchId) {
  loadingRows[batchId] = true
  try {
    const { uid, password } = auth.getCredentials()
    batchRows[batchId] = await fetchRientroRows(uid, password, batchId)
    rowFilters[batchId] = 'all'
  } catch (e) { console.error(e) }
  finally { loadingRows[batchId] = false }
}

function onFileChange(e) {
  const file = e.target.files?.[0]; e.target.value = ''
  if (!file) return
  if (!file.name.match(/\.(xlsx|xls)$/i)) { importError.value = 'Formato non supportato'; return }
  parseAndImport(file)
}

async function parseAndImport(file) {
  importing.value = true; importError.value = ''
  importStep.value = 'Lettura file...'; importProgress.value = 10
  try {
    const buffer = await file.arrayBuffer()
    importStep.value = 'Parsing Excel...'; importProgress.value = 35
    const wb  = XLSX.read(buffer, { type: 'array', cellDates: false })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    importProgress.value = 55

    const rows = raw.slice(1)
      .filter(r => String(r[4] ?? '').trim() !== '')  // materiale obbligatorio
      .map(r => ({
        divisione:            String(r[0]  ?? '').trim(),
        tipo_magazzino:       String(r[1]  ?? '').trim(),
        magazzino:            String(r[2]  ?? '').trim(),
        ubicazione:           String(r[3]  ?? '').trim(),
        materiale:            String(r[4]  ?? '').trim(),
        stock_totale:         r[5]  ?? 0,
        partita:              String(r[6]  ?? '').trim(),
        data_entrata_merci:   parseExcelDate(r[7]),
        stock_da_immagazz:    r[8]  ?? 0,
        unita_magazzino:      String(r[9]  ?? '').trim(),
        tipo_stock:           String(r[10] ?? '').trim(),
        ultimo_movimento:     parseExcelDate(r[11]),
        numero_ot:            String(r[12] ?? '').trim(),
        n_fabbisogno:         String(r[13] ?? '').trim(),
        peso:                 r[14] ?? 0,
        tipo_unita_magazzino: String(r[15] ?? '').trim(),
        stock_speciale:       String(r[16] ?? '').trim(),
        carico:               String(r[17] ?? '').trim(),
      }))

    if (rows.length === 0) throw new Error('Nessuna riga valida (colonna 4 Materiale obbligatoria)')
    importStep.value = `Invio ${rows.length} righe a Odoo...`; importProgress.value = 65

    const { uid, password } = auth.getCredentials()
    const result = await importRientroExcel(uid, password, rows, file.name)
    importProgress.value = 85

    importStep.value = 'Aggiornamento...'; await loadBatches()
    importProgress.value = 100
    showToast(`✅ ${result.imported} righe importate — batch "${result.batch_name}"`)
  } catch (err) {
    importError.value = err.message || 'Errore importazione'
    showToast('❌ ' + (err.message || 'Errore importazione'), 'error')
  } finally {
    importing.value = false; importStep.value = ''
    setTimeout(() => { importProgress.value = 0 }, 800)
  }
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
</script>

<style scoped>
.accordion-enter-active, .accordion-leave-active { transition: all 0.2s ease; overflow: hidden; }
.accordion-enter-from, .accordion-leave-to { opacity: 0; max-height: 0; }
.accordion-enter-to, .accordion-leave-from { opacity: 1; max-height: 4000px; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(1rem); }
</style>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Verifica Giacenze da Excel</h1>
          <p class="text-sm text-gray-500">Carica un file Excel per verificare la disponibilità dei lotti a magazzino</p>
        </div>
      </div>
    </div>

    <!-- Upload area + risultati in due colonne se ci sono risultati -->
    <div :class="['grid gap-6 transition-all', results ? 'grid-cols-1 lg:grid-cols-[380px_1fr]' : 'grid-cols-1 max-w-xl mx-auto']">

      <!-- Pannello upload -->
      <div class="space-y-4">

        <!-- Drop zone -->
        <div
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          @click="$refs.fileInput.click()"
          :class="[
            'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-violet-400 bg-violet-50 scale-[1.01]'
              : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/50'
          ]">
          <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange"/>

          <!-- Icona stato -->
          <div class="flex justify-center mb-3">
            <div v-if="selectedFile" class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div v-else class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
          </div>

          <p v-if="selectedFile" class="font-semibold text-green-700 text-sm">{{ selectedFile.name }}</p>
          <p v-if="selectedFile" class="text-xs text-green-600 mt-0.5">{{ formatFileSize(selectedFile.size) }} · Pronto per la verifica</p>
          <template v-else>
            <p class="font-medium text-gray-700 text-sm">Trascina qui il file Excel</p>
            <p class="text-xs text-gray-400 mt-1">oppure clicca per selezionarlo</p>
            <p class="text-xs text-gray-300 mt-2">.xlsx · .xls</p>
          </template>
        </div>

        <!-- Formato atteso -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p class="text-xs font-semibold text-amber-800 mb-1.5">📋 Formato file richiesto</p>
          <ul class="text-xs text-amber-700 space-y-0.5">
            <li>• Prima riga: intestazioni colonne</li>
            <li>• Colonna <strong>Materiale</strong>: codice prodotto (default_code)</li>
            <li>• <strong>Colonna 5</strong>: numero lotto (UDM)</li>
            <li>• Dal rigo 2 in poi: i dati</li>
          </ul>
        </div>

        <!-- Bottone avvia -->
        <button
          @click="runVerifica"
          :disabled="!selectedFile || loading"
          class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm
                 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          {{ loading ? 'Verifica in corso...' : 'Avvia Verifica' }}
        </button>

        <!-- Reset -->
        <button v-if="results || selectedFile" @click="resetAll"
          class="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
          ↺ Ricomincia
        </button>

        <!-- Errore -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p class="text-sm font-semibold text-red-700 mb-0.5">Errore</p>
          <p class="text-xs text-red-600">{{ error }}</p>
        </div>

        <!-- Riepilogo risultati (nel pannello sx se ci sono risultati) -->
        <div v-if="results" class="space-y-2">
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
              <p class="text-2xl font-bold text-gray-900">{{ results.total }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Totali</p>
            </div>
            <div class="bg-green-50 rounded-xl p-3 text-center border border-green-200">
              <p class="text-2xl font-bold text-green-700">{{ results.found }}</p>
              <p class="text-xs text-green-600 mt-0.5">Trovati</p>
            </div>
            <div class="bg-red-50 rounded-xl p-3 text-center border border-red-200">
              <p class="text-2xl font-bold text-red-600">{{ results.missing }}</p>
              <p class="text-xs text-red-500 mt-0.5">Mancanti</p>
            </div>
          </div>
          <!-- Barra percentuale -->
          <div class="rounded-full h-2 bg-red-200 overflow-hidden">
            <div class="h-full bg-green-500 transition-all duration-700 rounded-full"
              :style="{ width: results.total > 0 ? (results.found / results.total * 100) + '%' : '0%' }"/>
          </div>
          <p class="text-xs text-gray-400 text-center">
            {{ results.total > 0 ? Math.round(results.found / results.total * 100) : 0 }}% disponibili
            · Verifica del {{ formatDateTime(results.verification_date) }}
          </p>
        </div>

      </div>

      <!-- Tabella risultati -->
      <div v-if="results" class="card !p-0 overflow-hidden">

        <!-- Toolbar tabella -->
        <div class="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-700">Risultati</span>
            <!-- Filtri tab -->
            <div class="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button v-for="f in tableFilters" :key="f.key"
                @click="tableFilter = f.key"
                :class="['px-3 py-1 rounded-md text-xs font-medium transition-all',
                  tableFilter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700']">
                {{ f.label }}
                <span class="ml-1 opacity-60">({{ f.count }})</span>
              </button>
            </div>
          </div>

          <!-- Ricerca + Export -->
          <div class="flex items-center gap-2">
            <div class="relative">
              <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input v-model="search" type="text" placeholder="Cerca materiale / lotto..."
                class="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 w-48"/>
            </div>
            <button @click="exportCSV"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                     border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Esporta CSV
            </button>
          </div>
        </div>

        <!-- Tabella -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stato</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Materiale</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prodotto</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lotto</th>
                <th class="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Q.tà</th>
                <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Esito</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="filteredLines.length === 0">
                <td colspan="6" class="text-center py-12 text-gray-400 text-sm">
                  Nessun risultato per i filtri selezionati
                </td>
              </tr>
              <tr v-for="(line, i) in filteredLines" :key="i"
                :class="[
                  'transition-colors',
                  line.state === 'ok'
                    ? 'bg-green-50/60 hover:bg-green-50'
                    : 'bg-red-50/40 hover:bg-red-50'
                ]">
                <!-- Stato -->
                <td class="px-4 py-2.5">
                  <span v-if="line.state === 'ok'"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    OK
                  </span>
                  <span v-else
                    class="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                    Mancante
                  </span>
                </td>
                <!-- Materiale -->
                <td class="px-4 py-2.5">
                  <span class="font-mono text-xs font-semibold text-gray-800">{{ line.material_code }}</span>
                  <span v-if="line.corrected"
                    class="ml-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full align-middle"
                    :title="`Codice originale nell'Excel: ${line.original_code}`">
                    ↺ {{ line.original_code }}
                  </span>
                </td>
                <!-- Prodotto -->
                <td class="px-4 py-2.5">
                  <span class="text-xs text-gray-600 max-w-[180px] truncate block" :title="line.product_name">
                    {{ line.product_name || '—' }}
                  </span>
                </td>
                <!-- Lotto -->
                <td class="px-4 py-2.5">
                  <span class="font-mono text-xs text-gray-700">{{ line.lot_name || '—' }}</span>
                </td>
                <!-- Quantità -->
                <td class="px-4 py-2.5 text-right">
                  <span :class="['text-xs font-semibold',
                    line.qty_lot > 0 ? 'text-green-700' : 'text-gray-400']">
                    {{ line.qty_lot > 0 ? line.qty_lot : '—' }}
                  </span>
                </td>
                <!-- Esito -->
                <td class="px-4 py-2.5">
                  <span class="text-xs text-gray-500">{{ line.message }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer tabella -->
        <div v-if="filteredLines.length > 0"
          class="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span class="text-xs text-gray-400">
            {{ filteredLines.length }} righe visualizzate
            <span v-if="search"> · filtrate per "<em>{{ search }}</em>"</span>
          </span>
          <span class="text-xs text-gray-400">File: {{ results.filename || '—' }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { runVerification, recheckMissingLots } from '@/api/odoo-service.js'

const auth = useAuthStore()

const selectedFile  = ref(null)
const isDragging    = ref(false)
const loading       = ref(false)
const error         = ref('')
const results       = ref(null)
const search        = ref('')
const tableFilter   = ref('all')

// ---- File handling ----

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) setFile(file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) setFile(file)
}

function setFile(file) {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    error.value = 'Formato non supportato. Usa un file .xlsx o .xls'
    return
  }
  selectedFile.value = file
  error.value = ''
  results.value = null
}

function resetAll() {
  selectedFile.value = null
  results.value = null
  error.value = ''
  search.value = ''
  tableFilter.value = 'all'
}

// ---- Verifica ----

async function runVerifica() {
  if (!selectedFile.value || loading.value) return
  loading.value = true
  error.value = ''
  results.value = null

  try {
    const b64 = await fileToBase64(selectedFile.value)
    const { uid, password } = auth.getCredentials()
    const verified = await runVerification(uid, password, b64, selectedFile.value.name)

    // Fallback: per le righe non trovate, ricontrolla la giacenza in qualsiasi
    // ubicazione interna, provando anche le varianti con/senza zero iniziale nel
    // codice materiale (errore di formattazione nell'import Excel dei prodotti).
    try {
      await recheckMissingLots(uid, password, verified)
    } catch (e) {
      console.warn('Recheck lotti mancanti non riuscito:', e)
    }

    results.value = { ...verified }
    tableFilter.value = 'all'
    search.value = ''
  } catch (err) {
    error.value = err.message || 'Errore durante la verifica. Riprova.'
  } finally {
    loading.value = false
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---- Filtri + ricerca ----

const tableFilters = computed(() => [
  { key: 'all',     label: 'Tutti',    count: results.value?.total   || 0 },
  { key: 'ok',      label: 'Trovati',  count: results.value?.found   || 0 },
  { key: 'missing', label: 'Mancanti', count: results.value?.missing || 0 },
])

const filteredLines = computed(() => {
  if (!results.value) return []
  let lines = results.value.lines
  if (tableFilter.value !== 'all') {
    lines = lines.filter(l => l.state === tableFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    lines = lines.filter(l =>
      l.material_code?.toLowerCase().includes(q) ||
      l.lot_name?.toLowerCase().includes(q) ||
      l.product_name?.toLowerCase().includes(q)
    )
  }
  return lines
})

// ---- Export CSV ----

function exportCSV() {
  if (!results.value) return
  const lines = results.value.lines
  const header = ['Stato', 'Materiale', 'Prodotto', 'Lotto', 'Quantità', 'Esito']
  const rows = lines.map(l => [
    l.state === 'ok' ? 'OK' : 'Mancante',
    l.material_code || '',
    l.product_name  || '',
    l.lot_name      || '',
    l.qty_lot       || 0,
    l.message       || '',
  ])

  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const bom = '\uFEFF' // UTF-8 BOM per Excel
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href     = url
  a.download = `verifica_lotti_${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---- Utilities ----

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

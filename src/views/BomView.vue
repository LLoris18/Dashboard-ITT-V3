<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Header -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 10h16M4 14h10M4 18h6"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">BOM — Distinte Base</h1>
          <p class="text-sm text-gray-500">
            <template v-if="metaLoading">
              <span class="text-gray-300">Caricamento metadati...</span>
            </template>
            <template v-else-if="bomMeta && bomMeta.total_rows > 0">
              {{ bomMeta.total_rows.toLocaleString('it-IT') }} righe ·
              {{ bomMeta.total_products.toLocaleString('it-IT') }} prodotti ·
              aggiornata il {{ formatDateTime(bomMeta.import_date) }}
              <span v-if="bomMeta.source_filename" class="ml-1 text-gray-400">
                ({{ bomMeta.source_filename }})
              </span>
            </template>
            <template v-else>
              <span class="text-amber-600 font-medium">Nessuna BOM caricata su Odoo</span>
            </template>
          </p>
        </div>
      </div>

      <!-- Tasto carica/aggiorna BOM -->
      <div class="shrink-0 space-y-1">
        <input ref="xlsxInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange"/>
        <button @click="$refs.xlsxInput.click()" :disabled="importing"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                 bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg v-if="importing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          {{ importLabel }}
        </button>

        <!-- Barra progresso multi-step -->
        <div v-if="importing" class="space-y-0.5">
          <div class="bg-gray-200 rounded-full h-1.5 overflow-hidden w-full">
            <div class="h-full bg-teal-500 transition-all duration-300 rounded-full"
              :style="{ width: importProgress + '%' }"/>
          </div>
          <p class="text-xs text-teal-600">{{ importStep }}</p>
        </div>

        <p v-if="importError" class="text-xs text-red-600 max-w-xs">{{ importError }}</p>
        <p v-if="importSuccess" class="text-xs text-green-600">{{ importSuccess }}</p>
      </div>
    </div>

    <!-- Stato vuoto (nessun dato su Odoo) -->
    <div v-if="!metaLoading && (!bomMeta || bomMeta.total_rows === 0)"
         class="card text-center py-20 text-gray-400 max-w-md mx-auto">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
             a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="font-semibold text-gray-600 mb-1">Nessuna BOM su Odoo</p>
      <p class="text-sm mb-1">Clicca su "Carica BOM da Excel" per importare le distinte base</p>
      <p class="text-xs text-gray-400">I dati vengono salvati su Odoo e sono condivisi con tutti gli utenti</p>
    </div>

    <!-- Contenuto principale -->
    <template v-else-if="bomMeta && bomMeta.total_rows > 0">

      <!-- Barra di ricerca -->
      <div class="mb-5">
        <div class="relative max-w-lg">
          <svg class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cerca per Cod. Finito (es. 20015396)..."
            class="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white
                   focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                   text-sm shadow-sm"
            @input="onSearchInput"
            @keydown.esc="clearSearch"
          />
          <button v-if="searchQuery" @click="clearSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414
                   10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586
                   10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>

        <!-- Feedback ricerca -->
        <div class="mt-2 h-4">
          <p v-if="searching" class="text-xs text-gray-400">Ricerca in corso...</p>
          <p v-else-if="searchQuery.trim().length === 1" class="text-xs text-gray-400">
            Digita almeno 2 caratteri...
          </p>
          <p v-else-if="searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching"
             class="text-xs text-amber-600">
            Nessun prodotto trovato per "<strong>{{ searchQuery }}</strong>"
          </p>
          <p v-else-if="searchResults.length > 0" class="text-xs text-gray-400">
            {{ searchResults.length }} prodotto/i ·
            {{ searchResults.reduce((a, p) => a + p.rows.length, 0) }} righe BOM
          </p>
        </div>
      </div>

      <!-- Prompt iniziale -->
      <div v-if="searchQuery.trim().length < 2 && !searching" class="card text-center py-14 text-gray-400">
        <svg class="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <p class="text-sm font-medium text-gray-500">Inserisci un Cod. Finito per visualizzare la BOM</p>
        <p class="text-xs mt-1 text-gray-400">
          BOM su Odoo: {{ bomMeta.total_products.toLocaleString('it-IT') }} prodotti,
          {{ bomMeta.total_rows.toLocaleString('it-IT') }} righe totali
        </p>
      </div>

      <!-- Risultati -->
      <div v-else-if="searchResults.length > 0" class="space-y-5">
        <div v-for="product in searchResults" :key="product.codFinito" class="card !p-0 overflow-hidden">

          <!-- Header prodotto -->
          <div class="px-5 py-3.5 bg-teal-50 border-b border-teal-100
                      flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono font-bold text-teal-900 text-sm">{{ product.codFinito }}</span>
                <span class="text-sm font-semibold text-gray-700">{{ product.descFinito }}</span>
              </div>
              <p class="text-xs text-teal-600 mt-0.5">
                {{ product.rows.length }} componenti
                <span v-if="getAlts(product.rows).length > 1" class="ml-2 text-gray-400">
                  · alternative: {{ getAlts(product.rows).join(', ') }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <!-- Filtro alternative -->
              <div v-if="getAlts(product.rows).length > 1" class="flex items-center gap-1">
                <span class="text-xs text-gray-500 mr-1">Alt:</span>
                <button
                  v-for="alt in ['', ...getAlts(product.rows)]" :key="alt"
                  @click="setAltFilter(product.codFinito, alt)"
                  :class="['px-2 py-0.5 rounded text-xs font-medium transition-all',
                    (altFilters[product.codFinito] || '') === alt
                      ? 'bg-teal-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300']">
                  {{ alt === '' ? 'Tutte' : alt }}
                </button>
              </div>
              <!-- Stampa PDF -->
              <button
                @click="printBomPdf(product)"
                :disabled="pdfGenerating === product.codFinito"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-white border border-gray-200 hover:border-teal-400 hover:text-teal-700
                       text-gray-600 transition-all disabled:opacity-50">
                <svg v-if="pdfGenerating === product.codFinito"
                  class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2
                       4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2
                       2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                {{ pdfGenerating === product.codFinito ? 'Generazione...' : 'Stampa PDF' }}
              </button>
            </div>
          </div>

          <!-- Tabella componenti -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100">
                  <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide w-12">Alt</th>
                  <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide w-10">Pos</th>
                  <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide w-16">Pos.Comp</th>
                  <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Cod. Comp.</th>
                  <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Descrizione</th>
                  <th class="text-right px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide w-16">Q.tà</th>
                  <th class="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide w-10">UM</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                <tr v-for="(row, i) in getFilteredRows(product)" :key="i"
                  class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-2">
                    <span :class="['inline-block px-1.5 py-0.5 rounded font-mono font-semibold text-xs',
                      row.alt === 'S4' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500']">
                      {{ row.alt }}
                    </span>
                  </td>
                  <td class="px-4 py-2 font-mono text-gray-400">{{ row.pos }}</td>
                  <td class="px-4 py-2 font-mono text-gray-400">{{ row.pos_comp }}</td>
                  <td class="px-4 py-2">
                    <span class="font-mono font-semibold text-gray-800">{{ row.cod_componente }}</span>
                  </td>
                  <td class="px-4 py-2 text-gray-700">{{ row.desc_componente || '—' }}</td>
                  <td class="px-4 py-2 text-right font-mono text-gray-700">{{ formatQty(row.qta_componente) }}</td>
                  <td class="px-4 py-2 text-gray-500">{{ row.um }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'
import { useAuthStore } from '@/stores/auth.js'
import { importBom, fetchBom } from '@/api/odoo-service.js'

const auth = useAuthStore()

// ---- State ----
const bomMeta      = ref(null)
const metaLoading  = ref(true)
const importing    = ref(false)
const importProgress = ref(0)
const importStep   = ref('')
const importError  = ref('')
const importSuccess = ref('')
const searchQuery  = ref('')
const searching    = ref(false)
const searchResults = ref([])
const altFilters    = reactive({})
const pdfGenerating = ref('')
let searchTimer    = null

// ---- On mount: carica i metadati da Odoo ----
onMounted(async () => {
  try {
    const { uid, password } = auth.getCredentials()
    const res = await fetchBom(uid, password, '')
    bomMeta.value = res.meta
  } catch (e) {
    console.warn('BOM meta load error:', e)
  } finally {
    metaLoading.value = false
  }
})

// ---- Label bottone ----
const importLabel = computed(() => {
  if (importing.value) return importStep.value || 'Elaborazione...'
  if (bomMeta.value && bomMeta.value.total_rows > 0) return 'Aggiorna BOM con Excel'
  return 'Carica BOM da Excel'
})

// ---- File upload & parsing ----
function onFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    importError.value = 'Formato non supportato. Usa .xlsx o .xls'
    return
  }
  processAndImport(file)
}

async function processAndImport(file) {
  importing.value    = true
  importError.value  = ''
  importSuccess.value = ''
  importProgress.value = 5

  try {
    // Step 1 — Leggi file
    importStep.value = 'Lettura file Excel...'
    const buffer = await file.arrayBuffer()
    importProgress.value = 20

    // Step 2 — Parsing XLSX
    importStep.value = 'Parsing righe...'
    const wb  = XLSX.read(buffer, { type: 'array' })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    importProgress.value = 40

    // Salta le prime 5 righe disclaimer
    const rows = raw.slice(5)
      .filter(r => r[1] !== '' && r[1] !== null && r[1] !== undefined)
      .map(r => ({
        tipo_mat:        String(r[0] ?? '').trim(),
        cod_finito:      String(r[1] ?? '').trim(),
        desc_finito:     String(r[2] ?? '').trim(),
        qta_finito:      r[3] ?? 0,
        alt:             String(r[4] ?? '').trim(),
        pos:             r[5] ?? 0,
        pos_comp:        String(r[6] ?? '').trim(),
        cod_componente:  String(r[7] ?? '').trim(),
        desc_componente: String(r[8] ?? '').trim(),
        qta_componente:  r[9] ?? 0,
        um:              String(r[10] ?? '').trim(),
      }))

    if (rows.length === 0) {
      throw new Error('Nessuna riga valida trovata nel file.')
    }
    importProgress.value = 55

    // Step 3 — Invia a Odoo
    importStep.value = `Invio ${rows.length.toLocaleString('it-IT')} righe a Odoo...`
    const { uid, password } = auth.getCredentials()
    const result = await importBom(uid, password, rows, file.name)
    importProgress.value = 95

    // Step 4 — Ricarica metadati
    importStep.value = 'Aggiornamento metadati...'
    const meta = await fetchBom(uid, password, '')
    bomMeta.value = meta.meta
    importProgress.value = 100

    importSuccess.value = `✅ ${result.imported.toLocaleString('it-IT')} righe importate correttamente`
    clearSearch()
    setTimeout(() => { importSuccess.value = '' }, 5000)

  } catch (err) {
    importError.value = err.message || 'Errore durante l\'importazione'
    console.error('BOM import error:', err)
  } finally {
    importing.value = false
    importStep.value = ''
    setTimeout(() => { importProgress.value = 0 }, 800)
  }
}

// ---- Ricerca con debounce (300ms) ----
function onSearchInput() {
  clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (q.length < 2) {
    searchResults.value = []
    return
  }
  searching.value = true
  searchTimer = setTimeout(() => doSearch(q), 300)
}

async function doSearch(q) {
  try {
    const { uid, password } = auth.getCredentials()
    const res = await fetchBom(uid, password, q)
    // Raggruppa per cod_finito
    const map = new Map()
    for (const row of res.lines) {
      const key = row.cod_finito
      if (!map.has(key)) {
        map.set(key, { codFinito: key, descFinito: row.desc_finito, rows: [] })
      }
      map.get(key).rows.push(row)
    }
    searchResults.value = Array.from(map.values())
    // Aggiorna anche i meta (total_rows potrebbe essere cambiato)
    if (res.meta) bomMeta.value = res.meta
  } catch (err) {
    console.error('BOM search error:', err)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  Object.keys(altFilters).forEach(k => delete altFilters[k])
}

// ---- Filtro alternative ----
function getAlts(rows) {
  return [...new Set(rows.map(r => r.alt).filter(Boolean))].sort()
}
function setAltFilter(codFinito, alt) { altFilters[codFinito] = alt }
function getFilteredRows(product) {
  const alt = altFilters[product.codFinito] || ''
  return alt ? product.rows.filter(r => r.alt === alt) : product.rows
}

// ---- Utilities ----
function formatQty(val) {
  if (val === null || val === undefined || val === '') return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return String(val)
  return n % 1 === 0 ? String(Math.round(n)) : String(n)
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ============================================================================
// PDF — Stampa BOM con codici a barre (jsPDF + JsBarcode via CDN)
// ============================================================================

async function printBomPdf(product) {
  pdfGenerating.value = product.codFinito
  try {
    // Carica JsBarcode se non già presente
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js')

    // Carica jsPDF dinamicamente
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    const { jsPDF } = window.jspdf

    const rows = getFilteredRows(product)
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const PW  = 210
    const PH  = 297
    const ML  = 14
    const MR  = 14
    const CW  = PW - ML - MR

    const C_TEAL   = [15, 118, 110]
    const C_WHITE  = [255, 255, 255]
    const C_ODD    = [248, 250, 252]
    const C_EVEN   = [255, 255, 255]
    const C_BORDER = [226, 232, 240]
    const C_TEXT   = [30,  41,  59]
    const C_MUTED  = [100, 116, 139]

    // -- Header banda teal --
    doc.setFillColor(...C_TEAL)
    doc.rect(0, 0, PW, 22, 'F')
    doc.setTextColor(...C_WHITE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(product.codFinito, ML, 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(product.descFinito || '', ML, 17, { maxWidth: CW - 40 })
    const now = new Date().toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    doc.setFontSize(7)
    doc.text(now, PW - MR, 17, { align: 'right' })
    const altActive = altFilters[product.codFinito] || ''
    if (altActive) {
      doc.setFontSize(7)
      doc.text(`Alt: ${altActive}`, PW - MR, 11, { align: 'right' })
    }

    // -- Definizione colonne [label, x, w, align] --
    const COLS = [
      { label: 'Componente',     x: ML,        w: 28, align: 'left'  },
      { label: 'Descrizione',    x: ML + 28,   w: 58, align: 'left'  },
      { label: 'Q.ta',           x: ML + 86,   w: 16, align: 'right' },
      { label: 'UM',             x: ML + 102,  w: 12, align: 'left'  },
      { label: 'Codice a barre', x: ML + 114,  w: 68, align: 'left'  },
    ]

    const ROW_H  = 14
    const HDR_H  = 7
    let y = 26

    function drawHeader() {
      doc.setFillColor(241, 245, 249)
      doc.rect(ML, y, CW, HDR_H, 'F')
      doc.setDrawColor(...C_BORDER)
      doc.setLineWidth(0.1)
      doc.rect(ML, y, CW, HDR_H, 'S')
      doc.setTextColor(...C_MUTED)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      COLS.forEach(col => {
        const tx = col.align === 'right' ? col.x + col.w - 1.5 : col.x + 1.5
        doc.text(col.label.toUpperCase(), tx, y + HDR_H - 2, { align: col.align })
      })
      y += HDR_H
    }

    drawHeader()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      if (y + ROW_H > PH - 12) {
        doc.addPage()
        doc.setFillColor(...C_TEAL)
        doc.rect(0, 0, PW, 10, 'F')
        doc.setTextColor(...C_WHITE)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(`${product.codFinito}  ${product.descFinito || ''}  — continua`, ML, 7)
        y = 14
        drawHeader()
      }

      doc.setFillColor(...(i % 2 === 0 ? C_ODD : C_EVEN))
      doc.rect(ML, y, CW, ROW_H, 'F')
      doc.setDrawColor(...C_BORDER)
      doc.setLineWidth(0.1)
      doc.rect(ML, y, CW, ROW_H, 'S')
      COLS.slice(1).forEach(col => { doc.line(col.x, y, col.x, y + ROW_H) })

      // Cod. Componente
      doc.setTextColor(...C_TEXT)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(String(row.cod_componente || ''), COLS[0].x + 1.5, y + 4.5)

      // Descrizione
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(String(row.desc_componente || '—'), COLS[1].x + 1.5, y + 4.5, { maxWidth: COLS[1].w - 3 })

      // Q.tà
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.text(formatQty(row.qta_componente), COLS[2].x + COLS[2].w - 1.5, y + 4.5, { align: 'right' })

      // UM
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(String(row.um || ''), COLS[3].x + 1.5, y + 4.5)

      // Barcode Code128
      const codComp = String(row.cod_componente || '').trim()
      if (codComp && window.JsBarcode) {
        try {
          const canvas = document.createElement('canvas')
          window.JsBarcode(canvas, codComp, {
            format: 'CODE128', width: 1.2, height: 24,
            displayValue: false, margin: 0,
          })
          const imgData = canvas.toDataURL('image/png')
          const bCol  = COLS[4]
          const bH    = ROW_H - 3
          const ratio = canvas.width / canvas.height
          const bW    = Math.min(bCol.w - 3, bH * ratio)
          doc.addImage(imgData, 'PNG', bCol.x + 1.5, y + 1.5, bW, bH)
        } catch (_) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6)
          doc.setTextColor(...C_MUTED)
          doc.text(codComp, COLS[4].x + 1.5, y + 5)
        }
      }

      y += ROW_H
    }

    // Footer numero pagina
    const nPages = doc.getNumberOfPages()
    for (let p = 1; p <= nPages; p++) {
      doc.setPage(p)
      doc.setFontSize(6.5)
      doc.setTextColor(...C_MUTED)
      doc.text(`Pagina ${p} di ${nPages}`, PW / 2, PH - 5, { align: 'center' })
      doc.text(`BOM — ${product.codFinito}`, ML, PH - 5)
    }

    const altTag = altActive ? `_${altActive}` : ''
    doc.save(`BOM_${product.codFinito}${altTag}.pdf`)

  } catch (err) {
    console.error('PDF error:', err)
    alert('Errore nella generazione del PDF: ' + (err.message || err))
  } finally {
    pdfGenerating.value = ''
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s   = document.createElement('script')
    s.src     = src
    s.onload  = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}
</script>

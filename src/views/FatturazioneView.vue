<template>
  <div class="flex" style="min-height: calc(100vh - 4rem)">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.visible" :class="[
        'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm',
        toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'warning' ? 'bg-orange-500' : 'bg-red-600'
      ]">
        <span>{{ toast.message }}</span>
        <button @click="toast.visible = false" class="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </Transition>

    <!-- Sidebar -->
    <aside class="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-16 overflow-y-auto"
           style="height: calc(100vh - 4rem)">
      <div class="px-4 py-5 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-slate-900 text-sm leading-tight">Fatturazione</p>
            <p class="text-xs text-slate-400">Genera · Crea · Visualizza</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 px-3 py-3 space-y-0.5">
        <button v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
            activeTab === tab.key
              ? 'bg-emerald-600 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900']">
          <span class="text-sm shrink-0">{{ tab.icon }}</span>
          <span class="text-sm leading-tight">{{ tab.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Contenuto principale -->
    <div class="flex-1 overflow-y-auto bg-slate-50">
      <div class="max-w-4xl mx-auto px-6 py-6">

    <!-- ===================================================
         TAB 1 — Genera Report (Script 1: genera_fatture)
    =================================================== -->
    <div v-if="activeTab === 'genera'">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Upload + config -->
        <div class="space-y-4">
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-3">1. Carica file sorgente</h3>
            <p class="text-xs text-gray-500 mb-3">
              File Excel con colonne: <span class="font-mono bg-gray-100 px-1 rounded">Ord.d'acq.</span>
              <span class="font-mono bg-gray-100 px-1 rounded">OdA - Testo posizione</span>
              <span class="font-mono bg-gray-100 px-1 rounded">Materiale</span>
              <span class="font-mono bg-gray-100 px-1 rounded">UMPOA</span>
              <span class="font-mono bg-gray-100 px-1 rounded">Data reg.</span>
              <span class="font-mono bg-gray-100 px-1 rounded">Quantity in PO price unit</span>
              <span class="font-mono bg-gray-100 px-1 rounded">Prezzo Unitario ODA in DD</span>
            </p>
            <div @click="$refs.inputSorgente.click()"
              :class="['border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                sorgente.file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30']">
              <input ref="inputSorgente" type="file" accept=".xlsx,.xls" class="hidden" @change="onSorgenteChange"/>
              <svg v-if="!sorgente.file" class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <svg v-else class="w-10 h-10 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <p class="text-sm font-medium text-gray-700">{{ sorgente.file ? sorgente.file.name : 'Clicca per selezionare il file sorgente' }}</p>
              <p v-if="sorgente.file" class="text-xs text-emerald-600 mt-1">{{ formatFileSize(sorgente.file.size) }} · Pronto</p>
            </div>
          </div>

          <button @click="generaReport" :disabled="!sorgente.file || sorgente.loading"
            class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                   bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                   transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <svg v-if="sorgente.loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
            </svg>
            {{ sorgente.loading ? 'Generazione in corso...' : 'Genera Report Excel' }}
          </button>
          <p v-if="sorgente.error" class="text-xs text-red-600">{{ sorgente.error }}</p>
        </div>

        <!-- Anteprima risultato -->
        <div class="card">
          <h3 class="font-semibold text-gray-800 mb-3">2. Anteprima risultato</h3>
          <div v-if="!sorgente.preview" class="text-center py-12 text-gray-400">
            <svg class="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-sm">Carica un file per vedere l'anteprima</p>
          </div>
          <div v-else class="space-y-2">
            <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{{ sorgente.preview.length }} fogli mensili generati</span>
              <span>{{ sorgente.totalRows }} righe totali</span>
            </div>
            <div v-for="sheet in sorgente.preview" :key="sheet.name"
              class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span class="text-sm font-medium text-gray-700">📄 {{ sheet.name }}</span>
              <span class="text-xs text-gray-400">{{ sheet.rows }} righe</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ===================================================
         TAB 2 — Fatture ODA (Script 2: create_invoice_claude_v2)
    =================================================== -->
    <div v-if="activeTab === 'oda'">
      <!-- Header tab -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Fatture ODA</h2>
          <p class="text-sm text-slate-500">Script create_invoice_claude_v2 — fatturazione mensile ODA</p>
        </div>
        <button @click="settingsOpen = 'oda'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-600 font-medium transition-all shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Impostazioni
        </button>
      </div>
      <div class="space-y-4">
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-3">Carica Report Mensile</h3>
            <p class="text-xs text-gray-500 mb-3">
              File Excel generato dal Tab "Genera Report" — fogli mensili con colonne ODA, Descrizione, Materiale, Prezzo Unitario, Quantita
            </p>

            <div @click="$refs.inputOda.click()"
              :class="['border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-4',
                oda.file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30']">
              <input ref="inputOda" type="file" accept=".xlsx,.xls" class="hidden" @change="onOdaFileChange"/>
              <p class="text-sm font-medium text-gray-700">
                {{ oda.file ? oda.file.name : 'Clicca per selezionare il file report mensile' }}
              </p>
              <p v-if="oda.file" class="text-xs text-emerald-600 mt-1">{{ formatFileSize(oda.file.size) }}</p>
            </div>

            <!-- Anteprima fogli -->
            <div v-if="oda.sheets.length > 0" class="mb-4 space-y-1">
              <p class="text-xs font-semibold text-gray-500 mb-2">FOGLI RILEVATI</p>
              <div v-for="s in oda.sheets" :key="s.name"
                class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <span class="font-medium text-gray-700">{{ s.name }}</span>
                <span class="text-gray-400">{{ s.rows }} righe · {{ s.prefissi.join(', ') }}</span>
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="parseOdaFile" :disabled="!oda.file || oda.parsing"
                class="flex-1 btn-secondary text-sm disabled:opacity-40">
                {{ oda.parsing ? 'Analisi...' : '🔍 Analizza file' }}
              </button>
              <button @click="createOdaInvoices" :disabled="!oda.sheets.length || oda.creating"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                       bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                       transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <svg v-if="oda.creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ oda.creating ? 'Creazione...' : '✅ Crea Fatture su Odoo' }}
              </button>
            </div>
          </div>

          <!-- Risultati creazione -->
          <div v-if="oda.results.length > 0" class="card">
            <h3 class="font-semibold text-gray-800 mb-3">Risultati</h3>
            <div class="space-y-2">
              <div v-for="r in oda.results" :key="r.nome_fattura"
                :class="['flex items-center justify-between rounded-lg px-3 py-2 text-xs',
                  r.stato === 'OK' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200']">
                <span class="font-mono font-semibold" :class="r.stato === 'OK' ? 'text-green-800' : 'text-red-800'">
                  {{ r.nome_fattura }}
                </span>
                <span class="text-gray-500">{{ r.righe }} righe</span>
                <span :class="r.stato === 'OK' ? 'text-green-700' : 'text-red-600'">
                  {{ r.stato === 'OK' ? `✓ id=${r.move_id}` : r.stato }}
                </span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{{ oda.results.filter(r => r.stato === 'OK').length }} fatture create</span>
              <span>{{ oda.results.filter(r => r.stato !== 'OK').length }} errori</span>
            </div>
          </div>
      </div>
    </div>

    <!-- ===================================================
         TAB 3 — Fatture Logistica (Script 3: create_invoice_logistics)
    =================================================== -->
    <div v-if="activeTab === 'logistics'">
      <!-- Header tab -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Fatture Logistica</h2>
          <p class="text-sm text-slate-500">Script create_invoice_logistics — fatturazione settimanale</p>
        </div>
        <button @click="settingsOpen = 'logistics'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-600 font-medium transition-all shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Impostazioni
        </button>
      </div>
      <div class="space-y-4">
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-2">Carica Report Settimanali</h3>
            <p class="text-xs text-gray-500 mb-3">
              Uno o più file Excel con foglio <span class="font-mono bg-gray-100 px-1 rounded">RIEPILOGO</span>
              contenente: Voce di Fatturato, Descrizione, Quantità, Importo, Tot
            </p>

            <div @click="$refs.inputLog.click()"
              :class="['border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-4',
                log.files.length > 0 ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30']">
              <input ref="inputLog" type="file" accept=".xlsx,.xls" class="hidden" multiple @change="onLogFilesChange"/>
              <svg class="w-8 h-8 mx-auto mb-2" :class="log.files.length > 0 ? 'text-emerald-500' : 'text-gray-300'"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="text-sm font-medium text-gray-700">
                {{ log.files.length > 0 ? `${log.files.length} file selezionati` : 'Clicca per selezionare i report settimanali (puoi selezionarne più di uno)' }}
              </p>
            </div>

            <!-- Lista file caricati -->
            <div v-if="log.files.length > 0" class="mb-4 space-y-1">
              <div v-for="(f, i) in log.files" :key="i"
                class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <span class="font-medium text-gray-700 truncate max-w-xs">{{ f.name }}</span>
                <div class="flex items-center gap-2 shrink-0">
                  <span v-if="log.parsed[f.name]"
                    :class="log.parsed[f.name].error ? 'text-red-500' : 'text-green-600'">
                    {{ log.parsed[f.name].error || `${log.parsed[f.name].realLines} righe` }}
                  </span>
                  <button @click.stop="removeLogFile(i)" class="text-gray-300 hover:text-red-500">✕</button>
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="parseLogFiles" :disabled="!log.files.length || log.parsing"
                class="flex-1 btn-secondary text-sm disabled:opacity-40">
                {{ log.parsing ? 'Analisi...' : '🔍 Analizza file' }}
              </button>
              <button @click="createLogInvoices"
                :disabled="!Object.keys(log.parsed).length || log.creating"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                       bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                       transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <svg v-if="log.creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ log.creating ? 'Creazione...' : '✅ Crea Fatture su Odoo' }}
              </button>
            </div>
          </div>

          <!-- Risultati -->
          <div v-if="log.results.length > 0" class="card">
            <h3 class="font-semibold text-gray-800 mb-3">Risultati</h3>
            <div class="space-y-2">
              <div v-for="r in log.results" :key="r.nome_fattura"
                :class="['flex items-center justify-between rounded-lg px-3 py-2 text-xs',
                  r.stato === 'OK' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200']">
                <span class="font-mono font-semibold truncate max-w-xs"
                  :class="r.stato === 'OK' ? 'text-green-800' : 'text-red-800'">
                  {{ r.nome_fattura }}
                </span>
                <span class="text-gray-500 shrink-0">{{ r.righe }} righe</span>
                <span class="shrink-0" :class="r.stato === 'OK' ? 'text-green-700' : 'text-red-600'">
                  {{ r.stato === 'OK' ? `✓ id=${r.move_id}` : r.stato }}
                </span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{{ log.results.filter(r => r.stato === 'OK').length }} fatture create</span>
              <span>{{ log.results.filter(r => r.stato !== 'OK').length }} errori</span>
            </div>
          </div>
      </div>
    </div>

    <!-- ===================================================
         TAB 3 — Fatture Dichiarazione d'Intento (Script v3)
    =================================================== -->
    <div v-if="activeTab === 'intent'">
      <!-- Header tab -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Fatture Dichiarazione</h2>
          <p class="text-sm text-slate-500">Script v3 — fatturazione con dichiarazione d'intento</p>
        </div>
        <button @click="settingsOpen = 'intent'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-600 font-medium transition-all shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Impostazioni
        </button>
      </div>
      <div class="space-y-4">
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-2">Carica Report Mensile</h3>
            <p class="text-xs text-gray-500 mb-3">
              Stesso formato del tab "Fatture ODA" — file Excel con fogli mensili
            </p>

            <div @click="$refs.inputIntent.click()"
              :class="['border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-4',
                intent.file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30']">
              <input ref="inputIntent" type="file" accept=".xlsx,.xls" class="hidden" @change="onIntentFileChange"/>
              <p class="text-sm font-medium text-gray-700">
                {{ intent.file ? intent.file.name : 'Clicca per selezionare il file report mensile' }}
              </p>
              <p v-if="intent.file" class="text-xs text-emerald-600 mt-1">{{ formatFileSize(intent.file.size) }}</p>
            </div>

            <!-- Fogli analizzati -->
            <div v-if="intent.sheets.length > 0" class="mb-4 space-y-1">
              <p class="text-xs font-semibold text-gray-500 mb-2">FOGLI RILEVATI</p>
              <div v-for="s in intent.sheets" :key="s.name"
                class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <span class="font-medium text-gray-700">{{ s.name }}</span>
                <span class="text-gray-400">{{ s.rows }} righe · {{ s.prefissi.join(', ') }}</span>
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="parseIntentFile" :disabled="!intent.file || intent.parsing"
                class="flex-1 btn-secondary text-sm disabled:opacity-40">
                {{ intent.parsing ? 'Analisi...' : '🔍 Analizza file' }}
              </button>
              <button @click="createIntentInvoices" :disabled="!intent.sheets.length || intent.creating"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                       bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                       transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <svg v-if="intent.creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ intent.creating ? 'Creazione...' : '✅ Crea Fatture su Odoo' }}
              </button>
            </div>
          </div>

          <!-- Risultati -->
          <div v-if="intent.results.length > 0" class="card">
            <h3 class="font-semibold text-gray-800 mb-3">Risultati</h3>
            <div class="space-y-2">
              <div v-for="r in intent.results" :key="r.nome_fattura"
                :class="['rounded-lg px-3 py-2 text-xs border',
                  r.stato === 'OK' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200']">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-semibold" :class="r.stato === 'OK' ? 'text-green-800' : 'text-red-800'">
                    {{ r.nome_fattura }}
                  </span>
                  <span class="text-gray-500">{{ r.righe }} righe</span>
                  <span :class="r.stato === 'OK' ? 'text-green-700' : 'text-red-600'">
                    {{ r.stato === 'OK' ? `✓ id=${r.move_id}` : r.stato }}
                  </span>
                </div>
                <div v-if="r.stato === 'OK'" class="flex gap-3 mt-1 text-gray-500">
                  <span v-if="r.bollo_aggiunto" class="text-amber-600 font-medium">📎 Bollo aggiunto</span>
                  <span v-if="r.totale">Imponibile: {{ formatEuro(r.totale) }}</span>
                </div>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{{ intent.results.filter(r => r.stato === 'OK').length }} fatture create</span>
              <span>{{ intent.results.filter(r => r.bollo_aggiunto).length }} con bollo</span>
              <span>{{ intent.results.filter(r => r.stato !== 'OK').length }} errori</span>
            </div>
          </div>

      </div>
    </div>

    <!-- ===================================================
         TAB — Logistica + Dichiarazione d'Intento (script logistics_v2)
    =================================================== -->
    <div v-if="activeTab === 'logistics_intent'">
      <!-- Header tab -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Logistica + Dichiarazione</h2>
          <p class="text-sm text-slate-500">Script logistics_v2 — logistica con dichiarazione d'intento</p>
        </div>
        <button @click="settingsOpen = 'logistics_intent'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-600 font-medium transition-all shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Impostazioni
        </button>
      </div>
      <div class="space-y-4">
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-2">Carica Report Settimanali Logistica</h3>
            <p class="text-xs text-gray-500 mb-3">
              Stessa struttura della Logistica standard — foglio
              <span class="font-mono bg-gray-100 px-1 rounded">RIEPILOGO</span>
              con Voce di Fatturato, Descrizione, Quantità, Importo, Tot.
              IVA e dichiarazione d'intento vengono applicate automaticamente.
            </p>

            <!-- Drop zone multi-file -->
            <div @click="$refs.inputLogIntent.click()"
              :class="['border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-4',
                logIntent.files.length > 0
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/30']">
              <input ref="inputLogIntent" type="file" accept=".xlsx,.xls" class="hidden"
                multiple @change="onLogIntentFilesChange"/>
              <svg class="w-8 h-8 mx-auto mb-2"
                :class="logIntent.files.length > 0 ? 'text-emerald-500' : 'text-gray-300'"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="text-sm font-medium text-gray-700">
                {{ logIntent.files.length > 0
                  ? `${logIntent.files.length} file selezionati`
                  : 'Clicca per selezionare i report settimanali (puoi selezionarne più di uno)' }}
              </p>
            </div>

            <!-- Lista file con stato parsing -->
            <div v-if="logIntent.files.length > 0" class="mb-4 space-y-1.5">
              <div v-for="(f, i) in logIntent.files" :key="i"
                class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs group">
                <span class="font-medium text-gray-700 truncate max-w-xs">{{ f.name }}</span>
                <div class="flex items-center gap-2 shrink-0">
                  <span v-if="logIntent.parsed[f.name]"
                    :class="logIntent.parsed[f.name].error ? 'text-red-500' : 'text-emerald-600'">
                    {{ logIntent.parsed[f.name].error
                      ? '⚠ ' + logIntent.parsed[f.name].error
                      : `✓ ${logIntent.parsed[f.name].realLines} righe · ${logIntent.parsed[f.name].sezioni} sezioni` }}
                  </span>
                  <button @click.stop="removeLogIntentFile(i)" class="text-gray-300 hover:text-red-500">✕</button>
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="parseLogIntentFiles" :disabled="!logIntent.files.length || logIntent.parsing"
                class="flex-1 btn-secondary text-sm disabled:opacity-40">
                {{ logIntent.parsing ? 'Analisi...' : '🔍 Analizza file' }}
              </button>
              <button @click="createLogIntentInvoices"
                :disabled="!Object.keys(logIntent.parsed).filter(k => !logIntent.parsed[k].error).length || logIntent.creating"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                       bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                       transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <svg v-if="logIntent.creating" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ logIntent.creating ? 'Creazione...' : '✅ Crea Fatture su Odoo' }}
              </button>
            </div>
          </div>

          <!-- Risultati -->
          <div v-if="logIntent.results.length > 0" class="card">
            <h3 class="font-semibold text-gray-800 mb-3">Risultati</h3>
            <div class="space-y-2">
              <div v-for="r in logIntent.results" :key="r.nome_fattura"
                :class="['rounded-lg px-3 py-2.5 text-xs border',
                  r.stato === 'OK' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200']">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono font-semibold truncate"
                    :class="r.stato === 'OK' ? 'text-green-800' : 'text-red-800'">
                    {{ r.nome_fattura }}
                  </span>
                  <div class="flex items-center gap-2 shrink-0 text-gray-500">
                    <span>{{ r.righe }} righe</span>
                    <span v-if="r.sezioni">· {{ r.sezioni }} sez.</span>
                  </div>
                  <span class="shrink-0" :class="r.stato === 'OK' ? 'text-green-700' : 'text-red-600'">
                    {{ r.stato === 'OK' ? `✓ id=${r.move_id}` : r.stato }}
                  </span>
                </div>
                <div v-if="r.stato === 'OK'" class="flex gap-3 mt-1 text-gray-500">
                  <span v-if="r.bollo_aggiunto" class="text-amber-600 font-medium">📎 Bollo aggiunto</span>
                  <span v-if="r.totale">Imponibile: {{ formatEuro(r.totale) }}</span>
                </div>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{{ logIntent.results.filter(r => r.stato === 'OK').length }} fatture create</span>
              <span>{{ logIntent.results.filter(r => r.bollo_aggiunto).length }} con bollo</span>
              <span>{{ logIntent.results.filter(r => r.stato !== 'OK').length }} errori</span>
            </div>
          </div>

      </div>
    </div>

    <!-- ===================================================
         TAB 5 — Monitoraggio Dichiarazioni d'Intento
    =================================================== -->
    <div v-if="activeTab === 'declarations'">

      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Dichiarazioni d'Intento</h2>
          <p class="text-sm text-gray-500">Monitoraggio utilizzo delle dichiarazioni d'intento attive</p>
        </div>
        <button @click="loadDeclarations" :disabled="declLoading"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700
                 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50">
          <svg v-if="declLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Aggiorna
        </button>
      </div>

      <div v-if="declLoading" class="card flex items-center justify-center py-12 gap-3 text-gray-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Caricamento dichiarazioni...
      </div>

      <div v-else-if="declarations.length === 0" class="card text-center py-16 text-gray-400">
        <p class="font-medium text-gray-500">Nessuna dichiarazione d'intento trovata</p>
        <p class="text-sm mt-1 text-gray-400">Verifica che il modulo l10n_it_declaration_of_intent sia installato</p>
      </div>

      <div v-else class="space-y-5">
        <div v-for="d in declarations" :key="d.id" class="card">

          <!-- Header dichiarazione -->
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <h3 class="font-mono font-bold text-gray-900">{{ d.name }}</h3>
                <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', declStateBadge(d.state)]">
                  {{ declStateLabel(d.state) }}
                </span>
              </div>
              <p class="text-sm text-gray-600">{{ d.partner }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                <span v-if="d.date">Dal {{ formatDateIt(d.date) }}</span>
                <span v-if="d.date_end"> · Al {{ formatDateIt(d.date_end) }}</span>
                <span v-if="d.fiscal_position" class="ml-2">— {{ d.fiscal_position }}</span>
              </p>
            </div>
            <div class="text-right shrink-0 space-y-0.5">
              <p class="text-xs text-gray-500">Massimale</p>
              <p class="text-lg font-bold text-gray-900">{{ formatEuro(d.amount_max) }}</p>
            </div>
          </div>

          <!-- Barra progresso -->
          <div class="mb-3">
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-gray-500">Utilizzato: <strong class="text-gray-800">{{ formatEuro(d.amount) }}</strong></span>
              <span :class="d.percent > 90 ? 'text-red-600 font-bold' : d.percent > 70 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'">
                {{ d.percent }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all duration-700',
                  d.percent > 90 ? 'bg-red-500' : d.percent > 70 ? 'bg-amber-500' : 'bg-emerald-500']"
                :style="{ width: Math.min(d.percent, 100) + '%' }"/>
            </div>
          </div>

          <!-- Riepilogo importi -->
          <div class="grid grid-cols-3 gap-3 mt-3">
            <div class="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
              <p class="text-base font-bold text-gray-900">{{ formatEuro(d.amount_max) }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Massimale</p>
            </div>
            <div class="bg-amber-50 rounded-xl px-3 py-2.5 text-center border border-amber-100">
              <p class="text-base font-bold text-amber-800">{{ formatEuro(d.amount) }}</p>
              <p class="text-xs text-amber-600 mt-0.5">Utilizzato</p>
            </div>
            <div :class="['rounded-xl px-3 py-2.5 text-center border',
              d.residual < d.amount_max * 0.1
                ? 'bg-red-50 border-red-200'
                : 'bg-emerald-50 border-emerald-100']">
              <p :class="['text-base font-bold',
                d.residual < d.amount_max * 0.1 ? 'text-red-700' : 'text-emerald-700']">
                {{ formatEuro(d.residual) }}
              </p>
              <p :class="['text-xs mt-0.5',
                d.residual < d.amount_max * 0.1 ? 'text-red-500' : 'text-emerald-600']">
                Residuo
              </p>
            </div>
          </div>

          <!-- Alert se quasi esaurito -->
          <div v-if="d.percent > 90"
            class="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            ⚠️ <strong>Attenzione:</strong> questa dichiarazione è quasi esaurita ({{ d.percent }}%).
            Residuo disponibile: <strong>{{ formatEuro(d.residual) }}</strong>.
          </div>
          <div v-else-if="d.percent > 70"
            class="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            ⚡ Dichiarazione utilizzata al {{ d.percent }}%. Residuo: <strong>{{ formatEuro(d.residual) }}</strong>.
          </div>

        </div>
      </div>
    </div>

    <!-- ===================================================
         TAB 6 — Visualizza Fatture (account.move)
    =================================================== -->
    <!-- ===================================================
         TAB 6 — Visualizza Fatture (account.move)
    =================================================== -->

    <div v-if="activeTab === 'lista'">

      <!-- Filtri -->
      <div class="card mb-5">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Da</label>
            <input v-model="listFilters.date_from" type="date" class="input-field"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">A</label>
            <input v-model="listFilters.date_to" type="date" class="input-field"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
            <select v-model="listFilters.partner_id" class="input-field">
              <option value="">Tutti</option>
              <option v-for="p in partners" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Stato</label>
            <select v-model="listFilters.state" class="input-field">
              <option value="all">Tutti</option>
              <option value="draft">Bozza</option>
              <option value="posted">Confermata</option>
              <option value="cancel">Annullata</option>
            </select>
          </div>
          <button @click="loadInvoices" :disabled="listLoading"
            class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                   bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm
                   transition-all shadow-sm disabled:opacity-50">
            <svg v-if="listLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Cerca
          </button>
        </div>
      </div>

      <!-- Totali -->
      <div v-if="listTotals" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="card !p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{{ listTotals.count }}</p>
          <p class="text-xs text-gray-500 mt-1">Fatture</p>
        </div>
        <div class="card !p-4 text-center">
          <p class="text-xl font-bold text-gray-900">{{ formatEuro(listTotals.amount_untaxed) }}</p>
          <p class="text-xs text-gray-500 mt-1">Imponibile</p>
        </div>
        <div class="card !p-4 text-center">
          <p class="text-xl font-bold text-gray-900">{{ formatEuro(listTotals.amount_tax) }}</p>
          <p class="text-xs text-gray-500 mt-1">IVA</p>
        </div>
        <div class="card !p-4 text-center bg-emerald-50 border border-emerald-200">
          <p class="text-xl font-bold text-emerald-700">{{ formatEuro(listTotals.amount_total) }}</p>
          <p class="text-xs text-emerald-600 mt-1">Totale Fatturato</p>
        </div>
      </div>

      <!-- Tabella fatture -->
      <div v-if="listLoading" class="card flex items-center justify-center py-12 gap-3 text-gray-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Caricamento fatture...
      </div>

      <div v-else-if="invoices.length === 0 && listTotals" class="card text-center py-12 text-gray-400">
        Nessuna fattura trovata per i filtri selezionati
      </div>

      <div v-else-if="invoices.length > 0" class="card !p-0 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100">
                <th class="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-xs">N. Fattura</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-xs">Cliente</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-xs">Data</th>
                <th class="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-xs">Stato / Pagamento</th>
                <th class="text-right px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-xs">Totale</th>
                <th class="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="inv in invoices" :key="inv.id"
                @click="openInvoice(inv)"
                class="hover:bg-emerald-50/50 transition-colors cursor-pointer group">
                <td class="px-4 py-3 font-mono font-semibold text-slate-900 text-xs whitespace-nowrap">{{ inv.name }}</td>
                <td class="px-4 py-3 text-slate-700 text-sm max-w-[180px] truncate">{{ inv.partner }}</td>
                <td class="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{{ formatDateIt(inv.date) }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-col gap-1">
                    <span :class="['inline-block text-xs font-semibold px-2 py-0.5 rounded-full w-fit', invoiceStateBadge(inv.state)]">
                      {{ invoiceStateLabel(inv.state) }}
                    </span>
                    <span v-if="inv.payment_state" :class="['inline-block text-xs px-2 py-0.5 rounded-full font-medium w-fit', paymentStateBadge(inv.payment_state)]">
                      {{ paymentStateLabel(inv.payment_state) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{{ formatEuro(inv.amount_total) }}</td>
                <td class="px-4 py-3 text-right">
                  <span class="text-slate-300 group-hover:text-emerald-500 transition-colors text-base">→</span>
                </td>
              </tr>
            </tbody>
          </table>
        <div class="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          {{ invoices.length }} fatture visualizzate
        </div>
      </div>

    </div>

    <!-- ===================================================
         DETTAGLIO FATTURA (overlay dentro tab lista)
    =================================================== -->
    <Transition name="slide-up">
    <div v-if="detail.invoice" class="fixed inset-0 z-40 bg-white overflow-y-auto">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">

        <!-- Header dettaglio fattura -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <button @click="closeInvoice"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm" style="background-color:#1A1714;" onmouseover="this.style.backgroundColor='#2D2A25'" onmouseout="this.style.backgroundColor='#1A1714'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
              </svg>
              Indietro alle fatture
            </button>
            <div class="flex items-center gap-2 text-sm text-slate-400">
              <span>/</span>
              <span class="font-mono font-bold text-slate-900">{{ detail.invoice.name }}</span>
            </div>
          </div>
          <button @click="closeInvoice"
            class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200
                   text-slate-500 hover:text-slate-700 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Loading dettaglio -->
        <div v-if="detail.loading" class="flex items-center justify-center py-20 gap-3 text-gray-400">
          <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Caricamento fattura...
        </div>

        <template v-else-if="detail.invoice">

          <!-- Header fattura -->
          <div class="card mb-5">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-3 flex-wrap">
                  <h2 class="text-xl font-bold font-mono text-gray-900">{{ detail.invoice.name }}</h2>
                  <span :class="['text-sm font-semibold px-3 py-1 rounded-full', invoiceStateBadge(detail.invoice.state)]">
                    {{ invoiceStateLabel(detail.invoice.state) }}
                  </span>
                  <span v-if="detail.invoice.payment_state"
                    :class="['text-xs px-2 py-0.5 rounded-full font-medium', paymentStateBadge(detail.invoice.payment_state)]">
                    {{ paymentStateLabel(detail.invoice.payment_state) }}
                  </span>
                </div>
                <p class="text-gray-600"><span class="font-medium">Cliente:</span> {{ detail.invoice.partner }}</p>
                <div class="flex gap-4 text-sm text-gray-500 flex-wrap">
                  <span v-if="detail.invoice.date">📅 Data: <strong>{{ formatDateIt(detail.invoice.date) }}</strong></span>
                  <span v-if="detail.invoice.date_due">⏱ Scadenza: <strong>{{ formatDateIt(detail.invoice.date_due) }}</strong></span>
                  <span v-if="detail.invoice.payment_term">💳 {{ detail.invoice.payment_term }}</span>
                  <span v-if="detail.invoice.ref">Rif: <strong>{{ detail.invoice.ref }}</strong></span>
                </div>
              </div>

              <!-- Importi -->
              <div class="space-y-1 text-right shrink-0">
                <p class="text-sm text-gray-500">Imponibile: <span class="font-semibold text-gray-800">{{ formatEuro(detail.invoice.amount_untaxed) }}</span></p>
                <p class="text-sm text-gray-500">IVA: <span class="font-semibold text-gray-800">{{ formatEuro(detail.invoice.amount_tax) }}</span></p>
                <p class="text-base font-bold text-gray-900">Totale: {{ formatEuro(detail.invoice.amount_total) }}</p>
                <p v-if="detail.invoice.amount_residual > 0" class="text-sm text-orange-600 font-medium">
                  Da pagare: {{ formatEuro(detail.invoice.amount_residual) }}
                </p>
              </div>
            </div>

            <!-- Note -->
            <div v-if="detail.invoice.narration" class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500 font-medium mb-1">Note</p>
              <p class="text-sm text-gray-700">{{ detail.invoice.narration }}</p>
            </div>
          </div>

          <!-- Azioni CRUD -->
          <div class="card mb-5">
            <h3 class="font-semibold text-gray-800 mb-3">Azioni</h3>
            <div class="flex flex-wrap gap-3">
              <!-- Conferma -->
              <button v-if="detail.invoice.state === 'draft'"
                @click="doAction('post')" :disabled="detail.acting"
                class="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700
                       text-white text-sm font-semibold transition-all disabled:opacity-50">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Conferma Fattura
              </button>

              <!-- Rimetti in bozza -->
              <button v-if="detail.invoice.state === 'posted'"
                @click="doAction('draft')" :disabled="detail.acting"
                class="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600
                       text-white text-sm font-semibold transition-all disabled:opacity-50">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Rimetti in Bozza
              </button>

              <!-- Annulla -->
              <button v-if="detail.invoice.state !== 'cancel'"
                @click="doAction('cancel')" :disabled="detail.acting"
                class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600
                       text-white text-sm font-semibold transition-all disabled:opacity-50">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Annulla
              </button>

              <!-- Aggiorna note -->
              <button v-if="detail.invoice.state === 'draft'"
                @click="detail.editNote = !detail.editNote"
                class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                       bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-all">
                ✏️ Modifica Note
              </button>

              <span v-if="detail.acting" class="flex items-center gap-2 text-sm text-gray-400">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Esecuzione...
              </span>
            </div>

            <!-- Form modifica note inline -->
            <div v-if="detail.editNote" class="mt-4 space-y-3 pt-4 border-t border-gray-100">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Note / Narrazione</label>
                <textarea v-model="detail.editVals.narration" rows="3"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">Riferimento esterno</label>
                <input v-model="detail.editVals.ref" type="text"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
              </div>
              <button @click="saveNote" :disabled="detail.acting"
                class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold
                       transition-all disabled:opacity-50">
                💾 Salva modifiche
              </button>
            </div>
          </div>

          <!-- Righe fattura -->
          <div class="card mb-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-800">Righe Fattura</h3>
              <button v-if="detail.invoice.state === 'draft'"
                @click="addLine"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all">
                + Aggiungi riga
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-xs">Descrizione</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-xs w-20">Q.tà</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-xs w-28">Prezzo Unit.</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-xs w-16">Sc.%</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-xs w-24">IVA</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-xs w-28">Subtotale</th>
                    <th v-if="detail.invoice.state === 'draft'" class="w-16 px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="line in detail.invoice.lines" :key="line.id || line._tmpId">

                    <!-- Sezione -->
                    <tr v-if="line.display_type === 'line_section'" class="bg-gray-50">
                      <td :colspan="detail.invoice.state === 'draft' ? 7 : 6" class="px-4 py-2">
                        <div v-if="line._editing" class="flex items-center gap-2">
                          <input v-model="line.name" class="flex-1 px-2 py-1 border border-gray-200 rounded text-xs"
                            @keydown.enter="saveLine(line)" @keydown.esc="cancelLine(line)"/>
                          <button @click="saveLine(line)" class="text-xs text-emerald-600 font-semibold">✓</button>
                          <button @click="cancelLine(line)" class="text-xs text-red-500">✕</button>
                        </div>
                        <div v-else class="flex items-center justify-between">
                          <span class="text-xs font-bold text-gray-600 uppercase tracking-wide">{{ line.name }}</span>
                          <button v-if="detail.invoice.state === 'draft'"
                            @click="deleteLine(line)"
                            class="text-gray-300 hover:text-red-500 text-xs ml-2">✕</button>
                        </div>
                      </td>
                    </tr>

                    <!-- Riga normale -->
                    <tr v-else class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td class="px-4 py-2.5">
                        <div v-if="line._editing" class="flex flex-col gap-1">
                          <input v-model="line.name" class="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                            placeholder="Descrizione"/>
                        </div>
                        <span v-else class="text-gray-800">{{ line.name }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <input v-if="line._editing" v-model.number="line.quantity" type="number" step="0.01"
                          class="w-20 px-2 py-1 border border-gray-200 rounded text-xs text-right"/>
                        <span v-else class="font-mono text-gray-700">{{ line.quantity }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <input v-if="line._editing" v-model.number="line.price_unit" type="number" step="0.001"
                          class="w-28 px-2 py-1 border border-gray-200 rounded text-xs text-right"/>
                        <span v-else class="font-mono text-gray-700">{{ formatEuro(line.price_unit) }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <input v-if="line._editing" v-model.number="line.discount" type="number" step="0.1"
                          class="w-16 px-2 py-1 border border-gray-200 rounded text-xs text-right"/>
                        <span v-else class="font-mono text-gray-500 text-xs">{{ line.discount ? line.discount + '%' : '' }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-xs text-gray-500">{{ line.tax_names?.join(', ') || '' }}</td>
                      <td class="px-4 py-2.5 text-right font-mono font-semibold text-gray-900">
                        {{ formatEuro(line.price_subtotal) }}
                      </td>
                      <td v-if="detail.invoice.state === 'draft'" class="px-4 py-2.5 text-right">
                        <div v-if="line._editing" class="flex items-center gap-1 justify-end">
                          <button @click="saveLine(line)" class="text-emerald-600 text-xs font-semibold">✓</button>
                          <button @click="cancelLine(line)" class="text-red-500 text-xs">✕</button>
                        </div>
                        <div v-else class="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100">
                          <button @click="editLine(line)"
                            class="text-gray-400 hover:text-emerald-600 text-xs">✏️</button>
                          <button @click="deleteLine(line)"
                            class="text-gray-400 hover:text-red-500 text-xs">✕</button>
                        </div>
                      </td>
                    </tr>

                  </template>
                </tbody>
                <tfoot class="border-t-2 border-gray-200">
                  <tr class="bg-gray-50">
                    <td :colspan="detail.invoice.state === 'draft' ? 5 : 4" class="px-4 py-2.5 text-right text-sm font-medium text-gray-600">Imponibile</td>
                    <td class="px-4 py-2.5 text-right font-mono font-bold text-gray-900">{{ formatEuro(detail.invoice.amount_untaxed) }}</td>
                    <td v-if="detail.invoice.state === 'draft'"></td>
                  </tr>
                  <tr class="bg-gray-50">
                    <td :colspan="detail.invoice.state === 'draft' ? 5 : 4" class="px-4 py-2.5 text-right text-sm font-medium text-gray-600">IVA</td>
                    <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ formatEuro(detail.invoice.amount_tax) }}</td>
                    <td v-if="detail.invoice.state === 'draft'"></td>
                  </tr>
                  <tr class="bg-emerald-50">
                    <td :colspan="detail.invoice.state === 'draft' ? 5 : 4" class="px-4 py-2.5 text-right text-base font-bold text-emerald-800">TOTALE</td>
                    <td class="px-4 py-2.5 text-right font-mono font-bold text-emerald-800 text-base">{{ formatEuro(detail.invoice.amount_total) }}</td>
                    <td v-if="detail.invoice.state === 'draft'"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Fattura Elettronica XML -->
          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-gray-800">Fattura Elettronica (XML FatturaPA)</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  <span v-if="detail.invoice.edi_state">
                    Stato EDI: <span class="font-medium">{{ detail.invoice.edi_state }}</span>
                  </span>
                  <span v-if="detail.invoice.edi_name" class="ml-3 font-mono">{{ detail.invoice.edi_name }}</span>
                  <span v-if="!detail.invoice.edi_state && !detail.invoice.edi_name" class="text-gray-400">
                    Nessun file EDI registrato — la fattura deve essere confermata
                  </span>
                </p>
              </div>
              <button
                @click="exportXml"
                :disabled="detail.exportingXml || detail.invoice.state !== 'posted'"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                       bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed">
                <svg v-if="detail.exportingXml" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                       a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ detail.exportingXml ? 'Generazione XML...' : 'Esporta XML FatturaPA' }}
              </button>
            </div>

            <div v-if="detail.invoice.state !== 'posted'" class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              ⚠️ La fattura deve essere <strong>confermata</strong> per esportare l'XML FatturaPA.
            </div>
            <div v-else class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              💡 Clicca "Esporta XML FatturaPA" per scaricare il file XML da inviare al Sistema di Interscambio (SDI).
            </div>
          </div>

        </template>

      </div>
    </div>
    </Transition>

      </div><!-- /max-w-4xl -->
    </div><!-- /flex-1 content -->

    <!-- ===================================================
         MODALE IMPOSTAZIONI
    =================================================== -->
    <Transition name="modal">
    <div v-if="settingsOpen" class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="settingsOpen = ''"/>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <!-- Header modale -->
        <div class="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Impostazioni</h3>
              <p class="text-xs text-slate-400">{{ tabs.find(t => t.key === settingsOpen)?.label }}</p>
            </div>
          </div>
          <button @click="settingsOpen = ''"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Contenuto impostazioni ODA -->
        <div v-if="settingsOpen === 'oda'" class="px-6 py-5 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Partner ID Odoo</label>
              <input v-model.number="odaCfg.partner_id" type="number" class="input-field" placeholder="es. 8"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Partner Bank ID</label>
              <input v-model.number="odaCfg.partner_bank_id" type="number" class="input-field" placeholder="es. 1"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Payment Term ID</label>
              <input v-model.number="odaCfg.payment_term_id" type="number" class="input-field" placeholder="es. 9"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Tax ID (IVA)</label>
              <input v-model.number="odaCfg.tax_id" type="number" class="input-field" placeholder="es. 1"/>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Account ID (opzionale)</label>
              <input v-model.number="odaCfg.account_id" type="number" class="input-field" placeholder="lascia vuoto per default"/>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Prefissi ODA (virgola)</label>
              <input v-model="odaCfg.oda_prefixes_str" type="text" class="input-field" placeholder="es. 40,57,44"/>
              <p class="text-xs text-slate-400 mt-1">Lascia vuoto per tutti i prefissi</p>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Stato Odoo</p>
            <div v-if="odaCfg.lastNumber !== null" class="text-sm mb-2">
              <p class="text-slate-600">Ultima: <span class="font-mono font-bold text-slate-900">{{ odaCfg.lastName || '—' }}</span></p>
              <p class="text-slate-600">Prossima: <span class="font-mono font-bold text-emerald-700">FATT/{{ currentYear }}/{{ String(odaCfg.lastNumber + 1).padStart(4,'0') }}/IT</span></p>
            </div>
            <button @click="loadLastNumber" class="btn-secondary text-xs">🔄 Recupera da Odoo</button>
          </div>
        </div>

        <!-- Contenuto impostazioni Logistica -->
        <div v-if="settingsOpen === 'logistics'" class="px-6 py-5 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Partner ID Odoo</label>
              <input v-model.number="logCfg.partner_id" type="number" class="input-field" placeholder="es. 8"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Partner Bank ID</label>
              <input v-model.number="logCfg.partner_bank_id" type="number" class="input-field" placeholder="es. 1"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Payment Term ID</label>
              <input v-model.number="logCfg.payment_term_id" type="number" class="input-field" placeholder="es. 9"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Tax ID (IVA)</label>
              <input v-model.number="logCfg.tax_id" type="number" class="input-field" placeholder="es. 1"/>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Account ID (opzionale)</label>
              <input v-model.number="logCfg.account_id" type="number" class="input-field" placeholder="lascia vuoto"/>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Stato Odoo</p>
            <div v-if="logCfg.lastNumber !== null" class="text-sm mb-2">
              <p class="text-slate-600">Prossima: <span class="font-mono font-bold text-emerald-700">FATT/{{ currentYear }}/{{ String(logCfg.lastNumber + 1).padStart(4,'0') }}/IT</span></p>
            </div>
            <button @click="loadLastNumberLog" class="btn-secondary text-xs">🔄 Recupera da Odoo</button>
          </div>
        </div>

        <!-- Contenuto impostazioni Fatture Dichiarazione -->
        <div v-if="settingsOpen === 'intent'" class="px-6 py-5 space-y-5">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Fattura</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Partner ID</label>
                <input v-model.number="intentCfg.partner_id" type="number" class="input-field" placeholder="es. 8"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Partner Bank ID</label>
                <input v-model.number="intentCfg.partner_bank_id" type="number" class="input-field" placeholder="es. 1"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Payment Term ID</label>
                <input v-model.number="intentCfg.payment_term_id" type="number" class="input-field" placeholder="es. 9"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Tax IVA Dichiarazione ID</label>
                <input v-model.number="intentCfg.tax_intent_id" type="number" class="input-field" placeholder="es. 34"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Posizione Fiscale ID</label>
                <input v-model.number="intentCfg.fiscal_position_id" type="number" class="input-field" placeholder="es. 5"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Account ID (opz.)</label>
                <input v-model.number="intentCfg.account_id" type="number" class="input-field" placeholder="vuoto"/>
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-500 mb-1">Dichiarazione d'Intento ID</label>
                <div class="flex gap-2">
                  <input v-model.number="intentCfg.declaration_id" type="number" class="input-field flex-1" placeholder="es. 1"/>
                  <button @click="loadDeclarationsForPicker" class="btn-secondary text-xs px-2">↗</button>
                </div>
                <p v-if="intentCfg.declaration_id" class="text-xs text-emerald-600 mt-1">
                  {{ declarations.find(d => d.id === intentCfg.declaration_id)?.name || 'ID impostato' }}
                </p>
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-500 mb-1">Prefissi ODA (virgola)</label>
                <input v-model="intentCfg.oda_prefixes_str" type="text" class="input-field" placeholder="es. 40,57,44"/>
                <p class="text-xs text-slate-400 mt-1">Lascia vuoto per tutti</p>
              </div>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bollo Virtuale</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Product Template ID</label>
                <input v-model.number="intentCfg.bollo_template_id" type="number" class="input-field" placeholder="es. 27751"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Tax ID bollo</label>
                <input v-model.number="intentCfg.bollo_tax_id" type="number" class="input-field" placeholder="es. 36"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Soglia bollo (€)</label>
                <input v-model.number="intentCfg.bollo_soglia" type="number" step="0.01" class="input-field" placeholder="77.46"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Importo bollo (€)</label>
                <input v-model.number="intentCfg.bollo_price" type="number" step="0.01" class="input-field" placeholder="2.00"/>
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-500 mb-1">Nota dichiarazione (narrazione)</label>
                <textarea v-model="intentCfg.nota_dichiarazione" rows="2" class="input-field text-xs"
                  placeholder="Riferimento alla Dichiarazione d'intento numero..."/>
              </div>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Stato Odoo</p>
            <div v-if="odaCfg.lastNumber !== null" class="text-sm mb-2">
              <p class="text-slate-600">Prossima: <span class="font-mono font-bold text-emerald-700">FATT/{{ currentYear }}/{{ String(odaCfg.lastNumber + 1).padStart(4,'0') }}/IT</span></p>
            </div>
            <button @click="loadLastNumber" class="btn-secondary text-xs">🔄 Recupera da Odoo</button>
          </div>
        </div>

        <!-- Contenuto impostazioni Logistica + Dichiarazione -->
        <div v-if="settingsOpen === 'logistics_intent'" class="px-6 py-5 space-y-5">
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Fattura</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Partner ID</label>
                <input v-model.number="logIntentCfg.partner_id" type="number" class="input-field" placeholder="es. 8"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Partner Bank ID</label>
                <input v-model.number="logIntentCfg.partner_bank_id" type="number" class="input-field" placeholder="es. 1"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Payment Term ID</label>
                <input v-model.number="logIntentCfg.payment_term_id" type="number" class="input-field" placeholder="es. 9"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Account ID (opz.)</label>
                <input v-model.number="logIntentCfg.account_id" type="number" class="input-field" placeholder="lascia vuoto"/>
              </div>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dichiarazione d'Intento</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Posizione Fiscale ID</label>
                <input v-model.number="logIntentCfg.fiscal_position_id" type="number" class="input-field" placeholder="es. 5"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Dichiarazione ID</label>
                <input v-model.number="logIntentCfg.declaration_id" type="number" class="input-field" placeholder="es. 1"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Tax IVA Dichiarazione ID</label>
                <input v-model.number="logIntentCfg.tax_intent_id" type="number" class="input-field" placeholder="es. 34"/>
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-500 mb-1">Nota in narrazione</label>
                <textarea v-model="logIntentCfg.nota_dichiarazione" rows="2" class="input-field text-xs"
                  placeholder="Riferimento alla Dichiarazione d'intento numero..."/>
              </div>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bollo Virtuale</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Product Template ID</label>
                <input v-model.number="logIntentCfg.bollo_template_id" type="number" class="input-field" placeholder="es. 27751"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Tax ID bollo</label>
                <input v-model.number="logIntentCfg.bollo_tax_id" type="number" class="input-field" placeholder="es. 36"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Soglia (€)</label>
                <input v-model.number="logIntentCfg.bollo_soglia" type="number" step="0.01" class="input-field" placeholder="77.46"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Importo (€)</label>
                <input v-model.number="logIntentCfg.bollo_price" type="number" step="0.01" class="input-field" placeholder="2.00"/>
              </div>
            </div>
          </div>
          <div class="border-t border-slate-100 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Stato Odoo</p>
            <div v-if="odaCfg.lastNumber !== null" class="text-sm mb-2">
              <p class="text-slate-600">Prossima: <span class="font-mono font-bold text-emerald-700">FATT/{{ currentYear }}/{{ String(odaCfg.lastNumber + 1).padStart(4,'0') }}/IT</span></p>
            </div>
            <button @click="loadLastNumber" class="btn-secondary text-xs">🔄 Recupera da Odoo</button>
          </div>
        </div>

        <!-- Footer modale -->
        <div class="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button @click="settingsOpen = ''" class="btn-primary">
            Chiudi
          </button>
        </div>
      </div>
    </div>
    </Transition>

  </div><!-- /flex outer -->
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'
import { useAuthStore } from '@/stores/auth.js'
import {
  getInvoiceLastNumber, createInvoicesOda,
  createInvoicesLogistics, fetchInvoices, fetchPartners,
  fetchInvoiceDetail, invoiceAction, updateInvoiceLines, exportInvoiceXml,
  fetchDeclarations, createInvoicesIntent, createInvoicesLogisticsIntent,
} from '@/api/odoo-service.js'

const auth     = useAuthStore()
const currentYear = new Date().getFullYear()

// ---- Toast ----
const toast = reactive({ visible: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.visible = true
  setTimeout(() => { toast.visible = false }, 5000)
}

// ---- Settings modal ----
const settingsOpen = ref('')

// ---- Tab ----
const tabs = [
  { key: 'genera',           icon: '⚙️',  label: 'Genera Report' },
  { key: 'oda',              icon: '📦',  label: 'Fatture ODA' },
  { key: 'intent',           icon: '📑',  label: 'Fatture Dichiarazione' },
  { key: 'logistics',        icon: '🚛',  label: 'Fatture Logistica' },
  { key: 'logistics_intent', icon: '🚛📑', label: 'Logistica + Dichiarazione' },
  { key: 'declarations',     icon: '📊',  label: "Dichiarazioni d'Intento" },
  { key: 'lista',            icon: '🗂️',  label: 'Visualizza Fatture' },
]
const activeTab = ref('genera')

// =============================================================
// TAB 1 — Genera Report (client-side, nessuna chiamata Odoo)
// =============================================================
const sorgente = reactive({
  file: null, loading: false, error: '', preview: null, totalRows: 0
})

const MESI_IT = {
  1:'Gennaio',2:'Febbraio',3:'Marzo',4:'Aprile',5:'Maggio',6:'Giugno',
  7:'Luglio',8:'Agosto',9:'Settembre',10:'Ottobre',11:'Novembre',12:'Dicembre'
}

function onSorgenteChange(e) {
  sorgente.file = e.target.files?.[0] || null
  sorgente.preview = null; sorgente.error = ''
  e.target.value = ''
}

async function generaReport() {
  if (!sorgente.file) return
  sorgente.loading = true; sorgente.error = ''
  try {
    const buffer = await sorgente.file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (!raw.length) throw new Error('Nessuna riga trovata nel file')

    // Rinomina colonne (corrispondenza con genera_fatture_claude.py)
    const df = raw.map(r => ({
      ODA:           r["Ord.d'acq."]                    || r['ODA'] || '',
      Descrizione:   r['OdA - Testo posizione']          || r['Descrizione'] || '',
      Materiale:     r['Materiale']                      || '',
      UMPOA:         r['UMPOA']                          || '',
      Data_reg:      r['Data reg.']                      || r['Data_reg'] || null,
      Quantita:      parseFloat(r['Quantity in PO price unit'] || r['Quantita'] || 0),
      PrezzoUnitario:parseFloat(r['Prezzo Unitario ODA in DD'] || r['Prezzo Unitario'] || 0),
    })).filter(r => r.ODA && r.Data_reg)

    // Applica logica UMPOA S4
    df.forEach(r => {
      if (r.UMPOA === 'S4') {
        r.Quantita_eff = r.Quantita * 4
        r.Prezzo_eff   = r.PrezzoUnitario / 4
      } else {
        r.Quantita_eff = r.Quantita
        r.Prezzo_eff   = r.PrezzoUnitario
      }
      const d = r.Data_reg instanceof Date ? r.Data_reg : new Date(r.Data_reg)
      r.Anno = isNaN(d) ? 0 : d.getFullYear()
      r.Mese = isNaN(d) ? 0 : d.getMonth() + 1
    })

    // Raggruppa per periodo
    const periodi = [...new Map(df.map(r => [`${r.Anno}-${r.Mese}`, { Anno: r.Anno, Mese: r.Mese }])).values()]
      .filter(p => p.Anno > 0)
      .sort((a, b) => a.Anno !== b.Anno ? a.Anno - b.Anno : a.Mese - b.Mese)

    const SHEET_COLORS = ['1F4E79','145A32','6E2F8A','7B3F00','1A5276','922B21']
    const wbOut = XLSX.utils.book_new()
    const preview = []

    periodi.forEach((p, i) => {
      const meseLabel = `${MESI_IT[p.Mese]} ${p.Anno}`
      const subset = df.filter(r => r.Anno === p.Anno && r.Mese === p.Mese)

      // Raggruppa
      const groupMap = new Map()
      subset.forEach(r => {
        const key = `${r.ODA}||${r.Descrizione}||${r.Materiale}||${r.Prezzo_eff}`
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            ODA: String(r.ODA).split('.')[0],
            Descrizione: r.Descrizione,
            Materiale: r.Materiale,
            'Prezzo Unitario': r.Prezzo_eff,
            Quantita: 0,
          })
        }
        groupMap.get(key).Quantita += r.Quantita_eff
      })

      const rows = Array.from(groupMap.values())
      const wsOut = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wbOut, wsOut, meseLabel.slice(0, 31))
      preview.push({ name: meseLabel, rows: rows.length })
    })

    // Foglio Log
    const logRows = [
      { A: 'File sorgente', B: sorgente.file.name },
      { A: 'Data elaborazione', B: new Date().toLocaleString('it-IT') },
      { A: 'Totale righe input', B: df.length },
    ]
    const wsLog = XLSX.utils.json_to_sheet(logRows, { header: ['A', 'B'], skipHeader: true })
    XLSX.utils.book_append_sheet(wbOut, wsLog, 'Log')

    sorgente.preview = preview
    sorgente.totalRows = df.length

    // Download
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    XLSX.writeFile(wbOut, `fatturazione_${today}.xlsx`)
    showToast(`✅ Report generato: ${preview.length} fogli mensili`)

  } catch (err) {
    sorgente.error = err.message || 'Errore durante la generazione'
    showToast('❌ ' + sorgente.error, 'error')
  } finally { sorgente.loading = false }
}

// =============================================================
// TAB 2 — Fatture ODA
// =============================================================
const odaCfg = reactive({
  partner_id: 8, partner_bank_id: 1, payment_term_id: 9,
  account_id: null, tax_id: 1,
  oda_prefixes_str: '40,57,44',
  lastNumber: null, lastName: null,
})
const oda = reactive({ file: null, sheets: [], parsing: false, creating: false, results: [] })

async function loadLastNumber() {
  try {
    const { uid, password } = auth.getCredentials()
    const r = await getInvoiceLastNumber(uid, password)
    odaCfg.lastNumber = r.last_number
    odaCfg.lastName   = r.last_name
    logCfg.lastNumber = r.last_number
    showToast(`📌 Ultima fattura: ${r.last_name || 'nessuna'}`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
}
async function loadLastNumberLog() { return loadLastNumber() }

function onOdaFileChange(e) {
  oda.file = e.target.files?.[0] || null
  oda.sheets = []; oda.results = []
  e.target.value = ''
}

async function parseOdaFile() {
  if (!oda.file) return
  oda.parsing = true
  try {
    const buffer = await oda.file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const prefissi = odaCfg.oda_prefixes_str
      ? odaCfg.oda_prefixes_str.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const ODA_LEN = 2

    oda.sheets = []
    for (const sheetName of wb.SheetNames) {
      if (sheetName === 'Log') continue
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!rows.length) continue

      const odaClean = rows
        .filter(r => r.ODA)
        .map(r => String(r.ODA).split('.')[0].slice(0, ODA_LEN))
      const prefInFoglio = [...new Set(odaClean)].sort()
      const prefFiltrati = prefissi.length ? prefInFoglio.filter(p => prefissi.includes(p)) : prefInFoglio

      oda.sheets.push({ name: sheetName, rows: rows.length, prefissi: prefFiltrati, data: rows })
    }
    showToast(`✅ Analisi completata: ${oda.sheets.length} fogli`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { oda.parsing = false }
}

async function createOdaInvoices() {
  oda.creating = true; oda.results = []
  try {
    if (odaCfg.lastNumber === null) await loadLastNumber()
    const { uid, password } = auth.getCredentials()
    const prefissi = odaCfg.oda_prefixes_str
      ? odaCfg.oda_prefixes_str.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const ODA_LEN = 2

    let nextNum = (odaCfg.lastNumber || 0) + 1
    const invoicesData = []

    for (const sheet of oda.sheets) {
      const prefInSheet = prefissi.length ? sheet.prefissi.filter(p => prefissi.includes(p)) : sheet.prefissi
      for (const pref of prefInSheet) {
        const lines = sheet.data
          .filter(r => r.ODA && String(r.ODA).split('.')[0].slice(0, ODA_LEN) === pref)
          .filter(r => r.Descrizione && parseFloat(r.Quantita || 0) !== 0)
          .map(r => ({
            name:       String(r.Descrizione || ''),
            admin_ref:  String(r.ODA || '').split('.')[0],
            quantity:   parseFloat(r.Quantita  || 0),
            price_unit: parseFloat(r['Prezzo Unitario'] || 0),
          }))
        if (!lines.length) continue
        const nomeFattura = `FATT/${currentYear}/${String(nextNum).padStart(4, '0')}/IT`
        invoicesData.push({
          nome_fattura:    nomeFattura,
          mese_label:      sheet.name,
          oda_prefix:      pref,
          partner_id:      odaCfg.partner_id,
          partner_bank_id: odaCfg.partner_bank_id,
          payment_term_id: odaCfg.payment_term_id,
          account_id:      odaCfg.account_id || null,
          tax_id:          odaCfg.tax_id,
          narration:       `Fattura ${sheet.name} — ODA ${pref}xxxxx — generata automaticamente`,
          lines,
        })
        nextNum++
      }
    }

    if (!invoicesData.length) { showToast('⚠️ Nessuna fattura da creare', 'warning'); return }

    const results = await createInvoicesOda(uid, password, invoicesData)
    oda.results = results
    odaCfg.lastNumber = nextNum - 1
    const ok = results.filter(r => r.stato === 'OK').length
    showToast(`✅ ${ok} fatture create su ${results.length}`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { oda.creating = false }
}

// =============================================================
// TAB 3 — Fatture Logistica
// =============================================================
const logCfg = reactive({
  partner_id: 8, partner_bank_id: 1, payment_term_id: 9,
  account_id: null, tax_id: 1, lastNumber: null,
})
const log = reactive({ files: [], parsed: {}, parsing: false, creating: false, results: [] })

function onLogFilesChange(e) {
  log.files = [...log.files, ...Array.from(e.target.files || [])]
  log.parsed = {}; log.results = []
  e.target.value = ''
}
function removeLogFile(idx) {
  log.files.splice(idx, 1)
  log.parsed = {}; log.results = []
}

async function parseLogFiles() {
  log.parsing = true; log.parsed = {}
  for (const file of log.files) {
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      // Cerca foglio RIEPILOGO (case-insensitive)
      const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('riepilogo'))
        || wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      // Trova riga header (contiene "Voce di Fatturato")
      let headerRow = -1
      for (let i = 0; i < raw.length; i++) {
        if (raw[i].some(v => String(v).toLowerCase().includes('voce di fatturato'))) {
          headerRow = i; break
        }
      }
      if (headerRow === -1) throw new Error("Intestazione 'Voce di Fatturato' non trovata")

      const header = raw[headerRow]
      const colVoce   = header.findIndex(v => String(v).toLowerCase().includes('voce'))
      const colDesc   = header.findIndex(v => String(v).toLowerCase().includes('descrizione'))
      const colQta    = header.findIndex(v => String(v).toLowerCase().includes('quantit'))
      const colImporto= header.findIndex(v => String(v).toLowerCase().includes('importo'))
      const colTot    = header.findIndex(v => String(v).trim().toLowerCase() === 'tot')

      if (colVoce === -1 || colDesc === -1 || colTot === -1)
        throw new Error('Colonne obbligatorie mancanti (Voce, Descrizione, Tot)')

      const dataRows = raw.slice(headerRow + 1)
      const lines = []; let vocePrev = ''; let realLines = 0

      dataRows.forEach(row => {
        const voce  = String(row[colVoce]  || '').trim()
        const desc  = String(row[colDesc]  || '').trim()
        const tot   = parseFloat(row[colTot] || 0)
        const qta   = colQta   >= 0 ? parseFloat(row[colQta]    || 0) : 0
        const imp   = colImporto >= 0 ? parseFloat(row[colImporto] || 0) : 0

        if (!desc) return
        if (desc.toLowerCase().startsWith('totale')) return
        if (isNaN(tot) || tot === 0) return

        const voceEff = voce || vocePrev
        if (voceEff && voceEff !== vocePrev) {
          lines.push({ display_type: 'line_section', name: voceEff })
          vocePrev = voceEff
        }

        const qtyOk = !isNaN(qta) && qta !== 0
        const impOk = !isNaN(imp) && imp !== 0
        lines.push({
          name:       desc,
          quantity:   qtyOk && impOk ? qta : 1,
          price_unit: qtyOk && impOk ? imp : tot,
        })
        realLines++
      })

      log.parsed[file.name] = { lines, realLines, sheetName }
    } catch (err) {
      log.parsed[file.name] = { error: err.message, lines: [], realLines: 0 }
    }
  }
  log.parsing = false
  const ok = Object.values(log.parsed).filter(v => !v.error).length
  showToast(`✅ Analisi: ${ok}/${log.files.length} file validi`)
}

async function createLogInvoices() {
  log.creating = true; log.results = []
  try {
    if (logCfg.lastNumber === null) await loadLastNumber()
    const { uid, password } = auth.getCredentials()
    let nextNum = (logCfg.lastNumber || 0) + 1
    const invoicesData = []

    for (const [filename, parsed] of Object.entries(log.parsed)) {
      if (parsed.error || !parsed.realLines) continue
      const nomeFattura = `FATT/${currentYear}/${String(nextNum).padStart(4, '0')}/IT`
      invoicesData.push({
        nome_fattura:    nomeFattura,
        source_file:     filename,
        partner_id:      logCfg.partner_id,
        partner_bank_id: logCfg.partner_bank_id,
        payment_term_id: logCfg.payment_term_id,
        account_id:      logCfg.account_id || null,
        tax_id:          logCfg.tax_id,
        lines:           parsed.lines,
      })
      nextNum++
    }

    if (!invoicesData.length) { showToast('⚠️ Nessuna fattura valida da creare', 'warning'); return }

    const results = await createInvoicesLogistics(uid, password, invoicesData)
    log.results = results
    logCfg.lastNumber = nextNum - 1
    const ok = results.filter(r => r.stato === 'OK').length
    showToast(`✅ ${ok} fatture create su ${results.length}`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { log.creating = false }
}

// =============================================================
// TAB 4 — Visualizza Fatture
// =============================================================
const invoices    = ref([])
const listTotals  = ref(null)
const listLoading = ref(false)
const partners    = ref([])
const listFilters = reactive({
  date_from: `${currentYear}-01-01`,
  date_to:   new Date().toISOString().slice(0, 10),
  partner_id: '',
  state:      'all',
})

onMounted(async () => {
  try {
    const { uid, password } = auth.getCredentials()
    partners.value = await fetchPartners(uid, password)
  } catch (e) { console.warn('fetchPartners error:', e) }
})

async function loadInvoices() {
  listLoading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const filters = {
      date_from:  listFilters.date_from  || undefined,
      date_to:    listFilters.date_to    || undefined,
      partner_id: listFilters.partner_id || undefined,
      state:      listFilters.state      || 'all',
      limit:      500,
    }
    const result = await fetchInvoices(uid, password, filters)
    invoices.value  = result.invoices || []
    listTotals.value = result.totals  || null
  } catch (e) {
    showToast('❌ Errore caricamento fatture: ' + e.message, 'error')
  } finally { listLoading.value = false }
}

// =============================================================
// TAB DICHIARAZIONE D'INTENTO (script v3)
// =============================================================
const intentCfg = reactive({
  partner_id: 8, partner_bank_id: 1, payment_term_id: 9,
  fiscal_position_id: 5, declaration_id: 1,
  tax_intent_id: 34, account_id: null,
  bollo_template_id: 27751, bollo_tax_id: 36,
  bollo_soglia: 77.46, bollo_price: 2.00,
  nota_dichiarazione: "Riferimento alla Dichiarazione d'intento numero 2603311531351892 - 000004",
  oda_prefixes_str: '40,57,44',
})
const intent = reactive({ file: null, sheets: [], parsing: false, creating: false, results: [] })

function onIntentFileChange(e) {
  intent.file = e.target.files?.[0] || null
  intent.sheets = []; intent.results = []
  e.target.value = ''
}

async function parseIntentFile() {
  if (!intent.file) return
  intent.parsing = true
  try {
    const buffer = await intent.file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const prefissi = intentCfg.oda_prefixes_str
      ? intentCfg.oda_prefixes_str.split(',').map(s => s.trim()).filter(Boolean)
      : []
    intent.sheets = []
    for (const sheetName of wb.SheetNames) {
      if (sheetName === 'Log') continue
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!rows.length) continue
      const odaClean = rows.filter(r => r.ODA).map(r => String(r.ODA).split('.')[0].slice(0, 2))
      const prefInFoglio = [...new Set(odaClean)].sort()
      const prefFiltrati = prefissi.length ? prefInFoglio.filter(p => prefissi.includes(p)) : prefInFoglio
      intent.sheets.push({ name: sheetName, rows: rows.length, prefissi: prefFiltrati, data: rows })
    }
    showToast(`✅ ${intent.sheets.length} fogli analizzati`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { intent.parsing = false }
}

async function createIntentInvoices() {
  intent.creating = true; intent.results = []
  try {
    if (odaCfg.lastNumber === null) await loadLastNumber()
    const { uid, password } = auth.getCredentials()
    const prefissi = intentCfg.oda_prefixes_str
      ? intentCfg.oda_prefixes_str.split(',').map(s => s.trim()).filter(Boolean)
      : []

    let nextNum = (odaCfg.lastNumber || 0) + 1
    const invoicesData = []

    for (const sheet of intent.sheets) {
      const prefInSheet = prefissi.length ? sheet.prefissi.filter(p => prefissi.includes(p)) : sheet.prefissi
      for (const pref of prefInSheet) {
        const lines = sheet.data
          .filter(r => r.ODA && String(r.ODA).split('.')[0].slice(0, 2) === pref)
          .filter(r => r.Descrizione && parseFloat(r.Quantita || 0) !== 0)
          .map(r => ({
            name:       String(r.Descrizione || ''),
            admin_ref:  String(r.ODA || '').split('.')[0],
            quantity:   parseFloat(r.Quantita  || 0),
            price_unit: parseFloat(r['Prezzo Unitario'] || 0),
          }))
        if (!lines.length) continue
        const nomeFattura = `FATT/${currentYear}/${String(nextNum).padStart(4, '0')}/IT`
        invoicesData.push({ nome_fattura: nomeFattura, mese_label: sheet.name, oda_prefix: pref, lines })
        nextNum++
      }
    }

    if (!invoicesData.length) { showToast('⚠️ Nessuna fattura da creare', 'warning'); return }

    const cfg = {
      partner_id:          intentCfg.partner_id,
      partner_bank_id:     intentCfg.partner_bank_id,
      payment_term_id:     intentCfg.payment_term_id,
      fiscal_position_id:  intentCfg.fiscal_position_id,
      declaration_id:      intentCfg.declaration_id,
      nota_dichiarazione:  intentCfg.nota_dichiarazione,
      tax_intent_id:       intentCfg.tax_intent_id,
      account_id:          intentCfg.account_id || null,
      bollo_template_id:   intentCfg.bollo_template_id,
      bollo_tax_id:        intentCfg.bollo_tax_id,
      bollo_soglia:        intentCfg.bollo_soglia,
      bollo_price:         intentCfg.bollo_price,
    }

    const results = await createInvoicesIntent(uid, password, invoicesData, cfg)
    intent.results = results
    odaCfg.lastNumber = nextNum - 1
    const ok = results.filter(r => r.stato === 'OK').length
    const bollate = results.filter(r => r.bollo_aggiunto).length
    showToast(`✅ ${ok} fatture create${bollate ? ` (${bollate} con bollo)` : ''}`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { intent.creating = false }
}

// =============================================================
// TAB MONITORAGGIO DICHIARAZIONI D'INTENTO
// =============================================================
const declarations = ref([])
const declLoading  = ref(false)

async function loadDeclarations() {
  declLoading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    declarations.value = await fetchDeclarations(uid, password)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { declLoading.value = false }
}

async function loadDeclarationsForPicker() {
  if (!declarations.value.length) await loadDeclarations()
  // Vai al tab dichiarazioni per selezionare
  activeTab.value = 'declarations'
}

// Carica dichiarazioni quando si accede al tab
watch(() => activeTab.value, (tab) => {
  if (tab === 'declarations' && !declarations.value.length) loadDeclarations()
})

function declStateBadge(s) {
  return { draft:'bg-gray-100 text-gray-600', confirmed:'bg-green-100 text-green-700',
           expired:'bg-red-100 text-red-600' }[s] || 'bg-gray-100 text-gray-500'
}
function declStateLabel(s) {
  return { draft:'Bozza', confirmed:'Attiva', expired:'Scaduta' }[s] || s
}

// =============================================================
// TAB LOGISTICA + DICHIARAZIONE D'INTENTO (script logistics_v2)
// =============================================================
const logIntentCfg = reactive({
  partner_id: 8, partner_bank_id: 1, payment_term_id: 9,
  fiscal_position_id: 5, declaration_id: 1,
  tax_intent_id: 34, account_id: null,
  bollo_template_id: 27751, bollo_tax_id: 36,
  bollo_soglia: 77.46, bollo_price: 2.00,
  nota_dichiarazione: "Riferimento alla Dichiarazione d'intento numero 2603311531351892 - 000004",
})
const logIntent = reactive({ files: [], parsed: {}, parsing: false, creating: false, results: [] })

function onLogIntentFilesChange(e) {
  logIntent.files = [...logIntent.files, ...Array.from(e.target.files || [])]
  logIntent.parsed = {}; logIntent.results = []
  e.target.value = ''
}

function removeLogIntentFile(idx) {
  logIntent.files.splice(idx, 1)
  logIntent.parsed = {}; logIntent.results = []
}

async function parseLogIntentFiles() {
  logIntent.parsing = true; logIntent.parsed = {}
  for (const file of logIntent.files) {
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('riepilogo')) || wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      let headerRow = -1
      for (let i = 0; i < raw.length; i++) {
        if (raw[i].some(v => String(v).toLowerCase().includes('voce di fatturato'))) {
          headerRow = i; break
        }
      }
      if (headerRow === -1) throw new Error("Intestazione 'Voce di Fatturato' non trovata")

      const header = raw[headerRow]
      const colVoce    = header.findIndex(v => String(v).toLowerCase().includes('voce'))
      const colDesc    = header.findIndex(v => String(v).toLowerCase().includes('descrizione'))
      const colQta     = header.findIndex(v => String(v).toLowerCase().includes('quantit'))
      const colImporto = header.findIndex(v => String(v).toLowerCase().includes('importo'))
      const colTot     = header.findIndex(v => String(v).trim().toLowerCase() === 'tot')

      if (colVoce === -1 || colDesc === -1 || colTot === -1)
        throw new Error('Colonne obbligatorie mancanti (Voce, Descrizione, Tot)')

      const dataRows = raw.slice(headerRow + 1)
      const lines = []; let vocePrev = ''; let realLines = 0; let sezioni = 0

      dataRows.forEach(row => {
        const voce = String(row[colVoce] || '').trim()
        const desc = String(row[colDesc] || '').trim()
        const tot  = parseFloat(row[colTot] || 0)
        const qta  = colQta     >= 0 ? parseFloat(row[colQta]     || 0) : 0
        const imp  = colImporto >= 0 ? parseFloat(row[colImporto] || 0) : 0

        if (!desc) return
        if (desc.toLowerCase().startsWith('totale')) return
        if (isNaN(tot) || tot === 0) return

        const voceEff = voce || vocePrev
        if (voceEff && voceEff !== vocePrev) {
          lines.push({ display_type: 'line_section', name: voceEff })
          vocePrev = voceEff; sezioni++
        }

        const qtyOk = !isNaN(qta) && qta !== 0
        const impOk = !isNaN(imp) && imp !== 0
        lines.push({
          name:       desc,
          quantity:   qtyOk && impOk ? qta : 1,
          price_unit: qtyOk && impOk ? imp : tot,
        })
        realLines++
      })

      logIntent.parsed[file.name] = { lines, realLines, sezioni, sheetName }
    } catch (err) {
      logIntent.parsed[file.name] = { error: err.message, lines: [], realLines: 0, sezioni: 0 }
    }
  }
  logIntent.parsing = false
  const ok = Object.values(logIntent.parsed).filter(v => !v.error).length
  showToast(`✅ Analisi: ${ok}/${logIntent.files.length} file validi`)
}

async function createLogIntentInvoices() {
  logIntent.creating = true; logIntent.results = []
  try {
    if (odaCfg.lastNumber === null) await loadLastNumber()
    const { uid, password } = auth.getCredentials()
    let nextNum = (odaCfg.lastNumber || 0) + 1
    const invoicesData = []

    for (const [filename, parsed] of Object.entries(logIntent.parsed)) {
      if (parsed.error || !parsed.realLines) continue
      invoicesData.push({
        nome_fattura: `FATT/${currentYear}/${String(nextNum).padStart(4, '0')}/IT`,
        source_file:  filename,
        lines:        parsed.lines,
      })
      nextNum++
    }

    if (!invoicesData.length) { showToast('⚠️ Nessuna fattura valida', 'warning'); return }

    const cfg = {
      partner_id:         logIntentCfg.partner_id,
      partner_bank_id:    logIntentCfg.partner_bank_id,
      payment_term_id:    logIntentCfg.payment_term_id,
      fiscal_position_id: logIntentCfg.fiscal_position_id,
      declaration_id:     logIntentCfg.declaration_id,
      nota_dichiarazione: logIntentCfg.nota_dichiarazione,
      tax_intent_id:      logIntentCfg.tax_intent_id,
      account_id:         logIntentCfg.account_id || null,
      bollo_template_id:  logIntentCfg.bollo_template_id,
      bollo_tax_id:       logIntentCfg.bollo_tax_id,
      bollo_soglia:       logIntentCfg.bollo_soglia,
      bollo_price:        logIntentCfg.bollo_price,
    }

    const results = await createInvoicesLogisticsIntent(uid, password, invoicesData, cfg)
    logIntent.results = results
    odaCfg.lastNumber = nextNum - 1
    const ok = results.filter(r => r.stato === 'OK').length
    const bollate = results.filter(r => r.bollo_aggiunto).length
    showToast(`✅ ${ok} fatture create${bollate ? ` (${bollate} con bollo)` : ''}`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { logIntent.creating = false }
}

// =============================================================
// DETTAGLIO FATTURA
// =============================================================
const detail = reactive({
  invoice:      null,   // fattura corrente
  loading:      false,
  acting:       false,
  exportingXml: false,
  editNote:     false,
  editVals:     { narration: '', ref: '' },
  _lineCounter: -1,     // id temporaneo per righe nuove
})

async function openInvoice(inv) {
  detail.invoice = { ...inv, lines: [] }
  detail.loading = true
  detail.editNote = false
  try {
    const { uid, password } = auth.getCredentials()
    const data = await fetchInvoiceDetail(uid, password, inv.id)
    detail.invoice = { ...data }
    detail.editVals = { narration: data.narration || '', ref: data.ref || '' }
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { detail.loading = false }
}

function closeInvoice() {
  detail.invoice = null
  detail.editNote = false
  // Ricarica lista per aggiornare stati
  loadInvoices()
}

async function doAction(action) {
  if (!detail.invoice || detail.acting) return
  detail.acting = true
  try {
    const { uid, password } = auth.getCredentials()
    const result = await invoiceAction(uid, password, detail.invoice.id, action)
    showToast(`✅ ${result.message}`)
    // Ricarica dettaglio
    const data = await fetchInvoiceDetail(uid, password, detail.invoice.id)
    detail.invoice = { ...data }
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { detail.acting = false }
}

async function saveNote() {
  if (!detail.invoice || detail.acting) return
  detail.acting = true
  try {
    const { uid, password } = auth.getCredentials()
    await invoiceAction(uid, password, detail.invoice.id, 'write', {
      narration: detail.editVals.narration,
      ref:       detail.editVals.ref,
    })
    detail.invoice.narration = detail.editVals.narration
    detail.invoice.ref       = detail.editVals.ref
    detail.editNote = false
    showToast('✅ Note aggiornate')
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { detail.acting = false }
}

// ---- Gestione righe ----
function editLine(line) {
  line._orig = { ...line }
  line._editing = true
}

function cancelLine(line) {
  if (line._orig) Object.assign(line, line._orig)
  line._editing = false
}

async function saveLine(line) {
  line._editing = false
  const isNew = line.id < 0
  try {
    const { uid, password } = auth.getCredentials()
    const op = isNew
      ? { op: 'create', vals: { name: line.name, quantity: line.quantity,
            price_unit: line.price_unit, discount: line.discount || 0,
            display_type: line.display_type || false } }
      : { op: 'update', line_id: line.id, vals: { name: line.name,
            quantity: line.quantity, price_unit: line.price_unit,
            discount: line.discount || 0 } }
    await updateInvoiceLines(uid, password, detail.invoice.id, [op])
    // Ricarica per avere subtotali aggiornati
    const data = await fetchInvoiceDetail(uid, password, detail.invoice.id)
    detail.invoice = { ...data }
    showToast('✅ Riga salvata')
  } catch (e) { showToast('❌ ' + e.message, 'error') }
}

async function deleteLine(line) {
  if (line.id < 0) {
    // Rimuovi solo localmente
    const idx = detail.invoice.lines.indexOf(line)
    if (idx !== -1) detail.invoice.lines.splice(idx, 1)
    return
  }
  try {
    const { uid, password } = auth.getCredentials()
    await updateInvoiceLines(uid, password, detail.invoice.id, [{ op: 'delete', line_id: line.id }])
    const data = await fetchInvoiceDetail(uid, password, detail.invoice.id)
    detail.invoice = { ...data }
    showToast('✅ Riga eliminata')
  } catch (e) { showToast('❌ ' + e.message, 'error') }
}

function addLine() {
  const tmpId = detail._lineCounter--
  detail.invoice.lines.push({
    id: tmpId, _tmpId: tmpId, _editing: true, display_type: '',
    name: '', quantity: 1, price_unit: 0, discount: 0,
    price_subtotal: 0, price_total: 0, tax_names: [], account: '',
  })
}

// ---- Export XML ----
async function exportXml() {
  if (!detail.invoice || detail.exportingXml) return
  detail.exportingXml = true
  try {
    const { uid, password } = auth.getCredentials()
    const result = await exportInvoiceXml(uid, password, detail.invoice.id)
    // Download diretto nel browser
    const byteChars = atob(result.content_b64)
    const byteArr   = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
    const blob  = new Blob([byteArr], { type: 'application/xml' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href      = url
    a.download  = result.filename || `${detail.invoice.name.replace(/\//g, '_')}.xml`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`✅ XML scaricato: ${result.filename}`)
  } catch (e) { showToast('❌ ' + e.message, 'error') }
  finally { detail.exportingXml = false }
}

// ---- Helpers stile ----
function invoiceStateBadge(s) {
  return { draft:'bg-gray-100 text-gray-600', posted:'bg-green-100 text-green-700',
           cancel:'bg-red-100 text-red-600' }[s] || 'bg-gray-100 text-gray-600'
}
function invoiceStateLabel(s) {
  return { draft:'Bozza', posted:'Confermata', cancel:'Annullata' }[s] || s
}
function paymentStateBadge(s) {
  return { not_paid:'bg-orange-100 text-orange-700', in_payment:'bg-blue-100 text-blue-700',
           paid:'bg-green-100 text-green-700', partial:'bg-yellow-100 text-yellow-700',
           reversed:'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100 text-gray-500'
}
function paymentStateLabel(s) {
  return { not_paid:'Non pagata', in_payment:'In pagamento', paid:'Pagata',
           partial:'Parziale', reversed:'Stornata' }[s] || s
}
function formatEuro(n) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n)
}
function formatDateIt(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white;
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(1rem); }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child { transition: all 0.2s ease; }
.modal-enter-from > div:last-child, .modal-leave-to > div:last-child { transform: translateY(-12px) scale(0.97); }
</style>

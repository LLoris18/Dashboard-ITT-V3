<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.visible" :class="[
        'fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm',
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      ]">
        <span>{{ toast.message }}</span>
        <button @click="toast.visible = false" class="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </Transition>

    <!-- ================================================================
         VISTA: PICKING (livello 3 — dopo azione server)
    ================================================================ -->
    <template v-if="view === 'picking'">

      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 mb-6 text-sm">
        <button @click="goTo('batches')" class="text-indigo-600 hover:text-indigo-800 font-medium">Jobs</button>
        <span class="text-gray-300">/</span>
        <button @click="goTo('rows')" class="text-indigo-600 hover:text-indigo-800 font-medium truncate max-w-xs">
          {{ selectedBatch?.name }}
        </button>
        <span class="text-gray-300">/</span>
        <span class="text-gray-500 font-medium">Picking creati</span>
      </div>

      <!-- Loading picking -->
      <div v-if="loadingPicking" class="card flex items-center justify-center py-16 gap-3 text-gray-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Recupero picking in corso...
      </div>

      <template v-else>
        <div v-if="!pickings.length" class="card text-center py-16 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <p class="font-medium text-gray-500">Nessun picking trovato per questo batch</p>
          <p class="text-sm text-gray-400 mt-1">Il picking potrebbe non essere ancora stato creato o il collegamento non è disponibile</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="picking in pickings" :key="picking.id" class="card !p-0 overflow-hidden">

            <!-- Header picking -->
            <div class="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <span class="font-bold text-indigo-900 font-mono text-sm">{{ picking.name }}</span>
                    <span v-if="picking.origin" class="text-xs text-indigo-600">origine: {{ picking.origin }}</span>
                    <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', pickingStateBadge(picking.state)]">
                      {{ pickingStateLabel(picking.state) }}
                    </span>
                  </div>
                  <p class="text-xs text-indigo-500 mt-1">
                    {{ picking.picking_type }}
                    <span v-if="picking.partner"> · {{ picking.partner }}</span>
                    <span v-if="picking.scheduled_date"> · {{ formatDate(picking.scheduled_date) }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Tab Operations / Detailed -->
            <div class="px-5 pt-4 pb-0 border-b border-gray-100">
              <div class="flex gap-4">
                <button
                  @click="pickingTab[picking.id] = 'ops'"
                  :class="['pb-3 text-sm font-medium border-b-2 transition-colors',
                    (pickingTab[picking.id] || 'ops') === 'ops'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700']">
                  Operations
                  <span class="ml-1 text-xs opacity-60">({{ picking.moves.length }})</span>
                </button>
                <button
                  @click="pickingTab[picking.id] = 'detail'"
                  :class="['pb-3 text-sm font-medium border-b-2 transition-colors',
                    pickingTab[picking.id] === 'detail'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700']">
                  Detailed Operations
                  <span class="ml-1 text-xs opacity-60">({{ picking.detailed.length }})</span>
                </button>
              </div>
            </div>

            <!-- Tab: Operations (stock.move) -->
            <div v-if="(pickingTab[picking.id] || 'ops') === 'ops'" class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Prodotto</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Codice</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-20">Q.tà prev.</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-20">Q.tà fatta</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-14">UoM</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Da</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">A</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-20">Stato</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-if="picking.moves.length === 0">
                    <td colspan="8" class="text-center py-8 text-gray-400">Nessuna operation</td>
                  </tr>
                  <tr v-for="m in picking.moves" :key="m.id" class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate" :title="m.product_name">{{ m.product_name }}</td>
                    <td class="px-4 py-2.5 font-mono text-gray-600">{{ m.product_code || '—' }}</td>
                    <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ m.product_qty }}</td>
                    <td class="px-4 py-2.5 text-right font-mono" :class="m.quantity_done > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'">
                      {{ m.quantity_done }}
                    </td>
                    <td class="px-4 py-2.5 text-gray-500">{{ m.uom }}</td>
                    <td class="px-4 py-2.5 text-gray-600 max-w-[140px] truncate" :title="m.location_src">{{ m.location_src }}</td>
                    <td class="px-4 py-2.5 text-gray-600 max-w-[140px] truncate" :title="m.location_dest">{{ m.location_dest }}</td>
                    <td class="px-4 py-2.5">
                      <span :class="['text-xs font-semibold px-1.5 py-0.5 rounded', moveStateBadge(m.state)]">{{ m.state }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Tab: Detailed Operations (stock.move.line) -->
            <div v-else class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-100">
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Prodotto</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Codice</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Lotto</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-20">Q.tà riservata</th>
                    <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-20">Q.tà fatta</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide w-14">UoM</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Da</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">A</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-if="picking.detailed.length === 0">
                    <td colspan="8" class="text-center py-8 text-gray-400">Nessuna detailed operation</td>
                  </tr>
                  <tr v-for="ml in picking.detailed" :key="ml.id" class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate" :title="ml.product_name">{{ ml.product_name }}</td>
                    <td class="px-4 py-2.5 font-mono text-gray-600">{{ ml.product_code || '—' }}</td>
                    <td class="px-4 py-2.5 font-mono text-indigo-700 font-semibold">{{ ml.lot_name || '—' }}</td>
                    <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ ml.product_qty }}</td>
                    <td class="px-4 py-2.5 text-right font-mono" :class="ml.qty_done > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'">
                      {{ ml.qty_done }}
                    </td>
                    <td class="px-4 py-2.5 text-gray-500">{{ ml.uom }}</td>
                    <td class="px-4 py-2.5 text-gray-600 max-w-[140px] truncate" :title="ml.location_src">{{ ml.location_src }}</td>
                    <td class="px-4 py-2.5 text-gray-600 max-w-[140px] truncate" :title="ml.location_dest">{{ ml.location_dest }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </template>
    </template>

    <!-- ================================================================
         VISTA: RIGHE BATCH — ddt.itt.job (livello 2)
    ================================================================ -->
    <template v-else-if="view === 'rows'">

      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 mb-6 text-sm">
        <button @click="goTo('batches')" class="text-indigo-600 hover:text-indigo-800 font-medium">Jobs</button>
        <span class="text-gray-300">/</span>
        <span class="text-gray-700 font-medium truncate max-w-xs">{{ selectedBatch?.name }}</span>
      </div>

      <!-- Header batch + azione -->
      <div class="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ selectedBatch?.name }}</h2>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ selectedBatch?.file_name }}
            <span class="mx-1.5 text-gray-300">·</span>
            {{ formatDate(selectedBatch?.import_date) }}
          </p>
          <!-- Stats -->
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {{ selectedBatch?.total_records }} totali
            </span>
            <span v-if="selectedBatch?.imported_records > 0"
              class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {{ selectedBatch?.imported_records }} importati
            </span>
            <span v-if="selectedBatch?.processed_records > 0"
              class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              {{ selectedBatch?.processed_records }} elaborati
            </span>
            <span v-if="selectedBatch?.error_records > 0"
              class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              {{ selectedBatch?.error_records }} errori
            </span>
          </div>
        </div>

        <!-- Tasto Prepara Job V1 -->
        <button
          @click="runAction"
          :disabled="runningAction || !selectedBatch?.imported_records"
          class="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all
                 disabled:opacity-40 disabled:cursor-not-allowed">
          <svg v-if="runningAction" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ runningAction ? 'Esecuzione...' : 'Prepara Job V1 - Loris' }}
        </button>
      </div>

      <!-- Filtri stato -->
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="text-xs text-gray-500 font-medium self-center mr-1">Filtro:</span>
        <button v-for="f in stateFilters" :key="f.key"
          @click="rowFilter = f.key"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            rowFilter === f.key ? f.activeClass : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300']">
          {{ f.label }}
          <span class="ml-1 opacity-70">({{ countByState(f.key) }})</span>
        </button>
      </div>

      <!-- Loading righe -->
      <div v-if="loadingRows" class="card flex items-center justify-center py-12 gap-3 text-gray-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Caricamento righe...
      </div>

      <!-- Tabella righe ddt.itt.job -->
      <div v-else class="card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Stato</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">N. OT</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Materiale</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Unità mag. prov.</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Prodotto Odoo</th>
                <th class="text-right px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Qtà prev.</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">UMA</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Ub. prov.</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Pos.</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Partita</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">S</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">N. Fabbis.</th>
                <th class="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Esito</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="filteredRows.length === 0">
                <td colspan="13" class="text-center py-12 text-gray-400 text-sm">
                  Nessuna riga per il filtro selezionato
                </td>
              </tr>
              <tr v-for="row in filteredRows" :key="row.id"
                :class="['transition-colors', rowBgClass(row.state)]">
                <td class="px-4 py-2.5">
                  <span :class="['inline-block text-xs font-semibold px-2 py-0.5 rounded-full', stateBadgeClass(row.state)]">
                    {{ stateLabel(row.state) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 font-mono text-gray-700">{{ row.numero_ot || '—' }}</td>
                <td class="px-4 py-2.5 font-mono font-semibold text-gray-900">{{ row.materiale }}</td>
                <td class="px-4 py-2.5 font-mono text-gray-700">
                  {{ row.unita_magazzino_prov || '—' }}
                  <span v-if="!row.lot_found && row.unita_magazzino_prov"
                    class="ml-1 text-amber-500" title="Lotto non trovato in Odoo">⚠</span>
                </td>
                <td class="px-4 py-2.5 text-gray-600 max-w-[180px] truncate" :title="row.product_name">
                  {{ row.product_name || '—' }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ row.qta_prev_prov }}</td>
                <td class="px-4 py-2.5 text-gray-500">{{ row.uma || '—' }}</td>
                <td class="px-4 py-2.5 text-gray-600">{{ row.ub_prov || '—' }}</td>
                <td class="px-4 py-2.5 font-mono text-gray-500">{{ row.pos || '—' }}</td>
                <td class="px-4 py-2.5 font-mono text-gray-500">{{ row.partita || '—' }}</td>
                <td class="px-4 py-2.5 text-gray-500">{{ row.s || '—' }}</td>
                <td class="px-4 py-2.5 font-mono text-gray-500">{{ row.n_fabbis || '—' }}</td>
                <td class="px-4 py-2.5 text-gray-500 max-w-xs truncate" :title="row.error_message">
                  {{ row.error_message || (row.state === 'elaborato' ? '✓ Elaborato' : '—') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-5 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {{ filteredRows.length }} righe visualizzate · {{ rows.length }} totali nel batch
        </div>
      </div>

    </template>

    <!-- ================================================================
         VISTA: LISTA BATCH — ddt.itt.job.batch (livello 1)
    ================================================================ -->
    <template v-else>

      <!-- Header + upload -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Jobs</h1>
            <p class="text-sm text-gray-500">Importazione e gestione Job da Excel (import.excel.job.wizard)</p>
          </div>
        </div>

        <!-- Wizard upload -->
        <div class="shrink-0 space-y-1.5">
          <input ref="xlsxInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange"/>
          <button @click="$refs.xlsxInput.click()" :disabled="importing"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                   bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="importing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            {{ importing ? importStep : 'Carica Excel Job' }}
          </button>
          <div v-if="importing" class="bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div class="h-full bg-indigo-500 transition-all duration-300 rounded-full"
              :style="{ width: importProgress + '%' }"/>
          </div>
          <p v-if="importError" class="text-xs text-red-600 max-w-xs">{{ importError }}</p>
        </div>
      </div>

      <!-- Info formato -->
      <div class="mb-5 bg-indigo-50 border border-indigo-200 rounded-xl overflow-hidden">
        <!-- Header banda -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-indigo-100 border-b border-indigo-200">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="text-xs font-bold text-indigo-800 uppercase tracking-wide">Formato Excel atteso</span>
            <span class="text-xs text-indigo-500">— riga 1 intestazione, dati da riga 2</span>
          </div>
          <a href="/job_template.xlsx" download="job_template.xlsx"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                   bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Scarica template
          </a>
        </div>
        <!-- Griglia colonne -->
        <div class="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1.5">
          <div v-for="col in templateColumns" :key="col.index" class="flex items-baseline gap-1.5">
            <span class="shrink-0 font-mono text-[10px] font-bold text-indigo-400 w-8">C.{{ col.index }}</span>
            <span class="text-xs text-indigo-800 font-medium truncate">{{ col.label }}</span>
            <span v-if="col.required" class="shrink-0 text-red-500 text-[10px] font-bold">*</span>
          </div>
        </div>
        <p class="px-4 pb-2.5 text-[10px] text-indigo-400">* campi obbligatori per l'importazione</p>
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
        <p class="text-sm mt-1">Carica un file Excel per creare il primo batch Job</p>
      </div>

      <!-- Tabella batch (ddt.itt.job.batch) -->
      <div v-else class="card !p-0 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Data import</th>
              <th class="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Nome / File</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Totali</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Importati</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Elaborati</th>
              <th class="text-right px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Errori</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="batch in batches" :key="batch.id"
              @click="openBatch(batch)"
              class="hover:bg-indigo-50/50 cursor-pointer transition-colors group">
              <td class="px-5 py-3.5 text-sm text-gray-600 font-mono whitespace-nowrap">
                {{ formatDate(batch.import_date) }}
              </td>
              <td class="px-5 py-3.5">
                <p class="font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">
                  {{ batch.name || batch.file_name || ('Batch #' + batch.id) }}
                </p>
                <p v-if="batch.file_name && batch.file_name !== batch.name"
                  class="text-xs text-gray-400 font-mono mt-0.5">
                  {{ batch.file_name }}
                </p>
              </td>
              <td class="px-5 py-3.5 text-right font-semibold text-gray-700">{{ batch.total_records }}</td>
              <td class="px-5 py-3.5 text-right">
                <span v-if="batch.imported_records > 0" class="text-blue-700 font-semibold">{{ batch.imported_records }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <span v-if="batch.processed_records > 0" class="text-green-700 font-semibold">{{ batch.processed_records }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <span v-if="batch.error_records > 0" class="text-red-600 font-semibold">{{ batch.error_records }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <svg class="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors ml-auto"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'
import { useAuthStore } from '@/stores/auth.js'
import {
  importJobExcel, fetchJobBatches, fetchJobRows,
  runJobAction, fetchJobPicking
} from '@/api/odoo-service.js'

const auth = useAuthStore()

// ---- Template colonne Excel ----
const templateColumns = [
  { index: 0,  label: 'Numero OT',        required: false },
  { index: 1,  label: 'Pos.',              required: false },
  { index: 2,  label: 'Materiale',         required: true  },
  { index: 3,  label: 'Partita',           required: false },
  { index: 4,  label: 'S',                 required: false },
  { index: 5,  label: 'Cat',               required: false },
  { index: 6,  label: 'Ub. prov.',         required: false },
  { index: 7,  label: 'Qtà prev. prov.',   required: false },
  { index: 8,  label: 'UMA',               required: false },
  { index: 9,  label: 'Unità mag. prov.',  required: true  },
  { index: 10, label: 'N. fabbis.',        required: false },
  { index: 11, label: 'Ubic. dest.',       required: false },
]

// ---- Navigazione ----
const view          = ref('batches')   // 'batches' | 'rows' | 'picking'
const selectedBatch = ref(null)

function goTo(v) { view.value = v }

// ---- Toast ----
const toast = reactive({ visible: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.visible = true
  setTimeout(() => { toast.visible = false }, 5000)
}

// ---- Livello 1: Lista batch ----
const batches        = ref([])
const loadingBatches = ref(true)

onMounted(loadBatches)

async function loadBatches() {
  loadingBatches.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const result = await fetchJobBatches(uid, password)
    console.log('[Jobs] batches received:', result)
    batches.value = Array.isArray(result) ? result : []
  } catch (e) { console.error('[Jobs] loadBatches error:', e) }
  finally { loadingBatches.value = false }
}

async function openBatch(batch) {
  selectedBatch.value = batch
  rows.value = []
  rowFilter.value = 'all'
  view.value = 'rows'
  const batchId = parseInt(batch.id, 10)
  console.log('[Jobs] openBatch id:', batchId, 'name:', batch.name)
  await loadRows(batchId)
}

// ---- Upload Excel (import.excel.job.wizard) ----
const importing      = ref(false)
const importStep     = ref('')
const importProgress = ref(0)
const importError    = ref('')

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
    const wb  = XLSX.read(buffer, { type: 'array' })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    importProgress.value = 55

    // Riga 0 = intestazione, dati da riga 1
    const rows = raw.slice(1)
      .filter(r => String(r[2] ?? '').trim() !== '' && String(r[9] ?? '').trim() !== '')
      .map(r => ({
        numero_ot:            String(r[0]  ?? '').trim(),
        pos:                  String(r[1]  ?? '').trim(),
        materiale:            String(r[2]  ?? '').trim(),
        partita:              String(r[3]  ?? '').trim(),
        s:                    String(r[4]  ?? '').trim(),
        cat:                  String(r[5]  ?? '').trim(),
        ub_prov:              String(r[6]  ?? '').trim(),
        qta_prev_prov:        r[7] ?? 0,
        uma:                  String(r[8]  ?? '').trim(),
        unita_magazzino_prov: String(r[9]  ?? '').trim(),
        n_fabbis:             String(r[10] ?? '').trim(),
      }))

    if (rows.length === 0) throw new Error('Nessuna riga valida (Materiale col.2 e Unità mag.prov col.9 obbligatori)')
    importStep.value = `Invio ${rows.length} righe a Odoo...`; importProgress.value = 65

    const { uid, password } = auth.getCredentials()
    const result = await importJobExcel(uid, password, rows, file.name)
    importProgress.value = 85

    importStep.value = 'Aggiornamento storico...'; await loadBatches()
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

// ---- Livello 2: Righe batch (ddt.itt.job) ----
const rows        = ref([])
const loadingRows = ref(false)
const rowFilter   = ref('all')
const runningAction = ref(false)

const stateFilters = [
  { key: 'all',            label: 'Tutti',          activeClass: 'bg-gray-700 border-gray-700 text-white' },
  { key: 'importato',      label: 'Importato',       activeClass: 'bg-blue-100 border-blue-400 text-blue-800' },
  { key: 'in_elaborazione',label: 'In elaborazione', activeClass: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { key: 'elaborato',      label: 'Elaborato',       activeClass: 'bg-green-100 border-green-400 text-green-800' },
  { key: 'errore',         label: 'Errore',          activeClass: 'bg-red-100 border-red-400 text-red-800' },
]

const filteredRows = computed(() => {
  if (rowFilter.value === 'all') return rows.value
  return rows.value.filter(r => r.state === rowFilter.value)
})

function countByState(key) {
  if (key === 'all') return rows.value.length
  return rows.value.filter(r => r.state === key).length
}

async function loadRows(batchId) {
  loadingRows.value = true
  const id = parseInt(batchId, 10)
  console.log('[Jobs] loadRows batchId:', id)
  try {
    const { uid, password } = auth.getCredentials()
    const result = await fetchJobRows(uid, password, id)
    console.log('[Jobs] rows received:', Array.isArray(result) ? result.length : result)
    rows.value = Array.isArray(result) ? result : []
  } catch (e) { console.error('[Jobs] loadRows error:', e) }
  finally { loadingRows.value = false }
}

async function runAction() {
  if (!selectedBatch.value || runningAction.value) return
  runningAction.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const result = await runJobAction(uid, password, parseInt(selectedBatch.value.id, 10))
    showToast('✅ ' + result.message)
    // Aggiorna batch e righe
    await loadBatches()
    await loadRows(selectedBatch.value.id)
    // Ricarica il selectedBatch con i dati aggiornati
    const updated = batches.value.find(b => b.id === selectedBatch.value.id)
    if (updated) selectedBatch.value = updated
    // Vai a vedere il picking
    await loadPicking(parseInt(selectedBatch.value.id, 10))
    view.value = 'picking'
  } catch (err) {
    showToast('❌ ' + (err.message || 'Errore esecuzione azione'), 'error')
  } finally { runningAction.value = false }
}

// ---- Livello 3: Picking (stock.picking) ----
const pickings      = ref([])
const loadingPicking = ref(false)
const pickingTab    = reactive({})  // { pickingId: 'ops' | 'detail' }

async function loadPicking(batchId) {
  loadingPicking.value = true
  pickings.value = []
  try {
    const { uid, password } = auth.getCredentials()
    const result = await fetchJobPicking(uid, password, batchId)
    pickings.value = result.pickings || []
  } catch (e) {
    console.error(e)
    showToast('⚠ Picking recuperato ma con errore: ' + e.message, 'error')
  } finally { loadingPicking.value = false }
}

// ---- Helpers stile ----
function stateLabel(s) {
  return { importato:'Importato', in_elaborazione:'In elab.', elaborato:'Elaborato', errore:'Errore' }[s] || s
}
function stateBadgeClass(s) {
  return {
    importato:       'bg-blue-100 text-blue-700',
    in_elaborazione: 'bg-yellow-100 text-yellow-700',
    elaborato:       'bg-green-100 text-green-700',
    errore:          'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600'
}
function rowBgClass(s) {
  return { elaborato:'bg-green-50/40 hover:bg-green-50', errore:'bg-red-50/30 hover:bg-red-50' }[s] || 'hover:bg-gray-50'
}
function pickingStateBadge(s) {
  return { draft:'bg-gray-100 text-gray-600', confirmed:'bg-blue-100 text-blue-700',
           assigned:'bg-indigo-100 text-indigo-700', done:'bg-green-100 text-green-700',
           cancel:'bg-red-100 text-red-600' }[s] || 'bg-gray-100 text-gray-600'
}
function pickingStateLabel(s) {
  return { draft:'Bozza', confirmed:'Confermato', assigned:'Pronto', done:'Fatto', cancel:'Annullato' }[s] || s
}
function moveStateBadge(s) {
  return { draft:'bg-gray-100 text-gray-500', confirmed:'bg-blue-50 text-blue-600',
           assigned:'bg-indigo-50 text-indigo-600', done:'bg-green-50 text-green-700',
           cancel:'bg-red-50 text-red-500' }[s] || 'bg-gray-100 text-gray-500'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(1rem); }
</style>

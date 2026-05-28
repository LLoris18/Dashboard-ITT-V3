<template>
  <div class="min-h-screen text-stone-900">

    <!-- Header -->
    <div class="bg-white border-b border-stone-200 px-4 md:px-6 py-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-stone-900 tracking-tight">DDT Spedizione</h1>
          <p class="text-xs text-stone-500 mt-0.5">stock.delivery.note — Odoo 14</p>
        </div>
        <!-- Export XLSX -->
        <button @click="runExport" :disabled="exportLoading || listLoading"
          title="Esporta in Excel i DDT filtrati"
          class="flex items-center gap-2 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-sm rounded-lg transition-colors disabled:opacity-50 shrink-0">
          <svg v-if="exportLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="hidden sm:inline">{{ exportLoading ? 'Export...' : 'Export XLSX' }}</span>
        </button>
      </div>
    </div>

    <!-- From-Picking Banner -->
    <div v-if="fromPickingName" class="bg-emerald-50 border-b border-emerald-200 px-4 md:px-6 py-3">
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm text-emerald-800">
          Creazione DDT collegato alla spedizione <strong class="text-emerald-900">{{ fromPickingName }}</strong>.
          Compila il form e salva.
        </p>
        <button @click="clearFromPicking" class="ml-auto text-emerald-600 hover:text-emerald-800 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="px-4 md:px-6 py-4 space-y-4">

      <!-- KPI Cards -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <p class="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Bozze</p>
          <p class="text-2xl font-bold text-stone-800">
            <span v-if="kpiLoading" class="inline-block w-8 h-7 bg-stone-200 rounded animate-pulse"></span>
            <span v-else>{{ kpi.bozze }}</span>
          </p>
        </div>
        <div class="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <p class="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Validati oggi</p>
          <p class="text-2xl font-bold text-blue-600">
            <span v-if="kpiLoading" class="inline-block w-8 h-7 bg-stone-200 rounded animate-pulse"></span>
            <span v-else>{{ kpi.validati }}</span>
          </p>
        </div>
        <div class="bg-stone-50 rounded-xl p-4 border border-stone-200">
          <p class="text-xs text-stone-500 uppercase tracking-wider font-medium mb-1">Confermati</p>
          <p class="text-2xl font-bold text-amber-600">
            <span v-if="kpiLoading" class="inline-block w-8 h-7 bg-stone-200 rounded animate-pulse"></span>
            <span v-else>{{ kpi.daFatturare }}</span>
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-stone-50 rounded-xl border border-stone-200 p-3 space-y-2">
        <!-- Riga 1: testo + tipo DDT + date + reset -->
        <div class="flex flex-col sm:flex-row gap-2">
          <input v-model="searchText" @input="currentPage = 1" type="text" placeholder="Cerca numero DDT o destinatario..."
            class="flex-1 bg-white border border-stone-300 text-stone-900 text-sm rounded-lg px-3 py-2 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"/>

          <!-- Filtro tipo DDT -->
          <select v-model="filterTypeId" @change="currentPage = 1"
            class="bg-white border border-stone-300 text-stone-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 min-w-[140px]">
            <option :value="null">Tutti i tipi</option>
            <option v-for="t in ddtTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>

          <div class="flex items-center gap-1">
            <input v-model="dateFrom" @change="currentPage = 1" type="date"
              class="bg-white border border-stone-300 text-stone-700 text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"/>
            <span class="text-stone-400 text-xs">–</span>
            <input v-model="dateTo" @change="currentPage = 1" type="date"
              class="bg-white border border-stone-300 text-stone-700 text-xs rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"/>
          </div>

          <button @click="clearFilters" title="Cancella filtri"
            class="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors text-xs">
            Reset
          </button>
        </div>

        <!-- Riga 2: chip stato -->
        <div class="flex items-center gap-1 flex-wrap">
          <span class="text-xs text-stone-400 mr-1">Stato:</span>
          <button v-for="s in stateFilters" :key="s.value"
            @click="toggleState(s.value)"
            :class="['px-3 py-1 rounded-lg text-xs font-semibold transition-colors', activeStates.includes(s.value) ? s.activeCls : 'bg-stone-200 text-stone-600 hover:bg-stone-200']">
            {{ s.label }}
          </button>
          <span v-if="filteredList.length !== ddtList.length" class="ml-auto text-xs text-amber-400 font-medium">
            {{ filteredList.length }} / {{ ddtList.length }} DDT
          </span>
        </div>
      </div>

      <!-- Toast -->
      <div v-if="toast.show"
        :class="['fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all',
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700']">
        <svg v-if="toast.type === 'success'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <svg v-else class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ toast.message }}
      </div>

      <!-- Table -->
      <div class="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
        <div v-if="listLoading" class="p-6 space-y-2">
          <div v-for="i in 5" :key="i" class="h-10 bg-stone-200 rounded animate-pulse"></div>
        </div>

        <div v-else-if="!pagedList.length" class="p-10 text-center">
          <svg class="w-10 h-10 mx-auto text-stone-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-stone-500 text-sm">Nessun DDT trovato</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-stone-200 text-xs text-stone-500 uppercase tracking-wider">
                <th class="text-left px-4 py-3 font-medium">Numero</th>
                <th class="text-left px-4 py-3 font-medium">Data</th>
                <th class="text-left px-4 py-3 font-medium hidden md:table-cell">Destinatario</th>
                <th class="text-left px-4 py-3 font-medium hidden lg:table-cell">Tipo</th>
                <th class="text-right px-4 py-3 font-medium hidden sm:table-cell">Colli</th>
                <th class="text-right px-4 py-3 font-medium hidden sm:table-cell">Peso kg</th>
                <th class="text-center px-4 py-3 font-medium">Stato</th>
                <th class="text-right px-4 py-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100/50">
              <tr v-for="ddt in pagedList" :key="ddt.id"
                @click="openDetail(ddt.id)"
                class="hover:bg-stone-50 cursor-pointer transition-colors">
                <td class="px-4 py-3 font-mono text-stone-800 text-xs">{{ ddt.name }}</td>
                <td class="px-4 py-3 text-stone-700 whitespace-nowrap">{{ fmtDate(ddt.date) }}</td>
                <td class="px-4 py-3 text-stone-700 hidden md:table-cell max-w-[180px] truncate">{{ m2oName(ddt.partner_id) }}</td>
                <td class="px-4 py-3 text-stone-500 hidden lg:table-cell">{{ m2oName(ddt.type_id) }}</td>
                <td class="px-4 py-3 text-right text-stone-700 hidden sm:table-cell">{{ ddt.packages || '—' }}</td>
                <td class="px-4 py-3 text-right text-stone-700 hidden sm:table-cell">{{ ddt.gross_weight ? ddt.gross_weight.toFixed(1) : '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', stateBadge(ddt.state)]">
                    {{ stateLabel(ddt.state) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1" @click.stop>
                    <button @click="openDetail(ddt.id)" title="Dettaglio"
                      class="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200 rounded transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                    <button v-if="ddt.state !== 'cancel'" @click="printDDT(ddt.id, ddt.name)" title="Stampa PDF"
                      :disabled="printLoading"
                      class="p-1.5 text-stone-500 hover:text-blue-600 hover:bg-stone-200 rounded transition-colors disabled:opacity-40">
                      <svg v-if="printLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-stone-200">
          <p class="text-xs text-stone-500">{{ filteredList.length }} DDT · pagina {{ currentPage }}/{{ totalPages }}</p>
          <div class="flex items-center gap-1">
            <button @click="currentPage--" :disabled="currentPage === 1"
              class="px-2.5 py-1 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ‹
            </button>
            <template v-for="p in paginationPages" :key="p">
              <span v-if="p === '...'" class="px-1 text-stone-400 text-xs">…</span>
              <button v-else @click="currentPage = p"
                :class="['px-2.5 py-1 text-xs rounded transition-colors', p === currentPage ? 'bg-amber-500 text-slate-900 font-bold' : 'text-stone-600 bg-stone-100 hover:bg-stone-200']">
                {{ p }}
              </button>
            </template>
            <button @click="currentPage++" :disabled="currentPage === totalPages"
              class="px-2.5 py-1 text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ›
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── Slide-over ──────────────────────────────────────────────────────── -->
    <Transition name="slideover">
      <div v-if="panelOpen" class="fixed inset-0 z-40 flex">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closePanel"></div>

        <!-- Panel -->
        <div class="relative ml-auto w-full max-w-3xl bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-stone-200">

          <!-- Panel Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-white shrink-0">
            <div class="flex items-center gap-3">
              <span :class="['px-2.5 py-1 rounded text-xs font-bold', stateBadge(form.state)]">
                {{ stateLabel(form.state) }}
              </span>
              <h2 class="font-bold text-stone-900 text-base">
                {{ form.id ? form.name || 'DDT' : 'Nuovo DDT' }}
              </h2>
            </div>
            <button @click="closePanel" class="text-stone-500 hover:text-stone-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Panel Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            <!-- Sezione: Intestazione -->
            <fieldset class="space-y-3">
              <legend class="text-xs font-semibold text-stone-500 uppercase tracking-widest pb-1">Intestazione</legend>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Tipo DDT</label>
                  <select v-model="form.type_id" :disabled="!isEditable" class="form-input w-full">
                    <option :value="null">— seleziona —</option>
                    <option v-for="t in ddtTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Data <span class="text-red-500">*</span></label>
                  <input v-model="form.date" :disabled="!isEditable" type="date" class="form-input w-full"/>
                </div>

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Colli</label>
                  <input v-model.number="form.packages" :disabled="!isEditable" type="number" min="0" class="form-input w-full"/>
                </div>

                <div class="col-span-2 sm:col-span-2">
                  <label class="block text-xs text-stone-500 mb-1">Destinatario <span class="text-red-500">*</span></label>
                  <input v-model="form.partner_name" :disabled="!isEditable" list="partners-list"
                    @change="resolvePartner($event.target.value, 'partner_id', 'partner_name')"
                    placeholder="Nome partner..."
                    class="form-input w-full"/>
                  <datalist id="partners-list">
                    <option v-for="p in partners" :key="p.id" :value="p.name">{{ p.name }}</option>
                  </datalist>
                </div>

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Causale trasporto</label>
                  <select v-model="form.transport_reason_id" :disabled="!isEditable" class="form-input w-full">
                    <option :value="null">— seleziona —</option>
                    <option v-for="r in transportReasons" :key="r.id" :value="r.id">{{ r.name }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Mittente</label>
                  <input v-model="form.sender_name" :disabled="!isEditable" list="partners-list"
                    @change="resolvePartner($event.target.value, 'partner_sender_id', 'sender_name')"
                    placeholder="Nome mittente..."
                    class="form-input w-full"/>
                </div>

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Rif. Esterno</label>
                  <input v-model="form.partner_ref" :disabled="!isEditable" type="text" class="form-input w-full"/>
                </div>

                <div>
                  <label class="block text-xs text-stone-500 mb-1">Data trasporto</label>
                  <input v-model="form.transport_datetime" :disabled="!isEditable" type="datetime-local" class="form-input w-full"/>
                </div>

              </div>
            </fieldset>

            <!-- Sezione: Fisico -->
            <fieldset class="space-y-3">
              <legend class="text-xs font-semibold text-stone-500 uppercase tracking-widest pb-1">Dati fisici</legend>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-xs text-stone-500 mb-1">Peso lordo (kg)</label>
                  <input v-model.number="form.gross_weight" :disabled="!isEditable" type="number" step="0.01" min="0" class="form-input w-full"/>
                </div>
                <div>
                  <label class="block text-xs text-stone-500 mb-1">Peso netto (kg)</label>
                  <input v-model.number="form.net_weight" :disabled="!isEditable" type="number" step="0.01" min="0" class="form-input w-full"/>
                </div>
                <div>
                  <label class="block text-xs text-stone-500 mb-1">Volume</label>
                  <input v-model.number="form.volume" :disabled="!isEditable" type="number" step="0.001" min="0" class="form-input w-full"/>
                </div>
                <div>
                  <label class="block text-xs text-stone-500 mb-1">Vettore</label>
                  <input v-model="form.carrier_name" :disabled="!isEditable" list="partners-list"
                    @change="resolvePartner($event.target.value, 'carrier_id', 'carrier_name')"
                    placeholder="Vettore..."
                    class="form-input w-full"/>
                </div>
              </div>
            </fieldset>

            <!-- Sezione: Righe DDT -->
            <fieldset v-if="form.id" class="space-y-2">
              <div class="flex items-center justify-between pb-1">
                <legend class="text-xs font-semibold text-stone-500 uppercase tracking-widest">Righe DDT</legend>
              </div>
              <div v-if="linesLoading" class="space-y-2">
                <div v-for="i in 3" :key="i" class="h-8 bg-stone-50 rounded animate-pulse"></div>
              </div>
              <div v-else-if="lines.length === 0" class="text-xs text-stone-400 italic py-2">Nessuna riga</div>
              <div v-else class="overflow-x-auto rounded-lg border border-stone-200">
                <table class="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr class="bg-stone-100/60 text-stone-500 uppercase tracking-wider">
                      <th class="px-3 py-2 text-left font-medium">Prodotto</th>
                      <th class="px-3 py-2 text-right font-medium">Qtà</th>
                      <th class="px-3 py-2 text-left font-medium">UdM</th>
                      <th class="px-3 py-2 text-left font-medium hidden sm:table-cell">Lotti</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-stone-100/50">
                    <tr v-for="line in lines" :key="line.id" class="hover:bg-stone-100/60">
                      <td class="px-3 py-2 text-stone-700">{{ m2oName(line.product_id) || '—' }}</td>
                      <td class="px-3 py-2 text-right text-stone-800">{{ line.product_qty }}</td>
                      <td class="px-3 py-2 text-stone-500">{{ m2oName(line.product_uom_id) }}</td>
                      <td class="px-3 py-2 text-stone-500 hidden sm:table-cell">
                        {{ line.lot_ids && line.lot_ids.length ? line.lot_ids.join(', ') : '—' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </fieldset>

            <!-- Sezione: Picking collegato -->
            <fieldset v-if="form.id && form.picking_ids && form.picking_ids.length" class="space-y-2">
              <legend class="text-xs font-semibold text-stone-500 uppercase tracking-widest pb-1">Trasferimenti collegati</legend>
              <div class="flex flex-wrap gap-2">
                <span v-for="pid in form.picking_ids" :key="pid"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-200 rounded text-xs text-stone-600 font-mono">
                  <svg class="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  ID: {{ pid }}
                </span>
              </div>
            </fieldset>

            <!-- Sezione: Note -->
            <fieldset class="space-y-2">
              <legend class="text-xs font-semibold text-stone-500 uppercase tracking-widest pb-1">Note</legend>
              <textarea v-model="form.note" :disabled="!isEditable" rows="3"
                placeholder="Note interne..."
                class="form-input w-full resize-none text-sm leading-relaxed"></textarea>
            </fieldset>

          </div>

          <!-- Panel Footer: Actions -->
          <div class="px-5 py-4 border-t border-stone-200 bg-white shrink-0">
            <div v-if="formError" class="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {{ formError }}
            </div>

            <div class="flex items-center gap-2 flex-wrap">

              <!-- Salva (per bozze / nuovo) -->
              <button v-if="!form.id || form.state === 'draft'"
                @click="saveDDT" :disabled="formLoading"
                class="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                <svg v-if="formLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                {{ form.id ? 'Salva Bozza' : 'Crea Bozza' }}
              </button>

              <!-- Valida / Conferma -->
              <button v-if="form.id && form.state === 'draft'"
                @click="doConfirm" :disabled="formLoading"
                class="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                Valida DDT
              </button>

              <!-- Completa -->
              <button v-if="form.id && form.state === 'confirm'"
                @click="doDone" :disabled="formLoading"
                class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                Completa
              </button>

              <!-- Ripristina bozza -->
              <button v-if="form.id && (form.state === 'cancel' || form.state === 'confirm')"
                @click="doDraft" :disabled="formLoading"
                class="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                Ripristina Bozza
              </button>

              <!-- Annulla -->
              <button v-if="form.id && form.state !== 'cancel' && form.state !== 'done'"
                @click="doCancel" :disabled="formLoading"
                class="flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50">
                Annulla
              </button>

              <!-- Stampa PDF -->
              <button v-if="form.id && form.state !== 'cancel'"
                @click="printDDT(form.id, form.name)"
                :disabled="printLoading"
                class="ml-auto flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm rounded-lg transition-colors disabled:opacity-50">
                <svg v-if="printLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                PDF
              </button>

            </div>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import {
  fetchDDTList, fetchDDT, fetchDDTLines, fetchDDTKpi,
  createDDT, updateDDT,
  confirmDDT, cancelDDT, doneDDT, draftDDT,
  fetchDDTTypes, fetchTransportReasons, fetchPartners,
  fetchPickingForDDT, linkPickingToDDT,
  printDDTViaBrowser, exportDDTList,
} from '@/api/stockDeliveryNote.js'

const auth  = useAuthStore()
const route = useRoute()

const PAGE_SIZE  = 20

// ─── State ────────────────────────────────────────────────────────────────────

const ddtList       = ref([])
const listLoading   = ref(false)
const kpi           = ref({ bozze: 0, validati: 0, daFatturare: 0 })
const kpiLoading    = ref(false)

const ddtTypes         = ref([])
const transportReasons = ref([])
const partners         = ref([])

const searchText   = ref('')
const activeStates = ref([])
const filterTypeId = ref(null)
const dateFrom     = ref('')
const dateTo       = ref('')
const currentPage  = ref(1)
const exportLoading = ref(false)

const panelOpen   = ref(false)
const formLoading = ref(false)
const formError   = ref('')
const linesLoading = ref(false)
const lines       = ref([])

const toast = ref({ show: false, type: 'success', message: '' })

// from-picking flow
const fromPickingId   = ref(null)
const fromPickingName = ref('')

// ─── Form ────────────────────────────────────────────────────────────────────

const EMPTY_FORM = () => ({
  id:                   null,
  name:                 '',
  state:                'draft',
  date:                 new Date().toISOString().substring(0, 10),
  type_id:              null,
  transport_reason_id:  null,
  transport_datetime:   '',
  partner_id:           null,
  partner_name:         '',
  partner_sender_id:    null,
  sender_name:          '',
  partner_ref:          '',
  carrier_id:           null,
  carrier_name:         '',
  packages:             0,
  gross_weight:         0,
  net_weight:           0,
  volume:               0,
  note:                 '',
  picking_ids:          [],
})

const form = ref(EMPTY_FORM())

const isEditable = computed(() =>
  !form.value.id || form.value.state === 'draft' || form.value.state === 'confirm'
)

// ─── Filters / Pagination ────────────────────────────────────────────────────

const stateFilters = [
  { value: 'draft',    label: 'Bozza',    activeCls: 'bg-stone-600 text-white' },
  { value: 'confirm',  label: 'Validato', activeCls: 'bg-blue-600 text-white' },
  { value: 'invoiced', label: 'Fatturato', activeCls: 'bg-violet-600 text-white' },
  { value: 'done',     label: 'Completato', activeCls: 'bg-emerald-600 text-white' },
  { value: 'cancel',   label: 'Annullato', activeCls: 'bg-stone-200 text-stone-600' },
]

function toggleState(val) {
  const idx = activeStates.value.indexOf(val)
  if (idx >= 0) activeStates.value.splice(idx, 1)
  else activeStates.value.push(val)
  currentPage.value = 1
}

function clearFilters() {
  searchText.value   = ''
  activeStates.value = []
  filterTypeId.value = null
  dateFrom.value     = ''
  dateTo.value       = ''
  currentPage.value  = 1
}

const filteredList = computed(() => {
  let list = ddtList.value
  const q = searchText.value.trim().toLowerCase()
  if (q) list = list.filter(d =>
    (d.name || '').toLowerCase().includes(q) ||
    m2oName(d.partner_id).toLowerCase().includes(q)
  )
  if (activeStates.value.length) list = list.filter(d => activeStates.value.includes(d.state))
  if (filterTypeId.value) list = list.filter(d => {
    const tid = Array.isArray(d.type_id) ? d.type_id[0] : d.type_id
    return tid === filterTypeId.value
  })
  if (dateFrom.value) list = list.filter(d => d.date && d.date >= dateFrom.value)
  if (dateTo.value)   list = list.filter(d => d.date && d.date <= dateTo.value)
  return list
})

const totalPages   = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))
const pagedList    = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(start, start + PAGE_SIZE)
})

const paginationPages = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function m2oName(val) {
  if (!val) return ''
  if (Array.isArray(val)) return val[1] || ''
  return String(val)
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function stateBadge(s) {
  return {
    draft:    'bg-stone-100 text-stone-600',
    confirm:  'bg-blue-50 text-blue-700 border border-blue-200',
    invoiced: 'bg-violet-50 text-violet-700 border border-violet-200',
    done:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cancel:   'bg-stone-100 text-stone-400',
  }[s] || 'bg-stone-100 text-stone-500'
}

function stateLabel(s) {
  return { draft: 'Bozza', confirm: 'Validato', invoiced: 'Fatturato', done: 'Completato', cancel: 'Annullato' }[s] || s
}

function resolvePartner(name, idField, nameField) {
  const match = partners.value.find(p => p.name === name)
  if (match) form.value[idField] = match.id
  else form.value[idField] = null
}

function showToast(message, type = 'success') {
  toast.value = { show: true, type, message }
  setTimeout(() => { toast.value.show = false }, 3500)
}

const printLoading = ref(false)

async function printDDT(id, name) {
  if (printLoading.value) return
  printLoading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    await printDDTViaBrowser(uid, password, id, name)
  } catch (e) {
    showToast('Errore stampa PDF: ' + (e.message || e), 'error')
  } finally {
    printLoading.value = false
  }
}

async function runExport() {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    // Esporta solo i record attualmente visibili (filtri client-side applicati)
    const ids = filteredList.value.map(d => d.id)
    await exportDDTList(uid, password, ids)
    showToast(`Export completato — ${ids.length} DDT esportati`)
  } catch (e) {
    showToast('Errore export: ' + (e.message || e), 'error')
  } finally {
    exportLoading.value = false
  }
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadList() {
  const { uid, password } = auth.getCredentials()
  listLoading.value = true
  try {
    ddtList.value = await fetchDDTList(uid, password)
  } catch (e) {
    showToast('Errore nel caricamento DDT: ' + (e.message || e), 'error')
  } finally {
    listLoading.value = false
  }
}

async function loadKpi() {
  const { uid, password } = auth.getCredentials()
  kpiLoading.value = true
  try {
    kpi.value = await fetchDDTKpi(uid, password)
  } catch {
    // silently fail
  } finally {
    kpiLoading.value = false
  }
}

async function loadMeta() {
  const { uid, password } = auth.getCredentials()
  const [types, reasons, pts] = await Promise.all([
    fetchDDTTypes(uid, password).catch(() => []),
    fetchTransportReasons(uid, password).catch(() => []),
    fetchPartners(uid, password).catch(() => []),
  ])
  ddtTypes.value         = types
  transportReasons.value = reasons
  partners.value         = pts
}

// ─── Panel open/close ────────────────────────────────────────────────────────

/**
 * Apre il pannello di creazione DDT pre-compilato con i dati della stock.picking.
 * Chiamato quando si arriva da ClfProduzioneView dopo "Prepara Spedizione".
 */
async function openCreateFromPicking(pickingId) {
  form.value      = EMPTY_FORM()
  lines.value     = []
  formError.value = ''
  panelOpen.value = true

  try {
    const { uid, password } = auth.getCredentials()
    const picking = await fetchPickingForDDT(uid, password, pickingId)
    if (!picking) return

    // Pre-compila i campi DDT dai dati della picking
    if (Array.isArray(picking.partner_id) && picking.partner_id[0]) {
      form.value.partner_id   = picking.partner_id[0]
      form.value.partner_name = picking.partner_id[1] || ''
    }
    if (picking.scheduled_date) {
      const dateStr = picking.scheduled_date.substring(0, 10)
      form.value.date = dateStr
      form.value.transport_datetime = picking.scheduled_date.substring(0, 16).replace(' ', 'T')
    }
    // Metti il nome picking come rif. esterno (utile per tracciabilità)
    if (picking.name) {
      form.value.partner_ref = picking.name
    }
  } catch (e) {
    formError.value = 'Avviso: impossibile leggere i dati della spedizione (' + (e.message || e) + '). Compilare manualmente.'
  }
}

async function openDetail(id) {
  formError.value  = ''
  linesLoading.value = true
  panelOpen.value  = true
  form.value = EMPTY_FORM()
  lines.value = []
  try {
    const { uid, password } = auth.getCredentials()
    const ddt = await fetchDDT(uid, password, id)
    if (!ddt) return

    form.value.id                   = ddt.id
    form.value.name                 = ddt.name
    form.value.state                = ddt.state
    form.value.date                 = ddt.date || ''
    form.value.type_id              = Array.isArray(ddt.type_id) ? ddt.type_id[0] : ddt.type_id
    form.value.transport_reason_id  = Array.isArray(ddt.transport_reason_id) ? ddt.transport_reason_id[0] : ddt.transport_reason_id
    form.value.transport_datetime   = ddt.transport_datetime ? ddt.transport_datetime.replace(' ', 'T').substring(0, 16) : ''
    form.value.partner_id           = Array.isArray(ddt.partner_id) ? ddt.partner_id[0] : ddt.partner_id
    form.value.partner_name         = m2oName(ddt.partner_id)
    form.value.partner_sender_id    = Array.isArray(ddt.partner_sender_id) ? ddt.partner_sender_id[0] : ddt.partner_sender_id
    form.value.sender_name          = m2oName(ddt.partner_sender_id)
    form.value.partner_ref          = ddt.partner_ref || ''
    form.value.carrier_id           = Array.isArray(ddt.carrier_id) ? ddt.carrier_id[0] : ddt.carrier_id
    form.value.carrier_name         = m2oName(ddt.carrier_id)
    form.value.packages             = ddt.packages || 0
    form.value.gross_weight         = ddt.gross_weight || 0
    form.value.net_weight           = ddt.net_weight || 0
    form.value.volume               = ddt.volume || 0
    form.value.note                 = ddt.note || ''
    form.value.picking_ids          = ddt.picking_ids || []

    if (ddt.line_ids && ddt.line_ids.length) {
      lines.value = await fetchDDTLines(uid, password, ddt.line_ids)
    }
  } catch (e) {
    formError.value = 'Errore nel caricamento: ' + (e.message || e)
  } finally {
    linesLoading.value = false
  }
}

function closePanel() {
  panelOpen.value = false
  formError.value = ''
}

// ─── From-picking flow ───────────────────────────────────────────────────────

function clearFromPicking() {
  fromPickingId.value   = null
  fromPickingName.value = ''
}

// ─── CRUD / Workflow ─────────────────────────────────────────────────────────

async function saveDDT() {
  formError.value = ''
  if (!form.value.date)        { formError.value = 'La data è obbligatoria.'; return }
  if (!form.value.partner_id)  { formError.value = 'Il destinatario è obbligatorio.'; return }

  formLoading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const data = {
      date:                 form.value.date,
      type_id:              form.value.type_id,
      transport_reason_id:  form.value.transport_reason_id,
      transport_datetime:   form.value.transport_datetime ? form.value.transport_datetime.replace('T', ' ') : false,
      partner_id:           form.value.partner_id,
      partner_sender_id:    form.value.partner_sender_id,
      partner_ref:          form.value.partner_ref,
      carrier_id:           form.value.carrier_id,
      packages:             form.value.packages,
      gross_weight:         form.value.gross_weight,
      net_weight:           form.value.net_weight,
      volume:               form.value.volume,
      note:                 form.value.note,
    }

    if (!form.value.id) {
      // Crea DDT
      const newId = await createDDT(uid, password, data)
      form.value.id    = newId
      form.value.state = 'draft'

      // Collega la picking al DDT appena creato scrivendo delivery_note_ids sulla picking
      if (fromPickingId.value) {
        try {
          await linkPickingToDDT(uid, password, fromPickingId.value, newId)
          form.value.picking_ids = [fromPickingId.value]
        } catch (e) {
          // non bloccare: il DDT è stato creato, solo il link è fallito
          showToast('DDT creato ma collegamento picking fallito: ' + (e.message || e), 'error')
        }
        clearFromPicking()
      }

      showToast('DDT creato con successo e collegato alla spedizione')
    } else {
      await updateDDT(uid, password, form.value.id, data)
      showToast('DDT aggiornato')
    }

    await Promise.all([loadList(), loadKpi()])
  } catch (e) {
    formError.value = 'Errore nel salvataggio: ' + (e.message || e)
  } finally {
    formLoading.value = false
  }
}

async function doConfirm() {
  if (!form.value.id) return
  if (!confirm('Validare questo DDT?')) return
  formLoading.value = true
  formError.value   = ''
  try {
    const { uid, password } = auth.getCredentials()
    await confirmDDT(uid, password, form.value.id)
    form.value.state = 'confirm'
    showToast('DDT validato')
    await Promise.all([loadList(), loadKpi()])
  } catch (e) {
    formError.value = 'Errore nella conferma: ' + (e.message || e)
  } finally {
    formLoading.value = false
  }
}

async function doDone() {
  if (!form.value.id) return
  if (!confirm('Completare questo DDT?')) return
  formLoading.value = true
  formError.value   = ''
  try {
    const { uid, password } = auth.getCredentials()
    await doneDDT(uid, password, form.value.id)
    form.value.state = 'done'
    showToast('DDT completato')
    await Promise.all([loadList(), loadKpi()])
  } catch (e) {
    formError.value = 'Errore: ' + (e.message || e)
  } finally {
    formLoading.value = false
  }
}

async function doCancel() {
  if (!form.value.id) return
  if (!confirm('Annullare questo DDT? L\'operazione non è facilmente reversibile.')) return
  formLoading.value = true
  formError.value   = ''
  try {
    const { uid, password } = auth.getCredentials()
    await cancelDDT(uid, password, form.value.id)
    form.value.state = 'cancel'
    showToast('DDT annullato', 'error')
    await Promise.all([loadList(), loadKpi()])
  } catch (e) {
    formError.value = 'Errore nell\'annullamento: ' + (e.message || e)
  } finally {
    formLoading.value = false
  }
}

async function doDraft() {
  if (!form.value.id) return
  formLoading.value = true
  formError.value   = ''
  try {
    const { uid, password } = auth.getCredentials()
    await draftDDT(uid, password, form.value.id)
    form.value.state = 'draft'
    showToast('DDT ripristinato a bozza')
    await Promise.all([loadList(), loadKpi()])
  } catch (e) {
    formError.value = 'Errore: ' + (e.message || e)
  } finally {
    formLoading.value = false
  }
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

function onKeydown(e) {
  if (e.key === 'Escape' && panelOpen.value) closePanel()
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await Promise.all([loadList(), loadKpi(), loadMeta()])

  // Flusso da ClfProduzioneView: apre il form DDT pre-compilato dalla picking
  if (route.query.fromPickingId) {
    fromPickingId.value   = Number(route.query.fromPickingId)
    fromPickingName.value = route.query.fromPickingName || `Picking #${fromPickingId.value}`
    await openCreateFromPicking(fromPickingId.value)
  }
})

watch(filteredList, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value || 1
})
</script>

<style scoped>
.form-input {
  @apply bg-white border border-stone-200 text-stone-900 text-sm rounded-lg px-3 py-2
         focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-500
         disabled:opacity-50 disabled:cursor-not-allowed transition-colors
         placeholder-stone-400;
}

select.form-input option {
  background-color: #ffffff;
  color: #1a1714;
}

.slideover-enter-active,
.slideover-leave-active {
  transition: opacity 0.2s ease;
}
.slideover-enter-active .relative,
.slideover-leave-active .relative {
  transition: transform 0.25s ease;
}
.slideover-enter-from {
  opacity: 0;
}
.slideover-enter-from .relative {
  transform: translateX(100%);
}
.slideover-leave-to {
  opacity: 0;
}
.slideover-leave-to .relative {
  transform: translateX(100%);
}
</style>

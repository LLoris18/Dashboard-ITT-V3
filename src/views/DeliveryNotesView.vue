<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">

    <!-- ── Toast ─────────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast.visible"
        :class="['fixed top-5 right-5 z-[60] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm pointer-events-auto',
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600']">
        <span>{{ toast.message }}</span>
        <button @click="toast.visible = false" class="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </Transition>

    <!-- ── Page header ────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0" style="background-color:#1A1714;">
          <svg class="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;height:18px">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight leading-tight">Bolle Editabili</h1>
          <p class="text-xs text-slate-400 leading-tight">Documenti interni · ITT Motion Technologies</p>
        </div>
      </div>
      <button @click="openCreatePanel"
        class="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shrink-0" style="background-color:#1A1714;" onmouseover="this.style.backgroundColor='#2D2A25'" onmouseout="this.style.backgroundColor='#1A1714'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
        </svg>
        Nuova Bolla
      </button>
    </div>

    <!-- ── Stats bar ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-5">
      <button v-for="stat in stats" :key="stat.label"
        @click="toggleStateFilter(stat.state)"
        :class="['bg-white rounded-xl border transition-all px-3.5 py-3 flex items-center gap-2.5 text-left',
          filters.state === stat.state && stat.state
            ? 'border-slate-400 shadow-sm ring-1 ring-slate-200'
            : 'border-slate-200 hover:border-slate-300']">
        <span :class="['w-2.5 h-2.5 rounded-full shrink-0', stat.dot]"></span>
        <div class="min-w-0">
          <div class="text-lg font-bold text-slate-900 leading-none tabular-nums">{{ stat.count }}</div>
          <div class="text-xs text-slate-500 mt-0.5 truncate">{{ stat.label }}</div>
        </div>
      </button>
    </div>

    <!-- ── Filters ────────────────────────────────────────────────────── -->
    <div class="bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4 flex flex-wrap items-center gap-2.5">

      <!-- Search -->
      <div class="relative flex-1 min-w-44">
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
        </svg>
        <input v-model="filters.search" type="text" placeholder="Numero, destinatario, riferimento…"
          class="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors"/>
      </div>

      <!-- Causale -->
      <select v-model="filters.type_id"
        class="py-1.5 pl-3 pr-7 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 bg-white cursor-pointer">
        <option value="">Tutte le causali</option>
        <option v-for="t in noteTypes" :key="t.id" :value="t.id">{{ t.code }}</option>
      </select>

      <!-- State chips -->
      <div class="flex items-center gap-1">
        <button v-for="s in stateOptions" :key="s.value"
          @click="toggleStateFilter(s.value)"
          :class="['px-2.5 py-1 rounded-md text-xs font-semibold border transition-all',
            filters.state === s.value ? s.activeClass : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300']">
          {{ s.label }}
        </button>
      </div>

      <!-- Date range -->
      <div class="flex items-center gap-1.5">
        <input v-model="filters.date_from" type="date"
          class="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-slate-600"/>
        <span class="text-slate-300 text-xs">—</span>
        <input v-model="filters.date_to" type="date"
          class="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 text-slate-600"/>
      </div>

      <!-- Clear -->
      <button v-if="hasActiveFilters" @click="clearFilters"
        class="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
        ✕ Cancella
      </button>

      <!-- Refresh -->
      <button @click="loadNotes" :disabled="loading"
        class="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
        <svg :class="['w-4 h-4', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
    </div>

    <!-- ── Notes table ────────────────────────────────────────────────── -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/80">
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Numero</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Data</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Causale</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Destinatario</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Rif. Est.</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Colli</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Stato</th>
          </tr>
        </thead>
        <tbody>

          <!-- Loading skeletons -->
          <template v-if="loading">
            <tr v-for="i in 6" :key="i" class="border-b border-slate-100 animate-pulse">
              <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-28"></div></td>
              <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-20"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-slate-200 rounded w-12"></div></td>
              <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-44"></div></td>
              <td class="px-4 py-3 hidden sm:table-cell"><div class="h-3.5 bg-slate-200 rounded w-16"></div></td>
              <td class="px-4 py-3 hidden md:table-cell text-center"><div class="h-3.5 bg-slate-200 rounded w-6 mx-auto"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-slate-200 rounded-full w-20"></div></td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="!filteredNotes.length">
            <td colspan="7" class="px-4 py-16 text-center">
              <svg class="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-slate-400 font-medium text-sm">Nessuna bolla trovata</p>
              <p class="text-slate-300 text-xs mt-1">Modifica i filtri oppure crea una nuova bolla</p>
            </td>
          </tr>

          <!-- Rows -->
          <tr v-else v-for="note in filteredNotes" :key="note.id"
            @click="openEditPanel(note.id)"
            class="border-b border-slate-100 last:border-0 hover:bg-amber-50/50 cursor-pointer transition-colors group">
            <td class="px-4 py-3">
              <span class="font-mono font-semibold text-slate-800 text-xs tracking-tight">{{ note.name || '—' }}</span>
            </td>
            <td class="px-4 py-3 text-slate-500 text-xs tabular-nums whitespace-nowrap">{{ formatDate(note.date) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wide" style="background-color:#1A1714;color:#E5E0D8;">
                {{ typeCode(note.type_id) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-700 text-xs truncate max-w-[200px]">{{ note.destinatario_id ? note.destinatario_id[1] : '—' }}</td>
            <td class="px-4 py-3 font-mono text-slate-500 text-xs hidden sm:table-cell">{{ note.riferimento_esterno || '—' }}</td>
            <td class="px-4 py-3 text-center text-slate-600 text-xs tabular-nums hidden md:table-cell">{{ note.colli || 0 }}</td>
            <td class="px-4 py-3">
              <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap', stateBadgeClass(note.state)]">
                {{ stateLabel(note.state) }}
              </span>
            </td>
          </tr>

        </tbody>
      </table>

      <!-- Count footer -->
      <div v-if="!loading && filteredNotes.length" class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <p class="text-xs text-slate-400">{{ filteredNotes.length }} bolla{{ filteredNotes.length !== 1 ? 'e' : '' }}</p>
      </div>
    </div>

  </div>

  <!-- ── Backdrop ───────────────────────────────────────────────────────────── -->
  <Transition name="backdrop">
    <div v-if="panelOpen" class="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]" @click="tryClosePanel"/>
  </Transition>

  <!-- ── Slide-over panel ───────────────────────────────────────────────────── -->
  <Transition name="slideover">
    <div v-if="panelOpen"
      class="fixed inset-y-0 right-0 w-full sm:max-w-3xl bg-white shadow-2xl z-50 flex flex-col"
      @keydown.esc.prevent="tryClosePanel" tabindex="-1">

      <!-- Panel header -->
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3 shrink-0">
        <div class="flex-1 flex items-center gap-2.5 min-w-0">
          <span v-if="form.state" :class="['text-xs font-bold px-2.5 py-1 rounded-full border shrink-0', stateBadgeClass(form.state)]">
            {{ stateLabel(form.state) }}
          </span>
          <h2 class="font-bold text-slate-900 text-base truncate">
            {{ panelMode === 'create' ? 'Nuova Bolla' : (form.name || 'Bolla') }}
          </h2>
        </div>
        <button @click="tryClosePanel"
          class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Panel body -->
      <div class="flex-1 overflow-y-auto">

        <!-- Loading detail -->
        <div v-if="loadingDetail" class="flex items-center justify-center py-24 gap-3 text-slate-400">
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="text-sm">Caricamento bolla...</span>
        </div>

        <div v-else class="px-6 py-5 space-y-5">

          <!-- ── Header fields ────────────────────────────────────────── -->
          <div>
            <h3 class="section-title">Intestazione</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">

              <!-- Causale -->
              <div class="sm:col-span-2">
                <label class="form-label">Causale *</label>
                <select v-model="form.type_id" :disabled="isReadonly"
                  class="form-select" :class="{ 'form-readonly': isReadonly }">
                  <option :value="null">— Seleziona causale —</option>
                  <option v-for="t in noteTypes" :key="t.id" :value="t.id">{{ t.code }} — {{ t.name }}</option>
                </select>
              </div>

              <!-- Data -->
              <div>
                <label class="form-label">Data *</label>
                <input v-model="form.date" type="date" :disabled="isReadonly"
                  class="form-input" :class="{ 'form-readonly': isReadonly }"/>
              </div>

              <!-- Colli -->
              <div>
                <label class="form-label">N. Colli</label>
                <input v-model.number="form.colli" type="number" min="0" :disabled="isReadonly"
                  class="form-input" :class="{ 'form-readonly': isReadonly }"/>
              </div>

              <!-- Destinatario -->
              <div class="sm:col-span-2">
                <label class="form-label">Destinatario *</label>
                <input
                  v-model="form.destinatario_name"
                  type="text"
                  list="dn-partners-list"
                  :disabled="isReadonly"
                  placeholder="Inizia a scrivere per cercare…"
                  @input="onDestinSearch"
                  @change="onPartnerChange('destinatario', $event.target.value)"
                  class="form-input" :class="{ 'form-readonly': isReadonly }"/>
                <datalist id="dn-partners-list">
                  <option v-for="p in partners" :key="p.id" :value="p.name"/>
                </datalist>
              </div>

              <!-- Mittente -->
              <div class="sm:col-span-2">
                <label class="form-label">Mittente</label>
                <div class="form-input bg-slate-50 text-slate-500 text-sm leading-5 py-2 min-h-[38px]">
                  {{ form.mittente_name || '—' }}
                </div>
              </div>

              <!-- Rif. Esterno -->
              <div class="sm:col-span-2">
                <label class="form-label">Riferimento Esterno</label>
                <input v-model="form.riferimento_esterno" type="text" :disabled="isReadonly"
                  placeholder="es. 46163" class="form-input font-mono"
                  :class="{ 'form-readonly': isReadonly }"/>
              </div>

              <!-- Luogo destinazione -->
              <div class="sm:col-span-2">
                <label class="form-label">
                  Luogo Destinazione
                  <span class="font-normal text-slate-400 normal-case">(vuoto = usa destinatario)</span>
                </label>
                <input
                  v-model="form.luogo_dest_name"
                  type="text"
                  list="dn-luogo-list"
                  :disabled="isReadonly"
                  placeholder="Opzionale…"
                  @change="onPartnerChange('luogo_dest', $event.target.value)"
                  class="form-input" :class="{ 'form-readonly': isReadonly }"/>
                <datalist id="dn-luogo-list">
                  <option v-for="p in partners" :key="p.id" :value="p.name"/>
                </datalist>
              </div>

            </div>
          </div>

          <!-- ── Lines spreadsheet ──────────────────────────────────── -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="section-title !mb-0">Righe documento</h3>
              <span v-if="!isReadonly" class="text-xs text-slate-400">
                {{ activeLines.length }} rig{{ activeLines.length !== 1 ? 'he' : 'a' }} ·
                <kbd class="kbd">Tab</kbd> naviga · <kbd class="kbd">Invio</kbd> nuova riga
              </span>
              <span v-else class="text-xs text-slate-400">{{ activeLines.length }} righe</span>
            </div>

            <div class="border border-slate-300 rounded-xl overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr style="background-color:#1A1714;color:#C9C4BC;">
                      <th class="px-2 py-2.5 text-center font-semibold w-8 text-slate-500">#</th>
                      <th class="px-2 py-2.5 text-left font-semibold w-24">Cod. Art.</th>
                      <th class="px-2 py-2.5 text-left font-semibold min-w-[160px]">
                        Descrizione <span class="text-amber-400">*</span>
                      </th>
                      <th class="px-2 py-2.5 text-right font-semibold w-16">SC/PZ</th>
                      <th class="px-2 py-2.5 text-right font-semibold w-16">UM/QTA</th>
                      <th class="px-2 py-2.5 text-left font-semibold w-20">ODP</th>
                      <th class="px-2 py-2.5 text-left font-semibold w-20">HU/SU</th>
                      <th class="px-2 py-2.5 text-left font-semibold w-24">Barcode</th>
                      <th class="px-2 py-2.5 text-left font-semibold w-24 text-slate-400">Nota</th>
                      <th v-if="!isReadonly" class="w-8 px-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, rowIdx) in activeLines" :key="line._id"
                      :class="['border-t border-slate-200 group transition-colors',
                        rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40']">

                      <!-- # -->
                      <td class="px-2 py-1 text-center text-slate-400 font-mono select-none">{{ rowIdx + 1 }}</td>

                      <!-- Cod. Art. -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.articolo_code" type="text"
                          :data-cell="`${rowIdx}-0`"
                          @keydown="handleCellKey($event, rowIdx, 0)"
                          class="cell-input w-full font-mono"/>
                        <span v-else class="cell-display font-mono">{{ line.articolo_code || '' }}</span>
                      </td>

                      <!-- Descrizione -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.descrizione" type="text"
                          :data-cell="`${rowIdx}-1`"
                          @keydown="handleCellKey($event, rowIdx, 1)"
                          class="cell-input w-full font-semibold text-slate-800"/>
                        <span v-else class="cell-display font-semibold text-slate-800">{{ line.descrizione }}</span>
                      </td>

                      <!-- SC/PZ -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.sc_pz" type="number" min="0" step="0.01"
                          :data-cell="`${rowIdx}-2`"
                          @keydown="handleCellKey($event, rowIdx, 2)"
                          class="cell-input w-full text-right font-mono"/>
                        <span v-else class="cell-display text-right block font-mono">{{ line.sc_pz || '' }}</span>
                      </td>

                      <!-- UM/QTA -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.um_qta" type="number" min="0" step="0.01"
                          :data-cell="`${rowIdx}-3`"
                          @keydown="handleCellKey($event, rowIdx, 3)"
                          class="cell-input w-full text-right font-mono"/>
                        <span v-else class="cell-display text-right block font-mono">{{ line.um_qta || '' }}</span>
                      </td>

                      <!-- ODP -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.odp" type="text"
                          :data-cell="`${rowIdx}-4`"
                          @keydown="handleCellKey($event, rowIdx, 4)"
                          class="cell-input w-full font-mono"/>
                        <span v-else class="cell-display font-mono">{{ line.odp || '' }}</span>
                      </td>

                      <!-- HU/SU -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.hu_su" type="text"
                          :data-cell="`${rowIdx}-5`"
                          @keydown="handleCellKey($event, rowIdx, 5)"
                          class="cell-input w-full font-mono"/>
                        <span v-else class="cell-display font-mono">{{ line.hu_su || '' }}</span>
                      </td>

                      <!-- Barcode -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.barcode" type="text"
                          :data-cell="`${rowIdx}-6`"
                          @keydown="handleCellKey($event, rowIdx, 6)"
                          class="cell-input w-full font-mono"/>
                        <span v-else class="cell-display font-mono">{{ line.barcode || '' }}</span>
                      </td>

                      <!-- Nota riga -->
                      <td class="px-1 py-1">
                        <input v-if="!isReadonly"
                          v-model="line.line_note" type="text"
                          :data-cell="`${rowIdx}-7`"
                          @keydown="handleCellKey($event, rowIdx, 7)"
                          class="cell-input w-full text-slate-400 italic"/>
                        <span v-else class="cell-display text-slate-400 italic">{{ line.line_note || '' }}</span>
                      </td>

                      <!-- Delete -->
                      <td v-if="!isReadonly" class="px-1 py-1">
                        <button @click="removeLine(line._id)"
                          class="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100
                                 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Add row -->
              <button v-if="!isReadonly" @click="addLine"
                class="w-full px-4 py-2.5 flex items-center gap-2 text-xs text-slate-400
                       hover:text-slate-600 hover:bg-slate-50 border-t border-slate-200
                       transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Aggiungi riga
              </button>
            </div>
          </div>

          <!-- ── Note documento ─────────────────────────────────────── -->
          <div>
            <h3 class="section-title">Note</h3>
            <textarea v-model="form.note" :disabled="isReadonly" rows="3"
              placeholder="Note aggiuntive al documento…"
              class="form-input resize-none leading-relaxed"
              :class="{ 'form-readonly': isReadonly }"/>
          </div>

        </div>
      </div>

      <!-- ── Panel footer: workflow actions ────────────────────────── -->
      <div v-if="!loadingDetail" class="px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <div class="flex flex-wrap items-center gap-2">

          <!-- Salva Bozza: disponibile in draft o per nuove bolle -->
          <button v-if="!isReadonly && form.state !== 'confirmed'"
            @click="saveDraft" :disabled="saving"
            class="action-btn text-white" style="background-color:#1A1714;" onmouseover="this.style.backgroundColor='#2D2A25'" onmouseout="this.style.backgroundColor='#1A1714'">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
            {{ saving ? 'Salvataggio…' : (form.id ? 'Salva' : 'Crea Bozza') }}
          </button>

          <!-- Conferma: solo da draft con ID salvato -->
          <button v-if="form.state === 'draft' && form.id"
            @click="confirmNote" :disabled="saving"
            class="action-btn bg-amber-500 text-white hover:bg-amber-600">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Conferma
          </button>

          <!-- Completa: solo da confirmed -->
          <button v-if="form.state === 'confirmed'"
            @click="doneNote" :disabled="saving"
            class="action-btn bg-emerald-600 text-white hover:bg-emerald-700">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Completa
          </button>

          <!-- Annulla: da draft o confirmed -->
          <button v-if="form.id && ['draft', 'confirmed'].includes(form.state)"
            @click="cancelNote" :disabled="saving"
            class="action-btn border border-red-200 text-red-600 hover:bg-red-50">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
            Annulla
          </button>

          <!-- Ripristina a bozza: da cancel o confirmed -->
          <button v-if="form.id && ['cancel', 'confirmed'].includes(form.state)"
            @click="draftNote" :disabled="saving"
            class="action-btn border border-slate-300 text-slate-600 hover:bg-slate-100">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Ripristina Bozza
          </button>

          <!-- Stampa: se ha ID salvato -->
          <button v-if="form.id"
            @click="printNote"
            class="action-btn border border-slate-300 text-slate-600 hover:bg-slate-100 ml-auto">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Stampa PDF
          </button>

        </div>
      </div>

    </div>
  </Transition>

</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { callModel } from '@/api/odoo-xmlrpc.js'
import {
  fetchDeliveryNoteTypes,
  fetchDeliveryNotes,
  fetchDeliveryNote,
  createDeliveryNote,
  updateDeliveryNote,
  confirmDeliveryNote,
  doneDeliveryNote,
  cancelDeliveryNote,
  draftDeliveryNote,
  fetchPartners,
} from '@/api/deliveryNotes.js'

const auth = useAuthStore()

// ─── State ────────────────────────────────────────────────────────────────────

const notes        = ref([])
const noteTypes    = ref([])
const partners     = ref([])
const loading      = ref(false)
const loadingDetail = ref(false)
const saving       = ref(false)
const panelOpen    = ref(false)
const panelMode    = ref('create') // 'create' | 'view'

const toast = ref({ visible: false, message: '', type: 'success' })

const filters = ref({ search: '', state: '', type_id: '', date_from: '', date_to: '' })

const EMPTY_FORM = () => ({
  id: null, name: '', state: 'draft',
  type_id: null, date: todayISO(),
  destinatario_id: null, destinatario_name: '',
  mittente_id: null,     mittente_name: '',
  luogo_destinazione_id: null, luogo_dest_name: '',
  riferimento_esterno: '', colli: 0, note: '',
  lines: [],
})

const form = ref(EMPTY_FORM())

// ─── Computed ─────────────────────────────────────────────────────────────────

const isReadonly  = computed(() => form.value.state === 'done' || form.value.state === 'cancel')
const activeLines = computed(() => form.value.lines.filter(l => !l._deleted))

const hasActiveFilters = computed(() =>
  !!(filters.value.search || filters.value.state || filters.value.type_id ||
     filters.value.date_from || filters.value.date_to)
)

const filteredNotes = computed(() => {
  let r = notes.value
  const q = filters.value.search.toLowerCase().trim()
  if (q) r = r.filter(n =>
    (n.name || '').toLowerCase().includes(q) ||
    (n.riferimento_esterno || '').toLowerCase().includes(q) ||
    (n.destinatario_id?.[1] || '').toLowerCase().includes(q)
  )
  if (filters.value.state)     r = r.filter(n => n.state === filters.value.state)
  if (filters.value.type_id)   r = r.filter(n => n.type_id?.[0] === filters.value.type_id)
  if (filters.value.date_from) r = r.filter(n => (n.date || '') >= filters.value.date_from)
  if (filters.value.date_to)   r = r.filter(n => (n.date || '') <= filters.value.date_to)
  return r
})

const stats = computed(() => {
  const all = notes.value
  return [
    { label: 'Totale',      count: all.length,                                  dot: 'bg-slate-300', state: '' },
    { label: 'Bozze',       count: all.filter(n => n.state === 'draft').length,     dot: 'bg-sky-400',    state: 'draft' },
    { label: 'Confermate',  count: all.filter(n => n.state === 'confirmed').length, dot: 'bg-amber-400',  state: 'confirmed' },
    { label: 'Completate',  count: all.filter(n => n.state === 'done').length,      dot: 'bg-emerald-400',state: 'done' },
    { label: 'Annullate',   count: all.filter(n => n.state === 'cancel').length,    dot: 'bg-gray-300',   state: 'cancel' },
  ]
})

const typeMap = computed(() => Object.fromEntries(noteTypes.value.map(t => [t.id, t])))

// ─── Constants ────────────────────────────────────────────────────────────────

const stateOptions = [
  { value: 'draft',     label: 'Bozza',      activeClass: 'bg-sky-100 border-sky-300 text-sky-700' },
  { value: 'confirmed', label: 'Confermata', activeClass: 'bg-amber-100 border-amber-300 text-amber-700' },
  { value: 'done',      label: 'Completata', activeClass: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
  { value: 'cancel',    label: 'Annullata',  activeClass: 'bg-gray-100 border-gray-300 text-gray-500' },
]

const TOTAL_COLS = 8

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([loadNotes(), loadTypes(), loadPartners(), loadCompany()])
})

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadNotes() {
  loading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    notes.value = await fetchDeliveryNotes(uid, password)
  } catch (e) {
    showToast('Errore caricamento bolle: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function loadTypes() {
  try {
    const { uid, password } = auth.getCredentials()
    noteTypes.value = await fetchDeliveryNoteTypes(uid, password)
  } catch (e) {
    console.error('Errore causali:', e)
  }
}

async function loadPartners() {
  try {
    const { uid, password } = auth.getCredentials()
    partners.value = await fetchPartners(uid, password)
  } catch (e) {
    console.error('Errore partner:', e)
  }
}

async function loadCompany() {
  try {
    const { uid, password } = auth.getCredentials()
    const companies = await callModel(uid, password, 'res.company', 'search_read',
      [[]], { fields: ['id', 'name', 'partner_id'], limit: 1 }
    )
    if (companies.length) {
      form.value.mittente_id   = companies[0].partner_id[0]
      form.value.mittente_name = companies[0].partner_id[1]
      // Store for use when creating new forms
      _defaultMittente.id   = companies[0].partner_id[0]
      _defaultMittente.name = companies[0].partner_id[1]
    }
  } catch (e) {
    console.error('Errore azienda:', e)
  }
}

// Tiny non-reactive store for default mittente
const _defaultMittente = { id: null, name: '' }

// ─── Panel ────────────────────────────────────────────────────────────────────

function openCreatePanel() {
  form.value = EMPTY_FORM()
  form.value.mittente_id   = _defaultMittente.id
  form.value.mittente_name = _defaultMittente.name
  form.value.lines = [newLine()]
  panelMode.value  = 'create'
  panelOpen.value  = true
  nextTick(() => {
    const panel = document.querySelector('[tabindex="-1"]')
    if (panel) panel.focus()
  })
}

async function openEditPanel(id) {
  form.value      = EMPTY_FORM()
  panelMode.value = 'view'
  panelOpen.value = true
  loadingDetail.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const note = await fetchDeliveryNote(uid, password, id)
    form.value = {
      id:   note.id,
      name: note.name,
      state: note.state,
      type_id: note.type_id ? note.type_id[0] : null,
      date:    note.date    || '',
      destinatario_id:   note.destinatario_id      ? note.destinatario_id[0]      : null,
      destinatario_name: note.destinatario_id      ? note.destinatario_id[1]      : '',
      mittente_id:       note.mittente_id          ? note.mittente_id[0]          : null,
      mittente_name:     note.mittente_id          ? note.mittente_id[1]          : '',
      luogo_destinazione_id: note.luogo_destinazione_id ? note.luogo_destinazione_id[0] : null,
      luogo_dest_name:       note.luogo_destinazione_id ? note.luogo_destinazione_id[1] : '',
      riferimento_esterno: note.riferimento_esterno || '',
      colli: note.colli || 0,
      note:  note.note  || '',
      lines: note.lines.map(l => ({
        _id:          uid + '-' + l.id,
        id:           l.id,
        sequence:     l.sequence,
        articolo_code: l.articolo_code || '',
        descrizione:  l.descrizione   || '',
        sc_pz:        l.sc_pz  || null,
        um_qta:       l.um_qta || null,
        odp:          l.odp    || '',
        hu_su:        l.hu_su  || '',
        barcode:      l.barcode   || '',
        line_note:    l.line_note || '',
        _deleted: false,
      })),
    }
    if (form.value.lines.length === 0) form.value.lines.push(newLine())
  } catch (e) {
    showToast('Errore caricamento: ' + e.message, 'error')
    panelOpen.value = false
  } finally {
    loadingDetail.value = false
  }
}

function tryClosePanel() { if (!saving.value) closePanel() }
function closePanel()    { panelOpen.value = false; form.value = EMPTY_FORM() }

// ─── Form helpers ─────────────────────────────────────────────────────────────

function newLine() {
  return {
    _id: String(Date.now()) + String(Math.random()),
    id: null, sequence: 10,
    articolo_code: '', descrizione: '',
    sc_pz: null, um_qta: null,
    odp: '', hu_su: '', barcode: '', line_note: '',
    _deleted: false,
  }
}

function addLine() { form.value.lines.push(newLine()) }

function removeLine(localId) {
  const line = form.value.lines.find(l => l._id === localId)
  if (!line) return
  if (line.id) {
    line._deleted = true
  } else {
    form.value.lines = form.value.lines.filter(l => l._id !== localId)
  }
  if (activeLines.value.length === 0) addLine()
}

function onDestinSearch() {
  // keep id in sync when user types directly (in case they clear and retype)
  const match = partners.value.find(p => p.name === form.value.destinatario_name)
  if (!match) form.value.destinatario_id = null
}

function onPartnerChange(field, name) {
  const p = partners.value.find(x => x.name === name)
  if (field === 'destinatario') {
    form.value.destinatario_id   = p?.id || null
    form.value.destinatario_name = name
  } else {
    form.value.luogo_destinazione_id = p?.id || null
    form.value.luogo_dest_name       = name
  }
}

// ─── Keyboard navigation ─────────────────────────────────────────────────────

function handleCellKey(event, rowIdx, colIdx) {
  if (event.key !== 'Tab' && event.key !== 'Enter') return
  if (event.key === 'Tab') {
    event.preventDefault()
    const rows     = activeLines.value.length
    const isLastC  = colIdx === TOTAL_COLS - 1
    const isLastR  = rowIdx === rows - 1
    if (event.shiftKey) {
      if (colIdx === 0 && rowIdx > 0) focusCell(rowIdx - 1, TOTAL_COLS - 1)
      else if (colIdx > 0)            focusCell(rowIdx, colIdx - 1)
    } else {
      if (isLastC && isLastR) { addLine(); nextTick(() => focusCell(rowIdx + 1, 0)) }
      else if (isLastC)       focusCell(rowIdx + 1, 0)
      else                    focusCell(rowIdx, colIdx + 1)
    }
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const isLastR = rowIdx === activeLines.value.length - 1
    if (isLastR) { addLine(); nextTick(() => focusCell(rowIdx + 1, 1)) }
    else         focusCell(rowIdx + 1, colIdx)
  }
}

function focusCell(rowIdx, colIdx) {
  const el = document.querySelector(`[data-cell="${rowIdx}-${colIdx}"]`)
  if (el) el.focus()
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

async function saveDraft() {
  if (!validateForm()) return
  saving.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const data = buildFormData()
    if (form.value.id) {
      await updateDeliveryNote(uid, password, form.value.id, data)
      showToast('Bolla salvata')
      // Reload to sync line IDs after save
      await openEditPanel(form.value.id)
    } else {
      const newId = await createDeliveryNote(uid, password, data)
      form.value.id    = newId
      form.value.state = 'draft'
      panelMode.value  = 'view'
      const detail = await fetchDeliveryNote(uid, password, newId)
      form.value.name  = detail.name
      form.value.lines = detail.lines.map(l => ({
        _id: String(l.id), id: l.id, sequence: l.sequence,
        articolo_code: l.articolo_code || '', descrizione: l.descrizione || '',
        sc_pz: l.sc_pz || null, um_qta: l.um_qta || null,
        odp: l.odp || '', hu_su: l.hu_su || '', barcode: l.barcode || '',
        line_note: l.line_note || '', _deleted: false,
      }))
      showToast('Bolla creata: ' + detail.name)
    }
    await loadNotes()
  } catch (e) {
    showToast('Errore: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

async function confirmNote() {
  if (!form.value.id) return
  saving.value = true
  try {
    const { uid, password } = auth.getCredentials()
    await confirmDeliveryNote(uid, password, form.value.id)
    form.value.state = 'confirmed'
    showToast('Bolla confermata')
    await loadNotes()
  } catch (e) { showToast('Errore: ' + e.message, 'error') }
  finally { saving.value = false }
}

async function doneNote() {
  if (!form.value.id) return
  saving.value = true
  try {
    const { uid, password } = auth.getCredentials()
    await doneDeliveryNote(uid, password, form.value.id)
    form.value.state = 'done'
    showToast('Bolla completata')
    await loadNotes()
  } catch (e) { showToast('Errore: ' + e.message, 'error') }
  finally { saving.value = false }
}

async function cancelNote() {
  if (!form.value.id) return
  if (form.value.state === 'confirmed') {
    if (!window.confirm('Annullare questa bolla confermata?')) return
  }
  saving.value = true
  try {
    const { uid, password } = auth.getCredentials()
    await cancelDeliveryNote(uid, password, form.value.id)
    form.value.state = 'cancel'
    showToast('Bolla annullata')
    await loadNotes()
  } catch (e) { showToast('Errore: ' + e.message, 'error') }
  finally { saving.value = false }
}

async function draftNote() {
  if (!form.value.id) return
  saving.value = true
  try {
    const { uid, password } = auth.getCredentials()
    await draftDeliveryNote(uid, password, form.value.id)
    form.value.state = 'draft'
    showToast('Bolla ripristinata in bozza')
    await loadNotes()
  } catch (e) { showToast('Errore: ' + e.message, 'error') }
  finally { saving.value = false }
}

function printNote() {
  const odooUrl = import.meta.env.VITE_ODOO_URL
  if (odooUrl && form.value.id) {
    window.open(
      `${odooUrl}/report/pdf/editable_delivery_note.report_edn_delivery_note/${form.value.id}`,
      '_blank'
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFormData() {
  return {
    type_id:              form.value.type_id,
    date:                 form.value.date,
    destinatario_id:      form.value.destinatario_id,
    mittente_id:          form.value.mittente_id,
    luogo_destinazione_id: form.value.luogo_destinazione_id || false,
    riferimento_esterno:  form.value.riferimento_esterno,
    colli:                form.value.colli,
    note:                 form.value.note,
    lines:                form.value.lines,
  }
}

function validateForm() {
  if (!form.value.type_id) {
    showToast('Seleziona una causale', 'error'); return false
  }
  if (!form.value.date) {
    showToast('Inserisci la data', 'error'); return false
  }
  if (!form.value.destinatario_id) {
    showToast('Seleziona un destinatario dalla lista', 'error'); return false
  }
  const hasDesc = activeLines.value.some(l => l.descrizione.trim())
  if (!hasDesc) {
    showToast('Almeno una riga deve avere una descrizione', 'error'); return false
  }
  return true
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function typeCode(typeId) {
  if (!typeId) return '—'
  const t = typeMap.value[typeId[0]]
  return t ? t.code : typeId[1]?.split(' - ')[0] || '—'
}

function stateBadgeClass(state) {
  return {
    draft:     'bg-sky-50 border-sky-200 text-sky-700',
    confirmed: 'bg-amber-50 border-amber-300 text-amber-700',
    done:      'bg-emerald-50 border-emerald-300 text-emerald-700',
    cancel:    'bg-gray-100 border-gray-300 text-gray-500',
  }[state] || 'bg-gray-100 border-gray-200 text-gray-500'
}

function stateLabel(state) {
  return { draft: 'Bozza', confirmed: 'Confermata', done: 'Completata', cancel: 'Annullata' }[state] || state
}

function toggleStateFilter(state) {
  filters.value.state = filters.value.state === state ? '' : state
}

function clearFilters() {
  filters.value = { search: '', state: '', type_id: '', date_from: '', date_to: '' }
}

function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
  setTimeout(() => { toast.value.visible = false }, 3500)
}
</script>

<style scoped>
/* ── Form elements ─────────────────────────────────────────────────────────── */
.form-label {
  @apply block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide;
}
.form-input {
  @apply w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white
         focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400
         transition-colors;
}
.form-select {
  @apply w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white
         focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400
         transition-colors cursor-pointer;
}
.form-readonly {
  @apply bg-slate-50 text-slate-500 cursor-not-allowed pointer-events-none;
}

/* ── Section title ─────────────────────────────────────────────────────────── */
.section-title {
  @apply text-xs font-bold text-slate-400 uppercase tracking-widest mb-3;
}

/* ── Spreadsheet cells ─────────────────────────────────────────────────────── */
.cell-input {
  @apply px-1.5 py-1 text-xs bg-transparent border border-transparent rounded
         focus:outline-none focus:bg-white focus:border-amber-400
         focus:ring-1 focus:ring-amber-400/30
         transition-all;
}
.cell-display {
  @apply inline-block px-1.5 py-1 text-xs text-slate-700;
}

/* ── Action buttons ────────────────────────────────────────────────────────── */
.action-btn {
  @apply flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold
         transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

/* ── Keyboard hint ─────────────────────────────────────────────────────────── */
.kbd {
  @apply inline-block px-1 py-0.5 text-xs font-mono bg-slate-200 text-slate-600 rounded border border-slate-300;
}

/* ── Slide-over transition ─────────────────────────────────────────────────── */
.slideover-enter-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slideover-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1); }
.slideover-enter-from,
.slideover-leave-to { transform: translateX(100%); }

/* ── Backdrop transition ───────────────────────────────────────────────────── */
.backdrop-enter-active { transition: opacity 0.3s; }
.backdrop-leave-active { transition: opacity 0.2s; }
.backdrop-enter-from,
.backdrop-leave-to { opacity: 0; }

/* ── Toast transition ──────────────────────────────────────────────────────── */
.toast-enter-active { transition: all 0.2s ease-out; }
.toast-leave-active { transition: all 0.15s ease-in; }
.toast-enter-from   { transform: translateY(-0.5rem); opacity: 0; }
.toast-leave-to     { opacity: 0; }
</style>

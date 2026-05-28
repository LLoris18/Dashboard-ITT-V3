<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">

    <!-- ── Toast ─────────────────────────────────────────────────────── -->
    <Transition name="toast">
      <div v-if="toast.visible"
        :class="['fixed top-5 right-5 z-[60] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm',
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600']">
        <span>{{ toast.message }}</span>
        <button @click="toast.visible = false" class="ml-2 opacity-70 hover:opacity-100">✕</button>
      </div>
    </Transition>

    <!-- ── Modal scelta causale DDT ────────────────────────────────────── -->
    <Transition name="modal-fade">
      <div v-if="showDdtModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="showDdtModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="px-6 py-5 border-b border-gray-100">
            <h3 class="text-base font-bold text-gray-900">Scegli causale DDT</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              Picking
              <span class="font-mono font-semibold text-indigo-700">{{ spedizioneResult?.pickingName || '#' + spedizioneResult?.pickingId }}</span>
              creato e validato
            </p>
          </div>
          <div class="px-6 py-5">
            <div v-if="loadingTipi" class="flex items-center justify-center gap-2 text-gray-400 py-4">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span class="text-sm">Caricamento causali...</span>
            </div>
            <template v-else>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo DDT</label>
              <select v-model="selectedTypeId"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white">
                <option :value="null" disabled>-- Seleziona una causale --</option>
                <option v-for="t in tipiDdt" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <p v-if="tipiDdt.length === 0" class="text-xs text-red-500 mt-1">
                Nessuna causale DDT disponibile in Odoo
              </p>
            </template>
          </div>
          <div class="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
            <button @click="showDdtModal = false" :disabled="creatingDdt"
              class="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40">
              Annulla
            </button>
            <button @click="confermaDdt" :disabled="!selectedTypeId || creatingDdt || loadingTipi"
              class="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold
                     bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed">
              <svg v-if="creatingDdt" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ creatingDdt ? 'Creazione DDT...' : 'Crea DDT' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Page header ────────────────────────────────────────────────── -->
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0" style="background-color:#1A1714;">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;height:18px" class="text-amber-400">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight leading-tight">CLF Produzione</h1>
          <p class="text-xs text-slate-400 leading-tight">Pallet CDP · ciclo produzione → bollettazione</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="toggleAutoRefresh"
          :class="['flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors',
            autoRefresh ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300']">
          <span :class="['w-1.5 h-1.5 rounded-full', autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300']"></span>
          Auto {{ autoRefresh ? 'ON' : 'OFF' }}
        </button>
        <button @click="loadAll" :disabled="loading"
          class="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50" style="background-color:#1A1714;" onmouseover="this.style.backgroundColor='#2D2A25'" onmouseout="this.style.backgroundColor='#1A1714'">
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Aggiorna
        </button>
      </div>
    </div>

    <!-- ── KPI cards ──────────────────────────────────────────────────── -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <button @click="goTab('daBollettare', 'tutti')"
        class="bg-white rounded-xl border border-slate-200 hover:border-slate-300 px-4 py-4 text-left transition-colors group">
        <div class="flex items-start justify-between">
          <div>
            <div :class="['text-3xl font-black tabular-nums leading-none', kpi.daBollettare > 0 ? 'text-slate-800' : 'text-slate-400']">
              {{ loadingKpi ? '—' : kpi.daBollettare }}
            </div>
            <div class="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wide">Da bollettare</div>
          </div>
          <div class="w-9 h-9 bg-slate-100 group-hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors shrink-0">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
            </svg>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-400">Pallet in attesa di DDT</div>
      </button>

      <button @click="goTab('daBollettare', 'urgenti')"
        :class="['bg-white rounded-xl border px-4 py-4 text-left transition-colors group',
          kpi.critici > 0 ? 'border-red-200 hover:border-red-300' : 'border-slate-200 hover:border-slate-300']">
        <div class="flex items-start justify-between">
          <div>
            <div :class="['text-3xl font-black tabular-nums leading-none', kpi.critici > 0 ? 'text-red-600' : 'text-slate-400']">
              {{ loadingKpi ? '—' : kpi.critici }}
            </div>
            <div class="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wide">Critici &gt;3 giorni</div>
          </div>
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            kpi.critici > 0 ? 'bg-red-50 group-hover:bg-red-100' : 'bg-slate-100 group-hover:bg-slate-200']">
            <svg :class="['w-4 h-4', kpi.critici > 0 ? 'text-red-500' : 'text-slate-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.694 0L3.214 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-400">Fermi da più di 3 giorni</div>
      </button>

      <button @click="goTab('storico', 'oggi')"
        class="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 px-4 py-4 text-left transition-colors group">
        <div class="flex items-start justify-between">
          <div>
            <div :class="['text-3xl font-black tabular-nums leading-none', kpi.oggi > 0 ? 'text-emerald-600' : 'text-slate-400']">
              {{ loadingKpi ? '—' : kpi.oggi }}
            </div>
            <div class="text-xs font-semibold text-slate-500 mt-1.5 uppercase tracking-wide">Bollettati oggi</div>
          </div>
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            kpi.oggi > 0 ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-slate-100 group-hover:bg-slate-200']">
            <svg :class="['w-4 h-4', kpi.oggi > 0 ? 'text-emerald-500' : 'text-slate-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-400">DDT emessi nella giornata</div>
      </button>
    </div>

    <!-- ── Tabs ───────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-1 mb-4 border-b border-slate-200">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        :class="['px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
          activeTab === t.id ? 'border-amber-400 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
        {{ t.label }}
        <span v-if="t.id === 'daBollettare' && !loadingKpi && kpi.daBollettare > 0"
          class="ml-1.5 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
          {{ kpi.daBollettare }}
        </span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════
         TAB: DA BOLLETTARE
    ═══════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'daBollettare'">

      <!-- Banner risultato Prepara Spedizione -->
      <Transition name="banner">
        <div v-if="spedizioneResult"
          class="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-sm font-semibold text-emerald-800">
              {{ spedizioneResult.ddt ? 'DDT ' + spedizioneResult.ddt.name + ' creato' : 'Spedizione preparata per ' + spedizioneResult.count + ' pallet' }}
            </span>
            <span v-if="spedizioneResult.pickingName" class="font-mono text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
              {{ spedizioneResult.pickingName }}
            </span>
            <span v-if="spedizioneResult.ddt" class="font-mono text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
              {{ spedizioneResult.ddt.name }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button v-if="!spedizioneResult.ddt" @click="openDdtModal"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Crea DDT
            </button>
            <button @click="spedizioneResult = null" class="text-emerald-400 hover:text-emerald-600 text-lg leading-none">✕</button>
          </div>
        </div>
      </Transition>

      <!-- Action bar selezione -->
      <Transition name="slide-down">
        <div v-if="selectedIds.length > 0 && !spedizioneResult"
          class="mb-4 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3" style="background-color:#1A1714;">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-5 h-5 bg-amber-400 rounded flex items-center justify-center shrink-0">
              <span class="text-xs font-black text-slate-900">{{ selectedIds.length }}</span>
            </div>
            <span class="text-sm font-semibold text-white">
              {{ selectedIds.length === 1 ? '1 pallet selezionato' : `${selectedIds.length} pallet selezionati` }}
            </span>
            <span class="text-xs text-slate-400">
              · {{ formatQty(selectedQty) }} pz totali
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button @click="clearSelection" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-colors">
              Deseleziona
            </button>
            <button @click="runPreparaSpedizione" :disabled="actionLoading"
              class="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-bold transition-colors disabled:opacity-60">
              <svg :class="['w-3.5 h-3.5', actionLoading ? 'animate-spin' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
              </svg>
              {{ actionLoading ? 'Elaborazione…' : 'Prepara Spedizione' }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Filtri -->
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <button v-for="f in filtersDaBollettare" :key="f.id"
          @click="urgenzaFilter = f.id"
          :class="['px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            urgenzaFilter === f.id ? f.activeClass : 'border-slate-200 text-slate-500 hover:border-slate-300']">
          {{ f.label }}
          <span v-if="f.count !== undefined && !loading" class="ml-1 opacity-70">({{ f.count }})</span>
        </button>
        <div class="relative ml-auto">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input v-model="searchDaBollettare" type="text" placeholder="Codice, lotto…"
            class="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 w-44 transition-colors"/>
        </div>
      </div>

      <!-- Tabella Da Bollettare -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/80">
                <!-- Checkbox seleziona tutti -->
                <th class="px-3 py-3 w-10">
                  <input type="checkbox"
                    :checked="allPageSelected"
                    :indeterminate="somePageSelected && !allPageSelected"
                    @change="toggleSelectAll"
                    class="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"/>
                </th>
                <th class="th">Urgenza</th>
                <th class="th">Cod. Art.</th>
                <th class="th">Lotto</th>
                <th class="th text-right">Qtà</th>
                <th class="th">UdM</th>
                <th class="th">Data Produzione</th>
                <th class="th text-center">Gg</th>
                <th class="th">OdL</th>
                <th class="th">Note</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loading">
                <tr v-for="i in 5" :key="i" class="border-b border-slate-100 animate-pulse">
                  <td class="px-3 py-3"><div class="w-4 h-4 bg-slate-200 rounded"></div></td>
                  <td class="px-4 py-3"><div class="h-5 bg-slate-200 rounded-full w-16"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-8"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-32"></div></td>
                  <td class="px-4 py-3"><div class="h-5 bg-slate-200 rounded-full w-8 mx-auto"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-28"></div></td>
                </tr>
              </template>

              <tr v-else-if="!filteredDaBollettare.length">
                <td colspan="10" class="px-4 py-14 text-center">
                  <svg class="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-slate-400 font-medium text-sm">Nessun pallet da bollettare</p>
                </td>
              </tr>

              <tr v-else v-for="p in pagedDaBollettare" :key="p.id"
                :class="['border-b border-slate-100 last:border-0 transition-colors',
                  isSelected(p.id) ? 'bg-amber-50/70' : urgencyRowClass(p)]">
                <!-- Checkbox -->
                <td class="px-3 py-2.5">
                  <input type="checkbox"
                    :checked="isSelected(p.id)"
                    @change="toggleSelect(p.id)"
                    class="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"/>
                </td>
                <td class="px-4 py-2.5">
                  <span :class="['inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full', urgencyBadgeClass(p)]">
                    <span :class="['w-1.5 h-1.5 rounded-full', urgencyDotClass(p)]"></span>
                    {{ urgencyLabel(p) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 font-mono font-semibold text-slate-800 text-xs tracking-tight">
                  {{ p.default_code || (p.product_id ? p.product_id[1] : '—') }}
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-600 text-xs">{{ p.lot_id ? p.lot_id[1] : '—' }}</td>
                <td class="px-4 py-2.5 text-right font-mono font-semibold text-slate-800 text-xs tabular-nums">{{ formatQty(p.product_qty) }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-500">{{ p.uom_id ? p.uom_id[1] : '' }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-600 tabular-nums whitespace-nowrap">{{ formatDatetime(p.data_produzione) }}</td>
                <td class="px-4 py-2.5 text-center">
                  <span :class="['text-xs font-black tabular-nums', giorniColor(p)]">{{ p.giorni_attesa ?? '—' }}</span>
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-500 text-xs">{{ p.workorder_id ? p.workorder_id[1] : '—' }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-500 max-w-[160px] truncate" :title="p.note">{{ p.note || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer paginazione Da Bollettare -->
        <div v-if="!loading && filteredDaBollettare.length"
          class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 flex-wrap">
          <p class="text-xs text-slate-400">
            <span v-if="filteredDaBollettare.length > PAGE_SIZE">
              {{ pageStartDB + 1 }}–{{ pageEndDB }} di {{ filteredDaBollettare.length }} ·
            </span>
            Totale: <span class="font-semibold text-slate-600">{{ totalQtyDaBollettare }}</span> pz
          </p>
          <div v-if="totalPagesDB > 1" class="flex items-center gap-1">
            <button @click="pageDaBollettare--" :disabled="pageDaBollettare === 1" class="page-btn">‹</button>
            <span class="px-2 text-xs font-semibold text-slate-600 tabular-nums">{{ pageDaBollettare }} / {{ totalPagesDB }}</span>
            <button @click="pageDaBollettare++" :disabled="pageDaBollettare >= totalPagesDB" class="page-btn">›</button>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════════════════════════
         TAB: STORICO
    ═══════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'storico'">

      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <button v-for="f in filtersStorico" :key="f.id"
          @click="setStoricoFilter(f.id)"
          :class="['px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            storicoFilter === f.id ? f.activeClass : 'border-slate-200 text-slate-500 hover:border-slate-300']">
          {{ f.label }}
        </button>
        <div class="relative ml-auto">
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input v-model="searchStorico" type="text" placeholder="Codice, lotto, DDT…"
            class="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 w-44 transition-colors"/>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/80">
                <th class="th">Stato</th>
                <th class="th">Cod. Art.</th>
                <th class="th">Lotto</th>
                <th class="th text-right">Qtà</th>
                <th class="th">UdM</th>
                <th class="th">Data Produzione</th>
                <th class="th">Data Bollettazione</th>
                <th class="th">DDT / Picking</th>
                <th class="th">Note</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loadingStorico">
                <tr v-for="i in 5" :key="i" class="border-b border-slate-100 animate-pulse">
                  <td class="px-4 py-3"><div class="h-5 bg-slate-200 rounded-full w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-24"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-12 ml-auto"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-8"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-32"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-32"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-20"></div></td>
                  <td class="px-4 py-3"><div class="h-3.5 bg-slate-200 rounded w-24"></div></td>
                </tr>
              </template>

              <tr v-else-if="!filteredStorico.length">
                <td colspan="9" class="px-4 py-14 text-center">
                  <p class="text-slate-400 font-medium text-sm">Nessun record nel periodo selezionato</p>
                </td>
              </tr>

              <tr v-else v-for="p in pagedStorico" :key="p.id"
                :class="['border-b border-slate-100 last:border-0 transition-colors', storicoRowClass(p)]">
                <td class="px-4 py-2.5">
                  <span :class="['inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full', storicoStateBadge(p)]">
                    {{ p.state === 'bollettato' ? 'Bollettato' : urgencyLabel(p) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 font-mono font-semibold text-slate-800 text-xs tracking-tight">
                  {{ p.default_code || (p.product_id ? p.product_id[1] : '—') }}
                </td>
                <td class="px-4 py-2.5 font-mono text-slate-600 text-xs">{{ p.lot_id ? p.lot_id[1] : '—' }}</td>
                <td class="px-4 py-2.5 text-right font-mono font-semibold text-slate-800 text-xs tabular-nums">{{ formatQty(p.product_qty) }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-500">{{ p.uom_id ? p.uom_id[1] : '' }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-600 tabular-nums whitespace-nowrap">{{ formatDatetime(p.data_produzione) }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-600 tabular-nums whitespace-nowrap">{{ formatDatetime(p.data_bollettazione) }}</td>
                <td class="px-4 py-2.5 font-mono text-xs text-slate-600">{{ p.picking_id ? p.picking_id[1] : '—' }}</td>
                <td class="px-4 py-2.5 text-xs text-slate-500 max-w-[140px] truncate" :title="p.note">{{ p.note || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer paginazione Storico -->
        <div v-if="!loadingStorico && filteredStorico.length"
          class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 flex-wrap">
          <p class="text-xs text-slate-400">
            <span v-if="filteredStorico.length > PAGE_SIZE">
              {{ pageStartST + 1 }}–{{ pageEndST }} di {{ filteredStorico.length }} ·
            </span>
            Totale: <span class="font-semibold text-slate-600">{{ totalQtyStorico }}</span> pz
          </p>
          <div v-if="totalPagesST > 1" class="flex items-center gap-1">
            <button @click="pageStorico--" :disabled="pageStorico === 1" class="page-btn">‹</button>
            <span class="px-2 text-xs font-semibold text-slate-600 tabular-nums">{{ pageStorico }} / {{ totalPagesST }}</span>
            <button @click="pageStorico++" :disabled="pageStorico >= totalPagesST" class="page-btn">›</button>
          </div>
        </div>
      </div>

    </template>

    <p v-if="lastUpdate" class="text-xs text-slate-400 mt-3 text-right">
      Aggiornato: {{ lastUpdate }}
      <span v-if="autoRefresh"> · prossimo aggiornamento tra {{ countdown }}s</span>
    </p>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import {
  fetchPalletsDaBollettare,
  fetchPalletsStorico,
  fetchKpiCounts,
  preparaSpedizione,
  fetchTipiDdt,
  creaDdtDaPicking,
} from '@/api/clfProduzione.js'

const auth = useAuthStore()

// ─── Costanti ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ─── State ────────────────────────────────────────────────────────────────────

const pallets          = ref([])
const storicoData      = ref([])
const kpi              = ref({ daBollettare: 0, critici: 0, oggi: 0 })
const loading          = ref(false)
const loadingStorico   = ref(false)
const loadingKpi       = ref(false)
const actionLoading    = ref(false)
const activeTab        = ref('daBollettare')
const urgenzaFilter    = ref('tutti')
const storicoFilter    = ref('oggi')
const searchDaBollettare = ref('')
const searchStorico    = ref('')
const pageDaBollettare = ref(1)
const pageStorico      = ref(1)
const selectedIds      = ref([])
const spedizioneResult = ref(null)
const showDdtModal     = ref(false)
const tipiDdt          = ref([])
const loadingTipi      = ref(false)
const selectedTypeId   = ref(null)
const creatingDdt      = ref(false)
const autoRefresh      = ref(false)
const countdown        = ref(60)
const lastUpdate       = ref('')
const toast            = ref({ visible: false, message: '', type: 'success' })

let refreshTimer   = null
let countdownTimer = null

// ─── Tabs & filtri ────────────────────────────────────────────────────────────

const tabs = [
  { id: 'daBollettare', label: 'Da Bollettare' },
  { id: 'storico',      label: 'Storico' },
]

const filtersDaBollettare = computed(() => [
  { id: 'tutti',   label: 'Tutti',          activeClass: 'bg-[#1A1714] border-[#1A1714] text-white',  count: pallets.value.length },
  { id: 'urgenti', label: 'Urgenti >3gg',   activeClass: 'bg-red-600 border-red-600 text-white',      count: pallets.value.filter(p => p.giorni_attesa > 3).length },
  { id: 'attesa',  label: 'In attesa >1gg', activeClass: 'bg-amber-500 border-amber-500 text-white',  count: pallets.value.filter(p => p.giorni_attesa > 1).length },
])

const filtersStorico = [
  { id: 'oggi',  label: 'Bollettati oggi',  activeClass: 'bg-emerald-600 border-emerald-600 text-white' },
  { id: '7gg',   label: 'Ultimi 7 giorni',  activeClass: 'bg-[#1A1714] border-[#1A1714] text-white' },
  { id: 'tutti', label: 'Tutti',            activeClass: 'bg-[#1A1714] border-[#1A1714] text-white' },
]

// ─── Computed: filtri ─────────────────────────────────────────────────────────

const filteredDaBollettare = computed(() => {
  let r = pallets.value
  if (urgenzaFilter.value === 'urgenti') r = r.filter(p => p.giorni_attesa > 3)
  if (urgenzaFilter.value === 'attesa')  r = r.filter(p => p.giorni_attesa > 1)
  const q = searchDaBollettare.value.toLowerCase().trim()
  if (q) r = r.filter(p =>
    (p.default_code || '').toLowerCase().includes(q) ||
    (p.lot_id?.[1]  || '').toLowerCase().includes(q) ||
    (p.note         || '').toLowerCase().includes(q)
  )
  return r
})

const filteredStorico = computed(() => {
  let r = storicoData.value
  const q = searchStorico.value.toLowerCase().trim()
  if (q) r = r.filter(p =>
    (p.default_code    || '').toLowerCase().includes(q) ||
    (p.lot_id?.[1]     || '').toLowerCase().includes(q) ||
    (p.picking_id?.[1] || '').toLowerCase().includes(q) ||
    (p.note            || '').toLowerCase().includes(q)
  )
  return r
})

// ─── Computed: paginazione ────────────────────────────────────────────────────

const totalPagesDB  = computed(() => Math.max(1, Math.ceil(filteredDaBollettare.value.length / PAGE_SIZE)))
const pageStartDB   = computed(() => (pageDaBollettare.value - 1) * PAGE_SIZE)
const pageEndDB     = computed(() => Math.min(pageStartDB.value + PAGE_SIZE, filteredDaBollettare.value.length))
const pagedDaBollettare = computed(() => filteredDaBollettare.value.slice(pageStartDB.value, pageEndDB.value))

const totalPagesST  = computed(() => Math.max(1, Math.ceil(filteredStorico.value.length / PAGE_SIZE)))
const pageStartST   = computed(() => (pageStorico.value - 1) * PAGE_SIZE)
const pageEndST     = computed(() => Math.min(pageStartST.value + PAGE_SIZE, filteredStorico.value.length))
const pagedStorico  = computed(() => filteredStorico.value.slice(pageStartST.value, pageEndST.value))

// ─── Computed: selezione ──────────────────────────────────────────────────────

const isSelected      = (id) => selectedIds.value.includes(id)
const allPageSelected = computed(() =>
  pagedDaBollettare.value.length > 0 &&
  pagedDaBollettare.value.every(p => isSelected(p.id))
)
const somePageSelected = computed(() => pagedDaBollettare.value.some(p => isSelected(p.id)))

const selectedQty = computed(() => {
  const map = Object.fromEntries(pallets.value.map(p => [p.id, p.product_qty || 0]))
  return selectedIds.value.reduce((s, id) => s + (map[id] || 0), 0)
})

// ─── Computed: totali ─────────────────────────────────────────────────────────

const totalQtyDaBollettare = computed(() =>
  filteredDaBollettare.value.reduce((s, p) => s + (p.product_qty || 0), 0).toLocaleString('it-IT')
)
const totalQtyStorico = computed(() =>
  filteredStorico.value.reduce((s, p) => s + (p.product_qty || 0), 0).toLocaleString('it-IT')
)

// ─── Watchers: reset pagina su cambio filtri ──────────────────────────────────

watch([urgenzaFilter, searchDaBollettare], () => {
  pageDaBollettare.value = 1
  selectedIds.value = []
})
watch([storicoFilter, searchStorico], () => { pageStorico.value = 1 })
watch(storicoFilter, () => loadStorico())

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => loadAll())
onUnmounted(() => stopAutoRefresh())

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadAll() {
  await Promise.all([loadDaBollettare(), loadKpi(), loadStorico()])
  lastUpdate.value = new Date().toLocaleTimeString('it-IT')
}

async function loadDaBollettare() {
  loading.value = true
  try {
    const { uid, password } = auth.getCredentials()
    pallets.value = await fetchPalletsDaBollettare(uid, password)
    pageDaBollettare.value = 1
    selectedIds.value = []
  } catch (e) {
    showToast('Errore caricamento pallet: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function loadStorico() {
  loadingStorico.value = true
  try {
    const { uid, password } = auth.getCredentials()
    storicoData.value = await fetchPalletsStorico(uid, password, storicoFilter.value)
    pageStorico.value = 1
  } catch (e) {
    showToast('Errore storico: ' + e.message, 'error')
  } finally {
    loadingStorico.value = false
  }
}

async function loadKpi() {
  loadingKpi.value = true
  try {
    const { uid, password } = auth.getCredentials()
    kpi.value = await fetchKpiCounts(uid, password)
  } catch (e) {
    console.error('Errore KPI:', e)
  } finally {
    loadingKpi.value = false
  }
}

// ─── Selezione ────────────────────────────────────────────────────────────────

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else          selectedIds.value.push(id)
}

function toggleSelectAll() {
  if (allPageSelected.value) {
    pagedDaBollettare.value.forEach(p => {
      const idx = selectedIds.value.indexOf(p.id)
      if (idx >= 0) selectedIds.value.splice(idx, 1)
    })
  } else {
    pagedDaBollettare.value.forEach(p => {
      if (!isSelected(p.id)) selectedIds.value.push(p.id)
    })
  }
}

function clearSelection() { selectedIds.value = [] }

// ─── Azione: Prepara Spedizione ───────────────────────────────────────────────

async function runPreparaSpedizione() {
  if (!selectedIds.value.length) return
  const n = selectedIds.value.length
  if (!window.confirm(`Preparare la spedizione per ${n} pallet selezionat${n === 1 ? 'o' : 'i'}?`)) return

  actionLoading.value = true
  try {
    const { uid, password } = auth.getCredentials()

    // Crea wizard + valida picking
    const pickingId = await preparaSpedizione(uid, password, [...selectedIds.value])

    // Recupera il nome del picking
    let pickingName = null
    try {
      const { callModel } = await import('@/api/odoo-xmlrpc.js')
      const rows = await callModel(uid, password, 'stock.picking', 'read',
        [[pickingId]], { fields: ['name'] })
      pickingName = rows[0]?.name || null
    } catch { /* non bloccante */ }

    spedizioneResult.value = { count: n, pickingId, pickingName }
    selectedIds.value = []
    showToast(`Trasferimento ${pickingName || '#' + pickingId} creato per ${n} pallet`)
    await Promise.all([loadDaBollettare(), loadKpi()])

    // Apri subito il modal DDT
    await openDdtModal()
  } catch (e) {
    showToast('Errore: ' + e.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function openDdtModal() {
  showDdtModal.value   = true
  loadingTipi.value    = true
  selectedTypeId.value = null
  try {
    const { uid, password } = auth.getCredentials()
    tipiDdt.value = await fetchTipiDdt(uid, password)
    if (tipiDdt.value.length === 1) selectedTypeId.value = tipiDdt.value[0].id
  } catch (e) {
    showToast('Errore caricamento tipi DDT: ' + e.message, 'error')
  } finally {
    loadingTipi.value = false
  }
}

async function confermaDdt() {
  if (!selectedTypeId.value || creatingDdt.value) return
  const pickingId = spedizioneResult.value?.pickingId
  if (!pickingId) return

  creatingDdt.value = true
  try {
    const { uid, password } = auth.getCredentials()
    const ddt = await creaDdtDaPicking(uid, password, pickingId, selectedTypeId.value)
    showDdtModal.value = false
    spedizioneResult.value = { ...spedizioneResult.value, ddt }
    showToast(`DDT ${ddt.name} creato correttamente`)
  } catch (e) {
    showToast('Errore creazione DDT: ' + e.message, 'error')
  } finally {
    creatingDdt.value = false
  }
}

// ─── Auto-refresh ─────────────────────────────────────────────────────────────

function toggleAutoRefresh() { autoRefresh.value ? stopAutoRefresh() : startAutoRefresh() }

function startAutoRefresh() {
  autoRefresh.value = true; countdown.value = 60
  refreshTimer   = setInterval(() => { loadAll(); countdown.value = 60 }, 60000)
  countdownTimer = setInterval(() => { if (countdown.value > 0) countdown.value-- }, 1000)
}

function stopAutoRefresh() {
  autoRefresh.value = false
  clearInterval(refreshTimer); clearInterval(countdownTimer)
  refreshTimer = countdownTimer = null
}

// ─── Navigazione ─────────────────────────────────────────────────────────────

function goTab(tab, filter) {
  activeTab.value = tab
  if (tab === 'daBollettare') urgenzaFilter.value = filter
  if (tab === 'storico')      setStoricoFilter(filter)
}
function setStoricoFilter(f) { storicoFilter.value = f }

// ─── Color helpers ────────────────────────────────────────────────────────────

function urgencyLevel(p) {
  if (p.giorni_attesa > 3) return 'critico'
  if (p.giorni_attesa > 1) return 'attesa'
  return 'ok'
}
function urgencyLabel(p)     { return { critico: 'Critico', attesa: 'In attesa', ok: 'Recente' }[urgencyLevel(p)] }
function urgencyRowClass(p)  { return { critico: 'bg-red-50/60 hover:bg-red-50', attesa: 'bg-amber-50/50 hover:bg-amber-50', ok: 'hover:bg-slate-50' }[urgencyLevel(p)] }
function urgencyBadgeClass(p){ return { critico: 'bg-red-100 text-red-700', attesa: 'bg-amber-100 text-amber-700', ok: 'bg-slate-100 text-slate-600' }[urgencyLevel(p)] }
function urgencyDotClass(p)  { return { critico: 'bg-red-500', attesa: 'bg-amber-500', ok: 'bg-slate-400' }[urgencyLevel(p)] }
function giorniColor(p)      { return p.giorni_attesa > 3 ? 'text-red-600' : p.giorni_attesa > 1 ? 'text-amber-600' : 'text-slate-500' }
function storicoRowClass(p)  { return p.state === 'bollettato' ? 'hover:bg-emerald-50/40' : urgencyRowClass(p) }
function storicoStateBadge(p){ return p.state === 'bollettato' ? 'bg-emerald-100 text-emerald-700' : urgencyBadgeClass(p) }

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDatetime(dt) {
  if (!dt) return '—'
  const [date, time] = dt.split(' ')
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}${time ? ' ' + time.substring(0, 5) : ''}`
}
function formatQty(n) {
  if (n === null || n === undefined) return '—'
  return Number.isInteger(n)
    ? n.toLocaleString('it-IT')
    : n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
function showToast(message, type = 'success') {
  toast.value = { visible: true, message, type }
  setTimeout(() => { toast.value.visible = false }, 3500)
}
</script>

<style scoped>
.th { @apply px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap; }

.page-btn {
  @apply w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500
         hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed
         text-sm font-semibold transition-colors;
}

/* Toast */
.toast-enter-active { transition: all 0.2s ease-out; }
.toast-leave-active { transition: all 0.15s ease-in; }
.toast-enter-from   { transform: translateY(-0.5rem); opacity: 0; }
.toast-leave-to     { opacity: 0; }

/* Banner risultato / action bar */
.banner-enter-active, .slide-down-enter-active { transition: all 0.25s ease-out; }
.banner-leave-active, .slide-down-leave-active { transition: all 0.2s ease-in; }
.banner-enter-from, .slide-down-enter-from    { transform: translateY(-0.5rem); opacity: 0; }
.banner-leave-to, .slide-down-leave-to        { opacity: 0; }

/* Modal DDT */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to       { opacity: 0; }
</style>

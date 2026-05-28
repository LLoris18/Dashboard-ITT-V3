<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div class="card w-full max-w-lg">

      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">Conferma Richiesta al Magazzino</h2>
        <button @click="$emit('cancel')" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5">

        <!-- Riepilogo lotti -->
        <div>
          <p class="text-sm font-medium text-gray-700 mb-2">
            Lotti selezionati ({{ selectedLots.length }})
          </p>
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="max-h-48 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-gray-600">Lotto</th>
                    <th class="px-3 py-2 text-left font-medium text-gray-600">Prodotto</th>
                    <th class="px-3 py-2 text-right font-medium text-gray-600">Qtà</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="lot in selectedLots" :key="lot.id">
                    <td class="px-3 py-2 font-mono text-xs text-gray-900">{{ lot.lotName }}</td>
                    <td class="px-3 py-2 text-gray-600 text-xs">{{ lot.productName }}</td>
                    <td class="px-3 py-2 text-right text-gray-900">{{ lot.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Note -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Note
            <span class="text-gray-400 font-normal">(opzionale)</span>
          </label>
          <textarea
            v-model="notes"
            rows="3"
            class="form-input resize-none"
            placeholder="Es: lotto XYZ non trovato a magazzino, possibile errore di giacenza..."
          />
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button @click="$emit('cancel')" class="btn-secondary" :disabled="loading">
          Annulla
        </button>
        <button @click="confirm" class="btn-primary" :disabled="loading">
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? 'Invio in corso...' : 'Invia Richiesta' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  selectedLots: { type: Array, required: true },
  loading:      { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])

const notes = ref('')

function confirm() {
  emit('confirm', { notes: notes.value })
}
</script>

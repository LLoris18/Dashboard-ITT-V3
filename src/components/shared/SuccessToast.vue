<template>
  <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3
              bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium
              animate-slide-in max-w-sm">
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    {{ message }}
    <button @click="$emit('close')" class="ml-auto text-green-200 hover:text-white">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({ message: String })
defineEmits(['close'])
</script>

<style scoped>
@keyframes slide-in {
  from { transform: translateY(1rem); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.2s ease-out; }
</style>

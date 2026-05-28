<template>
  <span :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: { type: String, required: true },
})

const config = {
  draft:     { label: 'In attesa',         cls: 'badge-draft'     },
  taken:     { label: 'Presa in carico',   cls: 'badge-taken'     },
  preparing: { label: 'In preparazione',   cls: 'badge-preparing' },
  ready:     { label: 'Pronto Spedizione', cls: 'badge-ready'     },
  done:      { label: 'Spedita / Evasa',   cls: 'badge-done'      },
}

const label     = computed(() => config[props.state]?.label || props.state)
const badgeClass = computed(() => config[props.state]?.cls  || 'badge-draft')
</script>

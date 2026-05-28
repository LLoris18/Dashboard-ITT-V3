<template>
  <div id="app">
    <AppNavbar v-if="auth.isAuthenticated" />
    <main :class="auth.isAuthenticated ? 'pl-16 md:pl-56' : ''">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
import AppNavbar from '@/components/AppNavbar.vue'
const auth = useAuthStore()
</script>

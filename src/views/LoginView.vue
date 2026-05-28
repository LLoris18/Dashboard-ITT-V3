<template>
  <div class="min-h-screen flex items-center justify-center p-4" style="background-color:#F4F2ED;">

    <!-- Decorative background grain -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.025]"
      style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');
      background-size: 200px;"></div>

    <div class="w-full max-w-sm relative">

      <!-- Card -->
      <div class="rounded-2xl overflow-hidden" style="background:#fff; border:1px solid #E3DFD7; box-shadow:0 8px 32px rgba(26,23,20,0.10), 0 2px 8px rgba(26,23,20,0.06);">

        <!-- Top accent band -->
        <div class="h-1" style="background:linear-gradient(90deg, #D97706, #F59E0B, #FBB040);"></div>

        <div class="px-8 pt-8 pb-9">
          <!-- Icon + heading -->
          <div class="flex items-center gap-3 mb-7">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style="background-color:#1A1714;">
              <svg fill="none" stroke="#FBB040" viewBox="0 0 24 24" style="width:18px;height:18px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"/>
              </svg>
            </div>
            <div>
              <h1 class="font-bold tracking-tight" style="font-size:1.125rem;color:#1A1714;">Warehouse</h1>
              <p style="font-size:0.72rem;color:#A09890;margin-top:1px;">CDP Management · Odoo 14</p>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:600;color:#1A1714;margin-bottom:5px;">
                Username
              </label>
              <input v-model="form.username" type="text" placeholder="utente@azienda.com"
                autocomplete="username" class="input-field" :disabled="auth.loading" required />
            </div>

            <div>
              <label style="display:block;font-size:0.75rem;font-weight:600;color:#1A1714;margin-bottom:5px;">
                Password
              </label>
              <div class="relative">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••" autocomplete="current-password"
                  class="input-field pr-10" :disabled="auth.loading" required />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style="color:#A09890;"
                  onmouseover="this.style.color='#6B6460'" onmouseout="this.style.color='#A09890'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="auth.error"
              class="flex items-start gap-2 p-3 rounded-lg text-sm"
              style="background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;">
              <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ auth.error }}
            </div>

            <button type="submit" :disabled="auth.loading"
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style="background-color:#1A1714; margin-top:1.25rem;"
              onmouseover="if(!this.disabled)this.style.backgroundColor='#2D2A25'"
              onmouseout="this.style.backgroundColor='#1A1714'">
              <svg v-if="auth.loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ auth.loading ? 'Accesso in corso…' : 'Accedi' }}
            </button>
          </form>
        </div>
      </div>

      <p class="text-center mt-4" style="font-size:0.7rem;color:#A09890;">
        Warehouse Dashboard — CDP Management
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const auth   = useAuthStore()
const router = useRouter()
const form   = ref({ username: '', password: '' })
const showPassword = ref(false)

async function handleLogin() {
  try {
    await auth.doLogin(form.value.username, form.value.password)
    router.push('/lots')
  } catch { /* errore già in auth.error */ }
}
</script>

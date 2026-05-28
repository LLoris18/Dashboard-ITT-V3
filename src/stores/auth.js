/**
 * stores/auth.js
 * Store Pinia per la gestione autenticazione e ruoli.
 *
 * RUOLI:
 *   internal  → staff ITT (tutto visibile: fatturazione, dichiarazioni, jobs, BOM...)
 *   manager   → gestore magazzino (richieste CDP, verifica giacenze, jobs)
 *   external  → cliente/agente (solo richieste CDP proprie)
 *
 * Il ruolo viene determinato al login leggendo i gruppi Odoo dell'utente.
 * Per assegnare un ruolo: in Odoo → Impostazioni → Utenti → aggiungi il gruppo
 * corrispondente al gruppo "Warehouse / Interno ITT" (per internal),
 * "Warehouse / Gestore Magazzino" (per manager), "Warehouse / Richiedente" (external).
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, fetchUserInfo } from '@/api/odoo-service.js'

export const useAuthStore = defineStore('auth', () => {
  const uid      = ref(null)
  const password = ref(null)
  const user     = ref(null)
  const loading  = ref(false)
  const error    = ref(null)

  const isAuthenticated = computed(() => !!uid.value && !!user.value)
  const role            = computed(() => user.value?.role || 'external')
  const isInternal      = computed(() => role.value === 'internal')
  const isManager       = computed(() => role.value === 'manager' || role.value === 'internal')
  const userName        = computed(() => user.value?.name || '')

  /**
   * can(feature) — verifica se l'utente ha accesso a una funzionalità specifica.
   * Usato in template con v-if="auth.can('billing')" ecc.
   *
   * Features per ruolo:
   *   external:  'lots', 'my-requests'
   *   manager:   + 'manage-requests', 'verifica', 'jobs'
   *   internal:  + 'bom', 'billing', 'declarations'
   */
  const FEATURES = {
    'lots':            ['external', 'manager', 'internal'],
    'my-requests':     ['external', 'manager', 'internal'],
    'manage-requests': ['manager', 'internal'],
    'verifica':        ['manager', 'internal'],
    'jobs':            ['manager', 'internal'],
    'bom':             ['internal'],
    'billing':         ['internal'],
    'declarations':    ['internal'],
    'delivery-notes':       ['manager', 'internal'],
    'clf-produzione':       ['manager', 'internal'],
    'stock-delivery-note':  ['manager', 'internal'],
  }

  function can(feature) {
    const allowed = FEATURES[feature] || []
    return allowed.includes(role.value)
  }

  async function doLogin(username, pwd) {
    loading.value = true
    error.value   = null
    try {
      const newUid = await login(username, pwd)
      const info   = await fetchUserInfo(newUid, pwd)
      uid.value      = newUid
      password.value = pwd
      user.value     = info
    } catch (err) {
      error.value = err.message || 'Errore di autenticazione.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function doLogout() {
    uid.value = null; password.value = null; user.value = null; error.value = null
  }

  function getCredentials() {
    return { uid: uid.value, password: password.value }
  }

  return {
    uid, user, loading, error,
    isAuthenticated, role, isInternal, isManager, userName,
    can, doLogin, doLogout, getCredentials,
  }
})

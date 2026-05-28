import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const ODOO_TARGET = process.env.VITE_ODOO_URL || 'http://localhost:8069'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/web': { target: ODOO_TARGET, changeOrigin: true, secure: false },
      '/report': { target: ODOO_TARGET, changeOrigin: true, secure: false },
      '/xmlrpc': { target: ODOO_TARGET, changeOrigin: true, secure: false },
    },
  },
})

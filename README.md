# Warehouse Dashboard

Dashboard Vue.js per la gestione delle richieste di restituzione merce — Magazzino CDP / Odoo 14 CE.

## Setup

```bash
npm install
cp .env.example .env
# Compilare .env con VITE_ODOO_URL e VITE_ODOO_DB
npm run dev
```

## Build produzione
```bash
npm run build
# dist/ contiene i file statici da deployare
```

## Struttura progetto
```
src/
├── api/
│   ├── odoo-xmlrpc.js      # Client XML-RPC puro (serializzazione/deserializzazione)
│   └── odoo-service.js     # Livello servizio (logica di business + chiamate Odoo)
├── stores/
│   └── auth.js             # Store Pinia autenticazione
├── router/
│   └── index.js            # Vue Router con guardie ruolo
├── views/
│   ├── LoginView.vue       # Pagina login
│   ├── LotsView.vue        # Vista lotti CDP + creazione richiesta
│   ├── MyRequestsView.vue  # Storico richieste utente
│   └── ManageRequestsView.vue # Gestione richieste (solo manager)
├── components/
│   ├── AppNavbar.vue       # Barra navigazione
│   └── StatusBadge.vue     # Badge stato richiesta
└── assets/main.css         # Tailwind + classi globali
```

## Variabili d'ambiente
| Variabile | Descrizione |
|---|---|
| `VITE_ODOO_URL` | URL base Odoo (es. `https://odoo.miazienda.com`) |
| `VITE_ODOO_DB` | Nome del database Odoo |

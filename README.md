# Warehouse Dashboard — ITT × Ecocontrolgsm

Dashboard operativa **Vue 3** che si affaccia su un backend **Odoo 14 Community Edition** via **XML-RPC**, sviluppata per la gestione condivisa del magazzino ITT tra il personale amministrativo di **Ecocontrolgsm** (interfaccia con ITT) e il personale amministrativo di **ITT**.

L'applicazione sostituisce l'accesso diretto all'interfaccia web di Odoo con un'esperienza ad-hoc, ottimizzata per i flussi ricorrenti dei due stakeholder: giacenze, richieste di rientro lotti alla casa madre, generazione DDT, fatturazione elettronica e gestione delle dichiarazioni d'intento.

---

## Indice

- [Contesto e stakeholder](#contesto-e-stakeholder)
- [Funzionalità principali](#funzionalità-principali)
- [Stack tecnologico](#stack-tecnologico)
- [Architettura](#architettura)
- [Sistema di ruoli e permessi](#sistema-di-ruoli-e-permessi)
- [Client XML-RPC custom](#client-xml-rpc-custom)
- [Setup locale](#setup-locale)
- [Variabili d'ambiente](#variabili-dambiente)
- [Build di produzione](#build-di-produzione)
- [Struttura del repository](#struttura-del-repository)
- [Roadmap e miglioramenti pianificati](#roadmap-e-miglioramenti-pianificati)
- [Note](#note)

---

## Contesto e stakeholder

Il magazzino **CDP** ospita i pallet lavorati per conto di ITT. La dashboard è pensata per due profili operativi distinti che collaborano sullo stesso database Odoo:

- **Personale Ecocontrolgsm** — gestisce fisicamente il magazzino, evade le richieste di rientro, prepara le spedizioni e genera i DDT.
- **Personale ITT** — supervisiona le richieste di rientro, coordina la fatturazione elettronica, gestisce le dichiarazioni d'intento e monitora i flussi produttivi.

L'interfaccia rispecchia questa separazione tramite un sistema di ruoli granulare che nasconde le sezioni non pertinenti.

---

## Funzionalità principali

| Modulo | Descrizione | Ruoli abilitati |
|---|---|---|
| **Lotti CDP** | Visualizzazione delle giacenze di magazzino filtrate sul warehouse CDP, con vista lista o raggruppata per prodotto. | Tutti |
| **Richieste di rientro** | Creazione di richieste multi-lotto con priorità configurabile (`standard`, `priority`, `express`) e tempi di evasione stimati letti da `res.company`. | Tutti (creazione), Manager+ (gestione) |
| **Gestione Richieste** | Workflow di conferma / rifiuto / evasione delle richieste in ingresso. | Manager, Interno |
| **CLF Produzione** | Presa in carico dei pallet dal modello custom `cdp.pallet.staging`, preparazione spedizione (crea + valida picking) e generazione DDT con scelta della causale — tutto senza aprire wizard interattivi Odoo. | Manager, Interno |
| **DDT Spedizione** | Consultazione dei DDT emessi (`stock.delivery.note`, OCA `l10n_it_delivery_note`). | Manager, Interno |
| **Bolle Editabili** | Modifica righe DDT per operazioni di magazzino ricorrenti. | Manager, Interno |
| **Verifica giacenze da Excel** | Upload di un file Excel contenente lotti da verificare, con logica di normalizzazione dei codici (padding zeri) e riverifica dei lotti mancanti. | Manager, Interno |
| **Jobs** | Import batch di ordini di lavoro da template Excel (`job_template.xlsx`), esecuzione azioni bulk e associazione picking. | Manager, Interno |
| **BOM** | Import e consultazione delle distinte base per codice finito. | Interno ITT |
| **Fatturazione** | Generazione delle fatture elettroniche a partire da estratti Excel (ODA / logistica), inclusa la variante con **dichiarazione d'intento**, gestione righe, export XML. | Interno ITT |

---

## Stack tecnologico

- **Framework** — [Vue 3](https://vuejs.org/) con Composition API
- **State management** — [Pinia](https://pinia.vuejs.org/)
- **Routing** — [Vue Router 4](https://router.vuejs.org/) con guardie dinamiche basate su feature-flag
- **Styling** — [Tailwind CSS 3](https://tailwindcss.com/)
- **Build tool** — [Vite 5](https://vitejs.dev/)
- **HTTP** — `fetch` nativo verso l'endpoint XML-RPC Odoo (nessuna libreria XML-RPC di terze parti)
- **Backend integrato** — Odoo 14 Community Edition + moduli OCA (`l10n_it_delivery_note`) + moduli custom (`cdp.pallet.staging`, `warehouse.request`, campi custom su `res.company`)

---

## Architettura

L'app segue una separazione a **tre livelli** che disaccoppia trasporto, dominio e presentazione:

```
┌─────────────────────────────────────────────────────┐
│  Views (.vue)                                       │
│  Componenti Vue — solo UI, chiamano il service      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  odoo-service.js                                    │
│  Livello dominio — logica di business, mapping      │
│  campi Odoo → oggetti dashboard, orchestrazione     │
│  di più chiamate XML-RPC in sequenza                │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  odoo-xmlrpc.js                                     │
│  Client XML-RPC minimale — serializzazione,         │
│  deserializzazione, fetch HTTP, gestione fault      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
                  Odoo 14 CE
```

**Regola invalicabile**: le view non importano mai da `odoo-xmlrpc.js` direttamente. Ogni chiamata passa per `odoo-service.js`, che espone funzioni ad alto livello (`fetchCdpLots`, `createRequest`, `runVerification`, `createInvoicesIntent`…) restituendo strutture normalizzate.

Questo permette di:

- Cambiare backend (REST, GraphQL, mock) toccando un solo file.
- Testare la logica di dominio senza montare Vue.
- Mantenere le view sottili e focalizzate sulla presentazione.

---

## Sistema di ruoli e permessi

L'autenticazione è gestita da uno store Pinia (`stores/auth.js`) che al login legge i gruppi Odoo dell'utente e ne deriva un ruolo applicativo:

| Ruolo | Gruppo Odoo | Feature attive |
|---|---|---|
| `external` | Warehouse / Richiedente | `lots`, `my-requests` |
| `manager` | Warehouse / Gestore Magazzino | tutto di `external` + `manage-requests`, `verifica`, `jobs`, `delivery-notes`, `clf-produzione`, `stock-delivery-note` |
| `internal` | Warehouse / Interno ITT | tutto di `manager` + `bom`, `billing`, `declarations` |

I permessi sono espressi come **feature-flag** consumati sia dalle guardie di router che dai template:

```js
// router
{ path: '/fatturazione', meta: { requiresAuth: true, feature: 'billing' } }

// template
<RouterLink v-if="auth.can('billing')" to="/fatturazione">Fatturazione</RouterLink>
```

L'aggiunta di un nuovo modulo richiede solo una nuova chiave nel dizionario `FEATURES` — nessuna modifica sparsa nel codice.

---

## Client XML-RPC custom

Odoo 14 non espone REST out-of-the-box: la comunicazione ufficiale passa per **XML-RPC**. Le librerie JavaScript XML-RPC esistenti sono pensate per Node e portano dipendenze pesanti nel bundle browser.

`src/api/odoo-xmlrpc.js` è un client XML-RPC **scritto da zero in ~170 righe**, che implementa il sottoinsieme necessario del protocollo:

- **Serializzazione** ricorsiva verso XML (`<int>`, `<double>`, `<boolean>`, `<string>` con escape, `<array>`, `<struct>`).
- **Deserializzazione** basata su `DOMParser` nativo del browser — nessuna dipendenza XML esterna.
- **Gestione dei fault**: le eccezioni Odoo (`<fault>`) diventano `Error` JavaScript con `faultCode` e `faultString`.
- **API pubblica** ridotta a due sole funzioni: `authenticate(username, password)` e `callModel(uid, password, model, method, args, kwargs)`.

Il risultato è un bundle finale privo di dipendenze XML e un layer di trasporto completamente sotto controllo, utile per debug e evoluzione futura verso JSON-RPC.

---

## Setup locale

**Prerequisiti**: Node.js ≥ 18, accesso a un'istanza Odoo 14 CE con i moduli custom installati.

```bash
npm install
cp .env.example .env
# Compilare .env con VITE_ODOO_URL e VITE_ODOO_DB
npm run dev
```

Il dev-server Vite gira su `http://localhost:5173` e proxy-a `/xmlrpc`, `/web` e `/report` verso l'istanza Odoo configurata (vedi `vite.config.js`), evitando problemi di CORS in sviluppo.

---

## Variabili d'ambiente

| Variabile | Descrizione | Esempio |
|---|---|---|
| `VITE_ODOO_URL` | URL base dell'istanza Odoo | `https://odoo.miazienda.com` |
| `VITE_ODOO_DB` | Nome del database Odoo | `production_db` |

Le credenziali dell'utente non vengono mai messe in ambiente: sono inserite al login e mantenute in memoria nello store Pinia per la durata della sessione (nessuna persistenza su `localStorage`).

---

## Build di produzione

```bash
npm run build
# I file statici in dist/ sono servibili da qualunque static host.
```

## Deploy

L'applicazione è pubblicata su **Cloudflare Pages**, con il bundle `dist/` distribuito sulla rete edge di Cloudflare. La scelta è motivata da:

- **Zero infrastruttura da gestire** — nessun VM o container da mantenere per un'app 100% statica lato client.
- **CDN globale integrata** — asset serviti dal PoP più vicino all'utente, TLS gestito automaticamente.
- **Preview per branch** — ogni push su una branch genera un URL di preview isolato, utile per validare modifiche prima del merge su `main`.
- **Piano free adeguato al volume** — l'utenza interna dei due stakeholder rientra abbondantemente nei limiti gratuiti.

La comunicazione col backend Odoo avviene direttamente dal browser verso l'istanza Odoo (protetta da login), quindi non è necessario un layer Workers custom per il proxy XML-RPC. Se in futuro servirà nascondere l'endpoint Odoo o aggiungere caching/rate-limiting, la stessa app può essere fronted da un **Cloudflare Worker** che espone un endpoint neutro e inoltra le chiamate.

---

## Struttura del repository

```
src/
├── api/
│   ├── odoo-xmlrpc.js         # Client XML-RPC minimale
│   ├── odoo-service.js        # Livello di dominio principale
│   ├── clfProduzione.js       # Servizio dominio: pallet staging + DDT
│   ├── deliveryNotes.js       # Servizio dominio: bolle modificabili
│   └── stockDeliveryNote.js   # Servizio dominio: DDT stock
├── stores/
│   └── auth.js                # Store Pinia — autenticazione, ruoli, feature-flag
├── router/
│   └── index.js               # Router + guardie basate su feature
├── views/                     # Una view per feature (Lots, Fatturazione, …)
├── components/
│   ├── AppNavbar.vue          # Sidebar navigazione con filtro ruolo
│   ├── StatusBadge.vue
│   ├── lots/RequestModal.vue
│   └── shared/                # Componenti riusati fra view
├── assets/main.css            # Direttive Tailwind + classi globali
├── App.vue
└── main.js

claude/                        # Briefing tecnici sui modelli Odoo custom
public/
```

---

## Roadmap e miglioramenti pianificati

Aree già identificate come opportunità di refactoring / evoluzione:

- **Aggiungere `.gitignore`** — attualmente `dist/` e `node_modules/` finirebbero versionati.
- **Persistenza sessione** — valutare `sessionStorage` cifrato per evitare il logout al refresh, senza compromettere la sicurezza delle credenziali.
- **Consolidamento view richieste** — `RequestsView`, `AllRequestsView`, `MyRequestsView`, `ManageRequestsView` presentano overlap: da razionalizzare in un'unica view configurabile via prop / slot.
- **Estrazione componenti** — `FatturazioneView.vue` (>2000 LoC) e `DeliveryNotesView.vue` (>1000 LoC) andrebbero spezzati in sub-componenti per tab / step.
- **Test unitari** sul livello service (`odoo-service.js`), attualmente coperto solo da test manuali end-to-end.
- **Type safety** — introdurre TypeScript almeno sul layer API/service, dove i contratti con Odoo sono più fragili.
- **Migrazione a JSON-RPC** — Odoo espone anche `/web/dataset/call_kw` in JSON, più compatto e diagnosticamente più semplice di XML-RPC.
- **CI** — pipeline GitHub Actions per lint + build su ogni PR.
- **Skeleton screen / suspense** — sostituire gli spinner sparsi con placeholder coerenti.

---

## Note

Questo repository è un progetto **applicativo verticale**: non è pensato per essere riutilizzato standalone perché dipende da moduli Odoo custom (`cdp.pallet.staging`, `warehouse.request`, campi aggiuntivi su `res.company`) installati sul backend dell'organizzazione. È pubblicato a scopo di portfolio per documentare architettura, scelte tecniche e organizzazione del codice.

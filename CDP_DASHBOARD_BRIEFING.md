# CDP Dashboard - Briefing per Claude Code

## Contesto

Applicazione Angular/Ionic connessa a Odoo 14 Community Edition via XML-RPC.
Questo documento descrive il modello `cdp.pallet.staging` e tutte le
operazioni disponibili, da integrare in una dashboard Vue.js senza
toccare il backend Odoo.

---

## Modello principale: `cdp.pallet.staging`

Registro parallelo dei pallet prodotti. Non gestisce giacenze (quelle
restano su stock.quant/stock.move): traccia solo il ciclo di vita
del pallet dalla produzione alla bollettazione.

### Campi

| Campo | Tipo | Descrizione |
|---|---|---|
| `id` | Integer | ID record |
| `lot_id` | Many2one (stock.production.lot) | Lotto associato |
| `product_id` | Many2one (product.product) | Prodotto (related da lot_id) |
| `default_code` | Char | Codice prodotto (related da product_id) |
| `product_qty` | Float | Quantita prodotta |
| `uom_id` | Many2one (uom.uom) | Unita di misura |
| `data_produzione` | Datetime | Data e ora produzione (readonly) |
| `data_bollettazione` | Datetime | Data e ora bollettazione (readonly) |
| `giorni_attesa` | Integer | Giorni da data_produzione se state=prodotto (computed) |
| `state` | Selection | prodotto oppure bollettato |
| `picking_id` | Many2one (stock.picking) | Trasferimento/DDT associato |
| `workorder_id` | Many2one (mrp.workorder) | Ordine di lavoro (opzionale) |
| `production_id` | Many2one (mrp.production) | Ordine di produzione (related) |
| `note` | Char | Note libere |

### Stati

- `prodotto`: pallet prodotto dal palmare, in attesa di bollettazione
- `bollettato`: DDT emesso, picking_id e data_bollettazione compilati

---

## Chiamate XML-RPC disponibili

Tutte le chiamate seguono il pattern standard Odoo XML-RPC:

```javascript
// Connessione base (adattare al pattern esistente nell'app)
const result = await models.execute_kw(
  db, uid, password,
  model, method, args, kwargs
)
```

---

### 1. Lettura pallet da bollettare

```javascript
// Tutti i pallet in attesa (state = prodotto)
const pallets = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_read',
  [[['state', '=', 'prodotto']]],
  {
    fields: [
      'id',
      'lot_id',
      'product_id',
      'default_code',
      'product_qty',
      'uom_id',
      'data_produzione',
      'giorni_attesa',
      'state',
      'workorder_id',
      'note',
    ],
    order: 'data_produzione desc',
  }
)
```

### 2. Lettura storico completo (tutti gli stati)

```javascript
const storico = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_read',
  [[]],
  {
    fields: [
      'id',
      'lot_id',
      'product_id',
      'default_code',
      'product_qty',
      'uom_id',
      'data_produzione',
      'data_bollettazione',
      'giorni_attesa',
      'state',
      'picking_id',
      'workorder_id',
      'note',
    ],
    order: 'data_produzione desc',
    limit: 200,
  }
)
```

### 3. Lettura pallet bollettati oggi

```javascript
const oggi = new Date()
oggi.setHours(0, 0, 0, 0)
const oggiStr = oggi.toISOString().replace('T', ' ').substring(0, 19)

const bollettatiOggi = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_read',
  [[
    ['state', '=', 'bollettato'],
    ['data_bollettazione', '>=', oggiStr],
  ]],
  {
    fields: [
      'id',
      'lot_id',
      'product_id',
      'default_code',
      'product_qty',
      'uom_id',
      'data_bollettazione',
      'picking_id',
    ],
    order: 'data_bollettazione desc',
  }
)
```

### 4. Lettura pallet in attesa critica (oltre 3 giorni)

```javascript
const treGiorniFa = new Date()
treGiorniFa.setDate(treGiorniFa.getDate() - 3)
const treGiorniFaStr = treGiorniFa.toISOString().replace('T', ' ').substring(0, 19)

const critici = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_read',
  [[
    ['state', '=', 'prodotto'],
    ['data_produzione', '<=', treGiorniFaStr],
  ]],
  {
    fields: [
      'id',
      'lot_id',
      'product_id',
      'default_code',
      'product_qty',
      'uom_id',
      'data_produzione',
      'giorni_attesa',
    ],
    order: 'giorni_attesa desc',
  }
)
```

### 5. Registra un nuovo pallet (chiamata dal palmare)

```javascript
// Metodo pubblico esposto via XML-RPC
const newId = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'registra_pallet',
  [{
    lot_id: lotId,           // int, obbligatorio
    product_qty: qty,        // float, obbligatorio
    workorder_id: woId,      // int, opzionale
    note: nota,              // string, opzionale
  }]
)
// Restituisce l'id del record creato
```

### 6. Contatori per la dashboard (KPI)

```javascript
// Numero pallet da bollettare
const countDaBollettare = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_count',
  [[['state', '=', 'prodotto']]]
)

// Numero pallet in attesa critica (oltre 3 giorni)
const countCritici = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_count',
  [[
    ['state', '=', 'prodotto'],
    ['data_produzione', '<=', treGiorniFaStr],
  ]]
)

// Numero pallet bollettati oggi
const countOggi = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_count',
  [[
    ['state', '=', 'bollettato'],
    ['data_bollettazione', '>=', oggiStr],
  ]]
)
```

---

## Logica colori per la dashboard

Replicare la stessa logica della vista list Odoo:

| Condizione | Colore |
|---|---|
| `state == 'bollettato'` | Verde |
| `state == 'prodotto'` e `giorni_attesa > 3` | Rosso |
| `state == 'prodotto'` e `giorni_attesa > 1` | Giallo/Arancio |
| `state == 'prodotto'` e `giorni_attesa <= 1` | Neutro |

---

## Struttura suggerita per la dashboard

### KPI cards (in cima)
- Pallet da bollettare (numero totale, colore neutro)
- In attesa critica >3 giorni (numero, colore rosso)
- Bollettati oggi (numero, colore verde)

### Tabella principale: pallet da bollettare
Colonne: Codice prodotto | Lotto | Quantita | UdM | Data produzione | Giorni attesa | Note
Filtri rapidi: Tutti | Urgenti (>3gg) | Oggi

### Sezione storico (collassabile o tab separato)
Colonne: Codice prodotto | Lotto | Quantita | Data produzione | Data bollettazione | DDT
Filtro default: bollettati oggi

---

## Note tecniche importanti

- Il modello NON ha mail.thread: niente chatter o log messaggi
- `giorni_attesa` e' un campo computed non storato: viene ricalcolato
  ad ogni lettura, non filtrabile con operatori numerici diretti su DB.
  Per filtrare per giorni attesa usare il filtro su `data_produzione`
  come mostrato negli esempi sopra.
- `picking_id` quando presente contiene il riferimento al trasferimento
  Odoo. Per aprire il DDT associato dall'app usare l'id del picking
  per navigare alla schermata stock.delivery.note correlata.
- Il metodo `registra_pallet` e' un `@api.model`: non richiede un id
  esistente, si chiama come una create normale via execute_kw.
- Tutti i campi Many2one vengono restituiti da search_read come array
  `[id, display_name]`, esempio: `lot_id: [42, 'LOT-0001']`

---

## Relazione con altri modelli utili per la dashboard

### stock.production.lot (per dettagli lotto)
```javascript
const lotDetail = await models.execute_kw(
  db, uid, password,
  'stock.production.lot',
  'read',
  [[lotId]],
  { fields: ['name', 'product_id', 'ref', 'product_qty'] }
)
```

### stock.picking (per dettagli DDT/trasferimento)
```javascript
const pickingDetail = await models.execute_kw(
  db, uid, password,
  'stock.picking',
  'read',
  [[pickingId]],
  { fields: ['name', 'state', 'date_done', 'partner_id'] }
)
```


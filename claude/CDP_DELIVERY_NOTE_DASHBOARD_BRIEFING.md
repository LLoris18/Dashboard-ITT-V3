# stock.delivery.note - Briefing per Dashboard Vue.js

## Contesto

Modulo: `l10n_it_delivery_note` (OCA, Odoo 14 Community)
Modello: `stock.delivery.note`
Tutte le chiamate sono via XML-RPC standard Odoo.

---

## Schema campi utili per la dashboard

### Campi identificativi e stato

| Campo | Tipo | Valori / Note |
|---|---|---|
| `id` | Integer | ID record |
| `name` | Char | Numero DDT (es. DDT/00957ES) |
| `state` | Selection | draft, confirm, invoiced, done, cancel |
| `date` | Date | Data DDT |
| `create_date` | Datetime | Data creazione |
| `write_date` | Datetime | Ultima modifica |
| `active` | Boolean | Archiviato o meno |

### Campi partner

| Campo | Tipo | Note |
|---|---|---|
| `partner_id` | Many2one (res.partner) | Destinatario, obbligatorio |
| `partner_sender_id` | Many2one (res.partner) | Mittente |
| `partner_shipping_id` | Many2one (res.partner) | Indirizzo spedizione |
| `partner_ref` | Char | Referenza contatto |

### Campi tipo e causale

| Campo | Tipo | Note |
|---|---|---|
| `type_id` | Many2one (stock.delivery.note.type) | Tipo DDT, obbligatorio |
| `type_code` | Selection | Tipo operazione (computed) |
| `picking_type` | Selection | incoming, outgoing, internal, mrp_operation |
| `transport_reason_id` | Many2one (stock.picking.transport.reason) | Causale trasporto |
| `transport_method_id` | Many2one (stock.picking.transport.method) | Metodo trasporto |
| `transport_condition_id` | Many2one (stock.picking.transport.condition) | Condizione trasporto |
| `transport_datetime` | Datetime | Data/ora trasporto |
| `delivery_method_id` | Many2one (delivery.carrier) | Metodo consegna |
| `carrier_id` | Many2one (res.partner) | Vettore |

### Campi fisici spedizione

| Campo | Tipo | Note |
|---|---|---|
| `packages` | Integer | Numero colli |
| `gross_weight` | Float | Peso lordo |
| `gross_weight_uom_id` | Many2one (uom.uom) | UdM peso lordo |
| `net_weight` | Float | Peso netto |
| `net_weight_uom_id` | Many2one (uom.uom) | UdM peso netto |
| `volume` | Float | Volume |
| `volume_uom_id` | Many2one (uom.uom) | UdM volume |
| `goods_appearance_id` | Many2one (stock.picking.goods.appearance) | Aspetto beni |

### Campi relazionali

| Campo | Tipo | Note |
|---|---|---|
| `picking_ids` | One2many (stock.picking) | Prelievi collegati (uno per DDT nel vostro caso) |
| `pickings_picker` | Many2many (stock.picking) | Campo raccoglitore UI (non usare per logica) |
| `line_ids` | One2many (stock.delivery.note.line) | Righe DDT |
| `invoice_ids` | Many2many (account.move) | Fatture collegate |
| `sale_ids` | Many2many (sale.order) | Ordini vendita collegati |

### Campi stampa e note

| Campo | Tipo | Note |
|---|---|---|
| `note` | HTML | Nota interna |
| `print_prices` | Boolean | Mostra prezzi su stampa |
| `show_product_information` | Boolean | Mostra info prodotto |

---

## Stati DDT

| Valore | Etichetta | Colore suggerito |
|---|---|---|
| `draft` | Bozza | Grigio |
| `confirm` | Validato | Blu |
| `invoiced` | Fatturato | Viola |
| `done` | Completato | Verde |
| `cancel` | Annullato | Rosso |

---

## Modello righe: `stock.delivery.note.line`

Le righe del DDT sono nel modello separato `stock.delivery.note.line`,
collegato tramite `line_ids`. Campi principali:

```javascript
// Lettura righe di un DDT specifico
const lines = await models.execute_kw(
  db, uid, password,
  'stock.delivery.note.line',
  'search_read',
  [[['delivery_note_id', '=', dnId]]],
  {
    fields: [
      'id',
      'delivery_note_id',
      'product_id',
      'product_qty',
      'product_uom_id',
      'lot_ids',
      'price_unit',
      'discount',
      'tax_ids',
    ]
  }
)
```

---

## Chiamate XML-RPC per la dashboard

### 1. Lista DDT con filtri

```javascript
// Tutti i DDT non annullati, ordinati per data desc
const ddtList = await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'search_read',
  [[['state', '!=', 'cancel'], ['active', '=', true]]],
  {
    fields: [
      'id',
      'name',
      'state',
      'date',
      'partner_id',
      'partner_sender_id',
      'type_id',
      'transport_reason_id',
      'packages',
      'gross_weight',
      'picking_ids',
      'invoice_status',
      'write_date',
    ],
    order: 'date desc, name desc',
    limit: 100,
  }
)
```

### 2. DDT singolo con tutti i dettagli

```javascript
const ddt = await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'read',
  [[dnId]],
  {
    fields: [
      'id',
      'name',
      'state',
      'date',
      'partner_id',
      'partner_sender_id',
      'partner_shipping_id',
      'partner_ref',
      'type_id',
      'transport_reason_id',
      'transport_method_id',
      'transport_condition_id',
      'transport_datetime',
      'carrier_id',
      'delivery_method_id',
      'goods_appearance_id',
      'packages',
      'gross_weight',
      'gross_weight_uom_id',
      'net_weight',
      'net_weight_uom_id',
      'volume',
      'volume_uom_id',
      'note',
      'print_prices',
      'picking_ids',
      'line_ids',
      'invoice_ids',
      'invoice_status',
      'can_change_number',
    ]
  }
)
```

### 3. Filtri comuni utili

```javascript
// Solo bozze
const bozze = [['state', '=', 'draft']]

// Solo validati (pronti per spedizione)
const validati = [['state', '=', 'confirm']]

// DDT di oggi
const oggi = new Date().toISOString().substring(0, 10)
const diOggi = [['date', '=', oggi]]

// DDT di un partner specifico
const delPartner = [['partner_id', '=', partnerId]]

// DDT con picking collegato specifico
const delPicking = [['picking_ids', 'in', [pickingId]]]

// Combinazione: validati di oggi
const validatiOggi = [
  ['state', '=', 'confirm'],
  ['date', '=', oggi],
]
```

### 4. Contatori KPI

```javascript
const [
  countBozze,
  countValidati,
  countOggi,
  countDaFatturare,
] = await Promise.all([

  models.execute_kw(db, uid, password,
    'stock.delivery.note', 'search_count',
    [[['state', '=', 'draft']]]
  ),

  models.execute_kw(db, uid, password,
    'stock.delivery.note', 'search_count',
    [[['state', '=', 'confirm']]]
  ),

  models.execute_kw(db, uid, password,
    'stock.delivery.note', 'search_count',
    [[['date', '=', oggi], ['state', '!=', 'cancel']]]
  ),

  models.execute_kw(db, uid, password,
    'stock.delivery.note', 'search_count',
    [[['invoice_status', '=', 'to invoice'], ['state', '=', 'confirm']]]
  ),

])
```

### 5. Modifica campi (write)

```javascript
// Aggiornamento campi fisici (colli, peso, note)
await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'write',
  [
    [dnId],
    {
      packages: 10,
      gross_weight: 250.5,
      net_weight: 230.0,
      note: '<p>Nota aggiornata</p>',
      transport_datetime: '2024-01-15 08:00:00',
    }
  ]
)
```

### 6. Azioni stato (chiamate a metodi)

```javascript
// Conferma/Valida il DDT (draft -> confirm)
await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'action_confirm',
  [[dnId]]
)

// Annulla il DDT
await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'action_cancel',
  [[dnId]]
)
```

### 7. Stampa PDF del DDT

La stampa in Odoo avviene tramite il report QWeb `stock.delivery.note_report`.
Da frontend la URL diretta per scaricare il PDF e':

```javascript
// URL diretta per download PDF (richiede sessione autenticata)
const pdfUrl = `${odooBaseUrl}/report/pdf/stock.delivery.note_report/${dnId}`

// Apertura in nuova tab
window.open(pdfUrl, '_blank')

// Oppure download via fetch con sessione autenticata
const response = await fetch(pdfUrl, {
  method: 'GET',
  credentials: 'include', // include cookie sessione Odoo
})
const blob = await response.blob()
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `DDT_${dnName}.pdf`
a.click()
URL.revokeObjectURL(url)
```

---

## Struttura suggerita per la sezione DDT nella dashboard

### KPI cards
- Bozze in attesa (colore grigio)
- Validati oggi (colore blu)
- Da fatturare (colore arancio)

### Tabella lista DDT
Colonne: Numero DDT | Data | Destinatario | Causale | Colli | Peso | Stato | Azioni

Azioni per riga:
- Icona occhio: apre dettaglio
- Icona stampa: scarica PDF direttamente
- Icona matita: apre form modifica (solo se state = draft o confirm)

### Form dettaglio/modifica DDT
Sezioni:
1. Intestazione: numero, data, stato, destinatario, mittente
2. Trasporto: causale, metodo, condizione, vettore, data trasporto
3. Fisico: colli, peso lordo, peso netto, volume, aspetto beni
4. Righe: tabella prodotti con quantita e lotti
5. Note: campo HTML editabile
6. Picking collegato: link al trasferimento Odoo

### Bottoni azioni (condizionali per stato)
- `draft`: Valida DDT, Elimina
- `confirm`: Stampa PDF, Annulla, Correggi Bolla (custom CDP)
- `done`: Stampa PDF (readonly)
- `cancel`: (nessuna azione)

---

## Note tecniche importanti

- I Many2one tornano come array `[id, display_name]`:
  `partner_id: [16, 'ITT Termoli']`
- I One2many (`line_ids`, `picking_ids`) tornano come array di ID:
  `line_ids: [101, 102, 103]` — fare una seconda chiamata read per i dettagli
- Il campo `note` e' HTML: usare `v-html` in Vue per renderizzarlo,
  sanitizzare prima di scrivere
- `can_change_number` indica se il numero DDT e' ancora modificabile
- `pickings_picker` e' un campo UI di Odoo, non usarlo per logica:
  usare `picking_ids` (One2many) che e' la relazione reale
- La stampa PDF richiede una sessione Odoo autenticata attiva:
  se l'app usa XML-RPC con sessione separata verificare che i cookie
  siano condivisi, altrimenti usare l'endpoint `/report/pdf/` con
  autenticazione basic o token
- Il campo `invoice_status` e' computed: non e' filtrabile direttamente
  con tutti gli operatori, preferire i filtri su `state`

---

## Relazione con cdp.pallet.staging

Per collegare la vista DDT con il modello CDP staging:

```javascript
// Dato un picking_id del DDT, trova i pallet staging associati
const stagingRecords = await models.execute_kw(
  db, uid, password,
  'cdp.pallet.staging',
  'search_read',
  [[['picking_id', 'in', pickingIds]]],
  {
    fields: [
      'id',
      'lot_id',
      'product_id',
      'default_code',
      'product_qty',
      'uom_id',
      'state',
      'data_bollettazione',
    ]
  }
)
```

Questo permette di mostrare nel dettaglio DDT anche i pallet
CDP staging ad esso associati, con il loro stato di bollettazione.


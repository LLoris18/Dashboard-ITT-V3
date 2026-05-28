# CDP - Prepara Spedizione e DDT - Briefing per Dashboard Vue.js

## Obiettivo

Dalla dashboard Vue.js l'utente deve poter:
1. Selezionare uno o piu pallet dal modello cdp.pallet.staging
2. Cliccare "Prepara spedizione" che crea e valida automaticamente
   il picking (stock.picking) senza interazione
3. Scegliere la causale DDT e creare il DDT (stock.delivery.note)
   collegato al picking appena creato
4. Visualizzare il DDT risultante nella dashboard

Nessun wizard interattivo Odoo viene aperto: tutto avviene via
chiamate XML-RPC in sequenza dalla dashboard.

---

## Flusso completo step by step

### STEP 1 - Selezione pallet
L'utente seleziona uno o piu record cdp.pallet.staging con
state = 'prodotto' dalla tabella della dashboard.
Raccogliere gli id selezionati in un array: [id1, id2, id3, ...]

### STEP 2 - Prepara spedizione (crea e valida il picking)
Chiamare il metodo action_prepara_spedizione sul modello
cdp.pallet.staging passando gli id selezionati.
Questo metodo apre un wizard (cdp.prepara.spedizione.wizard)
che va istanziato e confermato programmaticamente.

### STEP 3 - Scelta causale DDT
Mostrare all'utente un dropdown con le causali disponibili
(stock.delivery.note.type) e far scegliere.

### STEP 4 - Creazione DDT
Creare il DDT collegandolo al picking appena validato.

### STEP 5 - Conferma DDT
Confermare il DDT con action_confirm.

### STEP 6 - Aggiornamento UI
Ricaricare la lista pallet staging e mostrare il DDT creato.

---

## Implementazione XML-RPC dettagliata

### STEP 2 - Creazione e validazione picking

Il wizard cdp.prepara.spedizione.wizard accetta in ingresso
gli id dei pallet staging e internamente:
- recupera i quant Odoo tramite i lot_id
- crea il picking con le move line
- valida il picking
- aggiorna state dei record staging a 'bollettato'

```javascript
// 2a. Crea il wizard passando i pallet selezionati
const wizardId = await models.execute_kw(
  db, uid, password,
  'cdp.prepara.spedizione.wizard',
  'create',
  [{
    pallet_ids: [[6, 0, palletIds]], // palletIds = [id1, id2, ...]
  }]
)

// 2b. Conferma il wizard: crea e valida il picking automaticamente
// ATTENZIONE: action_conferma restituisce un dict con res_model e res_id
// che punta al picking appena creato (stock.picking)
const actionResult = await models.execute_kw(
  db, uid, password,
  'cdp.prepara.spedizione.wizard',
  'action_conferma',
  [[wizardId]]
)

// 2c. Estrai l'id del picking dal risultato
// actionResult e' un dict tipo:
// { type: 'ir.actions.act_window', res_model: 'stock.picking', res_id: 123, ... }
const pickingId = actionResult.res_id
```

### STEP 3 - Carica le causali DDT disponibili

```javascript
const tipiDdt = await models.execute_kw(
  db, uid, password,
  'stock.delivery.note.type',
  'search_read',
  [[['active', '=', true]]],
  {
    fields: ['id', 'name', 'sequence'],
    order: 'sequence asc, name asc',
  }
)
// Mostrare in un <select> o modal all'utente
// Esempio risposta: [{ id: 1, name: 'DDT Vendita' }, { id: 2, name: 'DDT Reso' }]
```

### STEP 4 - Crea il DDT collegato al picking

```javascript
// typeId = id scelto dall'utente al STEP 3
const dnId = await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'create',
  [{
    type_id: typeId,
    picking_ids: [[4, pickingId]], // collega il picking al DDT
    // I campi partner_id, transport_reason_id ecc. vengono
    // ereditati automaticamente dal picking da Odoo.
    // Se vuoi precompilarli recuperali prima dal picking (vedi sotto).
  }]
)
```

### STEP 4b - Alternativa: precompila i campi dal picking

Se vuoi che il DDT erediti partner e altri campi dal picking:

```javascript
// Prima leggi i campi del picking
const picking = await models.execute_kw(
  db, uid, password,
  'stock.picking',
  'read',
  [[pickingId]],
  {
    fields: [
      'id',
      'name',
      'partner_id',
      'transport_reason_id',
      'transport_method_id',
      'transport_condition_id',
      'transport_datetime',
      'carrier_id',
      'delivery_method_id',
      'gross_weight',
      'net_weight',
    ]
  }
)
const p = picking[0]

// Poi crea il DDT con i campi precompilati
const dnId = await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'create',
  [{
    type_id: typeId,
    picking_ids: [[4, pickingId]],
    partner_id: p.partner_id ? p.partner_id[0] : false,
    transport_reason_id: p.transport_reason_id
      ? p.transport_reason_id[0] : false,
    transport_method_id: p.transport_method_id
      ? p.transport_method_id[0] : false,
    transport_condition_id: p.transport_condition_id
      ? p.transport_condition_id[0] : false,
    transport_datetime: p.transport_datetime || false,
    carrier_id: p.carrier_id ? p.carrier_id[0] : false,
    gross_weight: p.gross_weight || 0.0,
    net_weight: p.net_weight || 0.0,
  }]
)
```

### STEP 5 - Conferma il DDT

```javascript
await models.execute_kw(
  db, uid, password,
  'stock.delivery.note',
  'action_confirm',
  [[dnId]]
)
```

### STEP 6 - Leggi il DDT creato per mostrarlo nella dashboard

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
      'type_id',
      'transport_reason_id',
      'packages',
      'gross_weight',
      'net_weight',
      'picking_ids',
      'line_ids',
      'invoice_status',
    ]
  }
)
```

---

## Flusso completo in una funzione Vue.js

```javascript
async function preparaSpedizione(palletIds, onProgressUpdate) {

  // STEP 2a - Crea wizard
  onProgressUpdate('Creazione trasferimento...')
  const wizardId = await models.execute_kw(
    db, uid, password,
    'cdp.prepara.spedizione.wizard',
    'create',
    [{ pallet_ids: [[6, 0, palletIds]] }]
  )

  // STEP 2b - Conferma wizard (crea e valida picking)
  const actionResult = await models.execute_kw(
    db, uid, password,
    'cdp.prepara.spedizione.wizard',
    'action_conferma',
    [[wizardId]]
  )
  const pickingId = actionResult.res_id
  if (!pickingId) {
    throw new Error('Errore nella creazione del trasferimento.')
  }

  return pickingId
}

async function creaeDDT(pickingId, typeId) {

  // STEP 4 - Crea DDT
  const dnId = await models.execute_kw(
    db, uid, password,
    'stock.delivery.note',
    'create',
    [{
      type_id: typeId,
      picking_ids: [[4, pickingId]],
    }]
  )

  // STEP 5 - Conferma DDT
  await models.execute_kw(
    db, uid, password,
    'stock.delivery.note',
    'action_confirm',
    [[dnId]]
  )

  // STEP 6 - Leggi DDT
  const result = await models.execute_kw(
    db, uid, password,
    'stock.delivery.note',
    'read',
    [[dnId]],
    {
      fields: [
        'id', 'name', 'state', 'date',
        'partner_id', 'type_id',
        'picking_ids', 'line_ids',
      ]
    }
  )

  return result[0]
}
```

---

## Modello stock.picking - campi utili per la dashboard

Dalla panoramica del modello, i campi rilevanti per il contesto CDP:

| Campo | Tipo | Note |
|---|---|---|
| `id` | Integer | ID record |
| `name` | Char | Riferimento (es. CLV/PROD/00302) |
| `state` | Selection | draft, waiting, confirmed, assigned, done, cancel |
| `date_done` | Datetime | Data validazione |
| `picking_type_id` | Many2one | Tipo operazione (id=69 per CDP) |
| `location_id` | Many2one (stock.location) | Ubicazione origine |
| `location_dest_id` | Many2one (stock.location) | Ubicazione destinazione |
| `partner_id` | Many2one (res.partner) | Contatto |
| `origin` | Char | Documento origine |
| `is_locked` | Boolean | Bloccato dopo validazione |
| `move_lines` | One2many (stock.move) | Movimenti di magazzino |
| `move_line_ids` | One2many (stock.move.line) | Operazioni dettaglio |
| `delivery_note_id` | Many2one (stock.delivery.note) | DDT collegato |
| `delivery_note_exists` | Boolean | True se ha un DDT |
| `delivery_note_state` | Selection | Stato del DDT collegato |
| `x_cdp_dn_data` | Char | Campo CDP: dati correzione bolla (tecnico) |
| `x_consegna` | Char | Campo custom: Consegna N. |
| `x_n_lotti` | Integer | Campo custom: Numero Lotti |
| `x_tipo_trasferimento` | Selection | consegna oppure job |

### Stati picking

| Valore | Etichetta |
|---|---|
| `draft` | Bozza |
| `waiting` | In attesa di altra operazione |
| `confirmed` | In attesa |
| `assigned` | Pronto |
| `done` | Completato |
| `cancel` | Annullato |

---

## Lettura move line per dettaglio picking

```javascript
// Dettaglio operazioni di un picking (con lotti)
const moveLines = await models.execute_kw(
  db, uid, password,
  'stock.move.line',
  'search_read',
  [[['picking_id', '=', pickingId]]],
  {
    fields: [
      'id',
      'product_id',
      'lot_id',
      'qty_done',
      'product_uom_qty',
      'product_uom_id',
      'location_id',
      'location_dest_id',
    ]
  }
)
```

---

## Gestione errori comuni

```javascript
// Verifica che tutti i pallet selezionati siano in stato 'prodotto'
const invalid = palletIds.filter(id => {
  const pallet = pallets.find(p => p.id === id)
  return pallet && pallet.state !== 'prodotto'
})
if (invalid.length > 0) {
  throw new Error(
    'Alcuni pallet selezionati sono gia bollettati. ' +
    'Seleziona solo pallet con stato "Prodotto".'
  )
}

// Verifica risposta wizard dopo action_conferma
if (!actionResult || !actionResult.res_id) {
  throw new Error(
    'Il trasferimento non e stato creato correttamente. ' +
    'Risposta ricevuta: ' + JSON.stringify(actionResult)
  )
}
```

---

## Sequenza UI suggerita per il componente Vue

```
[Tabella pallet staging]
  Checkbox multipli per selezione
        |
        | Selezione >= 1 pallet con state='prodotto'
        v
[Bottone "Prepara spedizione" attivo]
        |
        | Click
        v
[Loading: "Creazione trasferimento in corso..."]
        |
        | picking creato e validato (STEP 2)
        v
[Modal "Scegli causale DDT"]
  Select con tipiDdt caricati da search_read
  Bottone "Crea DDT" | Bottone "Annulla"
        |
        | Conferma con typeId scelto
        v
[Loading: "Creazione DDT in corso..."]
        |
        | DDT creato e confermato (STEP 4+5)
        v
[Notifica successo]
  "DDT DDT/00958ES creato correttamente"
  [Vedi DDT] -> apre dettaglio DDT nella dashboard
        |
        v
[Tabella pallet aggiornata]
  I pallet selezionati ora hanno state='bollettato'
```

---

## Note tecniche importanti

- Il metodo `action_conferma` del wizard restituisce un
  `ir.actions.act_window` dict. Il picking id e' in `res_id`.
  Non aprire la finestra Odoo: estrarre solo `res_id` e continuare.

- I Many2one tornano come array `[id, display_name]`:
  `partner_id: [16, 'ITT Termoli']` -> usare `[0]` per l'id.

- Dopo `action_conferma` i record cdp.pallet.staging selezionati
  vengono automaticamente aggiornati a state='bollettato' dal wizard.
  Non serve aggiornare lo staging manualmente.

- Il picking creato dal wizard ha gia state='done' (validato).
  Non serve chiamare button_validate dalla dashboard.

- `delivery_note_exists` su stock.picking e' un campo computed booleano
  utile per sapere se un picking ha gia un DDT senza fare join.

- I campi `x_consegna`, `x_n_lotti`, `x_tipo_trasferimento` sono
  campi custom presenti nel vostro ambiente: possono essere mostrati
  nel dettaglio picking se utili per il contesto operativo.


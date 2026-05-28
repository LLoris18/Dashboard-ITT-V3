/**
 * odoo-service.js
 * Livello di servizio: wrappa le chiamate XML-RPC con la logica di business.
 * Tutte le componenti Vue importano da qui, non da odoo-xmlrpc direttamente.
 */

import { authenticate, callModel } from './odoo-xmlrpc.js'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(username, password) {
  const uid = await authenticate(username, password)
  return uid
}

// ---------------------------------------------------------------------------
// Lotti — solo magazzino CDP
// ---------------------------------------------------------------------------

/**
 * Recupera tutti i lotti del magazzino CDP con quantità e ubicazione.
 * Strategia:
 *  1. Trova l'ID del magazzino CDP tramite stock.warehouse
 *  2. Recupera le quant (stock.quant) filtrate per quel magazzino
 *  3. Torna i dati normalizzati
 */
export async function fetchCdpLots(uid, password) {
  // 1. Trova tutte le location interne del magazzino CDP
  //    (il magazzino CDP ha una view_location_id che contiene tutte le sue ubicazioni)
  const warehouses = await callModel(uid, password, 'stock.warehouse', 'search_read',
    [[['code', '=', 'CDP']]],
    { fields: ['id', 'name', 'lot_stock_id', 'view_location_id'], limit: 1 }
  )

  if (!warehouses || warehouses.length === 0) {
    throw new Error('Magazzino CDP non trovato. Verificare il codice magazzino in Odoo.')
  }

  const cdpWarehouse = warehouses[0]
  // view_location_id è la location radice del magazzino CDP
  const rootLocationId = cdpWarehouse.view_location_id[0]

  // 2. Recupera tutti i lotti con quantità > 0 nelle location figlie di CDP
  //    Usiamo stock.quant che ha la relazione diretta lotto + location + quantità
  const quants = await callModel(uid, password, 'stock.quant', 'search_read',
    [[
      ['location_id.complete_name', 'ilike', cdpWarehouse.view_location_id[1]],
      ['location_id.usage', '=', 'internal'],
      ['lot_id', '!=', false],
      ['quantity', '>', 0],
    ]],
    {
      fields: [
        'lot_id',
        'product_id',
        'location_id',
        'quantity',
        'reserved_quantity',
      ],
      order: 'product_id asc, lot_id asc',
    }
  )

  // 3. Normalizza i dati per la dashboard e filtra solo qty disponibile > 0
  return quants
    .map(q => ({
      quantId:      q.id,
      lotId:        q.lot_id[0],
      lotName:      q.lot_id[1],
      productId:    q.product_id[0],
      productName:  q.product_id[1],
      locationId:   q.location_id[0],
      locationName: q.location_id[1],
      quantity:     q.quantity,
      availableQty: q.quantity - (q.reserved_quantity || 0),
    }))
    .filter(l => l.availableQty > 0)
}

/**
 * Cerca lotti per numero lotto o codice/nome prodotto.
 * Il filtraggio avviene lato client sui dati già caricati (più reattivo).
 */
export function filterLots(lots, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return lots
  const term = searchTerm.trim().toLowerCase()
  return lots.filter(lot =>
    lot.lotName.toLowerCase().includes(term) ||
    lot.productName.toLowerCase().includes(term)
  )
}

/**
 * Raggruppa i lotti per prodotto.
 * @returns {Array} array di { productId, productName, lots[] }
 */
export function groupLotsByProduct(lots) {
  const map = new Map()
  for (const lot of lots) {
    if (!map.has(lot.productId)) {
      map.set(lot.productId, {
        productId:   lot.productId,
        productName: lot.productName,
        lots:        [],
      })
    }
    map.get(lot.productId).lots.push(lot)
  }
  return Array.from(map.values())
}

// ---------------------------------------------------------------------------
// Configurazione spedizioni — res.company
// ---------------------------------------------------------------------------

/**
 * Legge i tempi di spedizione configurati sull'azienda Odoo.
 * Campi attesi su res.company: shipping_time_standard, shipping_time_priority, shipping_time_express
 */
export async function fetchShippingTimes(uid, password) {
  try {
    // Legge prima la company dell'utente corrente
    const users = await callModel(uid, password, 'res.users', 'read',
      [[uid]], { fields: ['company_id'] }
    )
    const companyId = users[0]?.company_id?.[0]
    if (!companyId) return { standard: '', priority: '', express: '' }

    const companies = await callModel(uid, password, 'res.company', 'read',
      [[companyId]],
      { fields: ['shipping_time_standard', 'shipping_time_priority', 'shipping_time_express'] }
    )
    if (!companies || companies.length === 0) return { standard: '', priority: '', express: '' }

    return {
      standard: companies[0].shipping_time_standard || '',
      priority: companies[0].shipping_time_priority || '',
      express:  companies[0].shipping_time_express  || '',
    }
  } catch (e) {
    console.warn('[fetchShippingTimes] Impossibile leggere i tempi di spedizione:', e.message)
    return { standard: '', priority: '', express: '' }
  }
}

// ---------------------------------------------------------------------------
// Richieste — warehouse.request
// ---------------------------------------------------------------------------

/**
 * Crea una nuova richiesta dalla dashboard.
 * @param {number[]} lotIds       — array di ID lotti Odoo (stock.production.lot)
 * @param {string}   notes        — note libere
 * @param {Array}    manualLots   — lotti non presenti in Odoo: [{ lot_code, product_name, notes }]
 * @param {string}   deliveryMode — 'standard' | 'priority' | 'express'
 */
export async function createRequest(uid, password, lotIds, notes = '', manualLots = [], deliveryMode = 'standard') {
  const result = await callModel(uid, password, 'warehouse.request', 'create_from_dashboard',
    [lotIds, notes || false, manualLots.length > 0 ? manualLots : false],
    { delivery_mode: deliveryMode }
  )
  return result
}

/**
 * Recupera le richieste dell'utente corrente con dettaglio lotti.
 */
export async function fetchMyRequests(uid, password) {
  const requests = await callModel(uid, password, 'warehouse.request', 'search_read',
    [[['user_id', '=', uid]]],
    {
      fields: [
        'name', 'request_date', 'state', 'lot_ids', 'manual_lot_ids',
        'notes', 'lot_count', 'manual_lot_count', 'picking_id',
        'delivery_mode', 'estimated_shipping_time',
        'tempo_evasione', 'lead_time',
      ],
      order: 'request_date desc',
    }
  )

  // Arricchisci con i nomi dei lotti (lot_ids contiene solo ID)
  const allLotIds = [...new Set(requests.flatMap(r => r.lot_ids || []))]
  let lotNamesById = {}
  if (allLotIds.length > 0) {
    try {
      const lots = await callModel(uid, password, 'stock.production.lot', 'read',
        [allLotIds], { fields: ['id', 'name'] }
      )
      lots.forEach(l => { lotNamesById[l.id] = l.name })
    } catch (e) {
      console.warn('[fetchMyRequests] Impossibile leggere nomi lotti:', e.message)
    }
  }

  return requests.map(r => ({
    ...r,
    lot_names: (r.lot_ids || []).map(id => lotNamesById[id] || `#${id}`),
  }))
}

/**
 * Recupera TUTTE le richieste (solo per i gestori magazzino).
 */
export async function fetchAllRequests(uid, password) {
  return callModel(uid, password, 'warehouse.request', 'search_read',
    [[]],
    {
      fields: ['name', 'request_date', 'state', 'lot_ids', 'notes', 'lot_count', 'user_id', 'partner_id'],
      order: 'request_date desc',
    }
  )
}

/**
 * Aggiorna lo stato di una richiesta (solo gestori).
 * @param {'action_take_charge'|'action_start_preparing'|'action_mark_done'} action
 */
export async function updateRequestState(uid, password, requestId, action) {
  return callModel(uid, password, 'warehouse.request', action,
    [[requestId]]
  )
}

// ---------------------------------------------------------------------------
// Utente — info e gruppi
// ---------------------------------------------------------------------------

/**
 * Recupera i dati dell'utente autenticato e verifica i suoi gruppi.
 */
export async function fetchUserInfo(uid, password) {
  const users = await callModel(uid, password, 'res.users', 'read',
    [[uid]],
    { fields: ['name', 'email', 'groups_id', 'partner_id'] }
  )
  if (!users || users.length === 0) throw new Error('Utente non trovato.')
  const user = users[0]

  const groups = await callModel(uid, password, 'res.groups', 'read',
    [user.groups_id],
    { fields: ['full_name', 'category_id'] }
  )

  const fullNames = groups.map(g => g.full_name || '')

  // Ruoli (dal più privilegiato al meno):
  // internal  → staff ITT interno (fatturazione, jobs, BOM, dichiarazioni, tutto)
  // manager   → gestore magazzino (richieste CDP, verifica, jobs)
  // external  → cliente/agente (solo richieste CDP proprie)
  const isInternal = fullNames.some(n => n.includes('Interno ITT') || n.includes('Administration') || n.includes('Settings'))
  const isManager  = fullNames.some(n => n.includes('Gestore Magazzino'))
  const isUser     = fullNames.some(n => n.includes('Richiedente'))

  // Admins Odoo sono sempre internal
  const isAdmin = fullNames.some(n => n.includes('Access Rights') || n.includes('Technical') || n.includes('Extra Rights'))

  const role = (isInternal || isAdmin) ? 'internal'
             : isManager               ? 'manager'
             : 'external'

  return {
    uid:        user.id,
    name:       user.name,
    email:      user.email,
    partnerId:  user.partner_id?.[0] || null,
    role,
    isInternal: role === 'internal',
    isManager:  role === 'manager' || role === 'internal',
    isUser:     true, // tutti gli utenti autenticati possono usare la dashboard
  }
}

/**
 * Invia un'email di sollecito al gestore magazzino per una richiesta.
 * Usa mail.mail di Odoo per inviare la notifica.
 */
export async function sendSollecito(uid, password, request) {
  // Odoo @api.model riceve args come lista posizionale:
  // execute_kw(..., 'action_send_sollecito_rpc', [request_id])
  // → il metodo Python riceve (self, request_id) — un solo argomento extra
  return callModel(uid, password, 'warehouse.request', 'action_send_sollecito_rpc',
    [request.id]
  )
}

/**
 * Verifica disponibilità lotti da file Excel (bridge verso d365_itt_verifiche).
 * @param {number} uid
 * @param {string} password
 * @param {string} fileB64  - contenuto del file .xlsx in base64
 * @param {string} filename - nome originale del file (per log/display)
 * @returns {Promise<{verification_date, total, found, missing, lines[]}>}
 */
export async function runVerification(uid, password, fileB64, filename = '') {
  return callModel(
    uid, password,
    'warehouse.request',
    'run_verification_rpc',
    [fileB64, filename]
  )
}

// ============================================================================
// BOM — Distinte Base (warehouse.bom.line)
// ============================================================================

/**
 * Importa tutte le righe BOM su Odoo (sostituisce i record esistenti).
 * @param {Array} rows  - array di oggetti riga BOM
 * @param {string} filename
 */
export async function importBom(uid, password, rows, filename = '') {
  return callModel(uid, password, 'warehouse.bom.line', 'import_bom_rpc',
    [rows, filename]
  )
}

/**
 * Recupera le righe BOM per un dato cod_finito (ricerca ilike).
 * Se codFinito è vuoto restituisce solo i metadati.
 * @returns {{ meta, lines }}
 */
export async function fetchBom(uid, password, codFinito = '') {
  return callModel(uid, password, 'warehouse.bom.line', 'fetch_bom_rpc',
    [codFinito]
  )
}


// ============================================================================
// JOBS — ddt.itt.job.batch / ddt.itt.job / stock.picking
// ============================================================================

/** Importa righe Excel → crea batch + record ddt.itt.job */
export async function importJobExcel(uid, password, rows, filename = '') {
  return callModel(uid, password, 'warehouse.request', 'import_job_rpc', [rows, filename])
}

/** Lista batch (storico) con stats */
export async function fetchJobBatches(uid, password, limit = 50) {
  return callModel(uid, password, 'warehouse.request', 'fetch_job_batches_rpc', [limit])
}

/** Righe ddt.itt.job di un batch */
export async function fetchJobRows(uid, password, batchId) {
  return callModel(uid, password, 'warehouse.request', 'fetch_job_rows_rpc', [batchId])
}

/** Esegue azione server "Prepara Job V1 - Loris" sul batch */
export async function runJobAction(uid, password, batchId) {
  return callModel(uid, password, 'warehouse.request', 'run_job_action_rpc', [batchId])
}

/** Recupera picking + move lines + detailed ops creati dall'azione sul batch */
export async function fetchJobPicking(uid, password, batchId) {
  return callModel(uid, password, 'warehouse.request', 'fetch_job_picking_rpc', [batchId])
}

// ============================================================================
// FATTURAZIONE (account.move)
// ============================================================================

/** Recupera l'ultimo numero fattura dell'anno corrente */
export async function getInvoiceLastNumber(uid, password) {
  return callModel(uid, password, 'warehouse.request', 'get_invoice_last_number_rpc', [])
}

/** Crea fatture ODA (da report mensile multi-foglio) */
export async function createInvoicesOda(uid, password, invoicesData) {
  return callModel(uid, password, 'warehouse.request', 'create_invoices_oda_rpc', [invoicesData])
}

/** Crea fatture Logistica (da report settimanali) */
export async function createInvoicesLogistics(uid, password, invoicesData) {
  return callModel(uid, password, 'warehouse.request', 'create_invoices_logistics_rpc', [invoicesData])
}

/** Recupera fatture cliente con filtri opzionali */
export async function fetchInvoices(uid, password, filters = {}) {
  return callModel(uid, password, 'warehouse.request', 'fetch_invoices_rpc', [filters])
}

/** Lista partner clienti */
export async function fetchPartners(uid, password) {
  return callModel(uid, password, 'warehouse.request', 'fetch_partners_rpc', [])
}

/** Recupera dettaglio completo fattura + righe */
export async function fetchInvoiceDetail(uid, password, moveId) {
  return callModel(uid, password, 'warehouse.request', 'fetch_invoice_detail_rpc', [parseInt(moveId)])
}

/** Esegue azione su fattura: post | draft | cancel | write */
export async function invoiceAction(uid, password, moveId, action, vals = null) {
  return callModel(uid, password, 'warehouse.request', 'invoice_action_rpc',
    [parseInt(moveId), action, vals || false])
}

/** CRUD righe fattura */
export async function updateInvoiceLines(uid, password, moveId, operations) {
  return callModel(uid, password, 'warehouse.request', 'update_invoice_lines_rpc',
    [parseInt(moveId), operations])
}

/** Genera/recupera XML FatturaPA, restituisce base64 */
export async function exportInvoiceXml(uid, password, moveId) {
  return callModel(uid, password, 'warehouse.request', 'export_invoice_xml_rpc', [parseInt(moveId)])
}

/** Recupera dichiarazioni d'intento */
export async function fetchDeclarations(uid, password) {
  return callModel(uid, password, 'warehouse.request', 'fetch_declarations_rpc', [])
}

/** Crea fatture con dichiarazione d'intento (script v3) */
export async function createInvoicesIntent(uid, password, invoicesData, cfg) {
  return callModel(uid, password, 'warehouse.request', 'create_invoices_intent_rpc', [invoicesData, cfg])
}

/** Crea fatture Logistica con Dichiarazione d'intento (script logistics_v2) */
export async function createInvoicesLogisticsIntent(uid, password, invoicesData, cfg) {
  return callModel(uid, password, 'warehouse.request',
    'create_invoices_logistics_intent_rpc', [invoicesData, cfg])
}


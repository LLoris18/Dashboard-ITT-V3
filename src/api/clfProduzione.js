/**
 * clfProduzione.js
 * API layer per cdp.pallet.staging (Odoo 14).
 */

import { callModel } from './odoo-xmlrpc.js'

// ─── Helpers date ─────────────────────────────────────────────────────────────

function todayStartStr() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

function daysAgoStr(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

const FIELDS_BASE = [
  'id', 'lot_id', 'product_id', 'default_code',
  'product_qty', 'uom_id', 'data_produzione',
  'giorni_attesa', 'state', 'workorder_id', 'note',
]

const FIELDS_STORICO = [
  ...FIELDS_BASE,
  'data_bollettazione', 'picking_id',
]

// ─── Pallet da bollettare ─────────────────────────────────────────────────────

export async function fetchPalletsDaBollettare(uid, password) {
  return callModel(uid, password, 'cdp.pallet.staging', 'search_read',
    [[['state', '=', 'prodotto']]],
    { fields: FIELDS_BASE, order: 'data_produzione asc' }
  )
}

// ─── Storico completo ─────────────────────────────────────────────────────────

export async function fetchPalletsStorico(uid, password, filter = 'oggi') {
  const domain = []
  if (filter === 'oggi') {
    domain.push(['data_bollettazione', '>=', todayStartStr()])
  } else if (filter === '7gg') {
    domain.push(['data_produzione', '>=', daysAgoStr(7)])
  }
  // filter === 'tutti' → dominio vuoto

  return callModel(uid, password, 'cdp.pallet.staging', 'search_read',
    [domain],
    { fields: FIELDS_STORICO, order: 'data_produzione desc', limit: 300 }
  )
}

// ─── KPI counts ───────────────────────────────────────────────────────────────

export async function fetchKpiCounts(uid, password) {
  const [daBollettare, critici, oggi] = await Promise.all([
    callModel(uid, password, 'cdp.pallet.staging', 'search_count',
      [[['state', '=', 'prodotto']]]
    ),
    callModel(uid, password, 'cdp.pallet.staging', 'search_count',
      [[['state', '=', 'prodotto'], ['data_produzione', '<=', daysAgoStr(3)]]]
    ),
    callModel(uid, password, 'cdp.pallet.staging', 'search_count',
      [[['state', '=', 'bollettato'], ['data_bollettazione', '>=', todayStartStr()]]]
    ),
  ])
  return { daBollettare, critici, oggi }
}

// ─── Registra pallet (da palmare / manuale) ───────────────────────────────────

export async function registraPallet(uid, password, { lot_id, product_qty, workorder_id, note }) {
  return callModel(uid, password, 'cdp.pallet.staging', 'registra_pallet',
    [{ lot_id, product_qty, workorder_id: workorder_id || false, note: note || '' }]
  )
}

// ─── Azione server: prepara spedizione via wizard ────────────────────────────

/**
 * Crea il wizard cdp.prepara.spedizione.wizard con i pallet selezionati,
 * chiama action_conferma e restituisce l'ID del picking (stock.picking).
 * Il wizard crea e valida il picking e aggiorna i pallet a state='bollettato'.
 */
export async function preparaSpedizione(uid, password, palletIds) {
  const wizardId = await callModel(uid, password, 'cdp.prepara.spedizione.wizard', 'create',
    [{ pallet_ids: [[6, 0, palletIds]] }]
  )
  const actionResult = await callModel(uid, password, 'cdp.prepara.spedizione.wizard',
    'action_conferma', [[wizardId]]
  )
  if (!actionResult || !actionResult.res_id) {
    throw new Error('Trasferimento non creato. Risposta: ' + JSON.stringify(actionResult))
  }
  return actionResult.res_id
}

// ─── DDT da picking ──────────────────────────────────────────────────────────

/** Carica i tipi DDT attivi (stock.delivery.note.type) */
export async function fetchTipiDdt(uid, password) {
  return callModel(uid, password, 'stock.delivery.note.type', 'search_read',
    [[['active', '=', true]]],
    { fields: ['id', 'name', 'sequence'], order: 'sequence asc, name asc' }
  )
}

/**
 * Crea il DDT collegato al picking, lo conferma e restituisce il record DDT.
 * Legge prima il picking per ereditare partner_id e altri campi obbligatori.
 */
export async function creaDdtDaPicking(uid, password, pickingId, typeId) {
  // Leggi il picking per pre-compilare i campi DDT
  const pickings = await callModel(uid, password, 'stock.picking', 'read',
    [[pickingId]],
    {
      fields: [
        'partner_id', 'transport_reason_id', 'transport_method_id',
        'transport_condition_id', 'transport_datetime', 'carrier_id',
        'gross_weight', 'net_weight',
      ],
    }
  )
  const p = pickings[0] || {}

  const partnerId = Array.isArray(p.partner_id) ? p.partner_id[0] : (p.partner_id || false)

  const vals = {
    type_id:              typeId,
    picking_ids:          [[4, pickingId]],
    partner_id:           partnerId,
    partner_shipping_id:  partnerId,
  }

  if (Array.isArray(p.transport_reason_id) && p.transport_reason_id[0])
    vals.transport_reason_id = p.transport_reason_id[0]
  if (Array.isArray(p.transport_method_id) && p.transport_method_id[0])
    vals.transport_method_id = p.transport_method_id[0]
  if (Array.isArray(p.transport_condition_id) && p.transport_condition_id[0])
    vals.transport_condition_id = p.transport_condition_id[0]
  if (p.transport_datetime)
    vals.transport_datetime = p.transport_datetime
  if (Array.isArray(p.carrier_id) && p.carrier_id[0])
    vals.carrier_id = p.carrier_id[0]
  if (p.gross_weight) vals.gross_weight = p.gross_weight
  if (p.net_weight)   vals.net_weight   = p.net_weight

  const dnId = await callModel(uid, password, 'stock.delivery.note', 'create', [vals])

  // action_confirm esegue correttamente ma può restituire None (non serializzabile
  // da XML-RPC con allow_none=False). L'operazione è avvenuta: ignoriamo l'errore.
  try {
    await callModel(uid, password, 'stock.delivery.note', 'action_confirm', [[dnId]])
  } catch (e) {
    if (!e.message || !e.message.includes('cannot marshal None')) throw e
  }

  // Usa search_read (più tollerante di read sui campi None) per leggere il DDT
  const rows = await callModel(uid, password, 'stock.delivery.note', 'search_read',
    [[['id', '=', dnId]]],
    { fields: ['id', 'name', 'state', 'date', 'partner_id', 'type_id', 'picking_ids'] }
  )
  return rows[0] || { id: dnId, name: 'DDT #' + dnId, state: 'confirm', picking_ids: [pickingId] }
}

// ─── Export helper date (riutilizzato nella view) ─────────────────────────────

export { daysAgoStr, todayStartStr }

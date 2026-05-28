/**
 * stockDeliveryNote.js
 * API layer per stock.delivery.note (l10n_it_delivery_note, Odoo 14 Community).
 */

import { callModel, ODOO_URL, ODOO_DB } from './odoo-xmlrpc.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

// ─── Fields ───────────────────────────────────────────────────────────────────

const FIELDS_LIST = [
  'id', 'name', 'state', 'date',
  'partner_id', 'partner_sender_id',
  'type_id', 'transport_reason_id',
  'packages', 'gross_weight',
  'picking_ids', 'write_date',
]

const FIELDS_DETAIL = [
  'id', 'name', 'state', 'date',
  'partner_id', 'partner_sender_id', 'partner_shipping_id', 'partner_ref',
  'type_id', 'transport_reason_id', 'transport_method_id',
  'transport_condition_id', 'transport_datetime', 'carrier_id', 'delivery_method_id',
  'goods_appearance_id',
  'packages', 'gross_weight', 'gross_weight_uom_id',
  'net_weight', 'net_weight_uom_id',
  'volume', 'volume_uom_id',
  'note', 'print_prices',
  'picking_ids', 'line_ids', 'invoice_ids',
  'can_change_number',
]

const FIELDS_LINES = [
  'id', 'delivery_note_id', 'product_id', 'product_qty',
  'product_uom_id', 'price_unit', 'discount',
]

// ─── Tipi DDT ─────────────────────────────────────────────────────────────────

export async function fetchDDTTypes(uid, password) {
  return callModel(uid, password, 'stock.delivery.note.type', 'search_read',
    [[]],
    { fields: ['id', 'name', 'code'], order: 'name asc' }
  )
}

// ─── Causali trasporto ────────────────────────────────────────────────────────

export async function fetchTransportReasons(uid, password) {
  return callModel(uid, password, 'stock.picking.transport.reason', 'search_read',
    [[]],
    { fields: ['id', 'name'], order: 'name asc' }
  )
}

// ─── Lista DDT ────────────────────────────────────────────────────────────────

export async function fetchDDTList(uid, password, filters = {}) {
  const domain = [['active', '=', true]]

  if (filters.state && filters.state !== 'all') {
    domain.push(['state', '=', filters.state])
  }
  if (filters.dateFrom) {
    domain.push(['date', '>=', filters.dateFrom])
  }
  if (filters.dateTo) {
    domain.push(['date', '<=', filters.dateTo])
  }
  if (filters.partnerId) {
    domain.push(['partner_id', '=', filters.partnerId])
  }
  if (filters.search) {
    domain.push(['name', 'ilike', filters.search])
  }

  return callModel(uid, password, 'stock.delivery.note', 'search_read',
    [domain],
    { fields: FIELDS_LIST, order: 'date desc, name desc', limit: 500 }
  )
}

// ─── Dettaglio DDT ───────────────────────────────────────────────────────────

export async function fetchDDT(uid, password, id) {
  const results = await callModel(uid, password, 'stock.delivery.note', 'read',
    [[id]],
    { fields: FIELDS_DETAIL }
  )
  return results[0] || null
}

export async function fetchDDTLines(uid, password, lineIds) {
  if (!lineIds || lineIds.length === 0) return []
  return callModel(uid, password, 'stock.delivery.note.line', 'read',
    [lineIds],
    { fields: FIELDS_LINES }
  )
}

// ─── Crea DDT ─────────────────────────────────────────────────────────────────

export async function createDDT(uid, password, data) {
  const vals = _buildVals(data)
  return callModel(uid, password, 'stock.delivery.note', 'create', [vals])
}

// ─── Aggiorna DDT ────────────────────────────────────────────────────────────

export async function updateDDT(uid, password, id, data) {
  const vals = _buildVals(data)
  return callModel(uid, password, 'stock.delivery.note', 'write', [[id], vals])
}

function _buildVals(data) {
  const vals = {}

  if (data.date !== undefined)               vals.date = data.date
  if (data.type_id !== undefined)            vals.type_id = data.type_id || false
  if (data.transport_reason_id !== undefined) vals.transport_reason_id = data.transport_reason_id || false
  if (data.transport_datetime !== undefined) vals.transport_datetime = data.transport_datetime || false
  if (data.partner_id !== undefined)         vals.partner_id = data.partner_id || false
  if (data.partner_sender_id !== undefined)  vals.partner_sender_id = data.partner_sender_id || false
  if (data.partner_shipping_id !== undefined) vals.partner_shipping_id = data.partner_shipping_id || false
  if (data.partner_ref !== undefined)        vals.partner_ref = data.partner_ref || ''
  if (data.carrier_id !== undefined)         vals.carrier_id = data.carrier_id || false
  if (data.packages !== undefined)           vals.packages = data.packages || 0
  if (data.gross_weight !== undefined)       vals.gross_weight = data.gross_weight || 0
  if (data.net_weight !== undefined)         vals.net_weight = data.net_weight || 0
  if (data.volume !== undefined)             vals.volume = data.volume || 0
  if (data.note !== undefined)               vals.note = data.note || ''
  if (data.print_prices !== undefined)       vals.print_prices = data.print_prices

  return vals
}

// ─── Azioni workflow ─────────────────────────────────────────────────────────

export async function confirmDDT(uid, password, id) {
  return callModel(uid, password, 'stock.delivery.note', 'action_confirm', [[id]])
}

export async function cancelDDT(uid, password, id) {
  return callModel(uid, password, 'stock.delivery.note', 'action_cancel', [[id]])
}

export async function doneDDT(uid, password, id) {
  return callModel(uid, password, 'stock.delivery.note', 'action_done', [[id]])
}

export async function draftDDT(uid, password, id) {
  return callModel(uid, password, 'stock.delivery.note', 'action_draft', [[id]])
}

// ─── KPI ─────────────────────────────────────────────────────────────────────

export async function fetchDDTKpi(uid, password) {
  const oggi = todayStr()
  const [bozze, validati, daFatturare] = await Promise.all([
    callModel(uid, password, 'stock.delivery.note', 'search_count',
      [[['state', '=', 'draft'], ['active', '=', true]]]
    ),
    callModel(uid, password, 'stock.delivery.note', 'search_count',
      [[['state', '=', 'confirm'], ['date', '=', oggi], ['active', '=', true]]]
    ),
    callModel(uid, password, 'stock.delivery.note', 'search_count',
      [[['state', '=', 'confirm'], ['active', '=', true]]]
    ),
  ])
  return { bozze, validati, daFatturare }
}

// ─── Picking → DDT ────────────────────────────────────────────────────────────

/**
 * Legge i campi utili di una stock.picking per pre-popolare il form DDT.
 */
export async function fetchPickingForDDT(uid, password, pickingId) {
  const results = await callModel(uid, password, 'stock.picking', 'read',
    [[pickingId]],
    { fields: ['id', 'name', 'partner_id', 'scheduled_date', 'origin', 'state', 'picking_type_id'] }
  )
  return results[0] || null
}

/**
 * Collega un DDT a una picking scrivendo delivery_note_ids sulla stock.picking.
 * Non si scrive picking_ids sul DDT perché è un campo computed/relazionale inverso.
 */
export async function linkPickingToDDT(uid, password, pickingId, ddtId) {
  return callModel(uid, password, 'stock.picking', 'write',
    [[pickingId], { delivery_note_ids: [[4, ddtId]] }]
  )
}

// ─── Sessione web Odoo (helper condiviso) ─────────────────────────────────────
// render_qweb_pdf e /web/export/* richiedono sessione web (cookie), non XML-RPC.
// Strategia: login via XML-RPC → session/authenticate JSON-RPC con
// credentials:'include' → browser deposita il cookie per il dominio Odoo.
// In dev il proxy Vite (/web, /report, /xmlrpc → ODOO_URL) elimina il problema
// CORS e rende il cookie same-origin.

const REPORT_NAME = 'l10n_it_delivery_note.delivery_note_report_main_template'

const EXPORT_FIELDS = [
  { name: 'name',                     label: 'Numero DDT' },
  { name: 'date',                     label: 'Data' },
  { name: 'state',                    label: 'Stato' },
  { name: 'partner_id',               label: 'Destinatario' },
  { name: 'partner_sender_id',        label: 'Mittente' },
  { name: 'type_id',                  label: 'Tipo DDT' },
  { name: 'transport_reason_id',      label: 'Causale Trasporto' },
  { name: 'packages',                 label: 'Colli' },
  { name: 'gross_weight',             label: 'Peso Lordo (kg)' },
  { name: 'net_weight',               label: 'Peso Netto (kg)' },
  { name: 'partner_ref',              label: 'Rif. Esterno' },
  { name: 'transport_datetime',       label: 'Data Trasporto' },
]

async function _ensureOdooSession(uid, password) {
  const users = await callModel(uid, password, 'res.users', 'read',
    [[uid]], { fields: ['login'] }
  )
  const login = users?.[0]?.login
  if (!login) throw new Error('Login utente non trovato in Odoo.')

  const resp = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: 1,
      params: { db: ODOO_DB, login, password },
    }),
  })
  if (!resp.ok) throw new Error(`Sessione Odoo fallita: HTTP ${resp.status}`)
  const data = await resp.json()
  if (!data?.result?.uid) throw new Error('Autenticazione sessione Odoo non riuscita.')
}

// ─── Stampa PDF ───────────────────────────────────────────────────────────────

export async function printDDTViaBrowser(uid, password, ddtId) {
  await _ensureOdooSession(uid, password)
  window.open(`${ODOO_URL}/report/pdf/${REPORT_NAME}/${ddtId}`, '_blank')
}

// ─── Export XLSX (nativo Odoo) ────────────────────────────────────────────────
// Usa /web/export/xlsx — stesso endpoint del backend Odoo.
// ids: array di ID da esportare (quelli visibili dopo i filtri client-side).

export async function exportDDTList(uid, password, ids) {
  await _ensureOdooSession(uid, password)

  const exportData = JSON.stringify({
    model:          'stock.delivery.note',
    fields:         EXPORT_FIELDS,
    ids:            ids && ids.length ? ids : false,
    domain:         [['active', '=', true]],
    context:        { lang: 'it_IT', tz: 'Europe/Rome' },
    import_compat:  false,
  })

  const resp = await fetch(`${ODOO_URL}/web/export/xlsx`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body:        new URLSearchParams({ data: exportData }),
  })

  if (!resp.ok) {
    // Odoo a volte restituisce HTML in caso di errore
    const text = await resp.text().catch(() => '')
    const msg  = text.length < 300 ? text : `HTTP ${resp.status}`
    throw new Error(`Export fallito: ${msg}`)
  }

  const contentType = resp.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    throw new Error('Export non riuscito: Odoo ha restituito una pagina HTML (sessione scaduta?).')
  }

  const blob = await resp.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `DDT_export_${new Date().toISOString().substring(0, 10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Partners ─────────────────────────────────────────────────────────────────

export async function fetchPartners(uid, password) {
  return callModel(uid, password, 'res.partner', 'search_read',
    [[['active', '=', true], ['is_company', '=', true]]],
    { fields: ['id', 'name', 'display_name'], order: 'name asc', limit: 500 }
  )
}

/**
 * odoo.js — Client XML-RPC per Odoo 14
 *
 * Gestisce autenticazione e chiamate al modello via /xmlrpc/2/
 * Tutte le funzioni sono async e lanciano errori in caso di fallimento.
 */

const ODOO_URL = import.meta.env.VITE_ODOO_URL
const ODOO_DB  = import.meta.env.VITE_ODOO_DB

// ---------------------------------------------------------------------------
// Helpers XML-RPC
// ---------------------------------------------------------------------------

/**
 * Serializza una chiamata XML-RPC in formato stringa XML.
 */
function buildXmlRpcCall(method, params) {
  const encodeValue = (val) => {
    if (val === null || val === undefined) return '<value><boolean>0</boolean></value>'
    if (typeof val === 'boolean')   return `<value><boolean>${val ? 1 : 0}</boolean></value>`
    if (typeof val === 'number' && Number.isInteger(val)) return `<value><int>${val}</int></value>`
    if (typeof val === 'number')    return `<value><double>${val}</double></value>`
    if (typeof val === 'string')    return `<value><string>${escapeXml(val)}</string></value>`
    if (Array.isArray(val)) {
      const items = val.map((v) => `<value>${encodeInner(v)}</value>`).join('')
      return `<value><array><data>${items}</data></array></value>`
    }
    if (typeof val === 'object') {
      const members = Object.entries(val)
        .map(([k, v]) => `<member><name>${escapeXml(k)}</name>${encodeValue(v)}</member>`)
        .join('')
      return `<value><struct>${members}</struct></value>`
    }
    return `<value><string>${escapeXml(String(val))}</string></value>`
  }

  // Versione senza wrapper <value> esterno per array/struct usata internamente
  const encodeInner = (val) => {
    if (val === null || val === undefined) return '<boolean>0</boolean>'
    if (typeof val === 'boolean')   return `<boolean>${val ? 1 : 0}</boolean>`
    if (typeof val === 'number' && Number.isInteger(val)) return `<int>${val}</int>`
    if (typeof val === 'number')    return `<double>${val}</double>`
    if (typeof val === 'string')    return `<string>${escapeXml(val)}</string>`
    if (Array.isArray(val)) {
      const items = val.map((v) => `<value>${encodeInner(v)}</value>`).join('')
      return `<array><data>${items}</data></array>`
    }
    if (typeof val === 'object') {
      const members = Object.entries(val)
        .map(([k, v]) => `<member><name>${escapeXml(k)}</name>${encodeValue(v)}</member>`)
        .join('')
      return `<struct>${members}</struct>`
    }
    return `<string>${escapeXml(String(val))}</string>`
  }

  const paramsXml = params.map((p) => `<param>${encodeValue(p)}</param>`).join('')
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>${paramsXml}</params>
</methodCall>`
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Deserializza la risposta XML-RPC in un valore JavaScript.
 */
function parseXmlRpcResponse(xmlText) {
  const parser = new DOMParser()
  const doc    = parser.parseFromString(xmlText, 'text/xml')

  const fault = doc.querySelector('fault')
  if (fault) {
    const faultValue = parseValue(fault.querySelector('value'))
    throw new OdooError(
      faultValue?.faultString || 'XML-RPC fault',
      faultValue?.faultCode   || -1
    )
  }

  const param = doc.querySelector('params > param > value')
  if (!param) throw new OdooError('Risposta XML-RPC non valida')
  return parseValue(param)
}

function parseValue(node) {
  if (!node) return null
  const child = node.children[0]
  if (!child) return node.textContent.trim() // bare string

  switch (child.tagName) {
    case 'int':
    case 'i4':
    case 'i8':    return parseInt(child.textContent, 10)
    case 'double': return parseFloat(child.textContent)
    case 'boolean': return child.textContent.trim() === '1'
    case 'string': return child.textContent
    case 'nil':    return null
    case 'array': {
      const values = child.querySelectorAll(':scope > data > value')
      return Array.from(values).map(parseValue)
    }
    case 'struct': {
      const obj = {}
      const members = child.querySelectorAll(':scope > member')
      members.forEach((m) => {
        const name  = m.querySelector('name').textContent
        const value = parseValue(m.querySelector('value'))
        obj[name] = value
      })
      return obj
    }
    default: return child.textContent
  }
}

// ---------------------------------------------------------------------------
// Errore custom
// ---------------------------------------------------------------------------
export class OdooError extends Error {
  constructor(message, code = 0) {
    super(message)
    this.name   = 'OdooError'
    this.code   = code
  }
}

// ---------------------------------------------------------------------------
// Chiamata HTTP XML-RPC base
// ---------------------------------------------------------------------------
async function xmlrpcCall(endpoint, method, params) {
  const url  = `${ODOO_URL}${endpoint}`
  const body = buildXmlRpcCall(method, params)

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body,
  })

  if (!response.ok) {
    throw new OdooError(`HTTP ${response.status}: ${response.statusText}`)
  }

  const text = await response.text()
  return parseXmlRpcResponse(text)
}

// ---------------------------------------------------------------------------
// API pubblica
// ---------------------------------------------------------------------------

/**
 * Autentica l'utente su Odoo.
 * @returns {number} uid dell'utente
 */
export async function authenticate(username, password) {
  const uid = await xmlrpcCall(
    '/xmlrpc/2/common',
    'authenticate',
    [ODOO_DB, username, password, {}]
  )
  if (!uid || uid === false) {
    throw new OdooError('Credenziali non valide. Controlla username e password.')
  }
  return uid
}

/**
 * Esegue una chiamata execute_kw sul modello Odoo specificato.
 */
export async function executeKw(uid, password, model, method, args, kwargs = {}) {
  return xmlrpcCall(
    '/xmlrpc/2/object',
    'execute_kw',
    [ODOO_DB, uid, password, model, method, args, kwargs]
  )
}

/**
 * Recupera i lotti del magazzino CDP con ubicazione.
 * Filtra per location_id figli del magazzino CDP.
 */
export async function fetchLotsInCDP(uid, password) {
  const cdpName = import.meta.env.VITE_CDP_WAREHOUSE_NAME || 'CDP'

  // 1. Trova il warehouse CDP
  const warehouses = await executeKw(uid, password, 'stock.warehouse', 'search_read', [
    [['code', '=', cdpName]],
  ], { fields: ['id', 'name', 'lot_stock_id'], limit: 1 })

  if (!warehouses.length) {
    throw new OdooError(`Magazzino "${cdpName}" non trovato in Odoo.`)
  }

  const rootLocationId = warehouses[0].lot_stock_id[0]

  // 2. Trova tutte le location figlie (ricorsivo via child_of)
  const locations = await executeKw(uid, password, 'stock.location', 'search_read', [
    [['id', 'child_of', rootLocationId], ['usage', '=', 'internal']],
  ], { fields: ['id', 'complete_name', 'name'] })

  const locationIds   = locations.map((l) => l.id)
  const locationMap   = Object.fromEntries(locations.map((l) => [l.id, l.complete_name || l.name]))

  // 3. Recupera le quant (giacenze) nelle location CDP
  const quants = await executeKw(uid, password, 'stock.quant', 'search_read', [
    [
      ['location_id', 'in', locationIds],
      ['quantity',    '>',  0],
    ],
  ], {
    fields: ['lot_id', 'product_id', 'quantity', 'location_id'],
  })

  // 4. Costruisce array di lotti arricchiti
  const lots = quants
    .filter((q) => q.lot_id && q.lot_id !== false)
    .map((q) => ({
      id:           q.lot_id[0],
      lotName:      q.lot_id[1],
      productId:    q.product_id[0],
      productName:  q.product_id[1],
      quantity:     q.quantity,
      locationId:   q.location_id[0],
      locationName: locationMap[q.location_id[0]] || q.location_id[1],
    }))

  return lots
}

/**
 * Crea una richiesta tramite il metodo custom del modulo warehouse_request.
 */
export async function createRequest(uid, password, lotIds, notes = '') {
  return executeKw(uid, password, 'warehouse.request', 'create_from_dashboard', [
    [lotIds, notes || false],
  ])
}

/**
 * Recupera le richieste dell'utente corrente.
 */
export async function fetchMyRequests(uid, password) {
  const records = await executeKw(uid, password, 'warehouse.request', 'search_read', [
    [['user_id', '=', uid]],
  ], {
    fields: ['name', 'request_date', 'state', 'lot_ids', 'notes', 'lot_count'],
    order:  'request_date desc',
  })
  return records
}

/**
 * Recupera TUTTE le richieste (solo per Gestore Magazzino).
 */
export async function fetchAllRequests(uid, password) {
  return executeKw(uid, password, 'warehouse.request', 'search_read', [
    [],
  ], {
    fields: ['name', 'request_date', 'state', 'lot_ids', 'notes', 'lot_count', 'user_id', 'partner_id'],
    order:  'request_date desc',
  })
}

/**
 * Aggiorna lo stato di una richiesta (solo Gestore Magazzino).
 * @param {string} action — 'action_take_charge' | 'action_start_preparing' | 'action_mark_done'
 */
export async function updateRequestState(uid, password, requestId, action) {
  return executeKw(uid, password, 'warehouse.request', action, [
    [[requestId]],
  ])
}

/**
 * Recupera i dettagli di una singola richiesta con i nomi dei lotti.
 */
export async function fetchRequestDetail(uid, password, requestId) {
  const records = await executeKw(uid, password, 'warehouse.request', 'search_read', [
    [['id', '=', requestId]],
  ], {
    fields: ['name', 'request_date', 'state', 'lot_ids', 'notes', 'lot_count', 'user_id'],
  })
  if (!records.length) throw new OdooError('Richiesta non trovata.')

  const req = records[0]

  // Recupera i dettagli dei lotti collegati
  if (req.lot_ids && req.lot_ids.length) {
    const lots = await executeKw(uid, password, 'stock.production.lot', 'search_read', [
      [['id', 'in', req.lot_ids]],
    ], { fields: ['name', 'product_id', 'product_qty'] })
    req.lots = lots
  } else {
    req.lots = []
  }

  return req
}

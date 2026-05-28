/**
 * odoo-xmlrpc.js
 * Client XML-RPC minimale per Odoo 14 CE.
 * Gestisce autenticazione, chiamate ai modelli e serializzazione XML.
 */

const ODOO_URL = import.meta.env.VITE_ODOO_URL
const ODOO_DB  = import.meta.env.VITE_ODOO_DB

// ---------------------------------------------------------------------------
// Serializzazione XML-RPC
// ---------------------------------------------------------------------------

function serializeValue(val) {
  if (val === null || val === undefined) {
    return '<value><boolean>0</boolean></value>'
  }
  if (typeof val === 'boolean') {
    return `<value><boolean>${val ? 1 : 0}</boolean></value>`
  }
  if (typeof val === 'number' && Number.isInteger(val)) {
    return `<value><int>${val}</int></value>`
  }
  if (typeof val === 'number') {
    return `<value><double>${val}</double></value>`
  }
  if (typeof val === 'string') {
    const escaped = val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<value><string>${escaped}</string></value>`
  }
  if (Array.isArray(val)) {
    const items = val.map(serializeValue).join('')
    return `<value><array><data>${items}</data></array></value>`
  }
  if (typeof val === 'object') {
    const members = Object.entries(val)
      .map(([k, v]) => `<member><name>${k}</name>${serializeValue(v)}</member>`)
      .join('')
    return `<value><struct>${members}</struct></value>`
  }
  return `<value><string>${String(val)}</string></value>`
}

function buildXmlRpcCall(method, params) {
  const paramXml = params.map(serializeValue).join('')
  return `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${params.map(p => `<param>${serializeValue(p)}</param>`).join('\n    ')}
  </params>
</methodCall>`
}

// ---------------------------------------------------------------------------
// Deserializzazione XML-RPC
// ---------------------------------------------------------------------------

function parseValue(node) {
  // Se non ha figli tipizzati, il testo nudo è una stringa
  const child = node.firstElementChild
  if (!child) return node.textContent || ''

  const tag = child.tagName.toLowerCase()

  if (tag === 'string')  return child.textContent
  if (tag === 'int' || tag === 'i4' || tag === 'i8') return parseInt(child.textContent, 10)
  if (tag === 'double')  return parseFloat(child.textContent)
  if (tag === 'boolean') return child.textContent === '1'
  if (tag === 'nil')     return null

  if (tag === 'array') {
    const dataNode = child.querySelector('data')
    if (!dataNode) return []
    return Array.from(dataNode.children).map(parseValue)
  }

  if (tag === 'struct') {
    const obj = {}
    // Iteriamo sui childNodes diretti dello <struct> per evitare
    // di scendere ricorsivamente in struct annidate con querySelectorAll.
    // 'name' e 'value' vengono cercati come figli diretti di ogni <member>.
    Array.from(child.childNodes).forEach(node => {
      if (node.nodeType !== 1 || node.tagName.toLowerCase() !== 'member') return
      let memberName = null
      let memberValue = null
      Array.from(node.childNodes).forEach(c => {
        if (c.nodeType !== 1) return
        const t = c.tagName.toLowerCase()
        if (t === 'name')  memberName  = c.textContent
        if (t === 'value') memberValue = c
      })
      if (memberName !== null && memberValue !== null) {
        obj[memberName] = parseValue(memberValue)
      }
    })
    return obj
  }

  return child.textContent
}

function parseXmlRpcResponse(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  // Fault
  const fault = doc.querySelector('fault')
  if (fault) {
    const faultObj = parseValue(fault.querySelector('value'))
    const err = new Error(faultObj.faultString || 'XML-RPC Fault')
    err.faultCode = faultObj.faultCode
    throw err
  }

  const valueNode = doc.querySelector('methodResponse > params > param > value')
  if (!valueNode) throw new Error('Risposta XML-RPC non valida')
  return parseValue(valueNode)
}

// ---------------------------------------------------------------------------
// Chiamata HTTP
// ---------------------------------------------------------------------------

async function xmlrpcCall(endpoint, method, params) {
  const body = buildXmlRpcCall(method, params)
  const response = await fetch(`${ODOO_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body,
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  const text = await response.text()
  return parseXmlRpcResponse(text)
}

// ---------------------------------------------------------------------------
// API pubblica
// ---------------------------------------------------------------------------

/**
 * Autentica l'utente su Odoo.
 * @returns {number} uid — User ID Odoo
 */
export async function authenticate(username, password) {
  const uid = await xmlrpcCall(
    '/xmlrpc/2/common',
    'authenticate',
    [ODOO_DB, username, password, {}]
  )
  if (!uid || uid === false) {
    throw new Error('Credenziali non valide o utente non autorizzato.')
  }
  return uid
}

/**
 * Chiama un metodo su un modello Odoo.
 * @returns {any} risultato della chiamata
 */
export async function callModel(uid, password, model, method, args = [], kwargs = {}) {
  return xmlrpcCall(
    '/xmlrpc/2/object',
    'execute_kw',
    [ODOO_DB, uid, password, model, method, args, kwargs]
  )
}

export { ODOO_URL, ODOO_DB }

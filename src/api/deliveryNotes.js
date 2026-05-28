/**
 * deliveryNotes.js
 * API layer per il modulo editable_delivery_note (Odoo 14).
 */

import { callModel } from './odoo-xmlrpc.js'

// ─── Types / Causali ──────────────────────────────────────────────────────────

export async function fetchDeliveryNoteTypes(uid, password) {
  return callModel(uid, password, 'edn.type', 'search_read',
    [[['active', '=', true]]],
    { fields: ['id', 'code', 'name', 'sequence'], order: 'sequence asc' }
  )
}

// ─── Notes list ───────────────────────────────────────────────────────────────

export async function fetchDeliveryNotes(uid, password, filters = {}) {
  const domain = []
  if (filters.state)     domain.push(['state', '=', filters.state])
  if (filters.type_id)   domain.push(['type_id', '=', filters.type_id])
  if (filters.date_from) domain.push(['date', '>=', filters.date_from])
  if (filters.date_to)   domain.push(['date', '<=', filters.date_to])

  return callModel(uid, password, 'edn.delivery.note', 'search_read',
    [domain],
    {
      fields: ['id', 'name', 'date', 'type_id', 'state', 'destinatario_id',
               'riferimento_esterno', 'colli'],
      order: 'date desc, id desc',
      limit: 200,
    }
  )
}

// ─── Note detail ──────────────────────────────────────────────────────────────

export async function fetchDeliveryNote(uid, password, id) {
  const records = await callModel(uid, password, 'edn.delivery.note', 'read',
    [[id]],
    {
      fields: ['id', 'name', 'date', 'type_id', 'state', 'destinatario_id',
               'mittente_id', 'luogo_destinazione_id', 'riferimento_esterno',
               'colli', 'note', 'line_ids'],
    }
  )
  const note = records[0]

  if (note.line_ids && note.line_ids.length > 0) {
    const lines = await callModel(uid, password, 'edn.delivery.note.line', 'read',
      [note.line_ids],
      { fields: ['id', 'sequence', 'articolo_code', 'descrizione', 'sc_pz',
                 'um_qta', 'odp', 'hu_su', 'barcode', 'line_note'] }
    )
    note.lines = lines.sort((a, b) => a.sequence - b.sequence)
  } else {
    note.lines = []
  }

  return note
}

// ─── Create / Update ─────────────────────────────────────────────────────────

export async function createDeliveryNote(uid, password, data) {
  const vals = _buildVals(data)
  return callModel(uid, password, 'edn.delivery.note', 'create', [vals])
}

export async function updateDeliveryNote(uid, password, id, data) {
  const vals = _buildVals(data)
  return callModel(uid, password, 'edn.delivery.note', 'write', [[id], vals])
}

function _buildVals(data) {
  const lineCommands = []
  for (const line of data.lines) {
    const lv = {
      sequence:      line.sequence || 10,
      articolo_code: line.articolo_code || '',
      descrizione:   line.descrizione  || '',
      sc_pz:         parseFloat(line.sc_pz)  || 0,
      um_qta:        parseFloat(line.um_qta) || 0,
      odp:           line.odp       || '',
      hu_su:         line.hu_su     || '',
      barcode:       line.barcode   || '',
      line_note:     line.line_note || '',
    }
    if (line._deleted && line.id) {
      lineCommands.push([2, line.id])
    } else if (line._deleted) {
      // not yet saved — skip
    } else if (line.id) {
      lineCommands.push([1, line.id, lv])
    } else {
      lineCommands.push([0, 0, lv])
    }
  }

  return {
    type_id:              data.type_id              || false,
    date:                 data.date                 || false,
    destinatario_id:      data.destinatario_id      || false,
    mittente_id:          data.mittente_id          || false,
    luogo_destinazione_id: data.luogo_destinazione_id || false,
    riferimento_esterno:  data.riferimento_esterno  || '',
    colli:                parseInt(data.colli)      || 0,
    note:                 data.note                 || '',
    line_ids:             lineCommands,
  }
}

// ─── Workflow actions ─────────────────────────────────────────────────────────

export async function confirmDeliveryNote(uid, password, id) {
  return callModel(uid, password, 'edn.delivery.note', 'action_confirm', [[id]])
}

export async function doneDeliveryNote(uid, password, id) {
  return callModel(uid, password, 'edn.delivery.note', 'action_done', [[id]])
}

export async function cancelDeliveryNote(uid, password, id) {
  return callModel(uid, password, 'edn.delivery.note', 'action_cancel', [[id]])
}

export async function draftDeliveryNote(uid, password, id) {
  return callModel(uid, password, 'edn.delivery.note', 'action_draft', [[id]])
}

// ─── Partners ────────────────────────────────────────────────────────────────

export async function fetchPartners(uid, password) {
  return callModel(uid, password, 'res.partner', 'search_read',
    [[['active', '=', true]]],
    { fields: ['id', 'name', 'display_name'], limit: 200, order: 'name asc' }
  )
}

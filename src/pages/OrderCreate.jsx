import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save, Bot, Wand2 } from 'lucide-react'
import { getAllClients } from '../api/clientApi'
import { getAllRequests, getMessages, updateRequestStatus } from '../api/requestApi'
import { createOrder } from '../api/orderApi'
import { getActiveCatalogItems } from '../api/miscApi'
import './OrderCreate.css'

// ── Natural-language delivery date parser ──────────────────────────────────
// Returns a yyyy-MM-dd string or null if not understood.
const parseDeliveryHint = (text) => {
  if (!text || !text.trim()) return null
  const t = text.trim().toLowerCase()

  // Direct ISO / dd-mm-yyyy dates
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return t
  const dmy = t.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`)
    if (!isNaN(d)) return toDateStr(d)
  }

  const today  = new Date()
  today.setHours(0,0,0,0)

  // "in N unit" or "N unit" (e.g. "3 months", "in 2 weeks", "10 days")
  const rel = t.match(/(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years)/)
  if (rel) {
    const n    = parseFloat(rel[1])
    const unit = rel[2]
    let days   = 0
    if (unit.startsWith('day'))   days = Math.round(n)
    if (unit.startsWith('week'))  days = Math.round(n * 7)
    if (unit.startsWith('month')) days = Math.round(n * 30)
    if (unit.startsWith('year'))  days = Math.round(n * 365)
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return toDateStr(d)
  }

  // "end of (next) month"
  if (t.includes('end of next month') || t.includes('end of the month')) {
    const d = new Date(today)
    if (t.includes('next')) d.setMonth(d.getMonth() + 1)
    d.setMonth(d.getMonth() + 1, 0) // last day of month
    return toDateStr(d)
  }

  // "next [weekday]"
  const days7 = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  for (let wi = 0; wi < 7; wi++) {
    if (t.includes(days7[wi])) {
      const d = new Date(today)
      const diff = (wi - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return toDateStr(d)
    }
  }

  return null
}

const toDateStr = (d) => d.toISOString().slice(0, 10)

// Scan a block of text for the first recognisable delivery mention
const extractDeliveryFromText = (text) => {
  if (!text) return null
  // Look for explicit delivery phrases
  const patterns = [
    /deliver(?:y|ed)?\s+(?:in\s+)?(\d+(?:\.\d+)?\s*(?:day|days|week|weeks|month|months|year|years))/i,
    /(?:within|in)\s+(\d+(?:\.\d+)?\s*(?:day|days|week|weeks|month|months|year|years))/i,
    /(?:expected|required|needed)\s+(?:in\s+)?(\d+(?:\.\d+)?\s*(?:day|days|week|weeks|month|months|year|years))/i,
    /timeline\s*[:\-]\s*(.{3,40})/i,
    /delivery\s+timeline\s*[:\-]\s*(.{3,40})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      const result = parseDeliveryHint(m[1].trim())
      if (result) return result
    }
  }
  return null
}

const OrderCreate = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [clients,   setClients]   = useState([])
  const [requests,  setRequests]  = useState([])
  const [loadError, setLoadError] = useState('')
  const [requestMessages, setRequestMessages] = useState([])
  const [selectedReq, setSelectedReq] = useState(null)
  const [deliveryHint, setDeliveryHint] = useState('')
  const [hintError,    setHintError]    = useState('')
  const [catalogItems, setCatalogItems] = useState([])
  const [entryMode, setEntryMode] = useState('manual') // 'manual' or 'catalog'

  const [form, setForm] = useState({
    orderId:      `ORD-${Date.now()}`,
    clientNo:     '',
    requestId:    '',
    deliveryDate: '',
    orderType:    'Sales',
    linkedOriginalOrderId: null
  })

  // items: description (free text), quantity, unitPrice, catalogId (optional)
  const [items, setItems] = useState([
    { description: '', quantity: '', unitPrice: '', catalogId: null },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  const basicAmount   = items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseInt(i.quantity) || 0), 0)
  const taxAmount     = basicAmount * 0.18
  const billingAmount = basicAmount + taxAmount

  useEffect(() => {
    Promise.all([getAllClients(), getAllRequests(), getActiveCatalogItems()])
      .then(([c, r, cat]) => {
        setClients(Array.isArray(c) ? c : [])
        setCatalogItems(Array.isArray(cat) ? cat : [])
        const all = Array.isArray(r) ? r : []
        const filtered = all.filter((req) => req.status === 'New' || req.status === 'Active')
        setRequests(filtered)

        const preReq = searchParams.get('requestId')
        if (preReq) {
          const found = filtered.find(req => req.requestId === preReq)
          if (found) {
            setSelectedReq(found)
            setForm(f => ({
              ...f,
              requestId: preReq,
              clientNo: String(found.client?.clientNo || f.clientNo),
              orderType: found.requestType === 'Support' ? 'Support' : 'Sales',
              linkedOriginalOrderId: found.linkedOrderId || null,
            }))
            getMessages(preReq).then(msgs => {
              const arr = Array.isArray(msgs) ? msgs : []
              setRequestMessages(arr)
              const SUMMARY_MARKER = '[INTAKE_SUMMARY]'
              const agentMsgs = arr.filter(m => m.dmSender === 'Agent' && m.messageContent)
              const tagged = agentMsgs.find(m => m.messageContent.startsWith(SUMMARY_MARKER))
              const fallback = [...agentMsgs].reverse().find(m =>
                m.messageContent.includes('Products/Services:') || m.messageContent.includes('Quantity/Scale:')
              )
              const summaryText = tagged ? tagged.messageContent.replace(SUMMARY_MARKER, '') : fallback?.messageContent || ''
              const autoDate = extractDeliveryFromText(summaryText)
              if (autoDate) { setForm(f => ({ ...f, deliveryDate: autoDate })); setDeliveryHint(`auto: ${autoDate}`) }
            }).catch(() => {})
          }
        }
      })
      .catch((e) => setLoadError(e.message))

    const preClient = searchParams.get('clientNo')
    if (preClient) setForm((f) => ({ ...f, clientNo: preClient }))
  }, [])

  const applyDeliveryHint = (hint, formUpdater) => {
    const parsed = parseDeliveryHint(hint)
    if (!parsed) {
      setHintError(hint.trim() ? 'Could not parse date — try "3 months" or "6 weeks"' : '')
      return
    }
    setHintError('')
    formUpdater(parsed)
  }

  const handleRequestChange = (requestId) => {
    const req = requests.find((r) => r.requestId === requestId)
    setSelectedReq(req || null)
    setForm((f) => ({
      ...f,
      requestId,
      clientNo: req ? String(req.client?.clientNo || f.clientNo) : f.clientNo,
      orderType: req?.requestType === 'Support' ? 'Support' : 'Sales',
      linkedOriginalOrderId: req?.linkedOrderId || null
    }))
    if (requestId) {
      getMessages(requestId)
        .then((msgs) => {
          const arr = Array.isArray(msgs) ? msgs : []
          setRequestMessages(arr)
          // Auto-extract delivery date from agent summary messages
          const SUMMARY_MARKER = '[INTAKE_SUMMARY]'
          const agentMsgs = arr.filter(m => m.dmSender === 'Agent' && m.messageContent)
          const taggedSummary = agentMsgs.find(m => m.messageContent.startsWith(SUMMARY_MARKER))
          const fallbackSummary = [...agentMsgs].reverse().find(m =>
            m.messageContent.includes('Products/Services:') || m.messageContent.includes('Quantity/Scale:')
          )
          const summaryText = taggedSummary
            ? taggedSummary.messageContent.replace(SUMMARY_MARKER, '')
            : fallbackSummary?.messageContent || ''
          const autoDate = extractDeliveryFromText(summaryText)
          if (autoDate) {
            setForm((f) => ({ ...f, deliveryDate: autoDate }))
            setDeliveryHint(`auto: ${autoDate}`)
            setHintError('')
          }
        })
        .catch(() => setRequestMessages([]))
    } else {
      setRequestMessages([])
    }
  }

  const handleItemChange = (idx, field, val) => {
    setItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: val }
      return next
    })
  }

  const handleCatalogItemSelect = (idx, catalogId) => {
    const selected = catalogItems.find(item => item.catalogId === catalogId)
    if (selected) {
      setItems((prev) => {
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          catalogId,
          description: selected.catalogName || selected.device.partDescription,
          unitPrice: String(selected.device.partCost),
        }
        return next
      })
    }
  }

  const addItem    = () => setItems((p) => [...p, { description: '', quantity: '', unitPrice: '', catalogId: null }])
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.requestId) { setError('Please link this order to a request.'); return }
    if (!form.clientNo)  { setError('Please select a client.'); return }

    for (const i of items) {
      if (!i.description.trim())                      { setError('Each line item needs a description.'); return }
      if (!i.quantity || parseInt(i.quantity) < 1)    { setError('Quantity must be at least 1.'); return }
      if (!i.unitPrice || parseFloat(i.unitPrice) <= 0) { setError('Unit price must be positive.'); return }
    }

    setSubmitting(true); setError('')
    try {
      // Auto-generate a part number per item so the backend is satisfied
      const ts = Date.now()
      const saved = await createOrder({
        orderId:      form.orderId,
        clientNo:     parseInt(form.clientNo),
        requestId:    form.requestId,
        deliveryDate: form.deliveryDate || null,
        orderType:    form.orderType,
        linkedOriginalOrderId: form.linkedOriginalOrderId,
        items: items.map((i, idx) => ({
          partNo:      `ITEM-${ts}-${idx + 1}`,
          description: i.description.trim(),
          quantity:    parseInt(i.quantity),
          unitPrice:   parseFloat(i.unitPrice),
        })),
      })
      // Set request status to 'Converted' to prevent further chat
      await updateRequestStatus(form.requestId, 'Converted')
      
      navigate(`/admin/orders/${saved.orderId}`)
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="order-create-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{form.orderType === 'Support' ? 'Create Support Order' : 'Create New Order'}</h1>
            <p>
              {form.orderType === 'Support' 
                ? `Service fulfillment for parent order #${form.linkedOriginalOrderId}`
                : "Every order must be linked to a client request."}
            </p>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="card" style={{ color: 'hsl(40 80% 70%)', fontSize: '0.875rem' }}>
          Could not load clients/requests ({loadError}).
        </div>
      )}
      {error && (
        <div className="card" style={{ color: 'hsl(0 80% 70%)' }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} className="order-create-form">
        <div className="create-grid">

          {/* ── Left: metadata ── */}
          <div className="create-left">
            <div className="card section-card">
              <h3 className="section-title">Order Details</h3>

              <div className="input-group">
                <label className="input-label">Order ID</label>
                <input className="input-field" type="text" value={form.orderId} required
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })} />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Linked Request <span style={{ color: 'hsl(0 80% 65%)' }}>*</span>
                </label>
                <select className="input-field" value={form.requestId} required
                  onChange={(e) => handleRequestChange(e.target.value)}>
                  <option value="" disabled>— Select a request —</option>
                  {requests.length === 0 && (
                    <option disabled>No open requests available</option>
                  )}
                  {requests.map((r) => (
                    <option key={r.requestId} value={r.requestId}>
                      {r.requestId} — {r.client?.clientId} — {r.requestSubject?.substring(0, 35)}
                    </option>
                  ))}
                </select>
                {requests.length === 0 && (
                  <p style={{ fontSize: '0.72rem', color: 'hsl(40 80% 60%)', marginTop: '0.2rem' }}>
                    Create a client request first before generating an order.
                  </p>
                )}
              </div>

              {/* ── Request summary panel ── */}
              {selectedReq && (() => {
                const SUMMARY_MARKER = '[INTAKE_SUMMARY]'
                const agentMsgs = requestMessages.filter(m => m.dmSender === 'Agent' && m.messageContent)
                const taggedSummary = agentMsgs.find(m => m.messageContent.startsWith(SUMMARY_MARKER))
                const fallbackSummary = [...agentMsgs].reverse().find(m =>
                  m.messageContent.includes('Products/Services:') || m.messageContent.includes('Quantity/Scale:')
                )
                const displayText = taggedSummary
                  ? taggedSummary.messageContent.replace(SUMMARY_MARKER, '').trim()
                  : fallbackSummary
                    ? fallbackSummary.messageContent.replace(/^\[PROFILE_PHASE\]/, '').trim()
                    : selectedReq.requestBody || selectedReq.requestSubject || 'No details available.'
                return (
                  <div style={{
                    background: 'hsl(var(--muted) / 0.5)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    padding: '0.85rem 1rem',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                      <Bot size={14} style={{ color: 'hsl(var(--primary))' }} />
                      Agent Summary — {selectedReq.requestId}
                    </div>
                    <div style={{
                      padding: '0.6rem 0.75rem',
                      background: 'hsl(var(--card))',
                      borderRadius: 'var(--radius)',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                    }}>
                      {displayText}
                    </div>
                  </div>
                )
              })()}

              <div className="input-group">
                <label className="input-label">Client</label>
                <select className="input-field" value={form.clientNo} required
                  onChange={(e) => setForm({ ...form, clientNo: e.target.value })}>
                  <option value="" disabled>— Select client —</option>
                  {clients.map((c) => (
                    <option key={c.clientNo} value={c.clientNo}>
                      {c.clientId}{c.representativeName ? ` (${c.representativeName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">
                  Delivery Date <span style={{ opacity: 0.5 }}>(optional)</span>
                </label>
                <input className="input-field" type="date" value={form.deliveryDate}
                  onChange={(e) => { setForm({ ...form, deliveryDate: e.target.value }) }} />
              </div>
            </div>
          </div>

          {/* ── Right: line items ── */}
          <div className="create-right">
            <div className="card section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Line Items</h3>
                <button type="button" className="btn btn-ghost" onClick={addItem}>
                  <Plus size={15} style={{ marginRight: '0.25rem' }} /> Add Row
                </button>
              </div>

              {/* Entry Mode Selector */}
              {catalogItems.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: 'hsl(var(--primary)/0.1)', borderRadius: 'var(--radius)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                    <input
                      type="radio"
                      name="entryMode"
                      value="manual"
                      checked={entryMode === 'manual'}
                      onChange={(e) => setEntryMode(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Manual Entry</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                    <input
                      type="radio"
                      name="entryMode"
                      value="catalog"
                      checked={entryMode === 'catalog'}
                      onChange={(e) => setEntryMode(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>From Catalog</span>
                  </label>
                </div>
              )}

              <div className="items-table-wrap">
                <table className="data-table items-table">
                  <thead>
                    <tr>
                      {entryMode === 'catalog' ? (
                        <>
                          <th>Catalog Item</th>
                          <th style={{ width: 100 }}>Qty</th>
                          <th style={{ width: 160 }}>Unit Price (₹)</th>
                          <th style={{ width: 100 }}>Subtotal</th>
                          <th style={{ width: 32 }} />
                        </>
                      ) : (
                        <>
                          <th>Description</th>
                          <th style={{ width: 100 }}>Qty</th>
                          <th style={{ width: 160 }}>Unit Price (₹)</th>
                          <th style={{ width: 100 }}>Subtotal</th>
                          <th style={{ width: 32 }} />
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const sub = (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0)
                      return (
                        <tr key={idx}>
                          <td>
                            {entryMode === 'catalog' ? (
                              <select
                                className="input-field"
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', minWidth: 180 }}
                                value={item.catalogId || ''}
                                onChange={(e) => handleCatalogItemSelect(idx, parseInt(e.target.value) || null)}
                                required
                              >
                                <option value="">— Select item —</option>
                                {catalogItems.map(cat => (
                                  <option key={cat.catalogId} value={cat.catalogId}>
                                    {cat.catalogName} (₹{Number(cat.device.partCost).toLocaleString('en-IN')})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', minWidth: 180 }}
                                placeholder="e.g. Dell PowerEdge R750 Server"
                                value={item.description}
                                required
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              />
                            )}
                          </td>
                          <td>
                            <input
                              type="text" inputMode="numeric" pattern="[0-9]*"
                              className="input-field"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', textAlign: 'center', width: '100%', minWidth: '70px' }}
                              placeholder="0" value={item.quantity} required
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                            />
                          </td>
                          <td>
                            <input
                              type="text" inputMode="decimal"
                              className="input-field"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', width: '100%' }}
                              placeholder="0.00" value={item.unitPrice} 
                              readOnly={entryMode === 'catalog' && item.catalogId}
                              required
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value.replace(/[^0-9.]/g, ''))}
                            />
                          </td>
                          <td style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                            ₹{sub.toLocaleString('en-IN')}
                          </td>
                          <td>
                            {items.length > 1 && (
                              <button type="button" className="btn-ghost"
                                style={{ color: 'hsl(0 80% 60%)', padding: '0.2rem' }}
                                onClick={() => removeItem(idx)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="billing-preview">
                <div className="billing-row">
                  <span>Basic Amount</span>
                  <span>₹{basicAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="billing-row">
                  <span>GST (18%)</span>
                  <span>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="billing-row total">
                  <span>Total Billing</span>
                  <span>₹{billingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost"
                onClick={() => navigate('/admin/orders')}>Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                <Save size={17} style={{ marginRight: '0.5rem' }} />
                {submitting ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default OrderCreate

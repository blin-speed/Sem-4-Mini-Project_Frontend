import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Package, ExternalLink, Pencil, Save, X } from 'lucide-react'
import { getClientByNo, updateClient } from '../api/clientApi'
import { getAllOrders } from '../api/orderApi'
import { getAllRequests } from '../api/requestApi'
import './AccountDetails.css'

const statusClass = (s = '') => {
  const v = s.toLowerCase()
  if (v === 'delivered') return 'success'
  if (v === 'placed') return 'pending'
  return 'info'
}

const reqTagClass = (s = '') => {
  const v = s.toLowerCase()
  if (v === 'closed' || v === 'converted') return 'success'
  if (v === 'active') return 'info'
  return 'pending'
}

const ACCOUNT_STATUSES = ['New', 'Active', 'Suspended', 'Inactive']

const AccountDetails = () => {
  const { clientNo } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [form, setForm] = useState({
    representativeName:  '',
    representativePhone: '',
    deliveryAddress:     '',
    gstNo:               '',
    accountStatus:       '',
  })

  useEffect(() => {
    const no = parseInt(clientNo)
    Promise.all([
      getClientByNo(no),
      getAllOrders({ clientNo: no }),
      getAllRequests({ clientNo: no }),
    ])
      .then(([c, o, r]) => {
        setClient(c)
        setForm({
          representativeName:  c.representativeName  || '',
          representativePhone: c.representativePhone || '',
          deliveryAddress:     c.deliveryAddress     || '',
          gstNo:               c.gstNo               || '',
          accountStatus:       c.accountStatus       || 'Active',
        })
        const ordersArray   = Array.isArray(o) ? o : []
        const requestsArray = Array.isArray(r) ? r : []
        setOrders([...ordersArray].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        setRequests([...requestsArray].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      })
      .catch((e) => {
        setError(e.message || 'Failed to load account details')
        setClient(null); setOrders([]); setRequests([])
      })
      .finally(() => setLoading(false))
  }, [clientNo])

  const handleSave = async () => {
    setSaving(true)
    setEditError('')
    try {
      const updated = await updateClient(parseInt(clientNo), form)
      setClient(updated)
      setEditing(false)
    } catch (err) {
      setEditError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      representativeName:  client?.representativeName  || '',
      representativePhone: client?.representativePhone || '',
      deliveryAddress:     client?.deliveryAddress     || '',
      gstNo:               client?.gstNo               || '',
      accountStatus:       client?.accountStatus       || 'Active',
    })
    setEditing(false)
    setEditError('')
  }

  const totalBilling = orders.reduce((s, o) => s + Number(o.billingAmount || 0), 0)

  if (loading) return <p style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
  if (error)   return <p style={{ padding: '2rem', color: 'hsl(0 80% 70%)' }}>{error}</p>
  if (!client) return null

  return (
    <div className="account-details-page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/admin/clients')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{client.clientId}</h1>
            <p>Client account overview</p>
          </div>
        </div>
        <button className="btn btn-primary"
          onClick={() => navigate(`/admin/orders/new?clientNo=${client.clientNo}`)}>
          <Package size={18} style={{ marginRight: '0.5rem' }} />
          Create Order
        </button>
      </header>

      <div className="account-grid">
        {/* Left: client info */}
        <div className="account-left">
          <div className="card info-card">
            {/* Avatar + header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'hsl(var(--primary) / 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--primary))', flexShrink: 0,
                }}>
                  {client.clientId.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>{client.clientId}</h2>
                  {editing ? (
                    <select
                      className="input-field"
                      style={{ marginTop: '0.25rem', fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}
                      value={form.accountStatus}
                      onChange={(e) => setForm({ ...form, accountStatus: e.target.value })}
                    >
                      {ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className="tag tag-info" style={{ marginTop: '0.25rem', display: 'inline-block', fontSize: '0.75rem' }}>
                      {client.accountStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit / Save / Cancel buttons */}
              {!editing ? (
                <button className="btn btn-ghost" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => setEditing(true)}>
                  <Pencil size={13} style={{ marginRight: '0.3rem' }} /> Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.3rem 0.5rem' }}
                    onClick={handleCancel} disabled={saving}>
                    <X size={14} />
                  </button>
                  <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={handleSave} disabled={saving}>
                    <Save size={13} style={{ marginRight: '0.3rem' }} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {editError && (
              <div style={{ color: 'hsl(0 80% 70%)', fontSize: '0.8rem',
                background: 'hsl(0 80% 15%)', padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>
                {editError}
              </div>
            )}

            <div className="profile-divider" style={{ borderTop: '1px solid hsl(var(--border))', margin: '0.25rem 0 0.75rem' }} />

            {/* Read-only */}
            {client.email && (
              <div className="info-row">
                <Mail size={14} style={{ flexShrink: 0 }} />
                <span>{client.email}</span>
              </div>
            )}

            {/* Editable fields */}
            <div className="info-row" style={{ alignItems: editing ? 'flex-start' : 'center' }}>
              <span style={{ opacity: 0.6, fontSize: '0.75rem', flexShrink: 0 }}>Contact</span>
              {editing ? (
                <input className="input-field" style={{ fontSize: '0.85rem' }}
                  placeholder="Representative name"
                  value={form.representativeName}
                  onChange={(e) => setForm({ ...form, representativeName: e.target.value })} />
              ) : (
                <span>{client.representativeName || '—'}</span>
              )}
            </div>

            <div className="info-row" style={{ alignItems: editing ? 'flex-start' : 'center' }}>
              <Phone size={14} style={{ flexShrink: 0 }} />
              {editing ? (
                <input className="input-field" style={{ fontSize: '0.85rem' }}
                  placeholder="+91 98765 43210"
                  value={form.representativePhone}
                  onChange={(e) => setForm({ ...form, representativePhone: e.target.value })} />
              ) : (
                <span>{client.representativePhone || '—'}</span>
              )}
            </div>

            <div className="info-row" style={{ alignItems: editing ? 'flex-start' : 'center' }}>
              <span style={{ opacity: 0.6, fontSize: '0.75rem', flexShrink: 0 }}>GST</span>
              {editing ? (
                <input className="input-field" style={{ fontSize: '0.85rem' }}
                  placeholder="27AADCB2230M1Z3" maxLength={15}
                  value={form.gstNo}
                  onChange={(e) => setForm({ ...form, gstNo: e.target.value })} />
              ) : (
                <span className="font-mono" style={{ fontSize: '0.85rem' }}>{client.gstNo || '—'}</span>
              )}
            </div>

            <div className="info-row" style={{ alignItems: editing ? 'flex-start' : 'flex-start' }}>
              <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              {editing ? (
                <textarea className="input-field" rows={3}
                  style={{ fontSize: '0.85rem', resize: 'vertical' }}
                  placeholder="Delivery address"
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
              ) : (
                <span style={{ lineHeight: 1.5 }}>{client.deliveryAddress || '—'}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="card info-card">
            <div className="stat-row">
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="stat-row">
              <span>Total Billing</span>
              <strong>₹{totalBilling.toLocaleString('en-IN')}</strong>
            </div>
            <div className="stat-row">
              <span>Open Requests</span>
              <strong>
                {requests.filter((r) => r.status === 'New' || r.status === 'Active').length}
              </strong>
            </div>
            <div className="stat-row">
              <span>Member Since</span>
              <strong>{client.createdAt?.split('T')[0] || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Right: orders + requests */}
        <div className="account-right">
          <div className="card info-card">
            <h3 className="info-card-title">Order History</h3>
            {orders.length === 0 ? (
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>No orders yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.orderId}>
                        <td className="font-mono">{o.orderId}</td>
                        <td>{o.orderPlacedDate || '—'}</td>
                        <td>₹{Number(o.billingAmount || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`tag tag-${statusClass(o.orderStatus)}`}>
                            {o.orderStatus}
                          </span>
                        </td>
                        <td>
                          <button className="icon-btn"
                            onClick={() => navigate(`/admin/orders/${o.orderId}`)}>
                            <ExternalLink size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card info-card">
            <h3 className="info-card-title">Request History</h3>
            {requests.length === 0 ? (
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>No requests yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Subject</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.requestId} style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/admin/requests/chat?id=${r.requestId}`)}>
                        <td className="font-mono">{r.requestId}</td>
                        <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.requestSubject}
                        </td>
                        <td>{r.createdAt?.split('T')[0] || '—'}</td>
                        <td>
                          <span className={`tag tag-${reqTagClass(r.status)}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountDetails

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, FileDown } from 'lucide-react'
import { getOrderById, updateOrderStatus } from '../api/orderApi'
import { getAllTransactions, confirmTransaction } from '../api/transactionApi'
import './OrderDetails.css'

const STATUSES = ['Placed', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered', 'Complete']

const statusClass = (s = '') => {
  const v = s.toLowerCase()
  if (v === 'complete' || v === 'delivered') return 'success'
  if (v === 'placed') return 'pending'
  return 'info'
}

const statusIndex = (s) => STATUSES.indexOf(s)

const StatusConfirm = ({ orderId, to, onConfirm, onCancel, error }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }}>
    <div className="card" style={{ maxWidth: 380, width: '90%', padding: '1.5rem', textAlign: 'center' }}>
      <AlertCircle size={30} style={{ margin: '0 auto 0.75rem', color: 'hsl(38 92% 60%)' }} />
      <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Mark as {to}?</h3>
      {to === 'Complete' && (
        <p style={{ fontSize: '0.8rem', color: 'hsl(38 92% 60%)', marginBottom: '0.5rem' }}>
          Requires full confirmed payment. The linked request will be closed automatically.
        </p>
      )}
      {error && <p style={{ fontSize: '0.8rem', color: 'hsl(0 80% 70%)', marginBottom: '0.5rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
)

const OrderDetails = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [confirmErr, setConfirmErr] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [confirmingTxn, setConfirmingTxn] = useState(null)
  const [error, setError] = useState('')
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)

  useEffect(() => {
    Promise.all([getOrderById(orderId), getAllTransactions({ orderId })])
      .then(([o, t]) => { setOrder(o); setTransactions(Array.isArray(t) ? t : []) })
      .catch((e) => { setError(e.message || 'Failed to load order'); setOrder(null) })
      .finally(() => setLoading(false))
  }, [orderId])

  const requestConfirm = (newStatus) => {
    if (!order || newStatus === order.orderStatus) return
    setConfirmErr('')
    setConfirm(newStatus)
  }

  const applyStatusChange = async () => {
    setUpdatingStatus(true); setConfirmErr('')
    try {
      const updated = await updateOrderStatus(orderId, confirm)
      setOrder(updated); setConfirm(null)
    } catch (e) { setConfirmErr(e.message) }
    finally { setUpdatingStatus(false) }
  }

  const handleConfirmTxn = async (transactionId) => {
    setConfirmingTxn(transactionId)
    try {
      const updated = await confirmTransaction(transactionId, orderId)
      setTransactions((prev) => prev.map((t) => t.transactionId === transactionId ? updated : t))
    } catch (err) { alert('Confirm failed: ' + err.message) }
    finally { setConfirmingTxn(null) }
  }

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '' }/api/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      })
      if (!res.ok) throw new Error('Failed to generate invoice')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Invoice-${orderId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Invoice download failed: ' + err.message)
    } finally {
      setDownloadingInvoice(false)
    }
  }

  const totalConfirmed = transactions.filter((t) => t.status === 'Confirmed')
    .reduce((s, t) => s + Number(t.amountPaid || 0), 0)
  const balanceDue = Math.max(0, Number(order?.billingAmount || 0) - totalConfirmed)
  const curIdx = order ? statusIndex(order.orderStatus) : 0

  if (loading) return <p style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
  if (error)   return <p style={{ padding: '2rem', color: 'hsl(0 80% 70%)' }}>{error}</p>
  if (!order)  return null

  return (
    <div className="order-details-page">
      {confirm && (
        <StatusConfirm
          orderId={orderId}
          to={confirm}
          error={confirmErr}
          onConfirm={applyStatusChange}
          onCancel={() => setConfirm(null)}
        />
      )}

      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {order.orderId}
              <span className={`tag tag-${statusClass(order.orderStatus)}`}>{order.orderStatus}</span>
            </h1>
            <p>Placed on {order.orderPlacedDate || '—'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
          >
            <FileDown size={16} />
            {downloadingInvoice ? 'Generating…' : 'Download Invoice'}
          </button>
          <label style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Update status:</label>
          <select className="filter-select" value={order.orderStatus}
            disabled={updatingStatus || order.orderStatus === 'Complete'}
            onChange={(e) => requestConfirm(e.target.value)}>
            {STATUSES.map((s, i) => (
              <option key={s} value={s} disabled={i < curIdx}>{s}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="details-grid">
        <div className="details-left">
          <div className="card info-card">
            <h3 className="info-card-title">Client</h3>
            <div className="info-row"><span>Company</span><span>{order.client?.clientId || '—'}</span></div>
            <div className="info-row"><span>Contact</span><span>{order.client?.representativeName || '—'}</span></div>
            <div className="info-row"><span>Email</span><span>{order.client?.email || '—'}</span></div>
            <div className="info-row"><span>GST</span><span>{order.client?.gstNo || '—'}</span></div>
            <div className="info-row"><span>Delivery Address</span><span>{order.client?.deliveryAddress || '—'}</span></div>
          </div>

          {order.distributor && (
            <div className="card info-card">
              <h3 className="info-card-title">Distributor</h3>
              <div className="info-row"><span>Name</span><span>{order.distributor.distributorName}</span></div>
              <div className="info-row"><span>GST</span><span>{order.distributor.distributorGstNo}</span></div>
              <div className="info-row"><span>Address</span><span>{order.distributor.distributorAddress || '—'}</span></div>
            </div>
          )}

          {order.originalRequest && (
            <div className="card info-card">
              <h3 className="info-card-title">Linked Request</h3>
              <div className="info-row">
                <span>Request ID</span>
                <span className="font-mono">{order.originalRequest.requestId}</span>
              </div>
              <div className="info-row">
                <span>Subject</span>
                <span>{order.originalRequest.requestSubject || '—'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="details-right">
          <div className="card info-card">
            <h3 className="info-card-title">Order Items</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Part No</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {(order.orderDevices || []).map((od, i) => (
                    <tr key={i}>
                      <td className="font-mono">{od.device?.partNo || '—'}</td>
                      <td>{od.device?.partDescription || '—'}</td>
                      <td>{od.quantity}</td>
                      <td>₹{Number(od.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td>₹{Number(od.subtotal || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="billing-summary">
              <div className="billing-row"><span>Basic Amount</span><span>₹{Number(order.basicAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="billing-row"><span>GST (18%)</span><span>₹{Number(order.taxAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="billing-row total"><span>Total Billing</span><span>₹{Number(order.billingAmount || 0).toLocaleString('en-IN')}</span></div>
              <div className="billing-row"><span>Confirmed Paid</span><span style={{ color: 'hsl(142 70% 50%)' }}>₹{totalConfirmed.toLocaleString('en-IN')}</span></div>
              <div className="billing-row total">
                <span>Balance Due</span>
                <span style={{ color: balanceDue > 0 ? 'hsl(38 92% 60%)' : 'hsl(142 70% 50%)' }}>
                  ₹{balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="card info-card">
            <h3 className="info-card-title">Payment History</h3>
            {transactions.length === 0 ? (
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>No payments recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Transaction ID</th><th>Date</th><th>Mode</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.transactionId}>
                        <td className="font-mono" style={{ fontSize: '0.8rem' }}>{t.transactionId}</td>
                        <td>{t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td>{t.modeOfTransaction}</td>
                        <td>₹{Number(t.amountPaid || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`tag tag-${t.status === 'Confirmed' ? 'success' : 'pending'}`}>{t.status}</span>
                        </td>
                        <td>
                          {t.status === 'Pending' && (
                            <button className="btn btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                              disabled={confirmingTxn === t.transactionId}
                              onClick={() => handleConfirmTxn(t.transactionId)}>
                              {confirmingTxn === t.transactionId ? '…' : 'Confirm'}
                            </button>
                          )}
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

export default OrderDetails

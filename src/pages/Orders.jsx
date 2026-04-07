import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, ExternalLink, AlertCircle } from 'lucide-react'
import { getAllOrders, updateOrderStatus } from '../api/orderApi'
import './Orders.css'

const STATUSES = ['Placed', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered', 'Complete']

const statusClass = (s = '') => {
  const v = s.toLowerCase()
  if (v === 'complete' || v === 'delivered') return 'success'
  if (v === 'placed') return 'pending'
  return 'info'
}

const statusIndex = (s) => STATUSES.indexOf(s)

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const StatusConfirm = ({ orderId, from, to, onConfirm, onCancel, error }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="card glass-modal" style={{ maxWidth: 380, width: '90%', padding: '2rem', textAlign: 'center' }}>
      <AlertCircle size={36} style={{ margin: '0 auto 1rem', color: 'hsl(38 92% 60%)' }} />
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontFamily: 'Outfit' }}>Update Protocol</h3>
      <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
        Mark order <strong className="text-gradient font-mono">{orderId.slice(-6)}</strong> as <strong>{to}</strong>?
      </p>
      {to === 'Complete' && (
        <p style={{ fontSize: '0.8rem', color: 'hsl(38 92% 60%)', marginBottom: '1rem', padding: '0.5rem', background: 'hsl(38 92% 60% / 0.1)', borderRadius: '8px' }}>
          This requires full payment verification. The linked request will be closed.
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.8rem', color: '#fca5a5', marginBottom: '1rem' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Abort</button>
        <button className="btn btn-primary" onClick={onConfirm}>Execute</button>
      </div>
    </motion.div>
  </motion.div>
)

const POLL_INTERVAL = 15_000

const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [confirmErr, setConfirmErr] = useState('')
  const [updating, setUpdating] = useState(null)

  const fetchOrders = () =>
    getAllOrders()
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        const sorted = [...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setOrders(sorted)
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false))
    const id = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let result = orders
    if (statusFilter !== 'All Status') result = result.filter((o) => o.orderStatus === statusFilter)
    if (query) {
      const q = query.toLowerCase()
      result = result.filter((o) =>
        o.orderId?.toLowerCase().includes(q) || o.client?.clientId?.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [query, statusFilter, orders])

  const requestConfirm = (orderId, currentStatus, newStatus) => {
    if (newStatus === currentStatus) return
    setConfirmErr('')
    setConfirm({ orderId, from: currentStatus, to: newStatus })
  }

  const applyStatusChange = async () => {
    if (!confirm) return
    setUpdating(confirm.orderId)
    setConfirmErr('')
    try {
      const updated = await updateOrderStatus(confirm.orderId, confirm.to)
      setOrders((prev) => prev.map((o) => o.orderId === confirm.orderId ? updated : o))
      setConfirm(null)
    } catch (e) {
      setConfirmErr(e.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <motion.div className="orders-page" variants={containerVariants} initial="hidden" animate="show">
      <AnimatePresence>
        {confirm && (
          <StatusConfirm
            orderId={confirm.orderId}
            from={confirm.from}
            to={confirm.to}
            error={confirmErr}
            onConfirm={applyStatusChange}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Orders</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>Command center for logistics and supply chain.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/orders/new')}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> New Order
        </button>
      </motion.header>

      <motion.div variants={itemVariants} className="filter-bar card glass">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by order ID or client..."
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All Status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </motion.div>

      {error && <motion.div variants={itemVariants} className="card glass-error" style={{ marginBottom: '1rem' }}>{error}</motion.div>}

      <motion.div variants={itemVariants} className="card glass table-card">
        <div className="table-responsive">
          {loading ? (
            <p style={{ padding: '2rem', color: 'hsl(var(--primary))', textAlign: 'center', fontFamily: 'Outfit', letterSpacing: '0.1em' }}>SYNCING MATRIX...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>No parameters matched.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Client</th><th>Date</th>
                  <th>Value</th><th>Status</th><th>Override</th><th>Link</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {filtered.map((order) => {
                  const curIdx = statusIndex(order.orderStatus)
                  return (
                    <motion.tr key={order.orderId} variants={itemVariants} whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <td className="font-mono text-gradient">{order.orderId.slice(-8)}</td>
                      <td className="font-semibold">{order.client?.clientId || '—'}</td>
                      <td style={{fontSize: '0.8rem'}}>{order.orderPlacedDate || '—'}</td>
                      <td className="font-semibold">₹{Number(order.billingAmount || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`tag tag-${statusClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>
                        <select className="filter-select"
                          value={order.orderStatus}
                          disabled={updating === order.orderId || order.orderStatus === 'Complete'}
                          onChange={(e) => requestConfirm(order.orderId, order.orderStatus, e.target.value)}
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {STATUSES.map((s, i) => (
                            <option key={s} value={s} disabled={i < curIdx}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button className="icon-btn"
                          onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                          title="View details">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Orders

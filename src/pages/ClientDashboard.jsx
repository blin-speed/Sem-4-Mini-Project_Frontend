import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, MessageSquare, CreditCard, Plus, ArrowRight, CheckCircle, Clock, MoreVertical, TrendingUp } from 'lucide-react'
import { getAllOrders } from '../api/orderApi'
import { getAllRequests } from '../api/requestApi'
import { getAllTransactions } from '../api/transactionApi'
import './ClientDashboard.css'

const statusClass = (s) => {
  if (!s) return 'info'
  const v = s.toLowerCase()
  if (v === 'complete' || v === 'delivered') return 'success'
  if (v === 'placed' || v === 'pending') return 'pending'
  return 'info'
}

const reqStatusClass = (s = '') => {
  const v = s.toLowerCase()
  if (v === 'closed') return 'success'
  if (v === 'converted') return 'success'
  if (v === 'active') return 'info'
  return 'pending'
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const StatCard = ({ title, value, icon, color, loading, onClick }) => (
  <motion.div
    variants={itemVariants}
    className="card stat-card glass"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
    whileHover={onClick ? { scale: 1.02, y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" } : {}}
  >
    <div className="stat-header">
      <div className={`stat-icon-wrapper ${color}`}>{icon}</div>
      <button className="icon-btn" onClick={(e) => e.stopPropagation()}><MoreVertical size={16} /></button>
    </div>
    <div className="stat-content">
      <h3 className="stat-value text-gradient">{loading ? '—' : value}</h3>
      <p className="stat-title">{title}</p>
    </div>
    <div className="stat-footer">
      <span className="stat-change positive">
        <ArrowRight size={14} />updated
      </span>
    </div>
  </motion.div>
)

const POLL_INTERVAL = 20_000

const ClientDashboard = ({ user }) => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [balanceDue, setBalanceDue] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!user?.clientNo) return
    const [o, r] = await Promise.all([
      getAllOrders({ clientNo: user.clientNo }),
      getAllRequests({ clientNo: user.clientNo }),
    ])
    const ordersArr   = Array.isArray(o) ? o : []
    const requestsArr = Array.isArray(r) ? r : []
    setOrders([...ordersArr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    setRequests([...requestsArr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    let due = 0
    for (const ord of ordersArr.filter((o) => o.orderStatus !== 'Complete')) {
      try {
        const txns = await getAllTransactions({ orderId: ord.orderId })
        const confirmed = (Array.isArray(txns) ? txns : [])
          .filter((t) => t.status === 'Confirmed')
          .reduce((s, t) => s + Number(t.amountPaid || 0), 0)
        due += Math.max(0, Number(ord.billingAmount || 0) - confirmed)
      } catch { }
    }
    setBalanceDue(due)
  }

  useEffect(() => {
    if (!user?.clientNo) { setLoading(false); return }
    fetchData().finally(() => setLoading(false))
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [user])

  const activeOrders = orders.filter((o) => o.orderStatus !== 'Complete')
  const activeRequests = requests.filter((r) => r.status !== 'Closed' && r.status !== 'Converted')
  const activeSupport = activeRequests.filter((r) => r.requestType === 'Support').length
  const recentOrders = orders.slice(0, 5)
  const recentRequests = requests.filter((r) => r.status !== 'Closed' && r.status !== 'Converted').slice(0, 5)

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <motion.div className="dashboard" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Dashboard</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>{greet()}, {user?.representativeName || user?.clientId || 'Client'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/client/requests?new=true')}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          New Request
        </button>
      </motion.header>

      <motion.div className="stats-grid" variants={containerVariants}>
        <StatCard title="Active Orders"   value={loading ? '—' : activeOrders.length}    icon={<Package size={24} />}       color="emerald"  loading={loading} onClick={() => navigate('/client/orders')} />
        <StatCard title="Open Requests"   value={loading ? '—' : activeRequests.length}  icon={<MessageSquare size={24} />} color="amber"    loading={loading} onClick={() => navigate('/client/requests')} />
        <StatCard title="Support Issues"  value={loading ? '—' : activeSupport}          icon={<Clock size={24} />}         color="purple"   loading={loading} />
        <StatCard title="Outstanding Due"
          value={loading ? '—' : `₹${balanceDue.toLocaleString('en-IN')}`}
          icon={<CreditCard size={24} />} color="blue" loading={loading}
          onClick={() => navigate('/client/orders')} />
      </motion.div>

      <motion.div className="dashboard-grid" variants={containerVariants}>
        <motion.div variants={itemVariants} className="card glass recent-activity">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem'}}>Recent Orders</h3>
            <button className="btn-ghost" onClick={() => navigate('/client/orders')} style={{fontSize: '0.7rem'}}>View All</button>
          </div>
          {loading ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>Loading...</p>
          ) : recentOrders.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>No orders yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <motion.tr key={o.orderId} style={{ cursor: 'pointer' }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => navigate('/client/orders')}>
                      <td className="font-mono text-gradient" style={{fontSize: '0.75rem'}}>{o.orderId.slice(-6)}</td>
                      <td style={{fontWeight: 600, fontSize: '0.8rem'}}>₹{Number(o.billingAmount || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`tag tag-${statusClass(o.orderStatus)}`} style={{fontSize: '0.6rem'}}>{o.orderStatus}</span>
                      </td>
                      <td style={{fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))'}}>{o.orderPlacedDate || '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card glass recent-activity">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem'}}>Active Requests</h3>
            <button className="btn-ghost" onClick={() => navigate('/client/requests')} style={{fontSize: '0.7rem'}}>View All</button>
          </div>
          {loading ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>Loading...</p>
          ) : recentRequests.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>No open requests.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Type</th><th>Subject</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recentRequests.map((r) => (
                    <motion.tr key={r.requestId} style={{ cursor: 'pointer' }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => navigate('/client/requests')}>
                      <td style={{fontSize: '0.75rem'}}>
                        {r.requestType === 'Support' ? (
                          <span className="req-type-badge support" style={{fontSize: '0.6rem'}}>Support</span>
                        ) : (
                          <span style={{fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))'}}>{r.requestType}</span>
                        )}
                      </td>
                      <td style={{fontSize: '0.75rem'}}>{r.requestSubject}</td>
                      <td>
                        <span className={`tag tag-${reqStatusClass(r.status)}`} style={{fontSize: '0.6rem'}}>{r.status}</span>
                      </td>
                      <td style={{fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))'}}>{r.createdAt?.split('T')[0]}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default ClientDashboard

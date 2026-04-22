import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Users, ShoppingCart, Clock, ArrowUpRight, MoreVertical } from 'lucide-react'
import { getDashboardStats } from '../api/miscApi'
import { getAllOrders } from '../api/orderApi'
import { getAllClients } from '../api/clientApi'
import { getAllRequests } from '../api/requestApi'
import './Dashboard.css'

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
        <ArrowUpRight size={14} />updated
      </span>
    </div>
  </motion.div>
)

const statusClass = (s) => {
  if (!s) return 'info'
  const v = s.toLowerCase()
  if (v === 'delivered' || v === 'complete') return 'success'
  if (v === 'placed' || v === 'pending') return 'pending'
  return 'info'
}

const fmt = (n) =>
  n >= 10_00_000
    ? `₹${(n / 10_00_000).toFixed(1)}M`
    : n >= 1_000
    ? `₹${(n / 1_000).toFixed(0)}K`
    : `₹${n}`

const POLL_INTERVAL = 30_000

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [monthlyOrders, setMonthlyOrders] = useState(new Array(12).fill(0))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = () =>
    Promise.all([getDashboardStats(), getAllOrders(), getAllClients(), getAllRequests()])
      .then(([s, o, c, r]) => {
        const clientsArray = Array.isArray(c) ? c : []
        const requestsArray = Array.isArray(r) ? r : []
        
        // Filter out guests (matching backend logic: email field) and archived clients
        const realClients = clientsArray.filter(cl => 
          !cl.email?.endsWith('@placeholder.invalid') && 
          !cl.email?.startsWith('chat-') &&
          !cl.email?.includes('temp@') &&
          cl.accountStatus?.toLowerCase() !== 'archived'
        )
        const realRequests = requestsArray.filter(rq => 
          !rq.client?.email?.endsWith('@placeholder.invalid') && 
          !rq.client?.email?.startsWith('chat-') &&
          !rq.client?.email?.includes('temp@') &&
          rq.status !== 'Archived'
        )
        
        setStats({
          ...s,
          totalClients: realClients.length,
          pendingRequests: realRequests.filter(rq => rq.status !== 'Closed' && rq.status !== 'Converted').length
        })
        
        const ordersArray = Array.isArray(o) ? o : []
        
        // Calculate monthly orders for the current year
        const currentYear = new Date().getFullYear()
        const mOrders = new Array(12).fill(0)
        ordersArray.forEach(order => {
          if (order.createdAt) {
            const d = new Date(order.createdAt)
            if (d.getFullYear() === currentYear) {
              mOrders[d.getMonth()] += 1
            }
          }
        })
        setMonthlyOrders(mOrders)
        
        setOrders([...ordersArray].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5))
        setError('')
      })
      .catch((e) => setError(e.message || 'Failed to load dashboard'))

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div className="dashboard" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Dashboard</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>System metrics and operational data.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/orders/new')}>
          <TrendingUp size={18} style={{ marginRight: '0.5rem' }} />
          New Order
        </button>
      </motion.header>

      {error && (
        <motion.div variants={itemVariants} className="card glass-error" style={{ marginBottom: '1rem' }}>
          Failed to load data: {error}
        </motion.div>
      )}

      <motion.div className="stats-grid" variants={containerVariants}>
        <StatCard title="Active Clients"   value={stats?.totalClients}    icon={<Users size={24} />}       color="purple"  loading={loading} onClick={() => navigate('/admin/clients')} />
        <StatCard title="Pending Requests" value={stats?.pendingRequests} icon={<Clock size={24} />}        color="amber"   loading={loading} onClick={() => navigate('/admin/requests')} />
        <StatCard title="Active Orders"   value={stats?.pendingOrders}   icon={<ShoppingCart size={24} />} color="emerald" loading={loading} onClick={() => navigate('/admin/orders')} />
        <StatCard title="Global Revenue"
          value={stats ? fmt(Number(stats.totalRevenue || 0)) : '—'}
          icon={<TrendingUp size={24} />} color="blue" loading={loading}
          onClick={() => navigate('/admin/payments')} />
      </motion.div>

      <motion.div className="dashboard-grid" variants={containerVariants}>
        <motion.div variants={itemVariants} className="card glass recent-activity">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem'}}>Recent Orders</h3>
            <button className="btn-ghost" onClick={() => navigate('/admin/orders')} style={{fontSize: '0.7rem'}}>View All</button>
          </div>
          {loading ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>Loading...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>No orders yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Client</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <motion.tr key={o.orderId} style={{ cursor: 'pointer' }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      onClick={() => navigate(`/admin/orders/${o.orderId}`)}>
                      <td className="font-mono text-gradient" style={{fontSize: '0.75rem'}}>{o.orderId.slice(-6)}</td>
                      <td style={{fontSize: '0.75rem'}}>{o.client?.clientId || '—'}</td>
                      <td style={{fontWeight: 600, fontSize: '0.8rem'}}>₹{Number(o.billingAmount || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`tag tag-${statusClass(o.orderStatus)}`} style={{fontSize: '0.6rem'}}>{o.orderStatus}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="card glass main-chart-card">
          <div className="card-header">
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem'}}>Orders This Year</h3>
          </div>
          <div className="mock-chart">
            <div className="chart-bars">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((label, i) => {
                const currentMonth = new Date().getMonth(); // 0-11
                const isFuture = i > currentMonth;
                
                const v = isFuture ? 0 : monthlyOrders[i];
                const maxVal = Math.max(...monthlyOrders, 5);
                const heightPercentage = isFuture ? 0 : v === 0 ? 0 : Math.max(5, (v / maxVal) * 100);

                return (
                  <div key={label} className="chart-bar-wrapper" title={`${v} Orders`}>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 1, delay: 0.1 * i }}
                      className="chart-bar" 
                    />
                    <span className="chart-label" style={{ fontSize: '0.45rem' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard

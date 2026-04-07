import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CreditCard, CheckCircle, Clock, Truck, ChevronDown, ChevronUp, Box, Layers, Star } from 'lucide-react'
import { getAllOrders } from '../api/orderApi'
import { getAllTransactions, logTransaction } from '../api/transactionApi'
import './ClientOrders.css'

const STEPS = ['Placed', 'Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered', 'Complete']

const stepIcon = (step, idx, curIdx) => {
  if (idx < curIdx) return <CheckCircle size={18} />
  if (idx === curIdx) return <Truck size={18} />
  return <Clock size={18} />
}

const statusColor = (s = '') => {
  const v = s.toLowerCase()
  if (v === 'complete') return '#4ade80'
  if (v === 'delivered') return '#60a5fa'
  if (v === 'shipped') return '#a78bfa'
  if (v === 'placed') return 'hsl(var(--muted-foreground))'
  return 'hsl(var(--primary))'
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const PayForm = ({ order, due, onPaid, onClose }) => {
  const [mode, setMode] = useState('NEFT')
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setPaying(true)
    try {
      const payload = {
        transactionId: `TXN-${Date.now()}`,
        orderId: order.orderId,
        modeOfTransaction: mode,
        amountPaid: parseFloat(amount),
      }
      const saved = await logTransaction(payload)
      onPaid(order.orderId, saved)
      onClose()
    } catch (err) { alert('Payment failed: ' + err.message) }
    finally { setPaying(false) }
  }

  return (
    <motion.div className="pay-inline-form glass card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {/* <div className="glow-effect" /> */}
      <h5 className="pay-form-title text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Make a Payment</h5>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <div className="input-group" style={{ margin: 0, minWidth: 120 }}>
          <label className="input-label">Payment Method</label>
          <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>NEFT</option><option>RTGS</option><option>UPI</option><option>Cheque</option>
          </select>
        </div>
        <div className="input-group" style={{ margin: 0, minWidth: 140 }}>
          <label className="input-label">Amount (₹)</label>
          <input type="text" inputMode="decimal" className="input-field"
            placeholder={`Up to ₹${due.toLocaleString('en-IN')}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} required />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>Cancel</button>
          <button type="submit" disabled={paying} className="btn btn-primary" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            <CreditCard size={15} style={{ marginRight: '0.35rem' }} />
            {paying ? 'Processing...' : 'Submit Payment'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

const ClientOrders = ({ user }) => {
  const [orders, setOrders] = useState([])
  const [transactions, setTransactions] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [payForm, setPayForm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.clientNo) return
    getAllOrders(user.clientNo)
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        setOrders([...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        if (arr.length > 0) setExpanded(arr[0].orderId)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [user])

  const loadTransactions = async (orderId) => {
    try {
      const txns = await getAllTransactions({ orderId })
      setTransactions((prev) => ({ ...prev, [orderId]: Array.isArray(txns) ? txns : [] }))
    } catch {
      setTransactions((prev) => ({ ...prev, [orderId]: [] }))
    }
  }

  useEffect(() => {
    if (!expanded) return
    const id = setInterval(() => {
      getAllTransactions({ orderId: expanded })
        .then((txns) => {
          if (!Array.isArray(txns)) return
          setTransactions((prev) => {
            const current = prev[expanded] || []
            const changed = txns.length !== current.length ||
              txns.some((t, i) => t.status !== current[i]?.status)
            return changed ? { ...prev, [expanded]: txns } : prev
          })
        })
        .catch(() => {})
    }, 10_000)
    return () => clearInterval(id)
  }, [expanded])

  const handleExpand = (orderId) => {
    if (expanded === orderId) { setExpanded(null); return }
    setExpanded(orderId)
    setPayForm(null)
    loadTransactions(orderId)
  }

  const handlePaid = (orderId, newTxn) => {
    setTransactions((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newTxn],
    }))
  }

  const totalConfirmed = (orderId) =>
    (transactions[orderId] || [])
      .filter((t) => t.status === 'Confirmed')
      .reduce((s, t) => s + Number(t.amountPaid || 0), 0)

  const handleDownloadInvoice = (orderId) => {
    const url = `${import.meta.env.VITE_API_URL || '' }/api/orders/${orderId}/invoice`
    // Create an invisible link and click it to trigger attachment download
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Invoice-${orderId}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <p style={{ padding: '2rem', color: 'hsl(var(--primary))', fontFamily: 'Outfit', letterSpacing: '0.1em', textAlign: 'center' }}>Loading your orders...</p>

  if (orders.length === 0) return (
    <div className="co-empty">
      <Package size={52} style={{ opacity: 0.25, margin: '0 auto 1rem', color: 'hsl(var(--primary))' }} />
      <h3 className="text-gradient" style={{fontFamily: 'Outfit'}}>No Orders Yet</h3>
      <p style={{color: 'hsl(var(--muted-foreground))'}}>Your orders will appear here once they're confirmed.</p>
    </div>
  )

  return (
    <motion.div className="co-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="co-header">
        <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>My Orders</h1>
        <p style={{color: 'hsl(var(--muted-foreground))'}}>{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </motion.header>

      <motion.div className="co-list" variants={containerVariants}>
        {orders.map((order) => {
          const curIdx  = STEPS.indexOf(order.orderStatus)
          const isOpen  = expanded === order.orderId
          const paid    = totalConfirmed(order.orderId)
          const due     = Math.max(0, Number(order.billingAmount || 0) - paid)
          const txns    = transactions[order.orderId] || []
          const isComplete = order.orderStatus === 'Complete'

          return (
            <motion.div variants={itemVariants} key={order.orderId} className={`co-card card glass ${isOpen ? 'co-card-open' : ''}`}>
              <div className="co-card-header" onClick={() => handleExpand(order.orderId)}>
                <div className="co-order-id-row">
                  <Box size={16} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                  <span className="co-order-id font-mono text-gradient">{order.orderId.substring(0, 13)}</span>
                  <span className="co-status-pill"
                    style={{ background: `${statusColor(order.orderStatus)}22`, color: statusColor(order.orderStatus), border: `1px solid ${statusColor(order.orderStatus)}` }}>
                    {order.orderStatus}
                  </span>
                  {isComplete && <Star size={14} style={{ color: '#facc15', marginLeft: '0.25rem' }} />}
                </div>
                <div className="co-meta">
                  <span style={{opacity: 0.7}}>{order.orderPlacedDate || '—'}</span>
                  <span className="co-amount">₹{Number(order.billingAmount || 0).toLocaleString('en-IN')}</span>
                  {curIdx >= 1 && (
                    <button 
                      className="btn-ghost co-download-btn" 
                      onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order.orderId); }}
                      title="Download Invoice"
                      style={{ padding: '4px 8px', borderRadius: '4px', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      <CreditCard size={14} /> Invoice
                    </button>
                  )}
                  {isOpen ? <ChevronUp size={17} style={{color: 'hsl(var(--primary))'}} /> : <ChevronDown size={17} />}
                </div>
              </div>

              {/* ── Progress stepper ── */}
              <div className="co-stepper">
                {STEPS.map((step, i) => {
                  const done    = i < curIdx
                  const current = i === curIdx
                  return (
                    <div key={step} className={`co-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                      <div className="co-step-dot">
                        {done || current ? stepIcon(step, i, curIdx) : <span className="co-dot-empty" />}
                      </div>
                      <span className="co-step-label">{step}</span>
                      {i < STEPS.length - 1 && <div className={`co-step-line ${done ? 'done' : ''}`} />}
                    </div>
                  )
                })}
              </div>

              {/* ── Expanded body ── */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div className="co-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}>
                    <div className="co-section">
                      <h4 className="co-section-title text-gradient">
                        <Layers size={15} style={{ marginRight: '0.4rem', color: 'hsl(var(--primary))' }} /> Items in Order
                      </h4>
                      <div className="co-items">
                        {(order.orderDevices || []).map((od, i) => (
                          <div key={i} className="co-item-row glass" style={{background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)'}}>
                            <div className="co-item-icon">
                              <Package size={22} style={{color: 'hsl(var(--primary))'}} />
                            </div>
                            <div className="co-item-info">
                              <p className="co-item-name">{od.device?.partDescription || od.device?.partNo || '—'}</p>
                              <p className="co-item-meta font-mono" style={{opacity: 0.7}}>
                                {od.device?.partNo} · Qty {od.quantity} · ₹{Number(od.unitPrice || 0).toLocaleString('en-IN')} each
                              </p>
                            </div>
                            <div className="co-item-subtotal text-gradient">
                              ₹{Number(od.subtotal || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="co-billing glass" style={{background: 'rgba(0,0,0,0.3)'}}>
                        <div className="co-bill-row"><span style={{opacity: 0.7}}>Subtotal</span><span>₹{Number(order.basicAmount || 0).toLocaleString('en-IN')}</span></div>
                        <div className="co-bill-row"><span style={{opacity: 0.7}}>GST (18%)</span><span>₹{Number(order.taxAmount || 0).toLocaleString('en-IN')}</span></div>
                        <div className="co-bill-row co-bill-total"><span style={{color: 'hsl(var(--primary))'}}>Total</span><span className="text-gradient" style={{fontSize: '1.25rem'}}>₹{Number(order.billingAmount || 0).toLocaleString('en-IN')}</span></div>
                      </div>
                    </div>

                    {(order.orderDeliveryDate || order.client?.deliveryAddress) && (
                      <div className="co-section">
                        <h4 className="co-section-title text-gradient">
                          <Truck size={15} style={{ marginRight: '0.4rem', color: 'hsl(var(--primary))' }} /> Delivery Information
                        </h4>
                        <div className="glass" style={{padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)'}}>
                          {order.orderDeliveryDate && (
                            <p className="co-delivery-date" style={{marginBottom: '0.5rem', color: 'hsl(var(--muted-foreground))'}}>Expected Delivery: <strong style={{color: '#fff', marginLeft: '0.5rem'}}>{order.orderDeliveryDate}</strong></p>
                          )}
                          {order.client?.deliveryAddress && (
                            <p className="co-delivery-addr" style={{opacity: 0.8}}>{order.client.deliveryAddress}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="co-section">
                      <h4 className="co-section-title text-gradient">
                        <CreditCard size={15} style={{ marginRight: '0.4rem', color: 'hsl(var(--primary))' }} /> Financials
                      </h4>

                      <div className="co-pay-status glass" style={{background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px'}}>
                        <div className="co-pay-bar-wrap">
                          <div className="co-pay-bar glow-effect"
                            style={{ width: `${Math.min(100, (paid / Number(order.billingAmount || 1)) * 100)}%`, background: '#4ade80' }} />
                        </div>
                        <div className="co-pay-figures">
                          <span style={{ color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>₹{paid.toLocaleString('en-IN')} Paid</span>
                          {due > 0 && <span style={{ color: '#facc15', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>₹{due.toLocaleString('en-IN')} Remaining</span>}
                          {due === 0 && <span style={{ color: '#4ade80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem' }}>Fully Paid ✓</span>}
                        </div>
                      </div>

                      {txns.length > 0 && (
                        <div className="co-txn-list">
                          {txns.map((t) => (
                            <div key={t.transactionId} className="co-txn-row glass" style={{background: 'rgba(255,255,255,0.02)'}}>
                              <span className="co-txn-id font-mono text-gradient" style={{fontSize: '0.75rem'}}>{t.transactionId.slice(-8)}</span>
                              <span style={{fontSize: '0.75rem', opacity: 0.8}}>{t.modeOfTransaction}</span>
                              <span style={{fontWeight: 700}}>₹{Number(t.amountPaid || 0).toLocaleString('en-IN')}</span>
                              <span className={`tag tag-${t.status === 'Confirmed' ? 'success' : 'pending'}`}
                                style={{ fontSize: '0.65rem' }}>{t.status}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {due > 0 && !isComplete && (
                        <AnimatePresence mode="wait">
                          {payForm === order.orderId ? (
                            <PayForm key="form" order={order} due={due} onPaid={handlePaid} onClose={() => setPayForm(null)} />
                          ) : (
                            <motion.button key="btn" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                              className="btn btn-primary co-pay-btn"
                              style={{textTransform: 'uppercase', letterSpacing: '0.1em'}}
                              onClick={() => setPayForm(order.orderId)}>
                              <CreditCard size={16} style={{ marginRight: '0.4rem' }} /> Make Payment
                            </motion.button>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

export default ClientOrders

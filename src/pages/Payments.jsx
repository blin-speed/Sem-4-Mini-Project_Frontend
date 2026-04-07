import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, CreditCard, CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react'
import { getAllTransactions, confirmTransaction } from '../api/transactionApi'
import './Payments.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const Payments = () => {
  const [transactions, setTransactions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(null)

  useEffect(() => {
    getAllTransactions()
      .then((data) => {
        const transactionsArray = Array.isArray(data) ? data : []
        const sorted = [...transactionsArray].sort(
          (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
        )
        setTransactions(sorted)
        setFiltered(sorted)
      })
      .catch((e) => {
        setError(e.message || 'Failed to load transactions')
        setTransactions([])
        setFiltered([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(
      transactions.filter(
        (t) =>
          t.transactionId?.toLowerCase().includes(q) ||
          t.order?.orderId?.toLowerCase().includes(q)
      )
    )
  }, [query, transactions])

  const handleConfirm = async (transactionId) => {
    setConfirming(transactionId)
    try {
      // Find the transaction to get its orderId
      const transaction = transactions.find((t) => t.transactionId === transactionId)
      const orderId = transaction?.order?.orderId
      if (!orderId) {
        alert('Order ID not found for this transaction')
        setConfirming(null)
        return
      }
      const updated = await confirmTransaction(transactionId, orderId)
      setTransactions((prev) =>
        prev.map((t) => (t.transactionId === transactionId ? updated : t))
      )
    } catch (err) {
      alert('Failed to confirm: ' + err.message)
    } finally {
      setConfirming(null)
    }
  }

  const totalReceived = transactions
    .filter((t) => t.status === 'Confirmed')
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0)

  const totalPending = transactions
    .filter((t) => t.status === 'Pending')
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0)

  const statusIcon = (s) => {
    if (s === 'Confirmed') return <CheckCircle size={14} />
    if (s === 'Failed') return <AlertCircle size={14} />
    return <Clock size={14} />
  }

  return (
    <motion.div className="payments-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Payments</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>View and confirm client payments.</p>
        </div>
      </motion.header>

      <motion.div variants={itemVariants} className="summary-row">
        <div className="card glass summary-card">
          <div className="summary-icon blue"><ArrowUpRight size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Total Verified</span>
            <span className="summary-value text-gradient">₹{totalReceived.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="card glass summary-card">
          <div className="summary-icon amber"><Clock size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Awaiting Verification</span>
            <span className="summary-value" style={{color: '#facc15'}}>₹{totalPending.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="card glass summary-card">
          <div className="summary-icon red"><AlertCircle size={20} /></div>
          <div className="summary-info">
            <span className="summary-label">Pending Packets</span>
            <span className="summary-value" style={{color: '#f87171'}}>
              {transactions.filter((t) => t.status === 'Pending').length}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="filter-bar glass card">
        <div className="search-box">
          <Search size={18} className="search-icon" style={{color: 'hsl(var(--primary))'}} />
          <input
            type="text"
            placeholder="Search by transaction ID or order ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="card glass-error" style={{ marginBottom: '1rem' }}>{error}</motion.div>
      )}

      <motion.div variants={itemVariants} className="card glass table-card">
        <div className="table-header"><h3 style={{textTransform: 'uppercase', letterSpacing: '0.1em'}}>Transaction History</h3></div>
        <div className="table-responsive">
          {loading ? (
            <p style={{ padding: '2rem', color: 'hsl(var(--primary))', textAlign: 'center', fontFamily: 'Outfit', letterSpacing: '0.1em' }}>SYNCING LEDGER...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>No transactions recorded.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Order Ref</th>
                  <th>Timestamp</th>
                  <th>Protocol</th>
                  <th>Amount</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants}>
                {filtered.map((txn) => (
                  <motion.tr variants={itemVariants} key={txn.transactionId} whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="font-mono text-gradient">{txn.transactionId.slice(-8)}</td>
                    <td className="font-mono" style={{ opacity: 0.7 }}>
                      {txn.order?.orderId.slice(-8) || '—'}
                    </td>
                    <td style={{fontSize: '0.8rem'}}>
                      {txn.transactionDate
                        ? new Date(txn.transactionDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <div className="payment-method">
                        <CreditCard size={14} />
                        {txn.modeOfTransaction}
                      </div>
                    </td>
                    <td style={{fontWeight: 700, color: '#fff'}}>
                      ₹{Number(txn.amountPaid || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: Number(txn.amountPending) > 0 ? '#facc15' : 'hsl(var(--muted-foreground))' }}>
                      ₹{Number(txn.amountPending || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div className={`status-badge ${txn.status?.toLowerCase()}`}>
                        {statusIcon(txn.status)}
                        {txn.status}
                      </div>
                    </td>
                    <td>
                      {txn.status === 'Pending' && (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.7rem', padding: '0.4rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                          disabled={confirming === txn.transactionId}
                          onClick={() => handleConfirm(txn.transactionId)}
                        >
                          {confirming === txn.transactionId ? '...' : 'Verify'}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Payments

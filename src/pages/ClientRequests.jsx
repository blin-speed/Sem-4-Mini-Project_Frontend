import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Search, Archive, ArrowLeft } from 'lucide-react'
import { getAllRequests } from '../api/requestApi'
import { useNavigate } from 'react-router-dom'
import './ClientRequests.css'

const LIST_POLL = 10_000

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const ClientRequests = ({ user }) => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')

  const fetchRequests = () => {
    if (!user?.clientNo) return Promise.resolve()
    return getAllRequests(user.clientNo)
      .then((data) => {
        const arr = Array.isArray(data) ? data : []
        const sorted = [...arr].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRequests(sorted)
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!user?.clientNo) { setLoading(false); return }
    fetchRequests().finally(() => setLoading(false))
    const id = setInterval(fetchRequests, LIST_POLL)
    return () => clearInterval(id)
  }, [user])

  const statusLabel = (s = '') => {
    if (s === 'New') return { label: 'Pending', cls: 'pending' }
    if (s === 'Active') return { label: 'Submitted', cls: 'resolved' }
    if (s === 'Converted') return { label: 'In Order', cls: 'resolved' }
    if (s === 'Closed') return { label: 'Closed', cls: 'resolved' }
    return { label: s, cls: 'pending' }
  }

  const match = (r) => {
    const q = query.toLowerCase()
    return r.requestSubject?.toLowerCase().includes(q) || r.requestId?.toLowerCase().includes(q)
  }

  const activeReqs = requests.filter(r => r.status !== 'Closed' && r.status !== 'Converted')
    .filter(r => typeFilter === 'All' || (r.requestType || 'Lead') === typeFilter)
  const archivedReqs = requests.filter(r => r.status === 'Closed' || r.status === 'Converted')
    .filter(r => typeFilter === 'All' || (r.requestType || 'Lead') === typeFilter)

  const handleSelectRequest = (req) => {
    navigate(`/client/requests/chat/${req.requestId}`)
  }

  const renderItem = (req) => {
    const { label, cls } = statusLabel(req.status)
    const isSupport = req.requestType === 'Support'
    return (
      <motion.div variants={itemVariants} key={req.requestId}
        className="req-item glass"
        onClick={() => handleSelectRequest(req)}
        whileHover={{ scale: 1.01, x: 3, y: -1 }}>
        <div className="req-item-top">
          <span className="req-id-tag font-mono">{req.requestId.slice(-8)}</span>
          <span className={'req-status ' + cls}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          {isSupport && <span className="req-type-badge support">Support</span>}
          <p className="req-subject" style={{ marginBottom: 0 }}>{req.requestSubject}</p>
        </div>
        <span className="req-date font-mono" style={{ opacity: 0.6 }}>{req.createdAt?.split('T')[0]}</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>My Requests</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>View and manage your submitted requests</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/client/requests-intro')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', color: 'hsl(var(--primary))' }}
          title="Go back"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        {['All', 'Lead', 'Support'].map((t) => (
          <button key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              flex: 1,
              padding: '0.6rem 0',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
              background: typeFilter === t ? 'hsl(var(--primary))' : 'transparent',
              color: typeFilter === t ? '#fff' : 'hsl(var(--muted-foreground))',
              transition: 'all 0.15s'
            }}>
            {t === 'Lead' ? 'Sales Leads' : t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="req-search" style={{ marginBottom: '1.5rem' }}>
        <Search size={15} style={{ color: 'hsl(var(--primary))' }} />
        <input
          type="text"
          placeholder="Search by ID or subject…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* List */}
      <motion.div variants={containerVariants} className="req-list">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading requests…</p>
        ) : requests.length === 0 ? (
          <div className="req-empty" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <Clock size={32} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No requests yet</p>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Create your first request to get started
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/client/requests-intro')}
            >
              Create Request
            </button>
          </div>
        ) : (
          <>
            {/* Active Requests */}
            {activeReqs.filter(match).length > 0 && (
              <>
                {activeReqs.filter(match).map(renderItem)}
              </>
            )}

            {/* Separator */}
            {activeReqs.length > 0 && archivedReqs.length > 0 && (
              <div style={{
                margin: '1.5rem 0',
                padding: '0 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: 0.5
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Archived</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>
            )}

            {/* Archived Toggle Button */}
            {archivedReqs.length > 0 && (
              <button
                className="btn-ghost"
                onClick={() => setShowArchived(v => !v)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'hsl(var(--muted-foreground))',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: showArchived ? '1rem' : 0,
                  transition: 'all 0.15s',
                  borderRadius: '0.5rem'
                }}>
                <Archive size={14} />
                {showArchived ? 'Hide' : 'Show'} Archived ({archivedReqs.length})
                <span style={{ marginLeft: 'auto' }}>{showArchived ? '▴' : '▾'}</span>
              </button>
            )}

            {/* Archived Requests */}
            <AnimatePresence>
              {showArchived && archivedReqs.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {archivedReqs.filter(match).map(renderItem)}
                </motion.div>
              )}
            </AnimatePresence>

            {/* No results message */}
            {activeReqs.filter(match).length === 0 && ((!showArchived || archivedReqs.filter(match).length === 0)) && (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'hsl(var(--muted-foreground))',
                fontSize: '0.9rem'
              }}>
                No requests match your search
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ClientRequests

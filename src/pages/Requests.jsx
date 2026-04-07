import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search, Building, Mail, ChevronRight, MessageSquare, PlusCircle } from 'lucide-react'
import { getAllRequests, getMessages } from '../api/requestApi'
import './Requests.css'

const SUMMARY_MARKER = '[INTAKE_SUMMARY]'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

// Fetch and extract summary text from messages for a request
const useSummaries = (requests) => {
  const [summaries, setSummaries] = useState({})

  useEffect(() => {
    if (!requests.length) return
    requests.forEach(async (req) => {
      if (summaries[req.requestId] !== undefined) return
      try {
        const msgs = await getMessages(req.requestId)
        if (!Array.isArray(msgs)) return
        const agentMsgs = msgs.filter(m => m.dmSender === 'Agent')
        const tagged = agentMsgs.find(m => m.messageContent?.startsWith(SUMMARY_MARKER))
        const fallback = [...agentMsgs].reverse().find(m =>
          m.messageContent?.includes('Here is a summary') ||
          m.messageContent?.includes('Problem Description:') ||
          (m.messageContent?.includes('Budget:') && m.messageContent?.includes('Timeline:'))
        )
        const text = tagged
          ? tagged.messageContent.replace(SUMMARY_MARKER, '').trim()
          : fallback?.messageContent?.replace(/^\[PROFILE_PHASE\]/, '').trim() || ''
        setSummaries(prev => ({ ...prev, [req.requestId]: text }))
      } catch {
        setSummaries(prev => ({ ...prev, [req.requestId]: '' }))
      }
    })
  }, [requests])

  return summaries
}

const Requests = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('Lead') // 'Lead' | 'Support' | 'Direct' | 'Direct'

  useEffect(() => {
    setLoading(true)
    getAllRequests()
      .then((data) => {
        const reqs = (Array.isArray(data) ? data : [])
          .filter(r => !r.client?.email?.endsWith('@placeholder.invalid'))
          // Exclude archived/closed — those are in the Archive section
          .filter(r => r.status !== 'Archived' && r.status !== 'Closed')
        reqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRequests(reqs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const summaries = useSummaries(requests)

  const filtered = requests
    .filter((r) => (r.requestType || 'Lead') === typeFilter)
    .filter((r) => {
      const q = query.toLowerCase()
      return r.requestSubject?.toLowerCase().includes(q) ||
             r.client?.clientId?.toLowerCase().includes(q) ||
             r.requestId?.toLowerCase().includes(q)
    })

  const tagClass = (s = '') => {
    const v = s.toLowerCase()
    if (v === 'active') return 'info'
    if (v === 'closed' || v === 'converted') return 'success'
    return 'pending'
  }

  return (
    <motion.div className="requests-overview-container" variants={containerVariants} initial="hidden" animate="show" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Request Bank</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Review inbound leads and support tickets.</p>
        </div>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', margin: '0 0 2rem 0', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          {['Lead', 'Support', 'Direct'].map((t) => (
            <button key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                width: '120px', padding: '0.6rem 0', fontSize: '0.85rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer',
                background: typeFilter === t ? 'hsl(var(--primary))' : 'transparent',
                color: typeFilter === t ? '#fff' : 'hsl(var(--muted-foreground))',
                transition: 'all 0.15s',
              }}>
              {t === 'Lead' ? 'Sales Leads' : t === 'Support' ? 'Support' : 'Direct ChaSupport' ? 'Support' : 'Direct Chat'}
            </button>
          ))}
        </div>
        <div className="search-box" style={{ maxWidth: '380px', width: '380px', margin: 0, padding: '0.6rem 1rem' }}>
          <Search size={16} strokeWidth={2.5} style={{ opacity: 0.7 }} />
          <input type="text" placeholder="Search requests..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ fontSize: '0.9rem' }} />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading request databanks…</p>
      ) : filtered.length === 0 ? (
        <div className="card glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2, color: 'hsl(var(--primary))' }} />
          <h3 className="text-gradient">No {typeFilter} records found</h3>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Any incoming {typeFilter.toLowerCase()} requests will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(req => {
            const summaryRaw = summaries[req.requestId]
            const summaryPreview = summaryRaw
              ? summaryRaw.replace(/\*\*/g, '').split('\n').filter(Boolean).slice(0, 3).join(' · ')
              : null
            const displayTitle = (req.requestSubject && req.requestSubject !== 'Untitled Request' && !req.requestSubject.startsWith('Manual '))
              ? req.requestSubject
              : summaryRaw
                ? summaryRaw.replace(/\*\*/g, '').split('\n').find(l => l.trim())?.trim() || req.requestSubject || 'Untitled Request'
                : req.requestSubject || 'Untitled Request'

            return (
              <motion.div variants={itemVariants} key={req.requestId} className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="font-mono text-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{req.requestId.slice(-8)}</span>
                      <span className={'tag tag-' + tagClass(req.status)}>{req.status}</span>
                      <span className="tag" style={{ background: 'rgba(255,255,255,0.08)', color: 'hsl(var(--muted-foreground))', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
                        {req.requestType === 'Direct' ? 'Direct Chat' : req.requestType || 'Lead'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {displayTitle}
                    </h3>
                  </div>
                </div>

                {/* Client Info Strip */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--foreground))', marginBottom: '0.4rem' }}>
                    <Building size={14} color="hsl(var(--muted-foreground))" />
                    <strong>{req.client?.clientId || 'Unknown Organization'}</strong>
                    {req.client?.representativeName && <span style={{ color: 'hsl(var(--muted-foreground))' }}>({req.client.representativeName})</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                    <Mail size={14} />
                    <span>{req.client?.email || 'No email provided'}</span>
                  </div>
                  {req.requestType === 'Support' && req.linkedOrderId && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'hsl(var(--foreground))', marginTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                       <span style={{ color: 'hsl(var(--primary))', fontFamily: 'monospace', fontWeight: 600 }}>🔗 Order: {req.linkedOrderId}</span>
                     </div>
                  )}
                </div>

                {/* Agent Summary Preview */}
                {summaryPreview && (
                  <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
                    <span style={{ color: 'hsl(var(--primary))', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agent Summary</span>
                    <p style={{ margin: '0.25rem 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{summaryPreview}</p>
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost" style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={() => navigate(`/admin/requests/chat?id=${req.requestId}`)}>
                      Transcript <ChevronRight size={13} />
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => navigate(`/admin/orders/new?requestId=${req.requestId}`)}>
                      <PlusCircle size={13} /> Create Order
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

export default Requests

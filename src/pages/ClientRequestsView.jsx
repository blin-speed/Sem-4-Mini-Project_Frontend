import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { getAllRequests, getMessages } from '../api/requestApi'
import './ClientRequests.css'

const SUMMARY_MARKER = '[INTAKE_SUMMARY]'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const extractSummary = (msgs) => {
  if (!Array.isArray(msgs)) return ''
  const agentMsgs = msgs.filter(m => m.dmSender === 'Agent')
  const tagged = agentMsgs.find(m => m.messageContent?.startsWith(SUMMARY_MARKER))
  if (tagged) return tagged.messageContent.replace(SUMMARY_MARKER, '').trim()
  const fallback = [...agentMsgs].reverse().find(m =>
    m.messageContent?.includes('Here is a summary') ||
    m.messageContent?.includes('Problem Description:') ||
    (m.messageContent?.includes('Budget:') && m.messageContent?.includes('Timeline:'))
  )
  return fallback?.messageContent?.replace(/^\[PROFILE_PHASE\]/, '').trim() || ''
}

const statusInfo = (s = '') => {
  if (s === 'New')       return { label: 'Pending',   color: '#f59e0b', icon: Clock }
  if (s === 'Active')    return { label: 'Active',     color: '#3b82f6', icon: AlertCircle }
  if (s === 'Converted') return { label: 'In Order',   color: '#4ade80', icon: CheckCircle }
  if (s === 'Closed')    return { label: 'Closed',     color: '#6b7280', icon: CheckCircle }
  if (s === 'Archived')  return { label: 'Archived',   color: '#6b7280', icon: CheckCircle }
  return { label: s, color: '#a1a1aa', icon: Clock }
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const ClientRequestsView = ({ user }) => {
  const navigate = useNavigate()
  const [requests,  setRequests]  = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user?.clientNo) { setLoading(false); return }
    getAllRequests(user.clientNo)
      .then(data => {
        const arr = (Array.isArray(data) ? data : [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRequests(arr)

        // Fetch summaries for all requests
        arr.forEach(async (req) => {
          try {
            const msgs = await getMessages(req.requestId)
            const summary = extractSummary(msgs)
            setSummaries(prev => ({ ...prev, [req.requestId]: summary }))
          } catch {
            setSummaries(prev => ({ ...prev, [req.requestId]: '' }))
          }
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', gap: '1.5rem', overflowY: 'auto' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn-ghost"
          onClick={() => navigate('/client/requests-intro')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
        >
          ← Back
        </button>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>My Requests</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>All your submitted requests and their status.</p>
        </div>
      </motion.div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
        {/* Request list */}
        <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          {loading ? (
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading your requests…</p>
          ) : requests.length === 0 ? (
            <motion.div variants={itemVariants} className="card glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.15, color: 'hsl(var(--primary))' }} />
              <h3 className="text-gradient">No requests yet</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>You haven't submitted any requests.</p>
              <button className="btn btn-primary" onClick={() => navigate('/client/requests-intro')}>
                Create a Request
              </button>
            </motion.div>
          ) : (
            requests.map(req => {
              const { label, color, icon: StatusIcon } = statusInfo(req.status)
              const summary = summaries[req.requestId]
              const displayTitle = (req.requestSubject && req.requestSubject !== 'Untitled Request' && !req.requestSubject.startsWith('Manual '))
                ? req.requestSubject
                : summary
                  ? summary.replace(/\*\*/g, '').split('\n').find(l => l.trim())?.trim() || req.requestSubject || 'Untitled Request'
                  : req.requestSubject || 'Untitled Request'

              return (
                <motion.div
                  key={req.requestId}
                  variants={itemVariants}
                  className="card glass"
                  style={{ padding: '1.25rem 1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Row 1: Title + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0, lineHeight: 1.4 }}>{displayTitle}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, color }}>
                      <StatusIcon size={13} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{label}</span>
                    </div>
                  </div>

                  {/* Row 2: Summary */}
                  {summary ? (
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {summary.replace(/\*\*/g, '').split('\n').filter(Boolean).join(' · ')}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', opacity: 0.5, margin: '0 0 0.75rem' }}>
                      {summaries[req.requestId] === undefined ? 'Loading summary…' : 'No summary available'}
                    </p>
                  )}

                  {/* Row 3: Date + Transcript button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-mono" style={{ fontSize: '0.73rem', color: 'hsl(var(--muted-foreground))' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => navigate(`/client/requests/${req.requestId}/transcript`)}
                    >
                      <FileText size={13} /> Transcript
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ClientRequestsView

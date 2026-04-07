import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import { getAllRequests, getMessages } from '../api/requestApi'
import './ClientRequests.css'

const ClientTranscriptPage = ({ user }) => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request,  setRequest]  = useState(null)
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const initialLoad = useRef(true)
  const bottomRef   = useRef(null)

  useEffect(() => {
    if (!user?.clientNo || !requestId) return
    getAllRequests(user.clientNo)
      .then(data => {
        const req = (Array.isArray(data) ? data : []).find(r => r.requestId === requestId)
        setRequest(req || null)
        if (!req) { setLoading(false); return }
        return getMessages(requestId)
          .then(msgs => setMessages(Array.isArray(msgs) ? msgs : []))
          .catch(() => setMessages([]))
          .finally(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [requestId, user])

  // Only auto-scroll on new messages, not initial load
  useEffect(() => {
    if (initialLoad.current) { initialLoad.current = false; return }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const visibleMessages = messages.filter((msg, idx) => {
    if (idx !== 0) return true
    const s = msg.dmSender
    const c = msg.messageContent || ''
    return !(s === 'Admin' || s === 'System' || c.startsWith('[PROFILE_PHASE]') || c.startsWith('You are') || c.startsWith('SYSTEM:'))
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card glass"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="agent-chat-header glass" style={{ flexShrink: 0 }}>
          <button
            className="btn-ghost"
            onClick={() => navigate('/client/requests/view')}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
          >
            ← Back
          </button>
          <div className="agent-avatar"><Bot size={18} /></div>
          <div style={{ flex: 1 }}>
            <p className="agent-name text-gradient">
              {request ? (request.requestSubject || 'Transcript') : 'Loading…'}
            </p>
            <p className="agent-sub font-mono">
              {request ? `${request.requestId.slice(-8)} · ${request.requestType || 'Lead'} · ${request.status}` : requestId?.slice(-8)}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="agent-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Loading conversation…</p>
          ) : !request ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Request not found.</p>
              <button className="btn btn-ghost" onClick={() => navigate('/client/requests/view')} style={{ marginTop: '1rem' }}>
                ← Back to Requests
              </button>
            </div>
          ) : visibleMessages.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>No messages in this conversation.</p>
          ) : (
            visibleMessages.map((msg, i) => {
              const isAgent = msg.dmSender === 'Agent' || msg.dmSender === 'Admin'
              const content = (msg.messageContent || '').replace(/^\[PROFILE_PHASE\]/, '')
              return (
                <motion.div
                  key={msg.dmNo ?? i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  className={'agent-msg-row ' + (isAgent ? 'agent' : 'client')}
                >
                  {isAgent && <div className="agent-bubble-avatar"><Bot size={13} /></div>}
                  <div className={'agent-bubble glass ' + (isAgent ? 'agent-bubble-in' : 'agent-bubble-out')}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
                    <span className="agent-bubble-time font-mono">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
          Read-only transcript
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ClientTranscriptPage

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import { createRequest, getMessages, sendMessage, getAllRequests } from '../api/requestApi'
import './ClientRequests.css'

const POLL_MS = 4000

const ClientDirectChat = ({ user }) => {
  const navigate = useNavigate()
  const [request, setRequest]   = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef  = useRef(null)
  const reqRef     = useRef(null)
  const clientName = user?.representativeName || user?.clientId || 'Client'

  // On mount: find an open Direct request or create one
  useEffect(() => {
    if (!user?.clientNo) return
    const init = async () => {
      try {
        const all = await getAllRequests(user.clientNo)
        const existing = (Array.isArray(all) ? all : [])
          .find(r => r.requestType === 'Direct' && (r.status === 'New' || r.status === 'Active'))

        if (existing) {
          setRequest(existing)
          reqRef.current = existing
          const msgs = await getMessages(existing.requestId)
          setMessages(Array.isArray(msgs) ? msgs : [])
        } else {
          // Create a new Direct thread
          const requestId = 'REQ-D-' + Date.now()
          const created = await createRequest({
            requestId,
            clientNo: user.clientNo,
            requestSubject: '[Direct] Message from ' + clientName,
            requestBody: 'Direct message thread',
            sender: clientName,
            receiver: 'Admin',
            requestType: 'Direct',
            status: 'New',
          })
          setRequest(created)
          reqRef.current = created
        }
      } catch (e) {
        setError('Failed to open conversation: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user])

  // Poll for new messages
  useEffect(() => {
    const id = setInterval(() => {
      const req = reqRef.current
      if (!req) return
      getMessages(req.requestId)
        .then(data => {
          if (Array.isArray(data)) setMessages(data)
        })
        .catch(() => {})
    }, POLL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !request) return
    setSending(true)
    setInput('')
    const optimistic = { dmSender: clientName, messageContent: text, createdAt: new Date().toISOString(), dmNo: 'opt-' + Date.now() }
    setMessages(prev => [...prev, optimistic])
    try {
      await sendMessage(request.requestId, clientName, text)
      const fresh = await getMessages(request.requestId)
      if (Array.isArray(fresh)) setMessages(fresh)
    } catch {
      // optimistic stays
    } finally {
      setSending(false)
    }
  }

  const isAdmin = (msg) => msg.dmSender === 'Admin' || msg.dmSender === 'System'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="card glass"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', overflow: 'hidden' }}>

        {/* Header */}
        <div className="agent-chat-header glass" style={{ flexShrink: 0 }}>
          <button className="btn-ghost" onClick={() => navigate('/client/requests-intro')}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginRight: '0.5rem' }}>
            <ArrowLeft size={16} />
          </button>
          <div className="agent-avatar"><MessageSquare size={18} /></div>
          <div style={{ flex: 1 }}>
            <p className="agent-name text-gradient">Direct Message</p>
            <p className="agent-sub font-mono">
              {loading ? 'Connecting…' : request ? `${request.requestId.slice(-8)} · ${request.status}` : 'Not connected'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="agent-messages" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Connecting…</p>
          ) : error ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>{error}</p>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))' }}>
              <MessageSquare size={36} style={{ opacity: 0.15, margin: '0 auto 1rem' }} />
              <p>No messages yet. Send one to start the conversation.</p>
            </div>
          ) : messages.map((msg, i) => {
            const mine = !isAdmin(msg)
            return (
              <motion.div key={msg.dmNo ?? i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={'agent-msg-row ' + (mine ? 'client' : 'agent')}>
                <div className={'agent-bubble glass ' + (mine ? 'agent-bubble-out' : 'agent-bubble-in')}>
                  {!mine && <p style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.6, marginBottom: '0.2rem' }}>Admin</p>}
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.messageContent}</p>
                  <span className="agent-bubble-time font-mono">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </motion.div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend}
          style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Type a message…" disabled={sending || loading || !request}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'hsl(var(--foreground))', outline: 'none', fontSize: '0.9rem' }} />
          <button type="submit" disabled={sending || !input.trim() || !request} className="btn-primary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Send size={15} /> {sending ? '…' : 'Send'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ClientDirectChat

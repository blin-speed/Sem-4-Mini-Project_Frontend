import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Archive, Bot, User, ChevronRight, MessageSquare } from 'lucide-react'
import {
  getAllRequests,
  getMessages,
  sendMessage,
  updateRequestStatus,
  markMessagesAsRead,
} from '../api/requestApi'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './Requests.css'

const POLL_INTERVAL = 4000

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="card glass-modal" style={{ maxWidth: 380, width: '90%', padding: '2rem', textAlign: 'center' }}>
      <Archive size={36} style={{ margin: '0 auto 1rem', color: 'hsl(var(--muted-foreground))' }} />
      <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontFamily: 'Outfit' }}>Archive Request?</h3>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{message}</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Abort</button>
        <button className="btn btn-primary" onClick={onConfirm}>Archive</button>
      </div>
    </motion.div>
  </motion.div>
)

const RequestTranscript = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetId = searchParams.get('id')

  const [requests,    setRequests]    = useState([])
  const [activeReq,   setActiveReq]   = useState(null)
  const [messages,    setMessages]    = useState([])
  const [query,       setQuery]       = useState('')
  const [showArchived,setShowArchived]= useState(false)
  const [loadingReqs, setLoadingReqs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [confirmClose,setConfirmClose]= useState(null)
  const [typeFilter,  setTypeFilter]  = useState('Lead') // 'Lead' | 'Support'
  const [adminInput,  setAdminInput]  = useState('')
  const [adminSending,setAdminSending]= useState(false)
  const bottomRef    = useRef(null)
  const atBottomRef  = useRef(true)
  const activeReqRef = useRef(activeReq)

  useEffect(() => { activeReqRef.current = activeReq }, [activeReq])

  useEffect(() => {
    setLoadingReqs(true)
    getAllRequests()
      .then((data) => {
        const reqs = (Array.isArray(data) ? data : [])
          .filter(r => !r.client?.email?.endsWith('@placeholder.invalid'))
        setRequests(reqs)

        // Select specific request if parsed from URL
        if (targetId) {
          const req = reqs.find(r => r.requestId === targetId)
          if (req) {
            setActiveReq(req)
            setTypeFilter(req.requestType || 'Lead')
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReqs(false))
  }, [])

  useEffect(() => {
    if (!activeReq) return
    setLoadingMsgs(true)
    getMessages(activeReq.requestId)
      .then((data) => {
        setMessages(Array.isArray(data) ? data : [])
        markMessagesAsRead(activeReq.requestId, 'Admin').catch(() => {})
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false))
  }, [activeReq])

  useEffect(() => {
    if (!activeReq) return
    const id = setInterval(() => {
      const req = activeReqRef.current
      if (!req) return
      getMessages(req.requestId).then((data) => {
        if (!Array.isArray(data)) return
        setMessages((prev) => data.length !== prev.length ? data : prev)
      }).catch(() => {})
    }, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [activeReq])

  const initialMsgLoad = useRef(true)

  useEffect(() => {
    if (initialMsgLoad.current) { initialMsgLoad.current = false; return }
    if (atBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const applyStatus = async (requestId, newStatus) => {
    try {
      const updated = await updateRequestStatus(requestId, newStatus)
      setRequests((prev) => prev.map((r) => r.requestId === requestId ? updated : r))
      if (activeReq?.requestId === requestId) setActiveReq(updated)
    } catch (err) { alert('Status update failed: ' + err.message) }
  }


  const handleAdminSend = async (e) => {
    e.preventDefault()
    const text = adminInput.trim()
    if (!text || adminSending || !activeReq) return
    setAdminSending(true)
    setAdminInput('')
    try {
      await sendMessage(activeReq.requestId, 'Admin', text)
      const fresh = await getMessages(activeReq.requestId)
      if (Array.isArray(fresh)) setMessages(fresh)
    } catch (err) {
      alert('Failed to send: ' + err.message)
    } finally {
      setAdminSending(false)
    }
  }

  return (
    <motion.div
      className="requests-page"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}
    >
      <AnimatePresence>
        {confirmClose && (
          <ConfirmModal
            message="This enquiry will be moved to the archive. The message history remains readable."
            onConfirm={() => { applyStatus(confirmClose, 'Closed'); setConfirmClose(null) }}
            onCancel={() => setConfirmClose(null)}
          />
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="requests-chat card glass" style={{
        marginTop: '0', 
        height: '100%',
        minHeight: '600px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {activeReq ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <header className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn-ghost" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} onClick={() => navigate('/admin/requests')}>
                  ← Back to Map
                </button>
                <div>
                  <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }} className="text-gradient">Transcript: {activeReq.requestId}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                    {activeReq.client?.clientId} ({activeReq.client?.representativeName || 'Unknown'}) &mdash; {activeReq.requestSubject}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select className="filter-select"
                  value={activeReq.status}
                  onChange={(e) => {
                    if (e.target.value === 'Closed') setConfirmClose(activeReq.requestId)
                    else applyStatus(activeReq.requestId, e.target.value)
                  }}>
                  {['New', 'Active', 'Converted', 'Closed', 'Archived'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </header>

            <div className="messages-viewport"
              onScroll={(e) => {
                const el = e.currentTarget
                atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
              }}>
              {loadingMsgs ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--primary))' }}>Loading thread…</p>
              ) : messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>No messages.</p>
              ) : (
                messages
                  // Hide the first Admin/System message — it is the agent context prompt, not user-facing
                  .filter((msg, idx) => {
                    if (idx !== 0) return true
                    const s = msg.dmSender
                    const c = msg.messageContent || ''
                    return !(s === 'Admin' || s === 'System' || c.startsWith('[PROFILE_PHASE]') || c.startsWith('You are') || c.startsWith('SYSTEM:'))
                  })
                  .map((msg, idx) => {
                  const isAgent = msg.dmSender === 'Agent' || msg.dmSender === 'Admin'
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={msg.dmNo} className={'message-wrapper ' + (isAgent ? 'me' : 'them')}>
                      <div className="message-bubble">
                        <span className="message-sender" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {isAgent ? <Bot size={12} /> : <User size={12} />}
                          {msg.dmSender === 'Admin' ? 'SYSTEM' : msg.dmSender}
                        </span>
                        <p className="message-content">{msg.messageContent}</p>
                        <span className="message-time font-mono">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleAdminSend} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>
              <input
                type="text"
                value={adminInput}
                onChange={e => setAdminInput(e.target.value)}
                placeholder={activeReq?.status === 'Closed' || activeReq?.status === 'Archived' ? 'Thread is closed' : 'Reply as Admin…'}
                disabled={adminSending || activeReq?.status === 'Closed' || activeReq?.status === 'Archived'}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'hsl(var(--foreground))', outline: 'none', fontSize: '0.875rem' }}
              />
              <button type="submit" disabled={adminSending || !adminInput.trim() || activeReq?.status === 'Closed' || activeReq?.status === 'Archived'} className="btn btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', flexShrink: 0 }}>
                {adminSending ? '…' : 'Send'}
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="chat-empty-state">
            <button className="btn btn-primary" onClick={() => navigate('/admin/requests')} style={{ marginBottom: '1.5rem' }}>
              ← Return to Overview
            </button>
            <MessageSquare size={48} style={{ opacity: 0.1, color: 'hsl(var(--primary))' }} />
            <h3 className="text-gradient">No Transcript Selected</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Select a request from the overview to view its details.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default RequestTranscript

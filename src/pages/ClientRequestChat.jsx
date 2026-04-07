import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Package, ArrowLeft, X } from 'lucide-react'
import { getAllRequests, getMessages, sendMessage } from '../api/requestApi'
import './ClientRequests.css'

const MSG_POLL = 5_000

// ── Creation Flow ──────────────────────────────────────────────────────
const CreationFlow = ({ user, requestType, onCreationComplete, onCancel }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [chatData, setChatData] = useState(null)
  const [summaryText, setSummaryText] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const bottomRef = useRef(null)
  const intakeStartedRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!intakeStartedRef.current && !isInitializing && !chatData && messages.length === 0) {
      intakeStartedRef.current = true
      startIntake()
    }
  }, [])

  const startIntake = async () => {
    setIsInitializing(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientNo: user.clientNo,
          message: 'Initiate logged in intake flow',
          requestType: requestType || 'Lead',
          name: user.representativeName || 'Client',
          email: user.email || 'client@matrix.local',
          company: user.clientId || 'Company',
          password: 'dummyPassword123'
        })
      })
      const data = await res.json()
      if (data.success) {
        console.log('✓ Intake started, requestId:', data.requestId)
        setChatData({ requestId: data.requestId, clientNo: user.clientNo })
        setMessages([{ id: `sys-${Date.now()}`, sender: 'Agent', text: data.agentReply }])
      }
    } catch {
      alert('Unable to start chat.')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this request creation? Any input will be lost.')) return
    
    setIsCancelling(true)
    try {
      if (chatData?.requestId) {
        await fetch(`${import.meta.env.VITE_API_URL || '' }/api/requests/${chatData.requestId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (err) {
      console.error('Error cancelling request:', err)
    } finally {
      setIsCancelling(false)
      navigate('/client/requests-intro')
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !chatData) return
    setSending(true)
    setInput('')
    setMessages(p => [...p, { id: `user-${Date.now()}`, sender: 'User', text }])

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: chatData.requestId,
          userMessage: text,
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(p => [...p, { id: `sys-${Date.now()}`, sender: 'Agent', text: data.reply }])

        const foundOrder = data.reply.match(/Linked Order ID:\s*([^\n]+)/)
        const parsedOrder = foundOrder ? foundOrder[1].trim() : null
        
        let foundSummary = summaryText
        const isSummary = (t) => t && (t.includes('Problem Description:') || t.includes('Here is a summary'))
        if (isSummary(data.reply)) foundSummary = data.reply

        if (foundSummary) setSummaryText(foundSummary)

        if (data.intakeConfirmed || data.confirmed) {
          console.log('✓ Intake complete, navigating to request view:', chatData.requestId)
          onCreationComplete(chatData.requestId)
        }
      }
    } catch {
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="agent-chat-wrap" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="agent-chat-header glass">
        <div className="agent-avatar"><Bot size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p className="agent-name text-gradient">Matrix Assistant</p>
            {requestType === 'Support' && <span className="req-type-badge support" style={{ scale: 0.8, transformOrigin: 'left' }}>Support Intake</span>}
          </div>
          <p className="agent-sub font-mono">Gathering requirements...</p>
        </div>
        <button className="btn-ghost" onClick={handleCancel} disabled={isCancelling} style={{ padding: '0.4rem', color: 'hsl(var(--muted-foreground))', opacity: isCancelling ? 0.5 : 1 }} title="Abort Creation">
          <X size={18} />
        </button>
      </div>

      <div className="agent-messages">
        {messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
             className={'agent-msg-row ' + (msg.sender === 'Agent' ? 'agent' : 'client')}>
            {msg.sender === 'Agent' && <div className="agent-bubble-avatar"><Bot size={13} /></div>}
            <div className={'agent-bubble glass ' + (msg.sender === 'Agent' ? 'agent-bubble-in' : 'agent-bubble-out')}>
              <p>{msg.text.replace(/^\[PROFILE_PHASE\]/, '')}</p>
            </div>
          </motion.div>
        ))}
        {isInitializing && <p style={{ padding: '1rem', color: 'hsl(var(--muted-foreground))' }}>Initializing AI…</p>}
        <div ref={bottomRef} />
      </div>

      <form className="agent-done-bar glass card" onSubmit={handleSend} style={{ gap: '0.5rem', padding: '0.75rem 1rem' }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…" disabled={sending || isInitializing}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'hsl(var(--foreground))', outline: 'none' }} />
        <button type="submit" disabled={sending || !input.trim()} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}

// ── View Existing Request ──────────────────────────────────────────────────────
const ViewRequest = ({ user, requestId }) => {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const bottomRef = useRef(null)
  const activeReqRef = useRef(request)

  const clientName = user?.representativeName || user?.clientId || 'Client'

  const isCompleted = request?.status === 'Active' || 
                      request?.status === 'Converted' || 
                      request?.status === 'Closed'

  useEffect(() => {
    activeReqRef.current = request
  }, [request])

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true)
      try {
        if (!user?.clientNo) return
        const allReqs = await getAllRequests(user.clientNo)
        const foundReq = allReqs.find(r => r.requestId === requestId)
        console.log(`📋 Loading request ${requestId}:`, foundReq ? '✓ Found' : '✗ Not found')
        if (foundReq) {
          setRequest(foundReq)
          const msgs = await getMessages(requestId)
          setMessages(Array.isArray(msgs) ? msgs : [])
        }
      } catch (err) {
        console.error('Error loading request:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRequest()
  }, [requestId, user])

  useEffect(() => {
    if (isCompleted || !request) return
    const id = setInterval(() => {
      const req = activeReqRef.current
      if (!req) return
      getMessages(req.requestId)
        .then((data) => {
          if (!Array.isArray(data)) return
          setMessages((prev) => data.length !== prev.length ? data : prev)
        })
        .catch(() => {})
    }, MSG_POLL)
    return () => clearInterval(id)
  }, [request?.requestId, isCompleted])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || isCompleted || !request) return
    setSending(true)
    setInput('')
    // Optimistic update
    const optimistic = { dmSender: clientName, messageContent: text, createdAt: new Date().toISOString(), dmNo: 'opt-' + Date.now() }
    setMessages((prev) => [...prev, optimistic])
    try {
      await sendMessage(request.requestId, clientName, text)
      const fresh = await getMessages(request.requestId)
      if (Array.isArray(fresh)) setMessages(fresh)
    } catch {
      // Keep optimistic on error
    } finally {
      setSending(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this request? This cannot be undone.')) return
    
    setCancelling(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '' }/api/requests/${request.requestId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        navigate('/client/requests-intro')
      } else {
        alert('Failed to cancel request: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Error cancelling request:', err)
      alert('Error cancelling request')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Request not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/client/requests')}>Back to Requests</button>
      </div>
    )
  }

  return (
    <motion.div className="client-request-chat-page" 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.2 }}
      style={{ maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(139,92,246,0.03), transparent)' }}>

      {/* Header */}
      <div className="agent-chat-header glass" style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn-ghost"
          onClick={() => navigate('/client/requests')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.6rem', color: 'hsl(var(--primary))', borderRadius: '0.4rem', transition: 'all 0.2s', cursor: 'pointer' }}
          title="Back to Requests"
          onMouseOver={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.1)'}
          onMouseOut={(e) => e.target.style.background = 'transparent'}>
          <ArrowLeft size={18} />
        </button>
        <div className="agent-avatar"><Bot size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <p className="agent-name text-gradient">Matrix Assistant</p>
            {request.requestType === 'Support' && (
              <span className="req-type-badge support" style={{ scale: 0.8, transformOrigin: 'left' }}>Support</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p className="agent-sub font-mono">
              {request.requestId.slice(-8)} · {isCompleted ? 'Submitted' : 'In progress'}
            </p>
            {request.linkedOrderId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} 
                   className="text-primary hover-glow"
                   onClick={() => navigate('/client/orders')}>
                <Package size={12} />
                <span className="font-mono" style={{ fontSize: '0.7rem', fontWeight: 600 }}>{request.linkedOrderId}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {request.status === 'New' && (
            <button 
              className="btn-ghost"
              onClick={handleCancel}
              disabled={cancelling}
              style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', opacity: cancelling ? 0.5 : 1, borderRadius: '0.4rem', transition: 'all 0.2s' }}
              title="Cancel this request"
              onMouseOver={(e) => !cancelling && (e.target.style.background = 'rgba(239, 68, 68, 0.1)')}
              onMouseOut={(e) => e.target.style.background = 'transparent'}>
              <X size={18} />
            </button>
          )}
          <span className={'req-status ' + (isCompleted ? 'resolved' : 'active-tag')}>
            {isCompleted ? 'Submitted' : 'In Progress'}
          </span>
        </div>
      </div>

      {/* Messages Container - Centered */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
          <div className="agent-messages" style={{ width: '100%', maxWidth: '800px', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' }}>
            {messages
              .filter((msg, idx) => !(idx === 0 && (msg.dmSender === 'Admin' || msg.dmSender === 'System')))
              .map((msg, i) => {
              const isAgent = msg.dmSender === 'Agent' || msg.dmSender === 'Admin'
              const content = (msg.messageContent || '').replace(/^\[PROFILE_PHASE\]/, '')
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  key={msg.dmNo ?? i}
                  className={'agent-msg-row ' + (isAgent ? 'agent' : 'client')}>
                  {isAgent && <div className="agent-bubble-avatar"><Bot size={13} /></div>}
                  <div className={'agent-bubble glass ' + (isAgent ? 'agent-bubble-in' : 'agent-bubble-out')}>
                    <p>{content}</p>
                    <span className="agent-bubble-time font-mono">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Input Bar - Centered */}
      {isCompleted ? (
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)',
              fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Thank you for your submission. Our team will get back to you shortly.
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form className="agent-done-bar glass card" onSubmit={handleSend}
            style={{ gap: '0.5rem', padding: '0.75rem 1rem', width: '100%', maxWidth: '800px', display: 'flex' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              disabled={sending}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'hsl(var(--foreground))', fontSize: '0.9rem', outline: 'none' }}
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flexShrink: 0 }}>
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </motion.div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────
const ClientRequestChat = ({ user }) => {
  const { requestId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isCreation = requestId === 'new' && location.state?.isCreation
  const requestType = location.state?.requestType || 'Lead'

  const handleCreationComplete = (newRequestId) => {
    navigate(`/client/requests/chat/${newRequestId}`)
  }

  const handleCancelCreation = () => {
    navigate('/client/requests-intro')
  }

  if (isCreation) {
    return (
      <CreationFlow 
        user={user} 
        requestType={requestType}
        onCreationComplete={handleCreationComplete}
        onCancel={handleCancelCreation}
      />
    )
  }

  return <ViewRequest user={user} requestId={requestId} />
}

export default ClientRequestChat

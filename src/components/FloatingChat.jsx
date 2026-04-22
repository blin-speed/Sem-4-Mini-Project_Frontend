import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Bot, ArrowRight, CheckCircle } from 'lucide-react'
import { fetchPublicSettings } from '../hooks/useSettings'
import './FloatingChat.css'

const FloatingChat = ({ externalOpen, onToggle }) => {
  const navigate = useNavigate()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = onToggle || setInternalOpen

  const [agentMode, setAgentMode] = useState(null)
  const [businessContext, setBusinessContext] = useState('')
  const [agentName, setAgentName] = useState('Assistant')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const bottomRef = useRef(null)
  const initCalledRef = useRef(false)

  // ASSISTANT mode
  const [chatData, setChatData] = useState(null)
  const [intakeConfirmed, setIntakeConfirmed] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [supportRequiresLogin, setSupportRequiresLogin] = useState(false)

  // MARKETER mode — history kept client-side
  const [marketerHistory, setMarketerHistory] = useState([])

  useEffect(() => {
    fetchPublicSettings().then(s => {
      setAgentMode(s.landingAgentMode || 'ASSISTANT')
      setBusinessContext(s.businessContext || '')
      setAgentName(s.agentName || 'Assistant')
    })
  }, [])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, intakeConfirmed])

  useEffect(() => {
    if (isOpen && agentMode && messages.length === 0 && !isInitializing && !initCalledRef.current) {
      initCalledRef.current = true
      if (agentMode === 'ASSISTANT') initAssistant()
      if (agentMode === 'MARKETER') initMarketer()
    }
  }, [isOpen, agentMode])

  const addMsg = (sender, text) => {
    setMessages(prev => [...prev, { id: `${sender}-${Date.now()}-${Math.random()}`, sender, text, ts: new Date().toISOString() }])
  }

  const initAssistant = async () => {
    setIsInitializing(true)
    try {
      const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, name: 'Guest User', email: `chat-${sid}@placeholder.invalid`, company: `chat-${sid}`, password: `temp-${sid}`, message: 'Starting chat inquiry' }),
      })
      const data = await res.json()
      if (data.success) {
        setChatData({ requestId: data.requestId, clientNo: data.clientNo, clientId: data.clientId, clientName: 'Guest' })
        addMsg('Agent', data.agentReply)
      } else { addMsg('Agent', 'Unable to start chat. Please try again.') }
    } catch { addMsg('Agent', 'Unable to start chat. Please check your connection.') }
    finally { setIsInitializing(false) }
  }

  const initMarketer = async () => {
    setIsInitializing(true)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/marketer/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessContext }),
      })
      const data = await res.json()
      const reply = data.success ? data.reply : 'Hello! How can I help you today?'
      addMsg('Agent', reply)
      setMarketerHistory([{ role: 'assistant', content: reply }])
    } catch { addMsg('Agent', 'Hello! How can I help you today?') }
    finally { setIsInitializing(false) }
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (messages.length === 0 && !isInitializing && agentMode && !initCalledRef.current) {
      initCalledRef.current = true
      if (agentMode === 'ASSISTANT') initAssistant()
      if (agentMode === 'MARKETER') initMarketer()
    }
  }

  const detectSupportIntent = (text) => {
    const l = text.toLowerCase()
    return l.includes('support') || l.includes('issue') || l.includes('problem') ||
      l.includes('broken') || l.includes('not working') || l.includes('error') ||
      l.includes('ticket') || l.includes('help with my order') || l.includes('fix')
  }

  const isSummaryText = (text) => {
    if (!text) return false
    return text.includes('Here is a summary of your requirements') ||
      text.includes('Here is a summary of your Support Request') ||
      text.includes('Problem Description:') || text.includes('Linked Order ID:') ||
      (text.includes('Budget:') && text.includes('Timeline:'))
  }

  const handleMarketerSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput(''); setSending(true)
    addMsg('User', text)
    const updated = [...marketerHistory, { role: 'user', content: text }]
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/marketer/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessContext, history: updated, message: text }),
      })
      const data = await res.json()
      const reply = data.success ? data.reply : 'Something went wrong. Please try again.'
      addMsg('Agent', reply)
      setMarketerHistory([...updated, { role: 'assistant', content: reply }])
    } catch { addMsg('Agent', 'Unable to reach the server. Please try again.') }
    finally { setSending(false) }
  }

  const handleAssistantSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending || !chatData || intakeConfirmed) return
    const text = input.trim()
    const isFirstUser = messages.filter(m => m.sender === 'User').length === 0
    if (isFirstUser && detectSupportIntent(text)) {
      setSupportRequiresLogin(true)
      addMsg('User', text)
      addMsg('Agent', 'I can see you need support assistance. Support requests require you to be logged in so we can link your ticket to your account and order history. Please log in to continue.')
      return
    }
    setInput(''); setSending(true)
    addMsg('User', text)
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: chatData.requestId, clientName: chatData.clientName, message: text }),
      })
      const data = await res.json()
      if (data.success) {
        let reply = data.reply
        if (reply.includes('[SUPPORT_REQUIRES_LOGIN]')) { setSupportRequiresLogin(true); reply = reply.replace('[SUPPORT_REQUIRES_LOGIN]', '').trim() }
        addMsg('Agent', reply)
        if (isSummaryText(reply)) setSummaryText(reply)
        if (data.intakeConfirmed || data.confirmed) setIntakeConfirmed(true)
      } else { addMsg('Agent', 'Something went wrong. Please try again.') }
    } catch { addMsg('Agent', 'Unable to reach the server. Please try again.') }
    finally { setSending(false) }
  }

  const handleProceedToSignup = () => {
    setIsOpen(false)
    const last = [...messages].reverse().find(m => m.sender === 'Agent' && isSummaryText(m.text))
    const finalSummary = last?.text || summaryText || ''
    const getType = (t) => t?.includes('Support Request') ? 'Support' : 'Lead'
    const getOrder = (t) => { if (!t) return null; const m = t.match(/Linked Order ID:\s*([^\n]+)/); return m ? m[1].trim() : null }
    navigate('/client/agent-auth-intro', { state: { chatData: { requestId: chatData?.requestId, tempClientNo: chatData?.clientNo, summaryText: finalSummary, requestType: getType(finalSummary), linkedOrderId: getOrder(finalSummary) } } })
  }

  if (agentMode === null || agentMode === 'OFF') return null

  const handleSend = agentMode === 'MARKETER' ? handleMarketerSend : handleAssistantSend
  const isLocked = agentMode === 'ASSISTANT' && intakeConfirmed
  const subtitle = agentMode === 'MARKETER' ? 'Ask me anything about our services' : intakeConfirmed ? 'Requirements captured' : "Let's discuss your requirements"

  return (
    <>
      <motion.button className="floating-chat-btn" onClick={handleOpen} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} title="Chat with our assistant">
        <MessageCircle size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="floating-chat-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="fc-backdrop" onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="floating-chat-window full-screen" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>

              <div className="fc-header">
                <div className="fc-title-wrap">
                  <Bot size={20} style={{ color: 'hsl(var(--primary))' }} />
                  <div>
                    <h3 className="fc-title">{agentName}</h3>
                    <p className="fc-subtitle">{subtitle}</p>
                  </div>
                </div>
                <button className="fc-close-btn" onClick={() => setIsOpen(false)} type="button"><X size={20} /></button>
              </div>

              <div className="fc-messages">
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`fc-msg-row ${msg.sender === 'Agent' ? 'agent' : 'user'}`}>
                    {msg.sender === 'Agent' && <div className="fc-avatar"><Bot size={16} /></div>}
                    <div className={`fc-bubble ${msg.sender === 'Agent' ? 'agent-bubble' : 'user-bubble'}`}>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                      <span className="fc-time">{new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))}
                {(sending || isInitializing) && (
                  <div className="fc-msg-row agent">
                    <div className="fc-avatar"><Bot size={16} /></div>
                    <div className="fc-bubble agent-bubble fc-typing"><span /><span /><span /></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {agentMode === 'ASSISTANT' && intakeConfirmed ? (
                <motion.div className="fc-signup-cta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="fc-cta-inner">
                    <CheckCircle size={20} style={{ color: '#4ade80', flexShrink: 0 }} />
                    <div>
                      <p className="fc-cta-title">Requirements captured</p>
                      <p className="fc-cta-sub">Create your account to submit this enquiry and track it through to delivery.</p>
                    </div>
                  </div>
                  <button className="btn btn-primary fc-cta-btn" onClick={handleProceedToSignup}>
                    Complete Account & Submit <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </button>
                </motion.div>
              ) : agentMode === 'ASSISTANT' && supportRequiresLogin ? (
                <motion.div className="fc-signup-cta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="fc-cta-inner">
                    <div>
                      <p className="fc-cta-title" style={{ color: '#fb923c' }}>Authentication Required</p>
                      <p className="fc-cta-sub">Please log into your account to create a support ticket.</p>
                    </div>
                  </div>
                  <button className="btn btn-primary fc-cta-btn" style={{ background: '#fb923c', color: '#111' }} onClick={() => { setIsOpen(false); navigate('/client/login') }}>
                    Go to Login <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </button>
                </motion.div>
              ) : (
                <form className="fc-input-bar" onSubmit={handleSend}>
                  <input type="text" placeholder={isInitializing ? 'Starting chat…' : 'Type your message…'} value={input} onChange={(e) => setInput(e.target.value)} disabled={sending || isInitializing || isLocked} autoFocus />
                  <button type="submit" disabled={sending || !input.trim() || isInitializing || isLocked} className="fc-send-btn"><Send size={18} /></button>
                </form>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingChat

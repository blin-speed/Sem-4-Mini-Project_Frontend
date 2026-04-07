import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Send, X, CheckCircle, Clock } from 'lucide-react'
import { getAllOrders } from '../api/orderApi'

/**
 * NewRequestModal — A chat-first request creation flow.
 * User opens, chats naturally with agent, then confirms.
 * On confirm, request is assigned to their account and modal closes.
 */
const NewRequestModal = ({ isOpen, user, onClose, onRequestCreated }) => {
  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestId, setRequestId] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  // Initialize request on open
  useEffect(() => {
    if (isOpen && !requestId) {
      startNewRequest()
    }
  }, [isOpen, requestId])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startNewRequest = async () => {
    setError(null)
    setLoading(true)
    try {
      const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      
      const res = await fetch('http://localhost:8080/api/agent/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.representativeName || 'Client',
          email: `chat-${sessionId}@placeholder.invalid`,
          company: user?.clientId || 'Existing Client',
          password: 'temp-' + sessionId,
          message: 'I need to create a new request'
        })
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Failed to start chat')

      setRequestId(data.requestId)
      // Add initial agent message to chat
      if (data.reply) {
        setMessages([{ sender: 'Agent', content: data.reply }])
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !requestId || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { sender: 'You', content: userMsg }])
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('http://localhost:8080/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          clientName: user?.representativeName || 'Client',
          userMessage: userMsg
        })
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Failed to send message')

      // Add agent reply
      setMessages(prev => [...prev, { sender: 'Agent', content: data.reply }])

      // Check if intake is confirmed (profileComplete means we've moved past intake)
      if (data.profileComplete === true) {
        setShowConfirmation(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!requestId || !user?.clientNo) return

    setConfirming(true)
    setError(null)
    try {
      // Claim the request for this real client
      const res = await fetch('http://localhost:8080/api/agent/claim-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          newClientNo: user.clientNo
        })
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Failed to confirm request')

      // Success — callback and close
      if (onRequestCreated) onRequestCreated()
      handleClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const handleClose = () => {
    setMessages([])
    setInput('')
    setRequestId(null)
    setShowConfirmation(false)
    setError(null)
    if (onClose) onClose()
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fc-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 100 }}
      onClick={handleClose}
    >
      <motion.div
        className="card glass"
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          margin: 'auto',
          marginTop: '5vh'
        }}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>New Request</h2>
          <button
            className="icon-btn"
            onClick={handleClose}
            style={{ opacity: 0.6, fontSize: '1.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '1rem',
            paddingRight: '0.5rem'
          }}
        >
          {messages.length === 0 && loading ? (
            <div style={{ textAlign: 'center', opacity: 0.6, padding: '2rem 0' }}>
              <Clock size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <p>Starting conversation...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'You' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: msg.sender === 'You'
                      ? 'hsl(var(--primary) / 0.7)'
                      : 'rgba(255,255,255,0.05)',
                    border: msg.sender === 'You'
                      ? 'none'
                      : '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                    color: '#fff'
                  }}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.85rem'
              }}
            >
              {error}
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Confirmation Screen */}
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '1rem' }}
          >
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              alignItems: 'flex-start'
            }}>
              <CheckCircle size={18} style={{ color: '#6ee7b7', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Your request is ready!</p>
                <p style={{ margin: 0, opacity: 0.8 }}>Review the conversation above, then confirm to submit.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!showConfirmation ? (
            <>
              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <Send size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-ghost"
                onClick={handleClose}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={confirming}
                style={{ flex: 1 }}
              >
                {confirming ? 'Submitting...' : 'Submit Request'} <ArrowRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default NewRequestModal

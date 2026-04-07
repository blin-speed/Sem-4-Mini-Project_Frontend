import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowRight, Package, Mail, Phone, MapPin, Building, Bot } from 'lucide-react'
import { getMessages, updateRequestStatus, sendMessage, createRequest, deleteRequest } from '../api/requestApi'
import './OrderConfirm.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

// ── Success screen shown after confirmation ───────────────────────────────────
const SuccessScreen = ({ userData, onGoToDashboard, isSupport }) => (
  <motion.div
    className="success-screen"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="success-content"
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
    >
      <motion.div
        className="success-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <CheckCircle size={56} color="#4ade80" />
      </motion.div>

      <h2 className="success-title">{isSupport ? 'Request Submitted!' : 'Enquiry Submitted!'}</h2>
      <p className="success-message">
        {isSupport 
          ? "Your support ticket has been logged. Our technical team will review the details and reach out to you "
          : "Your request has been received. Our team will review it and get back to you "}
        <strong> within one business day</strong> at <strong>{userData?.email}</strong>.
      </p>

      <div className="success-details glass card">
        <div className="detail-row">
          <span className="detail-label">Name</span>
          <strong>{userData?.representativeName}</strong>
        </div>
        <div className="detail-row">
          <span className="detail-label">Email</span>
          <strong>{userData?.email}</strong>
        </div>
      </div>

      <p className="success-footer">
        Log in to your client dashboard to track your request and manage future orders.
      </p>

      <motion.button
        className="btn btn-primary success-btn"
        onClick={onGoToDashboard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Go to My Dashboard <ArrowRight size={16} style={{ marginLeft: '6px' }} />
      </motion.button>
    </motion.div>
  </motion.div>
)

// ── Main component ────────────────────────────────────────────────────────────
const OrderConfirm = ({ user, injectedState }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Use injected state (from wrapper) or location state (direct navigation)
  const stateSource = injectedState || location.state || {}
  const { userData, requestId, summaryText, requestType, linkedOrderId, isLoggedInFlow, isManualEntry, returnTo } = stateSource
  
  const [isConfirming, setIsConfirming] = useState(false)
  const [showSuccess,  setShowSuccess]  = useState(false)
  const [agentSummary, setAgentSummary] = useState('')
  const [originalSummary, setOriginalSummary] = useState('')
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)  // For support tickets
  
  // Type is fixed — pre-determined by the tab the user started from; cannot be changed post-chat
  const isSupport = (requestType || 'Lead') === 'Support'

  // Effective user: prefer the userData from state (freshly registered),
  // fall back to the logged-in user prop
  const effectiveUser = userData || user

  // Guard: missing required state → go home
  useEffect(() => {
    if (!effectiveUser || (!requestId && !isManualEntry)) {
      navigate('/', { replace: true })
    }
  }, []) // eslint-disable-line

  // Initialise selected order ID from passed state (agent may have extracted it)
  useEffect(() => {
    if (linkedOrderId) setSelectedOrderId(linkedOrderId)
  }, [linkedOrderId])

  // Load agent messages to get the structured summary
  useEffect(() => {
    if (isManualEntry || !requestId) return
    if (summaryText) {
      setAgentSummary(summaryText)
      setOriginalSummary(summaryText)
      return
    }
    // Fall back: fetch messages and find the summary
    setLoadingMsgs(true)
    getMessages(requestId)
      .then((msgs) => {
        if (!Array.isArray(msgs)) return
        const isSummary = (text) => text && (
          text.includes('Products/Services:') ||
          text.includes('Problem Description:') ||
          text.includes('Linked Order ID:') ||
          text.includes('Here is a summary') ||
          text.includes('summary of your requirements') ||
          (text.includes('Budget:') && text.includes('Timeline:'))
        )
        const summaryMsg = [...msgs].reverse().find(m =>
          m.dmSender === 'Agent' && isSummary(m.messageContent?.replace(/^\[INTAKE_SUMMARY\]/, ''))
        )
        if (summaryMsg) {
          const text = summaryMsg.messageContent
              .replace(/^\[INTAKE_SUMMARY\]/, '')
              .replace(/^\[PROFILE_PHASE\]/, '')
              .trim()
          setAgentSummary(text)
          setOriginalSummary(text)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false))
  }, [requestId, summaryText, isManualEntry])

  const handleCancel = async () => {
    try {
      if (!isManualEntry && requestId) {
        await deleteRequest(requestId)
      }
    } catch (err) {
      console.error('Failed to clean up cancelled request', err)
    } finally {
      navigate(returnTo || '/client', { replace: true })
    }
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      if (isManualEntry) {
        // Direct creation route
        if (!agentSummary.trim()) throw new Error("Please enter your requirements/description.")
        const newReqId = `REQ-${crypto.randomUUID().split('-')[0].toUpperCase()}`
        
        await createRequest({
          requestId: newReqId,
          requestSubject: isSupport ? `Manual Support Ticket` : `Manual Sales Lead`,
          requestBody: agentSummary.trim(),
          sender: effectiveUser?.representativeName || effectiveUser?.clientId || 'Client',
          receiver: 'Admin',
          requestType: requestType || 'Lead',
          linkedOrderId: isSupport ? selectedOrderId : null,
          clientNo: effectiveUser?.clientNo
        })
        
        // Push straight to active
        await updateRequestStatus(newReqId, 'Active')
      } else {
        // Chat-based claiming/updating route
        if (isLoggedInFlow && userData?.clientNo) {
          const claimBody = {
            requestId,
            newClientNo: userData.clientNo,
            requestType: requestType || 'Lead',
          }

          if (isSupport && selectedOrderId) claimBody.linkedOrderId = selectedOrderId

          const claimRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/claim-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimBody)
          })
          const claimData = await claimRes.json()
          if (!claimData.success) throw new Error(claimData.error || 'Failed to claim request')
        }
        
        // Send any client modifications to the summary
        if (agentSummary.trim() !== originalSummary.trim()) {
          await sendMessage(requestId, effectiveUser?.representativeName || effectiveUser?.clientId || 'Client', `[CLIENT_MODIFIED_SUMMARY]\n\n${agentSummary.trim()}`)
        }
        
        // Mark request as Active
        await updateRequestStatus(requestId, 'Active')
      }

      setShowSuccess(true)
    } catch (err) {
      alert('Error confirming request: ' + (err.message || 'Unknown error'))
    } finally {
      setIsConfirming(false)
    }
  }

  const handleGoToDashboard = () => {
    navigate('/client', { replace: true })
  }

  if ((!requestId && !isManualEntry) || !effectiveUser) return null

  return (
    <AnimatePresence mode="wait">
      {showSuccess ? (
        <SuccessScreen
          key="success"
          userData={effectiveUser}
          onGoToDashboard={handleGoToDashboard}
          isSupport={isSupport}
        />
      ) : (
        <div key="confirm" className="order-confirm-page dark-sci-fi">
          <div className="oc-bg-ambient" />

          <motion.div
            className="oc-card glass card"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="oc-header text-center">
              <div className="oc-logo-wrap">
                <Package size={36} color="hsl(var(--primary))" />
              </div>
              <h2 className="oc-title">
                <span className="text-gradient">
                  {isSupport ? 'Confirm Support Request' : 'Confirm Your Enquiry'}
                </span>
              </h2>
              {/* Read-only type badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 14px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  background: isSupport ? 'rgba(251,146,60,0.15)' : 'rgba(139,92,246,0.15)',
                  color: isSupport ? '#fb923c' : 'hsl(var(--primary))',
                  border: `1px solid ${isSupport ? 'rgba(251,146,60,0.3)' : 'rgba(139,92,246,0.3)'}`,
                }}>
                  {isSupport ? 'Support Ticket' : 'Sales Lead'}
                </span>
              </div>
              <p className="oc-sub" style={{ marginTop: '0.75rem' }}>
                {isSupport
                  ? 'Please review the problem description and linked order details below. Once confirmed, our technical team will prioritise your request.'
                  : 'Review your requirements below. Once confirmed, your enquiry goes to our team and you\'ll receive an update within one business day.'}
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="oc-sections">

              {/* ── Agent/Manual Summary ── */}
              <div className="oc-section">
                <h3 className="oc-section-title">
                  <Bot size={16} /> {isSupport ? 'Problem Description' : 'Requirements Summary'}
                </h3>
                <div className="oc-section-content glass">
                  {loadingMsgs ? (
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                      Loading summary…
                    </p>
                  ) : (
                    <div className="oc-summary-editable">
                      <textarea 
                        className="oc-summary-textarea input-field"
                        value={agentSummary}
                        placeholder={isSupport ? "Describe the issue or parts needed..." : "Your IT requirements..."}
                        onChange={(e) => setAgentSummary(e.target.value)}
                        style={{ width: '100%', minHeight: '140px', resize: 'vertical', background: 'hsl(var(--card) / 0.5)', border: '1px solid hsl(var(--border))', padding: '0.85rem', color: 'hsl(var(--foreground))', fontFamily: 'inherit', fontSize: '0.85rem', borderRadius: 'var(--radius)', lineHeight: 1.5 }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isManualEntry ? 'Provide detailed specifications, timelines, or issues here.' : 'You can modify this summary to add any missing details before confirming.'}
                      </p>
                    </div>
                  )}
                  {!isManualEntry && (
                    <div className="oc-row" style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                      <span className="oc-label">Request ID</span>
                      <span className="oc-value font-mono" style={{ fontSize: '0.8rem' }}>
                        {requestId}
                      </span>
                    </div>
                  )}
                  {selectedOrderId && (
                    <div className="oc-row" style={{ marginTop: '0.5rem' }}>
                      <span className="oc-label">Linked Order ID</span>
                      <span className="oc-value font-mono text-primary" style={{ fontSize: '0.8rem' }}>
                        {selectedOrderId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── For Support: Order ID entry / confirmation ── */}
              {isSupport && (
                <div className="oc-section">
                  <h3 className="oc-section-title">Linked Order</h3>
                  <div className="oc-section-content glass">
                    <input
                      type="text"
                      placeholder="Enter Order ID (e.g. ORD-12345)"
                      value={selectedOrderId || ''}
                      onChange={(e) => setSelectedOrderId(e.target.value || null)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.4rem',
                        background: 'hsl(var(--card) / 0.5)',
                        color: '#fff',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: '0.4rem 0 0' }}>
                      {isManualEntry ? 'Link this support request to an existing order.' : 'Pre-filled from your conversation. Edit if needed.'}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Account Details ── */}
              <div className="oc-section">
                <h3 className="oc-section-title">
                  <Building size={16} /> Your Account
                </h3>
                <div className="oc-section-content glass">
                  <div className="oc-row">
                    <span className="oc-label">Name</span>
                    <span className="oc-value">{effectiveUser?.representativeName || '—'}</span>
                  </div>
                  <div className="oc-row">
                    <span className="oc-label">Company</span>
                    <span className="oc-value">{effectiveUser?.clientId || '—'}</span>
                  </div>
                  <div className="oc-row">
                    <span className="oc-label"><Mail size={13} /> Email</span>
                    <span className="oc-value">{effectiveUser?.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* ── Notice ── */}
              <div className="oc-notice glass">
                <p>
                  By confirming, you authorise Matrix Solutions to proceed with this enquiry.
                  You will receive updates at <strong>{effectiveUser?.email}</strong>.
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div variants={itemVariants} className="oc-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
                disabled={isConfirming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? 'Confirming…' : isSupport ? 'Confirm Support Request' : 'Confirm & Submit Enquiry'}
                {!isConfirming && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default OrderConfirm

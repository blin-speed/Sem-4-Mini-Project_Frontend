import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Mail, Eye, EyeOff, Users, Building, Phone, MapPin, Package, ArrowLeft } from 'lucide-react'
import { register } from '../api/authApi'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import './SignupFromChat.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const SignupFromChat = ({ onLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)

  // chatData comes from FloatingChat via navigate state
  const chatData = location.state?.chatData || {}
  const hasChat = !!chatData.requestId

  const [formData, setFormData] = useState({
    clientId: '',
    representativeName: '',
    representativePhone: '',
    email: '',
    gstNo: '',
    deliveryAddress: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email.trim()) return setError('Email is required.')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) return setError('Please enter a valid email address.')
    if (!formData.password) return setError('Password is required.')
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.')
    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.')
    if (!formData.clientId.trim()) return setError('Company name is required.')
    if (!formData.representativeName.trim()) return setError('Your name is required.')

    setLoading(true)
    setError('')

    try {
      // 1 — Register the real client account
      const userData = await register({
        clientId: formData.clientId.trim(),
        representativeName: formData.representativeName.trim(),
        representativePhone: formData.representativePhone.trim(),
        gstNo: formData.gstNo.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      if (!userData || userData.role !== 'client') {
        setError('Registration failed. Please try again.')
        setLoading(false)
        return
      }

      // 2 — Claim the chat request if applicable
      if (hasChat && userData.clientNo) {
        try {
          await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/claim-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId:      chatData.requestId,
              newClientNo:    userData.clientNo,
              requestType:    chatData.requestType    || 'Lead',  // preserve Support type
              linkedOrderId:  chatData.linkedOrderId  || null,    // preserve linked order
            }),
          })
        } catch {
          console.warn('claim-request failed — continuing anyway')
        }
      }

      // 3 — Redirect to verification instead of immediate login
      navigate('/client/verify-email', {
        replace: true,
        state: {
          email: formData.email.trim().toLowerCase(),
          chatData: chatData // Pass this through to handle it after verification
        }
      })

    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || ''
      setError(msg || 'Registration failed. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-chat-page">
      <GlobalBackgroundAnimation />

      <motion.div
        className="signup-card glass card"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Link to={-1} className="signup-card-back">
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Header */}
        <motion.div variants={itemVariants} className="signup-header text-center">
          <div className="signup-logo-wrap">
            <Package size={36} color="hsl(var(--primary))" />
          </div>
          <h2 className="signup-title">
            <span className="text-gradient">{hasChat ? 'Complete Your Account' : 'Client Registration'}</span>
          </h2>
          <p className="signup-sub">
            {hasChat
              ? 'Details from your conversation have been pre-filled below. Create your account to finalize and track this request.'
              : 'Join Matrix Solutions. Create your account to access our professional IT infrastructure services and portal.'}
          </p>
        </motion.div>

        <motion.form
          variants={itemVariants}
          className="signup-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Name + Company */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <Users size={14} /> Your Name *
              </label>
              <input
                className="input-field"
                name="representativeName"
                type="text"
                placeholder="Full Name"
                required
                value={formData.representativeName}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <Building size={14} /> Company Name *
              </label>
              <input
                className="input-field"
                name="clientId"
                type="text"
                placeholder="Company Name"
                required
                value={formData.clientId}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <Mail size={14} /> Work Email *
              </label>
              <input
                className="input-field"
                name="email"
                type="email"
                placeholder="Your Email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <Phone size={14} /> Phone
              </label>
              <input
                className="input-field"
                name="representativePhone"
                type="tel"
                placeholder="Contact Number"
                value={formData.representativePhone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address + GST */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <MapPin size={14} /> Delivery Address
              </label>
              <input
                className="input-field"
                name="deliveryAddress"
                type="text"
                placeholder="Enter Site Address"
                value={formData.deliveryAddress}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                GST No. <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>(optional)</span>
              </label>
              <input
                className="input-field"
                name="gstNo"
                type="text"
                placeholder="Optional GST Number"
                value={formData.gstNo}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">
                <Lock size={14} /> Password *
              </label>
              <div className="pw-wrap">
                <input
                  className="input-field"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">
                <Lock size={14} /> Confirm Password *
              </label>
              <div className="pw-wrap">
                <input
                  className="input-field"
                  name="confirmPassword"
                  type={showCpw ? 'text' : 'password'}
                  placeholder="Repeat password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowCpw(p => !p)}>
                  {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <motion.p
              className="signup-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary signup-submit-btn"
          >
            {loading ? 'Creating your account…' : (hasChat ? 'Create Account & View My Request' : 'Create My Account')}
            {!loading && <ArrowRight size={18} style={{ marginLeft: '8px' }} />}
          </button>

          <p className="signup-disclaimer">
            <Lock size={12} /> Instant account creation
          </p>
        </motion.form>
      </motion.div>
    </div>
  )
}

export default SignupFromChat

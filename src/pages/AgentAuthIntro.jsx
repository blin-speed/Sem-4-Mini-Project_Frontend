import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, LogIn, ArrowRight, Lock, Eye, EyeOff, Bot, ArrowLeft, Home } from 'lucide-react'
import { login } from '../api/authApi'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import './AgentAuthIntro.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const AgentAuthIntro = ({ onLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const chatData = location.state?.chatData || {}
  const hasChat = !!chatData.requestId
  const isSupport = chatData.requestType === 'Support'

  const [view, setView] = useState(isSupport ? 'login' : 'choice') // 'choice' | 'login'

  const handleNewClient = () => {
    navigate('/client/signup', { state: { chatData } })
  }

  const handleExistingClientLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Email and password required.')

    setLoading(true)
    setError('')

    try {
      // 1. Authenticate user
      // 1. Authenticate user - Fix: pass separate arguments as expected by authApi.login
      const userData = await login(email.trim(), password)
      if (!userData || userData.role !== 'client') {
        throw new Error('Invalid client credentials.')
      }

      // 2. Claim the request
      if (chatData.requestId && userData.clientNo) {
        try {
          await fetch((import.meta.env.VITE_API_URL || '') + '/api/agent/claim-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId:     chatData.requestId,
              newClientNo:   userData.clientNo,
              requestType:   chatData.requestType   || 'Lead',  // preserve Support type
              linkedOrderId: chatData.linkedOrderId || null,    // preserve linked order
            })
          })
        } catch (claimErr) {
          console.warn('Failed to claim request, continuing...', claimErr)
        }
      }

      // 3. Update app session
      if (onLogin) {
        onLogin({
          role: 'client',
          clientNo: userData.clientNo,
          clientId: userData.clientId,
          email: userData.email,
          representativeName: userData.representativeName,
        })
      }

      // 4. Navigate to OrderConfirm to finish the flow
      navigate('/client/order-confirm', {
        replace: true,
        state: {
          userData: {
            role: 'client',
            clientNo: userData.clientNo,
            clientId: userData.clientId,
            email: userData.email,
            representativeName: userData.representativeName,
          },
          requestId: chatData.requestId,
          summaryText: chatData.summaryText || '',
          requestType: chatData.requestType || 'Lead',
          linkedOrderId: chatData.linkedOrderId || null
        }
      })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="agent-intro-page">
      <GlobalBackgroundAnimation />

      <motion.div
        className="intro-card glass card"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {view === 'choice' ? (
          <Link to="/" className="intro-card-back">
            <ArrowLeft size={16} /> Back
          </Link>
        ) : (
          <button type="button" className="intro-card-back" onClick={() => { setView('choice'); setError(''); }}>
            <ArrowLeft size={16} /> Back
          </button>
        )}

        <motion.div variants={itemVariants} className="intro-header text-center">
          <div className="intro-icon-wrap">
            <Bot size={32} color="hsl(var(--primary))" />
          </div>
          <h2 className="intro-title">
            {isSupport ? 'Support Access' : hasChat ? 'Ready to Submit' : 'Client Portal'}
          </h2>
          <p className="intro-sub">
            {isSupport
              ? 'Please log in to your account to link this support request to your existing order.'
              : hasChat
                ? 'Your enquiry has been captured by the assistant. To link this request and finalize submission, please create an account or log in.'
                : 'Welcome back. Access your dashboard, track your orders, and manage your account with Matrix Solutions.'}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="intro-choices"
            >
              <button className="intro-choice-btn prime" onClick={handleNewClient}>
                <div className="choice-icon"><UserPlus size={20} /></div>
                <div className="choice-text">
                  <h3>I'm a New Client</h3>
                  <p>Create an account to track this order</p>
                </div>
                <ArrowRight size={18} className="choice-arrow" />
              </button>

              <button className="intro-choice-btn alt" onClick={() => setView('login')}>
                <div className="choice-icon"><LogIn size={20} /></div>
                <div className="choice-text">
                  <h3>I'm an Existing Client</h3>
                  <p>{hasChat ? 'Log in to attach this to your account' : 'Sign in to access your dashboard'}</p>
                </div>
                <ArrowRight size={18} className="choice-arrow" />
              </button>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleExistingClientLogin}
              className="intro-login-form"
            >

              <div className="intro-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your Work Email"
                  className="intro-input"
                />
              </div>

              <div className="intro-input-group">
                <label>Password</label>
                <div className="pw-wrap">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="intro-input"
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && <p className="intro-error">{error}</p>}

              <button type="submit" disabled={loading} className="btn btn-primary intro-submit-btn">
                {loading ? 'Logging in...' : (hasChat ? 'Log In & Continue' : 'Sign In to Portal')}
                {!loading && <LogIn size={16} style={{ marginLeft: '6px' }} />}
              </button>
              <p className="intro-disclaimer"><Lock size={12} /> Secure login</p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default AgentAuthIntro

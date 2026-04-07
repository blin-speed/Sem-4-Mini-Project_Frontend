import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowLeft, ArrowRight, RefreshCw, Mail } from 'lucide-react'
import { verify } from '../api/authApi'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import './VerifyEmail.css'
import './Auth.css' // Reuse some auth card styles

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.4 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

const VerifyEmail = ({ onLogin }) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || localStorage.getItem('verify_email')
  const chatData = location.state?.chatData

  useEffect(() => {
    if (!email) {
      navigate('/client/signup')
    }
  }, [email, navigate])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only numbers

    const newCode = [...code]
    newCode[index] = value.substring(value.length - 1)
    setCode(newCode)

    if (value && index < 5) {
      inputRefs[index + 1].current.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').slice(0, 6).split('')
    const newCode = [...code]
    pasteData.forEach((char, i) => {
      if (i < 6 && /^\d$/.test(char)) {
        newCode[i] = char
      }
    })
    setCode(newCode)
    const nextIndex = Math.min(pasteData.length, 5)
    inputRefs[nextIndex].current.focus()
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userData = await verify(email, fullCode)
      setSuccess(true)
      localStorage.removeItem('verify_email')
      
      // Auto-login
      if (onLogin) {
        onLogin(userData)
      }

      setTimeout(() => {
        if (chatData) {
          navigate('/client/order-confirm', {
            replace: true,
            state: {
              userData: userData,
              requestId: chatData.requestId,
              summaryText: chatData.summaryText || '',
              requestType: chatData.requestType || 'Lead',
              linkedOrderId: chatData.linkedOrderId || null
            }
          })
        } else {
          navigate('/client', { replace: true })
        }
      }, 2000)
    } catch (err) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <GlobalBackgroundAnimation />

      <motion.div 
        className="auth-card glass verify-card" 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
      >
        <motion.button 
          variants={itemVariants} 
          className="btn-ghost back-btn" 
          onClick={() => navigate('/client/signup')}
        >
          <ArrowLeft size={16} /> Back to Signup
        </motion.button>

        <motion.div variants={itemVariants} className="auth-header text-center">
          <div className="auth-logo-wrap verify-icon-wrap">
            <ShieldCheck size={40} color="hsl(var(--primary))" />
          </div>
          <h2 className="auth-title">
            <span className="text-gradient">Verify Account</span>
          </h2>
          <p className="verify-subtitle">
            We've sent a 6-digit code to <br />
            <span className="verify-email-text">{email}</span>
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="verify-success"
            >
              <div className="success-lottie">✓</div>
              <h3>Verified!</h3>
              <p>Redirecting you to login...</p>
            </motion.div>
          ) : (
            <motion.div exit={{ opacity: 0, x: -20 }}>
              {error && (
                <div className="auth-error glass-error mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="verify-form">
                <div className="code-inputs">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={inputRefs[i]}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      className="code-input-box"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <motion.button 
                  variants={itemVariants} 
                  type="submit" 
                  disabled={loading || code.some(d => !d)}
                  className="btn btn-primary auth-submit verify-submit"
                >
                  <span>{loading ? 'Verifying...' : 'Complete Registration'}</span>
                  {!loading && <ArrowRight size={18} />}
                </motion.button>
              </form>

              <motion.div variants={itemVariants} className="resend-section">
                <p>Didn't receive the code?</p>
                <button 
                  className="btn-link" 
                  disabled={loading}
                  onClick={() => {/* Implement resend logic if needed */}}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Resend Code
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default VerifyEmail

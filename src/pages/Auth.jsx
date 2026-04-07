import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ArrowRight, ArrowLeft, Lock, User, Mail, Shield, Users, Phone, Building, MapPin } from 'lucide-react'
import { login, register } from '../api/authApi'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import './Auth.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const Auth = ({ mode, onLogin }) => {
  const isAdmin = mode === 'admin'
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '', password: '', clientId: '', representativeName: '',
    representativePhone: '', gstNo: '', deliveryAddress: '',
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let userData
      if (isLogin || isAdmin) {
        userData = await login(formData.email, formData.password)
      } else {
        userData = await register({
          clientId: formData.clientId,
          representativeName: formData.representativeName,
          representativePhone: formData.representativePhone,
          gstNo: formData.gstNo,
          deliveryAddress: formData.deliveryAddress,
          email: formData.email,
          password: formData.password,
        })
      }

      if (isAdmin && userData.role !== 'admin') {
        setError('This is the admin portal. Please use the client portal.')
        setLoading(false)
        return
      }
      if (!isAdmin && userData.role !== 'client') {
        setError('Admin accounts must use the admin portal.')
        setLoading(false)
        return
      }

      if (!isLogin && !isAdmin) {
        // Redirect to verification
        navigate('/client/verify-email', { state: { email: formData.email } })
        return
      }

      onLogin(userData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <GlobalBackgroundAnimation />

      <motion.div className="auth-card glass card" variants={containerVariants} initial="hidden" animate="show">
        <motion.button variants={itemVariants} className="btn-ghost back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back
        </motion.button>

        <motion.div variants={itemVariants} className="auth-header text-center">
          <div className="auth-logo-wrap">
            {isAdmin
              ? <Shield size={36} color="hsl(var(--primary))" />
              : <Users size={36} color="hsl(265, 80%, 65%)" />}
          </div>
          <h2 className="auth-title">
            <span className="text-gradient">
              {isAdmin ? 'Admin Portal' : isLogin ? 'Welcome Back' : 'Create Account'}
            </span>
          </h2>
          <p className="auth-sub">
            {isAdmin
              ? 'Restricted — administrators only.'
              : isLogin
                ? 'Sign in to manage your orders and requests.'
                : 'Register to start placing orders with us.'}
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="auth-error glass-error">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form variants={containerVariants} onSubmit={handleSubmit} className="auth-form">

          {/* ── Signup-only fields ── */}
          <AnimatePresence>
            {!isAdmin && !isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
                className="auth-signup-fields">

                <motion.div variants={itemVariants} className="input-group">
                  <label className="input-label">Company / Client ID</label>
                  <div className="auth-input-wrapper">
                    <Building size={16} className="auth-input-icon" />
                    <input type="text" name="clientId" className="input-field pl-10"
                      placeholder="Company Name" required
                      value={formData.clientId} onChange={handleChange} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="input-group">
                  <label className="input-label">Your Full Name</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-input-icon" />
                    <input type="text" name="representativeName" className="input-field pl-10"
                      placeholder="Full Name" required
                      value={formData.representativeName} onChange={handleChange} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div className="auth-input-wrapper">
                    <Phone size={16} className="auth-input-icon" />
                    <input type="tel" name="representativePhone" className="input-field pl-10"
                      placeholder="+91 98765 43210"
                      value={formData.representativePhone} onChange={handleChange} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="input-group">
                  <label className="input-label">GST Number <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <div className="auth-input-wrapper">
                    <Package size={16} className="auth-input-icon" />
                    <input type="text" name="gstNo" className="input-field pl-10"
                      placeholder="27AADCB2230M1Z3" maxLength={15}
                      value={formData.gstNo} onChange={handleChange} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="input-group">
                  <label className="input-label">Delivery Address <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <div className="auth-input-wrapper" style={{ alignItems: 'flex-start' }}>
                    <MapPin size={16} className="auth-input-icon" style={{ marginTop: '0.6rem' }} />
                    <textarea name="deliveryAddress" className="input-field pl-10"
                      placeholder="Plot 12, Industrial Area, Pune - 411001"
                      rows={3} style={{ resize: 'vertical' }}
                      value={formData.deliveryAddress} onChange={handleChange} />
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="input-group">
            <label className="input-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input type="email" name="email" className="input-field pl-10"
                placeholder="Work Email"
                required value={formData.email} onChange={handleChange} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="input-group">
            <label className="input-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input type="password" name="password" className="input-field pl-10"
                placeholder="Password" required minLength={isLogin ? 1 : 6}
                value={formData.password} onChange={handleChange} />
            </div>
          </motion.div>

          <motion.button variants={itemVariants} type="submit" disabled={loading}
            className={`btn btn-primary auth-submit ${isAdmin ? 'btn-red' : ''}`}>
            <span>
              {loading
                ? 'Please wait…'
                : isAdmin ? 'Log In as Admin' : isLogin ? 'Log In' : 'Create Account'}
            </span>
            {!loading && <ArrowRight size={16} style={{ marginLeft: '8px' }} />}
          </motion.button>
        </motion.form>

        {!isAdmin && (
          <motion.div variants={itemVariants} className="auth-footer text-center">
            <button type="button" className="btn-ghost toggle-btn"
              onClick={() => { setIsLogin(!isLogin); setError('') }}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Auth

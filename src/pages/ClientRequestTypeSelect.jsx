import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Headphones } from 'lucide-react'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import './AgentAuthIntro.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } }
}

const ClientRequestTypeSelect = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const mode = location.state?.mode || 'agent' // 'agent' | 'manual'

  const options = [
    {
      icon: ShoppingCart,
      title: 'New Sales Lead',
      desc: 'Looking to procure new IT services, hardware, or solutions? Describe your requirements and our team will put together a proposal for you.',
      color: 'hsl(var(--primary))',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), transparent)',
      border: 'rgba(139,92,246,0.3)',
      requestType: 'Lead',
    },
    {
      icon: Headphones,
      title: 'Support for Existing Order',
      desc: 'Experiencing an issue with a current or past order? Raise a support ticket and we\'ll link it to your order and assign a technician.',
      color: '#fb923c',
      gradient: 'linear-gradient(135deg, rgba(251,146,60,0.12), transparent)',
      border: 'rgba(251,146,60,0.25)',
      requestType: 'Support',
    },
  ]

  const handleSelect = (requestType) => {
    if (mode === 'agent') {
      navigate('/client/requests/confirm', { state: { requestType, isAgent: true } })
    } else {
      navigate('/client/order-confirm', {
        state: { userData: user, requestType, isManualEntry: true, isLoggedInFlow: true, returnTo: '/client/requests-intro' }
      })
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <GlobalBackgroundAnimation />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '700px' }}
      >
        <motion.button
          variants={itemVariants}
          className="btn-ghost"
          onClick={() => navigate('/client/requests-intro')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
        >
          ← Back
        </motion.button>

        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2.4rem', marginBottom: '0.6rem', fontFamily: 'Outfit' }}>
            What can we help with?
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1rem', maxWidth: '440px', margin: '0 auto' }}>
            {mode === 'agent'
              ? 'Our AI assistant will guide you through the process once you choose below.'
              : 'Select the type of request and fill in the details manually.'}
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <motion.div
                key={opt.requestType}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(opt.requestType)}
                className="card glass"
                style={{
                  cursor: 'pointer',
                  padding: '2.25rem 2rem',
                  textAlign: 'center',
                  background: opt.gradient,
                  border: `1px solid ${opt.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${opt.color}18`, border: `1.5px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={28} color={opt.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontFamily: 'Outfit' }}>{opt.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>{opt.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default ClientRequestTypeSelect

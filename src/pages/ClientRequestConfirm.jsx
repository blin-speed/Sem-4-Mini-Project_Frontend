import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingCart, Headphones, ArrowRight } from 'lucide-react'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import './AgentAuthIntro.css'

const ClientRequestConfirm = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const requestType = location.state?.requestType || 'Lead'

  const typeInfo = {
    Lead: {
      icon: ShoppingCart,
      title: 'New Sales Lead',
      desc: 'You\'re about to submit a new sales lead request. Our AI assistant will ask you questions to understand your requirements and create a proposal.',
      color: 'hsl(var(--primary))',
    },
    Support: {
      icon: Headphones,
      title: 'Support Request',
      desc: 'You\'re about to submit a support ticket. Our AI assistant will gather details about your issue and link it to your order for faster resolution.',
      color: '#fb923c',
    },
  }

  const info = typeInfo[requestType] || typeInfo.Lead
  const Icon = info.icon

  const handleConfirm = () => {
    navigate('/client/requests/chat/new', { state: { requestType, isCreation: true } })
  }

  const handleCancel = () => {
    navigate('/client/requests-intro')
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <GlobalBackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '520px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.6rem', fontFamily: 'Outfit' }}>
            Ready to begin?
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>
            Confirm your request type to proceed
          </p>
        </div>

        {/* Request Type Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card glass"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
            background: `linear-gradient(135deg, ${info.color}08, transparent)`,
            border: `1.5px solid ${info.color}40`,
          }}
        >
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${info.color}18`, border: `2px solid ${info.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Icon size={40} color={info.color} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontFamily: 'Outfit' }}>{info.title}</h2>
          <p style={{ fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {info.desc}
          </p>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
            💡 The AI assistant will guide you through the process step by step
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}
        >
          <button
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
            }}
          >
            Start Request <ArrowRight size={18} />
          </button>
          <button
            onClick={handleCancel}
            className="btn btn-ghost"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Go Back
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ClientRequestConfirm

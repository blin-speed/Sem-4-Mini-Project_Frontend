import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, FileText, ClipboardList, MessageSquare } from 'lucide-react'
import GlobalBackgroundAnimation from '../components/GlobalBackgroundAnimation'
import { fetchPublicSettings } from '../hooks/useSettings'
import './AgentAuthIntro.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } }
}

const ClientRequestsIntro = ({ user }) => {
  const navigate = useNavigate()
  const [enabledModes, setEnabledModes] = useState(null) // null = loading

  useEffect(() => {
    fetchPublicSettings().then(s => {
      const modes = new Set((s.requestMode || 'AGENT').split(',').map(m => m.trim()))
      setEnabledModes(modes)
    })
    // Re-fetch on tab focus so admin changes reflect immediately
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchPublicSettings(true).then(s => {
          const modes = new Set((s.requestMode || 'AGENT').split(',').map(m => m.trim()))
          setEnabledModes(modes)
        })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const allOptions = [
    enabledModes?.has('AGENT') && {
      icon: Bot,
      title: 'Talk to Agent',
      desc: 'Let our AI assistant guide you through creating a new lead or support request step by step.',
      color: 'hsl(var(--primary))',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), transparent)',
      border: 'rgba(139,92,246,0.3)',
      action: () => navigate('/client/requests/agent/type'),
    },
    enabledModes?.has('DIRECT') && {
      icon: MessageSquare,
      title: 'Message Us Directly',
      desc: 'Start a direct conversation with our team. We will reply as soon as possible.',
      color: '#60a5fa',
      gradient: 'linear-gradient(135deg, rgba(96,165,250,0.12), transparent)',
      border: 'rgba(96,165,250,0.25)',
      action: () => navigate('/client/direct-chat'),
    },
    enabledModes?.has('MANUAL_ONLY') && {
      icon: FileText,
      title: 'Create Manually',
      desc: 'Skip the chat and fill out a standard form to submit your request directly.',
      color: '#fb923c',
      gradient: 'linear-gradient(135deg, rgba(251,146,60,0.12), transparent)',
      border: 'rgba(251,146,60,0.25)',
      action: () => navigate('/client/requests/manual/type'),
    },
    {
      icon: ClipboardList,
      title: 'View My Requests',
      desc: 'Review all your submitted requests, their status, summaries, and full transcripts.',
      color: '#4ade80',
      gradient: 'linear-gradient(135deg, rgba(74,222,128,0.1), transparent)',
      border: 'rgba(74,222,128,0.2)',
      action: () => navigate('/client/requests'),
    },
  ].filter(Boolean)

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <GlobalBackgroundAnimation />

      <motion.div variants={containerVariants} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '820px' }}>

        <motion.button variants={itemVariants} className="btn-ghost" onClick={() => navigate('/client')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2rem', fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}>
          ← Back to Dashboard
        </motion.button>

        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2.8rem', marginBottom: '0.75rem', fontFamily: 'Outfit' }}>Requests</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.05rem', maxWidth: '480px', margin: '0 auto' }}>
            How would you like to proceed? Choose one of the options below.
          </p>
        </motion.div>

        {enabledModes === null ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {allOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <motion.div key={opt.title} variants={itemVariants} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                  onClick={opt.action} className="card glass"
                  style={{ cursor: 'pointer', padding: '2rem 1.75rem', textAlign: 'center', background: opt.gradient, border: `1px solid ${opt.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${opt.color}18`, border: `1.5px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={26} color={opt.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', fontFamily: 'Outfit' }}>{opt.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{opt.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ClientRequestsIntro

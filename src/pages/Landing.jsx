import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, useSpring, useMotionValue } from 'framer-motion'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Package, CheckCircle, ArrowRight, ChevronRight,
  Zap, Shield, MessageSquare,
  Users, ChevronDown, Bot, Send, Eye,
  Server, Globe, Code2, Headphones
} from 'lucide-react'
import './Landing.css'
import FloatingChat from '../components/FloatingChat'

// ── Shared Content ──
const FEATURES = [
  { id: 'datacenter', icon: Server, title: 'Datacenter Modernization', desc: 'We upgrade your old IT systems to be faster and more reliable, so your business never skips a beat.', color: '#1d358c' },
  { id: 'cybersecurity', icon: Shield, title: 'Cybersecurity & Resilience', desc: 'We protect your users and data from every angle, keeping your business safe from digital threats.', color: '#0ea5e9' },
  { id: 'endpoints', icon: Package, title: 'Endpoints & Productivity', desc: 'We give your team the best tools to work together easily, managed simply from one place.', color: '#8b5cf6' },
  { id: 'digital-signage', icon: Globe, title: 'Digital Signage', desc: 'We help you catch your customers\' eyes with stunning digital displays and interactive content.', color: '#f43f5e' },
]

const FAQ_ITEMS = [
  { q: 'How does Matrix help our business stay competitive?', a: 'We provide a rock-solid technology foundation that allows your team to focus on innovation instead of troubleshooting old systems.' },
  { q: 'What industries does Matrix specialize in?', a: 'While we are technology-agnostic, we have deep expertise in helping enterprises across finance, healthcare, and retail modernize their infrastructure.' },
  { q: 'Can we start with just one service, like Cybersecurity?', a: 'Absolutely. We believe in solving your most pressing problems first and then scaling our partnership as your needs grow.' },
  { q: 'How do we get in touch with an expert?', a: 'Simply use the contact form below or click the chat icon to speak with an agent immediately.' },
]

// ── Typewriter Effect Component ──
const Typewriter = ({ text, delay = 0, className = "" }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: delay }
    }
  };
  const child = {
    visible: { opacity: 1, filter: "blur(0px)", y: 0 },
    hidden: { opacity: 0, filter: "blur(4px)", y: 10 }
  };
  return (
    <motion.span variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className={className} style={{ display: 'inline-block' }}>
      {letters.map((char, index) => (
        <motion.span variants={child} key={index} style={{ display: 'inline-block' }}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

// ── Counting Number Component ──
const CountingNumber = ({ value, duration = 2, suffix = '' }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useSpring(count, { stiffness: 50, damping: 20 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isInView) {
      count.set(value)
    }
  }, [isInView, count, value])

  useEffect(() => {
    return rounded.onChange((latest) => {
      setDisplay(Math.floor(latest))
    })
  }, [rounded])

  return <span ref={ref}>{display}{suffix}</span>
}

const FaqItem = ({ item, i }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: isOpen ? '#f8fafc' : '#fff', transition: 'all 0.3s' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isOpen ? '#1a358c' : '#0f172a' }}>{item.q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={20} color={isOpen ? '#1a358c' : '#64748b'} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 2rem 2rem', color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loadingComplete, setLoadingComplete] = useState(() => {
    if (location.state?.fromLogout) return true;
    return sessionStorage.getItem('matrix_splash_shown') === 'true';
  })
  const [loginOpen, setLoginOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const baseDelay = loadingComplete ? 0.2 : 2.4

  useEffect(() => {
    if (loadingComplete) return
    const timer = setTimeout(() => {
      setLoadingComplete(true)
      sessionStorage.setItem('matrix_splash_shown', 'true')
    }, 2000)
    return () => clearTimeout(timer)
  }, [loadingComplete])

  return (
    <div className="landing-page" style={{ background: '#fff' }}>
      <AnimatePresence>
        {!loadingComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src="/logo.jfif" alt="Matrix Logo" style={{ width: '350px', marginBottom: '3.5rem' }} />
              <div style={{ width: '180px', height: '2px', background: 'rgba(29, 53, 140, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: "linear" }}
                  style={{ height: '100%', background: '#1a358c' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="lp-nav glass" style={{ position: 'fixed', width: '100%', zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
        <div className="lp-nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="lp-brand" style={{ display: 'flex', alignItems: 'center', paddingTop: '10px' }}>
            <img src="/logo.jfif" alt="Matrix Solutions" style={{ height: '55px', objectFit: 'contain' }} />
          </div>

          <nav className="lp-nav-links" style={{ display: 'flex', gap: '2rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <a href="/" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</a>
            <a href="#services" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Services</a>
            <Link to="/about" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>About Us</Link>
          </nav>

          <div className="lp-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative' }}>
            <div className="nav-item-dropdown" style={{ position: 'relative' }} onMouseEnter={() => setLoginOpen(true)} onMouseLeave={() => setLoginOpen(false)}>
              <button className="btn btn-ghost" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Login <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {loginOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    style={{ position: 'absolute', top: '100%', right: 0, width: '180px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '0.5rem', zIndex: 100 }}>
                    <button onClick={() => navigate('/admin/login')} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#0f172a', fontWeight: 600, fontSize: '0.85rem', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      Admin Login
                    </button>
                    <button onClick={() => navigate('/client/login')} style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', color: '#0f172a', fontWeight: 600, fontSize: '0.85rem', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      User Login
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setChatOpen(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.8rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', borderRadius: '50px', backgroundColor: '#1d358c', boxShadow: '0 4px 15px rgba(29, 53, 140, 0.25)', textDecoration: 'none', border: 'none', cursor: 'pointer' }}>Get Started</button>
          </div>
        </div>
      </header>

      <section className="lp-hero" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '6rem 5% 4rem' }}>
        <video autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, zIndex: 0, transform: 'scale(1.9)' }}>
          <source src="/make_animation_of_matrix_3x3_matric_that_matrix_in.mp4" type="video/mp4" />
        </video>
        <div className="lp-hero-content" style={{ position: 'relative', zIndex: 1, maxWidth: '900px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: baseDelay }}>
            <h1 className="hero-title" style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '1.5rem', color: '#0f172a' }}>
              <Typewriter text="Powering businesses with" delay={baseDelay} /> <br />
              <Typewriter text="reliable, end-to-end " delay={baseDelay + 1.0} /><span style={{ color: '#1a358c' }}><Typewriter text="IT solutions" delay={baseDelay + 2.0} /></span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#475569', marginBottom: '2.5rem', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
              Matrix Solutions delivers cutting-edge technology and seamless infrastructure to enable organizations worldwide.
            </p>
            <div className="hero-actions" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <button onClick={() => setChatOpen(true)} className="btn btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: 700, color: '#fff', backgroundColor: '#1d358c', borderRadius: '50px', border: 'none', cursor: 'pointer' }}>Get Started</button>
              <button onClick={() => navigate('/about')} className="btn btn-ghost" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: '50px', color: '#0f172a', background: 'none', cursor: 'pointer' }}>About Us</button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="normal-content-flow">
        <section className="corporate-stats" style={{ display: 'flex', justifyContent: 'center', background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '4rem 5%', marginTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', maxWidth: '1000px' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', padding: '1rem', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ color: '#475569', fontSize: '1.125rem', marginBottom: '1rem', fontWeight: '500' }}>Years of leadership</p>
              <h3 style={{ fontSize: '4rem', fontWeight: '800', color: '#1a358c', margin: 0, letterSpacing: '-1.5px' }}><CountingNumber value={30} suffix="+" /></h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', padding: '1rem', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ color: '#475569', fontSize: '1.125rem', marginBottom: '1rem', fontWeight: '500' }}>Customers Served</p>
              <h3 style={{ fontSize: '4rem', fontWeight: '800', color: '#1a358c', margin: 0, letterSpacing: '-1.5px' }}><CountingNumber value={1000} suffix="+" /></h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ color: '#475569', fontSize: '1.125rem', marginBottom: '1rem', fontWeight: '500' }}>Retention Success</p>
              <h3 style={{ fontSize: '4rem', fontWeight: '800', color: '#1a358c', margin: 0, letterSpacing: '-1.5px' }}><CountingNumber value={90} suffix="%" /></h3>
            </motion.div>
          </div>
        </section>

        <div style={{ background: '#f8fafc' }}>
          <section className="lp-section">
            <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p style={{ color: '#1a358c', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1rem' }}>OPTIMIZED FLOW</p>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a' }}>Process Intelligence</h2>
            </motion.div>

            <div className="steps-row">
              {[
                { n: '01', title: 'Discovery', desc: 'We listen to your goals and identify the technology gaps holding you back.' },
                { n: '02', title: 'Specialized Design', desc: 'Our experts craft a custom solution roadmap with clear, honest pricing.' },
                { n: '03', title: 'Seamless Rollout', desc: 'We implement your new infrastructure with zero fuss and constant updates.' },
                { n: '04', title: 'Long-term Support', desc: 'We remain your partners, ensuring your systems evolve as you grow.' }
              ].map((step, i) => (
                <motion.div key={i} className="step-card card"
                  style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(29, 53, 140, 0.08)', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '3.5rem 1.5rem' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, boxShadow: '0 15px 40px rgba(29, 53, 140, 0.12)', border: '1px solid #c7d6f5' }}>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ color: '#1a358c', fontWeight: 800, fontSize: '1.25rem' }}>{step.n}</span>
                    <div style={{ width: '90px', height: '90px', margin: '2rem auto', borderRadius: '50%', overflow: 'hidden', border: '2px solid #1a358c', position: 'relative', boxShadow: '0 0 20px rgba(26, 53, 140, 0.2)' }}>
                      <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}>
                        <source src="/make_animation_of_matrix_3x3_matric_that_matrix_in.mp4" type="video/mp4" />
                      </video>
                      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.02, 0.15] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#1a358c', borderRadius: '50%', pointerEvents: 'none', zIndex: 1 }} />
                    </div>
                    <h4 style={{ color: '#0f172a', fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 800 }}>{step.title}</h4>
                    <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <section id="faq" style={{ padding: '8rem 5%', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: '4rem', textAlign: 'center' }}>
              <p style={{ color: '#1a358c', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '0.75rem' }}>FREQUENTLY ASKED QUESTIONS</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Common Questions</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, marginBottom: '2rem' }}>
                click on the chat bot on the rightmost bottom and ask about you requirements and queries
              </p>
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={i} item={item} i={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" style={{ padding: '6rem 2rem', background: '#fff' }}>
          <motion.h2 initial={{ opacity: 0, x: 100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} className="section-title" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem', color: '#1a358c' }}>
            Alliances <span style={{ color: '#0f172a' }}>Ecosystem</span>
          </motion.h2>
          <div className="marquee-wrapper" style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
            <motion.div className="marquee-content" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ display: 'flex', gap: '6rem', alignItems: 'center', minWidth: 'max-content' }}>
              {[...Array(2)].map((_, index) => (
                <div key={index} style={{ display: 'flex', gap: '6rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#01a982' }}>Hewlett Packard Enterprise</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#008AD7' }}>Microsoft Azure</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#1428a0', fontStyle: 'italic' }}>SAMSUNG</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#c3242a', letterSpacing: '4px' }}>FORTINET</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: '900', color: '#ca1f32' }}>COMMVAULT</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="services" style={{ position: 'relative', background: '#fff', borderTop: '1px solid #e2e8f0', padding: '7rem 5%', overflow: 'hidden' }}>
          <video autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}>
            <source src="/make_animation_of_matrix_3x3_matric_that_matrix_in (1).mp4" type="video/mp4" />
          </video>
          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ color: '#1a358c', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '0.75rem' }}>WHAT WE DO</p>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '4rem' }}>Our Services</h2>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
              {[
                { icon: Users, title: 'Consulting Services', items: ['IT Infrastructure Assessment', 'Security Posture Review', 'Workforce Productivity Audit', 'Digital Experience Strategy'] },
                { icon: CheckCircle, title: 'Managed Services', items: ['Infrastructure Monitoring & Management', 'Backup & Disaster Recovery', 'Endpoint Lifecycle & Patch Management', 'Print & Peripheral Management', 'Digital Signage Management'] },
              ].map((col, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, boxShadow: '0 15px 30px rgba(29, 53, 140, 0.12)', border: '1px solid #c7d6f5' }}
                  style={{ background: '#f8fafc', borderRadius: '12px', padding: '2rem', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <motion.div whileHover={{ rotate: 15 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <col.icon size={24} color="#1a358c" />
                    </motion.div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>{col.title}</h3>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {col.items.map((item, j) => (
                      <motion.li key={j} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: (i * 0.1) + (j * 0.05) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: '#475569', fontSize: '0.95rem', borderBottom: j < col.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <ArrowRight size={14} color="#1a358c" />{item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginTop: '4rem' }}>
              <button 
                onClick={() => setChatOpen(true)} 
                className="btn btn-primary" 
                style={{ padding: '0.9rem 2.5rem', fontSize: '1rem', fontWeight: 700, color: '#fff', backgroundColor: '#1d358c', borderRadius: '50px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(29, 53, 140, 0.25)' }}
              >
                Speak to Our Agent <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </button>
            </motion.div>
          </div>
        </section>


        <footer id="footer" style={{ background: '#0f172a', color: '#fff', padding: '5rem 5% 2rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: '4rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <img src="/logo.jfif" alt="Matrix" style={{ height: '70px', marginBottom: '1.5rem' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Delivering IT infrastructure since 1996.</p>
            </div>
            <div>
              <h4>Solutions</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.6)' }}>
                <li>Datacenter</li><li>Cybersecurity</li><li>Managed IT</li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.6)' }}>
                <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</Link></li>
                <li><a href="#services" style={{ color: 'inherit', textDecoration: 'none' }}>Services</a></li>
                <li>Alliances</li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Mumbai, India</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>© 2026 Matrix Solutions Pvt. Ltd. All rights reserved.</div>
        </footer>
      </div>
      <FloatingChat externalOpen={chatOpen} onToggle={setChatOpen} />
    </div>
  )
}

export default Landing

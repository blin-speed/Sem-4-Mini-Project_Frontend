import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Users, TrendingUp, Award, Globe } from 'lucide-react'
import './Landing.css'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, ease: 'easeOut', delay },
})

const AboutUs = () => {
  const stats = [
    { value: '30+', label: 'Years of Excellence' },
    { value: '500+', label: 'Enterprise Clients' },
    { value: '1000+', label: 'Projects Delivered' },
    { value: '98%', label: 'Client Retention Rate' },
  ]

  const values = [
    {
      icon: ShieldCheck,
      title: 'Financial Credibility',
      desc: 'We uphold the highest standards of fiscal integrity and transparent business conduct, ensuring long-term partnership reliability for every client and stakeholder.',
      color: '#38bdf8',
    },
    {
      icon: Zap,
      title: 'Technical Excellence',
      desc: 'Our in-house engineers and solution architects bring specialised expertise across datacenters, cybersecurity, and endpoint management — always at the cutting edge.',
      color: '#818cf8',
    },
    {
      icon: Users,
      title: 'Client-First Philosophy',
      desc: 'From our dedicated Customer Information Centre to on-site engineering support, every touchpoint is designed around delivering seamless, measurable value.',
      color: '#34d399',
    },
    {
      icon: TrendingUp,
      title: 'Market-Leading Growth',
      desc: 'We are not just keeping pace with the global technology landscape — we are setting the benchmark for IT distribution and project marketing in India.',
      color: '#fb923c',
    },
    {
      icon: Award,
      title: 'Trusted Alliances',
      desc: 'Decades of partnership with world-class technology brands have given us the credibility and clout to deliver image-building consultancy at the highest level.',
      color: '#f472b6',
    },
    {
      icon: Globe,
      title: 'Expanding Influence',
      desc: 'From core IT distribution to sophisticated infrastructure integration, Matrix Solutions continues to evolve its portfolio to meet tomorrow\'s enterprise challenges.',
      color: '#a78bfa',
    },
  ]

  return (
    <div style={{ background: '#fff', fontFamily: "'Inter', 'Outfit', sans-serif" }}>

      {/* ─── Navbar ─── */}
      <header className="lp-nav glass" style={{ position: 'fixed', width: '100%', zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="lp-nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="lp-brand" style={{ display: 'flex', alignItems: 'center', paddingTop: '10px' }}>
            <img src="/logo.jfif" alt="Matrix Solutions" style={{ height: '55px', objectFit: 'contain' }} />
          </div>
          <nav className="lp-nav-links" style={{ display: 'flex', gap: '2rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <a href="/" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</a>
            <a href="/#services" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Services</a>
            <a href="/about" style={{ color: '#1a358c', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>About Us</a>
          </nav>
          <div className="lp-nav-cta">
            <a href="/#contact" className="btn btn-primary" style={{ padding: '0.6rem 1.8rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', borderRadius: '50px', backgroundColor: '#1d358c', boxShadow: '0 4px 15px rgba(29,53,140,0.25)', textDecoration: 'none' }}>Get Started</a>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section style={{
        paddingTop: '11rem', paddingBottom: '7rem', paddingLeft: '5%', paddingRight: '5%',
        background: 'linear-gradient(160deg, #f0f4ff 0%, #f8fafc 60%, #e8f0ff 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative orb */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,53,140,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div {...fadeUp()}>
          <p style={{ color: '#1a358c', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'inline-block', background: 'rgba(26,53,140,0.08)', padding: '0.3rem 1rem', borderRadius: '50px', border: '1px solid rgba(26,53,140,0.15)' }}>
            About Matrix Solutions
          </p>
          <h1 style={{ fontSize: 'clamp(2.8rem, 5vw, 4rem)', fontWeight: 900, color: '#0f172a', margin: '0 auto 1.5rem', lineHeight: 1.15, maxWidth: '820px', letterSpacing: '-0.02em' }}>
            Empowering Enterprise Through{' '}
            <span style={{ color: '#1a358c', position: 'relative' }}>High-Performance IT</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: '680px', margin: '0 auto', lineHeight: 1.75 }}>
            For over three decades, Matrix Solutions has delivered world-class IT infrastructure, networking, and security solutions to India's most demanding corporate and institutional clients.
          </p>
        </motion.div>
      </section>

      {/* ─── Stats Strip ─── */}
      <section style={{ background: '#1a358c', padding: '3.5rem 5%' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {stats.map((s, i) => (
            <motion.div key={i} {...fadeUp(i * 0.08)}>
              <p style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.3rem', lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section style={{ padding: '7rem 5%', background: '#fff' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <motion.div {...fadeUp()}>
            <p style={{ color: '#1a358c', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1rem' }}>Our Mission</p>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.75rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Infrastructure That Powers India's Enterprises
            </h2>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.9, marginBottom: '1.25rem' }}>
              To empower corporate and institutional clients with <strong style={{ color: '#0f172a' }}>high-performance IT infrastructure</strong> through a robust portfolio of computing, networking, and security solutions.
            </p>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.9 }}>
              We leverage over <strong style={{ color: '#0f172a' }}>30 years of operational excellence</strong> to provide seamless technology integration, backed by a dedicated Customer Information Centre and specialised on-site engineering support — maintaining the highest standards of financial credibility while delivering consistent value to every partner and client.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Vision ─── */}
      <section style={{ padding: '7rem 5%', background: '#f8fafc' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <motion.div {...fadeUp()}>
            <p style={{ color: '#059669', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1rem' }}>Our Vision</p>
            <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.75rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              India's Most Trusted, Financially Independent IT Partner
            </h2>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.9, marginBottom: '1.25rem' }}>
              To be the <strong style={{ color: '#0f172a' }}>most trusted and financially independent IT solutions provider in India</strong>, setting the benchmark for market-leading growth and technical expertise across all domains.
            </p>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.9 }}>
              We aim to evolve alongside the global technology landscape — expanding our influence from core IT distribution to <strong style={{ color: '#0f172a' }}>sophisticated project marketing and image-building consultancy</strong> for world-class brands, while never compromising on the integrity and quality that define us.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Core Values ─── */}
      <section style={{ padding: '8rem 5%', background: '#0f172a', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#38bdf8', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1rem' }}>What Drives Us</p>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>Our Core Values</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              These principles have guided Matrix Solutions for over three decades and continue to shape every decision we make.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div key={i} {...fadeUp(i * 0.07)}
                  style={{ padding: '2.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.2s' }}
                  whileHover={{ background: 'rgba(255,255,255,0.07)', y: -4 }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${v.color}18`, border: `1px solid ${v.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Icon size={22} color={v.color} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: v.color }}>{v.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, fontSize: '0.9rem' }}>{v.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section style={{ padding: '6rem 5%', background: 'linear-gradient(135deg, #1a358c 0%, #2d4fcf 100%)', textAlign: 'center', color: '#fff' }}>
        <motion.div {...fadeUp()}>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Ready to Partner With Us?</h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Let's discuss how Matrix Solutions can transform your IT infrastructure and drive real business outcomes.
          </p>
          <a href="/#contact" style={{ display: 'inline-block', background: '#fff', color: '#1a358c', fontWeight: 800, fontSize: '0.95rem', padding: '0.9rem 2.5rem', borderRadius: '50px', textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', letterSpacing: '0.03em' }}>
            Get in Touch →
          </a>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ background: '#0a0f1e', color: '#fff', padding: '4rem 5% 2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <img src="/logo.jfif" alt="Matrix Solutions" style={{ height: '60px', marginBottom: '1.25rem', borderRadius: '8px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.75, maxWidth: '260px' }}>
              Delivering high-performance IT infrastructure to India's leading enterprises since 1996.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.7)' }}>Solutions</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {['Datacenter', 'Cybersecurity', 'Networking', 'Managed IT'].map(s => (
                <li key={s}><a href="/#services" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.88rem' }}>{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.7)' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[{ label: 'About Us', href: '/about' }, { label: 'Services', href: '/#services' }, { label: 'Alliances', href: '/' }].map(l => (
                <li key={l.label}><a href={l.href} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.88rem' }}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', color: 'rgba(255,255,255,0.7)' }}>Contact</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.7 }}>Mumbai, India</p>
            <a href="/#contact" style={{ display: 'inline-block', marginTop: '1rem', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, padding: '0.5rem 1.2rem', borderRadius: '50px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>Get in Touch</a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.75rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
          © 2026 Matrix Solutions Pvt. Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default AboutUs

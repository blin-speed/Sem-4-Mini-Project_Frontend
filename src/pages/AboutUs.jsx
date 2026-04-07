import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Users, Target, Eye, ArrowRight } from 'lucide-react'
import './Landing.css' // Reuse landing page styles for consistency

const AboutUs = () => {
  const navigate = useNavigate()

  return (
    <div className="about-page" style={{ background: '#fff' }}>
      <header className="lp-nav glass" style={{ position: 'fixed', width: '100%', zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fff' }}>
        <div className="lp-nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="lp-brand" style={{ display: 'flex', alignItems: 'center', paddingTop: '10px' }}>
            <img src="/logo.jfif" alt="Matrix Solutions" style={{ height: '55px', objectFit: 'contain' }} />
          </div>
          
          <nav className="lp-nav-links" style={{ display: 'flex', gap: '2rem', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <a href="/" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</a>
            <a href="/#services" style={{ color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Services</a>
            <a href="/about" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>About Us</a>
          </nav>

          <div className="lp-nav-cta">
            <a href="/#contact" className="btn btn-primary" style={{ padding: '0.6rem 1.8rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', borderRadius: '50px', backgroundColor: '#1d358c', boxShadow: '0 4px 15px rgba(29, 53, 140, 0.25)', textDecoration: 'none' }}>Get Started</a>
          </div>
        </div>
      </header>

      <section className="about-hero" style={{ padding: '10rem 5% 6rem', background: '#f8fafc', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p style={{ color: '#1a358c', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '1rem' }}>OUR STORY</p>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Empowering Business Through <span style={{ color: '#1a358c' }}>Technology</span></h1>
          <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
            Since 1996, Matrix Solutions has been at the forefront of IT infrastructure, delivering reliable and innovative solutions to organizations worldwide.
          </p>
        </motion.div>
      </section>

      <section className="about-content" style={{ padding: '6rem 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '6rem' }}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Our Mission</h2>
              <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.8 }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.8, marginTop: '1rem' }}>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ background: '#f1f5f9', borderRadius: '24px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={120} color="#1a358c" opacity={0.2} />
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ background: '#f1f5f9', borderRadius: '24px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', order: 2 }}>
              <Eye size={120} color="#1a358c" opacity={0.2} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ order: 1 }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Our Vision</h2>
              <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.8 }}>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.8, marginTop: '1rem' }}>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="about-values" style={{ padding: '8rem 5%', background: '#0f172a', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '4rem' }}>Our Core Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { title: 'Integrity', desc: 'We conduct our business with the highest level of ethics and transparency.' },
              { title: 'Innovation', desc: 'We constantly push the boundaries of what technology can achieve for our clients.' },
              { title: 'Customer First', desc: 'Your success is our primary metric for performance and growth.' }
            ].map((value, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: '3rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#38bdf8' }}>{value.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer id="footer" style={{ background: '#0f172a', color: '#fff', padding: '5rem 5% 2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
              <li><a href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</a></li><li><a href="/#services" style={{ color: 'inherit', textDecoration: 'none' }}>Services</a></li><li>Alliances</li>
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
  )
}

export default AboutUs

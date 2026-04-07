import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const SOLUTION_DATA = {
  'datacenter': {
    title: 'Datacenter Modernization',
    subtitle: 'Modernizing legacy IT that\'s slowing down growth.',
    content: 'We modernize your datacenter with the right mix of compute, storage, and virtualization. Our solutions help businesses dramatically reduce operational overhead while scaling compute power securely. We specialize in Hyper-Converged Infrastructure (HCI) that collapses traditional silos, Edge Computing nodes for low-latency processing, and high-density liquid cooling solutions for sustainable AI workloads. Whether it\'s migrating to a hybrid model or fully overhauling on-premise blade servers, we ensure zero downtime during transitions.',
    features: ['High-Performance Compute', 'Scalable Storage Solutions', 'Virtualization (VMware/Hyper-V)', 'Disaster Recovery Setup', 'Hyper-Converged Infrastructure', 'Edge Compute Nodes', 'AI-Ready Server Racks']
  },
  'cybersecurity': {
    title: 'Cybersecurity & Resilience',
    subtitle: 'Security gaps across users, devices, and critical data.',
    content: 'We secure your enterprise end-to-end — from endpoints to networks and cloud security. With threats evolving daily, our Zero-Trust architecture ensures that every access request is verified. We integrate AI-driven threat hunting that predicts anomalies before they manifest, biometric multi-factor authentication for physical-logical parity, and specialized security for Industrial IoT (IIoT) and maritime environments. We provide continuous threat monitoring, automated response protocols, and strict governance to keep your intellectual property safe.',
    features: ['Zero-Trust Architecture', 'Endpoint Detection & Response', 'Network Firewall Management', 'Security Operations Center (SOC)', 'AI Threat Hunting', 'Industrial IoT Security', 'Data Sovereignty Compliance']
  },
  'endpoints': {
    title: 'Endpoints & Productivity',
    subtitle: 'Defragmenting scattered workforce tools hurting productivity.',
    content: 'We simplify management and boost collaboration with smart endpoint solutions. Managing thousands of remote devices can be a logistical nightmare. We implement Zero-Touch Provisioning (ZTP) to ship ready-to-work hardware directly to employees, leverage advanced Telemetry for proactive hardware replacement cycles, and provide unified workspace environments that bridge legacy apps with modern SaaS. We streamline everything from laptop provisioning to mobile device management (MDM), ensuring your global workforce stays connected, productive, and secure no matter where they are.',
    features: ['Mobile Device Management (MDM)', 'Unified Communications', 'Automated Patching', 'VDI & Remote Desktop', 'Zero-Touch Provisioning', 'Proactive Hardware Telemetry', 'Asset Lifecycle Tracking']
  },
  'digital-signage': {
    title: 'Digital Signage',
    subtitle: 'Enhancing meaningful customer engagement experiences.',
    content: 'We help you stand out with high-impact digital signage and communication tools. From corporate lobbies to massive retail deployments, our digital signage networks are centrally managed, highly reliable, and visually stunning. We offer Anonymous Viewer Analytics to measure engagement without compromising privacy, Programmatic Advertising integration for dynamic revenue streams, and Emergency Broadcast overrides for campus-wide safety. Deliver dynamic, targeted content to any screen worldwide with a push of a button.',
    features: ['Centralized Content Management', 'Interactive Kiosks', 'Video Wall Displays', 'Real-time Analytics', 'Viewer Engagement Tracking', 'Programmatic Ad Integration', 'Emergency Overrides']
  }
}

const SolutionDetail = () => {
  const { id } = useParams()
  const data = SOLUTION_DATA[id]

  if (!data) return <div style={{ padding: '4rem', textAlign: 'center' }}>Solution not found.</div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ padding: '0 5%', height: '70px', display: 'flex', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <Link to="/" state={{ fromLogout: true }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#1d358c', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Home
        </Link>
      </header>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', background: 'linear-gradient(135deg, #fff 0%, #f0f7ff 100%)', border: '1px solid #c7d6f5', padding: '4rem 3rem', marginBottom: '3rem', boxShadow: '0 10px 30px rgba(29, 53, 140, 0.08)' }}>
          <video autoPlay loop muted playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, zIndex: 0, transform: 'scale(1.1)', filter: 'brightness(1.1) saturate(1.8)' }}>
            <source src="/make_animation_of_matrix_3x3_matric_that_matrix_in.mp4" type="video/mp4" />
          </video>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a', lineHeight: 1.1 }}>{data.title}</h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 400, color: '#475569', maxWidth: '750px', lineHeight: 1.4 }}>{data.subtitle}</h2>
          </motion.div>
        </div>
          
          <div style={{ background: '#fff', padding: '4rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginBottom: '3rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '4rem', flexDirection: 'column' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '24px', background: '#1d358c', borderRadius: '4px' }} />
                  Executive Overview
                </h3>
                <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: '#334155' }}>
                  {data.content}
                </p>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '24px', background: '#1d358c', borderRadius: '4px' }} />
                  Strategic Capabilities
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {data.features.map((feature, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569', fontWeight: 500, padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <CheckCircle size={20} color="#1d358c" /> {feature}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
      </main>
    </div>
  )
}

export default SolutionDetail

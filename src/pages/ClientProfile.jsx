import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Building, MapPin, Package, Pencil, Save, X } from 'lucide-react'
import { getClientByNo, updateClient } from '../api/clientApi'
import './ClientProfile.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const ClientProfile = ({ user }) => {
  const [client,  setClient]  = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm] = useState({
    representativeName:  '',
    representativePhone: '',
    deliveryAddress:     '',
    gstNo:               '',
  })

  useEffect(() => {
    if (!user?.clientNo) return
    getClientByNo(user.clientNo).then((c) => {
      setClient(c)
      setForm({
        representativeName:  c.representativeName  || '',
        representativePhone: c.representativePhone || '',
        deliveryAddress:     c.deliveryAddress     || '',
        gstNo:               c.gstNo               || '',
      })
    }).catch(() => {})
  }, [user])

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const updated = await updateClient(user.clientNo, form)
      setClient(updated); setEditing(false)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleCancel = () => {
    setForm({
      representativeName:  client?.representativeName  || '',
      representativePhone: client?.representativePhone || '',
      deliveryAddress:     client?.deliveryAddress     || '',
      gstNo:               client?.gstNo               || '',
    })
    setEditing(false); setError('')
  }

  const d = client || {}
  const initials = (user?.representativeName || user?.clientId || 'CL').substring(0, 2).toUpperCase()

  return (
    <motion.div className="cp-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="cp-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>My Profile</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>Update your profile information and account settings.</p>
        </div>
        {!editing ? (
          <button className="btn btn-ghost cp-edit-btn" onClick={() => setEditing(true)} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem'}}>
            <Pencil size={15} style={{ marginRight: '0.4rem' }} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={handleCancel} disabled={saving} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem'}}>
              <X size={15} style={{ marginRight: '0.3rem' }} /> Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem'}}>
              <Save size={15} style={{ marginRight: '0.3rem' }} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </motion.header>

      {error && (
        <motion.div variants={itemVariants} className="cp-error glass-error">{error}</motion.div>
      )}

      {/* ── Identity card ── */}
      <motion.div variants={itemVariants} className="card cp-identity glass glow-effect" style={{position: 'relative', overflow: 'hidden'}}>
        <div className="cp-avatar">{initials}</div>
        <div style={{zIndex: 1}}>
          <h2 className="cp-name text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>{user?.representativeName || '—'}</h2>
          <p className="cp-company font-mono">{user?.clientId || '—'}</p>
          <span className={`cp-badge ${d.accountStatus === 'Active' ? 'active-badge' : 'pending-badge'}`}>Clearance: {d.accountStatus || 'Pending'}</span>
        </div>
      </motion.div>

      {/* ── Two-column details grid ── */}
      <div className="cp-grid">
        {/* Contact details */}
        <motion.div variants={itemVariants} className="card cp-section glass">
          <h3 className="cp-section-title text-gradient"><User size={16} /> Account Details</h3>

          <div className="cp-field">
            <div className="cp-field-icon"><Mail size={16} /></div>
            <div className="cp-field-body">
              <label>Email Address</label>
              <p className="cp-field-val font-mono">{user?.email || '—'}</p>
              <span className="cp-read-only-note">This can't be changed. Contact support if you need to update it.</span>
            </div>
          </div>

          <div className="cp-field">
            <div className="cp-field-icon"><User size={16} /></div>
            <div className="cp-field-body">
              <label>Your Name</label>
              {editing ? (
                <input className="input-field cp-input"
                  value={form.representativeName}
                  onChange={(e) => setForm({ ...form, representativeName: e.target.value })} />
              ) : (
                <p className="cp-field-val">{d.representativeName || '—'}</p>
              )}
            </div>
          </div>

          <div className="cp-field">
            <div className="cp-field-icon"><Phone size={16} /></div>
            <div className="cp-field-body">
              <label>Phone Number</label>
              {editing ? (
                <input className="input-field cp-input" placeholder="+91 98765 43210"
                  value={form.representativePhone}
                  onChange={(e) => setForm({ ...form, representativePhone: e.target.value })} />
              ) : (
                <p className="cp-field-val font-mono">{d.representativePhone || '—'}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Business details */}
        <motion.div variants={itemVariants} className="card cp-section glass">
          <h3 className="cp-section-title text-gradient"><Building size={16} /> Company Information</h3>

          <div className="cp-field">
            <div className="cp-field-icon"><Building size={16} /></div>
            <div className="cp-field-body">
              <label>Company Name</label>
              <p className="cp-field-val font-mono" style={{fontSize: '0.9rem'}}>{user?.clientId || '—'}</p>
              <span className="cp-read-only-note">Can't be changed</span>
            </div>
          </div>

          <div className="cp-field">
            <div className="cp-field-icon"><Package size={16} /></div>
            <div className="cp-field-body">
              <label>Tax Registration (GST)</label>
              {editing ? (
                <input className="input-field cp-input font-mono" maxLength={15}
                  placeholder="27AADCB2230M1Z3"
                  value={form.gstNo}
                  onChange={(e) => setForm({ ...form, gstNo: e.target.value })} />
              ) : (
                <p className="cp-field-val font-mono" style={{ fontSize: '0.9rem' }}>
                  {d.gstNo || '—'}
                </p>
              )}
            </div>
          </div>

          <div className="cp-field" style={{ alignItems: 'flex-start' }}>
            <div className="cp-field-icon" style={{ marginTop: '0.2rem' }}><MapPin size={16} /></div>
            <div className="cp-field-body">
              <label>Delivery Address</label>
              {editing ? (
                <textarea className="input-field cp-input" rows={3}
                  style={{ resize: 'vertical' }}
                  placeholder="Enter your delivery address..."
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} />
              ) : (
                <p className="cp-field-val" style={{ lineHeight: 1.6 }}>
                  {d.deliveryAddress || '—'}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Account info ── */}
      <motion.div variants={itemVariants} className="card cp-section cp-account glass">
        <h3 className="cp-section-title text-gradient" style={{justifyContent: 'center', marginBottom: '1.5rem'}}>Account Information</h3>
        <div className="cp-account-row">
          <div className="cp-account-item glass text-center" style={{padding: '1.5rem', flex: 1, borderRadius: '8px', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))'}}>
            <span className="cp-account-lbl" style={{display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--primary))'}}>Status</span>
            <span className={`tag tag-${d.accountStatus === 'Active' ? 'success' : 'pending'}`} style={{fontSize: '0.75rem', padding: '0.3rem 0.8rem'}}>
              {d.accountStatus || '—'}
            </span>
          </div>
          <div className="cp-account-item glass text-center" style={{padding: '1.5rem', flex: 1, borderRadius: '8px', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))'}}>
            <span className="cp-account-lbl" style={{display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--primary))'}}>Account Created</span>
            <span className="cp-account-val font-mono text-gradient" style={{fontSize: '1.1rem'}}>{d.createdAt?.split('T')[0] || '—'}</span>
          </div>
          <div className="cp-account-item glass text-center" style={{padding: '1.5rem', flex: 1, borderRadius: '8px', background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))'}}>
            <span className="cp-account-lbl" style={{display: 'block', marginBottom: '0.5rem', color: 'hsl(var(--primary))'}}>Account ID</span>
            <span className="cp-account-val font-mono" style={{fontSize: '1.1rem'}}>#{(user?.clientNo || '—').toString().padStart(6, '0')}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ClientProfile

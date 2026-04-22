import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, FileText, Package, Trash2, Save, AlertTriangle, CheckCircle, Megaphone, Headphones, X, AlertCircle } from 'lucide-react'
import { fetchAdminSettings, saveAdminSettings, invalidateSettingsCache } from '../hooks/useSettings'
import api from '../api/api'

const Section = ({ title, desc, children }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="card glass" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
    <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontFamily: 'Outfit', marginBottom: '0.25rem' }}>{title}</h2>
      {desc && <p style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))' }}>{desc}</p>}
    </div>
    {children}
  </motion.div>
)

const RadioCard = ({ value, selected, onChange, icon: Icon, color, title, desc }) => (
  <div onClick={() => onChange(value)} style={{
    cursor: 'pointer', padding: '1rem 1.25rem', borderRadius: '0.6rem',
    border: `1px solid ${selected ? color : 'rgba(255,255,255,0.08)'}`,
    background: selected ? `${color}12` : 'rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
    transition: 'all 0.15s', marginBottom: '0.75rem',
  }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}20`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
      <Icon size={18} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</p>
      <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{desc}</p>
    </div>
    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? color : 'rgba(255,255,255,0.2)'}`, background: selected ? color : 'transparent', flexShrink: 0, marginTop: '4px', transition: 'all 0.15s' }} />
  </div>
)

const CheckCard = ({ value, checked, onChange, icon: Icon, color, title, desc }) => (
  <div onClick={() => onChange(value)} style={{
    cursor: 'pointer', padding: '1rem 1.25rem', borderRadius: '0.6rem',
    border: `1px solid ${checked ? color : 'rgba(255,255,255,0.08)'}`,
    background: checked ? `${color}12` : 'rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
    transition: 'all 0.15s', marginBottom: '0.75rem',
  }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}20`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
      <Icon size={18} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</p>
      <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{desc}</p>
    </div>
    <div style={{
      width: 18, height: 18, borderRadius: '4px', border: `2px solid ${checked ? color : 'rgba(255,255,255,0.2)'}`,
      background: checked ? color : 'transparent', flexShrink: 0, marginTop: '4px', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {checked && <CheckCircle size={12} color="#fff" />}
    </div>
  </div>
)

const DangerModal = ({ action, onConfirm, onCancel, confirming }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="card glass-modal"
      style={{ maxWidth: 420, width: '90%', padding: '2rem', textAlign: 'center' }}>
      <Trash2 size={40} style={{ margin: '0 auto 1rem', color: '#ef4444' }} />
      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', fontFamily: 'Outfit' }}>Confirm Data Deletion</h3>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.88rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
        This will permanently delete all <strong style={{ color: '#ef4444' }}>{action.label}</strong> from the database.
        This action cannot be undone.
      </p>
      <p style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '1.5rem', fontWeight: 600 }}>⚠ All associated records will be wiped completely.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onCancel} disabled={confirming}>Cancel</button>
        <button onClick={onConfirm} disabled={confirming}
          style={{ padding: '0.5rem 1.5rem', borderRadius: '0.4rem', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600, cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.6 : 1 }}>
          {confirming ? 'Deleting…' : 'Delete All Data'}
        </button>
      </div>
    </motion.div>
  </motion.div>
)

const Toast = ({ message, type }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
    style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000,
      padding: '0.85rem 1.25rem', borderRadius: '0.6rem',
      background: type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${type === 'success' ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
      display: 'flex', alignItems: 'center', gap: '0.6rem', backdropFilter: 'blur(8px)',
      color: type === 'success' ? '#4ade80' : '#fca5a5', fontWeight: 600, fontSize: '0.875rem',
    }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {message}
  </motion.div>
)

const AdminSettings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { message, type }
  const [dangerAction, setDangerAction] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchAdminSettings()
      .then(s => setSettings(s))
      .catch(() => showToast('Failed to load settings.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const setField = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  // requestMode is stored as comma-separated string; parse to Set for checkbox logic
  const enabledModes = new Set((settings?.requestMode || 'AGENT').split(',').map(m => m.trim()))
  const toggleMode = (mode) => {
    const next = new Set(enabledModes)
    if (next.has(mode)) { if (next.size > 1) next.delete(mode) } // prevent deselecting all
    else next.add(mode)
    setField('requestMode', [...next].join(','))
  }


  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await saveAdminSettings({
        landingAgentMode: settings.landingAgentMode,
        businessContext:  settings.businessContext,
        requestMode:      settings.requestMode,
        catalogEnabled:   settings.catalogEnabled,
        agentName:        settings.agentName,
        agentPersona:     settings.agentPersona,
      })
      setSettings(updated)
      showToast('Settings saved successfully.')
    } catch { showToast('Failed to save settings.', 'error') }
    finally { setSaving(false) }
  }

  const handleNuke = async () => {
    if (!dangerAction) return
    setConfirming(true)
    try {
      await api.delete(dangerAction.endpoint)
      if (dangerAction.onConfirmExtra) dangerAction.onConfirmExtra()
      // Persist settings immediately after extra action (e.g. disabling catalog)
      if (dangerAction.onConfirmExtra) {
        await saveAdminSettings({
          landingAgentMode: settings.landingAgentMode,
          businessContext:  settings.businessContext,
          requestMode:      settings.requestMode,
          catalogEnabled:   false,
        })
      }
      invalidateSettingsCache()
      setDangerAction(null)
      showToast(`${dangerAction.label} deleted successfully.`)
    } catch { showToast(`Failed to delete ${dangerAction.label}.`, 'error') }
    finally { setConfirming(false) }
  }

  if (loading) return <p style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Loading settings…</p>
  if (!settings) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '2rem', maxWidth: 780, height: '100%', overflowY: 'auto' }}>

      <AnimatePresence>
        {dangerAction && <DangerModal action={dangerAction} onConfirm={handleNuke} onCancel={() => setDangerAction(null)} confirming={confirming} />}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontFamily: 'Outfit', marginBottom: '0.4rem' }}>Settings</h1>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Configure modules, agent behaviour, and request flow.</p>
      </header>

      {/* Landing Page Agent */}
      <Section title="Landing Page Agent" desc="Controls the floating chat widget visible to unauthenticated visitors on your public site.">
        <RadioCard value="OFF" selected={settings.landingAgentMode === 'OFF'} onChange={v => setField('landingAgentMode', v)}
          icon={X} color="#6b7280" title="Off" desc="Hide the chat widget entirely. Visitors will not see a chat button on the landing page." />
        <RadioCard value="ASSISTANT" selected={settings.landingAgentMode === 'ASSISTANT'} onChange={v => setField('landingAgentMode', v)}
          icon={Headphones} color="hsl(var(--primary))" title="Assistant Mode"
          desc="Intake assistant — asks structured questions, captures requirements, prompts visitors to sign up or log in." />
        <RadioCard value="MARKETER" selected={settings.landingAgentMode === 'MARKETER'} onChange={v => setField('landingAgentMode', v)}
          icon={Megaphone} color="#fb923c" title="Marketer Mode"
          desc="Pure marketing bot. Answers questions about your business. Never asks for personal details or redirects to login." />

        <AnimatePresence>
          {settings.landingAgentMode === 'MARKETER' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Business Context</label>
                <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                  Describe your business: services, USPs, pricing approach, FAQs, tone of voice. The agent answers visitor questions based on this.
                </p>
                <textarea value={settings.businessContext || ''} onChange={e => setField('businessContext', e.target.value)} rows={7}
                  placeholder="e.g. We are Matrix Solutions, an IT infrastructure company based in Mumbai. We specialise in datacenter modernization, cybersecurity, endpoint management, and digital signage..."
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.75rem', color: 'hsl(var(--foreground))', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* Client Request Mode — multi-select */}
      <Section title="Client Request Modes" desc="Select one or more ways logged-in clients can submit and discuss requests. At least one must remain enabled.">
        <CheckCard value="AGENT" checked={enabledModes.has('AGENT')} onChange={toggleMode}
          icon={Bot} color="hsl(var(--primary))" title="AI-Assisted (Agent)"
          desc="Clients chat with the AI intake agent to submit sales leads or support tickets. Agent captures structured requirements." />
        <CheckCard value="MANUAL_ONLY" checked={enabledModes.has('MANUAL_ONLY')} onChange={toggleMode}
          icon={FileText} color="#4ade80" title="Manual Form"
          desc="No chat. Clients fill out a structured form to submit their request." />
      </Section>

      {/* Agent Persona */}
      <Section title="Agent Customisation" desc="Personalise the intake agent for your business. These settings replace the default identity used in all agent conversations.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Agent Name
            </label>
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              The name the agent introduces itself as. Defaults to "Assistant".
            </p>
            <input
              value={settings.agentName || ''}
              onChange={e => setField('agentName', e.target.value)}
              placeholder="e.g. Aria, Zeta, Matrix Bot"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem', color: 'hsl(var(--foreground))', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Agent Persona / Business Context (Intake Agent)
            </label>
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              The <em>role description</em> only — <strong style={{ color: 'hsl(var(--foreground))' }}>do not include the agent name here</strong>.
              The system prompt is assembled as: <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: '0.78rem' }}>"You are [Name], [Persona]"</code>.
            </p>
            {(settings.agentName || settings.agentPersona) && (
              <p style={{ fontSize: '0.76rem', color: 'hsl(var(--primary))', marginBottom: '0.6rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                Preview: "You are <strong>{settings.agentName || 'Assistant'}</strong>, {settings.agentPersona || 'a friendly solutions advisor'}."
              </p>
            )}
            <textarea
              value={settings.agentPersona || ''}
              onChange={e => setField('agentPersona', e.target.value)}
              rows={4}
              placeholder="a friendly solutions advisor for [Your Company], specialising in..."
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.75rem', color: 'hsl(var(--foreground))', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </Section>

      {/* Catalog / Inventory toggle */}
      <Section title="Inventory & Catalog" desc="Enable a full inventory management system for managing parts, products, and stock levels.">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Package size={18} color={settings.catalogEnabled ? '#4ade80' : 'hsl(var(--muted-foreground))'} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Inventory Module</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Manage stock levels, part numbers, costs, categories, and reorder thresholds.</p>
          </div>
          <div onClick={() => { if (settings.catalogEnabled) setDangerAction({ label: 'all inventory data', endpoint: '/devices/all', onConfirmExtra: () => setField('catalogEnabled', false) }) ; else setField('catalogEnabled', true) }}
            style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', flexShrink: 0, background: settings.catalogEnabled ? '#4ade80' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 3, left: settings.catalogEnabled ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
          </div>
        </div>
        {settings.catalogEnabled && (
          <p style={{ fontSize: '0.75rem', color: '#fb923c', marginTop: '0.75rem' }}>⚠ Turning this off will permanently delete all inventory data.</p>
        )}
      </Section>

      {/* Save */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.75rem' }}>
          {saving ? 'Saving…' : <><Save size={15} /> Save Settings</>}
        </button>
      </div>

      {/* Danger Zone */}
      <Section title="Danger Zone" desc="Permanent data operations. These cannot be undone.">
        {[
          { label: 'all requests and messages', endpoint: '/requests/all', desc: 'Wipe every request and all associated chat messages from the database.' },
          { label: 'full transcript history', endpoint: '/requests/agent-history', desc: 'Delete all chat messages (from all parties) across every request, keeping the request records themselves intact.' },

        ].map(action => (
          <div key={action.endpoint} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '0.75rem' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fca5a5', marginBottom: '0.2rem', textTransform: 'capitalize' }}>{action.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{action.desc}</p>
            </div>
            <button onClick={() => setDangerAction(action)} disabled={confirming}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '0.4rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem' }}>
              <AlertTriangle size={13} /> Delete
            </button>
          </div>
        ))}
      </Section>

    </motion.div>
  )
}

export default AdminSettings

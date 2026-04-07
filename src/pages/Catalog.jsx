import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Save, X, Package } from 'lucide-react'
import {
  getAllDevices, createDevice, updateDevice, deleteDevice,
} from '../api/miscApi'
import './Catalog.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const ConfirmDelete = ({ label, onConfirm, onCancel }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }}>
    <motion.div className="card glass-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ maxWidth: 360, width: '90%', padding: '1.5rem', textAlign: 'center' }}>
      <Trash2 size={36} style={{ margin: '0 auto 1rem', color: '#f87171' }} />
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontFamily: 'Outfit' }}>Purge {label}?</h3>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        This action is irreversible. Item will be excised from the matrix catalog.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onCancel} style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>Abort</button>
        <button className="btn"
          style={{ background: 'hsl(0 70% 50%)', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
          onClick={onConfirm}>Purge</button>
      </div>
    </motion.div>
  </motion.div>
)

const PartsTab = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ partNo: '', partDescription: '', partWarrantyMonths: '', partCost: '', hsnNo: '' })

  useEffect(() => {
    getAllDevices()
      .then((d) => setDevices(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const resetForm = () => setForm({ partNo: '', partDescription: '', partWarrantyMonths: '', partCost: '', hsnNo: '' })

  const handleAdd = async () => {
    if (!form.partNo || !form.partDescription || !form.partCost) {
      setError('Part No, Description and Cost are required.'); return
    }
    setSaving(true); setError('')
    try {
      const created = await createDevice({
        partNo: form.partNo,
        partDescription: form.partDescription,
        partWarrantyMonths: form.partWarrantyMonths ? parseInt(form.partWarrantyMonths) : 0,
        partCost: parseFloat(form.partCost),
        hsnNo: form.hsnNo || null,
      })
      setDevices((prev) => [...prev, created])
      setShowAdd(false); resetForm()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleEditSave = async (partNo) => {
    setSaving(true); setError('')
    try {
      const updated = await updateDevice(partNo, {
        partNo,
        partDescription: form.partDescription,
        partWarrantyMonths: form.partWarrantyMonths ? parseInt(form.partWarrantyMonths) : 0,
        partCost: parseFloat(form.partCost),
        hsnNo: form.hsnNo || null,
      })
      setDevices((prev) => prev.map((d) => d.partNo === partNo ? updated : d))
      setEditing(null); resetForm()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const startEdit = (device) => {
    setEditing(device.partNo)
    setForm({
      partNo: device.partNo,
      partDescription: device.partDescription || '',
      partWarrantyMonths: String(device.partWarrantyMonths ?? ''),
      partCost: String(device.partCost ?? ''),
      hsnNo: device.hsnNo || '',
    })
  }

  const handleDelete = async (partNo) => {
    try {
      await deleteDevice(partNo)
      setDevices((prev) => prev.filter((d) => d.partNo !== partNo))
    } catch (e) { setError(e.message) }
    finally { setDeleting(null) }
  }

  return (
    <motion.div className="catalog-tab" variants={containerVariants} initial="hidden" animate="show">
      <AnimatePresence>
        {deleting && (
          <ConfirmDelete label={`Node ${deleting}`}
            onConfirm={() => handleDelete(deleting)}
            onCancel={() => setDeleting(null)} />
        )}
      </AnimatePresence>

      <div className="catalog-toolbar">
        <h3 className="text-gradient" style={{fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1rem'}}>
          Hardware Nodes ({devices.length})
        </h3>
        <button className="btn btn-primary" style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem'}} onClick={() => { setShowAdd(true); setEditing(null); resetForm() }}>
          <Plus size={16} style={{ marginRight: '0.3rem' }} /> Inject Node
        </button>
      </div>

      {error && <div className="catalog-error glass-error">{error}</div>}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div className="catalog-add-form card glass" style={{background: 'rgba(0,0,0,0.4)'}}>
              <h4 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Add New Device</h4>
              <div className="catalog-form-grid">
                <div className="input-group">
                  <label className="input-label">Component ID *</label>
                  <input className="input-field" placeholder="e.g. NTC-001"
                    value={form.partNo} onChange={(e) => setForm({ ...form, partNo: e.target.value })} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Description *</label>
                  <input className="input-field" placeholder="Full part description"
                    value={form.partDescription} onChange={(e) => setForm({ ...form, partDescription: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Value (₹) *</label>
                  <input className="input-field" type="text" inputMode="decimal" placeholder="0.00"
                    value={form.partCost} onChange={(e) => setForm({ ...form, partCost: e.target.value.replace(/[^0-9.]/g, '') })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Warranty (months)</label>
                  <input className="input-field" type="text" inputMode="numeric" placeholder="0"
                    value={form.partWarrantyMonths} onChange={(e) => setForm({ ...form, partWarrantyMonths: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
                <div className="input-group">
                  <label className="input-label">HSN No</label>
                  <input className="input-field" placeholder="85176990"
                    value={form.hsnNo} onChange={(e) => setForm({ ...form, hsnNo: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-ghost" onClick={() => { setShowAdd(false); resetForm() }} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem'}}>Abort</button>
                <button className="btn btn-primary" disabled={saving} onClick={handleAdd} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem'}}>
                  {saving ? 'Saving…' : 'Save Device'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="table-responsive glass card pt-0 px-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Component ID</th>
              <th>Description</th>
              <th>Value (₹)</th>
              <th>Warranty</th>
              <th>HSN</th>
              <th style={{ width: 100 }}>Controls</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--primary))', padding: '2rem', fontFamily: 'Outfit', letterSpacing: '0.1em' }}>ACCESSING MATRIX...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No hardware nodes active.</td></tr>
            ) : devices.map((d) => editing === d.partNo ? (
              <tr key={d.partNo} style={{ background: 'hsl(var(--primary)/0.15)' }}>
                <td className="font-mono text-gradient" style={{ fontSize: '0.8rem' }}>{d.partNo}</td>
                <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  value={form.partDescription} onChange={(e) => setForm({ ...form, partDescription: e.target.value })} /></td>
                <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 90 }}
                  inputMode="decimal" value={form.partCost} onChange={(e) => setForm({ ...form, partCost: e.target.value.replace(/[^0-9.]/g, '') })} /></td>
                <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 70 }}
                  inputMode="numeric" value={form.partWarrantyMonths} onChange={(e) => setForm({ ...form, partWarrantyMonths: e.target.value.replace(/[^0-9]/g, '') })} /></td>
                <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 90 }}
                  value={form.hsnNo} onChange={(e) => setForm({ ...form, hsnNo: e.target.value })} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="icon-btn glow-effect" style={{color: '#4ade80'}} title="Save" disabled={saving} onClick={() => handleEditSave(d.partNo)}><Save size={15} /></button>
                    <button className="icon-btn" title="Cancel" onClick={() => { setEditing(null); resetForm() }}><X size={15} /></button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={d.partNo}>
                <td className="font-mono text-gradient" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{d.partNo}</td>
                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>{d.partDescription}</td>
                <td style={{ fontWeight: 700 }}>₹{Number(d.partCost || 0).toLocaleString('en-IN')}</td>
                <td style={{ opacity: 0.7 }}>{d.partWarrantyMonths != null ? `${d.partWarrantyMonths} cyc` : '—'}</td>
                <td className="font-mono" style={{ opacity: 0.7 }}>{d.hsnNo || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="icon-btn" title="Edit" onClick={() => startEdit(d)}><Pencil size={14} /></button>
                    <button className="icon-btn" title="Delete" style={{ color: '#f87171' }} onClick={() => setDeleting(d.partNo)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  )
}


const Catalog = () => {

  return (
    <motion.div className="catalog-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>System Catalog</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>Manage hardware registry and intelligence network.</p>
        </div>
      </motion.header>

      <motion.div variants={itemVariants}>
        <PartsTab />
      </motion.div>
    </motion.div>
  )
}

export default Catalog

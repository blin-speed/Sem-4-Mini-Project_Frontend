import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Save, X, Package } from 'lucide-react'
import {
  getAllDevices, getAllCatalogItems, getCatalogItem,
  createCatalogItem, updateCatalogItem, deleteCatalogItem,
} from '../api/miscApi'
import './Catalog.css' // Reuse the same styling

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
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontFamily: 'Outfit' }}>Purge Catalog Entry?</h3>
      <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        This action is irreversible. Entry will be removed from the catalog.
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

const CatalogManagement = () => {
  const [catalogItems, setCatalogItems] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ partNo: '', catalogName: '', catalogDescription: '', stockQuantity: '' })

  useEffect(() => {
    Promise.all([getAllCatalogItems(), getAllDevices()])
      .then(([catalogData, deviceData]) => {
        setCatalogItems(Array.isArray(catalogData) ? catalogData : [])
        setDevices(Array.isArray(deviceData) ? deviceData : [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const resetForm = () => setForm({ partNo: '', catalogName: '', catalogDescription: '', stockQuantity: '' })

  const handleAdd = async () => {
    if (!form.partNo || !form.catalogName) {
      setError('Device and Catalog Name are required.'); return
    }
    setSaving(true); setError('')
    try {
      const created = await createCatalogItem({
        partNo: form.partNo,
        catalogName: form.catalogName,
        catalogDescription: form.catalogDescription || '',
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : 0,
      })
      setCatalogItems((prev) => [...prev, created])
      setShowAdd(false); resetForm()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleEditSave = async (catalogId) => {
    setSaving(true); setError('')
    try {
      const updated = await updateCatalogItem(catalogId, {
        catalogName: form.catalogName,
        catalogDescription: form.catalogDescription,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : 0,
      })
      setCatalogItems((prev) => prev.map((item) => item.catalogId === catalogId ? updated : item))
      setEditing(null); resetForm()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const startEdit = (item) => {
    setEditing(item.catalogId)
    setForm({
      partNo: item.device.partNo,
      catalogName: item.catalogName,
      catalogDescription: item.catalogDescription || '',
      stockQuantity: String(item.stockQuantity ?? ''),
    })
  }

  const handleDelete = async (catalogId) => {
    try {
      await deleteCatalogItem(catalogId)
      setCatalogItems((prev) => prev.filter((item) => item.catalogId !== catalogId))
    } catch (e) { setError(e.message) }
    finally { setDeleting(null) }
  }

  return (
    <motion.div className="catalog-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Catalog Management</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>Manage product catalog for order creation.</p>
        </div>
      </motion.header>

      <motion.div className="catalog-tab" variants={containerVariants} initial="hidden" animate="show">
        <AnimatePresence>
          {deleting && (
            <ConfirmDelete label={`Catalog Item`}
              onConfirm={() => handleDelete(deleting)}
              onCancel={() => setDeleting(null)} />
          )}
        </AnimatePresence>

        <div className="catalog-toolbar">
          <h3 className="text-gradient" style={{fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1rem'}}>
            Catalog Items ({catalogItems.length})
          </h3>
          <button className="btn btn-primary" style={{textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem'}} onClick={() => { setShowAdd(true); setEditing(null); resetForm() }}>
            <Plus size={16} style={{ marginRight: '0.3rem' }} /> Add Item
          </button>
        </div>

        {error && <div className="catalog-error glass-error">{error}</div>}

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div className="catalog-add-form card glass" style={{background: 'rgba(0,0,0,0.4)'}}>
                <h4 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Add Catalog Item</h4>
                <div className="catalog-form-grid">
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Select Device *</label>
                    <select className="input-field"
                      value={form.partNo} onChange={(e) => setForm({ ...form, partNo: e.target.value })}>
                      <option value="">Choose a device...</option>
                      {devices.map(d => (
                        <option key={d.partNo} value={d.partNo}>
                          {d.partNo} - {d.partDescription}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Catalog Name *</label>
                    <input className="input-field" placeholder="Display name for catalog"
                      value={form.catalogName} onChange={(e) => setForm({ ...form, catalogName: e.target.value })} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Description</label>
                    <textarea className="input-field" rows={2} placeholder="Additional details"
                      value={form.catalogDescription} onChange={(e) => setForm({ ...form, catalogDescription: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Stock Quantity</label>
                    <input className="input-field" type="text" inputMode="numeric" placeholder="0"
                      value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value.replace(/[^0-9]/g, '') })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-ghost" onClick={() => { setShowAdd(false); resetForm() }} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem'}}>Abort</button>
                  <button className="btn btn-primary" disabled={saving} onClick={handleAdd} style={{textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.7rem'}}>
                    {saving ? 'Saving…' : 'Save Item'}
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
                <th>Device Part</th>
                <th>Catalog Name</th>
                <th>Description</th>
                <th>Stock</th>
                <th>Unit Price (₹)</th>
                <th style={{ width: 100 }}>Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--primary))', padding: '2rem', fontFamily: 'Outfit', letterSpacing: '0.1em' }}>LOADING CATALOG...</td></tr>
              ) : catalogItems.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', padding: '2rem' }}>No catalog items. Create one to get started.</td></tr>
              ) : catalogItems.map((item) => editing === item.catalogId ? (
                <tr key={item.catalogId} style={{ background: 'hsl(var(--primary)/0.15)' }}>
                  <td className="font-mono text-gradient" style={{ fontSize: '0.8rem' }}>{item.device.partNo}</td>
                  <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    value={form.catalogName} onChange={(e) => setForm({ ...form, catalogName: e.target.value })} /></td>
                  <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    value={form.catalogDescription} onChange={(e) => setForm({ ...form, catalogDescription: e.target.value })} /></td>
                  <td><input className="input-field" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 70 }}
                    inputMode="numeric" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value.replace(/[^0-9]/g, '') })} /></td>
                  <td className="font-mono" style={{ fontSize: '0.85rem' }}>₹{Number(item.device.partCost || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="icon-btn glow-effect" style={{color: '#4ade80'}} title="Save" disabled={saving} onClick={() => handleEditSave(item.catalogId)}><Save size={15} /></button>
                      <button className="icon-btn" title="Cancel" onClick={() => { setEditing(null); resetForm() }}><X size={15} /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.catalogId}>
                  <td className="font-mono text-gradient" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.device.partNo}</td>
                  <td style={{ fontWeight: 600 }}>{item.catalogName}</td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.9 }}>{item.catalogDescription || '—'}</td>
                  <td style={{ opacity: 0.7, textAlign: 'center' }}>{item.stockQuantity || 0}</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>₹{Number(item.device.partCost || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="icon-btn" title="Edit" onClick={() => startEdit(item)}><Pencil size={14} /></button>
                      <button className="icon-btn" title="Delete" style={{ color: '#f87171' }} onClick={() => setDeleting(item.catalogId)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default CatalogManagement

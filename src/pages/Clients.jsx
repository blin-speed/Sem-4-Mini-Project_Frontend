import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Mail, Phone, MapPin, UserCheck, ChevronRight, Archive, Trash2 } from 'lucide-react'
import { getAllClients, archiveClient, deleteClient } from '../api/clientApi'
import './Clients.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const Clients = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllClients()
      .then((data) => { 
        const clientsArray = (Array.isArray(data) ? data : [])
          .filter(c => !c.email?.endsWith('@placeholder.invalid'))
          .filter(c => !c.email?.startsWith('chat-'))
          .filter(c => !c.email?.includes('temp@'))
          .filter(c => c.accountStatus?.toLowerCase() !== 'archived')
        setClients(clientsArray)
        setFiltered(clientsArray)
      })
      .catch((e) => {
        setError(e.message || 'Failed to load clients')
        setClients([])
        setFiltered([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(
      clients.filter(
        (c) =>
          c.clientId?.toLowerCase().includes(q) ||
          c.representativeName?.toLowerCase().includes(q) ||
          c.representativeEmail?.toLowerCase().includes(q) ||
          c.gstNo?.toLowerCase().includes(q)
      )
    )
  }, [query, clients])

  const handleArchive = async (clientNo) => {
    if (!window.confirm('Archive this client? They will be moved to the Data Bank.')) return
    try {
      await archiveClient(clientNo)
      setClients(clients.filter(c => c.clientNo !== clientNo))
      setFiltered(filtered.filter(c => c.clientNo !== clientNo))
    } catch (e) {
      alert('Failed to archive: ' + e.message)
    }
  }

  const handleDelete = async (clientNo) => {
    if (!window.confirm('CRITICAL WARNING: Delete this client? This will PERMANENTLY ERASE all of their Orders, Requests, and Messages. This action cannot be undone.')) return
    try {
      await deleteClient(clientNo)
      setClients(clients.filter(c => c.clientNo !== clientNo))
      setFiltered(filtered.filter(c => c.clientNo !== clientNo))
    } catch (e) {
      alert('Failed to delete: ' + e.message)
    }
  }

  return (
    <motion.div className="clients-page" variants={containerVariants} initial="hidden" animate="show">
      <motion.header variants={itemVariants} className="page-header">
        <div>
          <h1 className="text-gradient" style={{fontFamily: 'Outfit', letterSpacing: '0.05em'}}>Client Directory</h1>
          <p style={{color: 'hsl(var(--muted-foreground))'}}>Manage client identities and system access.</p>
        </div>
      </motion.header>

      <motion.div variants={itemVariants} className="filter-bar glass card">
        <div className="search-box">
          <Search size={18} className="search-icon" style={{color: 'hsl(var(--primary))'}} />
          <input
            type="text"
            placeholder="Search by identity, comm-link, or GST..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="card glass-error" style={{ marginBottom: '1rem' }}>
          {error}
        </motion.div>
      )}

      {loading ? (
        <p style={{ padding: '2rem', color: 'hsl(var(--primary))', textAlign: 'center', fontFamily: 'Outfit', letterSpacing: '0.1em' }}>DECRYPTING IDENTITIES...</p>
      ) : filtered.length === 0 ? (
        <p style={{ padding: '2rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>No operatives found in the matrix.</p>
      ) : (
        <motion.div className="clients-grid" variants={containerVariants}>
          {filtered.map((client) => (
            <motion.div variants={itemVariants} key={client.clientNo} className="card glass client-card" whileHover={{ scale: 1.02, y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div className="client-card-header">
                <div className={`client-tier ${client.accountStatus?.toLowerCase() === 'active' ? 'active-tier' : 'pending-tier'}`}>
                  <UserCheck size={14} />
                  {client.accountStatus || 'New'}
                </div>
                <button
                  className="archive-trigger-btn"
                  title="Archive Operative"
                  onClick={(e) => { e.stopPropagation(); handleArchive(client.clientNo) }}
                >
                  <Archive size={14} />
                </button>
                <button
                  className="archive-trigger-btn"
                  title="Delete Operative (Irreversible)"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', marginLeft: '0.25rem' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(client.clientNo) }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="client-info">
                <div className="client-avatar">
                  {(client.clientId || 'OP').substring(0, 2).toUpperCase()}
                </div>
                <h3 className="client-name text-gradient">{client.clientId}</h3>
                <p className="client-contact">{client.representativeName || '—'}</p>
              </div>

              <div className="client-details">
                {client.representativeEmail && (
                  <div className="detail-item">
                    <Mail size={14} className="detail-icon" />
                    <span>{client.representativeEmail}</span>
                  </div>
                )}
                {client.representativePhone && (
                  <div className="detail-item">
                    <Phone size={14} className="detail-icon" />
                    <span>{client.representativePhone}</span>
                  </div>
                )}
                {client.deliveryAddress && (
                  <div className="detail-item">
                    <MapPin size={14} className="detail-icon" />
                    <span>{client.deliveryAddress}</span>
                  </div>
                )}
                {client.gstNo && (
                  <div className="detail-item">
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--primary))', fontWeight: 800 }}>GST</span>
                    <span className="font-mono">{client.gstNo}</span>
                  </div>
                )}
              </div>

              <div className="client-footer">
                <div className="client-status">
                  <span className={`dot ${client.accountStatus?.toLowerCase() === 'active' ? 'active' : 'pending'}`} />
                  {client.accountStatus}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{fontSize: '0.75rem', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem'}}
                  onClick={() => navigate(`/admin/clients/${client.clientNo}`)}
                >
                  Inspect <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

export default Clients

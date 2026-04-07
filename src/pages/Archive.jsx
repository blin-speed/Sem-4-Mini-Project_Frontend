import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, History, Mail, Phone, MapPin, RotateCcw, Bot, User, ArrowLeft } from 'lucide-react'
import { getAllClients, unarchiveClient } from '../api/clientApi'
import { getAllRequests, getMessages, updateRequestStatus } from '../api/requestApi'
import './Archive.css'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const Archive = () => {
  const [view, setView] = useState(null) // null | 'clients' | 'requests'
  const [clients, setClients] = useState([])
  const [requests, setRequests] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [activeReq, setActiveReq] = useState(null)
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const [cData, rData] = await Promise.all([getAllClients(), getAllRequests()])
        const archivedClients = (Array.isArray(cData) ? cData : [])
          .filter(c => !c.email?.endsWith('@placeholder.invalid'))
          .filter(c => !c.email?.startsWith('chat-'))
          .filter(c => !c.email?.includes('temp@'))
          .filter(c => c.accountStatus === 'Archived')
        const archivedRequests = (Array.isArray(rData) ? rData : [])
          .filter(r => !r.client?.email?.endsWith('@placeholder.invalid'))
          .filter(r => !r.client?.email?.startsWith('chat-'))
          .filter(r => !r.client?.email?.includes('temp@'))
          .filter(r => r.status === 'Archived' || r.status === 'Closed' || r.status === 'Converted')
        setClients(archivedClients)
        setRequests(archivedRequests)
        setFilteredClients(archivedClients)
        setFilteredRequests(archivedRequests)
      } catch (e) { console.error('Failed to fetch archive:', e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    if (view === 'clients') {
      setFilteredClients(clients.filter(c => 
        c.clientId?.toLowerCase().includes(q) || 
        c.representativeName?.toLowerCase().includes(q) ||
        c.gstNo?.toLowerCase().includes(q)
      ))
    } else if (view === 'requests') {
      setFilteredRequests(requests.filter(r => 
        r.requestSubject?.toLowerCase().includes(q) || 
        r.requestId?.toLowerCase().includes(q) ||
        r.client?.clientId?.toLowerCase().includes(q)
      ))
    }
  }, [query, view, clients, requests])

  useEffect(() => {
    if (view === 'requests' && activeReq) {
      setLoadingMsgs(true)
      getMessages(activeReq.requestId)
        .then(data => setMessages(Array.isArray(data) ? data : []))
        .catch(() => setMessages([]))
        .finally(() => setLoadingMsgs(false))
    }
  }, [activeReq, view])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, view])

  const handleRestoreClient = async (clientNo) => {
    if (!window.confirm('Restore this client to active status?')) return
    try {
      await unarchiveClient(clientNo)
      const updated = clients.filter(c => c.clientNo !== clientNo)
      setClients(updated)
      setFilteredClients(updated)
    } catch (e) { alert('Restore failed: ' + e.message) }
  }

  const handleRestoreRequest = async (reqId) => {
    if (!window.confirm('Restore this request to active status?')) return
    try {
      await updateRequestStatus(reqId, 'Active')
      const updated = requests.filter(r => r.requestId !== reqId)
      setRequests(updated)
      setFilteredRequests(updated)
      setActiveReq(null)
    } catch (e) { alert('Restore failed: ' + e.message) }
  }

  // ── RENDER: SELECTION SPLASH ───────────────────────────────────────────
  if (view === null) {
    return (
      <motion.div className="archive-splash" variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants} className="splash-header">
          <h1 className="text-gradient">Records Archive</h1>
          <p>Access historical client data and request logs.</p>
        </motion.div>

        <div className="splash-grid">
          <motion.div variants={itemVariants} className="splash-card glass" whileHover={{ y: -8, scale: 1.02 }} onClick={() => setView('clients')}>
            <div className="splash-icon clients"><Users size={40} /></div>
            <h3>Archived Clients</h3>
            <p>Full contact information and historical records of inactive clients.</p>
            <div className="count-badge">{clients.length} Clients</div>
          </motion.div>

          <motion.div variants={itemVariants} className="splash-card glass" whileHover={{ y: -8, scale: 1.02 }} onClick={() => setView('requests')}>
            <div className="splash-icon requests"><History size={40} /></div>
            <h3>Archived Requests</h3>
            <p>Past requests, inquiries, and finalized conversation logs.</p>
            <div className="count-badge">{requests.length} Logs</div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="archive-portal-extended" variants={containerVariants} initial="hidden" animate="show">
      <header className="portal-sub-header glass">
        <button className="back-btn" onClick={() => setView(null)}>
          <ArrowLeft size={16} /> BACK TO MENU
        </button>
        <div className="portal-title-wrap">
          <h2 className="text-gradient">{view === 'clients' ? 'Archived Clients' : 'Archived Requests'}</h2>
        </div>
        <div className="search-box-mini">
          <Search size={14} />
          <input type="text" placeholder={`Search ${view}...`} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </header>

      <div className="portal-content">
        {loading ? (
          <p className="loading-msg">RETRIEVING RECORDS...</p>
        ) : view === 'clients' ? (
          <motion.div className="archived-clients-grid" variants={containerVariants}>
            {filteredClients.map(client => (
              <motion.div variants={itemVariants} key={client.clientNo} className="card glass client-card archive-fidelity">
                <div className="client-card-header">
                  <div className="client-tier archived-label">
                    ARCHIVED
                  </div>
                </div>

                <div className="client-info">
                  <div className="client-avatar">{client.clientId?.substring(0, 2).toUpperCase()}</div>
                  <h3 className="client-name text-gradient">{client.clientId}</h3>
                  <p className="client-contact">{client.representativeName || '—'}</p>
                </div>

                <div className="client-details">
                  <div className="detail-item"><Mail size={14} className="detail-icon" /> <span>{client.representativeEmail}</span></div>
                  <div className="detail-item"><Phone size={14} className="detail-icon" /> <span>{client.representativePhone}</span></div>
                  <div className="detail-item"><MapPin size={14} className="detail-icon" /> <span>{client.deliveryAddress || '—'}</span></div>
                  {client.gstNo && (
                    <div className="detail-item">
                      <span className="gst-label">GST</span>
                      <span className="font-mono">{client.gstNo}</span>
                    </div>
                  )}
                </div>

                <div className="restore-action-footer">
                  <button className="btn-restore-full" onClick={() => handleRestoreClient(client.clientNo)}>
                    <RotateCcw size={14} /> RESTORE TO ACTIVE
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="requests-archive-layout">
            <div className="archive-sidebar glass">
              <div className="archive-list">
                {filteredRequests.map(req => (
                  <motion.div key={req.requestId} variants={itemVariants} 
                    className={`archive-item glass-row ${activeReq?.requestId === req.requestId ? 'active' : ''}`} 
                    onClick={() => setActiveReq(req)}>
                    <div className="item-header-wrap">
                      <span className="item-id">{req.requestId.slice(-6)}</span>
                      <span className="item-date">{req.createdAt?.split('T')[0]}</span>
                    </div>
                    <h4 className="item-subject">{req.requestSubject}</h4>
                    <div className="item-footer">
                      <span>{req.client?.clientId || '—'}</span>
                      <span className={`status-pill ${req.status.toLowerCase()}`}>{req.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="archive-detail glass">
              {activeReq ? (
                <div className="chat-log">
                  <div className="chat-header-wrap">
                    <div>
                      <h3>{activeReq.requestSubject}</h3>
                      <p className="font-mono">{activeReq.requestId} | {activeReq.client?.clientId}</p>
                    </div>
                    <button className="btn-restore-full" onClick={() => handleRestoreRequest(activeReq.requestId)}>
                      <RotateCcw size={14} /> RESTORE REQUEST
                    </button>
                  </div>
                  <div className="chat-viewport">
                    {loadingMsgs ? <p className="loading-text">Loading message sequence...</p> : (
                      messages.map((msg, idx) => (
                        <div key={idx} className={`msg-wrap ${msg.dmSender === 'Agent' || msg.dmSender === 'Admin' ? 'me' : 'them'}`}>
                          <div className="msg-bubble glass-bubble">
                            <span className="sender">{msg.dmSender}</span>
                            <p>{msg.messageContent}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>
                </div>
              ) : (
                <div className="empty-prompt">
                  <History size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                  <h3>Archived Record</h3>
                  <p>Select a archived log to view the full message sequence.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Archive

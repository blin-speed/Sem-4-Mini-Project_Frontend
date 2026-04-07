import { Bell } from 'lucide-react'
import './Navbar.css'

const Navbar = ({ user }) => (
  <header className="navbar glass">
    <div className="navbar-left">
      <div className="navbar-brand">
        <span className="brand-main">MATRIX B2C</span>
        <span className="brand-admin">Portal</span>
      </div>
    </div>
    <div className="navbar-actions">
      <button className="icon-btn" title="Notifications (coming soon)"
        style={{ opacity: 0.35, cursor: 'default' }}>
        <Bell size={20} />
      </button>
    </div>
  </header>
)

export default Navbar

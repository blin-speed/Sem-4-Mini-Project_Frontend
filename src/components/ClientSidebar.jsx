import { NavLink } from 'react-router-dom'
import { MessageSquare, LogOut, ShoppingCart, User, LayoutDashboard } from 'lucide-react'
import './ClientSidebar.css'

const ClientSidebar = ({ user, onLogout }) => {
  const navItems = [
    { name: 'Dashboard',   path: '/client',          icon: <LayoutDashboard size={18} />, end: true  },
    { name: 'Orders',      path: '/client/orders',    icon: <ShoppingCart size={18} />,   end: false },
    { name: 'Requests',    path: '/client/requests-intro',  icon: <MessageSquare size={18} />,   end: false },
    { name: 'Profile',     path: '/client/profile',   icon: <User size={18} />,           end: false },
  ]

  return (
    <aside className="sidebar glass">
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            title={item.name}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="btn-logout" title="Log Out">
          <span className="nav-icon"><LogOut size={18} /></span>
          <span className="nav-label">Log Out</span>
        </button>
      </div>
    </aside>
  )
}

export default ClientSidebar

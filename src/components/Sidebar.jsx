import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, MessageSquare, Users, CreditCard, LogOut, Database, Settings, Package } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import './Sidebar.css'

const Sidebar = ({ user, onLogout }) => {
  const { settings } = useSettings()

  const navItems = [
    { name: 'Dashboard', path: '/admin',           icon: <LayoutDashboard size={18} />, end: true  },
    { name: 'Orders',    path: '/admin/orders',    icon: <ShoppingCart size={18} />,    end: false },
    { name: 'Requests',  path: '/admin/requests',  icon: <MessageSquare size={18} />,   end: false },
    { name: 'Clients',   path: '/admin/clients',   icon: <Users size={18} />,            end: false },
    ...(settings.catalogEnabled
      ? [{ name: 'Inventory', path: '/admin/inventory', icon: <Package size={18} />, end: false }]
      : []),
    { name: 'Payments',  path: '/admin/payments',  icon: <CreditCard size={18} />,       end: false },
    { name: 'Archive',   path: '/admin/archive',   icon: <Database size={18} />,         end: false },
    { name: 'Settings',  path: '/admin/settings',  icon: <Settings size={18} />,         end: false },
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

export default Sidebar

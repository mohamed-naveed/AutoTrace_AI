import { NavLink } from 'react-router-dom'
import './Navbar.css'

const navItems = [
    { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { to: '/estimate', icon: '✦', label: 'New Estimate' },
    { to: '/projects', icon: '◈', label: 'Projects' },
    { to: '/analytics', icon: '◉', label: 'Analytics' },
]

export default function Navbar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">AT</div>
                <div>
                    <div className="logo-name">AutoTrace</div>
                    <div className="logo-sub">🇮🇳 India · FTTP Platform</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-label">Main Menu</div>
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-status">
                    <span className="status-dot"></span>
                    <span>Backend Online</span>
                </div>
                <div className="sidebar-version">v1.0.0</div>
            </div>
        </aside>
    )
}

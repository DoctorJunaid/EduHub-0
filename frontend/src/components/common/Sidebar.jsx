import { Link, useLocation } from 'react-router-dom';
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';

const Sidebar = ({
  items = [],
  collapsed = false,
  onToggle,
  onSignOut,
  theme = 'light',
  onThemeToggle,
}) => {
  const location = useLocation();
  const isDark = theme === 'dark';

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">E</span>
        <span className="sidebar-label">EduHub</span>
      </div>

      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon && <span>{item.icon}</span>}
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-theme-toggle"
          onClick={onThemeToggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span className="sidebar-label">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <button
          type="button"
          className="sidebar-signout"
          onClick={onSignOut}
          disabled={!onSignOut}
          title={collapsed ? 'Sign out unavailable' : undefined}
        >
          <LogOut size={20} />
          <span className="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

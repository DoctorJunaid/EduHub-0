import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const Sidebar = ({ items = [], collapsed = false, onToggle, onSignOut,
  theme = 'light', onThemeToggle, user = { name: 'Admin User', initials: 'A' } }) => {
  const { pathname } = useLocation();
  const isDark = theme === 'dark';

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Sidebar">
      <div className="sidebar-brand-row">
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src={`${import.meta.env.BASE_URL}brand/eduhub-logo.png`} alt="EduHub" width={36} height={42} />
          <span className="sidebar-label">EduHub</span>
        </div>
        <button type="button" className="sidebar-toggle" onClick={onToggle}
          aria-expanded={!collapsed} aria-controls="sidebar-navigation"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav id="sidebar-navigation" className="sidebar-nav" aria-label="Main navigation">
        {items.map((item, index) => {
          const isActive = pathname === item.path ||
            (item.path === '/dashboard' && pathname === '/') ||
            (!item.exact && item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`));
          return (
            <Fragment key={item.path || item.label}>
              {item.group && item.group !== items[index - 1]?.group && (
                <div className="sidebar-section-heading">{item.group}</div>
              )}
              {!item.path ? <span className="sidebar-item" aria-disabled="true" title={`${item.label} is not available yet`}><span className="sidebar-item-icon" aria-hidden="true">{item.icon}</span><span className="sidebar-label">{item.label}</span></span> : <Link to={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined} aria-label={item.label}
                title={collapsed ? item.label : undefined}>
                {item.icon && <span className="sidebar-item-icon" aria-hidden="true">{item.icon}</span>}
                <span className="sidebar-label">{item.label}</span>
              </Link>}
            </Fragment>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-theme-toggle" onClick={onThemeToggle}
          role="switch" aria-checked={isDark} aria-label="Dark mode"
          title={collapsed ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : undefined}>
          <Moon size={20} aria-hidden="true" />
          <span className="sidebar-label">Dark Mode</span>
          <span className="sidebar-theme-switch" aria-hidden="true"><span /></span>
        </button>
        <div className="sidebar-profile" title={collapsed ? user.name : undefined} aria-label={user.name}>
          <span className="sidebar-profile-avatar">{user.initials}</span>
          <div className="sidebar-label sidebar-profile-copy">
            <span className="sidebar-profile-name">{user.name}</span>
            {(user.role === 'Institute Admin' || user.role === 'Student') && <span className="sidebar-profile-role">{user.email}</span>}
            {user.role && <span className="sidebar-profile-role">{user.role}</span>}
          </div>
        </div>
        <button type="button" className="sidebar-signout" onClick={onSignOut} disabled={!onSignOut}
          aria-label="Sign Out" title={!onSignOut ? 'Sign out unavailable' : 'Sign Out'}>
          <LogOut size={20} aria-hidden="true" /><span className="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;

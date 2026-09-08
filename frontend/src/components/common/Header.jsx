import { Search, ChevronDown, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ user }) => {
  const institute = user?.role === 'Institute Admin';
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to={institute ? '/institute-admin' : '/dashboard'}>{institute ? 'Dashboard' : 'Home'}</Link>
        {segments.filter((segment) => !institute || segment !== 'institute-admin').map((segment) => (
          <span key={segment} className="breadcrumb-current">
            / {segment.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </span>
        ))}
      </nav>

      <label className="search-box header-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input type="search" placeholder={institute ? 'Search anything...' : 'Search students, faculty, classes...'} />
      </label>

      {institute && <button type="button" disabled aria-label="Notifications unavailable" title="Notifications not implemented"><Bell size={22} /></button>}
      <button type="button" className="profile-button" aria-label="Open profile menu">
        <span className="profile-avatar">{user?.initials}</span>
        <span className="profile-name" title={user?.role}>{user?.name}{institute && <small className="block text-muted-foreground">{user.role}</small>}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </header>
  );
};

export default Header;

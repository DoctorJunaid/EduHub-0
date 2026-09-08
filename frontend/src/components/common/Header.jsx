import { Search, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ user }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/dashboard">Home</Link>
        {segments.map((segment) => (
          <span key={segment} className="breadcrumb-current">
            / {segment.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </span>
        ))}
      </nav>

      <label className="search-box header-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input type="search" placeholder="Search students, faculty, classes..." />
      </label>

      <button type="button" className="profile-button" aria-label="Open profile menu">
        <span className="profile-avatar">{user?.initials}</span>
        <span className="profile-name" title={user?.role}>{user?.name}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </header>
  );
};

export default Header;

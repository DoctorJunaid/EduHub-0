import { Search, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <span>Home</span>
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
        <span className="profile-avatar">A</span>
        <span className="profile-name">Admin User</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </header>
  );
};

export default Header;

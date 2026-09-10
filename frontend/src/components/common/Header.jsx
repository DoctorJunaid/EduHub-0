import { Search, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const Header = ({ user }) => {
  const institute = user?.role === "Institute Admin";
  const superAdmin = user?.role === "Super Admin";

  const homePath = institute
    ? "/institute-admin"
    : superAdmin
      ? "/super-admin"
      : "/dashboard";
  const displayHome = institute ? "Dashboard" : "Home";
  const searchPlaceholder = superAdmin
    ? "Search institutes, users, programs..."
    : institute
      ? "Search anything..."
      : "Search students, faculty, classes...";

  const handleSearch = (event) => {
    const query = event.target.value.trim();
    localStorage.setItem("eduHubSuperSearch", query);
    window.dispatchEvent(
      new CustomEvent("eduHubSuperSearch", {
        detail: { query },
      }),
    );
  };

  return (
    <header className="header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to={homePath}>{displayHome}</Link>
        <span className="breadcrumb-current"> / Dashboard</span>
      </nav>

      <label className="search-box header-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder={searchPlaceholder}
          defaultValue={localStorage.getItem("eduHubSuperSearch") || ""}
          onChange={handleSearch}
        />
      </label>

      <button
        type="button"
        className="profile-button"
        aria-label="Open profile menu"
      >
        <span className="profile-avatar">{user?.initials}</span>
        <span className="profile-name" title={user?.role}>
          {user?.name}
          {institute && (
            <small className="block text-muted-foreground">{user.role}</small>
          )}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </header>
  );
};

export default Header;

import { Search, ChevronDown, Bell } from "lucide-react";
import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Header = ({
  user,
  homePath,
  homeLabel,
  breadcrumbItems,
  onViewProfile,
  onSignOut,
  showProfile = false,
  searchPlaceholder = "Search students, faculty, classes...",
  handleSearch = () => {},
}) => {
  const focusProfile = useRef(false);
  const institute = user?.role === "Institute Admin";
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const student = user?.role === "Student";

  const profileButton = (
    <button
      type="button"
      className="profile-button"
      aria-label="Open profile menu"
    >
      <span className="profile-avatar">{user?.initials}</span>
      <span className="profile-name" title={user?.role}>
        {user?.name}
        {(institute || student) && (
          <small className="block text-muted-foreground">
            {user.roleLabel || user.role}
          </small>
        )}
      </span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );

  return (
    <header className="header">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to={homePath || (institute ? "/institute-admin" : "/dashboard")}>
          {homeLabel || (institute ? "Dashboard" : "Home")}
        </Link>
        {(
          breadcrumbItems ||
          segments.filter(
            (segment) => !institute || segment !== "institute-admin",
          )
        ).map((segment) => (
          <span key={segment} className="breadcrumb-current">
            /{" "}
            {segment
              .replace(/-/g, " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
          </span>
        ))}
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

      {(institute || student) && (
        <button
          type="button"
          disabled
          aria-label="Notifications unavailable"
          title="Notifications not implemented"
        >
          <Bell size={22} />
        </button>
      )}

      {showProfile && (
        onViewProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{profileButton}</DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="student-profile-menu"
              onCloseAutoFocus={(event) => {
                if (focusProfile.current) {
                  event.preventDefault();
                  focusProfile.current = false;
                  onViewProfile();
                }
              }}
            >
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  focusProfile.current = true;
                }}
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          profileButton
        )
      )}
    </header>
  );
};

export default Header;

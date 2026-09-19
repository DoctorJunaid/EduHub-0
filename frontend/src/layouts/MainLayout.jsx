import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { loggedOut, selectCurrentUser } from '../store/Slices/authSlice';
import { ROLE_LABELS } from '../auth/roles';
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { CAMPUS_ADMIN_NAV, getCampusAdminNav } from "../constants/navigation";
import { useInstitution } from "@/context/InstitutionContext";

const MainLayout = ({ navigation, className = '', profile: suppliedProfile, headerProps = {} }) => {
  const { isSchool } = useInstitution();
  const effectiveNavigation = navigation || getCampusAdminNav(isSchool);

  const dispatch = useDispatch(), navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const userName = user?.name || "Campus Admin";
  const userInitials = userName.trim().slice(0, 2).toUpperCase() || "CA";
  const userRole = user?.role ? (ROLE_LABELS[user.role] || user.role) : "Admin";
  const profile = suppliedProfile || {
    ...user,
    name: userName,
    initials: userInitials,
    role: userRole,
  };
  const signOut = () => { dispatch(loggedOut()); navigate('/login', { replace: true }); };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    window.matchMedia('(max-width: 768px)').matches
  );

  const isSuperAdmin = user?.role === 'super_admin';
  const isFlushPage = true; // Unified edge-to-edge flush layout for all campus admin tabs

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const collapseOnSmallScreen = (event) => {
      if (event.matches) setSidebarCollapsed(true);
    };
    media.addEventListener('change', collapseOnSmallScreen);
    return () => media.removeEventListener('change', collapseOnSmallScreen);
  }, []);

  return (
    <div className={`dashboard-shell ${className}`}>
      <Sidebar
        user={profile}
        onSignOut={signOut}
        items={effectiveNavigation}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
      />

      <div className="main-area">
        {!isSuperAdmin && (
          <Header user={profile} {...headerProps} onSignOut={headerProps.onViewProfile ? signOut : undefined} />
        )}
        <main className={`content-area ${isFlushPage ? 'content-area-flush' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { loggedOut, selectCurrentUser } from '../store/Slices/authSlice';
import { ROLE_LABELS } from '../auth/roles';
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { CAMPUS_ADMIN_NAV } from "../constants/navigation";

const MainLayout = ({ navigation = CAMPUS_ADMIN_NAV, className = '', profile: suppliedProfile, headerProps = {} }) => {
  const dispatch = useDispatch(), navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const profile = suppliedProfile || { ...user, initials: user.name.slice(0, 2).toUpperCase(), role: ROLE_LABELS[user.role] };
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
        items={navigation}
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

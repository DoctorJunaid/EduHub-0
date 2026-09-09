import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { loggedOut, selectCurrentUser } from '../store/Slices/authSlice';
import { ROLE_LABELS } from '../auth/roles';
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { CAMPUS_ADMIN_NAV } from "../constants/navigation";
import { useTheme } from "../hooks/useTheme";

const MainLayout = ({ navigation = CAMPUS_ADMIN_NAV, className = '', profile: suppliedProfile, headerProps = {} }) => {
  const dispatch = useDispatch(), navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const profile = suppliedProfile || { ...user, initials: user.name.slice(0, 2).toUpperCase(), role: ROLE_LABELS[user.role] };
  const signOut = () => { dispatch(loggedOut()); navigate('/login', { replace: true }); };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    window.matchMedia('(max-width: 768px)').matches
  );
  const { theme, toggleTheme } = useTheme();

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
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div className="main-area">
        <Header user={profile} {...headerProps} onSignOut={headerProps.onViewProfile ? signOut : undefined} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

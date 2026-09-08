import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { loggedOut, selectCurrentUser } from '../store/Slices/authSlice';
import { ROLE_LABELS } from '../auth/roles';
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { CAMPUS_ADMIN_NAV } from "../constants/navigation";
import { useTheme } from "../hooks/useTheme";

const MainLayout = () => {
  const dispatch = useDispatch(), navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const profile = { ...user, initials: user.name.slice(0, 2).toUpperCase(), role: ROLE_LABELS[user.role] };
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
    <div className="dashboard-shell">
      <Sidebar
        user={profile}
        onSignOut={() => { dispatch(loggedOut()); navigate('/login', { replace: true }); }}
        items={CAMPUS_ADMIN_NAV}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div className="main-area">
        <Header user={profile} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

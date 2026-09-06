import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Header from "../components/common/Header";
import { CAMPUS_ADMIN_NAV } from "../constants/navigation";
import { useTheme } from "../hooks/useTheme";

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-shell">
      <Sidebar
        items={CAMPUS_ADMIN_NAV}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      <div className="main-area">
        <Header />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

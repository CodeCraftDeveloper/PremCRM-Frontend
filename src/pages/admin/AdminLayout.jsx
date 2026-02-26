import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks";
import { Sidebar } from "../../components";
import { ADMIN_NAV_ITEMS } from "../../constants";

export default function AdminLayout() {
  const { isAdminAuthenticated, adminLogout } = useAuth();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="app-layout admin-layout">
      <Sidebar
        navItems={ADMIN_NAV_ITEMS}
        title="Admin Portal"
        subtitle="Prem Industries"
        onLogout={adminLogout}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

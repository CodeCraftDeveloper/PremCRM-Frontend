import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "../../components";
import { USER_NAV_ITEMS } from "../../constants";

export default function UserLayout() {
  const { isUserAuthenticated, userLogout, userName } = useAuth();

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        navItems={USER_NAV_ITEMS}
        title="Prem Industries"
        subtitle={userName || "User Portal"}
        onLogout={userLogout}
      />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

// Store
import { getMe } from "./store/slices/authSlice";

// Route Protection
import {
  ProtectedRoute,
  PublicRoute,
} from "./components/routes/ProtectedRoute";

// Layouts
import AdminLayout from "./components/layout/AdminLayout";
import MarketingLayout from "./components/layout/MarketingLayout";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";

// SuperAdmin Pages
import {
  SuperAdminDashboard,
  TenantsManagement,
  TenantDetail,
  AllUsersPage,
  PlatformActivity,
} from "./pages/superadmin";

// Auth Page
import LoginPage from "./pages/auth/LoginPage";
import MarketingManagerRegistrationPage from "./pages/auth/MarketingManagerRegistrationPage";
import CreateTenantPage from "./pages/auth/CreateTenantPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMarketingPerformance from "./pages/admin/AdminMarketingPerformance";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// Users Pages
import { UsersList, UserForm, MarketingManagerRegister } from "./pages/users";

// Events Pages
import { EventsList, EventForm } from "./pages/events";

// Clients Pages
import { ClientsList, ClientDetail, ClientForm } from "./pages/clients";

// Leads Pages
import { LeadsList, LeadDetail, LeadAnalytics, LeadForm } from "./pages/leads";

// Websites Pages
import { WebsitesList, WebsiteDetail, WebsiteForm } from "./pages/websites";

// Query Management
import { QueryManagement } from "./pages/queries";

// Marketing Pages
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import * as socketService from "./services/socket";

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check authentication on app load
  useEffect(() => {
    // Tokens are httpOnly cookies; try restoring session once on boot.
    dispatch(getMe());
  }, [dispatch]);

  // Apply theme globally using class-based dark mode.
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const shouldUseDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);
      root.classList.toggle("dark", shouldUseDark);
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => {
      mediaQuery.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  // Keep authenticated users connected via socket for live status updates.
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connectSocket();
    } else {
      socketService.disconnectSocket();
    }

    return () => {
      socketService.disconnectSocket();
    };
  }, [isAuthenticated]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #334155",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(2, 6, 23, 0.35)",
          },
          success: {
            style: {
              background: "#065f46",
              border: "1px solid #10b981",
            },
          },
          error: {
            style: {
              background: "#7f1d1d",
              border: "1px solid #ef4444",
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register-marketing-manager"
          element={
            <PublicRoute>
              <MarketingManagerRegistrationPage />
            </PublicRoute>
          }
        />
        <Route
          path="/create-tenant"
          element={
            <PublicRoute>
              <CreateTenantPage />
            </PublicRoute>
          }
        />

        {/* SuperAdmin Routes */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminDashboard />} />
          <Route path="tenants" element={<TenantsManagement />} />
          <Route path="tenants/:id" element={<TenantDetail />} />
          <Route path="users" element={<AllUsersPage />} />
          <Route path="activity" element={<PlatformActivity />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />

          {/* Marketing Team Performance */}
          <Route
            path="marketing/performance"
            element={<AdminMarketingPerformance />}
          />

          {/* Users Management */}
          <Route path="users" element={<UsersList />} />
          <Route path="users/new" element={<UserForm />} />
          <Route
            path="users/marketing/register"
            element={<MarketingManagerRegister />}
          />
          <Route path="users/:id/edit" element={<UserForm isEdit />} />

          {/* Events Management */}
          <Route path="events" element={<EventsList isAdmin />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/:id/edit" element={<EventForm isEdit />} />

          {/* Clients Management */}
          <Route path="clients" element={<ClientsList isAdmin />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id" element={<ClientDetail isAdmin />} />
          <Route path="clients/:id/edit" element={<ClientForm isEdit />} />

          {/* Leads Management */}
          <Route path="leads" element={<LeadsList isAdmin />} />
          <Route path="leads/new" element={<LeadForm />} />
          <Route path="leads/analytics" element={<LeadAnalytics isAdmin />} />
          <Route path="leads/:id" element={<LeadDetail isAdmin />} />

          {/* Websites Management */}
          <Route path="websites" element={<WebsitesList />} />
          <Route path="websites/new" element={<WebsiteForm />} />
          <Route path="websites/:id" element={<WebsiteDetail />} />
          <Route path="websites/:id/edit" element={<WebsiteForm isEdit />} />

          {/* Query Management — Centralised queries from all sources */}
          <Route path="queries" element={<QueryManagement isAdmin />} />
          <Route
            path="queries/:websiteId"
            element={<QueryManagement isAdmin />}
          />

          {/* Reports & Settings */}
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Marketing Routes */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute allowedRoles={["marketing"]}>
              <MarketingLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MarketingDashboard />} />

          {/* Events (View Only) */}
          <Route path="events" element={<EventsList isAdmin={false} />} />

          {/* Clients Management */}
          <Route path="clients" element={<ClientsList isAdmin={false} />} />
          <Route path="clients/new" element={<ClientForm isAdmin={false} />} />
          <Route
            path="clients/:id"
            element={<ClientDetail isAdmin={false} />}
          />
          <Route
            path="clients/:id/edit"
            element={<ClientForm isAdmin={false} isEdit />}
          />

          {/* Leads Management (Marketing View) */}
          <Route path="leads" element={<LeadsList isAdmin={false} />} />
          <Route
            path="leads/analytics"
            element={<LeadAnalytics isAdmin={false} />}
          />
          <Route path="leads/:id" element={<LeadDetail isAdmin={false} />} />

          {/* Query Management */}
          <Route path="queries" element={<QueryManagement isAdmin={false} />} />
          <Route
            path="queries/:websiteId"
            element={<QueryManagement isAdmin={false} />}
          />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;

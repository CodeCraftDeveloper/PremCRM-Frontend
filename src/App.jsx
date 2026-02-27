import { Suspense, lazy, useEffect, useRef } from "react";
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

// Layouts (eagerly loaded — needed immediately after auth)
import AdminLayout from "./components/layout/AdminLayout";
import MarketingLayout from "./components/layout/MarketingLayout";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";

// Auth Pages (eagerly loaded — first paint)
import LoginPage from "./pages/auth/LoginPage";
import MarketingManagerRegistrationPage from "./pages/auth/MarketingManagerRegistrationPage";
import CreateTenantPage from "./pages/auth/CreateTenantPage";

// =====================
// Lazy-loaded page chunks (code-split per route)
// =====================

// SuperAdmin pages
const SuperAdminDashboard = lazy(() =>
  import("./pages/superadmin").then((m) => ({
    default: m.SuperAdminDashboard,
  })),
);
const TenantsManagement = lazy(() =>
  import("./pages/superadmin").then((m) => ({ default: m.TenantsManagement })),
);
const TenantDetail = lazy(() =>
  import("./pages/superadmin").then((m) => ({ default: m.TenantDetail })),
);
const AllUsersPage = lazy(() =>
  import("./pages/superadmin").then((m) => ({ default: m.AllUsersPage })),
);
const PlatformActivity = lazy(() =>
  import("./pages/superadmin").then((m) => ({ default: m.PlatformActivity })),
);

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMarketingPerformance = lazy(
  () => import("./pages/admin/AdminMarketingPerformance"),
);
const Settings = lazy(() => import("./pages/admin/Settings"));
const LazyReports = lazy(() => import("./pages/admin/Reports"));

// Users pages
const UsersList = lazy(() =>
  import("./pages/users").then((m) => ({ default: m.UsersList })),
);
const UserForm = lazy(() =>
  import("./pages/users").then((m) => ({ default: m.UserForm })),
);
const MarketingManagerRegister = lazy(() =>
  import("./pages/users").then((m) => ({
    default: m.MarketingManagerRegister,
  })),
);

// Events pages
const EventsList = lazy(() =>
  import("./pages/events").then((m) => ({ default: m.EventsList })),
);
const EventForm = lazy(() =>
  import("./pages/events").then((m) => ({ default: m.EventForm })),
);

// Clients pages
const ClientsList = lazy(() =>
  import("./pages/clients").then((m) => ({ default: m.ClientsList })),
);
const ClientDetail = lazy(() =>
  import("./pages/clients").then((m) => ({ default: m.ClientDetail })),
);
const ClientForm = lazy(() =>
  import("./pages/clients").then((m) => ({ default: m.ClientForm })),
);

// Leads pages
const LeadsList = lazy(() =>
  import("./pages/leads").then((m) => ({ default: m.LeadsList })),
);
const LeadDetail = lazy(() =>
  import("./pages/leads").then((m) => ({ default: m.LeadDetail })),
);
const LeadAnalytics = lazy(() =>
  import("./pages/leads").then((m) => ({ default: m.LeadAnalytics })),
);
const LeadForm = lazy(() =>
  import("./pages/leads").then((m) => ({ default: m.LeadForm })),
);

// Websites pages
const WebsitesList = lazy(() =>
  import("./pages/websites").then((m) => ({ default: m.WebsitesList })),
);
const WebsiteDetail = lazy(() =>
  import("./pages/websites").then((m) => ({ default: m.WebsiteDetail })),
);
const WebsiteForm = lazy(() =>
  import("./pages/websites").then((m) => ({ default: m.WebsiteForm })),
);

// Query Management
const QueryManagement = lazy(() =>
  import("./pages/queries").then((m) => ({ default: m.QueryManagement })),
);

// Tickets pages
const TicketsList = lazy(() =>
  import("./pages/tickets").then((m) => ({ default: m.TicketsList })),
);
const TicketDetail = lazy(() =>
  import("./pages/tickets").then((m) => ({ default: m.TicketDetail })),
);
const TicketForm = lazy(() =>
  import("./pages/tickets").then((m) => ({ default: m.TicketForm })),
);

// Marketing pages
const MarketingDashboard = lazy(
  () => import("./pages/marketing/MarketingDashboard"),
);
import * as socketService from "./services/socket";
import ConnectionBanner from "./components/ui/ConnectionBanner";

// CRM pages
const AdminCrmDashboard = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.AdminCrmDashboard })),
);
const CrmDetailPage = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.CrmDetailPage })),
);
const CrmModulePage = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.CrmModulePage })),
);
const CustomFieldsManager = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.CustomFieldsManager })),
);
const FormBuilderPage = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.FormBuilderPage })),
);
const LayoutBuilderPage = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.LayoutBuilderPage })),
);
const MarketingCrmDashboard = lazy(() =>
  import("./pages/crm").then((m) => ({ default: m.MarketingCrmDashboard })),
);
const PublicFormPreviewPage = lazy(
  () => import("./pages/crm/PublicFormPreviewPage"),
);

const DealsKanbanPage = lazy(() => import("./pages/crm/DealsKanbanPage"));
const AutomationBuilderPage = lazy(
  () => import("./pages/crm/AutomationBuilderPage"),
);
const BlueprintEditorPage = lazy(
  () => import("./pages/crm/BlueprintEditorPage"),
);
const PipelineManagerPage = lazy(
  () => import("./pages/crm/PipelineManagerPage"),
);

// Reusable Suspense wrapper for lazy-loaded pages — declared outside render
// to avoid recreating on every render cycle (react-hooks/static-components).
const Lazy = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-500" />
      </div>
    }
  >
    {children}
  </Suspense>
);

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const bootstrappedRef = useRef(false);

  // Check authentication on app load
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
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
      {isAuthenticated && <ConnectionBanner />}
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
          <Route
            index
            element={
              <Lazy>
                <SuperAdminDashboard />
              </Lazy>
            }
          />
          <Route
            path="tenants"
            element={
              <Lazy>
                <TenantsManagement />
              </Lazy>
            }
          />
          <Route
            path="tenants/:id"
            element={
              <Lazy>
                <TenantDetail />
              </Lazy>
            }
          />
          <Route
            path="users"
            element={
              <Lazy>
                <AllUsersPage />
              </Lazy>
            }
          />
          <Route
            path="activity"
            element={
              <Lazy>
                <PlatformActivity />
              </Lazy>
            }
          />
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
          <Route
            index
            element={
              <Lazy>
                <AdminDashboard />
              </Lazy>
            }
          />

          {/* Marketing Team Performance */}
          <Route
            path="marketing/performance"
            element={
              <Lazy>
                <AdminMarketingPerformance />
              </Lazy>
            }
          />

          {/* Users Management */}
          <Route
            path="users"
            element={
              <Lazy>
                <UsersList />
              </Lazy>
            }
          />
          <Route
            path="users/new"
            element={
              <Lazy>
                <UserForm />
              </Lazy>
            }
          />
          <Route
            path="users/marketing/register"
            element={
              <Lazy>
                <MarketingManagerRegister />
              </Lazy>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <Lazy>
                <UserForm isEdit />
              </Lazy>
            }
          />

          {/* Events Management */}
          <Route
            path="events"
            element={
              <Lazy>
                <EventsList isAdmin />
              </Lazy>
            }
          />
          <Route
            path="events/new"
            element={
              <Lazy>
                <EventForm />
              </Lazy>
            }
          />
          <Route
            path="events/:id/edit"
            element={
              <Lazy>
                <EventForm isEdit />
              </Lazy>
            }
          />

          {/* Clients Management */}
          <Route
            path="clients"
            element={
              <Lazy>
                <ClientsList isAdmin />
              </Lazy>
            }
          />
          <Route
            path="clients/new"
            element={
              <Lazy>
                <ClientForm />
              </Lazy>
            }
          />
          <Route
            path="clients/:id"
            element={
              <Lazy>
                <ClientDetail isAdmin />
              </Lazy>
            }
          />
          <Route
            path="clients/:id/edit"
            element={
              <Lazy>
                <ClientForm isEdit />
              </Lazy>
            }
          />

          {/* Leads Management */}
          <Route
            path="leads"
            element={
              <Lazy>
                <LeadsList isAdmin />
              </Lazy>
            }
          />
          <Route
            path="leads/new"
            element={
              <Lazy>
                <LeadForm />
              </Lazy>
            }
          />
          <Route
            path="leads/analytics"
            element={
              <Lazy>
                <LeadAnalytics isAdmin />
              </Lazy>
            }
          />
          <Route
            path="leads/:id"
            element={
              <Lazy>
                <LeadDetail isAdmin />
              </Lazy>
            }
          />

          {/* Websites Management */}
          <Route
            path="websites"
            element={
              <Lazy>
                <WebsitesList />
              </Lazy>
            }
          />
          <Route
            path="websites/new"
            element={
              <Lazy>
                <WebsiteForm />
              </Lazy>
            }
          />
          <Route
            path="websites/:id"
            element={
              <Lazy>
                <WebsiteDetail />
              </Lazy>
            }
          />
          <Route
            path="websites/:id/edit"
            element={
              <Lazy>
                <WebsiteForm isEdit />
              </Lazy>
            }
          />

          {/* Tickets Management */}
          <Route
            path="tickets"
            element={
              <Lazy>
                <TicketsList isAdmin />
              </Lazy>
            }
          />
          <Route
            path="tickets/new"
            element={
              <Lazy>
                <TicketForm isAdmin />
              </Lazy>
            }
          />
          <Route
            path="tickets/:id"
            element={
              <Lazy>
                <TicketDetail isAdmin />
              </Lazy>
            }
          />
          <Route
            path="tickets/:id/edit"
            element={
              <Lazy>
                <TicketForm isEdit isAdmin />
              </Lazy>
            }
          />

          {/* Query Management — Centralised queries from all sources */}
          <Route
            path="queries"
            element={
              <Lazy>
                <QueryManagement isAdmin />
              </Lazy>
            }
          />
          <Route
            path="queries/:websiteId"
            element={
              <Lazy>
                <QueryManagement isAdmin />
              </Lazy>
            }
          />

          {/* CRM Product Layer */}
          <Route
            path="crm/dashboard"
            element={
              <Lazy>
                <AdminCrmDashboard />
              </Lazy>
            }
          />
          <Route
            path="crm/:module"
            element={
              <Lazy>
                <CrmModulePage />
              </Lazy>
            }
          />
          <Route
            path="crm/:module/:id"
            element={
              <Lazy>
                <CrmDetailPage />
              </Lazy>
            }
          />
          <Route
            path="crm/deals/kanban"
            element={
              <Lazy>
                <DealsKanbanPage />
              </Lazy>
            }
          />
          <Route
            path="crm/pipelines"
            element={
              <Lazy>
                <PipelineManagerPage />
              </Lazy>
            }
          />
          <Route
            path="crm/automation"
            element={
              <Lazy>
                <AutomationBuilderPage />
              </Lazy>
            }
          />
          <Route
            path="crm/blueprints"
            element={
              <Lazy>
                <BlueprintEditorPage />
              </Lazy>
            }
          />
          <Route
            path="crm/custom-fields"
            element={
              <Lazy>
                <CustomFieldsManager />
              </Lazy>
            }
          />
          <Route
            path="crm/layout-builder"
            element={
              <Lazy>
                <LayoutBuilderPage />
              </Lazy>
            }
          />
          <Route
            path="crm/form-builder"
            element={
              <Lazy>
                <FormBuilderPage />
              </Lazy>
            }
          />

          {/* Reports & Settings */}
          <Route
            path="reports"
            element={
              <Lazy>
                <LazyReports />
              </Lazy>
            }
          />
          <Route
            path="settings"
            element={
              <Lazy>
                <Settings />
              </Lazy>
            }
          />
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
          <Route
            index
            element={
              <Lazy>
                <MarketingDashboard />
              </Lazy>
            }
          />

          {/* Events (View Only) */}
          <Route
            path="events"
            element={
              <Lazy>
                <EventsList isAdmin={false} />
              </Lazy>
            }
          />

          {/* Clients Management */}
          <Route
            path="clients"
            element={
              <Lazy>
                <ClientsList isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="clients/new"
            element={
              <Lazy>
                <ClientForm isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="clients/:id"
            element={
              <Lazy>
                <ClientDetail isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="clients/:id/edit"
            element={
              <Lazy>
                <ClientForm isAdmin={false} isEdit />
              </Lazy>
            }
          />

          {/* Leads Management (Marketing View) */}
          <Route
            path="leads"
            element={
              <Lazy>
                <LeadsList isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="leads/:id"
            element={
              <Lazy>
                <LeadDetail isAdmin={false} />
              </Lazy>
            }
          />

          {/* Tickets Management (Marketing View) */}
          <Route
            path="tickets"
            element={
              <Lazy>
                <TicketsList isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="tickets/new"
            element={
              <Lazy>
                <TicketForm isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="tickets/:id"
            element={
              <Lazy>
                <TicketDetail isAdmin={false} />
              </Lazy>
            }
          />

          {/* Query Management */}
          <Route
            path="queries"
            element={
              <Lazy>
                <QueryManagement isAdmin={false} />
              </Lazy>
            }
          />
          <Route
            path="queries/:websiteId"
            element={
              <Lazy>
                <QueryManagement isAdmin={false} />
              </Lazy>
            }
          />

          {/* CRM Product Layer */}
          <Route
            path="crm/dashboard"
            element={
              <Lazy>
                <MarketingCrmDashboard />
              </Lazy>
            }
          />
          <Route
            path="crm/:module"
            element={
              <Lazy>
                <CrmModulePage />
              </Lazy>
            }
          />
          <Route
            path="crm/:module/:id"
            element={
              <Lazy>
                <CrmDetailPage />
              </Lazy>
            }
          />
          <Route
            path="crm/deals/kanban"
            element={
              <Lazy>
                <DealsKanbanPage />
              </Lazy>
            }
          />

          {/* Settings */}
          <Route
            path="settings"
            element={
              <Lazy>
                <Settings />
              </Lazy>
            }
          />
        </Route>

        {/* Default Redirects */}
        <Route
          path="/forms/:tenantSlug/:apiName"
          element={
            <Lazy>
              <PublicFormPreviewPage />
            </Lazy>
          }
        />
        <Route
          path="/404"
          element={<div className="p-8 text-center">404 - Page not found</div>}
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;

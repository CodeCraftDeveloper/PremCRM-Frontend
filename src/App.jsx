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

// Auth Page
import LoginPage from "./pages/auth/LoginPage";
import MarketingManagerRegistrationPage from "./pages/auth/MarketingManagerRegistrationPage";

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

// Marketing Pages
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import { connectSocket, disconnectSocket } from "./services/socket";

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check authentication on app load
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      dispatch(getMe());
    }
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
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
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

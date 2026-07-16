import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import authReducer from "../store/slices/authSlice";
import { ProtectedRoute, PublicRoute } from "../components/routes/ProtectedRoute";

function makeStore(preloadedAuth) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: preloadedAuth },
  });
}

function FromStateDisplay() {
  const location = useLocation();
  return (
    <div data-testid="from-state">
      {JSON.stringify(location.state?.from ?? null)}
    </div>
  );
}

function renderWithRouteTree(ui, { store, route = "/", entryRoutes } = {}) {
  const routes = entryRoutes || (
    <>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/admin" element={<div>Admin Dashboard</div>} />
      <Route path="/superadmin" element={<div>Super Admin Dashboard</div>} />
      <Route path="/marketing" element={<div>Marketing Dashboard</div>} />
      <Route path="/dashboard/settings" element={<div>Dashboard Settings</div>} />
      <Route path="*" element={ui} />
    </>
  );
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>{routes}</Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("renders loading spinner while not initialized", () => {
    const store = makeStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
    renderWithRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      { store },
    );
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated after initialization", () => {
    const store = makeStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    renderWithRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      { store, route: "/dashboard" },
    );
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("preserves state.from when redirecting unauthenticated users", () => {
    const store = makeStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/dashboard/settings"]}>
          <Routes>
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <div>Secret</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<FromStateDisplay />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    const fromState = screen.getByTestId("from-state").textContent;
    const parsed = JSON.parse(fromState);
    expect(parsed.pathname).toBe("/dashboard/settings");
  });

  it("renders children when authenticated and initialized", () => {
    const store = makeStore({
      user: { id: "1", name: "Alice", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    renderWithRouteTree(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
      { store },
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });

  it("redirects when user role is not in allowedRoles", () => {
    const store = makeStore({
      user: { id: "1", name: "Alice", role: "marketing" },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    renderWithRouteTree(
      <ProtectedRoute allowedRoles={["admin"]}>
        <div>Admin Only</div>
      </ProtectedRoute>,
      { store, route: "/admin/settings" },
    );
    expect(screen.queryByText("Admin Only")).not.toBeInTheDocument();
    expect(screen.getByText("Marketing Dashboard")).toBeInTheDocument();
  });
});

describe("PublicRoute", () => {
  it("renders loading spinner while not initialized", () => {
    const store = makeStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
    renderWithRouteTree(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { store },
    );
    expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders children when not authenticated", () => {
    const store = makeStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    renderWithRouteTree(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { store },
    );
    expect(screen.getByText("Public Content")).toBeInTheDocument();
  });

  it("redirects authenticated admin user to /admin", () => {
    const store = makeStore({
      user: { id: "1", name: "Alice", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    renderWithRouteTree(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { store, route: "/login" },
    );
    expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("redirects authenticated superadmin user to /superadmin", () => {
    const store = makeStore({
      user: { id: "1", name: "Bob", role: "superadmin" },
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    renderWithRouteTree(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>,
      { store, route: "/login" },
    );
    expect(screen.queryByText("Public Content")).not.toBeInTheDocument();
    expect(screen.getByText("Super Admin Dashboard")).toBeInTheDocument();
  });
});

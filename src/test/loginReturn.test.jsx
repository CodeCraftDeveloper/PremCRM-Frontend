import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import authReducer from "../store/slices/authSlice";
import LoginPage from "../pages/auth/LoginPage";

vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import apiClient from "../services/api";

function makeStore(preloadedAuth) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: preloadedAuth },
  });
}

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </div>
  );
}

function renderLogin({ store, route = "/login", initialEntries } = {}) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries || [route]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
          <Route path="/superadmin" element={<div>Super Admin Dashboard</div>} />
          <Route path="/marketing" element={<div>Marketing Dashboard</div>} />
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("LoginPage safe return-after-login", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = makeStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  });

  it("returns to valid internal state.from after login", async () => {
    const user = { id: "1", name: "Alice", role: "admin" };
    apiClient.post.mockResolvedValueOnce({
      data: { data: { user, accessToken: "tok", refreshToken: "ref" } },
    });

    const from = { pathname: "/dashboard/settings", search: "?tab=profile" };
    renderLogin({
      store,
      initialEntries: [
        { pathname: "/login", state: { from } },
      ],
    });

    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "alice@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("********"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const loc = screen.getByTestId("location");
      expect(loc.textContent).toBe("/dashboard/settings?tab=profile");
    });
  });

  it("falls back to role dashboard when state.from is missing", async () => {
    const user = { id: "2", name: "Bob", role: "admin" };
    apiClient.post.mockResolvedValueOnce({
      data: { data: { user, accessToken: "tok", refreshToken: "ref" } },
    });

    renderLogin({ store });

    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "bob@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("********"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });

  it("falls back to role dashboard when state.from is protocol-relative", async () => {
    const user = { id: "3", name: "Carol", role: "superadmin" };
    apiClient.post.mockResolvedValueOnce({
      data: { data: { user, accessToken: "tok", refreshToken: "ref" } },
    });

    const from = { pathname: "//evil.com/path" };
    renderLogin({
      store,
      initialEntries: [
        { pathname: "/login", state: { from } },
      ],
    });

    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "carol@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("********"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Super Admin Dashboard")).toBeInTheDocument();
    });
  });

  it("falls back to role dashboard when state.from contains colon (protocol)", async () => {
    const user = { id: "4", name: "Dave", role: "marketing" };
    apiClient.post.mockResolvedValueOnce({
      data: { data: { user, accessToken: "tok", refreshToken: "ref" } },
    });

    const from = { pathname: "/foo:bar/baz" };
    renderLogin({
      store,
      initialEntries: [
        { pathname: "/login", state: { from } },
      ],
    });

    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "dave@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("********"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Marketing Dashboard")).toBeInTheDocument();
    });
  });

  it("returns to state.from with hash", async () => {
    const user = { id: "5", name: "Eve", role: "admin" };
    apiClient.post.mockResolvedValueOnce({
      data: { data: { user, accessToken: "tok", refreshToken: "ref" } },
    });

    const from = { pathname: "/dashboard/settings", hash: "#section2" };
    renderLogin({
      store,
      initialEntries: [
        { pathname: "/login", state: { from } },
      ],
    });

    await userEvent.type(
      screen.getByPlaceholderText("you@example.com"),
      "eve@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("********"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const loc = screen.getByTestId("location");
      expect(loc.textContent).toBe("/dashboard/settings#section2");
    });
  });
});

import axios from "axios";
import toast from "react-hot-toast";
import store from "../store";
import { setUser } from "../store/slices/authSlice";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Still send cookies when possible (same-origin)
});

// ── Token store (persisted in localStorage to survive page reloads) ──
const TOKEN_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

let _accessToken = null;
let _refreshToken = null;

// Hydrate from localStorage on module load
try {
  _accessToken = localStorage.getItem(TOKEN_KEY);
  _refreshToken = localStorage.getItem(REFRESH_KEY);
} catch {
  // Private browsing or localStorage blocked
}

export const setTokens = (access, refresh) => {
  _accessToken = access || null;
  _refreshToken = refresh || null;
  try {
    if (_accessToken) localStorage.setItem(TOKEN_KEY, _accessToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (_refreshToken) localStorage.setItem(REFRESH_KEY, _refreshToken);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Ignore storage errors
  }
};
export const getAccessToken = () => _accessToken;
export const buildApiUrl = (path = "") => {
  const basePath = api.defaults.baseURL || "/api/v1";
  const normalizedBase = basePath.startsWith("http")
    ? basePath
    : `${window.location.origin}${basePath.startsWith("/") ? "" : "/"}${basePath}`;

  return new URL(
    path.replace(/^\//, ""),
    `${normalizedBase.replace(/\/+$/, "")}/`,
  ).toString();
};
export const clearTokens = () => {
  _accessToken = null;
  _refreshToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Ignore storage errors
  }
};

// Queue to handle multiple 401 responses simultaneously
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - add Bearer token, CSRF token, and request ID
api.interceptors.request.use(
  (config) => {
    // Let browser set multipart boundaries for FormData uploads.
    if (config.data instanceof FormData) {
      if (config.headers?.["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
      if (config.headers?.common?.["Content-Type"]) {
        delete config.headers.common["Content-Type"];
      }
    }

    // Add request ID for tracking
    config.headers["X-Request-ID"] =
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Attach Bearer token from memory (primary auth for cross-origin)
    if (_accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }

    // Read CSRF token from cookie (double-submit cookie pattern)
    const csrfToken =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf-token="))
        ?.split("=")[1] ||
      document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/refresh-token");

    // ── Extract backend structured error fields ──────────────
    const status = error.response?.status;
    const body = error.response?.data || {};
    const message = body.message || error.message || "Something went wrong";
    const requestId = body.requestId;

    // Log requestId in development for traceability
    if (import.meta.env.DEV && requestId) {
      console.warn(`[API ${status}] requestId=${requestId}  ${message}`);
    }

    // ── 401 — Attempt silent token refresh ───────────────────
    if (status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send refresh token in body for cross-origin scenarios
        const res = await api.post("/auth/refresh-token", {
          refreshToken: _refreshToken || undefined,
        });
        const data = res.data?.data || {};
        if (data.accessToken) {
          setTokens(data.accessToken, data.refreshToken || _refreshToken);
        }
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        store.dispatch(setUser(null));
        toast.error("Session expired. Please log in again.");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 — Forbidden (RBAC) ───────────────────────────────
    // Suppress duplicate toast for auth endpoints – the 401 handler already
    // shows "Session expired" when refresh fails.
    if (status === 403 && !isAuthEndpoint) {
      toast.error(
        message || "You don't have permission to perform this action.",
      );
    }

    // ── 429 — Rate limited ───────────────────────────────────
    if (status === 429) {
      toast.error(message || "Too many requests. Please slow down.", {
        id: "rate-limit-error",
      });
    }

    // ── 5xx — Server error ───────────────────────────────────
    if (status >= 500) {
      toast.error("Server error — please try again later.");
    }

    return Promise.reject(error);
  },
);

export default api;

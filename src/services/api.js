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
  withCredentials: true, // Enable sending httpOnly cookies
});

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

// Request interceptor - add CSRF token and request ID
api.interceptors.request.use(
  (config) => {
    // Add request ID for tracking
    config.headers["X-Request-ID"] =
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
        await api.post("/auth/refresh-token");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(setUser(null));
        toast.error("Session expired. Please log in again.");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 — Forbidden (RBAC) ───────────────────────────────
    if (status === 403) {
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

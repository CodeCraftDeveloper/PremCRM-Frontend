import axios from "axios";
import store from "../store";
import { setUser } from "../store/slices/authSlice";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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

    // Get CSRF token from meta tag if available
    const csrfToken = document.querySelector(
      'meta[name="csrf-token"]',
    )?.content;
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

    // If 401 Unauthorized (token expired)
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Queue this request to retry after token refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token - tokens are in httpOnly cookies, browser sends automatically
        await api.post("/auth/refresh-token");

        // New tokens are in httpOnly cookies (browser automatically handles)
        processQueue(null);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear local auth state and go to login
        processQueue(refreshError, null);
        store.dispatch(setUser(null));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // If 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden - insufficient permissions");
    }

    // If 429 Too Many Requests
    if (error.response?.status === 429) {
      console.error("Rate limited - too many requests");
    }

    // If 5xx Server Error
    if (error.response?.status >= 500) {
      console.error("Server error - please try again later");
    }

    return Promise.reject(error);
  },
);

export default api;

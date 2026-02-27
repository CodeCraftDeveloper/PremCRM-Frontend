import { io } from "socket.io-client";

let socket = null;
const TAB_SESSION_KEY = "crm_tab_session_id";

/* ── Connection-status subscribers ─────────────────────────── */
const statusListeners = new Set();
let currentStatus = "disconnected"; // "connected" | "disconnected" | "reconnecting"

const setStatus = (next) => {
  if (next === currentStatus) return;
  currentStatus = next;
  statusListeners.forEach((fn) => fn(next));
};

/** Subscribe to connection-status changes. Returns unsubscribe fn. */
export const onStatusChange = (fn) => {
  statusListeners.add(fn);
  fn(currentStatus); // fire immediately with current value
  return () => statusListeners.delete(fn);
};

export const getStatus = () => currentStatus;

/* ── Helpers ───────────────────────────────────────────────── */
const getSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  return apiUrl.replace(/\/api(\/v\d+)?\/?$/, "");
};

const getOrCreateTabSessionId = () => {
  if (typeof window === "undefined") return null;

  const existing = window.sessionStorage.getItem(TAB_SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(TAB_SESSION_KEY, generated);
  return generated;
};

/* ── Wire up global socket-level event handlers (once) ────── */
const attachGlobalHandlers = (s) => {
  s.on("connect", () => {
    setStatus("connected");
    if (import.meta.env.DEV) console.info("[socket] connected", s.id);
  });

  s.on("disconnect", (reason) => {
    setStatus("disconnected");
    if (import.meta.env.DEV) console.warn("[socket] disconnected —", reason);
  });

  s.io.on("reconnect_attempt", (attempt) => {
    setStatus("reconnecting");
    if (import.meta.env.DEV)
      console.info("[socket] reconnect attempt", attempt);
  });

  s.io.on("reconnect", () => {
    setStatus("connected");
    if (import.meta.env.DEV) console.info("[socket] reconnected");
  });

  s.io.on("reconnect_failed", () => {
    setStatus("disconnected");
    if (import.meta.env.DEV)
      console.error("[socket] reconnection failed after max attempts");
  });

  s.on("connect_error", (err) => {
    // Prevent unhandled errors from crashing the app
    if (import.meta.env.DEV)
      console.warn("[socket] connect_error —", err.message);
  });
};

/* ── Public API ────────────────────────────────────────────── */
export const connectSocket = (token) => {
  const sessionId = getOrCreateTabSessionId();

  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      autoConnect: false,
      transports: ["websocket", "polling"], // allow polling fallback
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });
    attachGlobalHandlers(socket);
  }

  socket.auth = token ? { token, sessionId } : { sessionId };
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

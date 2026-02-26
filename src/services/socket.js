import { io } from "socket.io-client";

let socket = null;
const TAB_SESSION_KEY = "crm_tab_session_id";

const getSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const getOrCreateTabSessionId = () => {
  if (typeof window === "undefined") return null;

  const existing = window.sessionStorage.getItem(TAB_SESSION_KEY);
  if (existing) return existing;

  const generated =
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  window.sessionStorage.setItem(TAB_SESSION_KEY, generated);
  return generated;
};

export const connectSocket = (token) => {
  const sessionId = getOrCreateTabSessionId();

  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      autoConnect: false,
      transports: ["websocket"],
      withCredentials: true,
    });
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

import { useSocketStatus } from "../../hooks";

/**
 * Thin banner that slides in when the socket is reconnecting or disconnected.
 * Renders nothing when connected.
 */
const ConnectionBanner = () => {
  const status = useSocketStatus();

  if (status === "connected") return null;

  const isReconnecting = status === "reconnecting";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 right-0 left-0 z-[9999] px-4 py-2 text-center text-sm font-medium text-white transition-all ${
        isReconnecting ? "bg-yellow-500/90" : "bg-red-500/90"
      }`}
    >
      {isReconnecting
        ? "Reconnecting to server…"
        : "Connection lost. Waiting for network…"}
    </div>
  );
};

export default ConnectionBanner;

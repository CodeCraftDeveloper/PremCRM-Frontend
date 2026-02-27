import { useState, useEffect } from "react";
import { onStatusChange } from "../services/socket";

/**
 * Returns the live socket connection status.
 * @returns {"connected" | "disconnected" | "reconnecting"} status
 */
export const useSocketStatus = () => {
  const [status, setStatus] = useState("disconnected");

  useEffect(() => {
    const unsubscribe = onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  return status;
};

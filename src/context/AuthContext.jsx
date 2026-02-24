/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Token-based Authentication State
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(false);

  // Login
  const login = (authToken, userData) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    setIsLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

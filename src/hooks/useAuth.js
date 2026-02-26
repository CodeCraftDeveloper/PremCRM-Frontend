import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  login,
  logout,
  getMe,
  changePassword,
  clearError,
  setUser,
} from "../store/slices/authSlice";
import apiClient from "../services/api";

/**
 * Custom hook for authentication (Redux-based)
 * Replaces AuthContext - no localStorage, httpOnly cookies handled by browser
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout, loading, error } = useAuth();
 */
export const useAuth = () => {
  const dispatch = useDispatch();

  // Get auth state from Redux
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state) =>
      state.auth || {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
  );

  /**
   * Login handler
   * Tokens are stored in httpOnly cookies (browser handles)
   */
  const handleLogin = useCallback(
    async (email, password) => {
      try {
        // Redux thunk handles the login
        const result = await dispatch(login({ email, password }));

        if (login.fulfilled.match(result)) {
          return { success: true, user: result.payload.user };
        } else {
          return { success: false, error: result.payload };
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [dispatch],
  );

  /**
   * Logout handler
   * Clears Redux state, cookies handled by backend
   */
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout());
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [dispatch]);

  /**
   * Get current user profile
   */
  const handleGetMe = useCallback(async () => {
    try {
      const result = await dispatch(getMe());

      if (getMe.fulfilled.match(result)) {
        return { success: true, user: result.payload };
      } else {
        return { success: false, error: result.payload };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [dispatch]);

  /**
   * Change password
   */
  const handleChangePassword = useCallback(
    async (currentPassword, newPassword, confirmPassword = newPassword) => {
      try {
        const result = await dispatch(
          changePassword({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        );

        if (changePassword.fulfilled.match(result)) {
          // Password changed, clear Redux state for re-login
          await dispatch(logout());
          return { success: true };
        } else {
          return { success: false, error: result.payload };
        }
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [dispatch],
  );

  /**
   * Accept invite and create account
   * Auto-logs in user after account creation
   */
  const handleAcceptInvite = useCallback(
    async (token, password, userName) => {
      try {
        const response = await apiClient.post(`/auth/invites/${token}/accept`, {
          password,
          userName,
        });

        const { user } = response.data.data;

        // Dispatch setUser to update Redux state
        dispatch(setUser(user));

        return { success: true, user };
      } catch (err) {
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    },
    [dispatch],
  );

  /**
   * Request password reset
   */
  const handleForgotPassword = useCallback(async (email) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email,
      });

      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }, []);

  /**
   * Reset password with token
   */
  const handleResetPassword = useCallback(async (token, password) => {
    try {
      const response = await apiClient.post(`/auth/reset-password/${token}`, {
        password,
      });

      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }, []);

  /**
   * Create invite (Admin only)
   */
  const handleCreateInvite = useCallback(async (email, role) => {
    try {
      const response = await apiClient.post("/auth/invites", {
        email,
        role,
      });

      return { success: true, invite: response.data.data.invite };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }, []);

  /**
   * Refresh access token
   */
  const handleRefreshToken = useCallback(async () => {
    try {
      const response = await apiClient.post("/auth/refresh-token");

      return { success: true, message: response.data.message };
    } catch (err) {
      // If refresh fails, logout user
      dispatch(logout());
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }, [dispatch]);

  /**
   * Clear error messages
   */
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    login: handleLogin,
    logout: handleLogout,
    getMe: handleGetMe,
    changePassword: handleChangePassword,
    acceptInvite: handleAcceptInvite,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    createInvite: handleCreateInvite,
    refreshToken: handleRefreshToken,
    clearError: handleClearError,

    // Shortcuts for role checking
    isAdmin: user?.role === "admin" || user?.role === "superadmin",
    isSuperAdmin: user?.role === "superadmin",
    isMarketing: user?.role === "marketing",
    isUser: user?.role === "user",
  };
};

export default useAuth;

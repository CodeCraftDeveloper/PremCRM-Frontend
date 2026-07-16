import { describe, it, expect } from "vitest";
import authReducer, {
  setUser,
  clearError,
} from "../store/slices/authSlice";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

describe("authSlice reducer", () => {
  it("returns the initial state", () => {
    expect(authReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  describe("getMe.fulfilled settles initialization", () => {
    it("sets user, isAuthenticated and isInitialized on fulfilled", () => {
      const user = { id: "1", name: "Alice", role: "admin" };
      const action = {
        type: "auth/getMe/fulfilled",
        payload: user,
      };
      const state = authReducer(initialState, action);

      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe("getMe.rejected settles initialization", () => {
    it("clears user, sets isAuthenticated false and isInitialized true on rejected", () => {
      const loadingState = { ...initialState, isLoading: true };
      const action = {
        type: "auth/getMe/rejected",
        payload: "Unauthorized",
      };
      const state = authReducer(loadingState, action);

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(state.error).toBe("Unauthorized");
    });
  });

  describe("setUser", () => {
    it("setUser(user) sets user, isAuthenticated and isInitialized", () => {
      const user = { id: "2", name: "Bob", role: "marketing" };
      const state = authReducer(initialState, setUser(user));

      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });

    it("setUser(null) clears user, sets isAuthenticated false and isInitialized true", () => {
      const authedState = {
        ...initialState,
        user: { id: "2", name: "Bob", role: "marketing" },
        isAuthenticated: true,
      };
      const state = authReducer(authedState, setUser(null));

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe("login.fulfilled settles initialization", () => {
    it("sets authenticated state on login fulfilled", () => {
      const user = { id: "3", name: "Carol", role: "superadmin" };
      const action = {
        type: "auth/login/fulfilled",
        payload: { user },
      };
      const state = authReducer(initialState, action);

      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("logout.fulfilled settles initialization", () => {
    it("clears user and sets isInitialized true on logout", () => {
      const authedState = {
        ...initialState,
        user: { id: "3", name: "Carol", role: "superadmin" },
        isAuthenticated: true,
      };
      const action = { type: "auth/logout/fulfilled" };
      const state = authReducer(authedState, action);

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe("clearError", () => {
    it("clears the error field", () => {
      const errorState = { ...initialState, error: "some error" };
      const state = authReducer(errorState, clearError());
      expect(state.error).toBeNull();
    });
  });
});

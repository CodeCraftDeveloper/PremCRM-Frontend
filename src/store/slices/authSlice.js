import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services";

// Get user from localStorage
const user = JSON.parse(localStorage.getItem("user"));
const accessToken = localStorage.getItem("accessToken");

const initialState = {
  user: user || null,
  isAuthenticated: !!accessToken,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      const { user, accessToken, refreshToken } = response.data;

      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with logout even if API fails
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getMe();
      const user = response.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get user",
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(data);
      const user = response.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile",
      );
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      await authService.changePassword(data);
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Get Me
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardService } from "../../services";

const initialState = {
  adminStats: null,
  marketingStats: null,
  analytics: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getAdmin();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin dashboard",
      );
    }
  },
);

export const fetchMarketingDashboard = createAsyncThunk(
  "dashboard/fetchMarketing",
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getMarketing();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch marketing dashboard",
      );
    }
  },
);

export const fetchAnalytics = createAsyncThunk(
  "dashboard/fetchAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      const response = await dashboardService.getAnalytics(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics",
      );
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.adminStats = null;
      state.marketingStats = null;
      state.analytics = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Dashboard
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminStats = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Marketing Dashboard
      .addCase(fetchMarketingDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketingDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.marketingStats = action.payload;
      })
      .addCase(fetchMarketingDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

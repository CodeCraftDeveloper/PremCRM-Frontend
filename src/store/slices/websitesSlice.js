import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { websitesService } from "../../services";

const unwrapApiData = (response) => response?.data ?? response ?? null;
const toArray = (value) => (Array.isArray(value) ? value : []);

const initialState = {
  websites: [],
  selectedWebsite: null,
  websiteStats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    category: "",
    isActive: "",
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchWebsites = createAsyncThunk(
  "websites/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await websitesService.getAll(params);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch websites",
      );
    }
  },
);

export const fetchWebsite = createAsyncThunk(
  "websites/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await websitesService.getOne(id);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch website",
      );
    }
  },
);

export const createWebsite = createAsyncThunk(
  "websites/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await websitesService.create(data);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create website",
      );
    }
  },
);

export const updateWebsite = createAsyncThunk(
  "websites/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await websitesService.update(id, data);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update website",
      );
    }
  },
);

export const regenerateApiKey = createAsyncThunk(
  "websites/regenerateApiKey",
  async (id, { rejectWithValue }) => {
    try {
      const response = await websitesService.regenerateApiKey(id);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to regenerate API key",
      );
    }
  },
);

export const fetchWebsiteStats = createAsyncThunk(
  "websites/fetchStats",
  async (id, { rejectWithValue }) => {
    try {
      const response = await websitesService.getStats(id);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch website stats",
      );
    }
  },
);

export const testWebsiteConnection = createAsyncThunk(
  "websites/testConnection",
  async (id, { rejectWithValue }) => {
    try {
      const response = await websitesService.testConnection(id);
      return unwrapApiData(response);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to test connection",
      );
    }
  },
);

export const deleteWebsite = createAsyncThunk(
  "websites/delete",
  async (id, { rejectWithValue }) => {
    try {
      await websitesService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete website",
      );
    }
  },
);

const websitesSlice = createSlice({
  name: "websites",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedWebsite: (state) => {
      state.selectedWebsite = null;
      state.websiteStats = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setFilters: (state, action) => {
      if (Object.prototype.hasOwnProperty.call(action.payload, "page")) {
        state.pagination.page = action.payload.page;
        return;
      }
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Websites
      .addCase(fetchWebsites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWebsites.fulfilled, (state, action) => {
        state.isLoading = false;
        const websites = toArray(action.payload?.websites);
        state.websites = websites;
        state.pagination = {
          page: action.payload?.pagination?.page || 1,
          limit: action.payload?.pagination?.limit || 10,
          total:
            action.payload?.pagination?.totalDocs ||
            action.payload?.pagination?.total ||
            0,
          totalPages:
            action.payload?.pagination?.totalPages ||
            action.payload?.pagination?.pages ||
            0,
        };
      })
      .addCase(fetchWebsites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Website
      .addCase(fetchWebsite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedWebsite = action.payload;
      })
      .addCase(fetchWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Website
      .addCase(createWebsite.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?._id) {
          state.websites.unshift(action.payload);
          state.pagination.total += 1;
        }
      })
      .addCase(createWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Website
      .addCase(updateWebsite.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.websites.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (index !== -1) state.websites[index] = action.payload;
        if (state.selectedWebsite?._id === action.payload._id) {
          state.selectedWebsite = action.payload;
        }
      })
      .addCase(updateWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Regenerate API Key
      .addCase(regenerateApiKey.fulfilled, (state, action) => {
        if (state.selectedWebsite?._id === action.payload?.website?._id) {
          state.selectedWebsite = action.payload.website;
        }
        const index = state.websites.findIndex(
          (w) => w._id === action.payload?.website?._id,
        );
        if (index !== -1 && action.payload?.website) {
          state.websites[index] = action.payload.website;
        }
      })
      // Fetch Website Stats
      .addCase(fetchWebsiteStats.fulfilled, (state, action) => {
        state.websiteStats = action.payload;
      })
      // Test Connection
      .addCase(testWebsiteConnection.fulfilled, () => {
        // Toast handles success feedback
      })
      // Delete Website
      .addCase(deleteWebsite.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteWebsite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.websites = state.websites.filter((w) => w._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteWebsite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSelectedWebsite,
  setPage,
  setFilters,
  clearFilters,
} = websitesSlice.actions;
export default websitesSlice.reducer;

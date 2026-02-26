import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchPlatformDashboard = createAsyncThunk(
  "superAdmin/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/superadmin/dashboard");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load dashboard",
      );
    }
  },
);

export const fetchAllTenants = createAsyncThunk(
  "superAdmin/fetchAllTenants",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/superadmin/tenants", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load tenants",
      );
    }
  },
);

export const fetchTenantDetail = createAsyncThunk(
  "superAdmin/fetchTenantDetail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/superadmin/tenants/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load tenant",
      );
    }
  },
);

export const createTenant = createAsyncThunk(
  "superAdmin/createTenant",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/superadmin/tenants", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create tenant",
      );
    }
  },
);

export const updateTenant = createAsyncThunk(
  "superAdmin/updateTenant",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/superadmin/tenants/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update tenant",
      );
    }
  },
);

export const deleteTenant = createAsyncThunk(
  "superAdmin/deleteTenant",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/superadmin/tenants/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to deactivate tenant",
      );
    }
  },
);

export const fetchAllUsers = createAsyncThunk(
  "superAdmin/fetchAllUsers",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/superadmin/users", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load users",
      );
    }
  },
);

export const toggleUserActive = createAsyncThunk(
  "superAdmin/toggleUserActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/superadmin/users/${id}/toggle-active`);
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to toggle user",
      );
    }
  },
);

export const changeUserRole = createAsyncThunk(
  "superAdmin/changeUserRole",
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/superadmin/users/${id}/role`, { role });
      return res.data.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to change role",
      );
    }
  },
);

export const fetchPlatformActivity = createAsyncThunk(
  "superAdmin/fetchPlatformActivity",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/superadmin/activity", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load activity",
      );
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  dashboard: null,
  tenants: [],
  tenantsPagination: null,
  tenantDetail: null,
  users: [],
  usersPagination: null,
  activity: [],
  activityPagination: null,
  isLoading: false,
  error: null,
};

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTenantDetail: (state) => {
      state.tenantDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchPlatformDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlatformDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchPlatformDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Tenants list
      .addCase(fetchAllTenants.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllTenants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenants = action.payload.tenants;
        state.tenantsPagination = action.payload.pagination;
      })
      .addCase(fetchAllTenants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Tenant detail
      .addCase(fetchTenantDetail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTenantDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tenantDetail = action.payload;
      })
      .addCase(fetchTenantDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create tenant
      .addCase(createTenant.fulfilled, (state, action) => {
        state.tenants.unshift(action.payload.tenant);
      })

      // Update tenant
      .addCase(updateTenant.fulfilled, (state, action) => {
        const updated = action.payload.tenant;
        state.tenants = state.tenants.map((t) =>
          t._id === updated._id ? { ...t, ...updated } : t,
        );
        if (state.tenantDetail?.tenant?._id === updated._id) {
          state.tenantDetail.tenant = {
            ...state.tenantDetail.tenant,
            ...updated,
          };
        }
      })

      // Delete (deactivate) tenant
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.tenants = state.tenants.map((t) =>
          t._id === action.payload ? { ...t, isActive: false } : t,
        );
      })

      // Users list
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.usersPagination = action.payload.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Toggle user active
      .addCase(toggleUserActive.fulfilled, (state, action) => {
        const user = action.payload;
        state.users = state.users.map((u) =>
          u._id === user._id ? { ...u, isActive: user.isActive } : u,
        );
      })

      // Change role
      .addCase(changeUserRole.fulfilled, (state, action) => {
        const user = action.payload;
        state.users = state.users.map((u) =>
          u._id === user._id ? { ...u, role: user.role } : u,
        );
      })

      // Activity
      .addCase(fetchPlatformActivity.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlatformActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activity = action.payload.logs;
        state.activityPagination = action.payload.pagination;
      })
      .addCase(fetchPlatformActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearTenantDetail } = superAdminSlice.actions;
export default superAdminSlice.reducer;

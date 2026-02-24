import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { clientsService, remarksService } from "../../services";

const initialState = {
  clients: [],
  selectedClient: null,
  clientStats: null,
  pendingFollowUps: [],
  remarks: [],
  timeline: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    event: "",
    marketingPerson: "",
    followUpStatus: "",
    priority: "",
  },
  isLoading: false,
  isRemarksLoading: false,
  error: null,
};

// Async thunks
export const fetchClients = createAsyncThunk(
  "clients/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await clientsService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch clients",
      );
    }
  },
);

export const fetchClient = createAsyncThunk(
  "clients/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await clientsService.getOne(id);
      return response.data.client;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch client",
      );
    }
  },
);

export const fetchClientStats = createAsyncThunk(
  "clients/fetchStats",
  async (params, { rejectWithValue }) => {
    try {
      const response = await clientsService.getStats(params);
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch client stats",
      );
    }
  },
);

export const fetchPendingFollowUps = createAsyncThunk(
  "clients/fetchPendingFollowUps",
  async (days = 7, { rejectWithValue }) => {
    try {
      const response = await clientsService.getPendingFollowUps(days);
      return response.data.clients;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending follow-ups",
      );
    }
  },
);

export const createClient = createAsyncThunk(
  "clients/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await clientsService.create(data);
      return response.data.client;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create client",
      );
    }
  },
);

export const updateClient = createAsyncThunk(
  "clients/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await clientsService.update(id, data);
      return response.data.client;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update client",
      );
    }
  },
);

export const deleteClient = createAsyncThunk(
  "clients/delete",
  async (id, { rejectWithValue }) => {
    try {
      await clientsService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete client",
      );
    }
  },
);

export const uploadVisitingCard = createAsyncThunk(
  "clients/uploadVisitingCard",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const response = await clientsService.uploadVisitingCard(id, file);
      return response.data.client;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload visiting card",
      );
    }
  },
);

export const bulkAssignClients = createAsyncThunk(
  "clients/bulkAssign",
  async ({ clientIds, marketingPersonId }, { rejectWithValue }) => {
    try {
      const response = await clientsService.bulkAssign(
        clientIds,
        marketingPersonId,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign clients",
      );
    }
  },
);

// Remarks thunks
export const fetchRemarks = createAsyncThunk(
  "clients/fetchRemarks",
  async ({ clientId, params }, { rejectWithValue }) => {
    try {
      const response = await remarksService.getByClient(clientId, params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch remarks",
      );
    }
  },
);

export const fetchTimeline = createAsyncThunk(
  "clients/fetchTimeline",
  async ({ clientId, params }, { rejectWithValue }) => {
    try {
      const response = await remarksService.getTimeline(clientId, params);
      return response.data.timeline;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch timeline",
      );
    }
  },
);

export const createRemark = createAsyncThunk(
  "clients/createRemark",
  async ({ clientId, data }, { rejectWithValue }) => {
    try {
      const response = await remarksService.create(clientId, data);
      return response.data.remark;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create remark",
      );
    }
  },
);

export const updateRemark = createAsyncThunk(
  "clients/updateRemark",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await remarksService.update(id, data);
      return response.data.remark;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update remark",
      );
    }
  },
);

export const deleteRemark = createAsyncThunk(
  "clients/deleteRemark",
  async (id, { rejectWithValue }) => {
    try {
      await remarksService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete remark",
      );
    }
  },
);

const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedClient: (state) => {
      state.selectedClient = null;
      state.remarks = [];
      state.timeline = [];
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
      // Fetch Clients
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload.data || [];
        state.pagination = {
          page: action.payload.pagination?.page || 1,
          limit: action.payload.pagination?.limit || 10,
          total: action.payload.pagination?.totalDocs || 0,
          totalPages: action.payload.pagination?.totalPages || 0,
        };
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Client
      .addCase(fetchClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedClient = action.payload;
      })
      .addCase(fetchClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Client Stats
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.clientStats = action.payload;
      })
      // Fetch Pending Follow-ups
      .addCase(fetchPendingFollowUps.fulfilled, (state, action) => {
        state.pendingFollowUps = action.payload;
      })
      // Create Client
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Client
      .addCase(updateClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.selectedClient?._id === action.payload._id) {
          state.selectedClient = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Client
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = state.clients.filter((c) => c._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upload Visiting Card
      .addCase(uploadVisitingCard.fulfilled, (state, action) => {
        const index = state.clients.findIndex(
          (c) => c._id === action.payload._id,
        );
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.selectedClient?._id === action.payload._id) {
          state.selectedClient = action.payload;
        }
      })
      // Bulk Assign
      .addCase(bulkAssignClients.fulfilled, () => {
        // Refresh clients list after bulk assign
      })
      // Fetch Remarks
      .addCase(fetchRemarks.pending, (state) => {
        state.isRemarksLoading = true;
      })
      .addCase(fetchRemarks.fulfilled, (state, action) => {
        state.isRemarksLoading = false;
        state.remarks = action.payload.data || [];
      })
      .addCase(fetchRemarks.rejected, (state, action) => {
        state.isRemarksLoading = false;
        state.error = action.payload;
      })
      // Fetch Timeline
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        state.timeline = action.payload;
      })
      // Create Remark
      .addCase(createRemark.fulfilled, (state, action) => {
        state.remarks.unshift(action.payload);
      })
      // Update Remark
      .addCase(updateRemark.fulfilled, (state, action) => {
        const index = state.remarks.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (index !== -1) {
          state.remarks[index] = action.payload;
        }
      })
      // Delete Remark
      .addCase(deleteRemark.fulfilled, (state, action) => {
        state.remarks = state.remarks.filter((r) => r._id !== action.payload);
      });
  },
});

export const {
  clearError,
  clearSelectedClient,
  setPage,
  setFilters,
  clearFilters,
} = clientsSlice.actions;
export default clientsSlice.reducer;

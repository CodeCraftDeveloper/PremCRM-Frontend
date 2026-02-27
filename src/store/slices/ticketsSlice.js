import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ticketsService, ticketRemarksService } from "../../services";

const initialState = {
  tickets: [],
  selectedTicket: null,
  stats: null,
  followUps: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    status: "",
    priority: "",
    type: "",
    assignedTo: "",
    channel: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  remarks: [],
  remarksPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  remarksLoading: false,
  isLoading: false,
  isStatsLoading: false,
  error: null,
};

// ═══════════════════════════════════════════════════════════
// Ticket Thunks
// ═══════════════════════════════════════════════════════════

export const fetchTickets = createAsyncThunk(
  "tickets/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tickets",
      );
    }
  },
);

export const fetchTicket = createAsyncThunk(
  "tickets/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getOne(id);
      return response.data?.ticket || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ticket",
      );
    }
  },
);

export const createTicket = createAsyncThunk(
  "tickets/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await ticketsService.create(data);
      return response.data?.ticket || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create ticket",
      );
    }
  },
);

export const updateTicket = createAsyncThunk(
  "tickets/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.update(id, data);
      return response.data?.ticket || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update ticket",
      );
    }
  },
);

export const updateTicketStatus = createAsyncThunk(
  "tickets/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.updateStatus(id, status);
      return response.data?.ticket || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update ticket status",
      );
    }
  },
);

export const assignTicket = createAsyncThunk(
  "tickets/assign",
  async ({ id, assignToUserId }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.assign(id, assignToUserId);
      return response.data?.ticket || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign ticket",
      );
    }
  },
);

export const deleteTicket = createAsyncThunk(
  "tickets/delete",
  async (id, { rejectWithValue }) => {
    try {
      await ticketsService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete ticket",
      );
    }
  },
);

export const restoreTicket = createAsyncThunk(
  "tickets/restore",
  async (id, { rejectWithValue }) => {
    try {
      const response = await ticketsService.restore(id);
      return response.data?.ticket || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore ticket",
      );
    }
  },
);

export const fetchTicketStats = createAsyncThunk(
  "tickets/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ticket stats",
      );
    }
  },
);

export const fetchTicketFollowUps = createAsyncThunk(
  "tickets/fetchFollowUps",
  async (days = 7, { rejectWithValue }) => {
    try {
      const response = await ticketsService.getFollowUps(days);
      return response.data?.followUps || response.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch follow-ups",
      );
    }
  },
);

export const bulkUpdateTicketStatus = createAsyncThunk(
  "tickets/bulkStatus",
  async ({ ticketIds, status }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.bulkUpdateStatus(ticketIds, status);
      return { ticketIds, status, result: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to bulk update status",
      );
    }
  },
);

export const bulkAssignTickets = createAsyncThunk(
  "tickets/bulkAssign",
  async ({ ticketIds, assignToUserId }, { rejectWithValue }) => {
    try {
      const response = await ticketsService.bulkAssign(
        ticketIds,
        assignToUserId,
      );
      return { ticketIds, assignToUserId, result: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to bulk assign tickets",
      );
    }
  },
);

// ═══════════════════════════════════════════════════════════
// Ticket Remark Thunks
// ═══════════════════════════════════════════════════════════

export const fetchTicketRemarks = createAsyncThunk(
  "tickets/fetchRemarks",
  async ({ ticketId, page = 1, limit = 20, type }, { rejectWithValue }) => {
    try {
      const response = await ticketRemarksService.getByTicket(ticketId, {
        page,
        limit,
        type,
      });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch remarks",
      );
    }
  },
);

export const createTicketRemark = createAsyncThunk(
  "tickets/createRemark",
  async ({ ticketId, data }, { rejectWithValue }) => {
    try {
      const response = await ticketRemarksService.create(ticketId, data);
      return response.data?.remark || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add remark",
      );
    }
  },
);

export const updateTicketRemark = createAsyncThunk(
  "tickets/updateRemark",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await ticketRemarksService.update(id, data);
      return response.data?.remark || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update remark",
      );
    }
  },
);

export const deleteTicketRemark = createAsyncThunk(
  "tickets/deleteRemark",
  async (id, { rejectWithValue }) => {
    try {
      await ticketRemarksService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete remark",
      );
    }
  },
);

// ═══════════════════════════════════════════════════════════
// Slice
// ═══════════════════════════════════════════════════════════

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
      state.remarks = [];
      state.remarksPagination = initialState.remarksPagination;
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
      // ── Fetch Tickets ──────────────────────
      .addCase(fetchTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        const inner = payload?.data || payload;
        state.tickets = inner?.tickets || (Array.isArray(inner) ? inner : []);
        const pag = inner?.pagination || payload?.pagination || {};
        state.pagination = {
          page: pag.page || 1,
          limit: pag.limit || 10,
          total: pag.totalDocs || pag.total || 0,
          totalPages: pag.totalPages || pag.pages || 0,
        };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Fetch Single Ticket ────────────────
      .addCase(fetchTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTicket = action.payload;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Create Ticket ──────────────────────
      .addCase(createTicket.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Update Ticket ──────────────────────
      .addCase(updateTicket.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.tickets.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) state.tickets[idx] = action.payload;
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Update Status ──────────────────────
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) state.tickets[idx] = action.payload;
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket = action.payload;
        }
      })

      // ── Assign Ticket ──────────────────────
      .addCase(assignTicket.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) state.tickets[idx] = action.payload;
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket = action.payload;
        }
      })

      // ── Delete Ticket ──────────────────────
      .addCase(deleteTicket.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = state.tickets.filter((t) => t._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Restore Ticket ─────────────────────
      .addCase(restoreTicket.fulfilled, (state, action) => {
        const idx = state.tickets.findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) state.tickets[idx] = action.payload;
      })

      // ── Stats ──────────────────────────────
      .addCase(fetchTicketStats.pending, (state) => {
        state.isStatsLoading = true;
      })
      .addCase(fetchTicketStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchTicketStats.rejected, (state, action) => {
        state.isStatsLoading = false;
        state.error = action.payload;
      })

      // ── Follow-ups ─────────────────────────
      .addCase(fetchTicketFollowUps.fulfilled, (state, action) => {
        state.followUps = action.payload;
      })

      // ── Bulk Status ────────────────────────
      .addCase(bulkUpdateTicketStatus.fulfilled, (state, action) => {
        const { ticketIds, status } = action.payload;
        state.tickets = state.tickets.map((t) =>
          ticketIds.includes(t._id) ? { ...t, status } : t,
        );
      })

      // ── Bulk Assign ────────────────────────
      .addCase(bulkAssignTickets.fulfilled, (state, action) => {
        const { ticketIds, assignToUserId } = action.payload;
        state.tickets = state.tickets.map((t) =>
          ticketIds.includes(t._id) ? { ...t, assignedTo: assignToUserId } : t,
        );
      })

      // ── Fetch Remarks ──────────────────────
      .addCase(fetchTicketRemarks.pending, (state) => {
        state.remarksLoading = true;
      })
      .addCase(fetchTicketRemarks.fulfilled, (state, action) => {
        state.remarksLoading = false;
        state.remarks = action.payload.data || [];
        const pag = action.payload.pagination || {};
        state.remarksPagination = {
          page: pag.page || 1,
          limit: pag.limit || 20,
          total: pag.totalDocs || 0,
          totalPages: pag.totalPages || 0,
        };
      })
      .addCase(fetchTicketRemarks.rejected, (state, action) => {
        state.remarksLoading = false;
        state.error = action.payload;
      })

      // ── Create Remark ──────────────────────
      .addCase(createTicketRemark.fulfilled, (state, action) => {
        state.remarks.unshift(action.payload);
        state.remarksPagination.total += 1;
      })

      // ── Update Remark ──────────────────────
      .addCase(updateTicketRemark.fulfilled, (state, action) => {
        const idx = state.remarks.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (idx !== -1) state.remarks[idx] = action.payload;
      })

      // ── Delete Remark ──────────────────────
      .addCase(deleteTicketRemark.fulfilled, (state, action) => {
        state.remarks = state.remarks.filter((r) => r._id !== action.payload);
        state.remarksPagination.total -= 1;
      });
  },
});

export const {
  clearError,
  clearSelectedTicket,
  setPage,
  setFilters,
  clearFilters,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;

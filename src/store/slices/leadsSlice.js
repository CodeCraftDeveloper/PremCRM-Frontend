import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { leadsService, leadRemarksService } from "../../services";

const initialState = {
  leads: [],
  selectedLead: null,
  analytics: null,
  unassignedCount: 0,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    status: "",
    source: "",
    assignedTo: "",
    websiteId: "",
    isDuplicate: "",
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
  isAnalyticsLoading: false,
  error: null,
};

// Async thunks
export const fetchLeads = createAsyncThunk(
  "leads/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await leadsService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leads",
      );
    }
  },
);

export const fetchLead = createAsyncThunk(
  "leads/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await leadsService.getOne(id);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lead",
      );
    }
  },
);

export const createLead = createAsyncThunk(
  "leads/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await leadsService.create(data);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create lead",
      );
    }
  },
);

export const updateLead = createAsyncThunk(
  "leads/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await leadsService.update(id, data);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update lead",
      );
    }
  },
);

export const updateLeadStatus = createAsyncThunk(
  "leads/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await leadsService.updateStatus(id, status);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update lead status",
      );
    }
  },
);

export const assignLead = createAsyncThunk(
  "leads/assign",
  async ({ id, assignToUserId }, { rejectWithValue }) => {
    try {
      const response = await leadsService.assign(id, assignToUserId);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign lead",
      );
    }
  },
);

export const autoAssignLeads = createAsyncThunk(
  "leads/autoAssign",
  async (method, { rejectWithValue }) => {
    try {
      const response = await leadsService.autoAssign(method);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to auto-assign leads",
      );
    }
  },
);

export const markLeadDuplicate = createAsyncThunk(
  "leads/markDuplicate",
  async ({ id, originalLeadId }, { rejectWithValue }) => {
    try {
      const response = await leadsService.markDuplicate(id, originalLeadId);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark lead as duplicate",
      );
    }
  },
);

export const mergeDuplicateLeads = createAsyncThunk(
  "leads/mergeDuplicates",
  async ({ id, duplicateId }, { rejectWithValue }) => {
    try {
      const response = await leadsService.mergeDuplicates(id, duplicateId);
      return response.data?.lead || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to merge leads",
      );
    }
  },
);

export const fetchLeadAnalytics = createAsyncThunk(
  "leads/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await leadsService.getAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch lead analytics",
      );
    }
  },
);

export const fetchUnassignedCount = createAsyncThunk(
  "leads/fetchUnassignedCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await leadsService.getUnassignedCount();
      return response.data?.count || 0;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch unassigned count",
      );
    }
  },
);

export const deleteLead = createAsyncThunk(
  "leads/delete",
  async (id, { rejectWithValue }) => {
    try {
      await leadsService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete lead",
      );
    }
  },
);

export const uploadLeadAttachments = createAsyncThunk(
  "leads/uploadAttachments",
  async ({ id, files }, { rejectWithValue }) => {
    try {
      const response = await leadsService.uploadAttachments(id, files);
      return { id, attachments: response.data?.attachments || [] };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload files",
      );
    }
  },
);

export const deleteLeadAttachment = createAsyncThunk(
  "leads/deleteAttachment",
  async ({ leadId, attachmentId }, { rejectWithValue }) => {
    try {
      await leadsService.deleteAttachment(leadId, attachmentId);
      return { leadId, attachmentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete attachment",
      );
    }
  },
);

/* ═══════════ Lead Remark Thunks ═══════════ */

export const fetchLeadRemarks = createAsyncThunk(
  "leads/fetchRemarks",
  async ({ leadId, page = 1, limit = 20, type }, { rejectWithValue }) => {
    try {
      const response = await leadRemarksService.getByLead(leadId, {
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

export const createLeadRemark = createAsyncThunk(
  "leads/createRemark",
  async ({ leadId, data }, { rejectWithValue }) => {
    try {
      const response = await leadRemarksService.create(leadId, data);
      return response.data.remark;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add remark",
      );
    }
  },
);

export const updateLeadRemark = createAsyncThunk(
  "leads/updateRemark",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await leadRemarksService.update(id, data);
      return response.data.remark;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update remark",
      );
    }
  },
);

export const deleteLeadRemark = createAsyncThunk(
  "leads/deleteRemark",
  async (id, { rejectWithValue }) => {
    try {
      await leadRemarksService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete remark",
      );
    }
  },
);

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedLead: (state) => {
      state.selectedLead = null;
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
      // Fetch Leads
      .addCase(fetchLeads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.isLoading = false;
        // successResponse wraps result inside "data": { leads, pagination }
        const payload = action.payload;
        const inner = payload?.data || payload;
        state.leads = inner?.leads || (Array.isArray(inner) ? inner : []);
        const pag = inner?.pagination || payload?.pagination || {};
        state.pagination = {
          page: pag.page || 1,
          limit: pag.limit || 10,
          total: pag.totalDocs || pag.total || 0,
          totalPages: pag.totalPages || pag.pages || 0,
        };
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Lead
      .addCase(fetchLead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedLead = action.payload;
      })
      .addCase(fetchLead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Lead
      .addCase(createLead.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leads.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createLead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Lead
      .addCase(updateLead.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.leads.findIndex(
          (l) => l._id === action.payload._id,
        );
        if (index !== -1) state.leads[index] = action.payload;
        if (state.selectedLead?._id === action.payload._id) {
          state.selectedLead = action.payload;
        }
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Lead Status
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        const index = state.leads.findIndex(
          (l) => l._id === action.payload._id,
        );
        if (index !== -1) state.leads[index] = action.payload;
        if (state.selectedLead?._id === action.payload._id) {
          state.selectedLead = action.payload;
        }
      })
      // Assign Lead
      .addCase(assignLead.fulfilled, (state, action) => {
        const index = state.leads.findIndex(
          (l) => l._id === action.payload._id,
        );
        if (index !== -1) state.leads[index] = action.payload;
        if (state.selectedLead?._id === action.payload._id) {
          state.selectedLead = action.payload;
        }
      })
      // Auto Assign
      .addCase(autoAssignLeads.fulfilled, (state) => {
        state.unassignedCount = 0;
      })
      // Mark Duplicate
      .addCase(markLeadDuplicate.fulfilled, (state, action) => {
        const index = state.leads.findIndex(
          (l) => l._id === action.payload._id,
        );
        if (index !== -1) state.leads[index] = action.payload;
        if (state.selectedLead?._id === action.payload._id) {
          state.selectedLead = action.payload;
        }
      })
      // Merge Duplicates
      .addCase(mergeDuplicateLeads.fulfilled, (state, action) => {
        const index = state.leads.findIndex(
          (l) => l._id === action.payload._id,
        );
        if (index !== -1) state.leads[index] = action.payload;
        if (state.selectedLead?._id === action.payload._id) {
          state.selectedLead = action.payload;
        }
      })
      // Analytics
      .addCase(fetchLeadAnalytics.pending, (state) => {
        state.isAnalyticsLoading = true;
      })
      .addCase(fetchLeadAnalytics.fulfilled, (state, action) => {
        state.isAnalyticsLoading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchLeadAnalytics.rejected, (state, action) => {
        state.isAnalyticsLoading = false;
        state.error = action.payload;
      })
      // Unassigned Count
      .addCase(fetchUnassignedCount.fulfilled, (state, action) => {
        state.unassignedCount = action.payload;
      })
      // Delete Lead
      .addCase(deleteLead.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leads = state.leads.filter((l) => l._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upload Attachments
      .addCase(uploadLeadAttachments.fulfilled, (state, action) => {
        const { id, attachments } = action.payload;
        if (state.selectedLead?._id === id) {
          state.selectedLead.attachments = attachments;
        }
        const idx = state.leads.findIndex((l) => l._id === id);
        if (idx !== -1) {
          state.leads[idx].attachments = attachments;
        }
      })
      // Delete Attachment
      .addCase(deleteLeadAttachment.fulfilled, (state, action) => {
        const { leadId, attachmentId } = action.payload;
        if (state.selectedLead?._id === leadId) {
          state.selectedLead.attachments = (
            state.selectedLead.attachments || []
          ).filter((a) => a._id !== attachmentId);
        }
        const idx = state.leads.findIndex((l) => l._id === leadId);
        if (idx !== -1) {
          state.leads[idx].attachments = (
            state.leads[idx].attachments || []
          ).filter((a) => a._id !== attachmentId);
        }
      })
      // Fetch Lead Remarks
      .addCase(fetchLeadRemarks.pending, (state) => {
        state.remarksLoading = true;
      })
      .addCase(fetchLeadRemarks.fulfilled, (state, action) => {
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
      .addCase(fetchLeadRemarks.rejected, (state, action) => {
        state.remarksLoading = false;
        state.error = action.payload;
      })
      // Create Lead Remark
      .addCase(createLeadRemark.fulfilled, (state, action) => {
        state.remarks.unshift(action.payload);
        state.remarksPagination.total += 1;
      })
      // Update Lead Remark
      .addCase(updateLeadRemark.fulfilled, (state, action) => {
        const idx = state.remarks.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (idx !== -1) state.remarks[idx] = action.payload;
      })
      // Delete Lead Remark
      .addCase(deleteLeadRemark.fulfilled, (state, action) => {
        state.remarks = state.remarks.filter((r) => r._id !== action.payload);
        state.remarksPagination.total -= 1;
      });
  },
});

export const {
  clearError,
  clearSelectedLead,
  setPage,
  setFilters,
  clearFilters,
} = leadsSlice.actions;
export default leadsSlice.reducer;

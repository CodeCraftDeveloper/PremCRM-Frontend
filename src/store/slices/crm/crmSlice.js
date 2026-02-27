import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import crmApi from "../../../services/crmApi";

const MODULES = ["leads", "contacts", "accounts", "deals", "activities"];

const createModuleState = () => ({
  items: [],
  pagination: { page: 1, limit: 20, totalDocs: 0, totalPages: 1 },
  filters: {
    search: "",
    status: "",
    ownerId: "",
    assignedTo: "",
    dateFrom: "",
    dateTo: "",
  },
  loading: false,
  error: null,
});

const initialState = {
  modules: MODULES.reduce((acc, module) => {
    acc[module] = createModuleState();
    return acc;
  }, {}),
  details: {},
  activitiesByEntity: {},
  pipelines: [],
  kanban: {
    columns: [],
    loading: false,
    error: null,
  },
  automation: {
    rules: [],
    loading: false,
  },
  blueprints: {
    items: [],
    loading: false,
  },
  dashboards: {
    admin: null,
    marketing: null,
    loading: false,
  },
};

export const fetchModuleList = createAsyncThunk(
  "crm/fetchModuleList",
  async ({ module, params }, { rejectWithValue }) => {
    try {
      const payload = await crmApi.list(module, params);
      return { module, ...payload };
    } catch (error) {
      return rejectWithValue({
        module,
        message: error.response?.data?.message || "Failed to load data",
      });
    }
  },
);

export const fetchModuleDetail = createAsyncThunk(
  "crm/fetchModuleDetail",
  async ({ module, id }, { rejectWithValue }) => {
    try {
      const payload = await crmApi.getById(module, id);
      return {
        module,
        id,
        item: payload?.[module.slice(0, -1)] || payload?.item || payload,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load record",
      );
    }
  },
);

export const createModuleItem = createAsyncThunk(
  "crm/createModuleItem",
  async ({ module, payload }, { rejectWithValue }) => {
    try {
      const data = await crmApi.create(module, payload);
      return {
        module,
        item: data?.[module.slice(0, -1)] || data?.item || data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create record",
      );
    }
  },
);

export const updateModuleItem = createAsyncThunk(
  "crm/updateModuleItem",
  async ({ module, id, payload }, { rejectWithValue }) => {
    try {
      const data = await crmApi.update(module, id, payload);
      return {
        module,
        id,
        item: data?.[module.slice(0, -1)] || data?.item || data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update record",
      );
    }
  },
);

export const deleteModuleItem = createAsyncThunk(
  "crm/deleteModuleItem",
  async ({ module, id }, { rejectWithValue }) => {
    try {
      await crmApi.remove(module, id);
      return { module, id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete record",
      );
    }
  },
);

export const fetchEntityActivities = createAsyncThunk(
  "crm/fetchEntityActivities",
  async ({ entityType, entityId }, { rejectWithValue }) => {
    try {
      const activities = await crmApi.listEntityActivities(
        entityType,
        entityId,
      );
      return { entityType, entityId, activities };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load activities",
      );
    }
  },
);

export const addEntityActivity = createAsyncThunk(
  "crm/addEntityActivity",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await crmApi.createActivity(payload);
      return data?.activity || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create activity",
      );
    }
  },
);

export const convertLead = createAsyncThunk(
  "crm/convertLead",
  async ({ leadId, payload }, { rejectWithValue }) => {
    try {
      const data = await crmApi.convertLead(leadId, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to convert lead",
      );
    }
  },
);

export const fetchKanbanData = createAsyncThunk(
  "crm/fetchKanbanData",
  async ({ pipelineId, stagePages }, { rejectWithValue }) => {
    try {
      const data = await crmApi.getKanban(pipelineId, stagePages, 100);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load kanban",
      );
    }
  },
);

export const moveDealStage = createAsyncThunk(
  "crm/moveDealStage",
  async ({ dealId, stage }, { rejectWithValue }) => {
    try {
      const data = await crmApi.moveDealStage(dealId, stage);
      return data?.deal || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to move stage",
      );
    }
  },
);

export const fetchPipelines = createAsyncThunk(
  "crm/fetchPipelines",
  async (_, { rejectWithValue }) => {
    try {
      return await crmApi.listPipelines();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load pipelines",
      );
    }
  },
);

export const fetchAutomationRules = createAsyncThunk(
  "crm/fetchAutomationRules",
  async (_, { rejectWithValue }) => {
    try {
      return await crmApi.listAutomationRules();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load automation rules",
      );
    }
  },
);

export const saveAutomationRule = createAsyncThunk(
  "crm/saveAutomationRule",
  async ({ payload, id }, { rejectWithValue }) => {
    try {
      return await crmApi.saveAutomationRule(payload, id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save automation rule",
      );
    }
  },
);

export const toggleAutomationRule = createAsyncThunk(
  "crm/toggleAutomationRule",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      return await crmApi.toggleAutomationRule(id, isActive);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update rule",
      );
    }
  },
);

export const fetchBlueprints = createAsyncThunk(
  "crm/fetchBlueprints",
  async (_, { rejectWithValue }) => {
    try {
      return await crmApi.listBlueprints();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load blueprints",
      );
    }
  },
);

export const saveBlueprint = createAsyncThunk(
  "crm/saveBlueprint",
  async ({ payload, id }, { rejectWithValue }) => {
    try {
      return await crmApi.saveBlueprint(payload, id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save blueprint",
      );
    }
  },
);

export const fetchCrmDashboard = createAsyncThunk(
  "crm/fetchCrmDashboard",
  async (arg, { rejectWithValue }) => {
    try {
      // Support both old string (role) and new object { role, dateRange }
      const role = typeof arg === "string" ? arg : arg.role;
      const dateRange = typeof arg === "object" ? arg.dateRange : undefined;
      const data = await crmApi.fetchDashboard(role, dateRange);
      return { role, data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load dashboard",
      );
    }
  },
);

const updateEntityInColumns = (columns, updatedDeal) =>
  columns.map((column) => ({
    ...column,
    deals: column.deals
      .map((deal) =>
        deal._id === updatedDeal._id ? { ...deal, ...updatedDeal } : deal,
      )
      .filter((deal) => deal.stage === column.stage),
  }));

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    setModuleFilters: (state, action) => {
      const { module, filters } = action.payload;
      state.modules[module].filters = {
        ...state.modules[module].filters,
        ...filters,
      };
      state.modules[module].pagination.page = 1;
    },
    clearModuleFilters: (state, action) => {
      const module = action.payload;
      state.modules[module].filters = createModuleState().filters;
      state.modules[module].pagination.page = 1;
    },
    setModulePage: (state, action) => {
      const { module, page } = action.payload;
      state.modules[module].pagination.page = page;
    },
    optimisticMoveDeal: (state, action) => {
      const { dealId, fromStage, toStage } = action.payload;
      const fromColumn = state.kanban.columns.find(
        (column) => column.stage === fromStage,
      );
      const toColumn = state.kanban.columns.find(
        (column) => column.stage === toStage,
      );
      if (!fromColumn || !toColumn) return;
      const movingDeal = fromColumn.deals.find((deal) => deal._id === dealId);
      if (!movingDeal) return;
      fromColumn.deals = fromColumn.deals.filter((deal) => deal._id !== dealId);
      toColumn.deals.unshift({ ...movingDeal, stage: toStage });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModuleList.pending, (state, action) => {
        state.modules[action.meta.arg.module].loading = true;
        state.modules[action.meta.arg.module].error = null;
      })
      .addCase(fetchModuleList.fulfilled, (state, action) => {
        const { module, list, pagination } = action.payload;
        state.modules[module].items = list;
        state.modules[module].pagination = {
          ...state.modules[module].pagination,
          ...pagination,
        };
        state.modules[module].loading = false;
      })
      .addCase(fetchModuleList.rejected, (state, action) => {
        const { module, message } = action.payload || {};
        if (!module) return;
        state.modules[module].loading = false;
        state.modules[module].error = message;
      })
      .addCase(fetchModuleDetail.fulfilled, (state, action) => {
        const { module, id, item } = action.payload;
        if (!state.details[module]) state.details[module] = {};
        state.details[module][id] = item;
      })
      .addCase(createModuleItem.fulfilled, (state, action) => {
        const { module, item } = action.payload;
        state.modules[module].items = [item, ...state.modules[module].items];
      })
      .addCase(updateModuleItem.fulfilled, (state, action) => {
        const { module, id, item } = action.payload;
        state.modules[module].items = state.modules[module].items.map(
          (record) => (record._id === id ? { ...record, ...item } : record),
        );
        if (state.details[module]?.[id]) {
          state.details[module][id] = {
            ...state.details[module][id],
            ...item,
          };
        }
      })
      .addCase(deleteModuleItem.fulfilled, (state, action) => {
        const { module, id } = action.payload;
        state.modules[module].items = state.modules[module].items.filter(
          (item) => item._id !== id,
        );
      })
      .addCase(fetchEntityActivities.fulfilled, (state, action) => {
        const { entityType, entityId, activities } = action.payload;
        state.activitiesByEntity[`${entityType}:${entityId}`] = activities;
      })
      .addCase(addEntityActivity.fulfilled, (state, action) => {
        const activity = action.payload;
        if (!activity?.relatedTo?.entityType || !activity?.relatedTo?.entityId)
          return;
        const key = `${activity.relatedTo.entityType}:${activity.relatedTo.entityId}`;
        state.activitiesByEntity[key] = [
          activity,
          ...(state.activitiesByEntity[key] || []),
        ];
      })
      .addCase(fetchPipelines.fulfilled, (state, action) => {
        state.pipelines = action.payload;
      })
      .addCase(fetchKanbanData.pending, (state) => {
        state.kanban.loading = true;
        state.kanban.error = null;
      })
      .addCase(fetchKanbanData.fulfilled, (state, action) => {
        state.kanban.loading = false;
        state.kanban.columns = action.payload.columns || [];
      })
      .addCase(fetchKanbanData.rejected, (state, action) => {
        state.kanban.loading = false;
        state.kanban.error = action.payload;
      })
      .addCase(moveDealStage.fulfilled, (state, action) => {
        const deal = action.payload;
        if (!deal?._id) return;
        state.kanban.columns = updateEntityInColumns(
          state.kanban.columns,
          deal,
        );
      })
      .addCase(fetchAutomationRules.pending, (state) => {
        state.automation.loading = true;
      })
      .addCase(fetchAutomationRules.fulfilled, (state, action) => {
        state.automation.loading = false;
        state.automation.rules = action.payload;
      })
      .addCase(saveAutomationRule.fulfilled, (state, action) => {
        const saved = action.payload?.rule || action.payload;
        if (!saved?._id) return;
        const idx = state.automation.rules.findIndex(
          (r) => r._id === saved._id,
        );
        if (idx !== -1) {
          state.automation.rules[idx] = saved;
        } else {
          state.automation.rules.unshift(saved);
        }
      })
      .addCase(toggleAutomationRule.fulfilled, (state, action) => {
        const toggled = action.payload?.rule || action.payload;
        if (!toggled?._id) return;
        const idx = state.automation.rules.findIndex(
          (r) => r._id === toggled._id,
        );
        if (idx !== -1) {
          state.automation.rules[idx] = {
            ...state.automation.rules[idx],
            ...toggled,
          };
        }
      })
      .addCase(fetchBlueprints.pending, (state) => {
        state.blueprints.loading = true;
      })
      .addCase(fetchBlueprints.fulfilled, (state, action) => {
        state.blueprints.loading = false;
        state.blueprints.items = action.payload;
      })
      .addCase(saveBlueprint.fulfilled, (state, action) => {
        const saved = action.payload?.blueprint || action.payload;
        if (!saved?._id) return;
        const idx = state.blueprints.items.findIndex(
          (b) => b._id === saved._id,
        );
        if (idx !== -1) {
          state.blueprints.items[idx] = saved;
        } else {
          state.blueprints.items.unshift(saved);
        }
      })
      .addCase(convertLead.fulfilled, (state, action) => {
        // After conversion, remove the lead from the leads module if loaded
        const leadId = action.payload?.lead?._id || action.meta?.arg?.leadId;
        if (leadId && state.modules.leads?.items) {
          state.modules.leads.items = state.modules.leads.items.filter(
            (item) => item._id !== leadId,
          );
        }
      })
      .addCase(fetchCrmDashboard.pending, (state) => {
        state.dashboards.loading = true;
      })
      .addCase(fetchCrmDashboard.fulfilled, (state, action) => {
        state.dashboards.loading = false;
        state.dashboards[action.payload.role] = action.payload.data;
      })
      .addCase(fetchCrmDashboard.rejected, (state) => {
        state.dashboards.loading = false;
      });
  },
});

export const {
  setModuleFilters,
  clearModuleFilters,
  setModulePage,
  optimisticMoveDeal,
} = crmSlice.actions;

export default crmSlice.reducer;

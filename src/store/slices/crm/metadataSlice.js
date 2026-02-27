import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import crmApi from "../../../services/crmApi";

const MODULES = ["leads", "contacts", "accounts", "deals", "activities"];

const createModuleMetadataState = () => ({
  loading: false,
  loaded: false,
  error: null,
  fetchedAt: null,
  systemFields: [],
  customFields: [],
  layout: { sections: [] },
  byApiName: {},
});

const initialState = {
  modules: MODULES.reduce((acc, module) => {
    acc[module] = createModuleMetadataState();
    return acc;
  }, {}),
};

const normalizeField = (field = {}, isCustom = false) => {
  const apiName = field.apiName || field.name || field.key;
  const normalizedType = String(field.fieldType || field.type || "text")
    .trim()
    .toLowerCase();

  const fieldIsRequired = field.isRequired === true;

  return {
    ...field,
    id: field.id || field._id || apiName,
    label: field.label || apiName,
    apiName,
    fieldType: normalizedType,
    required: fieldIsRequired,
    isRequired: fieldIsRequired,
    searchable: Boolean(field.searchable),
    options: Array.isArray(field.options) ? field.options : [],
    visibleToRoles: Array.isArray(field.visibleToRoles)
      ? field.visibleToRoles
      : [],
    order: Number.isFinite(Number(field.order))
      ? Number(field.order)
      : Number.MAX_SAFE_INTEGER,
    referenceModule: field.referenceConfig?.targetModule || null,
    isCustom,
  };
};

const sortFields = (a, b) => {
  if (a.order !== b.order) return a.order - b.order;
  return String(a.label || "").localeCompare(String(b.label || ""));
};

const normalizeMetadata = (payload = {}) => {
  const systemFields = (payload.systemFields || [])
    .map((field) => normalizeField(field, false))
    .sort(sortFields);

  const customFields = (payload.customFields || [])
    .map((field) => normalizeField(field, true))
    .sort(sortFields);

  const layoutSections = Array.isArray(payload.layout?.sections)
    ? payload.layout.sections
        .map((section) => ({
          title: section?.title || "Details",
          fields: Array.isArray(section?.fields) ? section.fields : [],
        }))
        .filter((section) => section.fields.length > 0)
    : [];

  const byApiName = [...systemFields, ...customFields].reduce((acc, field) => {
    if (!field.apiName) return acc;
    acc[field.apiName] = field;
    return acc;
  }, {});

  return {
    systemFields,
    customFields,
    layout: { sections: layoutSections },
    byApiName,
  };
};

export const fetchModuleMetadata = createAsyncThunk(
  "metadata/fetchModuleMetadata",
  async (module, { rejectWithValue }) => {
    try {
      const payload = await crmApi.getMetadata(module);
      return { module, ...normalizeMetadata(payload) };
    } catch (error) {
      return rejectWithValue({
        module,
        message: error.response?.data?.message || "Failed to load metadata",
      });
    }
  },
  {
    condition: (module, { getState }) => {
      const moduleState = getState()?.metadata?.modules?.[module];
      if (!moduleState) return true;
      return !moduleState.loading && !moduleState.loaded;
    },
  },
);

const metadataSlice = createSlice({
  name: "metadata",
  initialState,
  reducers: {
    invalidateModuleMetadata: (state, action) => {
      const module = action.payload;
      if (!state.modules[module]) {
        state.modules[module] = createModuleMetadataState();
        return;
      }
      state.modules[module] = createModuleMetadataState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModuleMetadata.pending, (state, action) => {
        const module = action.meta.arg;
        if (!state.modules[module]) {
          state.modules[module] = createModuleMetadataState();
        }
        state.modules[module].loading = true;
        state.modules[module].error = null;
      })
      .addCase(fetchModuleMetadata.fulfilled, (state, action) => {
        const { module, systemFields, customFields, layout, byApiName } =
          action.payload;
        if (!state.modules[module]) {
          state.modules[module] = createModuleMetadataState();
        }

        state.modules[module].loading = false;
        state.modules[module].loaded = true;
        state.modules[module].error = null;
        state.modules[module].fetchedAt = new Date().toISOString();
        state.modules[module].systemFields = systemFields;
        state.modules[module].customFields = customFields;
        state.modules[module].layout = layout;
        state.modules[module].byApiName = byApiName;
      })
      .addCase(fetchModuleMetadata.rejected, (state, action) => {
        const { module, message } = action.payload || {};
        if (!module) return;

        if (!state.modules[module]) {
          state.modules[module] = createModuleMetadataState();
        }
        state.modules[module].loading = false;
        state.modules[module].loaded = false;
        state.modules[module].error = message || "Failed to load metadata";
      });
  },
});

export const { invalidateModuleMetadata } = metadataSlice.actions;

export const selectModuleMetadata = (state, module) =>
  state.metadata?.modules?.[module] || createModuleMetadataState();

export default metadataSlice.reducer;

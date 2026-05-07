/**
 * Workflow v2 Redux slice (P3-005).
 *
 * Manages the builder's state: workflow list, active workflow, node registry
 * (palette), and canvas-local state (selected node, dirty flag).
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as workflowApi from "../../services/workflowApi";

// ── Async thunks ────────────────────────────────────────────────────────

export const fetchRegistry = createAsyncThunk(
  "workflowV2/fetchRegistry",
  async (_, { rejectWithValue }) => {
    try {
      return await workflowApi.fetchRegistry();
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load node registry",
      );
    }
  },
);

export const fetchWorkflows = createAsyncThunk(
  "workflowV2/fetchWorkflows",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await workflowApi.listWorkflows(params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load workflows",
      );
    }
  },
);

export const fetchWorkflow = createAsyncThunk(
  "workflowV2/fetchWorkflow",
  async (id, { rejectWithValue }) => {
    try {
      return await workflowApi.getWorkflow(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load workflow",
      );
    }
  },
);

export const saveWorkflow = createAsyncThunk(
  "workflowV2/saveWorkflow",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      if (id) {
        return await workflowApi.updateWorkflow(id, payload);
      }
      return await workflowApi.createWorkflow(payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to save workflow",
      );
    }
  },
);

export const removeWorkflow = createAsyncThunk(
  "workflowV2/removeWorkflow",
  async (id, { rejectWithValue }) => {
    try {
      await workflowApi.deleteWorkflow(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete workflow",
      );
    }
  },
);

export const activateWorkflow = createAsyncThunk(
  "workflowV2/activateWorkflow",
  async ({ id, activate }, { rejectWithValue }) => {
    try {
      return await workflowApi.activateWorkflow(id, activate);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join("; ") ||
        "Failed to activate workflow";
      return rejectWithValue(msg);
    }
  },
);

// ── Slice ────────────────────────────────────────────────────────────────

const initialState = {
  // List view
  workflows: [],
  workflowsTotal: 0,
  workflowsLoading: false,

  // Active workflow (builder canvas)
  active: null,
  activeLoading: false,
  dirty: false,
  saving: false,

  // Node palette registry (grouped by type)
  registry: null,
  registryLoading: false,

  // Canvas state
  selectedNodeId: null,

  error: null,
};

const workflowV2Slice = createSlice({
  name: "workflowV2",
  initialState,
  reducers: {
    /** Select a node on the canvas. */
    selectNode(state, action) {
      state.selectedNodeId = action.payload;
    },

    /** Clear node selection. */
    clearSelection(state) {
      state.selectedNodeId = null;
    },

    /** Add a node to the active workflow. */
    addNode(state, action) {
      if (!state.active) return;
      state.active.nodes.push(action.payload);
      state.dirty = true;
    },

    /** Update a node in the active workflow. */
    updateNode(state, action) {
      if (!state.active) return;
      const { id, changes } = action.payload;
      const idx = state.active.nodes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        state.active.nodes[idx] = { ...state.active.nodes[idx], ...changes };
        state.dirty = true;
      }
    },

    /** Remove a node and its connected edges. */
    removeNode(state, action) {
      if (!state.active) return;
      const nodeId = action.payload;
      state.active.nodes = state.active.nodes.filter((n) => n.id !== nodeId);
      state.active.edges = state.active.edges.filter(
        (e) => e.from !== nodeId && e.to !== nodeId,
      );
      if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
      state.dirty = true;
    },

    /** Add an edge between two nodes. */
    addEdge(state, action) {
      if (!state.active) return;
      state.active.edges.push(action.payload);
      state.dirty = true;
    },

    /** Remove an edge. */
    removeEdge(state, action) {
      if (!state.active) return;
      const edgeId = action.payload;
      state.active.edges = state.active.edges.filter((e) => e.id !== edgeId);
      state.dirty = true;
    },

    /** Update node position after drag. */
    moveNode(state, action) {
      if (!state.active) return;
      const { id, x, y } = action.payload;
      const node = state.active.nodes.find((n) => n.id === id);
      if (node) {
        node.position = { x, y };
        state.dirty = true;
      }
    },

    /** Update the workflow name. */
    setWorkflowName(state, action) {
      if (!state.active) return;
      state.active.name = action.payload;
      state.dirty = true;
    },

    /** Set the active workflow directly (for new workflows). */
    setActiveWorkflow(state, action) {
      state.active = action.payload;
      state.dirty = false;
      state.selectedNodeId = null;
    },

    /** Clear the active workflow (navigating away from builder). */
    clearActiveWorkflow(state) {
      state.active = null;
      state.dirty = false;
      state.selectedNodeId = null;
    },

    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Registry
      .addCase(fetchRegistry.pending, (state) => {
        state.registryLoading = true;
      })
      .addCase(fetchRegistry.fulfilled, (state, action) => {
        state.registryLoading = false;
        state.registry = action.payload;
      })
      .addCase(fetchRegistry.rejected, (state, action) => {
        state.registryLoading = false;
        state.error = action.payload;
      })

      // List
      .addCase(fetchWorkflows.pending, (state) => {
        state.workflowsLoading = true;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.workflowsLoading = false;
        state.workflows = action.payload.data;
        state.workflowsTotal = action.payload.total;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.workflowsLoading = false;
        state.error = action.payload;
      })

      // Single
      .addCase(fetchWorkflow.pending, (state) => {
        state.activeLoading = true;
      })
      .addCase(fetchWorkflow.fulfilled, (state, action) => {
        state.activeLoading = false;
        state.active = action.payload;
        state.dirty = false;
        state.selectedNodeId = null;
      })
      .addCase(fetchWorkflow.rejected, (state, action) => {
        state.activeLoading = false;
        state.error = action.payload;
      })

      // Save
      .addCase(saveWorkflow.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveWorkflow.fulfilled, (state, action) => {
        state.saving = false;
        state.active = action.payload;
        state.dirty = false;
      })
      .addCase(saveWorkflow.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(removeWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter(
          (w) => w._id !== action.payload,
        );
        if (state.active?._id === action.payload) {
          state.active = null;
          state.dirty = false;
          state.selectedNodeId = null;
        }
      })

      // Activate
      .addCase(activateWorkflow.pending, (state) => {
        state.saving = true;
      })
      .addCase(activateWorkflow.fulfilled, (state, action) => {
        state.saving = false;
        state.active = action.payload;
        state.dirty = false;
      })
      .addCase(activateWorkflow.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const {
  selectNode,
  clearSelection,
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  moveNode,
  setWorkflowName,
  setActiveWorkflow,
  clearActiveWorkflow,
  clearError,
} = workflowV2Slice.actions;

export default workflowV2Slice.reducer;

/**
 * Workflow v2 API client (P3-005).
 *
 * Thin wrappers around the `/api/v1/crm/workflows/v2` endpoints for the
 * Workflow Builder UI.
 */

import api from "./api";

const BASE = "/crm/workflows/v2";

/** Fetch the full node palette registry (grouped by type). */
export async function fetchRegistry() {
  const res = await api.get(`${BASE}/registry`);
  return res.data.data;
}

/** List all v2 workflows for the current tenant. */
export async function listWorkflows(params = {}) {
  const res = await api.get(BASE, { params });
  return res.data;
}

/** Get a single workflow by ID. */
export async function getWorkflow(id) {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

/** Create a new v2 workflow. */
export async function createWorkflow(payload) {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

/** Update an existing v2 workflow. */
export async function updateWorkflow(id, payload) {
  const res = await api.put(`${BASE}/${id}`, payload);
  return res.data.data;
}

/** Soft-delete a v2 workflow. */
export async function deleteWorkflow(id) {
  const res = await api.delete(`${BASE}/${id}`);
  return res.data;
}

/** Activate or deactivate a v2 workflow. */
export async function activateWorkflow(id, activate = true) {
  const res = await api.put(`${BASE}/${id}/activate`, { activate });
  return res.data.data;
}

/** List runs for a workflow. */
export async function listWorkflowRuns(id, params = {}) {
  const res = await api.get(`${BASE}/${id}/runs`, { params });
  return res.data;
}

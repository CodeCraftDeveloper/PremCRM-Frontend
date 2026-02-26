import api from "./api";

/**
 * Authentication service
 */
export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/me", data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put("/auth/change-password", data);
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post("/auth/refresh-token", { refreshToken });
    return response.data;
  },

  registerMarketingManager: async (data) => {
    const response = await api.post("/auth/register-marketing-manager", data);
    return response.data;
  },
};

/**
 * Users service
 */
export const usersService = {
  getAll: async (params) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/users", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  },

  getMarketingUsers: async () => {
    const response = await api.get("/users/marketing");
    return response.data;
  },

  approveUser: async (id) => {
    const response = await api.put(`/users/${id}/approve`);
    return response.data;
  },

  rejectUser: async (id) => {
    const response = await api.put(`/users/${id}/reject`);
    return response.data;
  },

  getPendingApprovals: async () => {
    const response = await api.get("/users/pending-approvals");
    return response.data;
  },
};

/**
 * Events service
 */
export const eventsService = {
  getAll: async (params) => {
    const response = await api.get("/events", { params });
    return response.data;
  },

  getActive: async () => {
    const response = await api.get("/events/active");
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(`/events/${id}/stats`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/events", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
};

/**
 * Clients service
 */
export const clientsService = {
  getAll: async (params) => {
    const response = await api.get("/clients", { params });
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/clients", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  uploadVisitingCard: async (id, file) => {
    const formData = new FormData();
    formData.append("visitingCard", file);
    const response = await api.post(`/clients/${id}/visiting-card`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getStats: async (params) => {
    const response = await api.get("/clients/stats", { params });
    return response.data;
  },

  getPendingFollowUps: async (days = 7) => {
    const response = await api.get("/clients/follow-ups/pending", {
      params: { days },
    });
    return response.data;
  },

  bulkAssign: async (clientIds, marketingPersonId) => {
    const response = await api.put("/clients/bulk-assign", {
      clientIds,
      marketingPersonId,
    });
    return response.data;
  },
};

/**
 * Remarks service
 */
export const remarksService = {
  getByClient: async (clientId, params) => {
    const response = await api.get(`/clients/${clientId}/remarks`, { params });
    return response.data;
  },

  create: async (clientId, data) => {
    const response = await api.post(`/clients/${clientId}/remarks`, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/remarks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/remarks/${id}`);
    return response.data;
  },

  getTimeline: async (clientId, params) => {
    const response = await api.get(`/clients/${clientId}/timeline`, { params });
    return response.data;
  },
};

/**
 * Dashboard service
 */
export const dashboardService = {
  getAdmin: async () => {
    const response = await api.get("/dashboard/admin");
    return response.data;
  },

  getMarketing: async () => {
    const response = await api.get("/dashboard/marketing");
    return response.data;
  },

  getAnalytics: async (params) => {
    const response = await api.get("/dashboard/analytics", { params });
    return response.data;
  },
};

/**
 * Leads service
 */
export const leadsService = {
  getAll: async (params) => {
    const response = await api.get("/leads", { params });
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/leads", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/leads/${id}/status`, { status });
    return response.data;
  },

  assign: async (id, assignToUserId) => {
    const response = await api.put(`/leads/${id}/assign`, { assignToUserId });
    return response.data;
  },

  autoAssign: async (method = "round_robin") => {
    const response = await api.post("/leads/auto-assign", { method });
    return response.data;
  },

  markDuplicate: async (id, originalLeadId) => {
    const response = await api.put(`/leads/${id}/mark-duplicate`, {
      originalLeadId,
    });
    return response.data;
  },

  mergeDuplicates: async (id, duplicateId) => {
    const response = await api.post(`/leads/${id}/merge/${duplicateId}`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get("/leads/analytics/dashboard");
    return response.data;
  },

  getUnassignedCount: async () => {
    const response = await api.get("/leads/unassigned/count");
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  uploadAttachments: async (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("attachments", file));
    const response = await api.post(`/leads/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteAttachment: async (leadId, attachmentId) => {
    const response = await api.delete(
      `/leads/${leadId}/attachments/${attachmentId}`,
    );
    return response.data;
  },
};

/**
 * Lead Remarks service
 */
export const leadRemarksService = {
  getByLead: async (leadId, params) => {
    const response = await api.get(`/leads/${leadId}/remarks`, { params });
    return response.data;
  },

  create: async (leadId, data) => {
    const response = await api.post(`/leads/${leadId}/remarks`, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/leads/remarks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/leads/remarks/${id}`);
    return response.data;
  },
};

/**
 * Websites service
 */
export const websitesService = {
  getAll: async (params) => {
    const response = await api.get("/websites", { params });
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/websites/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/websites", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/websites/${id}`, data);
    return response.data;
  },

  regenerateApiKey: async (id) => {
    const response = await api.post(`/websites/${id}/regenerate-key`);
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(`/websites/${id}/stats`);
    return response.data;
  },

  testConnection: async (id) => {
    const response = await api.post(`/websites/${id}/test`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/websites/${id}`);
    return response.data;
  },
};

/**
 * Export service
 */
export const exportService = {
  getSummary: async () => {
    const response = await api.get("/export/summary");
    return response.data;
  },

  exportClients: async (params) => {
    const response = await api.get("/export/clients", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  exportEvents: async (params) => {
    const response = await api.get("/export/events", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  exportActivityLogs: async (params) => {
    const response = await api.get("/export/activity-logs", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export leads/queries to Excel (XLSX)
   * @param {Object} params - { status, websiteId, assignedTo, startDate, endDate, groupByWebsite }
   */
  exportLeads: async (params) => {
    const response = await api.get("/export/leads", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export website query summary to Excel
   */
  exportLeadsSummary: async () => {
    const response = await api.get("/export/leads/summary", {
      responseType: "blob",
    });
    return response.data;
  },
};

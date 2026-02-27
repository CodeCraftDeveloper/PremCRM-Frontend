import api from "./api";

const normalizeListResponse = (response, key = "items") => {
  const payload = response?.data?.data;
  const payloadIsArray = Array.isArray(payload);
  const data = payloadIsArray ? {} : payload || {};
  const list = payloadIsArray
    ? payload
    : data[key] || data.items || data.records || data.results || [];

  const rawPag = response?.data?.pagination ||
    data.pagination || {
      page: 1,
      limit: Array.isArray(list) ? list.length : 0,
      totalDocs: Array.isArray(list) ? list.length : 0,
      totalPages: 1,
    };

  // Normalize pagination field names: total → totalDocs, pages → totalPages
  const pagination = {
    page: rawPag.page || 1,
    limit: rawPag.limit || 20,
    totalDocs:
      rawPag.totalDocs ??
      rawPag.total ??
      (Array.isArray(list) ? list.length : 0),
    totalPages: rawPag.totalPages ?? rawPag.pages ?? 1,
    hasNextPage: rawPag.hasNextPage,
    hasPrevPage: rawPag.hasPrevPage,
  };

  return { list: Array.isArray(list) ? list : [], pagination };
};

const entityPath = {
  leads: "leads",
  contacts: "crm/contacts",
  accounts: "crm/accounts",
  deals: "crm/deals",
  activities: "crm/activities",
};

const extractEntity = (data = {}, singular = "item") => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  return data[singular] || data.item || data.data || data;
};

const normalizePagedArray = (response, fallbackKey) => {
  const payload = response?.data?.data;
  const data = Array.isArray(payload) ? {} : payload || {};
  const list = Array.isArray(payload)
    ? payload
    : data[fallbackKey] || data.items || data.results || [];
  return {
    list: Array.isArray(list) ? list : [],
    pagination: response?.data?.pagination || data.pagination,
  };
};

const cleanParams = (params = {}) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    cleaned[key] = value;
  });

  return cleaned;
};

/**
 * Adapt CRM leads payload to lead API contract.
 * Maps fullName -> firstName/lastName.
 */
const adaptLeadPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  const adapted = { ...payload };

  // Safety net: if fullName was sent instead of firstName/lastName, split it
  if (adapted.fullName && !adapted.firstName) {
    const parts = adapted.fullName.trim().split(/\s+/);
    adapted.firstName = parts[0] || "";
    adapted.lastName = parts.slice(1).join(" ") || "";
    delete adapted.fullName;
  }

  return adapted;
};
const mapModuleListParams = (module, params = {}) => {
  const safe = cleanParams(params);

  // Map frontend sortBy + sortOrder -> backend structured sort object
  if (safe.sortBy && !safe.sort) {
    safe.sort = {
      field: safe.sortBy,
      direction: safe.sortOrder === "asc" ? "asc" : "desc",
    };
    delete safe.sortBy;
    delete safe.sortOrder;
  }

  if (module === "leads") {
    const rest = { ...safe };
    if (rest.assignedTo === "null") {
      delete rest.ownerId;
      return rest;
    }
    delete rest.ownerId;
    return rest;
  }

  return safe;
};

const mapLegacyAdminDashboard = (data = {}) => {
  const overview = data.overview || {};
  const clientStats = data.clientStats || {};
  const topMarketers = data.topMarketers || [];
  const monthlyTrend = data.monthlyTrend || [];

  return {
    revenueForecast: topMarketers.reduce(
      (sum, marketer) => sum + Number(marketer.totalValue || 0),
      0,
    ),
    openDeals:
      Number(clientStats.new || 0) +
      Number(clientStats.contacted || 0) +
      Number(clientStats.interested || 0) +
      Number(clientStats.negotiation || 0),
    winRate:
      Number(overview.totalClients || 0) > 0
        ? Number(
            (
              (Number(clientStats.converted || 0) /
                Number(overview.totalClients || 1)) *
              100
            ).toFixed(1),
          )
        : 0,
    activeContacts: Number(overview.totalClients || 0),
    pipelineFunnel: [
      { stage: "New", count: Number(clientStats.new || 0) },
      { stage: "Contacted", count: Number(clientStats.contacted || 0) },
      { stage: "Interested", count: Number(clientStats.interested || 0) },
      { stage: "Negotiation", count: Number(clientStats.negotiation || 0) },
      { stage: "Converted", count: Number(clientStats.converted || 0) },
    ],
    leadSourceChart: [],
    revenueTrend: monthlyTrend.map((row) => ({
      period: `${row?._id?.month || ""}/${row?._id?.year || ""}`,
      revenue: Number(row?.count || 0),
    })),
    teamPerformance: topMarketers.map((marketer) => ({
      name: marketer.name,
      dealsWon: Number(marketer.converted || 0),
      revenue: Number(marketer.totalValue || 0),
    })),
  };
};

const mapLegacyMarketingDashboard = (data = {}) => {
  const stats = data.clientStats || {};
  const weeklyTrend = data.weeklyTrend || [];
  const total =
    Number(stats.total || 0) ||
    Number(stats.new || 0) +
      Number(stats.contacted || 0) +
      Number(stats.interested || 0) +
      Number(stats.negotiation || 0) +
      Number(stats.converted || 0) +
      Number(stats.lost || 0);
  const converted = Number(stats.converted || 0);
  const pendingFollowUps = Array.isArray(data.pendingFollowUps)
    ? data.pendingFollowUps.length
    : 0;
  const overdueFollowUps = Array.isArray(data.overdueFollowUps)
    ? data.overdueFollowUps.length
    : 0;

  return {
    assignedLeads: total,
    conversionRate:
      total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0,
    activityCompletionRate:
      pendingFollowUps + overdueFollowUps > 0
        ? Number(
            (
              (pendingFollowUps /
                Math.max(pendingFollowUps + overdueFollowUps, 1)) *
              100
            ).toFixed(1),
          )
        : 0,
    pendingTasks: pendingFollowUps + overdueFollowUps,
    weeklyPerformance: weeklyTrend.map((row) => ({
      week: `W${row?._id || ""}`,
      converted: Number(row?.count || 0),
      activitiesCompleted: Number(row?.count || 0),
    })),
    activityBreakdown: [
      { status: "planned", count: pendingFollowUps },
      { status: "overdue", count: overdueFollowUps },
      { status: "completed", count: converted },
    ].filter((row) => row.count > 0),
    conversionTrend: weeklyTrend.map((row) => ({
      period: `W${row?._id || ""}`,
      rate: Number(row?.count || 0),
    })),
  };
};

const crmApi = {
  async getMetadata(module) {
    const [fieldsResponse, layoutResponse] = await Promise.all([
      api.get(`/crm/metadata/fields/module/${module}`),
      api
        .get(`/crm/metadata/layouts/active/${module}/edit`)
        .catch(() => ({ data: { data: { sections: [] } } })),
    ]);

    const customFields = Array.isArray(fieldsResponse?.data?.data)
      ? fieldsResponse.data.data
      : [];
    const layout = layoutResponse?.data?.data || { sections: [] };
    return {
      systemFields: [],
      customFields,
      layout,
    };
  },

  async list(module, params = {}) {
    const response = await api.get(`/${entityPath[module]}`, {
      params: mapModuleListParams(module, params),
    });
    return normalizeListResponse(response, module);
  },

  async getById(module, id) {
    const response = await api.get(`/${entityPath[module]}/${id}`);
    return extractEntity(response?.data?.data, module.slice(0, -1));
  },

  async create(module, payload) {
    const body = module === "leads" ? adaptLeadPayload(payload) : payload;
    const response = await api.post(`/${entityPath[module]}`, body);
    return extractEntity(response?.data?.data, module.slice(0, -1));
  },

  async update(module, id, payload) {
    const body = module === "leads" ? adaptLeadPayload(payload) : payload;
    const response = await api.put(`/${entityPath[module]}/${id}`, body);
    return extractEntity(response?.data?.data, module.slice(0, -1));
  },

  async remove(module, id) {
    await api.delete(`/${entityPath[module]}/${id}`);
    return id;
  },

  async restore(module, id) {
    const method = module === "leads" ? "put" : "patch";
    const response = await api[method](`/${entityPath[module]}/${id}/restore`);
    return extractEntity(response?.data?.data, module.slice(0, -1));
  },

  async assign(module, id, ownerId) {
    const payload =
      module === "leads" ? { assignToUserId: ownerId } : { ownerId };
    const method = module === "leads" ? "put" : "patch";
    const response = await api[method](`/${entityPath[module]}/${id}/assign`, {
      ...payload,
    });
    return extractEntity(response?.data?.data, module.slice(0, -1));
  },

  async listEntityActivities(entityType, entityId) {
    const response = await api.get(
      `/crm/activities/entity/${entityType}/${entityId}`,
    );
    return normalizeListResponse(response).list;
  },

  async createActivity(payload) {
    const response = await api.post("/crm/activities", payload);
    return extractEntity(response?.data?.data, "activity");
  },

  async convertLead(leadId, payload) {
    const response = await api.post(`/crm/leads/${leadId}/convert`, payload);
    return response?.data?.data || null;
  },

  async getKanban(pipelineId, stagePages = {}, limit = 100) {
    const pipelinesResponse = await api.get("/crm/pipelines");
    const pipelinesData = pipelinesResponse?.data?.data;
    const pipelines = Array.isArray(pipelinesData)
      ? pipelinesData
      : pipelinesData?.pipelines || pipelinesData?.items || [];
    const activePipeline =
      pipelines.find(
        (pipeline) => String(pipeline._id) === String(pipelineId),
      ) || pipelines[0];
    const stageNames =
      activePipeline?.stages
        ?.slice()
        ?.sort((a, b) => (a?.order || 0) - (b?.order || 0))
        ?.map((stage) => stage.name) || [];

    const stageResponses = await Promise.all(
      stageNames.map(async (stageName) => {
        const targetPage = Math.max(1, Number(stagePages[stageName] || 1));
        const pageResponses = await Promise.all(
          Array.from({ length: targetPage }, (_, index) =>
            api.get("/crm/deals", {
              params: cleanParams({
                pipelineId: activePipeline?._id,
                stage: stageName,
                page: index + 1,
                limit: Math.min(limit, 100),
              }),
            }),
          ),
        );
        return pageResponses;
      }),
    );

    return {
      columns: stageNames.map((stageName, index) => {
        const pages = stageResponses[index] || [];
        const normalizedPages = pages.map((response) =>
          normalizeListResponse(response, "deals"),
        );
        const pagination = normalizedPages[0]?.pagination || {};
        const deals = normalizedPages.flatMap((p) => p.list || []);
        return {
          stage: stageName,
          deals,
          pagination: {
            page: normalizedPages.length || 1,
            limit: pagination.limit || Math.min(limit, 100),
            totalDocs: pagination.totalDocs || deals.length,
            totalPages: pagination.totalPages || 1,
          },
        };
      }),
    };
  },

  async moveDealStage(dealId, stage) {
    const response = await api.patch(`/crm/deals/${dealId}/stage`, { stage });
    return extractEntity(response?.data?.data, "deal");
  },

  async listPipelines() {
    const response = await api.get("/crm/pipelines");
    const data = response?.data?.data;
    return Array.isArray(data) ? data : data?.pipelines || data?.items || [];
  },

  async createPipeline(payload) {
    const response = await api.post("/crm/pipelines", payload);
    return response?.data?.data || null;
  },

  async updatePipeline(id, payload) {
    const response = await api.put(`/crm/pipelines/${id}`, payload);
    return response?.data?.data || null;
  },

  async updatePipelineStages(id, stages) {
    const response = await api.put(`/crm/pipelines/${id}/stages`, { stages });
    return response?.data?.data || null;
  },

  async listAutomationRules() {
    const response = await api.get("/crm/workflows/rules");
    const data = response?.data?.data;
    return Array.isArray(data) ? data : data?.rules || data?.items || [];
  },

  async saveAutomationRule(payload, id = null) {
    const response = id
      ? await api.put(`/crm/workflows/rules/${id}`, payload)
      : await api.post("/crm/workflows/rules", payload);
    return extractEntity(response?.data?.data, "rule");
  },

  async toggleAutomationRule(id, isActive) {
    const response = await api.put(`/crm/workflows/rules/${id}`, {
      isActive,
    });
    return extractEntity(response?.data?.data, "rule");
  },

  async listBlueprints() {
    const response = await api.get("/crm/blueprints");
    const data = response?.data?.data;
    return Array.isArray(data) ? data : data?.blueprints || data?.items || [];
  },

  async saveBlueprint(payload, id = null) {
    const response = id
      ? await api.put(`/crm/blueprints/${id}`, payload)
      : await api.post("/crm/blueprints", payload);
    return extractEntity(response?.data?.data, "blueprint");
  },

  async fetchDashboard(role, dateRange) {
    const params = cleanParams({ dateRange });

    // Use canonical dashboard endpoints directly (no /crm sub-path exists yet).
    if (role === "admin") {
      const response = await api.get("/dashboard/admin", { params });
      return mapLegacyAdminDashboard(response?.data?.data || {});
    }

    const response = await api.get("/dashboard/marketing", { params });
    return mapLegacyMarketingDashboard(response?.data?.data || {});
  },

  // ─── Dynamic Metadata Engine APIs ───────────────────────────

  // Custom Modules
  async listCustomModules(params = {}) {
    const response = await api.get("/crm/metadata/modules", {
      params: cleanParams(params),
    });
    return normalizePagedArray(response, "modules");
  },

  async getCustomModule(id) {
    const response = await api.get(`/crm/metadata/modules/${id}`);
    return response?.data?.data || null;
  },

  async createCustomModule(payload) {
    const response = await api.post("/crm/metadata/modules", payload);
    return response?.data?.data || null;
  },

  async updateCustomModule(id, payload) {
    const response = await api.put(`/crm/metadata/modules/${id}`, payload);
    return response?.data?.data || null;
  },

  async deleteCustomModule(id) {
    await api.delete(`/crm/metadata/modules/${id}`);
    return id;
  },

  async toggleCustomModule(id) {
    const response = await api.patch(`/crm/metadata/modules/${id}/toggle`);
    return response?.data?.data || null;
  },

  // Custom Fields
  async listCustomFields(params = {}) {
    const response = await api.get("/crm/metadata/fields", {
      params: cleanParams(params),
    });
    return normalizePagedArray(response, "fields");
  },

  async getFieldsByModule(moduleApiName) {
    const response = await api.get(
      `/crm/metadata/fields/module/${moduleApiName}`,
    );
    return response?.data?.data || [];
  },

  async getCustomField(id) {
    const response = await api.get(`/crm/metadata/fields/${id}`);
    return response?.data?.data || null;
  },

  async createCustomField(payload) {
    const response = await api.post("/crm/metadata/fields", payload);
    return response?.data?.data || null;
  },

  async updateCustomField(id, payload) {
    const response = await api.put(`/crm/metadata/fields/${id}`, payload);
    return response?.data?.data || null;
  },

  async deleteCustomField(id) {
    await api.delete(`/crm/metadata/fields/${id}`);
    return id;
  },

  async reorderCustomFields(moduleApiName, fieldOrders) {
    const response = await api.patch(
      `/crm/metadata/fields/module/${moduleApiName}/reorder`,
      { fieldOrders },
    );
    return response?.data?.data || null;
  },

  async validateCustomData(moduleApiName, data) {
    const response = await api.post(
      `/crm/metadata/fields/module/${moduleApiName}/validate`,
      data,
    );
    return response?.data?.data || {};
  },

  async getModuleMetadata(moduleApiName) {
    const response = await api.get(
      `/crm/metadata/fields/module/${moduleApiName}/metadata`,
    );
    return response?.data?.data || {};
  },

  async resolveReferences(moduleApiName, customData) {
    const response = await api.post(
      `/crm/metadata/fields/module/${moduleApiName}/resolve`,
      customData,
    );
    return response?.data?.data || {};
  },

  // Layouts
  async listLayouts(params = {}) {
    const response = await api.get("/crm/metadata/layouts", {
      params: cleanParams(params),
    });
    const data = response?.data?.data;
    return Array.isArray(data) ? data : data?.layouts || data?.items || [];
  },

  async getLayout(id) {
    const response = await api.get(`/crm/metadata/layouts/${id}`);
    return response?.data?.data || null;
  },

  async getActiveLayout(moduleApiName, layoutType) {
    const response = await api.get(
      `/crm/metadata/layouts/active/${moduleApiName}/${layoutType}`,
    );
    return response?.data?.data || null;
  },

  async upsertLayout(payload) {
    const response = await api.post("/crm/metadata/layouts", payload);
    return response?.data?.data || null;
  },

  async updateLayout(id, payload) {
    const response = await api.put(`/crm/metadata/layouts/${id}`, payload);
    return response?.data?.data || null;
  },

  async deleteLayout(id) {
    await api.delete(`/crm/metadata/layouts/${id}`);
    return id;
  },

  async addLayoutSection(layoutId, sectionData) {
    const response = await api.post(
      `/crm/metadata/layouts/${layoutId}/sections`,
      sectionData,
    );
    return response?.data?.data || null;
  },

  async reorderLayoutSections(layoutId, sectionOrders) {
    const response = await api.patch(
      `/crm/metadata/layouts/${layoutId}/sections/reorder`,
      { sectionOrders },
    );
    return response?.data?.data || null;
  },

  // Form Definitions
  async listForms(params = {}) {
    const response = await api.get("/crm/metadata/forms", {
      params: cleanParams(params),
    });
    return normalizePagedArray(response, "forms");
  },

  async getForm(id) {
    const response = await api.get(`/crm/metadata/forms/${id}`);
    return response?.data?.data || null;
  },

  async getPublicForm(tenantSlug, apiName) {
    const response = await api.get(
      `/crm/metadata/forms/public/${tenantSlug}/${apiName}`,
    );
    return response?.data?.data || null;
  },

  async createForm(payload) {
    const response = await api.post("/crm/metadata/forms", payload);
    return response?.data?.data || null;
  },

  async updateForm(id, payload) {
    const response = await api.put(`/crm/metadata/forms/${id}`, payload);
    return response?.data?.data || null;
  },

  async deleteForm(id) {
    await api.delete(`/crm/metadata/forms/${id}`);
    return id;
  },

  async duplicateForm(id, name) {
    const response = await api.post(`/crm/metadata/forms/${id}/duplicate`, {
      name,
    });
    return response?.data?.data || null;
  },
};

export default crmApi;

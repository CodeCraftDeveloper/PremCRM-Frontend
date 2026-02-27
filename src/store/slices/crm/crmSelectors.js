/**
 * Memoised selectors for CRM Redux state.
 * Keep UI components thin — derive computed values here.
 */

// ─── Module selectors ──────────────────────────────────────
export const selectModuleState = (state, module) =>
  state.crm.modules[module] || {};

export const selectModuleItems = (state, module) =>
  state.crm.modules[module]?.items || [];

export const selectModulePagination = (state, module) =>
  state.crm.modules[module]?.pagination || {
    page: 1,
    limit: 20,
    totalDocs: 0,
    totalPages: 1,
  };

export const selectModuleLoading = (state, module) =>
  state.crm.modules[module]?.loading ?? false;

export const selectModuleFilters = (state, module) =>
  state.crm.modules[module]?.filters || {};

// ─── Detail selector ───────────────────────────────────────
export const selectDetail = (state, module, id) =>
  state.crm.details?.[module]?.[id] || null;

// ─── Activities by entity ──────────────────────────────────
export const selectActivitiesByEntity = (state, entityId) =>
  state.crm.activitiesByEntity[entityId] || [];

// ─── Kanban ────────────────────────────────────────────────
export const selectKanbanColumns = (state) => state.crm.kanban.columns;

export const selectKanbanLoading = (state) => state.crm.kanban.loading;

export const selectKanbanTotals = (state) => {
  const columns = state.crm.kanban.columns || [];
  let totalDeals = 0;
  let totalValue = 0;
  columns.forEach((col) => {
    const deals = col.deals || [];
    totalDeals += deals.length;
    deals.forEach((d) => {
      totalValue += Number(d.amount) || 0;
    });
  });
  return { totalDeals, totalValue };
};

// ─── Pipelines ─────────────────────────────────────────────
export const selectPipelines = (state) => state.crm.pipelines || [];

// ─── Automation ────────────────────────────────────────────
export const selectAutomationRules = (state) =>
  state.crm.automation.rules || [];

export const selectAutomationLoading = (state) => state.crm.automation.loading;

// ─── Blueprints ────────────────────────────────────────────
export const selectBlueprints = (state) => state.crm.blueprints.items || [];

export const selectBlueprintsLoading = (state) => state.crm.blueprints.loading;

// ─── Dashboard ─────────────────────────────────────────────
export const selectAdminDashboard = (state) => state.crm.dashboards.admin;

export const selectMarketingDashboard = (state) =>
  state.crm.dashboards.marketing;

export const selectDashboardLoading = (state) => state.crm.dashboards.loading;

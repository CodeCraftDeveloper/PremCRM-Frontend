# CRM UI System Architecture

## 1. Folder Structure (React)

```
client/src/
├── components/
│   ├── crm/
│   │   ├── index.js                     # Barrel export (Phase 8)
│   │   ├── ActivityTimeline.jsx          # ENHANCED — visual timeline, icons, toggle
│   │   ├── BulkActionsBar.jsx            # NEW — toolbar for selected rows
│   │   ├── ConvertLeadModal.jsx          # NEW — extracted lead-conversion modal
│   │   ├── CrmDrawer.jsx                 # EXISTING — form drawer (keep as-is)
│   │   ├── CrmFilterPanel.jsx            # ENHANCED — saved-view integration
│   │   ├── CrmModuleViews.jsx            # ENHANCED — tabbed detail view
│   │   ├── CrmTable.jsx                  # ENHANCED — sort, select, bulk
│   │   ├── DetailTabs.jsx                # NEW — tab navigation for detail page
│   │   ├── KanbanCard.jsx                # NEW — rich deal card for kanban
│   │   ├── RelatedRecords.jsx            # NEW — right-panel related records
│   │   └── SavedViews.jsx               # NEW — saved filter presets dropdown
│   ├── layout/
│   │   └── Sidebar.jsx                   # ENHANCED — collapsible CRM section
│   └── ui/                               # EXISTING — Badge, Button, Input, etc.
├── pages/
│   └── crm/
│       ├── index.js                      # EXISTING barrel
│       ├── crmConfig.js                  # ENHANCED — detailTabs, relatedRecords
│       ├── AdminCrmDashboard.jsx         # ENHANCED — date-range filter
│       ├── AutomationBuilderPage.jsx     # EXISTING (keep)
│       ├── BlueprintEditorPage.jsx       # EXISTING (keep)
│       ├── CrmDetailPage.jsx             # EXISTING wrapper
│       ├── CrmModulePage.jsx             # ENHANCED — list/kanban toggle
│       ├── DealsKanbanPage.jsx           # ENHANCED — blueprint validation, cards
│       └── MarketingCrmDashboard.jsx     # EXISTING (keep)
├── store/
│   └── slices/
│       └── crm/
│           ├── crmSlice.js               # EXISTING — well-structured, keep unified
│           └── crmSelectors.js           # NEW — memoized reselect selectors
└── services/
    └── crmApi.js                         # ENHANCED — bulk ops, saved-views, export
```

## 2. Page Map

| Route                         | Page Component        | Role      | Phase |
| ----------------------------- | --------------------- | --------- | ----- |
| `/admin/crm/dashboard`        | AdminCrmDashboard     | admin     | 6     |
| `/admin/crm/:module`          | CrmModulePage         | admin     | 2     |
| `/admin/crm/:module/:id`      | CrmDetailPage         | admin     | 3     |
| `/admin/crm/deals/kanban`     | DealsKanbanPage       | admin     | 4     |
| `/admin/crm/automation`       | AutomationBuilderPage | admin     | —     |
| `/admin/crm/blueprints`       | BlueprintEditorPage   | admin     | —     |
| `/marketing/crm/dashboard`    | MarketingCrmDashboard | marketing | 6     |
| `/marketing/crm/:module`      | CrmModulePage         | marketing | 2     |
| `/marketing/crm/:module/:id`  | CrmDetailPage         | marketing | 3     |
| `/marketing/crm/deals/kanban` | DealsKanbanPage       | marketing | 4     |

## 3. Component Hierarchy

```
AdminLayout / MarketingLayout
├── Sidebar (ENHANCED — grouped CRM section)
│   ├── SidebarSection "CRM" (collapsible)
│   │   ├── CRM Dashboard
│   │   ├── Leads / Contacts / Accounts / Deals
│   │   ├── Pipeline (Kanban)
│   │   ├── Activities
│   │   ├── Automation (admin only)
│   │   └── Blueprints (admin only)
│   └── SidebarSection "Core" (Events, Clients, etc.)
└── <Outlet>
    ├── CrmModulePage
    │   ├── SavedViews
    │   ├── CrmFilterPanel
    │   ├── BulkActionsBar (when rows selected)
    │   ├── CrmTable (sortable, selectable)
    │   ├── Pagination
    │   └── CrmDrawer (create/edit modal)
    ├── CrmDetailPage
    │   ├── DetailHeader (name, status badge, actions)
    │   ├── DetailTabs (Overview | Activities | Notes | Audit)
    │   ├── Tab: Overview → field grid + RelatedRecords panel
    │   ├── Tab: Activities → ActivityTimeline (enhanced)
    │   ├── Tab: Notes → notes list + inline add
    │   └── ConvertLeadModal (leads only)
    ├── DealsKanbanPage
    │   ├── PipelineSelector + List/Kanban toggle
    │   ├── KanbanBoard
    │   │   └── KanbanCard (value, owner avatar, stage badge)
    │   └── Blueprint validation modal
    └── AdminCrmDashboard / MarketingCrmDashboard
        ├── DateRangeFilter
        ├── StatCard grid
        └── Chart sections (Funnel, Bar, Pie)
```

## 4. Redux Slice Plan

**Decision: Keep single unified `crmSlice.js`** — the current slice is well-structured with:

- Dynamic module state (`modules[moduleName]`)
- Normalized detail cache (`details[module][id]`)
- Separate kanban, automation, blueprints, dashboards sections
- Already handles all CRUD + domain ops

**Add `crmSelectors.js`** for memoized derived data:

- `selectModuleState(module)` — items, pagination, filters, loading
- `selectModuleDetail(module, id)` — single record
- `selectEntityActivities(entityType, entityId)` — activity list
- `selectKanbanStageTotals` — count + total value per stage
- `selectPipelineOptions` — for dropdowns
- `selectDashboardData(role)` — admin or marketing dashboard

**Enhance `crmApi.js`** with:

- `bulkDelete(module, ids)` — bulk delete endpoint
- `bulkAssign(module, ids, ownerId)` — bulk assign endpoint
- `exportModule(module, params)` — CSV export

## 5. Implementation Order (Phased)

### Phase 1: Information Architecture (Sidebar)

- Group CRM nav items under collapsible "CRM" section
- Separate "Core" section for Events/Clients/Leads/etc.
- Role-aware: Automation/Blueprints admin-only

### Phase 2: List View System

- Enhanced CrmTable: sortable column headers, row checkboxes
- BulkActionsBar: delete, assign, export selected
- SavedViews: save/load filter presets (localStorage)
- CrmFilterPanel: integrate saved views

### Phase 3: Detail View Layout

- DetailTabs: Overview / Activities / Notes / Audit
- RelatedRecords: right panel with linked contacts/deals/accounts
- Enhanced ModuleDetailView: tabbed layout, inline field display
- ConvertLeadModal: extracted as standalone component

### Phase 4: Kanban Pipeline UI

- KanbanCard: rich deal card with value, owner, stage badge
- List/kanban toggle in CrmModulePage for deals
- Blueprint validation before stage transition
- Stage totals with deal count + sum value

### Phase 5: Activity Timeline UI

- Visual timeline with left border + dots
- Activity type icons (call, meeting, task, email)
- Click-to-toggle status (planned → completed)
- Due date display

### Phase 6: Dashboard Visuals

- Date-range filter for dashboard data
- Admin: funnel + revenue + team leaderboard (existing, polish)
- Marketing: assigned + conversion + activity metrics (existing, polish)

### Phase 7: Redux State Management

- crmSelectors.js: memoized selectors with createSelector
- Enhanced crmConfig.js: add detailTabs, relatedRecords config
- Enhanced crmApi.js: bulk operations + export

### Phase 8: UX Polish

- CRM components barrel index
- Skeleton loaders already in place
- Optimistic updates already in kanban
- Toast notifications already integrated
- Error boundary already exists

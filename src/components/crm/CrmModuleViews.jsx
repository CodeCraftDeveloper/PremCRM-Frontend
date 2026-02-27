import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Button, Modal } from "../ui";
import {
  addEntityActivity,
  createModuleItem,
  deleteModuleItem,
  fetchEntityActivities,
  fetchModuleDetail,
  fetchModuleList,
  setModuleFilters,
  clearModuleFilters,
  setModulePage,
  updateModuleItem,
  fetchPipelines,
} from "../../store/slices/crm/crmSlice";
import CrmFilterPanel from "./CrmFilterPanel";
import CrmTable from "./CrmTable";
import CrmDrawer from "./CrmDrawer";
import BulkActionsBar from "./BulkActionsBar";
import SavedViews from "./SavedViews";
import ActivityTimeline from "./ActivityTimeline";
import DetailTabs from "./DetailTabs";
import RelatedRecords from "./RelatedRecords";
import ConvertLeadModal from "./ConvertLeadModal";
import { CRM_MODULES } from "../../pages/crm/crmConfig";

// eslint-disable-next-line react-refresh/only-export-components
export const useModuleData = (module) => {
  const dispatch = useDispatch();
  const moduleState = useSelector((state) => state.crm.modules[module]);
  const metadata = useSelector((state) => state.metadata.modules[module]);
  const currentUserRole = useSelector((state) => state.auth.user?.role);
  const owners = useSelector((state) => state.users.marketingUsers || []);
  const config = CRM_MODULES[module];

  const ownerOptions = useMemo(
    () => owners.map((owner) => ({ value: owner._id, label: owner.name })),
    [owners],
  );

  return {
    config,
    moduleState,
    metadata,
    currentUserRole,
    ownerOptions,
    dispatch,
  };
};

export const ModuleListView = ({
  module,
  basePath,
  onNavigate,
  drawerState,
  setDrawerState,
  deleteState,
  setDeleteState,
  filterExpanded,
  setFilterExpanded,
}) => {
  const {
    config,
    moduleState,
    metadata,
    currentUserRole,
    ownerOptions,
    dispatch,
  } = useModuleData(module);
  const [sortConfig, setSortConfig] = useState(() =>
    moduleState.filters?.sort
      ? {
          key: moduleState.filters.sort.field,
          direction: moduleState.filters.sort.direction,
        }
      : null,
  );
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // For deals module: fetch pipelines and derive stage options dynamically
  const pipelines = useSelector((state) => state.crm.pipelines);
  useEffect(() => {
    if (module === "deals" && (!pipelines || pipelines.length === 0)) {
      dispatch(fetchPipelines());
    }
  }, [dispatch, module, pipelines]);

  const effectiveStatusOptions = useMemo(() => {
    if (module !== "deals" || !pipelines?.length) return config.statusOptions;
    const defaultPipeline =
      pipelines.find((p) => p.isDefault && p.isActive) ||
      pipelines.find((p) => p.isActive) ||
      pipelines[0];
    if (!defaultPipeline?.stages?.length) return config.statusOptions;
    const sorted = [...defaultPipeline.stages].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    return sorted.map((s) => ({ value: s.name, label: s.name }));
  }, [module, pipelines, config.statusOptions]);
  const canDelete = currentUserRole === "admin";

  // Reset selection when module or page changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds([]);
  }, [module, moduleState.pagination.page]);

  const handleSubmit = async (payload) => {
    const action = drawerState.item
      ? updateModuleItem({ module, id: drawerState.item._id, payload })
      : createModuleItem({ module, payload });

    try {
      await dispatch(action).unwrap();
      toast.success(`${config.singular} saved`);
      setDrawerState({ open: false, item: null });
      dispatch(
        fetchModuleList({
          module,
          params: {
            page: moduleState.pagination.page,
            limit: moduleState.pagination.limit,
            ...moduleState.filters,
            ...(sortConfig
              ? {
                  sort: {
                    field: sortConfig.key,
                    direction: sortConfig.direction,
                  },
                }
              : {}),
          },
        }),
      );
    } catch (error) {
      toast.error(error || `Failed to save ${config.singular.toLowerCase()}`);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(
        deleteModuleItem({ module, id: deleteState.item._id }),
      ).unwrap();
      toast.success(`${config.singular} deleted`);
      setDeleteState({ open: false, item: null });
    } catch (error) {
      toast.error(error || `Failed to delete ${config.singular.toLowerCase()}`);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          dispatch(deleteModuleItem({ module, id })).unwrap(),
        ),
      );
      toast.success(`${selectedIds.length} records deleted`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (error) {
      toast.error(error || "Bulk delete failed");
    }
  };

  const handleApplyView = (filters) => {
    dispatch(setModuleFilters({ module, filters }));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.label}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {moduleState.pagination.totalDocs || 0} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SavedViews
            module={module}
            currentFilters={moduleState.filters}
            onApply={handleApplyView}
          />
          <Button onClick={() => setDrawerState({ open: true, item: null })}>
            New {config.singular}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CrmFilterPanel
        module={module}
        filters={moduleState.filters}
        expanded={filterExpanded}
        onToggle={() => setFilterExpanded((prev) => !prev)}
        onChange={(filters) => dispatch(setModuleFilters({ module, filters }))}
        onClear={() => dispatch(clearModuleFilters(module))}
        statusOptions={effectiveStatusOptions}
        ownerOptions={ownerOptions}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onBulkDelete={canDelete ? () => setBulkDeleteOpen(true) : undefined}
      />

      {/* Table */}
      <CrmTable
        columns={config.columns}
        items={moduleState.items}
        sortConfig={sortConfig}
        onSort={(nextSort) => {
          setSortConfig(nextSort);
          dispatch(
            setModuleFilters({
              module,
              filters: {
                sort: nextSort
                  ? {
                      field: nextSort.key,
                      direction: nextSort.direction,
                    }
                  : undefined,
              },
            }),
          );
        }}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
        onView={(item) => onNavigate(`${basePath}/${module}/${item._id}`)}
        onEdit={(item) => setDrawerState({ open: true, item })}
        onDelete={
          canDelete ? (item) => setDeleteState({ open: true, item }) : () => {}
        }
        canDelete={canDelete}
      />

      {/* Pagination */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Button
            variant="outline"
            size="sm"
            disabled={moduleState.pagination.page <= 1}
            onClick={() =>
              dispatch(
                setModulePage({
                  module,
                  page: moduleState.pagination.page - 1,
                }),
              )
            }
          >
            Prev
          </Button>
          <span>
            Page {moduleState.pagination.page} /{" "}
            {moduleState.pagination.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={
              moduleState.pagination.page >=
              (moduleState.pagination.totalPages || 1)
            }
            onClick={() =>
              dispatch(
                setModulePage({
                  module,
                  page: moduleState.pagination.page + 1,
                }),
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create/Edit Drawer */}
      <CrmDrawer
        isOpen={drawerState.open}
        onClose={() => setDrawerState({ open: false, item: null })}
        fields={config.fields}
        initialData={drawerState.item}
        ownerOptions={ownerOptions}
        statusOptions={effectiveStatusOptions}
        activityTypeOptions={config.activityTypeOptions || []}
        onSubmit={handleSubmit}
        metadata={metadata}
        currentUserRole={currentUserRole}
        title={
          drawerState.item
            ? `Edit ${config.singular}`
            : `Create ${config.singular}`
        }
        submitLabel={drawerState.item ? "Save Changes" : "Create"}
      />

      {/* Single Delete Confirm */}
      {canDelete && (
        <Modal
          isOpen={deleteState.open}
          onClose={() => setDeleteState({ open: false, item: null })}
          title={`Delete ${config.singular}`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will soft-delete this {config.singular.toLowerCase()} record.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteState({ open: false, item: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Confirm */}
      {canDelete && (
        <Modal
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          title="Bulk Delete"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete {selectedIds.length} records? This
            action will soft-delete them.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBulkDelete}>
              Delete {selectedIds.length} Records
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const ModuleDetailView = ({
  module,
  id,
  onBack,
  basePath,
  navigate,
}) => {
  const dispatch = useDispatch();
  const config = CRM_MODULES[module];
  const detail = useSelector((state) => state.crm.details[module]?.[id]);
  const activities = useSelector(
    (state) =>
      state.crm.activitiesByEntity[`${module.slice(0, -1)}:${id}`] || [],
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [newActivity, setNewActivity] = useState({
    subject: "",
    type: "task",
    status: "planned",
  });
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  const tabs = useMemo(() => {
    return [
      { key: "overview", label: "Overview" },
      { key: "activities", label: "Activities", count: activities.length },
      { key: "notes", label: "Notes" },
      { key: "audit", label: "Audit Log" },
    ];
  }, [activities.length]);

  useEffect(() => {
    dispatch(fetchModuleDetail({ module, id }));
    dispatch(
      fetchEntityActivities({
        entityType: module.slice(0, -1),
        entityId: id,
      }),
    );
  }, [dispatch, module, id]);

  const createActivity = async () => {
    if (!newActivity.subject.trim()) return;
    try {
      await dispatch(
        addEntityActivity({
          ...newActivity,
          relatedTo: {
            entityType: module.slice(0, -1),
            entityId: id,
          },
        }),
      ).unwrap();
      toast.success("Activity created");
      setNewActivity({ subject: "", type: "task", status: "planned" });
    } catch (error) {
      toast.error(error || "Failed to create activity");
    }
  };

  if (!detail) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusValue = detail.status || detail.stage || "";

  return (
    <div className="space-y-4">
      {/* Detail Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {detail.fullName ||
                detail.name ||
                detail.subject ||
                config.singular}
            </h1>
            <div className="mt-0.5 flex items-center gap-2">
              {statusValue && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {statusValue}
                </span>
              )}
              {detail.owner?.name && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Owner: {detail.owner.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {module === "leads" && (
            <Button onClick={() => setConvertModalOpen(true)}>
              Convert Lead
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {activeTab === "overview" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Record Details
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                {Object.entries(detail)
                  .filter(
                    ([key]) =>
                      ![
                        "_id",
                        "__v",
                        "createdAt",
                        "updatedAt",
                        "deletedAt",
                        "isDeleted",
                        "tenant",
                      ].includes(key),
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())}
                      </p>
                      <p className="mt-1 break-all text-gray-900 dark:text-gray-200">
                        {typeof value === "object" && value !== null
                          ? value.name || value.email || JSON.stringify(value)
                          : String(value ?? "—")}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <ActivityTimeline
              activities={activities}
              onCreate={createActivity}
              newActivity={newActivity}
              setNewActivity={setNewActivity}
            />
          )}

          {activeTab === "notes" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Notes
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Notes feature coming soon. Use Activities to track interactions.
              </p>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Audit Log
              </h3>
              <div className="space-y-2 text-sm">
                {detail.createdAt && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <span className="text-gray-600 dark:text-gray-300">
                      Created
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(detail.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {detail.updatedAt && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <span className="text-gray-600 dark:text-gray-300">
                      Last Updated
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(detail.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {detail.convertedAt && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                    <span className="text-gray-600 dark:text-gray-300">
                      Converted
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(detail.convertedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Related Records */}
        <div className="xl:col-span-1">
          <RelatedRecords
            module={module}
            recordId={id}
            detail={detail}
            basePath={basePath}
            navigate={navigate}
          />
        </div>
      </div>

      {/* Convert Lead Modal */}
      {module === "leads" && (
        <ConvertLeadModal
          isOpen={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          leadId={id}
          basePath={basePath}
          navigate={navigate}
        />
      )}
    </div>
  );
};

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchWorkflows,
  removeWorkflow,
} from "../../store/slices/workflowV2Slice";
import { Button, ListSkeleton, Modal } from "../../components/ui";
import {
  Plus, Workflow, Trash2, Edit3, Play, Pause, Clock,
  ChevronRight, Zap, GitBranch, Search,
} from "lucide-react";

const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  archived: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
};

const WorkflowListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workflows, workflowsLoading } = useSelector(
    (s) => s.workflowV2,
  );
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchWorkflows());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(removeWorkflow(deleteTarget._id)).unwrap();
      toast.success("Workflow deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Delete failed");
    }
  };

  const filtered = workflows.filter(
    (w) =>
      !search ||
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.status?.toLowerCase().includes(search.toLowerCase()),
  );

  if (workflowsLoading) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Workflow className="h-6 w-6 text-blue-500" />
            Workflow Builder
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Design graph-based automation workflows with triggers, conditions, actions, and AI.
          </p>
        </div>
        <Button onClick={() => navigate("/admin/crm/workflows/new")}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workflows…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:ring-blue-900"
        />
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Workflow className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              {workflows.length === 0 ? "No workflows yet" : "No matching workflows"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {workflows.length === 0
                ? "Create your first v2 workflow to get started."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((wf) => (
              <div
                key={wf._id}
                className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30">
                  <Workflow className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {wf.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {wf.nodes?.length || 0} nodes
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {wf.edges?.length || 0} edges
                    </span>
                    {wf.stats?.runCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {wf.stats.runCount} runs
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(wf.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[wf.status] || STATUS_STYLES.draft}`}>
                  {wf.status}
                </span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => navigate(`/admin/crm/workflows/${wf._id}`)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(wf)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Workflow"
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleDelete} className="!bg-red-600 hover:!bg-red-700">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkflowListPage;

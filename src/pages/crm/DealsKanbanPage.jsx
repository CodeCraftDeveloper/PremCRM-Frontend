import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { ListSkeleton, Modal, Button } from "../../components/ui";
import KanbanCard from "../../components/crm/KanbanCard";
import { LayoutGrid, List } from "lucide-react";
import {
  fetchKanbanData,
  fetchPipelines,
  moveDealStage,
  optimisticMoveDeal,
} from "../../store/slices/crm/crmSlice";

const STAGE_COLORS = {
  Prospecting: "border-t-blue-400",
  Qualification: "border-t-cyan-400",
  Proposal: "border-t-violet-400",
  Negotiation: "border-t-amber-400",
  "Closed Won": "border-t-emerald-400",
  "Closed Lost": "border-t-red-400",
};

const DealsKanbanPage = () => {
  const dispatch = useDispatch();
  const { columns, loading } = useSelector((state) => state.crm.kanban);
  const pipelines = useSelector((state) => state.crm.pipelines);

  const [selectedPipeline, setSelectedPipeline] = useState("");
  const [pendingMove, setPendingMove] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");
  const [dragOverStage, setDragOverStage] = useState(null);
  const [stagePages, setStagePages] = useState({});

  useEffect(() => {
    dispatch(fetchPipelines());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedPipeline && pipelines[0]?._id) {
      setSelectedPipeline(pipelines[0]._id);
    }
  }, [selectedPipeline, pipelines]);

  useEffect(() => {
    if (!selectedPipeline) return;
    dispatch(fetchKanbanData({ pipelineId: selectedPipeline, stagePages }));
  }, [dispatch, selectedPipeline, stagePages]);

  useEffect(() => {
    setStagePages({});
  }, [selectedPipeline]);

  const stageSummary = useMemo(
    () =>
      columns.map((column) => {
        const totalValue = column.deals?.reduce(
          (sum, deal) => sum + (Number(deal.amount) || 0),
          0,
        );
        return {
          ...column,
          count: column.deals?.length || 0,
          totalValue,
        };
      }),
    [columns],
  );

  // Grand totals for list view header
  const grandTotals = useMemo(
    () => ({
      deals: stageSummary.reduce((s, c) => s + c.count, 0),
      value: stageSummary.reduce((s, c) => s + c.totalValue, 0),
    }),
    [stageSummary],
  );

  const handleDrop = (deal, toStage) => {
    if (deal.stage === toStage) return;
    setPendingMove({ deal, toStage });
    setDragOverStage(null);
  };

  const confirmMove = async () => {
    if (!pendingMove) return;
    dispatch(
      optimisticMoveDeal({
        dealId: pendingMove.deal._id,
        fromStage: pendingMove.deal.stage,
        toStage: pendingMove.toStage,
      }),
    );

    try {
      await dispatch(
        moveDealStage({
          dealId: pendingMove.deal._id,
          stage: pendingMove.toStage,
        }),
      ).unwrap();
      toast.success("Deal stage updated");
    } catch (error) {
      toast.error(error || "Failed to move deal stage");
      dispatch(fetchKanbanData({ pipelineId: selectedPipeline }));
    } finally {
      setPendingMove(null);
    }
  };

  if (loading) {
    return <ListSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deals Pipeline
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {grandTotals.deals} deals · ${grandTotals.value.toLocaleString()}{" "}
            total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`rounded-l-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-r-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          {/* Pipeline Selector */}
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={selectedPipeline}
            onChange={(e) => setSelectedPipeline(e.target.value)}
          >
            {pipelines.map((pipeline) => (
              <option key={pipeline._id} value={pipeline._id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stageSummary.map((column) => (
            <div
              key={column.stage}
              className={`min-w-70 shrink-0 rounded-xl border border-t-4 bg-white p-3 transition-colors dark:bg-gray-800 ${
                dragOverStage === column.stage
                  ? "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700"
              } ${STAGE_COLORS[column.stage] || "border-t-gray-400"}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverStage(column.stage);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(event) => {
                event.preventDefault();
                const payload = JSON.parse(
                  event.dataTransfer.getData("application/deal"),
                );
                handleDrop(payload, column.stage);
              }}
            >
              {/* Stage Header */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {column.stage}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {column.count} · ${column.totalValue.toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {column.count}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {(column.deals || []).map((deal) => (
                  <KanbanCard
                    key={deal._id}
                    deal={deal}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/deal",
                        JSON.stringify({
                          _id: deal._id,
                          stage: deal.stage,
                          name: deal.name,
                        }),
                      );
                    }}
                  />
                ))}
                {column.count === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 dark:border-gray-700">
                    No Deals in This Stage
                  </div>
                )}
                {(column.pagination?.totalDocs || 0) >
                  (column.deals || []).length && (
                  <button
                    type="button"
                    onClick={() =>
                      setStagePages((prev) => ({
                        ...prev,
                        [column.stage]: (prev[column.stage] || 1) + 1,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40"
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Deal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Close Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stageSummary.flatMap((column) =>
                (column.deals || []).map((deal) => (
                  <tr
                    key={deal._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/40"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {deal.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      ${Number(deal.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {deal.owner?.name || deal.ownerId?.name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {deal.closingDate
                        ? new Date(deal.closingDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Modal */}
      <Modal
        isOpen={Boolean(pendingMove)}
        onClose={() => setPendingMove(null)}
        title="Confirm Stage Change"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Move <strong>{pendingMove?.deal?.name || "this deal"}</strong> to
          stage <strong>{pendingMove?.toStage}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setPendingMove(null)}>
            Cancel
          </Button>
          <Button onClick={confirmMove}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DealsKanbanPage;



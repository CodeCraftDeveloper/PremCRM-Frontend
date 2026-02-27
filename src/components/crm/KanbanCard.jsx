import { DollarSign, User } from "lucide-react";

const KanbanCard = ({ deal, onDragStart }) => {
  const priority = deal.priority || "medium";
  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    medium:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    low: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-600 dark:bg-gray-800"
    >
      {/* Deal Name */}
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {deal.name || "Untitled Deal"}
      </p>

      {/* Company/Account */}
      {(deal.account?.name || deal.company) && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {deal.account?.name || deal.company}
        </p>
      )}

      {/* Amount + Priority */}
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
          <DollarSign className="h-3.5 w-3.5" />
          {Number(deal.amount || 0).toLocaleString()}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            priorityColors[priority] || priorityColors.medium
          }`}
        >
          {priority}
        </span>
      </div>

      {/* Owner + Close Date Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <User className="h-3 w-3" />
          {deal.owner?.name || deal.ownerId?.name || "Unassigned"}
        </span>
        {deal.closingDate && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {new Date(deal.closingDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;

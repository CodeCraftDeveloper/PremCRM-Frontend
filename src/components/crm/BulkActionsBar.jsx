import { Trash2, UserPlus, Download, X } from "lucide-react";
import { Button } from "../ui";

const BulkActionsBar = ({
  selectedCount,
  onClear,
  onBulkDelete,
  onBulkAssign,
  onExport,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-900/30">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          {selectedCount} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onBulkAssign && (
          <Button variant="outline" size="sm" onClick={onBulkAssign}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Assign
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        )}
        {onBulkDelete && (
          <Button variant="danger" size="sm" onClick={onBulkDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkActionsBar;

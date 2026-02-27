import {
  Eye,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

const getCellValue = (item, path) => {
  if (!path) return "-";
  if (!path.includes(".")) return item?.[path] ?? "-";
  return path.split(".").reduce((acc, key) => acc?.[key], item) ?? "-";
};

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig?.key !== column.key) {
    return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  }
  return sortConfig.direction === "asc" ? (
    <ArrowUp className="ml-1 inline h-3 w-3 text-blue-400" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3 text-blue-400" />
  );
};

const CrmTable = ({
  columns,
  items,
  onView,
  onEdit,
  onDelete,
  sortConfig,
  onSort,
  selectedIds = [],
  onSelectIds,
  visibleColumns,
  canEdit = true,
  canDelete = true,
}) => {
  const displayColumns = visibleColumns
    ? columns.filter((col) => visibleColumns.includes(col.key))
    : columns;

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < items.length;

  const handleSelectAll = () => {
    if (!onSelectIds) return;
    if (allSelected) {
      onSelectIds([]);
    } else {
      onSelectIds(items.map((item) => item._id));
    }
  };

  const handleSelectRow = (id) => {
    if (!onSelectIds) return;
    if (selectedIds.includes(id)) {
      onSelectIds(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectIds([...selectedIds, id]);
    }
  };

  const handleSort = (column) => {
    if (!onSort || column.sortable === false) return;
    const key = column.sortKey || column.key;
    if (sortConfig?.key === key) {
      onSort({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSort({ key, direction: "asc" });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {onSelectIds && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                  />
                </th>
              )}
              {displayColumns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                    column.sortable !== false && onSort
                      ? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                      : ""
                  }`}
                >
                  {column.label}
                  {column.sortable !== false && onSort && (
                    <SortIcon column={column} sortConfig={sortConfig} />
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length + (onSelectIds ? 2 : 1)}
                  className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  No Records Found
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item._id);
                return (
                  <tr
                    key={item._id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900/40"
                    }`}
                  >
                    {onSelectIds && (
                      <td className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(item._id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                        />
                      </td>
                    )}
                    {displayColumns.map((column) => {
                      const rawValue = getCellValue(item, column.key);
                      const value = column.render
                        ? column.render(rawValue, item)
                        : rawValue;
                      return (
                        <td
                          key={`${item._id}-${column.key}`}
                          className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                        >
                          {value}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-amber-600 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrmTable;

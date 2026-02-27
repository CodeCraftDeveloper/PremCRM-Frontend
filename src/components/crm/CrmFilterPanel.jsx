import { Search, Filter } from "lucide-react";
import { Button, Input, Select } from "../ui";

const CrmFilterPanel = ({
  module,
  filters,
  onChange,
  onToggle,
  expanded,
  onClear,
  statusOptions = [],
  ownerOptions = [],
}) => {
  const ownerFilterKey = module === "leads" ? "assignedTo" : "ownerId";
  const ownerOptionsWithUnassigned =
    module === "leads"
      ? [{ value: "null", label: "Unassigned" }, ...ownerOptions]
      : ownerOptions;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.search || ""}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search by name, email, phone..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={onToggle}>
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Status"
            value={filters.status || ""}
            onChange={(e) => onChange({ status: e.target.value })}
            options={[{ value: "", label: "All" }, ...statusOptions]}
          />
          <Select
            label={module === "leads" ? "Assigned To" : "Owner"}
            value={filters[ownerFilterKey] || ""}
            onChange={(e) => onChange({ [ownerFilterKey]: e.target.value })}
            options={[
              {
                value: "",
                label:
                  module === "leads" ? "All Assignees" : "All Owners",
              },
              ...ownerOptionsWithUnassigned,
            ]}
          />
          <Input
            type="date"
            label="From"
            value={filters.dateFrom || ""}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
          />
          <Input
            type="date"
            label="To"
            value={filters.dateTo || ""}
            onChange={(e) => onChange({ dateTo: e.target.value })}
          />
          <div className="flex items-end">
            <Button variant="ghost" onClick={onClear}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmFilterPanel;

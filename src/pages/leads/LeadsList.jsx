import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Filter,
  Eye,
  Trash2,
  UserPlus,
  Shuffle,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import {
  fetchLeads,
  deleteLead,
  autoAssignLeads,
  fetchUnassignedCount,
  setFilters,
  setPage,
  clearFilters,
} from "../../store/slices/leadsSlice";
import { fetchWebsites } from "../../store/slices/websitesSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  ListSkeleton,
  EmptyState,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  contacted:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  interested:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  qualified:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const LeadsList = ({ isAdmin = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads, pagination, filters, isLoading, unassignedCount } =
    useSelector((state) => state.leads);
  const { websites } = useSelector((state) => state.websites);
  const { marketingUsers } = useSelector((state) => state.users);
  const websitesList = Array.isArray(websites) ? websites : [];
  const marketingUsersList = Array.isArray(marketingUsers)
    ? marketingUsers
    : [];
  const leadsList = Array.isArray(leads) ? leads : [];

  const [search, setSearch] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false);
  const [assignMethod, setAssignMethod] = useState("round_robin");

  useEffect(() => {
    dispatch(fetchWebsites({ limit: 100 }));
    if (isAdmin) {
      dispatch(fetchUnassignedCount());
      dispatch(fetchMarketingUsers());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    };
    // Remove empty filters
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === undefined) delete params[key];
    });
    dispatch(fetchLeads(params));
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== filters.search) {
        dispatch(setFilters({ search }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, dispatch, filters.search]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleClearFilters = () => {
    setSearch("");
    dispatch(clearFilters());
  };

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await dispatch(deleteLead(leadToDelete._id)).unwrap();
      toast.success("Lead deleted successfully");
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      toast.error(error || "Failed to delete lead");
    }
  };

  const handleAutoAssign = async () => {
    try {
      const result = await dispatch(autoAssignLeads(assignMethod)).unwrap();
      toast.success(
        `Successfully assigned ${result?.assignedCount || 0} leads`,
      );
      setAutoAssignModalOpen(false);
      dispatch(fetchLeads({ page: 1, limit: pagination.limit, ...filters }));
      if (isAdmin) dispatch(fetchUnassignedCount());
    } catch (error) {
      toast.error(error || "Failed to auto-assign leads");
    }
  };

  const websiteOptions = websitesList.map((w) => ({
    value: w._id,
    label: w.name,
  }));

  const assigneeOptions = marketingUsersList.map((u) => ({
    value: u._id,
    label: u.name,
  }));

  if (isLoading && leadsList.length === 0) {
    return <ListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leads Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total leads
            {isAdmin && unassignedCount > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                • {unassignedCount} unassigned
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin/leads/analytics">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
          )}
          {isAdmin && unassignedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoAssignModalOpen(true)}
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Auto Assign ({unassignedCount})
            </Button>
          )}
          {isAdmin && (
            <Link to="/admin/leads/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, phone..."
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={[
                { value: "", label: "All Status" },
                ...LEAD_STATUS_OPTIONS,
              ]}
            />
            <Select
              label="Source Website"
              value={filters.websiteId}
              onChange={(e) => handleFilterChange("websiteId", e.target.value)}
              options={[
                { value: "", label: "All Websites" },
                ...websiteOptions,
              ]}
            />
            {isAdmin && (
              <Select
                label="Assigned To"
                value={filters.assignedTo}
                onChange={(e) =>
                  handleFilterChange("assignedTo", e.target.value)
                }
                options={[
                  { value: "", label: "All Assignees" },
                  { value: "unassigned", label: "Unassigned" },
                  ...assigneeOptions,
                ]}
              />
            )}
            <Select
              label="Duplicates"
              value={filters.isDuplicate}
              onChange={(e) =>
                handleFilterChange("isDuplicate", e.target.value)
              }
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Duplicates Only" },
                { value: "false", label: "Non-Duplicates" },
              ]}
            />
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      {leadsList.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Leads will appear here when submitted through your websites or added manually."
          icon={UserPlus}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Lead
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leadsList.map((lead) => (
                  <tr
                    key={lead._id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {lead.fullName || lead.firstName}
                          </p>
                          {lead.isDuplicate && (
                            <span className="inline-flex items-center rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Duplicate
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.email}
                        </p>
                        {lead.phone && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {lead.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {lead.websiteId?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lead.source}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[lead.status] || STATUS_COLORS.new
                        }`}
                      >
                        {lead.status?.charAt(0).toUpperCase() +
                          lead.status?.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full transition-all ${
                              lead.score >= 70
                                ? "bg-green-500"
                                : lead.score >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${lead.score || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {lead.score || 0}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {lead.assignedTo?.name || (
                          <span className="text-amber-600 dark:text-amber-400">
                            Unassigned
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {lead.createdAt
                        ? format(new Date(lead.createdAt), "MMM dd, yyyy")
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            navigate(
                              isAdmin
                                ? `/admin/leads/${lead._id}`
                                : `/marketing/leads/${lead._id}`,
                            )
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(lead)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => dispatch(setPage(page))}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        title="Delete Lead"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <strong>{leadToDelete?.fullName || leadToDelete?.firstName}</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteModalOpen(false);
              setLeadToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Auto Assign Modal */}
      <Modal
        isOpen={autoAssignModalOpen}
        onClose={() => setAutoAssignModalOpen(false)}
        title="Auto-Assign Leads"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Automatically assign {unassignedCount} unassigned leads to marketing
          team members.
        </p>
        <div className="mt-4">
          <Select
            label="Assignment Method"
            value={assignMethod}
            onChange={(e) => setAssignMethod(e.target.value)}
            options={[
              {
                value: "round_robin",
                label: "Round Robin - Distribute evenly",
              },
              {
                value: "least_loaded",
                label: "Least Loaded - Assign to least busy",
              },
            ]}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setAutoAssignModalOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleAutoAssign}>
            <Shuffle className="mr-2 h-4 w-4" />
            Assign Leads
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LeadsList;

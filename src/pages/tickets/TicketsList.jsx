import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Filter,
  Eye,
  Trash2,
  UserPlus,
  BarChart3,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  fetchTickets,
  fetchTicketStats,
  deleteTicket,
  setFilters,
  setPage,
  clearFilters,
} from "../../store/slices/ticketsSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  ListSkeleton,
  EmptyState,
  Modal,
  Badge,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_customer", label: "Waiting on Customer" },
  { value: "waiting_on_third_party", label: "Waiting on 3rd Party" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TYPE_OPTIONS = [
  { value: "lead_inquiry", label: "Lead Inquiry" },
  { value: "support", label: "Support" },
  { value: "follow_up", label: "Follow Up" },
  { value: "complaint", label: "Complaint" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General" },
];

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  waiting_on_customer:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  waiting_on_third_party:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  resolved:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  reopened: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STAT_ICONS = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

const TicketsList = ({ isAdmin = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, pagination, filters, stats, isLoading } = useSelector(
    (state) => state.tickets,
  );
  const { marketingUsers } = useSelector((state) => state.users);
  const ticketsList = Array.isArray(tickets) ? tickets : [];
  const marketingUsersList = Array.isArray(marketingUsers)
    ? marketingUsers
    : [];

  const [search, setSearch] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  const prefix = isAdmin ? "/admin" : "/marketing";

  useEffect(() => {
    dispatch(fetchTicketStats());
    if (isAdmin) {
      dispatch(fetchMarketingUsers());
    }
  }, [dispatch, isAdmin]);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === undefined) delete params[key];
    });
    dispatch(fetchTickets(params));
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

  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ticketToDelete) return;
    try {
      await dispatch(deleteTicket(ticketToDelete._id)).unwrap();
      toast.success("Ticket deleted successfully");
      setDeleteModalOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      toast.error(error || "Failed to delete ticket");
    }
  };

  const getStatusLabel = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt?.label || status;
  };

  const getPriorityLabel = (priority) => {
    const opt = PRIORITY_OPTIONS.find((o) => o.value === priority);
    return opt?.label || priority;
  };

  // Stats cards
  const statCards = stats
    ? [
        {
          label: "Open",
          value: stats.statusCounts?.open || 0,
          icon: AlertCircle,
          color: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
          label: "In Progress",
          value: stats.statusCounts?.in_progress || 0,
          icon: Clock,
          color: "text-amber-500",
          bg: "bg-amber-50 dark:bg-amber-900/20",
        },
        {
          label: "Resolved",
          value: stats.statusCounts?.resolved || 0,
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-50 dark:bg-green-900/20",
        },
        {
          label: "Total",
          value: stats.total || 0,
          icon: Ticket,
          color: "text-purple-500",
          bg: "bg-purple-50 dark:bg-purple-900/20",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tickets
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage support tickets, follow-ups, and customer issues
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              onClick={() => navigate(`${prefix}/tickets/new`)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          )}
          {!isAdmin && (
            <Button
              onClick={() => navigate(`${prefix}/tickets/new`)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-xl border border-gray-200 p-4 dark:border-gray-700 ${stat.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets by title, number, or contact..."
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filters.status || filters.priority || filters.type) && (
              <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
                {
                  [filters.status, filters.priority, filters.type].filter(
                    Boolean,
                  ).length
                }
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              label="Status"
              placeholder="All Statuses"
              options={STATUS_OPTIONS}
            />

            <Select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              label="Priority"
              placeholder="All Priorities"
              options={PRIORITY_OPTIONS}
            />

            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              label="Type"
              placeholder="All Types"
              options={TYPE_OPTIONS}
            />

            {isAdmin && (
              <Select
                value={filters.assignedTo}
                onChange={(e) =>
                  handleFilterChange("assignedTo", e.target.value)
                }
                label="Assigned To"
                placeholder="All Users"
                options={marketingUsersList.map((u) => ({
                  value: u._id,
                  label: u.name,
                }))}
              />
            )}

            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : ticketsList.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets found"
          description={
            filters.search || filters.status || filters.priority
              ? "Try adjusting your filters"
              : "Create your first ticket to get started"
          }
          action={
            <Button
              onClick={() => navigate(`${prefix}/tickets/new`)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Priority
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                    Type
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">
                    Contact
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                    Assigned To
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ticketsList.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    {/* Ticket Info */}
                    <td className="px-4 py-3">
                      <Link
                        to={`${prefix}/tickets/${ticket._id}`}
                        className="group"
                      >
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                          {ticket.ticketNumber}
                        </p>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {ticket.title}
                        </p>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] || ""}`}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority] || ""}`}
                      >
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {(ticket.type || "general").replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {ticket.contactName || "-"}
                        </p>
                        {ticket.contactEmail && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ticket.contactEmail}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.assignedTo?.name || "Unassigned"}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`${prefix}/tickets/${ticket._id}`}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(ticket)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
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
                totalItems={pagination.total}
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
          setTicketToDelete(null);
        }}
        title="Delete Ticket"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete ticket{" "}
            <strong>{ticketToDelete?.ticketNumber}</strong>? This action can be
            reversed by an admin.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setTicketToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketsList;

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  fetchClients,
  deleteClient,
  setFilters,
  setPage,
  clearFilters,
} from "../../store/slices/clientsSlice";
import { fetchActiveEvents } from "../../store/slices/eventsSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  PriorityBadge,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const FOLLOW_UP_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "negotiation", label: "Negotiation" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const ClientsList = ({ isAdmin = true }) => {
  const dispatch = useDispatch();
  const { clients, pagination, filters, isLoading } = useSelector(
    (state) => state.clients,
  );
  const { activeEvents } = useSelector((state) => state.events);
  const { marketingUsers } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchActiveEvents());
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
    dispatch(fetchClients(params));
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

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await dispatch(deleteClient(clientToDelete._id)).unwrap();
      toast.success("Client deleted successfully");
      setDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error) {
      toast.error(error || "Failed to delete client");
    }
  };

  const eventOptions = useMemo(
    () => activeEvents.map((e) => ({ value: e._id, label: e.name })),
    [activeEvents],
  );

  const marketingOptions = useMemo(
    () => marketingUsers.map((u) => ({ value: u._id, label: u.name })),
    [marketingUsers],
  );

  const basePath = isAdmin ? "/admin" : "/marketing";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isAdmin ? "All Clients" : "My Clients"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {pagination.total} clients found
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Link to={`${basePath}/clients/new`}>
            <Button icon={Plus}>Add Client</Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients by name, company, email..."
          className="max-w-md"
        />

        {showFilters && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Event"
                options={eventOptions}
                value={filters.event}
                onChange={(e) => handleFilterChange("event", e.target.value)}
                placeholder="All Events"
              />
              {isAdmin && (
                <Select
                  label="Marketing Person"
                  options={marketingOptions}
                  value={filters.marketingPerson}
                  onChange={(e) =>
                    handleFilterChange("marketingPerson", e.target.value)
                  }
                  placeholder="All Users"
                />
              )}
              <Select
                label="Status"
                options={FOLLOW_UP_STATUS_OPTIONS}
                value={filters.followUpStatus}
                onChange={(e) =>
                  handleFilterChange("followUpStatus", e.target.value)
                }
                placeholder="All Statuses"
              />
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                placeholder="All Priorities"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Clients Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Loading clients..." />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Try adjusting your filters or add a new client."
          action={
            <Link to={`${basePath}/clients/new`}>
              <Button icon={Plus}>Add Client</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Next Follow-up
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Registered By
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Contacted By
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {clients.map((client) => (
                <tr
                  key={client._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {client.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.companyName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {client.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.event?.name || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.followUpStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={client.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.nextFollowUpDate
                        ? format(
                            new Date(client.nextFollowUpDate),
                            "MMM d, yyyy",
                          )
                        : "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {client.createdBy?.name || client.marketingPerson?.name || "-"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.createdBy?.email || client.marketingPerson?.email || ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {client.lastContactedBy?.name || "-"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.lastContactedDate
                          ? format(new Date(client.lastContactedDate), "MMM d, yyyy h:mm a")
                          : ""}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`${basePath}/clients/${client._id}`}>
                        <Button variant="ghost" size="sm" icon={Eye}>
                          View
                        </Button>
                      </Link>
                      <Link to={`${basePath}/clients/${client._id}/edit`}>
                        <Button variant="ghost" size="sm" icon={Edit}>
                          Edit
                        </Button>
                      </Link>
                      {(isAdmin ||
                        client.marketingPerson?._id === user?._id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteClick(client)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => dispatch(setPage(page))}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Client"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <strong>{clientToDelete?.name}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientsList;

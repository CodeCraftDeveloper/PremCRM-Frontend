import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  fetchEvents,
  deleteEvent,
  setPage,
} from "../../store/slices/eventsSlice";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const EventsList = ({ isAdmin = true }) => {
  const dispatch = useDispatch();
  const { events, pagination, isLoading } = useSelector(
    (state) => state.events,
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search,
      status: statusFilter,
    };
    dispatch(fetchEvents(params));
  }, [dispatch, pagination.page, pagination.limit, search, statusFilter]);

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      await dispatch(deleteEvent(eventToDelete._id)).unwrap();
      toast.success("Event deleted successfully");
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      toast.error(error || "Failed to delete event");
    }
  };

  const basePath = isAdmin ? "/admin" : "/marketing";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {pagination.total} events found
          </p>
        </div>
        {isAdmin && (
          <Link to={`${basePath}/events/new`}>
            <Button icon={Plus}>Create Event</Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="max-w-md"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All Statuses"
          className="w-40"
        />
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Loading events..." />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your filters or create a new event."
          action={
            isAdmin && (
              <Link to={`${basePath}/events/new`}>
                <Button icon={Plus}>Create Event</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event._id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </div>
                <StatusBadge status={event.status} />
              </div>

              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {event.description || "No description"}
              </p>

              <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.startDate), "MMM d, yyyy")} -{" "}
                {format(new Date(event.endDate), "MMM d, yyyy")}
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Target:{" "}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {event.targetLeads || 0} leads
                  </span>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <>
                      <Link to={`${basePath}/events/${event._id}/edit`}>
                        <Button variant="ghost" size="sm" icon={Edit} />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeleteClick(event)}
                        className="text-red-600 hover:text-red-700"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
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
        title="Delete Event"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <strong>{eventToDelete?.name}</strong>? This action cannot be
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

export default EventsList;

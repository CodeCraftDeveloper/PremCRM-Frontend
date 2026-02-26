import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Filter,
  Eye,
  Trash2,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  fetchWebsites,
  deleteWebsite,
  setFilters,
  setPage,
  clearFilters,
} from "../../store/slices/websitesSlice";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  LoadingSpinner,
  EmptyState,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const CATEGORY_OPTIONS = [
  { value: "contact_form", label: "Contact Form" },
  { value: "landing_page", label: "Landing Page" },
  { value: "webinar", label: "Webinar" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS = {
  contact_form:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  landing_page:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  webinar:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  partner:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const WebsitesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { websites, pagination, filters, isLoading } = useSelector(
    (state) => state.websites,
  );

  const [search, setSearch] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === undefined) delete params[key];
    });
    dispatch(fetchWebsites(params));
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

  const handleDeleteClick = (website) => {
    setWebsiteToDelete(website);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!websiteToDelete) return;
    try {
      await dispatch(deleteWebsite(websiteToDelete._id)).unwrap();
      toast.success("Website deleted successfully");
      setDeleteModalOpen(false);
      setWebsiteToDelete(null);
    } catch (error) {
      toast.error(error || "Failed to delete website");
    }
  };

  if (isLoading && websites.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Website Sources
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage websites that send leads via the public API
          </p>
        </div>
        <Link to="/admin/websites/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Website
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or domain..."
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
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              options={[
                { value: "", label: "All Categories" },
                ...CATEGORY_OPTIONS,
              ]}
            />
            <Select
              label="Status"
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
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

      {/* Websites Grid */}
      {websites.length === 0 ? (
        <EmptyState
          title="No websites configured"
          description="Add a website to start receiving leads through the public API."
          icon={Globe}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {websites.map((website) => (
            <div
              key={website._id}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      website.isActive
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <Globe
                      className={`h-5 w-5 ${
                        website.isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {website.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {website.domain}
                    </p>
                  </div>
                </div>
                {website.isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    CATEGORY_COLORS[website.category] || CATEGORY_COLORS.other
                  }`}
                >
                  {(website.category || "other").replace(/_/g, " ")}
                </span>
                {website.apiKeyPrefix && (
                  <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {website.apiKeyPrefix}...
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {website.stats?.totalLeads || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {website.stats?.leadsThisMonth || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This Month
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {website.stats?.duplicatesDetected || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dupes
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                <span className="text-xs text-gray-400">
                  {website.stats?.lastLeadAt
                    ? `Last lead: ${format(new Date(website.stats.lastLeadAt), "MMM dd")}`
                    : "No leads yet"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => navigate(`/admin/websites/${website._id}`)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(website)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
          onPageChange={(page) => dispatch(setPage(page))}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWebsiteToDelete(null);
        }}
        title="Delete Website"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <strong>{websiteToDelete?.name}</strong>? This will also disable lead
          collection from this source. Existing leads will NOT be deleted.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setDeleteModalOpen(false);
              setWebsiteToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WebsitesList;

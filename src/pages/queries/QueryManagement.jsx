import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  Download,
  FileSpreadsheet,
  Filter,
  Eye,
  Globe,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Building2,
  AlertTriangle,
  Search,
  X,
  Calendar,
  Users,
  ExternalLink,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  LayoutGrid,
  Phone,
  Mail,
  User,
  ArrowUpRight,
  Tag,
  MapPin,
  Paperclip,
  FileText,
  Upload,
  Trash2,
  Image,
} from "lucide-react";
import {
  fetchLeads,
  setFilters,
  setPage,
  clearFilters,
  fetchUnassignedCount,
  uploadLeadAttachments,
  deleteLeadAttachment,
} from "../../store/slices/leadsSlice";
import { fetchWebsites } from "../../store/slices/websitesSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import { exportService } from "../../services";
import {
  Button,
  Select,
  Pagination,
  LoadingSpinner,
  EmptyState,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

/* ───────────── constants ───────────── */
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
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

const SOURCE_BADGE_COLORS = {
  "premindustries.net":
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  "prempackaging.com":
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800",
  "phsteels.in":
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
  "sheetmetal.premindustries.net":
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
  "injectionmoulding.premindustries.net":
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800",
  "indiamart.com":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
  "tradeindia.com":
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
  "justdial.com":
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800",
};

/* ───────────── helpers ───────────── */
const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

const getSourceBadgeClass = (domain) =>
  SOURCE_BADGE_COLORS[domain] ||
  "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

/* ───────────── component ───────────── */
const QueryManagement = ({ isAdmin = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { websiteId: routeWebsiteId } = useParams();
  const isWebsiteScoped = Boolean(routeWebsiteId);

  /* ── redux state ── */
  const {
    leads,
    pagination,
    filters,
    isLoading: leadsLoading,
    unassignedCount,
  } = useSelector((state) => state.leads);
  const { websites } = useSelector((state) => state.websites);
  const { marketingUsers } = useSelector((state) => state.users);

  const leadsList = useMemo(
    () => (Array.isArray(leads) ? leads : []),
    [leads],
  );
  const websitesList = Array.isArray(websites) ? websites : [];
  const marketingUsersList = Array.isArray(marketingUsers)
    ? marketingUsers
    : [];

  /* ── local state ── */
  const [search, setSearch] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportGrouped, setExportGrouped] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedSources, setExpandedSources] = useState({});
  const [viewMode, setViewMode] = useState("cards"); // cards | grouped | table
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLeadId, setUploadLeadId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentViewLeadId, setAttachmentViewLeadId] = useState(null);

  /* ── initial data load ── */
  useEffect(() => {
    dispatch(fetchWebsites({ limit: 100 }));
    dispatch(fetchUnassignedCount());
    if (isAdmin) dispatch(fetchMarketingUsers());
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (isWebsiteScoped) {
      setViewMode("table");
      dispatch(setFilters({ websiteId: routeWebsiteId }));
    }
  }, [dispatch, isWebsiteScoped, routeWebsiteId]);

  /* ── fetch leads when filters change ── */
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
      ...(isWebsiteScoped ? { websiteId: routeWebsiteId } : {}),
    };
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === undefined) delete params[key];
    });
    dispatch(fetchLeads(params));
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    filters,
    isWebsiteScoped,
    routeWebsiteId,
  ]);

  /* ── debounced search ── */
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== filters.search) dispatch(setFilters({ search }));
    }, 400);
    return () => clearTimeout(t);
  }, [search, dispatch, filters.search]);

  /* ── group leads by website ── */
  const groupedLeads = useMemo(() => {
    const groups = {};
    leadsList.forEach((lead) => {
      const key = lead.websiteId?._id || "unknown";
      if (!groups[key]) {
        groups[key] = {
          website: lead.websiteId || { name: "Unknown Source", domain: "" },
          leads: [],
        };
      }
      groups[key].leads.push(lead);
    });
    // Sort groups by count descending
    return Object.entries(groups).sort(
      (a, b) => b[1].leads.length - a[1].leads.length,
    );
  }, [leadsList]);

  /* ── website-level stats ── */
  /* ── handlers ── */
  const handleFilterChange = (key, value) => {
    if (key === "websiteId") {
      if (value) {
        navigate(
          isAdmin ? `/admin/queries/${value}` : `/marketing/queries/${value}`,
        );
      } else if (isWebsiteScoped) {
        navigate(isAdmin ? "/admin/queries" : "/marketing/queries");
      } else {
        dispatch(setFilters({ websiteId: "" }));
      }
      return;
    }

    dispatch(setFilters({ [key]: value }));
  };

  const handleClearAll = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    if (isWebsiteScoped) {
      navigate(isAdmin ? "/admin/queries" : "/marketing/queries");
      return;
    }
    dispatch(clearFilters());
  };

  const toggleSourceExpand = (key) =>
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Excel Export ── */
  const handleExport = useCallback(
    async (type = "leads") => {
      setExporting(true);
      try {
        let blob;
        let filename;

        if (type === "summary") {
          blob = await exportService.exportLeadsSummary();
          filename = `website_query_summary_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
        } else {
          const params = { ...filters };
          if (exportGrouped) params.groupByWebsite = "true";
          if (startDate) params.startDate = startDate;
          if (endDate) params.endDate = endDate;
          Object.keys(params).forEach((k) => {
            if (!params[k]) delete params[k];
          });
          blob = await exportService.exportLeads(params);
          filename = `queries_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
        }

        triggerDownload(blob, filename);
        toast.success(`Excel file downloaded successfully!`);
        setExportModalOpen(false);
      } catch (err) {
        console.error("Export error:", err);
        toast.error(err?.response?.data?.message || "Export failed");
      } finally {
        setExporting(false);
      }
    },
    [filters, exportGrouped, startDate, endDate],
  );

  const websiteOptions = websitesList.map((w) => ({
    value: w._id,
    label: `${w.name} (${w.domain})`,
  }));

  const assigneeOptions = marketingUsersList.map((u) => ({
    value: u._id,
    label: u.name,
  }));

  /* ── File upload handlers ── */
  const handleOpenUpload = (leadId) => {
    setUploadLeadId(leadId);
    setUploadFiles([]);
    setUploadModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    // Max 5 files, max 10MB each
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length < selected.length) {
      toast.error("Some files exceed 10MB limit and were removed");
    }
    setUploadFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const handleRemoveFile = (idx) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadSubmit = async () => {
    if (!uploadLeadId || uploadFiles.length === 0) return;
    setUploading(true);
    try {
      await dispatch(
        uploadLeadAttachments({ id: uploadLeadId, files: uploadFiles }),
      ).unwrap();
      toast.success(`${uploadFiles.length} file(s) uploaded successfully`);
      setUploadModalOpen(false);
      setUploadFiles([]);
      setUploadLeadId(null);
      // Refresh leads to get updated attachment data
      dispatch(
        fetchLeads({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        }),
      );
    } catch (err) {
      toast.error(err || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (leadId, attachmentId, fileName) => {
    if (!window.confirm(`Delete file "${fileName}"?`)) return;
    try {
      await dispatch(deleteLeadAttachment({ leadId, attachmentId })).unwrap();
      toast.success("File deleted");
      dispatch(
        fetchLeads({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        }),
      );
    } catch (err) {
      toast.error(err || "Failed to delete file");
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) return Image;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ── Stat helper ── */
  const totalQueries = pagination.total || leadsList.length;

  if (leadsLoading && leadsList.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* ════════════ Header ════════════ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Query Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalQueries} total queries from {websitesList.length} sources
            {unassignedCount > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                &bull; {unassignedCount} unassigned
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={
              isAdmin ? "/admin/leads/analytics" : "/marketing/leads/analytics"
            }
          >
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch(fetchLeads({ page: 1, limit: pagination.limit }));
              dispatch(fetchWebsites({ limit: 100 }));
              toast.success("Refreshed");
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ════════════ Website Source Cards ════════════ */}
      {isWebsiteScoped && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="flex items-center justify-between gap-2">
            <span>Showing queries for the selected website source.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(isAdmin ? "/admin/queries" : "/marketing/queries")
              }
            >
              Back to All Sources
            </Button>
          </div>
        </div>
      )}

      {!isWebsiteScoped && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {websitesList.map((ws) => {
            const isSelected = filters.websiteId === ws._id;
            const total = ws.stats?.totalLeads || 0;
            const thisMonth = ws.stats?.leadsThisMonth || 0;
            const dupes = ws.stats?.duplicatesDetected || 0;
            const domain = ws.domain || "";
            const badgeColor = getSourceBadgeClass(domain);
            const category = (ws.category || "other").replace(/_/g, " ");

            // Calculate a simple growth indicator
            const growthPct =
              total > 0 ? Math.round((thisMonth / total) * 100) : 0;

            return (
              <button
                key={ws._id}
                onClick={() => handleFilterChange("websiteId", ws._id)}
                className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 ring-2 ring-blue-300 dark:border-blue-400 dark:from-blue-900/30 dark:to-blue-800/20 dark:ring-blue-700"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                {/* Selected indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-blue-600 dark:bg-blue-400" />
                )}

                {/* Card header */}
                <div className="p-5 pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                          ws.isActive
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200 dark:shadow-blue-900/50 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      >
                        <Globe
                          className={`h-5 w-5 ${ws.isActive ? "text-white" : "text-gray-500"}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-gray-900 dark:text-white">
                          {ws.name}
                        </h3>
                        <span
                          className={`mt-0.5 inline-block truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}
                        >
                          {domain}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {ws.isActive ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        {category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-gray-100 mx-5 dark:bg-gray-700">
                  <div className="bg-white p-3 text-center dark:bg-gray-800">
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      {total}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Total
                    </p>
                  </div>
                  <div className="bg-white p-3 text-center dark:bg-gray-800">
                    <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                      {thisMonth}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      This Month
                    </p>
                  </div>
                  <div className="bg-white p-3 text-center dark:bg-gray-800">
                    <p
                      className={`text-2xl font-extrabold ${dupes > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`}
                    >
                      {dupes}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Duplicates
                    </p>
                  </div>
                </div>

                {/* This month progress bar */}
                <div className="mx-5 mt-3">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                    <span>This month vs total</span>
                    <span className="font-bold">{growthPct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        growthPct >= 50
                          ? "bg-green-500"
                          : growthPct >= 20
                            ? "bg-blue-500"
                            : "bg-gray-400"
                      }`}
                      style={{ width: `${Math.min(growthPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    {ws.stats?.lastLeadAt
                      ? format(new Date(ws.stats.lastLeadAt), "dd MMM yyyy")
                      : "No leads yet"}
                  </div>
                  {dupes > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                      <AlertTriangle className="h-3 w-3" />
                      {dupes} dupes
                    </div>
                  )}
                  {isSelected && (
                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Filtered
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ════════════ Search + Filters ════════════ */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queries by name, email, phone, company..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <LayoutGrid className="inline-block mr-1 h-3.5 w-3.5" />
                Cards
              </button>
              <button
                onClick={() => setViewMode("grouped")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-x border-gray-300 dark:border-gray-600 ${
                  viewMode === "grouped"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Grouped
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              label="Status"
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Source Website"
              value={filters.websiteId || ""}
              onChange={(e) => handleFilterChange("websiteId", e.target.value)}
              options={[
                { value: "", label: "All Websites" },
                ...websiteOptions,
              ]}
            />
            {isAdmin && (
              <Select
                label="Assigned To"
                value={filters.assignedTo || ""}
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <X className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════ CARDS VIEW ════════════ */}
      {viewMode === "cards" && (
        <>
          {leadsList.length === 0 ? (
            <EmptyState
              title="No queries found"
              description="Queries from your websites will appear here. Try adjusting your filters."
              icon={Globe}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {leadsList.map((lead) => {
                const domain = lead.websiteId?.domain || "";
                const badgeClass = getSourceBadgeClass(domain);
                const statusColor =
                  STATUS_COLORS[lead.status] || STATUS_COLORS.new;
                const displayName =
                  lead.fullName || lead.firstName || "Unknown";
                const initials = displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={lead._id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    {/* Top color accent based on status */}
                    <div
                      className={`h-1 w-full ${
                        lead.status === "new"
                          ? "bg-blue-500"
                          : lead.status === "contacted"
                            ? "bg-yellow-500"
                            : lead.status === "interested"
                              ? "bg-purple-500"
                              : lead.status === "qualified"
                                ? "bg-green-500"
                                : lead.status === "closed"
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                      }`}
                    />

                    {/* Card body */}
                    <div className="flex flex-1 flex-col p-4">
                      {/* Header: Avatar + Name + Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                              {displayName}
                            </h3>
                            {lead.company && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{lead.company}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor}`}
                        >
                          {lead.status}
                        </span>
                      </div>

                      {/* Contact info */}
                      <div className="mt-3 space-y-1.5">
                        {lead.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.city && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">
                              {lead.city}
                              {lead.state ? `, ${lead.state}` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Interest */}
                      {lead.productInterest && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Product Interest
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                            {lead.productInterest}
                          </p>
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Source badge + Attachments */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-gray-400" />
                          <span
                            className={`truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}
                          >
                            {lead.websiteId?.name || domain || "Unknown"}
                          </span>
                          {lead.isDuplicate && (
                            <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              DUP
                            </span>
                          )}
                        </div>
                        {lead.attachments?.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachmentViewLeadId(
                                attachmentViewLeadId === lead._id
                                  ? null
                                  : lead._id,
                              );
                            }}
                            className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                            title="View attachments"
                          >
                            <Paperclip className="h-3 w-3" />
                            {lead.attachments.length}
                          </button>
                        )}
                      </div>

                      {/* Inline attachments list (expandable) */}
                      {attachmentViewLeadId === lead._id &&
                        lead.attachments?.length > 0 && (
                          <div className="mt-2 space-y-1 rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/30">
                            {lead.attachments.map((att) => {
                              const FileIcon = getFileIcon(att.mimeType);
                              return (
                                <div
                                  key={att._id}
                                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    <span className="truncate text-gray-700 dark:text-gray-300">
                                      {att.originalName}
                                    </span>
                                    <span className="shrink-0 text-[10px] text-gray-400">
                                      {formatFileSize(att.size)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                      title="Download"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="h-3 w-3" />
                                    </a>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAttachment(
                                          lead._id,
                                          att._id,
                                          att.originalName,
                                        );
                                      }}
                                      className="rounded p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900/30">
                      <div className="flex items-center gap-3">
                        {/* Assigned to */}
                        <div className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3 text-gray-400" />
                          {lead.assignedTo?.name ? (
                            <span className="text-gray-700 dark:text-gray-300">
                              {lead.assignedTo.name}
                            </span>
                          ) : (
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              Unassigned
                            </span>
                          )}
                        </div>
                        {/* Date */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="h-3 w-3" />
                          {lead.createdAt
                            ? format(new Date(lead.createdAt), "dd MMM")
                            : "—"}
                        </div>
                      </div>
                      {/* View button + Upload */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenUpload(lead._id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                          title="Upload Files"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              isAdmin
                                ? `/admin/leads/${lead._id}`
                                : `/marketing/leads/${lead._id}`,
                            )
                          }
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          title="View Details"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════ GROUPED VIEW ════════════ */}
      {viewMode === "grouped" && (
        <div className="space-y-4">
          {groupedLeads.length === 0 ? (
            <EmptyState
              title="No queries found"
              description="Queries from your websites will appear here. Try adjusting your filters."
              icon={Globe}
            />
          ) : (
            groupedLeads.map(([key, group]) => {
              const isExpanded = expandedSources[key] !== false; // default open
              const domain = group.website?.domain || "";
              const badgeClass = getSourceBadgeClass(domain);

              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* Group header */}
                  <button
                    onClick={() => toggleSourceExpand(key)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {group.website?.name || "Unknown"}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                          >
                            {domain}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {group.leads.length} quer
                          {group.leads.length === 1 ? "y" : "ies"} in current
                          view
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden rounded-lg bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 sm:block">
                        {group.leads.length}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Group table */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                          <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                            <tr>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                S.No
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Name / Contact
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Company
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Product Interest
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Status
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Assigned To
                              </th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Date
                              </th>
                              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {group.leads.map((lead, idx) => (
                              <tr
                                key={lead._id}
                                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/20"
                              >
                                <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-500">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {lead.fullName || lead.firstName}
                                      </p>
                                      {lead.isDuplicate && (
                                        <span className="rounded bg-orange-100 px-1 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                          DUP
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {lead.email}
                                    </p>
                                    {lead.phone && (
                                      <p className="text-xs text-gray-400">
                                        {lead.phone}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                                  {lead.company || "—"}
                                </td>
                                <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                                  {lead.productInterest || "—"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      STATUS_COLORS[lead.status] ||
                                      STATUS_COLORS.new
                                    }`}
                                  >
                                    {lead.status?.charAt(0).toUpperCase() +
                                      lead.status?.slice(1)}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5 text-sm">
                                  {lead.assignedTo?.name || (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      Unassigned
                                    </span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                                  {lead.createdAt
                                    ? format(
                                        new Date(lead.createdAt),
                                        "dd MMM yyyy",
                                      )
                                    : "—"}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                                  <button
                                    onClick={() =>
                                      navigate(
                                        isAdmin
                                          ? `/admin/leads/${lead._id}`
                                          : `/marketing/leads/${lead._id}`,
                                      )
                                    }
                                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ════════════ TABLE VIEW ════════════ */}
      {viewMode === "table" && (
        <>
          {leadsList.length === 0 ? (
            <EmptyState
              title="No queries found"
              description="Queries from your websites will appear here."
              icon={Globe}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Source Website
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Product Interest
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Assigned To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leadsList.map((lead, idx) => (
                      <tr
                        key={lead._id}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {lead.fullName || lead.firstName}
                              </p>
                              {lead.isDuplicate && (
                                <span className="rounded bg-orange-100 px-1 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                  DUP
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {lead.email}
                            </p>
                            {lead.phone && (
                              <p className="text-xs text-gray-400">
                                {lead.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {lead.websiteId?.name || "Unknown"}
                            </p>
                            <span
                              className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${getSourceBadgeClass(lead.websiteId?.domain)}`}
                            >
                              {lead.websiteId?.domain || ""}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {lead.company || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {lead.productInterest || "—"}
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
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {lead.assignedTo?.name || (
                            <span className="text-amber-600 dark:text-amber-400">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {lead.createdAt
                            ? format(new Date(lead.createdAt), "dd MMM yyyy")
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              navigate(
                                isAdmin
                                  ? `/admin/leads/${lead._id}`
                                  : `/marketing/leads/${lead._id}`,
                              )
                            }
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════ Pagination ════════════ */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => dispatch(setPage(p))}
          />
        </div>
      )}

      {/* ════════════ Export Modal ════════════ */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Queries to Excel"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Download queries as a professionally formatted Excel file (.xlsx)
            that can be opened in Microsoft Excel, Google Sheets, or any
            spreadsheet application.
          </p>

          {/* Export Type Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Choose export type:
            </h4>

            {/* Option 1: All Queries */}
            <button
              onClick={() => handleExport("leads")}
              disabled={exporting}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileSpreadsheet className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Export All Queries
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {exportGrouped
                    ? "Grouped by website — each source in a separate sheet"
                    : "All queries in a single sheet"}{" "}
                  ({totalQueries} records)
                </p>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </button>

            {/* Option 2: Website Summary */}
            {isAdmin && (
              <button
                onClick={() => handleExport("summary")}
                disabled={exporting}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-green-300 hover:bg-green-50 disabled:opacity-50 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Building2 className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Website Summary Report
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Overview of all {websitesList.length} source websites with
                    query counts
                  </p>
                </div>
                <Download className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Grouping toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
            <input
              type="checkbox"
              id="groupByWebsite"
              checked={exportGrouped}
              onChange={(e) => setExportGrouped(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="groupByWebsite"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="font-medium">Group by source website</span>
              <span className="block text-xs text-gray-500">
                Creates a separate Excel sheet for each website (e.g.,
                premindustries.net, phsteels.in) + a summary sheet
              </span>
            </label>
          </div>

          {/* Current filters notice */}
          {(filters.status || filters.websiteId || filters.assignedTo) && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <Filter className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Active filters will be applied to the export. Clear filters to
                export all data.
              </p>
            </div>
          )}

          {exporting && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating Excel file...
            </div>
          )}
        </div>
      </Modal>

      {/* ════════════ File Upload Modal ════════════ */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadFiles([]);
          setUploadLeadId(null);
        }}
        title="Upload Files to Query"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Upload documents, images, or spreadsheets related to this query. Max
            5 files, 10MB each.
          </p>

          {/* Drop zone */}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-900/10">
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Click to select files
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOCX, XLSX, CSV, Images • Max 10MB each
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Selected files list */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Files ({uploadFiles.length}/5)
              </h4>
              {uploadFiles.map((file, idx) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon className="h-5 w-5 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false);
                setUploadFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploading || uploadFiles.length === 0}
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {uploadFiles.length} File
                  {uploadFiles.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QueryManagement;

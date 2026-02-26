import { createElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  Calendar,
  Star,
  Clock,
  GitMerge,
  Paperclip,
  FileText,
  Upload,
  Image,
  Download,
  RefreshCw,
  X,
  MessageSquare,
  Send,
  PhoneCall,
  Video,
  MoreVertical,
} from "lucide-react";
import {
  fetchLead,
  updateLeadStatus,
  assignLead,
  markLeadDuplicate,
  deleteLead,
  clearSelectedLead,
  uploadLeadAttachments,
  deleteLeadAttachment,
  fetchLeadRemarks,
  createLeadRemark,
  deleteLeadRemark,
} from "../../store/slices/leadsSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  Select,
  LoadingSpinner,
  Modal,
  Input,
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

const LeadDetail = ({ isAdmin = true }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    selectedLead: lead,
    isLoading,
    remarks,
    remarksLoading,
  } = useSelector((state) => state.leads);
  const { marketingUsers } = useSelector((state) => state.users);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [originalLeadId, setOriginalLeadId] = useState("");
  const [attachUploadOpen, setAttachUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [remarkContent, setRemarkContent] = useState("");
  const [remarkType, setRemarkType] = useState("note");
  const [submittingRemark, setSubmittingRemark] = useState(false);

  useEffect(() => {
    dispatch(fetchLead(id));
    dispatch(fetchLeadRemarks({ leadId: id }));
    if (isAdmin) {
      dispatch(fetchMarketingUsers());
    }
    return () => {
      dispatch(clearSelectedLead());
    };
  }, [dispatch, id, isAdmin]);

  const handleStatusUpdate = async () => {
    try {
      await dispatch(updateLeadStatus({ id, status: newStatus })).unwrap();
      toast.success("Status updated successfully");
      setStatusModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to update status");
    }
  };

  const handleAssign = async () => {
    try {
      await dispatch(
        assignLead({ id, assignToUserId: selectedUserId }),
      ).unwrap();
      toast.success("Lead assigned successfully");
      setAssignModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to assign lead");
    }
  };

  const handleMarkDuplicate = async () => {
    try {
      await dispatch(markLeadDuplicate({ id, originalLeadId })).unwrap();
      toast.success("Marked as duplicate");
      setDuplicateModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to mark as duplicate");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteLead(id)).unwrap();
      toast.success("Lead deleted successfully");
      navigate(isAdmin ? "/admin/leads" : "/marketing/leads");
    } catch (error) {
      toast.error(error || "Failed to delete lead");
    }
  };

  // ── Attachment handlers ──
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setUploadFiles((prev) => {
      const combined = [...prev, ...valid].slice(0, 5);
      if (prev.length + valid.length > 5) toast.error("Max 5 files per upload");
      return combined;
    });
    e.target.value = "";
  };

  const handleRemoveFile = (idx) =>
    setUploadFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUploadSubmit = async () => {
    if (!uploadFiles.length) return;
    setUploading(true);
    try {
      await dispatch(
        uploadLeadAttachments({ id, files: uploadFiles }),
      ).unwrap();
      toast.success("Files uploaded successfully");
      setUploadFiles([]);
      setAttachUploadOpen(false);
      dispatch(fetchLead(id));
    } catch (error) {
      toast.error(error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    try {
      await dispatch(
        deleteLeadAttachment({ leadId: id, attachmentId }),
      ).unwrap();
      toast.success("Attachment deleted");
      dispatch(fetchLead(id));
    } catch (error) {
      toast.error(error || "Failed to delete attachment");
    }
  };

  const getFileIcon = (mimeType) =>
    mimeType?.startsWith("image/") ? Image : FileText;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading || !lead) {
    return <LoadingSpinner />;
  }

  const backPath = isAdmin ? "/admin/leads" : "/marketing/leads";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={backPath}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {lead.fullName || lead.firstName}
              </h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  STATUS_COLORS[lead.status] || STATUS_COLORS.new
                }`}
              >
                {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
              </span>
              {lead.isDuplicate && (
                <span className="inline-flex items-center rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Duplicate
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Lead Score: {lead.score || 0}/100 • Created{" "}
              {lead.createdAt
                ? format(new Date(lead.createdAt), "MMM dd, yyyy 'at' hh:mm a")
                : "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(lead.status);
              setStatusModalOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Update Status
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUserId(lead.assignedTo?._id || "");
                  setAssignModalOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={lead.email || "—"} />
            <InfoRow icon={Phone} label="Phone" value={lead.phone || "—"} />
            <InfoRow
              icon={Globe}
              label="Source"
              value={`${lead.websiteId?.name || "Unknown"} (${lead.source || "—"})`}
            />
            <InfoRow
              icon={Building}
              label="Company"
              value={lead.company || "—"}
            />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={
                [lead.city, lead.state, lead.country]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <InfoRow
              icon={Star}
              label="Product Interest"
              value={lead.productInterest || "—"}
            />
          </div>
          {lead.message && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Message
              </h3>
              <p className="text-gray-900 dark:text-white">{lead.message}</p>
            </div>
          )}
          {lead.notes && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Notes
              </h3>
              <p className="text-gray-900 dark:text-white">{lead.notes}</p>
            </div>
          )}
          {lead.tags && lead.tags.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Score Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lead Score
            </h2>
            <div className="flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${((lead.score || 0) / 100) * 314} 314`}
                    strokeLinecap="round"
                    className={
                      lead.score >= 70
                        ? "text-green-500"
                        : lead.score >= 40
                          ? "text-yellow-500"
                          : "text-red-500"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {lead.score || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Assignment
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assigned To
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {lead.assignedTo?.name || (
                    <span className="text-amber-600">Unassigned</span>
                  )}
                </p>
              </div>
              {lead.assignedAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Assigned At
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(lead.assignedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact Attempts
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {lead.contactAttempts || 0}
                </p>
              </div>
              {lead.lastContactedAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last Contacted
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(lead.lastContactedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              {lead.nextFollowUpDate && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Next Follow-Up
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(lead.nextFollowUpDate), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ══ Attachments ══ */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments
              </h2>
              <button
                onClick={() => setAttachUploadOpen(true)}
                className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                title="Upload files"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
            {lead.attachments && lead.attachments.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lead.attachments.map((att) => {
                  const FIcon = getFileIcon(att.mimeType);
                  return (
                    <div
                      key={att._id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium text-gray-900 dark:text-white"
                            title={att.originalName}
                          >
                            {att.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(att.size)}
                            {att.uploadedAt && (
                              <>
                                {" "}
                                &bull;{" "}
                                {format(new Date(att.uploadedAt), "MMM dd")}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() =>
                            handleDeleteAttachment(att._id, att.originalName)
                          }
                          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No attachments yet
              </p>
            )}
          </div>

          {/* Actions for Admin */}
          {isAdmin && !lead.isDuplicate && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Admin Actions
              </h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setDuplicateModalOpen(true)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Mark as Duplicate
                </Button>
              </div>
            </div>
          )}

          {/* Previous Assignments History */}
          {lead.previousAssignments && lead.previousAssignments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Assignment History
              </h2>
              <div className="space-y-3">
                {lead.previousAssignments.map((assignment, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <div>
                      <p>{assignment.userId?.name || "Unknown"}</p>
                      {assignment.assignedAt && (
                        <p className="text-xs text-gray-400">
                          {format(
                            new Date(assignment.assignedAt),
                            "MMM dd, yyyy",
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tracking
            </h2>
            <div className="space-y-3 text-sm">
              {lead.ipAddress && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    IP Address
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {lead.ipAddress}
                  </p>
                </div>
              )}
              {lead.convertedAt && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Converted At
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(lead.convertedAt), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
              {lead.conversionValue > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Conversion Value
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    ₹{lead.conversionValue?.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ Remarks Section ══ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <MessageSquare className="h-5 w-5" />
            Remarks
            {remarks.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {remarks.length}
              </span>
            )}
          </h2>
        </div>

        {/* Add Remark Form */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex gap-2">
            {[
              { value: "note", label: "Note", icon: MessageSquare },
              { value: "call", label: "Call", icon: PhoneCall },
              { value: "email", label: "Email", icon: Mail },
              { value: "meeting", label: "Meeting", icon: Video },
              { value: "follow_up", label: "Follow Up", icon: Clock },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setRemarkType(value)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  remarkType === value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {createElement(icon, { className: "h-3 w-3" })}
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              value={remarkContent}
              onChange={(e) => setRemarkContent(e.target.value)}
              placeholder="Add a remark..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
            />
            <button
              onClick={async () => {
                if (!remarkContent.trim()) return;
                setSubmittingRemark(true);
                try {
                  await dispatch(
                    createLeadRemark({
                      leadId: id,
                      data: { content: remarkContent.trim(), type: remarkType },
                    }),
                  ).unwrap();
                  setRemarkContent("");
                  setRemarkType("note");
                  toast.success("Remark added");
                } catch (error) {
                  toast.error(error || "Failed to add remark");
                } finally {
                  setSubmittingRemark(false);
                }
              }}
              disabled={submittingRemark || !remarkContent.trim()}
              className="self-end rounded-lg bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Add Remark"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Remarks List */}
        {remarksLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Loading remarks..." />
          </div>
        ) : remarks.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No remarks yet. Add the first one above.
          </p>
        ) : (
          <div className="space-y-3">
            {remarks.map((remark) => {
              const typeConfig = {
                note: {
                  icon: MessageSquare,
                  color: "text-gray-500",
                  bg: "bg-gray-100 dark:bg-gray-700",
                },
                call: {
                  icon: PhoneCall,
                  color: "text-green-500",
                  bg: "bg-green-100 dark:bg-green-900/30",
                },
                email: {
                  icon: Mail,
                  color: "text-blue-500",
                  bg: "bg-blue-100 dark:bg-blue-900/30",
                },
                meeting: {
                  icon: Video,
                  color: "text-purple-500",
                  bg: "bg-purple-100 dark:bg-purple-900/30",
                },
                follow_up: {
                  icon: Clock,
                  color: "text-amber-500",
                  bg: "bg-amber-100 dark:bg-amber-900/30",
                },
                status_change: {
                  icon: RefreshCw,
                  color: "text-indigo-500",
                  bg: "bg-indigo-100 dark:bg-indigo-900/30",
                },
                system: {
                  icon: AlertTriangle,
                  color: "text-gray-400",
                  bg: "bg-gray-100 dark:bg-gray-700",
                },
              };
              const cfg = typeConfig[remark.type] || typeConfig.note;
              const RIcon = cfg.icon;
              return (
                <div
                  key={remark._id}
                  className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
                  >
                    <RIcon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {remark.user?.name || "Unknown"}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          {remark.type?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {remark.createdAt
                            ? format(
                                new Date(remark.createdAt),
                                "MMM dd, yyyy 'at' hh:mm a",
                              )
                            : ""}
                        </span>
                        {(remark.user?._id === lead?.assignedTo?._id ||
                          remark.user?.email === lead?.assignedTo?.email ||
                          isAdmin) &&
                          remark.type !== "status_change" &&
                          remark.type !== "system" && (
                            <button
                              onClick={async () => {
                                if (!window.confirm("Delete this remark?"))
                                  return;
                                try {
                                  await dispatch(
                                    deleteLeadRemark(remark._id),
                                  ).unwrap();
                                  toast.success("Remark deleted");
                                } catch (err) {
                                  toast.error(err || "Failed to delete remark");
                                }
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                              title="Delete remark"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {remark.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Lead Status"
      >
        <Select
          label="New Status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          options={LEAD_STATUS_OPTIONS}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusUpdate}>Update Status</Button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Lead"
      >
        <Select
          label="Assign To"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          options={[
            { value: "", label: "Select a team member" },
            ...(marketingUsers || []).map((u) => ({
              value: u._id,
              label: u.name,
            })),
          ]}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedUserId}>
            Assign
          </Button>
        </div>
      </Modal>

      {/* Mark Duplicate Modal */}
      <Modal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        title="Mark as Duplicate"
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Enter the ID of the original lead that this lead is a duplicate of.
        </p>
        <Input
          label="Original Lead ID"
          value={originalLeadId}
          onChange={(e) => setOriginalLeadId(e.target.value)}
          placeholder="Enter original lead MongoDB ID"
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDuplicateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleMarkDuplicate} disabled={!originalLeadId}>
            Mark as Duplicate
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Lead"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete{" "}
          <strong>{lead.fullName || lead.firstName}</strong>? This action cannot
          be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* ══ File Upload Modal ══ */}
      <Modal
        isOpen={attachUploadOpen}
        onClose={() => {
          setAttachUploadOpen(false);
          setUploadFiles([]);
        }}
        title="Upload Attachments"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Attach documents, images, or spreadsheets. Max 5 files, 10 MB each.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-900/10">
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Click to select files
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOCX, XLSX, CSV, Images &bull; Max 10 MB each
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected Files ({uploadFiles.length}/5)
              </h4>
              {uploadFiles.map((file, idx) => {
                const FIcon = getFileIcon(file.type);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FIcon className="h-5 w-5 shrink-0 text-gray-400" />
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

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAttachUploadOpen(false);
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

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    {createElement(icon, {
      className: "mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400",
    })}
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  </div>
);

export default LeadDetail;

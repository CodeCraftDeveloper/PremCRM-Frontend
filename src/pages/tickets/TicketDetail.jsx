import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Clock,
  Calendar,
  Building,
  MessageSquare,
  Send,
  PhoneCall,
  Video,
  MoreVertical,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Ticket,
  Globe,
  Tag,
  User,
  FileText,
} from "lucide-react";
import {
  fetchTicket,
  updateTicketStatus,
  assignTicket,
  deleteTicket,
  clearSelectedTicket,
  fetchTicketRemarks,
  createTicketRemark,
  deleteTicketRemark,
} from "../../store/slices/ticketsSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  Select,
  LoadingSpinner,
  Modal,
  Input,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_customer", label: "Waiting on Customer" },
  { value: "waiting_on_third_party", label: "Waiting on 3rd Party" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "reopened", label: "Reopened" },
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

const REMARK_TYPE_OPTIONS = [
  { value: "note", label: "Note", icon: FileText },
  { value: "call", label: "Phone Call", icon: PhoneCall },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "follow_up", label: "Follow Up", icon: Clock },
];

const REMARK_TYPE_COLORS = {
  note: "border-l-gray-400",
  call: "border-l-green-400",
  email: "border-l-blue-400",
  meeting: "border-l-purple-400",
  follow_up: "border-l-amber-400",
  status_change: "border-l-indigo-400",
  assignment_change: "border-l-cyan-400",
  escalation: "border-l-red-400",
  resolution: "border-l-emerald-400",
  system: "border-l-gray-300",
};

const TicketDetail = ({ isAdmin = true }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    selectedTicket: ticket,
    isLoading,
    remarks,
    remarksLoading,
  } = useSelector((state) => state.tickets);
  const { marketingUsers } = useSelector((state) => state.users);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [remarkContent, setRemarkContent] = useState("");
  const [remarkType, setRemarkType] = useState("note");
  const [submittingRemark, setSubmittingRemark] = useState(false);

  const prefix = isAdmin ? "/admin" : "/marketing";

  useEffect(() => {
    dispatch(fetchTicket(id));
    dispatch(fetchTicketRemarks({ ticketId: id }));
    if (isAdmin) {
      dispatch(fetchMarketingUsers());
    }
    return () => {
      dispatch(clearSelectedTicket());
    };
  }, [dispatch, id, isAdmin]);

  const handleStatusUpdate = async () => {
    try {
      await dispatch(updateTicketStatus({ id, status: newStatus })).unwrap();
      toast.success("Status updated successfully");
      setStatusModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to update status");
    }
  };

  const handleAssign = async () => {
    try {
      await dispatch(
        assignTicket({ id, assignToUserId: selectedUserId }),
      ).unwrap();
      toast.success("Ticket assigned successfully");
      setAssignModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to assign ticket");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTicket(id)).unwrap();
      toast.success("Ticket deleted successfully");
      navigate(`${prefix}/tickets`);
    } catch (error) {
      toast.error(error || "Failed to delete ticket");
    }
  };

  const handleAddRemark = async () => {
    if (!remarkContent.trim()) return;
    setSubmittingRemark(true);
    try {
      await dispatch(
        createTicketRemark({
          ticketId: id,
          data: { content: remarkContent, type: remarkType },
        }),
      ).unwrap();
      toast.success("Remark added");
      setRemarkContent("");
      setRemarkType("note");
    } catch (error) {
      toast.error(error || "Failed to add remark");
    } finally {
      setSubmittingRemark(false);
    }
  };

  const handleDeleteRemark = async (remarkId) => {
    if (!window.confirm("Delete this remark?")) return;
    try {
      await dispatch(deleteTicketRemark(remarkId)).unwrap();
      toast.success("Remark deleted");
    } catch (error) {
      toast.error(error || "Failed to delete remark");
    }
  };

  if (isLoading && !ticket) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-12 text-center">
        <Ticket className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Ticket not found
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(`${prefix}/tickets`)}
          className="mt-4"
        >
          Back to Tickets
        </Button>
      </div>
    );
  }

  const getStatusLabel = (status) =>
    STATUS_OPTIONS.find((o) => o.value === status)?.label || status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`${prefix}/tickets`)}
            className="mt-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-400">
                {ticket.ticketNumber}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] || ""}`}
              >
                {getStatusLabel(ticket.status)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority] || ""}`}
              >
                {ticket.priority}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {ticket.title}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Created {formatDistanceToNow(new Date(ticket.createdAt))} ago
              {ticket.createdBy?.name && ` by ${ticket.createdBy.name}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(ticket.status);
              setStatusModalOpen(true);
            }}
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Status
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUserId(ticket.assignedTo?._id || "");
                  setAssignModalOpen(true);
                }}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${prefix}/tickets/${id}/edit`)}
              >
                <Edit className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {ticket.description && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Timeline / Remarks */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Activity Timeline
              </h2>
            </div>

            {/* Add Remark Form */}
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <div className="flex gap-2 mb-3">
                {REMARK_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRemarkType(opt.value)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        remarkType === opt.value
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={remarkContent}
                  onChange={(e) => setRemarkContent(e.target.value)}
                  placeholder="Add a remark or note..."
                  rows={2}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
                <Button
                  onClick={handleAddRemark}
                  disabled={!remarkContent.trim() || submittingRemark}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Remarks List */}
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {remarksLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : remarks.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No activity yet. Add a remark to start the timeline.
                </div>
              ) : (
                remarks.map((remark) => (
                  <div
                    key={remark._id}
                    className={`border-l-4 p-4 ${REMARK_TYPE_COLORS[remark.type] || "border-l-gray-300"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {remark.createdBy?.name || "System"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {(remark.type || "note").replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(remark.createdAt))} ago
                        </span>
                      </div>
                      {(isAdmin ||
                        remark.createdBy?._id === ticket.createdBy?._id) && (
                        <button
                          onClick={() => handleDeleteRemark(remark._id)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {remark.content}
                    </p>
                    {remark.callDuration && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Call duration: {remark.callDuration} min
                        {remark.callOutcome && ` • ${remark.callOutcome}`}
                      </p>
                    )}
                    {remark.scheduledAt && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Scheduled:{" "}
                        {format(
                          new Date(remark.scheduledAt),
                          "MMM d, yyyy h:mm a",
                        )}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Ticket Details Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Ticket Details
            </h3>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Tag className="h-3.5 w-3.5" /> Type
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {(ticket.type || "general").replace(/_/g, " ")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Globe className="h-3.5 w-3.5" /> Channel
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {(ticket.channel || "manual").replace(/_/g, " ")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <User className="h-3.5 w-3.5" /> Assigned To
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {ticket.assignedTo?.name || "Unassigned"}
                </dd>
              </div>
              {ticket.dueDate && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" /> Due Date
                  </dt>
                  <dd
                    className={`text-sm font-medium ${
                      new Date(ticket.dueDate) < new Date()
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {format(new Date(ticket.dueDate), "MMM d, yyyy")}
                  </dd>
                </div>
              )}
              {ticket.nextFollowUpDate && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5" /> Next Follow-up
                  </dt>
                  <dd className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {format(new Date(ticket.nextFollowUpDate), "MMM d, yyyy")}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-3.5 w-3.5" /> Contact Attempts
                </dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white">
                  {ticket.contactAttempts || 0}
                </dd>
              </div>
            </dl>
          </div>

          {/* Contact Info */}
          {(ticket.contactName ||
            ticket.contactEmail ||
            ticket.contactPhone) && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                Contact Info
              </h3>
              <dl className="space-y-2">
                {ticket.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {ticket.contactName}
                    </span>
                  </div>
                )}
                {ticket.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${ticket.contactEmail}`}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {ticket.contactEmail}
                    </a>
                  </div>
                )}
                {ticket.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a
                      href={`tel:${ticket.contactPhone}`}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {ticket.contactPhone}
                    </a>
                  </div>
                )}
                {ticket.contactCompany && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {ticket.contactCompany}
                    </span>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Related Entity */}
          {ticket.relatedEntity?.entityType && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Related Entity
              </h3>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 capitalize">
                  {ticket.relatedEntity.entityType}
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {ticket.relatedEntity.entityId?.name ||
                    ticket.relatedEntity.entityId ||
                    "—"}
                </span>
              </div>
            </div>
          )}

          {/* Status History */}
          {ticket.statusHistory && ticket.statusHistory.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Status History
              </h3>
              <div className="space-y-2">
                {ticket.statusHistory
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            STATUS_COLORS[entry.to]
                              ?.replace(/bg-(\w+)-100/, "bg-$1-400")
                              .split(" ")[0] || "bg-gray-400"
                          }`}
                        />
                        <span className="text-gray-600 dark:text-gray-400">
                          {getStatusLabel(entry.from)} →{" "}
                          {getStatusLabel(entry.to)}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {formatDistanceToNow(new Date(entry.changedAt))} ago
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Ticket Status"
      >
        <div className="space-y-4">
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            label="Status"
            placeholder="Select status"
            options={STATUS_OPTIONS}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Ticket"
      >
        <div className="space-y-4">
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            label="Assign to"
            placeholder="Select a user"
            options={(Array.isArray(marketingUsers) ? marketingUsers : []).map(
              (u) => ({ value: u._id, label: `${u.name} (${u.role})` }),
            )}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedUserId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Ticket"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <strong>{ticket.ticketNumber}</strong>? This action can be reversed
            by an admin.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
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

export default TicketDetail;

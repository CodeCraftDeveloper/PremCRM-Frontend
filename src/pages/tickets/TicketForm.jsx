import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import {
  createTicket,
  updateTicket,
  fetchTicket,
  clearSelectedTicket,
} from "../../store/slices/ticketsSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
} from "../../components/ui";
import toast from "react-hot-toast";

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

const CHANNEL_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "web_form", label: "Web Form" },
  { value: "chat", label: "Chat" },
  { value: "social", label: "Social Media" },
  { value: "api", label: "API" },
  { value: "walk_in", label: "Walk In" },
];

const TicketForm = ({ isEdit = false, isAdmin = true }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedTicket: ticket, isLoading } = useSelector(
    (state) => state.tickets,
  );
  const { marketingUsers } = useSelector((state) => state.users);

  const prefix = isAdmin ? "/admin" : "/marketing";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    type: "general",
    channel: "manual",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactCompany: "",
    assignedTo: "",
    dueDate: "",
    nextFollowUpDate: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) dispatch(fetchMarketingUsers());
    if (isEdit && id) {
      dispatch(fetchTicket(id));
    }
    return () => {
      dispatch(clearSelectedTicket());
    };
  }, [dispatch, isEdit, id, isAdmin]);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && ticket) {
      setFormData({
        title: ticket.title || "",
        description: ticket.description || "",
        priority: ticket.priority || "medium",
        type: ticket.type || "general",
        channel: ticket.channel || "manual",
        contactName: ticket.contactName || "",
        contactEmail: ticket.contactEmail || "",
        contactPhone: ticket.contactPhone || "",
        contactCompany: ticket.contactCompany || "",
        assignedTo: ticket.assignedTo?._id || ticket.assignedTo || "",
        dueDate: ticket.dueDate
          ? new Date(ticket.dueDate).toISOString().split("T")[0]
          : "",
        nextFollowUpDate: ticket.nextFollowUpDate
          ? new Date(ticket.nextFollowUpDate).toISOString().split("T")[0]
          : "",
        tags: (ticket.tags || []).join(", "),
      });
    }
  }, [isEdit, ticket]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      // Clean empty strings
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") delete payload[key];
      });

      if (isEdit) {
        await dispatch(updateTicket({ id, data: payload })).unwrap();
        toast.success("Ticket updated successfully");
        navigate(`${prefix}/tickets/${id}`);
      } else {
        const result = await dispatch(createTicket(payload)).unwrap();
        toast.success("Ticket created successfully");
        navigate(`${prefix}/tickets/${result._id}`);
      }
    } catch (error) {
      toast.error(error || `Failed to ${isEdit ? "update" : "create"} ticket`);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading && !ticket) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit Ticket" : "New Ticket"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Ticket Information
          </h2>

          <div className="space-y-4">
            <Input
              label="Title *"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Brief description of the issue"
              maxLength={200}
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed description of the ticket..."
              rows={4}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                options={PRIORITY_OPTIONS}
                placeholder="Select priority"
              />

              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                options={TYPE_OPTIONS}
                placeholder="Select type"
              />

              <Select
                label="Channel"
                value={formData.channel}
                onChange={(e) => handleChange("channel", e.target.value)}
                options={CHANNEL_OPTIONS}
                placeholder="Select channel"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isAdmin && (
                <Select
                  label="Assign To"
                  value={formData.assignedTo}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
                  options={(Array.isArray(marketingUsers)
                    ? marketingUsers
                    : []
                  ).map((u) => ({
                    value: u._id,
                    label: `${u.name} (${u.role})`,
                  }))}
                  placeholder="Unassigned"
                />
              )}

              {isEdit && (
                <Select
                  label="Status"
                  value={formData.status || ticket?.status || "open"}
                  onChange={(e) => handleChange("status", e.target.value)}
                  options={STATUS_OPTIONS}
                  placeholder="Select status"
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label="Due Date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
              <Input
                type="date"
                label="Next Follow-up"
                value={formData.nextFollowUpDate}
                onChange={(e) =>
                  handleChange("nextFollowUpDate", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contact Name"
              value={formData.contactName}
              onChange={(e) => handleChange("contactName", e.target.value)}
              placeholder="John Doe"
            />
            <Input
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              placeholder="john@example.com"
            />
            <Input
              label="Contact Phone"
              value={formData.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              placeholder="+1 234 567 8900"
            />
            <Input
              label="Company"
              value={formData.contactCompany}
              onChange={(e) => handleChange("contactCompany", e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Tags
          </h2>
          <Input
            label="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            placeholder="urgent, vip, billing"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : isEdit ? "Update Ticket" : "Create Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;

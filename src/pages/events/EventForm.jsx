import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import {
  createEvent,
  updateEvent,
  fetchEvent,
  clearSelectedEvent,
} from "../../store/slices/eventsSlice";
import {
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
} from "../../components/ui";
import toast from "react-hot-toast";
import { usersService } from "../../services";

const eventSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  description: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.string().default("upcoming"),
  targetLeads: z.string().optional(),
  budget: z.string().optional(),
  tagsInput: z.string().optional(),
  image: z.string().optional(),
  heroTagline: z
    .string()
    .max(160, "Hero tagline cannot exceed 160 characters")
    .optional(),
  heroImageUrl: z
    .string()
    .max(500, "Hero image URL cannot exceed 500 characters")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#?[0-9A-Fa-f]{3,8}$/, "Use a valid hex color")
    .optional()
    .or(z.literal("")),
  registrationFieldsJson: z.string().optional(),
});

const parseRegistrationFields = (raw) => {
  if (!raw?.trim()) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Registration fields must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Registration fields JSON must be an array");
  }

  const allowedTypes = new Set([
    "text",
    "textarea",
    "select",
    "number",
    "date",
    "url",
  ]);

  return parsed.map((field, index) => {
    const key = String(field?.key || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .toLowerCase();
    const label = String(field?.label || "").trim();
    const type = String(field?.type || "text")
      .trim()
      .toLowerCase();

    if (!key || !label) {
      throw new Error(
        `Registration field at index ${index} requires both key and label`,
      );
    }

    if (!allowedTypes.has(type)) {
      throw new Error(`Registration field '${key}' has invalid type '${type}'`);
    }

    const options = Array.isArray(field?.options)
      ? field.options.map((option) => String(option).trim()).filter(Boolean)
      : [];

    return {
      key,
      label,
      type,
      required: Boolean(field?.required),
      placeholder: String(field?.placeholder || "").trim(),
      helpText: String(field?.helpText || "").trim(),
      options,
      maxLength:
        Number.isFinite(Number(field?.maxLength)) && Number(field.maxLength) > 0
          ? Number(field.maxLength)
          : undefined,
      sortOrder: Number.isFinite(Number(field?.sortOrder))
        ? Number(field.sortOrder)
        : index,
    };
  });
};

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const EventForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedEvent, isLoading } = useSelector((state) => state.events);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketingUsers, setMarketingUsers] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      startDate: "",
      endDate: "",
      status: "upcoming",
      targetLeads: "",
      budget: "",
      tagsInput: "",
      image: "",
      heroTagline: "",
      heroImageUrl: "",
      accentColor: "#06b6d4",
      registrationFieldsJson: "",
      assignedUsers: [],
    },
  });

  const assignedUsersValue = watch("assignedUsers") || [];

  useEffect(() => {
    register("assignedUsers");
  }, [register]);

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchEvent(id));
    }

    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    const loadMarketingUsers = async () => {
      try {
        const response = await usersService.getMarketingUsers();
        setMarketingUsers(response?.data?.users || []);
      } catch {
        setMarketingUsers([]);
      }
    };

    loadMarketingUsers();
  }, []);

  useEffect(() => {
    if (isEdit && selectedEvent) {
      reset({
        name: selectedEvent.name || "",
        description: selectedEvent.description || "",
        location: selectedEvent.location || "",
        startDate: selectedEvent.startDate
          ? new Date(selectedEvent.startDate).toISOString().split("T")[0]
          : "",
        endDate: selectedEvent.endDate
          ? new Date(selectedEvent.endDate).toISOString().split("T")[0]
          : "",
        status: selectedEvent.status || "upcoming",
        targetLeads: selectedEvent.targetLeads?.toString() || "",
        budget: selectedEvent.budget?.toString() || "",
        tagsInput: Array.isArray(selectedEvent.tags)
          ? selectedEvent.tags.join(", ")
          : "",
        image: selectedEvent.image || "",
        heroTagline: selectedEvent.landing?.heroTagline || "",
        heroImageUrl: selectedEvent.landing?.heroImageUrl || "",
        accentColor: selectedEvent.landing?.accentColor || "#06b6d4",
        registrationFieldsJson: selectedEvent.registrationFields?.length
          ? JSON.stringify(selectedEvent.registrationFields, null, 2)
          : "",
        assignedUsers: Array.isArray(selectedEvent.assignedUsers)
          ? selectedEvent.assignedUsers.map((user) =>
              typeof user === "string" ? user : user?._id,
            )
          : [],
      });
    }
  }, [isEdit, selectedEvent, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    let parsedRegistrationFields;
    try {
      parsedRegistrationFields = parseRegistrationFields(
        data.registrationFieldsJson,
      );
    } catch (error) {
      toast.error(error.message || "Invalid registration field configuration");
      setIsSubmitting(false);
      return;
    }

    const accentColor = data.accentColor?.trim();
    const normalizedAccentColor = accentColor
      ? accentColor.startsWith("#")
        ? accentColor
        : `#${accentColor}`
      : undefined;

    const payload = {
      name: data.name,
      description: data.description || undefined,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      targetLeads: data.targetLeads ? Number(data.targetLeads) : undefined,
      budget: data.budget ? Number(data.budget) : undefined,
      tags: data.tagsInput
        ? data.tagsInput
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
      image: data.image?.trim() || undefined,
      landing:
        data.heroTagline?.trim() ||
        data.heroImageUrl?.trim() ||
        normalizedAccentColor
          ? {
              heroTagline: data.heroTagline?.trim() || "",
              heroImageUrl: data.heroImageUrl?.trim() || "",
              accentColor: normalizedAccentColor || "",
            }
          : undefined,
      registrationFields: parsedRegistrationFields.length
        ? parsedRegistrationFields
        : undefined,
      assignedUsers: (assignedUsersValue || []).length
        ? assignedUsersValue
        : undefined,
    };

    try {
      if (isEdit) {
        await dispatch(updateEvent({ id, data: payload })).unwrap();
        toast.success("Event updated successfully");
      } else {
        await dispatch(createEvent(payload)).unwrap();
        toast.success("Event created successfully");
      }

      navigate("/admin/events");
    } catch (error) {
      toast.error(error || `Failed to ${isEdit ? "update" : "create"} event`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading event..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Event" : "Create New Event"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEdit
              ? "Update event details"
              : "Fill in the event details below"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Event Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Event Name"
                placeholder="Annual Tech Conference 2024"
                error={errors.name?.message}
                required
                {...register("name")}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                placeholder="Brief description of the event..."
                rows={3}
                error={errors.description?.message}
                {...register("description")}
              />
            </div>
            <Input
              label="Location"
              placeholder="Mumbai, India"
              error={errors.location?.message}
              required
              {...register("location")}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register("status")}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Event Dates
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              error={errors.startDate?.message}
              required
              {...register("startDate")}
            />
            <Input
              label="End Date"
              type="date"
              error={errors.endDate?.message}
              required
              {...register("endDate")}
            />
          </div>
        </div>

        {/* Targets */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Targets & Budget
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Target Leads"
              type="number"
              placeholder="100"
              error={errors.targetLeads?.message}
              {...register("targetLeads")}
            />
            <Input
              label="Budget (₹)"
              type="number"
              placeholder="50000"
              error={errors.budget?.message}
              {...register("budget")}
            />
          </div>
        </div>

        {/* Enrichment */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Enrichment
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Tags"
                placeholder="conference, b2b, premium"
                helperText="Enter comma-separated tags"
                error={errors.tagsInput?.message}
                {...register("tagsInput")}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Image URL"
                placeholder="https://example.com/event-banner.jpg"
                error={errors.image?.message}
                {...register("image")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assigned Marketing Users
              </label>
              <select
                multiple
                value={assignedUsersValue}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  );
                  setValue("assignedUsers", values, { shouldDirty: true });
                }}
                className="h-40 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {marketingUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Hold Ctrl/Cmd to select multiple users.
              </p>
            </div>
          </div>
        </div>

        {/* Public Landing & Registration */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Public Landing & Registration
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Hero Tagline"
                placeholder="Register for our flagship launch event"
                error={errors.heroTagline?.message}
                {...register("heroTagline")}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Hero Image URL"
                placeholder="https://example.com/hero-banner.jpg"
                error={errors.heroImageUrl?.message}
                {...register("heroImageUrl")}
              />
            </div>
            <Input
              label="Accent Color"
              placeholder="#06b6d4"
              error={errors.accentColor?.message}
              {...register("accentColor")}
            />
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
              Accent color applies to public register buttons and highlights.
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Custom Registration Fields (JSON)"
                rows={10}
                placeholder='[
  {
    "key": "job_title",
    "label": "Job Title",
    "type": "text",
    "required": true,
    "placeholder": "Senior Engineer"
  },
  {
    "key": "industry",
    "label": "Industry",
    "type": "select",
    "options": ["Manufacturing", "Automotive", "Other"]
  }
]'
                error={errors.registrationFieldsJson?.message}
                {...register("registrationFieldsJson")}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Supported field types: text, textarea, select, number, date,
                url.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/events")}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;

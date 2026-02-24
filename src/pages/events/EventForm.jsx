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

const eventSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  description: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.string().default("upcoming"),
  targetLeads: z.string().optional(),
  budget: z.string().optional(),
});

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

  const {
    register,
    handleSubmit,
    reset,
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
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchEvent(id));
    }

    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [dispatch, isEdit, id]);

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
      });
    }
  }, [isEdit, selectedEvent, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      name: data.name,
      description: data.description || undefined,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      targetLeads: data.targetLeads ? Number(data.targetLeads) : undefined,
      budget: data.budget ? Number(data.budget) : undefined,
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

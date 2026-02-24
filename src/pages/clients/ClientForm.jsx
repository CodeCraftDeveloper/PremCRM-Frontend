import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import {
  createClient,
  updateClient,
  fetchClient,
  clearSelectedClient,
} from "../../store/slices/clientsSlice";
import { fetchActiveEvents } from "../../store/slices/eventsSlice";
import { fetchMarketingUsers } from "../../store/slices/usersSlice";
import {
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
} from "../../components/ui";
import toast from "react-hot-toast";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  alternatePhone: z.string().optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  event: z.string().min(1, "Event is required"),
  marketingPerson: z.string().optional(),
  followUpStatus: z.string().default("new"),
  priority: z.string().default("medium"),
  nextFollowUpDate: z.string().optional(),
  estimatedValue: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

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

const ClientForm = ({ isAdmin = true, isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedClient, isLoading } = useSelector((state) => state.clients);
  const { activeEvents } = useSelector((state) => state.events);
  const { marketingUsers } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      alternatePhone: "",
      companyName: "",
      designation: "",
      event: "",
      marketingPerson: "",
      followUpStatus: "new",
      priority: "medium",
      nextFollowUpDate: "",
      estimatedValue: "",
      industry: "",
      notes: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  useEffect(() => {
    dispatch(fetchActiveEvents());
    if (isAdmin) {
      dispatch(fetchMarketingUsers());
    }

    if (isEdit && id) {
      dispatch(fetchClient(id));
    }

    return () => {
      dispatch(clearSelectedClient());
    };
  }, [dispatch, isAdmin, isEdit, id]);

  useEffect(() => {
    if (isEdit && selectedClient) {
      reset({
        name: selectedClient.name || "",
        email: selectedClient.email || "",
        phone: selectedClient.phone || "",
        alternatePhone: selectedClient.alternatePhone || "",
        companyName: selectedClient.companyName || "",
        designation: selectedClient.designation || "",
        event: selectedClient.event?._id || "",
        marketingPerson: selectedClient.marketingPerson?._id || "",
        followUpStatus: selectedClient.followUpStatus || "new",
        priority: selectedClient.priority || "medium",
        nextFollowUpDate: selectedClient.nextFollowUpDate
          ? new Date(selectedClient.nextFollowUpDate)
              .toISOString()
              .split("T")[0]
          : "",
        estimatedValue: selectedClient.estimatedValue?.toString() || "",
        industry: selectedClient.industry || "",
        notes: selectedClient.notes || "",
        street: selectedClient.address?.street || "",
        city: selectedClient.address?.city || "",
        state: selectedClient.address?.state || "",
        pincode: selectedClient.address?.pincode || "",
      });
    }
  }, [isEdit, selectedClient, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      alternatePhone: data.alternatePhone || undefined,
      companyName: data.companyName || undefined,
      designation: data.designation || undefined,
      event: data.event || undefined,
      marketingPerson: data.marketingPerson || (isAdmin ? undefined : user._id),
      followUpStatus: data.followUpStatus,
      priority: data.priority,
      nextFollowUpDate: data.nextFollowUpDate || undefined,
      estimatedValue: data.estimatedValue
        ? Number(data.estimatedValue)
        : undefined,
      industry: data.industry || undefined,
      notes: data.notes || undefined,
      address: {
        street: data.street || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pincode: data.pincode || undefined,
      },
    };

    try {
      if (isEdit) {
        await dispatch(updateClient({ id, data: payload })).unwrap();
        toast.success("Client updated successfully");
      } else {
        await dispatch(createClient(payload)).unwrap();
        toast.success("Client created successfully");
      }

      const basePath = isAdmin ? "/admin" : "/marketing";
      navigate(`${basePath}/clients`);
    } catch (error) {
      toast.error(error || `Failed to ${isEdit ? "update" : "create"} client`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const basePath = isAdmin ? "/admin" : "/marketing";

  if (isEdit && isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading client..." />
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
            {isEdit ? "Edit Client" : "Add New Client"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEdit ? "Update client information" : "Fill in the details below"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <Input
              label="Company"
              placeholder="Company Name"
              error={errors.companyName?.message}
              {...register("companyName")}
            />
            <Input
              label="Designation"
              placeholder="Manager"
              error={errors.designation?.message}
              {...register("designation")}
            />
            <Input
              label="Industry"
              placeholder="Technology"
              error={errors.industry?.message}
              {...register("industry")}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              required
              {...register("email")}
            />
            <Input
              label="Phone"
              placeholder="+91 9876543210"
              error={errors.phone?.message}
              required
              {...register("phone")}
            />
            <Input
              label="Alternate Phone"
              placeholder="+91 9876543211"
              error={errors.alternatePhone?.message}
              {...register("alternatePhone")}
            />
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Address
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Street Address"
                placeholder="123 Main St"
                error={errors.street?.message}
                {...register("street")}
              />
            </div>
            <Input
              label="City"
              placeholder="Mumbai"
              error={errors.city?.message}
              {...register("city")}
            />
            <Input
              label="State"
              placeholder="Maharashtra"
              error={errors.state?.message}
              {...register("state")}
            />
            <Input
              label="PIN Code"
              placeholder="400001"
              error={errors.pincode?.message}
              {...register("pincode")}
            />
          </div>
        </div>

        {/* CRM Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            CRM Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Event"
              options={activeEvents.map((e) => ({
                value: e._id,
                label: e.name,
              }))}
              error={errors.event?.message}
              {...register("event")}
            />
            {isAdmin && (
              <Select
                label="Assign To"
                options={marketingUsers.map((u) => ({
                  value: u._id,
                  label: u.name,
                }))}
                error={errors.marketingPerson?.message}
                {...register("marketingPerson")}
              />
            )}
            <Select
              label="Status"
              options={FOLLOW_UP_STATUS_OPTIONS}
              error={errors.followUpStatus?.message}
              {...register("followUpStatus")}
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              error={errors.priority?.message}
              {...register("priority")}
            />
            <Input
              label="Next Follow-up Date"
              type="date"
              error={errors.nextFollowUpDate?.message}
              {...register("nextFollowUpDate")}
            />
            <Input
              label="Estimated Value (INR)"
              type="number"
              placeholder="50000"
              error={errors.estimatedValue?.message}
              {...register("estimatedValue")}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Additional Notes
          </h3>
          <Textarea
            placeholder="Any additional notes about this client..."
            rows={4}
            error={errors.notes?.message}
            {...register("notes")}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${basePath}/clients`)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Update Client" : "Create Client"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createLead } from "../../store/slices/leadsSlice";
import { fetchWebsites } from "../../store/slices/websitesSlice";
import { Button, Input, Select, Textarea } from "../../components/ui";
import toast from "react-hot-toast";
import { useEffect } from "react";

const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "qualified", label: "Qualified" },
];

const LeadForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.leads);
  const { websites } = useSelector((state) => state.websites);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    productInterest: "",
    message: "",
    websiteId: "",
    status: "new",
    city: "",
    state: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    dispatch(fetchWebsites({ limit: 100 }));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.websiteId) {
      toast.error("Please select a source website");
      return;
    }

    try {
      await dispatch(createLead(formData)).unwrap();
      toast.success("Lead created successfully");
      navigate("/admin/leads");
    } catch (error) {
      toast.error(error || "Failed to create lead");
    }
  };

  const websiteOptions = [
    { value: "", label: "Select a website" },
    ...(websites || []).map((w) => ({
      value: w._id,
      label: `${w.name} (${w.domain})`,
    })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/leads"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add New Lead
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manually create a new lead in the system
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
              <Input
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Acme Corp"
              />
              <Input
                label="Product Interest"
                name="productInterest"
                value={formData.productInterest}
                onChange={handleChange}
                placeholder="e.g., Corrugated Boxes"
              />
            </div>
          </div>

          {/* Source & Status */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lead Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Source Website *"
                name="websiteId"
                value={formData.websiteId}
                onChange={handleChange}
                options={websiteOptions}
              />
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={LEAD_STATUS_OPTIONS}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Location
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Maharashtra"
              />
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="India"
              />
            </div>
          </div>

          {/* Message & Notes */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Additional Info
            </h3>
            <div className="space-y-4">
              <Textarea
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Lead's message or inquiry..."
                rows={3}
              />
              <Textarea
                label="Internal Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Internal notes about this lead..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <Link to="/admin/leads">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;

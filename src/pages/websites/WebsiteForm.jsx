import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  createWebsite,
  updateWebsite,
  fetchWebsite,
  clearSelectedWebsite,
} from "../../store/slices/websitesSlice";
import { Button, Input, Select, Textarea } from "../../components/ui";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  { value: "contact_form", label: "Contact Form" },
  { value: "landing_page", label: "Landing Page" },
  { value: "webinar", label: "Webinar" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const WebsiteForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedWebsite, isLoading } = useSelector((state) => state.websites);

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    description: "",
    category: "contact_form",
    webhookUrl: "",
    duplicateSettings: {
      checkEmail: true,
      checkPhone: true,
      checkNameEmail: false,
    },
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 5000,
    },
    ipWhitelist: "",
    isActive: true,
  });

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchWebsite(id));
    }
    return () => {
      dispatch(clearSelectedWebsite());
    };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (isEdit && selectedWebsite) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: selectedWebsite.name || "",
        domain: selectedWebsite.domain || "",
        description: selectedWebsite.description || "",
        category: selectedWebsite.category || "contact_form",
        webhookUrl: selectedWebsite.webhookUrl || "",
        duplicateSettings: {
          checkEmail: selectedWebsite.duplicateSettings?.checkEmail ?? true,
          checkPhone: selectedWebsite.duplicateSettings?.checkPhone ?? true,
          checkNameEmail:
            selectedWebsite.duplicateSettings?.checkNameEmail ?? false,
        },
        rateLimit: {
          requestsPerMinute: selectedWebsite.rateLimit?.requestsPerMinute || 60,
          requestsPerDay: selectedWebsite.rateLimit?.requestsPerDay || 5000,
        },
        ipWhitelist: (selectedWebsite.ipWhitelist || []).join(", "),
        isActive: selectedWebsite.isActive ?? true,
      });
    }
  }, [isEdit, selectedWebsite]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("duplicateSettings.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        duplicateSettings: {
          ...prev.duplicateSettings,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.startsWith("rateLimit.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        rateLimit: {
          ...prev.rateLimit,
          [field]: parseInt(value, 10) || 0,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Website name is required");
      return;
    }
    if (!formData.domain.trim()) {
      toast.error("Domain is required");
      return;
    }

    const submitData = {
      ...formData,
      ipWhitelist: formData.ipWhitelist
        ? formData.ipWhitelist
            .split(",")
            .map((ip) => ip.trim())
            .filter(Boolean)
        : [],
    };

    // Avoid backend URL validator failures for optional empty fields.
    if (!submitData.webhookUrl?.trim()) {
      delete submitData.webhookUrl;
    } else {
      submitData.webhookUrl = submitData.webhookUrl.trim();
    }

    try {
      if (isEdit) {
        await dispatch(updateWebsite({ id, data: submitData })).unwrap();
        toast.success("Website updated successfully");
      } else {
        await dispatch(createWebsite(submitData)).unwrap();
        toast.success("Website created successfully");
      }
      navigate("/admin/websites");
    } catch (error) {
      toast.error(error || `Failed to ${isEdit ? "update" : "create"} website`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/websites"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Website" : "Add New Website"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEdit
              ? "Update website configuration"
              : "Configure a new website as a lead source"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Website Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Company Website"
                required
              />
              <Input
                label="Domain *"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="example.com"
                required
              />
              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={CATEGORY_OPTIONS}
              />
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active (accepting leads)
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-4">
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this website..."
                rows={2}
              />
            </div>
          </div>

          {/* Duplicate Detection */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Duplicate Detection
            </h3>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="duplicateSettings.checkEmail"
                  checked={formData.duplicateSettings.checkEmail}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Check for duplicate emails
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="duplicateSettings.checkPhone"
                  checked={formData.duplicateSettings.checkPhone}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Check for duplicate phone numbers
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="duplicateSettings.checkNameEmail"
                  checked={formData.duplicateSettings.checkNameEmail}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Check for duplicate name + email combination
                </span>
              </label>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Rate Limiting
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Requests per Minute"
                name="rateLimit.requestsPerMinute"
                type="number"
                value={formData.rateLimit.requestsPerMinute}
                onChange={handleChange}
                min={1}
                max={10000}
              />
              <Input
                label="Requests per Day"
                name="rateLimit.requestsPerDay"
                type="number"
                value={formData.rateLimit.requestsPerDay}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          {/* Webhook */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Webhook (Optional)
            </h3>
            <Input
              label="Webhook URL"
              name="webhookUrl"
              value={formData.webhookUrl}
              onChange={handleChange}
              placeholder="https://your-service.com/webhook/leads"
            />
          </div>

          {/* IP Whitelist */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              IP Whitelist (Optional)
            </h3>
            <Input
              label="Allowed IPs (comma-separated)"
              name="ipWhitelist"
              value={formData.ipWhitelist}
              onChange={handleChange}
              placeholder="192.168.1.1, 10.0.0.0/24"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to accept requests from any IP address.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <Link to="/admin/websites">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Website"
                  : "Create Website"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WebsiteForm;

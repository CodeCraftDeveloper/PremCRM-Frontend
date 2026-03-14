import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import {
  createWebsite,
  updateWebsite,
  fetchWebsite,
  clearSelectedWebsite,
} from "../../store/slices/websitesSlice";
import { eventsService, ticketTypesService } from "../../services";
import { Button, Input, Select, Textarea } from "../../components/ui";
import FormFieldsBuilder from "./FormFieldsBuilder";
import toast from "react-hot-toast";

const CATEGORY_OPTIONS = [
  { value: "contact_form", label: "Contact Form" },
  { value: "landing_page", label: "Landing Page" },
  { value: "webinar", label: "Webinar" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const SUBMISSION_TARGET_OPTIONS = [
  { value: "lead", label: "Lead Capture" },
  { value: "event_registration", label: "Event Registration" },
];

const DEFAULT_FORM_CONFIG = {
  submissionTarget: "lead",
  eventConfig: {
    eventId: "",
    defaultTicketTypeId: "",
    defaultQuantity: 1,
    allowTicketSelection: true,
    allowQuantitySelection: true,
  },
  formTitle: "",
  formDescription: "",
  submitButtonText: "Submit",
  successMessage: "Thank you! We have received your submission.",
  redirectUrl: "",
  theme: {
    primaryColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    borderRadius: "md",
    fontSize: "base",
    labelPosition: "top",
  },
  defaultFields: {
    firstName: { show: true, required: true, label: "First Name" },
    lastName: { show: true, required: false, label: "Last Name" },
    email: { show: true, required: true, label: "Email" },
    phone: { show: true, required: false, label: "Phone" },
    company: { show: true, required: false, label: "Company" },
    message: { show: true, required: false, label: "Message" },
    country: { show: false, required: false, label: "Country" },
    city: { show: false, required: false, label: "City" },
    state: { show: false, required: false, label: "State" },
    zipCode: { show: false, required: false, label: "Zip Code" },
    productInterest: {
      show: true,
      required: false,
      label: "Product Interest",
    },
  },
};

const WebsiteForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedWebsite, isLoading } = useSelector((state) => state.websites);
  const [events, setEvents] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingTicketTypes, setLoadingTicketTypes] = useState(false);

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
    products: [],
    formFields: [],
    formConfig: {
      ...DEFAULT_FORM_CONFIG,
      eventConfig: { ...DEFAULT_FORM_CONFIG.eventConfig },
      theme: { ...DEFAULT_FORM_CONFIG.theme },
      defaultFields: { ...DEFAULT_FORM_CONFIG.defaultFields },
    },
  });
  const [newProduct, setNewProduct] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchWebsite(id));
    }
    return () => {
      dispatch(clearSelectedWebsite());
    };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await eventsService.getActive();
        const items = response?.data?.events || response?.events || [];
        if (active) setEvents(Array.isArray(items) ? items : []);
      } catch {
        if (active) setEvents([]);
      } finally {
        if (active) setLoadingEvents(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isEdit && selectedWebsite) {
      const incomingFormConfig = selectedWebsite.formConfig || {};
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
        products: selectedWebsite.products || [],
        formFields: (selectedWebsite.formFields || []).map((f) => ({
          fieldName: f.fieldName || "",
          label: f.label || "",
          type: f.type || "text",
          placeholder: f.placeholder || "",
          description: f.description || "",
          defaultValue: f.defaultValue ?? "",
          required: !!f.required,
          options: f.options || [],
          validation: f.validation || {},
          fileConfig: f.fileConfig || {
            acceptedTypes: "",
            maxSizeMB: 5,
            multiple: false,
          },
          conditionalLogic: f.conditionalLogic || {
            enabled: false,
            action: "show",
            field: "",
            operator: "equals",
            value: "",
          },
          width: f.width || "full",
          cssClass: f.cssClass || "",
          sortOrder: f.sortOrder ?? 0,
          isActive: f.isActive !== false,
        })),
        formConfig: {
          ...DEFAULT_FORM_CONFIG,
          ...incomingFormConfig,
          eventConfig: {
            ...DEFAULT_FORM_CONFIG.eventConfig,
            ...(incomingFormConfig.eventConfig || {}),
            eventId: incomingFormConfig.eventConfig?.eventId
              ? String(incomingFormConfig.eventConfig.eventId)
              : "",
            defaultTicketTypeId: incomingFormConfig.eventConfig
              ?.defaultTicketTypeId
              ? String(incomingFormConfig.eventConfig.defaultTicketTypeId)
              : "",
          },
        },
      });
    }
  }, [isEdit, selectedWebsite]);

  useEffect(() => {
    let active = true;
    const eventId = formData.formConfig?.eventConfig?.eventId;
    if (!eventId) {
      setTicketTypes([]);
      return;
    }

    const loadTicketTypes = async () => {
      setLoadingTicketTypes(true);
      try {
        const response = await ticketTypesService.getAll(eventId);
        const items =
          response?.data?.ticketTypes || response?.ticketTypes || [];
        if (active) setTicketTypes(Array.isArray(items) ? items : []);
      } catch {
        if (active) setTicketTypes([]);
      } finally {
        if (active) setLoadingTicketTypes(false);
      }
    };

    loadTicketTypes();
    return () => {
      active = false;
    };
  }, [formData.formConfig?.eventConfig?.eventId]);

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
    } else if (name.startsWith("formConfig.eventConfig.")) {
      const field = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        formConfig: {
          ...prev.formConfig,
          eventConfig: {
            ...(prev.formConfig?.eventConfig || {}),
            [field]:
              type === "checkbox"
                ? checked
                : field === "defaultQuantity"
                  ? parseInt(value, 10) || 1
                  : value,
          },
        },
      }));
    } else if (name === "formConfig.submissionTarget") {
      setFormData((prev) => ({
        ...prev,
        formConfig: {
          ...prev.formConfig,
          submissionTarget: value,
          eventConfig: {
            ...DEFAULT_FORM_CONFIG.eventConfig,
            ...(prev.formConfig?.eventConfig || {}),
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleAddProduct = () => {
    const trimmed = newProduct.trim();
    if (!trimmed) return;
    if (formData.products.includes(trimmed)) {
      toast.error("Product already exists");
      return;
    }
    if (formData.products.length >= 50) {
      toast.error("Maximum 50 products allowed");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, trimmed],
    }));
    setNewProduct("");
  };

  const handleRemoveProduct = (idx) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx),
    }));
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
    if (
      formData.formConfig?.submissionTarget === "event_registration" &&
      !formData.formConfig?.eventConfig?.eventId
    ) {
      toast.error("Please select an event for event registration forms");
      return;
    }

    const submitData = {
      ...formData,
      formConfig: {
        ...formData.formConfig,
        eventConfig: {
          ...formData.formConfig?.eventConfig,
          eventId: formData.formConfig?.eventConfig?.eventId || null,
          defaultTicketTypeId:
            formData.formConfig?.eventConfig?.defaultTicketTypeId || null,
          defaultQuantity:
            parseInt(formData.formConfig?.eventConfig?.defaultQuantity, 10) ||
            1,
        },
      },
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
              : "Configure a new website form for leads or events"}
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
                    Active (accepting submissions)
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

          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Submission Target
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Form Purpose"
                name="formConfig.submissionTarget"
                value={formData.formConfig?.submissionTarget || "lead"}
                onChange={handleChange}
                options={SUBMISSION_TARGET_OPTIONS}
              />
            </div>

            {formData.formConfig?.submissionTarget === "event_registration" && (
              <div className="mt-4 space-y-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label={loadingEvents ? "Event (loading...)" : "Event *"}
                    name="formConfig.eventConfig.eventId"
                    value={formData.formConfig?.eventConfig?.eventId || ""}
                    onChange={handleChange}
                    options={[
                      { value: "", label: "Select an event" },
                      ...events.map((event) => ({
                        value: event._id,
                        label: event.name,
                      })),
                    ]}
                  />
                  <Select
                    label={
                      loadingTicketTypes
                        ? "Default Ticket (loading...)"
                        : "Default Ticket Type"
                    }
                    name="formConfig.eventConfig.defaultTicketTypeId"
                    value={
                      formData.formConfig?.eventConfig?.defaultTicketTypeId ||
                      ""
                    }
                    onChange={handleChange}
                    options={[
                      { value: "", label: "Auto-select first active ticket" },
                      ...ticketTypes.map((ticket) => ({
                        value: ticket._id,
                        label: `${ticket.name} (${ticket.price || 0} ${ticket.currency || "INR"})`,
                      })),
                    ]}
                  />
                  <Input
                    label="Default Quantity"
                    name="formConfig.eventConfig.defaultQuantity"
                    type="number"
                    min={1}
                    max={20}
                    value={
                      formData.formConfig?.eventConfig?.defaultQuantity || 1
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      name="formConfig.eventConfig.allowTicketSelection"
                      checked={
                        formData.formConfig?.eventConfig
                          ?.allowTicketSelection ?? true
                      }
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Allow visitor to choose ticket type
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      name="formConfig.eventConfig.allowQuantitySelection"
                      checked={
                        formData.formConfig?.eventConfig
                          ?.allowQuantitySelection ?? true
                      }
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Allow visitor to change quantity
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Products / Services */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Products / Services
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Add your products or services. These will appear as a dropdown in
              lead forms so visitors can select what they&apos;re interested in.
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. Enterprise Plan, Consulting, Web Design..."
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProduct();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddProduct}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>

            {formData.products.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.products.map((product, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {product}
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(idx)}
                      className="ml-1 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {formData.products.length === 0 && (
              <p className="mt-2 text-sm italic text-gray-400 dark:text-gray-500">
                No products added yet. The &quot;Product Interest&quot; field
                will be a free-text input in lead forms.
              </p>
            )}
          </div>

          {/* Custom Form Fields Builder */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <FormFieldsBuilder
              fields={formData.formFields}
              onChange={(updatedFields) =>
                setFormData((prev) => ({ ...prev, formFields: updatedFields }))
              }
              formConfig={formData.formConfig}
              onFormConfigChange={(updatedConfig) =>
                setFormData((prev) => ({ ...prev, formConfig: updatedConfig }))
              }
            />
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

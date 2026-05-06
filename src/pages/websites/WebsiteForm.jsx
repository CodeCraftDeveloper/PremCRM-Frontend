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

const BLOG_ELEMENT_TAG_OPTIONS = [
  { value: "article", label: "article" },
  { value: "section", label: "section" },
  { value: "div", label: "div" },
  { value: "span", label: "span" },
  { value: "main", label: "main" },
  { value: "header", label: "header" },
  { value: "footer", label: "footer" },
  { value: "aside", label: "aside" },
  { value: "figure", label: "figure" },
  { value: "figcaption", label: "figcaption" },
  { value: "picture", label: "picture" },
  { value: "h1", label: "h1" },
  { value: "h2", label: "h2" },
  { value: "h3", label: "h3" },
  { value: "h4", label: "h4" },
  { value: "h5", label: "h5" },
  { value: "h6", label: "h6" },
  { value: "p", label: "p" },
  { value: "small", label: "small" },
  { value: "strong", label: "strong" },
  { value: "em", label: "em" },
  { value: "time", label: "time" },
  { value: "img", label: "img" },
];

const BLOG_TAG_SUGGESTIONS_ID = "blog-tag-suggestions";

const BLOG_TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
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

const DEFAULT_BLOG_CONFIG = {
  listing: {
    visibleFields: {
      title: true,
      description: true,
      category: true,
      author: true,
      publishedAt: true,
      readingTime: true,
      featuredImage: true,
      tags: true,
    },
    elements: {
      containerTag: "article",
      titleTag: "h3",
      descriptionTag: "p",
      categoryTag: "span",
      metaTag: "div",
      imageTag: "img",
    },
    styles: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      accentColor: "#4f46e5",
      backgroundImage: "",
      textAlign: "left",
    },
  },
  detail: {
    visibleFields: {
      title: true,
      content: true,
      category: true,
      author: true,
      publishedAt: true,
      featuredImage: true,
      tags: true,
    },
    elements: {
      containerTag: "article",
      titleTag: "h1",
      contentTag: "div",
      categoryTag: "span",
      metaTag: "div",
      imageTag: "img",
    },
    styles: {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      accentColor: "#4f46e5",
      backgroundImage: "",
      textAlign: "left",
    },
  },
};

const mergeBlogConfig = (incoming = {}) => ({
  listing: {
    visibleFields: {
      ...DEFAULT_BLOG_CONFIG.listing.visibleFields,
      ...(incoming.listing?.visibleFields || {}),
    },
    elements: {
      ...DEFAULT_BLOG_CONFIG.listing.elements,
      ...(incoming.listing?.elements || {}),
    },
    styles: {
      ...DEFAULT_BLOG_CONFIG.listing.styles,
      ...(incoming.listing?.styles || {}),
    },
  },
  detail: {
    visibleFields: {
      ...DEFAULT_BLOG_CONFIG.detail.visibleFields,
      ...(incoming.detail?.visibleFields || {}),
    },
    elements: {
      ...DEFAULT_BLOG_CONFIG.detail.elements,
      ...(incoming.detail?.elements || {}),
    },
    styles: {
      ...DEFAULT_BLOG_CONFIG.detail.styles,
      ...(incoming.detail?.styles || {}),
    },
  },
});

const updateNestedValue = (target, path, value) => {
  const [head, ...rest] = path;
  if (!head) return target;

  if (rest.length === 0) {
    return {
      ...target,
      [head]: value,
    };
  }

  return {
    ...target,
    [head]: updateNestedValue(target?.[head] || {}, rest, value),
  };
};

const BlogTagInput = ({ label, name, value, onChange, placeholder }) => (
  <Input
    label={label}
    name={name}
    value={value}
    onChange={onChange}
    list={BLOG_TAG_SUGGESTIONS_ID}
    placeholder={placeholder}
    helperText="Type any valid HTML tag or choose one of the suggested tags."
  />
);

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
    blogConfig: mergeBlogConfig(),
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
        blogConfig: mergeBlogConfig(selectedWebsite.blogConfig),
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
    } else if (name.startsWith("blogConfig.")) {
      const path = name.split(".").slice(1);
      setFormData((prev) => ({
        ...prev,
        blogConfig: updateNestedValue(
          prev.blogConfig,
          path,
          type === "checkbox" ? checked : value,
        ),
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

          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Blog Display Settings
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Control which blog fields external websites should show and how
              Orbinest suggests they render cards and detail pages.
            </p>
            <datalist id={BLOG_TAG_SUGGESTIONS_ID}>
              {BLOG_ELEMENT_TAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} />
              ))}
            </datalist>

            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Listing Fields
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(formData.blogConfig.listing.visibleFields).map(
                    ([field, enabled]) => (
                      <label
                        key={field}
                        className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="checkbox"
                          name={`blogConfig.listing.visibleFields.${field}`}
                          checked={enabled}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{field}</span>
                      </label>
                    ),
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Use any HTML tag you want for external rendering. The
                  suggestions are just shortcuts.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <BlogTagInput
                    label="Card Container Tag"
                    name="blogConfig.listing.elements.containerTag"
                    value={formData.blogConfig.listing.elements.containerTag}
                    onChange={handleChange}
                    placeholder="article"
                  />
                  <BlogTagInput
                    label="Title Tag"
                    name="blogConfig.listing.elements.titleTag"
                    value={formData.blogConfig.listing.elements.titleTag}
                    onChange={handleChange}
                    placeholder="h3"
                  />
                  <BlogTagInput
                    label="Description Tag"
                    name="blogConfig.listing.elements.descriptionTag"
                    value={formData.blogConfig.listing.elements.descriptionTag}
                    onChange={handleChange}
                    placeholder="p"
                  />
                  <BlogTagInput
                    label="Category Tag"
                    name="blogConfig.listing.elements.categoryTag"
                    value={formData.blogConfig.listing.elements.categoryTag}
                    onChange={handleChange}
                    placeholder="span"
                  />
                  <BlogTagInput
                    label="Meta Tag"
                    name="blogConfig.listing.elements.metaTag"
                    value={formData.blogConfig.listing.elements.metaTag}
                    onChange={handleChange}
                    placeholder="div"
                  />
                  <BlogTagInput
                    label="Image Tag"
                    name="blogConfig.listing.elements.imageTag"
                    value={formData.blogConfig.listing.elements.imageTag}
                    onChange={handleChange}
                    placeholder="img"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Card Background Color"
                    name="blogConfig.listing.styles.backgroundColor"
                    value={formData.blogConfig.listing.styles.backgroundColor}
                    onChange={handleChange}
                    placeholder="#ffffff"
                  />
                  <Input
                    label="Card Text Color"
                    name="blogConfig.listing.styles.textColor"
                    value={formData.blogConfig.listing.styles.textColor}
                    onChange={handleChange}
                    placeholder="#111827"
                  />
                  <Input
                    label="Accent Color"
                    name="blogConfig.listing.styles.accentColor"
                    value={formData.blogConfig.listing.styles.accentColor}
                    onChange={handleChange}
                    placeholder="#4f46e5"
                  />
                  <Select
                    label="Text Align"
                    name="blogConfig.listing.styles.textAlign"
                    value={formData.blogConfig.listing.styles.textAlign}
                    onChange={handleChange}
                    options={BLOG_TEXT_ALIGN_OPTIONS}
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Card Background Image URL"
                    name="blogConfig.listing.styles.backgroundImage"
                    value={formData.blogConfig.listing.styles.backgroundImage}
                    onChange={handleChange}
                    placeholder="https://example.com/blog-card-bg.jpg"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Detail Page Fields
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(formData.blogConfig.detail.visibleFields).map(
                    ([field, enabled]) => (
                      <label
                        key={field}
                        className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="checkbox"
                          name={`blogConfig.detail.visibleFields.${field}`}
                          checked={enabled}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="capitalize">{field}</span>
                      </label>
                    ),
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Detail pages can use a completely different set of tags from
                  listing cards if the external website needs it.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <BlogTagInput
                    label="Detail Container Tag"
                    name="blogConfig.detail.elements.containerTag"
                    value={formData.blogConfig.detail.elements.containerTag}
                    onChange={handleChange}
                    placeholder="article"
                  />
                  <BlogTagInput
                    label="Detail Title Tag"
                    name="blogConfig.detail.elements.titleTag"
                    value={formData.blogConfig.detail.elements.titleTag}
                    onChange={handleChange}
                    placeholder="h1"
                  />
                  <BlogTagInput
                    label="Content Tag"
                    name="blogConfig.detail.elements.contentTag"
                    value={formData.blogConfig.detail.elements.contentTag}
                    onChange={handleChange}
                    placeholder="div"
                  />
                  <BlogTagInput
                    label="Category Tag"
                    name="blogConfig.detail.elements.categoryTag"
                    value={formData.blogConfig.detail.elements.categoryTag}
                    onChange={handleChange}
                    placeholder="span"
                  />
                  <BlogTagInput
                    label="Meta Tag"
                    name="blogConfig.detail.elements.metaTag"
                    value={formData.blogConfig.detail.elements.metaTag}
                    onChange={handleChange}
                    placeholder="div"
                  />
                  <BlogTagInput
                    label="Image Tag"
                    name="blogConfig.detail.elements.imageTag"
                    value={formData.blogConfig.detail.elements.imageTag}
                    onChange={handleChange}
                    placeholder="img"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Detail Background Color"
                    name="blogConfig.detail.styles.backgroundColor"
                    value={formData.blogConfig.detail.styles.backgroundColor}
                    onChange={handleChange}
                    placeholder="#ffffff"
                  />
                  <Input
                    label="Detail Text Color"
                    name="blogConfig.detail.styles.textColor"
                    value={formData.blogConfig.detail.styles.textColor}
                    onChange={handleChange}
                    placeholder="#111827"
                  />
                  <Input
                    label="Detail Accent Color"
                    name="blogConfig.detail.styles.accentColor"
                    value={formData.blogConfig.detail.styles.accentColor}
                    onChange={handleChange}
                    placeholder="#4f46e5"
                  />
                  <Select
                    label="Detail Text Align"
                    name="blogConfig.detail.styles.textAlign"
                    value={formData.blogConfig.detail.styles.textAlign}
                    onChange={handleChange}
                    options={BLOG_TEXT_ALIGN_OPTIONS}
                  />
                </div>

                <div className="mt-4">
                  <Input
                    label="Detail Background Image URL"
                    name="blogConfig.detail.styles.backgroundImage"
                    value={formData.blogConfig.detail.styles.backgroundImage}
                    onChange={handleChange}
                    placeholder="https://example.com/blog-detail-bg.jpg"
                  />
                </div>
              </div>
            </div>
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

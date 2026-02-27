import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  Search,
  Filter,
  FileText,
  Globe,
  Lock,
  Code,
  BarChart3,
  Calendar,
  Loader2,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import crmApi from "../../services/crmApi";

const BUILT_IN_MODULES = [
  { apiName: "contacts", label: "Contacts" },
  { apiName: "accounts", label: "Accounts" },
  { apiName: "deals", label: "Deals" },
  { apiName: "activities", label: "Activities" },
  { apiName: "leads", label: "Leads" },
];

const FORM_TYPE_CONFIG = {
  public: {
    icon: Globe,
    label: "Public",
    color: "text-green-400 bg-green-900/30 border-green-700",
  },
  internal: {
    icon: Lock,
    label: "Internal",
    color: "text-blue-400 bg-blue-900/30 border-blue-700",
  },
  embedded: {
    icon: Code,
    label: "Embedded",
    color: "text-purple-400 bg-purple-900/30 border-purple-700",
  },
};

// ── Form Definition Editor Modal ────────────────────────
function FormEditorModal({ formDef, onClose, onSaved }) {
  const isEdit = Boolean(formDef?._id);
  const [moduleFields, setModuleFields] = useState([]);
  const [form, setForm] = useState({
    name: formDef?.name || "",
    apiName: formDef?.apiName || "",
    description: formDef?.description || "",
    moduleApiName: formDef?.moduleApiName || "contacts",
    formType: formDef?.formType || "internal",
    fieldMappings: formDef?.fieldMappings || [],
    settings: {
      submitLabel: formDef?.settings?.submitLabel || "Submit",
      successMessage:
        formDef?.settings?.successMessage ||
        "Thank you! Your submission has been received.",
      redirectUrl: formDef?.settings?.redirectUrl || "",
      theme: formDef?.settings?.theme || "dark",
      captchaEnabled: formDef?.settings?.captchaEnabled || false,
    },
    isActive: formDef?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1: basics, 2: fields, 3: settings

  // Load custom fields for selected module
  useEffect(() => {
    crmApi
      .getFieldsByModule(form.moduleApiName)
      .then(setModuleFields)
      .catch(() => {});
  }, [form.moduleApiName]);

  // Auto-generate apiName
  useEffect(() => {
    if (!isEdit && form.name && !formDef?.apiName) {
      const auto = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+$/, "")
        .substring(0, 49);
      setForm((prev) => ({ ...prev, apiName: auto }));
    }
  }, [form.name, isEdit, formDef?.apiName]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  };

  const toggleFieldMapping = (field) => {
    setForm((prev) => {
      const existing = prev.fieldMappings.findIndex(
        (fm) => fm.fieldApiName === field.apiName,
      );
      if (existing > -1) {
        return {
          ...prev,
          fieldMappings: prev.fieldMappings.filter((_, i) => i !== existing),
        };
      }
      return {
        ...prev,
        fieldMappings: [
          ...prev.fieldMappings,
          {
            label: field.label,
            fieldApiName: field.apiName,
            isRequired: field.isRequired || false,
            placeholder: field.placeholder || "",
            helpText: field.helpText || "",
            sortOrder: prev.fieldMappings.length,
            isHidden: false,
            defaultValue: "",
          },
        ],
      };
    });
  };

  const updateFieldMapping = (index, key, value) => {
    setForm((prev) => {
      const mappings = [...prev.fieldMappings];
      mappings[index] = { ...mappings[index], [key]: value };
      return { ...prev, fieldMappings: mappings };
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.apiName || !form.moduleApiName) {
      toast.error("Name, API name, and module are required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await crmApi.updateForm(formDef._id, form);
        toast.success("Form updated");
      } else {
        await crmApi.createForm(form);
        toast.success("Form created");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Form" : "Create Form Definition"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { n: 1, label: "Basics" },
            { n: 2, label: "Fields" },
            { n: 3, label: "Settings" },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => setStep(n)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                step === n
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {n}. {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Basics */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Contact Inquiry Form"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    API Name *
                  </label>
                  <input
                    type="text"
                    value={form.apiName}
                    onChange={(e) => handleChange("apiName", e.target.value)}
                    disabled={isEdit}
                    placeholder="contact_inquiry"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Module *
                  </label>
                  <select
                    value={form.moduleApiName}
                    onChange={(e) =>
                      handleChange("moduleApiName", e.target.value)
                    }
                    disabled={isEdit}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 disabled:opacity-50"
                  >
                    {BUILT_IN_MODULES.map((m) => (
                      <option key={m.apiName} value={m.apiName}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Form Type *
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(FORM_TYPE_CONFIG).map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleChange("formType", type)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            form.formType === type
                              ? config.color
                              : "border-slate-600 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          <Icon size={14} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Fields */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Select custom fields to include in this form. Toggle and
                configure each field below.
              </p>

              {moduleFields.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No custom fields defined for this module.</p>
                  <p className="text-xs mt-1">
                    Create custom fields first in the Custom Fields Manager.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {moduleFields.map((field) => {
                    const mappingIdx = form.fieldMappings.findIndex(
                      (fm) => fm.fieldApiName === field.apiName,
                    );
                    const isSelected = mappingIdx > -1;
                    const mapping = isSelected
                      ? form.fieldMappings[mappingIdx]
                      : null;

                    return (
                      <div
                        key={field.apiName || field._id}
                        className={`rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? "border-blue-600 bg-blue-900/20"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleFieldMapping(field)}
                              className={`transition-colors ${isSelected ? "text-blue-400" : "text-slate-500"}`}
                            >
                              {isSelected ? (
                                <ToggleRight size={22} />
                              ) : (
                                <ToggleLeft size={22} />
                              )}
                            </button>
                            <div>
                              <span className="text-white text-sm font-medium">
                                {field.label}
                              </span>
                              <span className="text-xs text-slate-500 ml-2">
                                {field.apiName}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 capitalize">
                            {field.fieldType}
                          </span>
                        </div>

                        {/* Mapping overrides */}
                        {isSelected && mapping && (
                          <div className="mt-3 ml-9 grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-slate-400">
                                Override Label
                              </label>
                              <input
                                type="text"
                                value={mapping.label || ""}
                                onChange={(e) =>
                                  updateFieldMapping(
                                    mappingIdx,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                placeholder={field.label}
                                className="w-full mt-0.5 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400">
                                Placeholder
                              </label>
                              <input
                                type="text"
                                value={mapping.placeholder || ""}
                                onChange={(e) =>
                                  updateFieldMapping(
                                    mappingIdx,
                                    "placeholder",
                                    e.target.value,
                                  )
                                }
                                className="w-full mt-0.5 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-end gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.isRequired || false}
                                  onChange={(e) =>
                                    updateFieldMapping(
                                      mappingIdx,
                                      "isRequired",
                                      e.target.checked,
                                    )
                                  }
                                  className="h-3.5 w-3.5 rounded"
                                />
                                Required
                              </label>
                              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping.isHidden || false}
                                  onChange={(e) =>
                                    updateFieldMapping(
                                      mappingIdx,
                                      "isHidden",
                                      e.target.checked,
                                    )
                                  }
                                  className="h-3.5 w-3.5 rounded"
                                />
                                Hidden
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Submit Button Text
                  </label>
                  <input
                    type="text"
                    value={form.settings.submitLabel}
                    onChange={(e) =>
                      handleSettingChange("submitLabel", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Theme
                  </label>
                  <select
                    value={form.settings.theme}
                    onChange={(e) =>
                      handleSettingChange("theme", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Success Message
                </label>
                <textarea
                  value={form.settings.successMessage}
                  onChange={(e) =>
                    handleSettingChange("successMessage", e.target.value)
                  }
                  rows={2}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Redirect URL (optional)
                </label>
                <input
                  type="url"
                  value={form.settings.redirectUrl}
                  onChange={(e) =>
                    handleSettingChange("redirectUrl", e.target.value)
                  }
                  placeholder="https://example.com/thank-you"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <button
                    type="button"
                    onClick={() =>
                      handleSettingChange(
                        "captchaEnabled",
                        !form.settings.captchaEnabled,
                      )
                    }
                    className={`transition-colors ${
                      form.settings.captchaEnabled
                        ? "text-blue-400"
                        : "text-slate-500"
                    }`}
                  >
                    {form.settings.captchaEnabled ? (
                      <ToggleRight size={22} />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                  Enable CAPTCHA
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => handleChange("isActive", !form.isActive)}
                    className={`transition-colors ${
                      form.isActive ? "text-green-400" : "text-slate-500"
                    }`}
                  >
                    {form.isActive ? (
                      <ToggleRight size={22} />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                  Active
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-slate-700">
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : isEdit ? "Update" : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Forms Manager Page ─────────────────────────────
export default function FormBuilderPage() {
  const authUser = useSelector((state) => state.auth.user);
  const tenantSlug = authUser?.tenant?.slug || authUser?.tenantSlug || "";
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filterModule) params.moduleApiName = filterModule;
      if (filterType) params.formType = filterType;
      if (search) params.search = search;
      const result = await crmApi.listForms(params);
      setForms(result.list || []);
    } catch {
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, [filterModule, filterType, search]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleDelete = async (formId) => {
    if (!confirm("Delete this form? This action can be reversed.")) return;
    try {
      await crmApi.deleteForm(formId);
      toast.success("Form deleted");
      fetchForms();
    } catch {
      toast.error("Failed to delete form");
    }
  };

  const handleDuplicate = async (formId) => {
    try {
      await crmApi.duplicateForm(formId);
      toast.success("Form duplicated");
      fetchForms();
    } catch {
      toast.error("Failed to duplicate form");
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingForm(null);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingForm(null);
    fetchForms();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-blue-400" />
            Form Builder
          </h1>
          <p className="text-slate-400 mt-1">
            Create public and internal forms for CRM modules
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} />
          New Form
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search forms..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500"
        >
          <option value="">All Modules</option>
          {BUILT_IN_MODULES.map((m) => (
            <option key={m.apiName} value={m.apiName}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="embedded">Embedded</option>
        </select>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileText size={48} className="mb-3 opacity-20" />
          <p className="text-lg font-medium">No forms yet</p>
          <p className="text-sm mt-1">Create your first form definition</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => {
            const typeConfig =
              FORM_TYPE_CONFIG[form.formType] || FORM_TYPE_CONFIG.internal;
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={form._id}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {form.name}
                    </h3>
                    <code className="text-xs text-slate-500">
                      {form.apiName}
                    </code>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.color}`}
                  >
                    <TypeIcon size={10} />
                    {typeConfig.label}
                  </span>
                </div>

                {form.description && (
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {form.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="capitalize">{form.moduleApiName}</span>
                  <span className="flex items-center gap-1">
                    <BarChart3 size={10} />
                    {form.submissionCount || 0} submissions
                  </span>
                  {form.lastSubmissionAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(form.lastSubmissionAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 border-t border-slate-700 pt-3">
                  <button
                    onClick={() => handleEdit(form)}
                    className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(form._id)}
                    className="p-1.5 rounded text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 transition-colors"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  {form.formType === "public" && (
                    <button
                      onClick={() =>
                        toast.success(
                          `Public URL: /forms/${tenantSlug}/${form.apiName}`,
                        )
                      }
                      className="p-1.5 rounded text-slate-400 hover:text-green-400 hover:bg-green-900/20 transition-colors"
                      title="Preview public form"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={() => handleDelete(form._id)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Editor Modal */}
      {showModal && (
        <FormEditorModal
          formDef={editingForm}
          onClose={() => {
            setShowModal(false);
            setEditingForm(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

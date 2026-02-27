import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  Filter,
  ChevronDown,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Hash,
  Type,
  Calendar,
  Mail,
  Phone,
  Link,
  List,
  CheckSquare,
  AlignLeft,
  DollarSign,
  Percent,
  Clock,
  Users,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Database,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import crmApi from "../../services/crmApi";

// ── Phase 1 Field Types (strict whitelist) ──────────────
const PHASE1_FIELD_TYPES = [
  "text",
  "number",
  "date",
  "boolean",
  "select",
  "multiselect",
  "currency",
  "reference",
];

// ── Field Type Metadata ─────────────────────────────────
const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text", icon: Type },
  { value: "textarea", label: "Text Area", icon: AlignLeft },
  { value: "number", label: "Number", icon: Hash },
  { value: "currency", label: "Currency", icon: DollarSign },
  { value: "percent", label: "Percent", icon: Percent },
  { value: "date", label: "Date", icon: Calendar },
  { value: "datetime", label: "Date & Time", icon: Clock },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "url", label: "URL", icon: Link },
  { value: "boolean", label: "Checkbox", icon: CheckSquare },
  { value: "select", label: "Dropdown", icon: List },
  { value: "multiselect", label: "Multi-Select", icon: List },
  { value: "reference", label: "Reference", icon: ExternalLink },
  { value: "lookup", label: "Lookup", icon: Eye },
  { value: "user_lookup", label: "User Lookup", icon: Users },
  { value: "auto_number", label: "Auto Number", icon: Hash },
];

const BUILT_IN_MODULES = [
  { apiName: "contacts", label: "Contacts" },
  { apiName: "accounts", label: "Accounts" },
  { apiName: "deals", label: "Deals" },
  { apiName: "activities", label: "Activities" },
  { apiName: "leads", label: "Leads" },
];

const getFieldIcon = (fieldType) => {
  const match = FIELD_TYPE_OPTIONS.find((ft) => ft.value === fieldType);
  return match?.icon || Type;
};

// ── Field Form Modal ────────────────────────────────────
function FieldFormModal({ field, moduleApiName, onClose, onSaved }) {
  const isEdit = Boolean(field?._id);
  const [form, setForm] = useState({
    label: field?.label || "",
    apiName: field?.apiName || "",
    fieldType: field?.fieldType || "text",
    isRequired: field?.isRequired || false,
    isUnique: field?.isUnique || false,
    placeholder: field?.placeholder || "",
    helpText: field?.helpText || "",
    defaultValue: field?.defaultValue || "",
    isVisibleInList: field?.isVisibleInList ?? true,
    isVisibleInDetail: field?.isVisibleInDetail ?? true,
    isFilterable: field?.isFilterable ?? false,
    isSearchable: field?.isSearchable ?? false,
    isIndexed: field?.isIndexed ?? false,
    options: field?.options || [{ label: "", value: "", color: "" }],
    numberConfig: field?.numberConfig || { min: null, max: null, precision: 2 },
    textConfig: field?.textConfig || {
      minLength: null,
      maxLength: null,
      pattern: "",
    },
    lookupConfig: field?.lookupConfig || {
      targetModule: "",
      displayField: "name",
    },
    referenceConfig: field?.referenceConfig || {
      targetModule: "",
      displayField: "name",
    },
    autoNumberConfig: field?.autoNumberConfig || { prefix: "", startFrom: 1 },
    validation: field?.validation || {
      min: null,
      max: null,
      regex: "",
      regexMessage: "",
      conditionalRequired: [],
    },
    visibleToRoles: field?.visibleToRoles || [],
  });
  const [saving, setSaving] = useState(false);

  // Auto-generate apiName from label
  useEffect(() => {
    if (!isEdit && form.label && !form.apiName) {
      const auto =
        "cf_" +
        form.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/_+$/, "")
          .substring(0, 47);
      setForm((prev) => ({ ...prev, apiName: auto }));
    }
  }, [form.label, form.apiName, isEdit]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOptionChange = (index, key, value) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], [key]: value };
      // Auto-generate value from label
      if (key === "label" && !options[index].value) {
        options[index].value = value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      }
      return { ...prev, options };
    });
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { label: "", value: "", color: "" }],
    }));
  };

  const removeOption = (index) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        moduleApiName,
      };
      // Only include type-specific config
      if (!["select", "multiselect"].includes(form.fieldType)) {
        delete payload.options;
      } else {
        payload.options = payload.options.filter((o) => o.label && o.value);
      }
      if (!["number", "currency", "percent"].includes(form.fieldType)) {
        delete payload.numberConfig;
      }
      if (!["text", "textarea"].includes(form.fieldType)) {
        delete payload.textConfig;
      }
      if (!["lookup", "user_lookup"].includes(form.fieldType)) {
        delete payload.lookupConfig;
      }
      if (form.fieldType !== "reference") {
        delete payload.referenceConfig;
      }
      if (form.fieldType !== "auto_number") {
        delete payload.autoNumberConfig;
      }
      // Clean up empty validation
      if (payload.validation) {
        const v = payload.validation;
        if (
          !v.min &&
          !v.max &&
          !v.regex &&
          (!v.conditionalRequired || v.conditionalRequired.length === 0)
        ) {
          delete payload.validation;
        } else {
          if (!v.regex) {
            delete v.regex;
            delete v.regexMessage;
          }
          if (v.conditionalRequired?.length === 0) delete v.conditionalRequired;
        }
      }
      // Clean empty visibleToRoles
      if (!payload.visibleToRoles?.length) {
        delete payload.visibleToRoles;
      }

      if (isEdit) {
        await crmApi.updateCustomField(field._id, payload);
        toast.success("Field updated");
      } else {
        await crmApi.createCustomField(payload);
        toast.success("Field created");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save field");
    } finally {
      setSaving(false);
    }
  };

  const showOptions = ["select", "multiselect"].includes(form.fieldType);
  const showNumberConfig = ["number", "currency", "percent"].includes(
    form.fieldType,
  );
  const showTextConfig = ["text", "textarea"].includes(form.fieldType);
  const showLookupConfig = ["lookup", "user_lookup"].includes(form.fieldType);
  const showReferenceConfig = form.fieldType === "reference";
  const showAutoNumberConfig = form.fieldType === "auto_number";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Field" : "Add Custom Field"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Label *
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => handleChange("label", e.target.value)}
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Date of Birth"
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
                required
                disabled={isEdit}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="cf_date_of_birth"
              />
            </div>
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Field Type *
            </label>
            <select
              value={form.fieldType}
              onChange={(e) => handleChange("fieldType", e.target.value)}
              disabled={isEdit}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {FIELD_TYPE_OPTIONS.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Placeholder & Help Text */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={form.placeholder}
                onChange={(e) => handleChange("placeholder", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Help Text
              </label>
              <input
                type="text"
                value={form.helpText}
                onChange={(e) => handleChange("helpText", e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Toggle Flags */}
          <div className="flex flex-wrap gap-6">
            {[
              { key: "isRequired", label: "Required" },
              { key: "isUnique", label: "Unique" },
              { key: "isVisibleInList", label: "Show in List" },
              { key: "isVisibleInDetail", label: "Show in Detail" },
              { key: "isFilterable", label: "Filterable" },
              { key: "isSearchable", label: "Searchable" },
              { key: "isIndexed", label: "Indexed" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"
              >
                <button
                  type="button"
                  onClick={() => handleChange(key, !form[key])}
                  className={`transition-colors ${form[key] ? "text-blue-400" : "text-slate-500"}`}
                >
                  {form[key] ? (
                    <ToggleRight size={22} />
                  ) : (
                    <ToggleLeft size={22} />
                  )}
                </button>
                {label}
              </label>
            ))}
          </div>

          {/* Options for Select / Multiselect */}
          {showOptions && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Options
              </label>
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) =>
                      handleOptionChange(idx, "label", e.target.value)
                    }
                    placeholder="Label"
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) =>
                      handleOptionChange(idx, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm placeholder-slate-500 focus:border-blue-500"
                  />
                  <input
                    type="color"
                    value={opt.color || "#6366f1"}
                    onChange={(e) =>
                      handleOptionChange(idx, "color", e.target.value)
                    }
                    className="h-8 w-8 rounded cursor-pointer border border-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus size={14} /> Add option
              </button>
            </div>
          )}

          {/* Number Config */}
          {showNumberConfig && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min</label>
                <input
                  type="number"
                  value={form.numberConfig.min ?? ""}
                  onChange={(e) =>
                    handleChange("numberConfig", {
                      ...form.numberConfig,
                      min: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max</label>
                <input
                  type="number"
                  value={form.numberConfig.max ?? ""}
                  onChange={(e) =>
                    handleChange("numberConfig", {
                      ...form.numberConfig,
                      max: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Decimal Places
                </label>
                <input
                  type="number"
                  value={form.numberConfig.precision ?? 2}
                  onChange={(e) =>
                    handleChange("numberConfig", {
                      ...form.numberConfig,
                      precision: Number(e.target.value),
                    })
                  }
                  min={0}
                  max={6}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Text Config */}
          {showTextConfig && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Min Length
                </label>
                <input
                  type="number"
                  value={form.textConfig.minLength ?? ""}
                  onChange={(e) =>
                    handleChange("textConfig", {
                      ...form.textConfig,
                      minLength: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Max Length
                </label>
                <input
                  type="number"
                  value={form.textConfig.maxLength ?? ""}
                  onChange={(e) =>
                    handleChange("textConfig", {
                      ...form.textConfig,
                      maxLength: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Pattern (Regex)
                </label>
                <input
                  type="text"
                  value={form.textConfig.pattern ?? ""}
                  onChange={(e) =>
                    handleChange("textConfig", {
                      ...form.textConfig,
                      pattern: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Lookup Config */}
          {showLookupConfig && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Target Module
                </label>
                <select
                  value={form.lookupConfig.targetModule}
                  onChange={(e) =>
                    handleChange("lookupConfig", {
                      ...form.lookupConfig,
                      targetModule: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                >
                  <option value="">Select module</option>
                  {BUILT_IN_MODULES.map((m) => (
                    <option key={m.apiName} value={m.apiName}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Display Field
                </label>
                <input
                  type="text"
                  value={form.lookupConfig.displayField}
                  onChange={(e) =>
                    handleChange("lookupConfig", {
                      ...form.lookupConfig,
                      displayField: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Auto Number Config */}
          {showAutoNumberConfig && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  value={form.autoNumberConfig.prefix}
                  onChange={(e) =>
                    handleChange("autoNumberConfig", {
                      ...form.autoNumberConfig,
                      prefix: e.target.value,
                    })
                  }
                  placeholder="e.g. INV-"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Start From
                </label>
                <input
                  type="number"
                  value={form.autoNumberConfig.startFrom}
                  onChange={(e) =>
                    handleChange("autoNumberConfig", {
                      ...form.autoNumberConfig,
                      startFrom: Number(e.target.value),
                    })
                  }
                  min={1}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Reference Config */}
          {showReferenceConfig && (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                <ExternalLink size={14} className="text-blue-400" />
                Reference Configuration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Target Module *
                  </label>
                  <select
                    value={form.referenceConfig.targetModule}
                    onChange={(e) =>
                      handleChange("referenceConfig", {
                        ...form.referenceConfig,
                        targetModule: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                  >
                    <option value="">Select module</option>
                    {BUILT_IN_MODULES.map((m) => (
                      <option key={m.apiName} value={m.apiName}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Display Field
                  </label>
                  <input
                    type="text"
                    value={form.referenceConfig.displayField}
                    onChange={(e) =>
                      handleChange("referenceConfig", {
                        ...form.referenceConfig,
                        displayField: e.target.value,
                      })
                    }
                    placeholder="name"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Validation Rules */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <Shield size={14} className="text-amber-400" />
              Validation Rules
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  value={form.validation.min ?? ""}
                  onChange={(e) =>
                    handleChange("validation", {
                      ...form.validation,
                      min: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  value={form.validation.max ?? ""}
                  onChange={(e) =>
                    handleChange("validation", {
                      ...form.validation,
                      max: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Regex Pattern
                </label>
                <input
                  type="text"
                  value={form.validation.regex || ""}
                  onChange={(e) =>
                    handleChange("validation", {
                      ...form.validation,
                      regex: e.target.value,
                    })
                  }
                  placeholder="^[A-Z]{3}\\d{4}$"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Regex Error Message
                </label>
                <input
                  type="text"
                  value={form.validation.regexMessage || ""}
                  onChange={(e) =>
                    handleChange("validation", {
                      ...form.validation,
                      regexMessage: e.target.value,
                    })
                  }
                  placeholder="Must be 3 letters + 4 digits"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-white text-sm focus:border-blue-500"
                />
              </div>
            </div>

            {/* Conditional Required Rules */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Info size={12} />
                  Conditional Required (AND logic — all must match)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleChange("validation", {
                      ...form.validation,
                      conditionalRequired: [
                        ...(form.validation.conditionalRequired || []),
                        { field: "", operator: "eq", value: "" },
                      ],
                    })
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Rule
                </button>
              </div>
              {(form.validation.conditionalRequired || []).map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rule.field}
                    onChange={(e) => {
                      const rules = [...form.validation.conditionalRequired];
                      rules[idx] = { ...rules[idx], field: e.target.value };
                      handleChange("validation", {
                        ...form.validation,
                        conditionalRequired: rules,
                      });
                    }}
                    placeholder="Field apiName"
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-white text-xs focus:border-blue-500"
                  />
                  <select
                    value={rule.operator}
                    onChange={(e) => {
                      const rules = [...form.validation.conditionalRequired];
                      rules[idx] = { ...rules[idx], operator: e.target.value };
                      handleChange("validation", {
                        ...form.validation,
                        conditionalRequired: rules,
                      });
                    }}
                    className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-white text-xs focus:border-blue-500"
                  >
                    {[
                      "eq",
                      "neq",
                      "in",
                      "nin",
                      "exists",
                      "gt",
                      "lt",
                      "gte",
                      "lte",
                    ].map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={
                      typeof rule.value === "object"
                        ? JSON.stringify(rule.value)
                        : (rule.value ?? "")
                    }
                    onChange={(e) => {
                      const rules = [...form.validation.conditionalRequired];
                      let val = e.target.value;
                      // Try parse JSON for in/nin operators
                      if (["in", "nin"].includes(rules[idx].operator)) {
                        try {
                          val = JSON.parse(val);
                        } catch {
                          /* keep string */
                        }
                      }
                      rules[idx] = { ...rules[idx], value: val };
                      handleChange("validation", {
                        ...form.validation,
                        conditionalRequired: rules,
                      });
                    }}
                    placeholder={
                      ["in", "nin"].includes(rule.operator)
                        ? '["a","b"]'
                        : "Value"
                    }
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-white text-xs focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rules = form.validation.conditionalRequired.filter(
                        (_, i) => i !== idx,
                      );
                      handleChange("validation", {
                        ...form.validation,
                        conditionalRequired: rules,
                      });
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Visible To Roles */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <Users size={14} className="text-green-400" />
              Visible To Roles
              <span className="text-xs text-slate-500 ml-1">
                (empty = all roles)
              </span>
            </label>
            <div className="flex flex-wrap gap-3">
              {["superadmin", "admin", "marketing", "user"].map((role) => {
                const selected = form.visibleToRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? form.visibleToRoles.filter((r) => r !== role)
                        : [...form.visibleToRoles, role];
                      handleChange("visibleToRoles", next);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                      selected
                        ? "bg-green-600 border-green-500 text-white"
                        : "border-slate-600 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────
export default function CustomFieldsManager() {
  const [selectedModule, setSelectedModule] = useState("contacts");
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const result = await crmApi.listCustomFields({
        moduleApiName: selectedModule,
        limit: 200,
      });
      setFields(result.list || []);
    } catch {
      toast.error("Failed to load fields");
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleDelete = async (fieldId) => {
    if (!confirm("Delete this custom field? This action can be reversed."))
      return;
    try {
      await crmApi.deleteCustomField(fieldId);
      toast.success("Field deleted");
      fetchFields();
    } catch {
      toast.error("Failed to delete field");
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingField(null);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditingField(null);
    fetchFields();
  };

  const filteredFields = fields.filter(
    (f) =>
      !search ||
      f.label?.toLowerCase().includes(search.toLowerCase()) ||
      f.apiName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Fields</h1>
          <p className="text-slate-400 mt-1">
            Define and manage custom fields for CRM modules
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} />
          Add Field
        </button>
      </div>

      {/* Module Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {BUILT_IN_MODULES.map((m) => (
            <button
              key={m.apiName}
              onClick={() => setSelectedModule(m.apiName)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedModule === m.apiName
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-64 rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fields Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Type size={40} className="mb-3 opacity-30" />
            <p className="text-lg font-medium">No custom fields yet</p>
            <p className="text-sm mt-1">
              Add your first custom field for {selectedModule}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-8" />
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  API Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Required
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  List
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Detail
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                  Indexed
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((field) => {
                const FieldIcon = getFieldIcon(field.fieldType);
                return (
                  <tr
                    key={field._id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-500 cursor-grab">
                      <GripVertical size={14} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FieldIcon size={16} className="text-blue-400" />
                        <span className="text-white font-medium text-sm">
                          {field.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                        {field.apiName}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-300 bg-slate-700 px-2 py-1 rounded-full capitalize">
                        {FIELD_TYPE_OPTIONS.find(
                          (ft) => ft.value === field.fieldType,
                        )?.label || field.fieldType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field.isRequired ? (
                        <span className="text-amber-400 text-xs font-semibold">
                          YES
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field.isVisibleInList ? (
                        <Eye size={14} className="inline text-green-400" />
                      ) : (
                        <EyeOff size={14} className="inline text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field.isVisibleInDetail ? (
                        <Eye size={14} className="inline text-green-400" />
                      ) : (
                        <EyeOff size={14} className="inline text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {field.isIndexed ? (
                        <Database
                          size={14}
                          className="inline text-purple-400"
                        />
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(field)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(field._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Field Form Modal */}
      {showModal && (
        <FieldFormModal
          field={editingField}
          moduleApiName={selectedModule}
          onClose={() => {
            setShowModal(false);
            setEditingField(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import {
  Plus,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Settings2,
  Eye,
  EyeOff,
  Palette,
  SlidersHorizontal,
  FileText,
  Type,
  Hash,
  Phone,
  Mail,
  Calendar,
  Upload,
  Link2,
  MapPin,
  Star,
  List,
  CheckSquare,
  Circle,
  Clock,
  Minus,
  Heading,
  AlignLeft,
  Globe,
  Pipette,
} from "lucide-react";
import { Button, Input, Select, Textarea } from "../../components/ui";
import toast from "react-hot-toast";

// ─── Constants ───────────────────────────────────────────────
const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text Input" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown (Select)" },
  { value: "multiselect", label: "Multi-Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "datetime", label: "Date & Time" },
  { value: "file", label: "File Upload" },
  { value: "url", label: "URL" },
  { value: "address", label: "Address" },
  { value: "country", label: "Country Dropdown" },
  { value: "rating", label: "Rating (Stars)" },
  { value: "range", label: "Range Slider" },
  { value: "color", label: "Color Picker" },
  { value: "hidden", label: "Hidden Field" },
  { value: "heading", label: "Section Heading" },
  { value: "paragraph", label: "Paragraph Text" },
  { value: "divider", label: "Divider Line" },
];

const FIELD_TYPE_ICONS = {
  text: Type,
  email: Mail,
  number: Hash,
  phone: Phone,
  textarea: AlignLeft,
  select: List,
  multiselect: List,
  checkbox: CheckSquare,
  radio: Circle,
  date: Calendar,
  time: Clock,
  datetime: Calendar,
  file: Upload,
  url: Link2,
  address: MapPin,
  country: Globe,
  rating: Star,
  range: SlidersHorizontal,
  color: Pipette,
  hidden: EyeOff,
  heading: Heading,
  paragraph: FileText,
  divider: Minus,
};

const WIDTH_OPTIONS = [
  { value: "full", label: "Full Width" },
  { value: "half", label: "Half Width" },
  { value: "third", label: "One-Third" },
];

const TYPES_WITH_OPTIONS = ["select", "multiselect", "radio", "checkbox"];
const LAYOUT_ONLY_TYPES = ["heading", "paragraph", "divider"];
const NO_VALIDATION_TYPES = [
  "heading",
  "paragraph",
  "divider",
  "hidden",
  "color",
  "checkbox",
  "file",
  "rating",
];

const COND_OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Not Contains" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
];

const COND_ACTION_OPTIONS = [
  { value: "show", label: "Show this field" },
  { value: "hide", label: "Hide this field" },
];

const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "base", label: "Medium" },
  { value: "lg", label: "Large" },
];

const LABEL_POSITION_OPTIONS = [
  { value: "top", label: "Above Field" },
  { value: "left", label: "Left of Field" },
  { value: "floating", label: "Floating Label" },
];

const generateFieldName = (label) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 50);

const DEFAULT_FIELD = {
  fieldName: "",
  label: "",
  type: "text",
  placeholder: "",
  description: "",
  defaultValue: "",
  required: false,
  options: [],
  validation: {},
  fileConfig: { acceptedTypes: "", maxSizeMB: 5, multiple: false },
  conditionalLogic: {
    enabled: false,
    action: "show",
    field: "",
    operator: "equals",
    value: "",
  },
  width: "full",
  cssClass: "",
  sortOrder: 0,
  isActive: true,
};

const DEFAULT_BUILT_IN = {
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
  productInterest: { show: true, required: false, label: "Product Interest" },
};

const DEFAULT_FORM_CONFIG = {
  formTitle: "",
  formDescription: "",
  submitButtonText: "Submit",
  successMessage: "Thank you! We will contact you soon.",
  redirectUrl: "",
  theme: {
    primaryColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    borderRadius: "md",
    fontSize: "base",
    labelPosition: "top",
  },
  defaultFields: { ...DEFAULT_BUILT_IN },
};

// ─── Sub-components ──────────────────────────────────────────

const Section = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        {Icon && <Icon className="h-4 w-4 text-indigo-500" />}
        <span className="flex-1">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

const ToggleFieldRow = ({ fieldKey, config, onChange }) => (
  <div className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={config.show}
        onChange={(e) =>
          onChange(fieldKey, { ...config, show: e.target.checked })
        }
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {config.show ? (
          <Eye className="inline h-3.5 w-3.5 text-green-500" />
        ) : (
          <EyeOff className="inline h-3.5 w-3.5 text-gray-400" />
        )}
      </span>
    </label>
    <input
      type="text"
      value={config.label}
      onChange={(e) => onChange(fieldKey, { ...config, label: e.target.value })}
      className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
      placeholder={fieldKey}
    />
    <label className="flex cursor-pointer items-center gap-1 text-xs">
      <input
        type="checkbox"
        checked={config.required}
        onChange={(e) =>
          onChange(fieldKey, { ...config, required: e.target.checked })
        }
        className="h-3.5 w-3.5 rounded border-gray-300 text-red-500 focus:ring-red-400"
      />
      <span className="text-gray-500 dark:text-gray-400">Required</span>
    </label>
  </div>
);

// ─── Main Component ──────────────────────────────────────────

const FormFieldsBuilder = ({
  fields = [],
  onChange,
  formConfig,
  onFormConfigChange,
}) => {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [newOptionText, setNewOptionText] = useState({});
  const [activeFieldTab, setActiveFieldTab] = useState("general");

  const config = {
    ...DEFAULT_FORM_CONFIG,
    ...formConfig,
    theme: { ...DEFAULT_FORM_CONFIG.theme, ...(formConfig?.theme || {}) },
  };
  const updateConfig = (partial) =>
    onFormConfigChange({ ...config, ...partial });

  const updateField = (idx, updates) => {
    const updated = fields.map((f, i) =>
      i === idx ? { ...f, ...updates } : f,
    );
    onChange(updated);
  };

  const addField = () => {
    if (fields.length >= 30) {
      toast.error("Maximum 30 custom fields allowed");
      return;
    }
    const newField = { ...DEFAULT_FIELD, sortOrder: fields.length };
    onChange([...fields, newField]);
    setExpandedIdx(fields.length);
    setActiveFieldTab("general");
  };

  const removeField = (idx) => {
    onChange(fields.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
    else if (expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
  };

  const duplicateField = (idx) => {
    if (fields.length >= 30) {
      toast.error("Maximum 30 custom fields allowed");
      return;
    }
    const clone = {
      ...JSON.parse(JSON.stringify(fields[idx])),
      fieldName: fields[idx].fieldName + "_copy",
      label: fields[idx].label + " (Copy)",
      sortOrder: fields.length,
    };
    onChange([...fields, clone]);
    setExpandedIdx(fields.length);
  };

  const moveField = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= fields.length) return;
    const updated = [...fields];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updated.forEach((f, i) => (f.sortOrder = i));
    onChange(updated);
    setExpandedIdx(newIdx);
  };

  const addOption = (idx) => {
    const text = (newOptionText[idx] || "").trim();
    if (!text) return;
    const field = fields[idx];
    if ((field.options || []).includes(text)) {
      toast.error("Option already exists");
      return;
    }
    updateField(idx, { options: [...(field.options || []), text] });
    setNewOptionText((prev) => ({ ...prev, [idx]: "" }));
  };

  const removeOption = (fieldIdx, optionIdx) => {
    const field = fields[fieldIdx];
    updateField(fieldIdx, {
      options: (field.options || []).filter((_, i) => i !== optionIdx),
    });
  };

  const handleLabelChange = (idx, label) => {
    const field = fields[idx];
    const updates = { label };
    const autoName = generateFieldName(field.label || "");
    if (!field.fieldName || field.fieldName === autoName)
      updates.fieldName = generateFieldName(label);
    updateField(idx, updates);
  };

  const handleDefaultFieldChange = (fieldKey, value) => {
    updateConfig({
      defaultFields: { ...(config.defaultFields || {}), [fieldKey]: value },
    });
  };

  const otherFieldNames = (excludeIdx) =>
    fields
      .filter((_, i) => i !== excludeIdx)
      .filter((f) => !LAYOUT_ONLY_TYPES.includes(f.type))
      .map((f) => ({ value: f.fieldName, label: f.label || f.fieldName }));

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ━━━ Form Settings ━━━ */}
      <Section title="Form Settings" icon={Settings2} defaultOpen={false}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Form Title"
              value={config.formTitle}
              onChange={(e) => updateConfig({ formTitle: e.target.value })}
              placeholder="Contact Us"
            />
            <Input
              label="Submit Button Text"
              value={config.submitButtonText}
              onChange={(e) =>
                updateConfig({ submitButtonText: e.target.value })
              }
              placeholder="Submit"
            />
          </div>
          <Textarea
            label="Form Description"
            value={config.formDescription}
            onChange={(e) => updateConfig({ formDescription: e.target.value })}
            placeholder="Fill out this form and we'll get back to you..."
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Textarea
              label="Success Message"
              value={config.successMessage}
              onChange={(e) => updateConfig({ successMessage: e.target.value })}
              placeholder="Thank you! We will contact you soon."
              rows={2}
            />
            <Input
              label="Redirect URL (after submit)"
              value={config.redirectUrl}
              onChange={(e) => updateConfig({ redirectUrl: e.target.value })}
              placeholder="https://yoursite.com/thank-you"
            />
          </div>
        </div>
      </Section>

      {/* ━━━ Theme / Appearance ━━━ */}
      <Section title="Form Theme & Appearance" icon={Palette}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Primary Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.theme?.primaryColor || "#4F46E5"}
                onChange={(e) =>
                  updateConfig({
                    theme: { ...config.theme, primaryColor: e.target.value },
                  })
                }
                className="h-9 w-9 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.theme?.primaryColor || "#4F46E5"}
                onChange={(e) =>
                  updateConfig({
                    theme: { ...config.theme, primaryColor: e.target.value },
                  })
                }
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.theme?.backgroundColor || "#FFFFFF"}
                onChange={(e) =>
                  updateConfig({
                    theme: { ...config.theme, backgroundColor: e.target.value },
                  })
                }
                className="h-9 w-9 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.theme?.backgroundColor || "#FFFFFF"}
                onChange={(e) =>
                  updateConfig({
                    theme: { ...config.theme, backgroundColor: e.target.value },
                  })
                }
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.theme?.textColor || "#111827"}
                onChange={(e) =>
                  updateConfig({
                    theme: { ...config.theme, textColor: e.target.value },
                  })
                }
                className="h-9 w-9 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.theme?.textColor || "#111827"}
                onChange={(e) =>
                  updateConfig({
                    theme: { ...config.theme, textColor: e.target.value },
                  })
                }
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
          </div>
          <Select
            label="Border Radius"
            value={config.theme?.borderRadius || "md"}
            onChange={(e) =>
              updateConfig({
                theme: { ...config.theme, borderRadius: e.target.value },
              })
            }
            options={BORDER_RADIUS_OPTIONS}
          />
          <Select
            label="Font Size"
            value={config.theme?.fontSize || "base"}
            onChange={(e) =>
              updateConfig({
                theme: { ...config.theme, fontSize: e.target.value },
              })
            }
            options={FONT_SIZE_OPTIONS}
          />
          <Select
            label="Label Position"
            value={config.theme?.labelPosition || "top"}
            onChange={(e) =>
              updateConfig({
                theme: { ...config.theme, labelPosition: e.target.value },
              })
            }
            options={LABEL_POSITION_OPTIONS}
          />
        </div>
      </Section>

      {/* ━━━ Default (Built-in) Fields ━━━ */}
      <Section
        title="Default Fields (toggle / rename)"
        icon={FileText}
        defaultOpen={false}
      >
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Control which built-in fields appear on your form. Toggle visibility,
          rename labels, and set required status.
        </p>
        <div className="space-y-2">
          {Object.entries(config.defaultFields || DEFAULT_BUILT_IN).map(
            ([key, val]) => (
              <ToggleFieldRow
                key={key}
                fieldKey={key}
                config={{ ...DEFAULT_BUILT_IN[key], ...val }}
                onChange={handleDefaultFieldChange}
              />
            ),
          )}
        </div>
      </Section>

      {/* ━━━ Custom Fields ━━━ */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Custom Fields
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add any fields you need — text, dropdowns, file uploads, ratings,
              conditional visibility, and more.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400">
            {fields.length}/30
          </span>
        </div>

        {/* Field Cards */}
        <div className="space-y-2">
          {fields.map((field, idx) => {
            const isExpanded = expandedIdx === idx;
            const hasOptions = TYPES_WITH_OPTIONS.includes(field.type);
            const isLayoutOnly = LAYOUT_ONLY_TYPES.includes(field.type);
            const IconComp = FIELD_TYPE_ICONS[field.type] || Type;

            return (
              <div
                key={idx}
                className={`rounded-lg border transition-all ${isExpanded ? "border-indigo-300 shadow-sm dark:border-indigo-700" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-800`}
              >
                {/* Collapsed Header */}
                <div
                  className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                  onClick={() => {
                    setExpandedIdx(isExpanded ? null : idx);
                    setActiveFieldTab("general");
                  }}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${field.isActive !== false ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-gray-700"}`}
                    >
                      <IconComp className="h-3 w-3" />
                      {field.type || "text"}
                    </span>
                    <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {field.label || (
                        <span className="italic text-gray-400">
                          Untitled Field
                        </span>
                      )}
                    </span>
                    {field.required && (
                      <span className="text-xs font-bold text-red-500">*</span>
                    )}
                    {field.conditionalLogic?.enabled && (
                      <span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        conditional
                      </span>
                    )}
                    {field.fieldName && (
                      <span className="hidden text-xs text-gray-400 sm:inline">
                        ({field.fieldName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveField(idx, -1);
                      }}
                      disabled={idx === 0}
                      className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveField(idx, 1);
                      }}
                      disabled={idx === fields.length - 1}
                      className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateField(idx);
                      }}
                      className="rounded p-1 text-gray-400 hover:text-blue-600"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(idx);
                      }}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Editor */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-gray-100 px-4 pt-2 dark:border-gray-700">
                      {[
                        { key: "general", label: "General" },
                        ...(!isLayoutOnly
                          ? [{ key: "validation", label: "Validation" }]
                          : []),
                        { key: "appearance", label: "Appearance" },
                        ...(!isLayoutOnly
                          ? [{ key: "logic", label: "Conditional Logic" }]
                          : []),
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveFieldTab(tab.key)}
                          className={`rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${activeFieldTab === tab.key ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="px-4 py-4">
                      {/* ── General Tab ── */}
                      {activeFieldTab === "general" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input
                              label="Field Label *"
                              value={field.label}
                              onChange={(e) =>
                                handleLabelChange(idx, e.target.value)
                              }
                              placeholder="e.g. Company Address"
                            />
                            <Input
                              label="Field Name (key)"
                              value={field.fieldName}
                              onChange={(e) =>
                                updateField(idx, {
                                  fieldName: generateFieldName(e.target.value),
                                })
                              }
                              placeholder="auto_generated"
                            />
                            <Select
                              label="Field Type"
                              value={field.type}
                              onChange={(e) =>
                                updateField(idx, { type: e.target.value })
                              }
                              options={FIELD_TYPE_OPTIONS}
                            />
                            {!isLayoutOnly && (
                              <Input
                                label="Placeholder"
                                value={field.placeholder || ""}
                                onChange={(e) =>
                                  updateField(idx, {
                                    placeholder: e.target.value,
                                  })
                                }
                                placeholder="Enter placeholder text..."
                              />
                            )}
                          </div>

                          {/* Description / help text */}
                          <Input
                            label="Help Text / Description"
                            value={field.description || ""}
                            onChange={(e) =>
                              updateField(idx, { description: e.target.value })
                            }
                            placeholder="Optional help text shown below the field"
                          />

                          {/* Default value */}
                          {!isLayoutOnly &&
                            field.type !== "file" &&
                            field.type !== "rating" && (
                              <Input
                                label="Default Value"
                                value={field.defaultValue || ""}
                                onChange={(e) =>
                                  updateField(idx, {
                                    defaultValue: e.target.value,
                                  })
                                }
                                placeholder="Pre-filled value"
                              />
                            )}

                          {/* Rating config */}
                          {field.type === "rating" && (
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                label="Max Stars"
                                type="number"
                                min={1}
                                max={10}
                                value={field.validation?.max ?? 5}
                                onChange={(e) =>
                                  updateField(idx, {
                                    validation: {
                                      ...field.validation,
                                      max: parseInt(e.target.value, 10) || 5,
                                    },
                                  })
                                }
                              />
                              <Input
                                label="Default Rating"
                                type="number"
                                min={0}
                                max={field.validation?.max ?? 5}
                                value={field.defaultValue || 0}
                                onChange={(e) =>
                                  updateField(idx, {
                                    defaultValue:
                                      parseInt(e.target.value, 10) || 0,
                                  })
                                }
                              />
                            </div>
                          )}

                          {/* Range config */}
                          {field.type === "range" && (
                            <div className="grid grid-cols-3 gap-3">
                              <Input
                                label="Min"
                                type="number"
                                value={field.validation?.min ?? 0}
                                onChange={(e) =>
                                  updateField(idx, {
                                    validation: {
                                      ...field.validation,
                                      min: parseFloat(e.target.value) || 0,
                                    },
                                  })
                                }
                              />
                              <Input
                                label="Max"
                                type="number"
                                value={field.validation?.max ?? 100}
                                onChange={(e) =>
                                  updateField(idx, {
                                    validation: {
                                      ...field.validation,
                                      max: parseFloat(e.target.value) || 100,
                                    },
                                  })
                                }
                              />
                              <Input
                                label="Step"
                                type="number"
                                value={field.validation?.minLength ?? 1}
                                onChange={(e) =>
                                  updateField(idx, {
                                    validation: {
                                      ...field.validation,
                                      minLength:
                                        parseFloat(e.target.value) || 1,
                                    },
                                  })
                                }
                              />
                            </div>
                          )}

                          {/* Hidden field value */}
                          {field.type === "hidden" && (
                            <Input
                              label="Hidden Value"
                              value={field.defaultValue || ""}
                              onChange={(e) =>
                                updateField(idx, {
                                  defaultValue: e.target.value,
                                })
                              }
                              placeholder="Value sent with the form silently"
                            />
                          )}

                          {/* Heading / Paragraph content */}
                          {field.type === "heading" && (
                            <Input
                              label="Heading Text"
                              value={field.label}
                              onChange={(e) =>
                                handleLabelChange(idx, e.target.value)
                              }
                              placeholder="Section Title"
                            />
                          )}
                          {field.type === "paragraph" && (
                            <Textarea
                              label="Paragraph Content"
                              value={field.description || ""}
                              onChange={(e) =>
                                updateField(idx, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Descriptive text shown to the user..."
                              rows={3}
                            />
                          )}

                          {/* Toggles row */}
                          {!isLayoutOnly && (
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={field.required || false}
                                  onChange={(e) =>
                                    updateField(idx, {
                                      required: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Required
                                </span>
                              </label>
                              <label className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={field.isActive !== false}
                                  onChange={(e) =>
                                    updateField(idx, {
                                      isActive: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Active
                                </span>
                              </label>
                            </div>
                          )}

                          {/* Options for select / radio / checkbox / multiselect */}
                          {hasOptions && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Settings2 className="h-3.5 w-3.5" /> Options
                              </h4>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add option..."
                                  value={newOptionText[idx] || ""}
                                  onChange={(e) =>
                                    setNewOptionText((prev) => ({
                                      ...prev,
                                      [idx]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addOption(idx);
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(idx)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {(field.options || []).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {field.options.map((opt, optIdx) => (
                                    <span
                                      key={optIdx}
                                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600"
                                    >
                                      {opt}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeOption(idx, optIdx)
                                        }
                                        className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {(field.options || []).length === 0 && (
                                <p className="mt-1 text-xs italic text-gray-400">
                                  Add at least one option.
                                </p>
                              )}
                            </div>
                          )}

                          {/* File upload config */}
                          {field.type === "file" && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Upload className="h-3.5 w-3.5" /> File Upload
                                Settings
                              </h4>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Input
                                  label="Accepted Types"
                                  value={field.fileConfig?.acceptedTypes || ""}
                                  onChange={(e) =>
                                    updateField(idx, {
                                      fileConfig: {
                                        ...field.fileConfig,
                                        acceptedTypes: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder=".pdf,.jpg,.png"
                                />
                                <Input
                                  label="Max Size (MB)"
                                  type="number"
                                  min={0.1}
                                  max={50}
                                  step={0.1}
                                  value={field.fileConfig?.maxSizeMB ?? 5}
                                  onChange={(e) =>
                                    updateField(idx, {
                                      fileConfig: {
                                        ...field.fileConfig,
                                        maxSizeMB:
                                          parseFloat(e.target.value) || 5,
                                      },
                                    })
                                  }
                                />
                                <div className="flex items-end">
                                  <label className="flex cursor-pointer items-center gap-2 pb-2">
                                    <input
                                      type="checkbox"
                                      checked={
                                        field.fileConfig?.multiple || false
                                      }
                                      onChange={(e) =>
                                        updateField(idx, {
                                          fileConfig: {
                                            ...field.fileConfig,
                                            multiple: e.target.checked,
                                          },
                                        })
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      Allow Multiple
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Validation Tab ── */}
                      {activeFieldTab === "validation" && !isLayoutOnly && (
                        <div className="space-y-4">
                          {!NO_VALIDATION_TYPES.includes(field.type) && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {[
                                "text",
                                "textarea",
                                "url",
                                "email",
                                "phone",
                                "address",
                              ].includes(field.type) && (
                                <>
                                  <Input
                                    label="Min Length"
                                    type="number"
                                    min={0}
                                    value={field.validation?.minLength ?? ""}
                                    onChange={(e) =>
                                      updateField(idx, {
                                        validation: {
                                          ...field.validation,
                                          minLength: e.target.value
                                            ? parseInt(e.target.value, 10)
                                            : undefined,
                                        },
                                      })
                                    }
                                  />
                                  <Input
                                    label="Max Length"
                                    type="number"
                                    min={1}
                                    value={field.validation?.maxLength ?? ""}
                                    onChange={(e) =>
                                      updateField(idx, {
                                        validation: {
                                          ...field.validation,
                                          maxLength: e.target.value
                                            ? parseInt(e.target.value, 10)
                                            : undefined,
                                        },
                                      })
                                    }
                                  />
                                </>
                              )}
                              {["number", "range"].includes(field.type) && (
                                <>
                                  <Input
                                    label="Min Value"
                                    type="number"
                                    value={field.validation?.min ?? ""}
                                    onChange={(e) =>
                                      updateField(idx, {
                                        validation: {
                                          ...field.validation,
                                          min: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                        },
                                      })
                                    }
                                  />
                                  <Input
                                    label="Max Value"
                                    type="number"
                                    value={field.validation?.max ?? ""}
                                    onChange={(e) =>
                                      updateField(idx, {
                                        validation: {
                                          ...field.validation,
                                          max: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                        },
                                      })
                                    }
                                  />
                                </>
                              )}
                              <Input
                                label="Regex Pattern"
                                value={field.validation?.pattern ?? ""}
                                onChange={(e) =>
                                  updateField(idx, {
                                    validation: {
                                      ...field.validation,
                                      pattern: e.target.value || undefined,
                                    },
                                  })
                                }
                                placeholder="^[A-Z].*"
                              />
                            </div>
                          )}
                          <Input
                            label="Custom Error Message"
                            value={field.validation?.customError ?? ""}
                            onChange={(e) =>
                              updateField(idx, {
                                validation: {
                                  ...field.validation,
                                  customError: e.target.value || undefined,
                                },
                              })
                            }
                            placeholder="Please enter a valid value"
                          />
                          {NO_VALIDATION_TYPES.includes(field.type) && (
                            <p className="text-xs italic text-gray-400">
                              No additional validation options for this field
                              type.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Appearance Tab ── */}
                      {activeFieldTab === "appearance" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Select
                            label="Width"
                            value={field.width || "full"}
                            onChange={(e) =>
                              updateField(idx, { width: e.target.value })
                            }
                            options={WIDTH_OPTIONS}
                          />
                          <Input
                            label="CSS Class (optional)"
                            value={field.cssClass || ""}
                            onChange={(e) =>
                              updateField(idx, { cssClass: e.target.value })
                            }
                            placeholder="e.g. my-custom-class"
                          />
                        </div>
                      )}

                      {/* ── Conditional Logic Tab ── */}
                      {activeFieldTab === "logic" && !isLayoutOnly && (
                        <div className="space-y-3">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.conditionalLogic?.enabled || false}
                              onChange={(e) =>
                                updateField(idx, {
                                  conditionalLogic: {
                                    ...field.conditionalLogic,
                                    enabled: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Enable conditional visibility
                            </span>
                          </label>

                          {field.conditionalLogic?.enabled && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/10">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Select
                                  label="Action"
                                  value={
                                    field.conditionalLogic?.action || "show"
                                  }
                                  onChange={(e) =>
                                    updateField(idx, {
                                      conditionalLogic: {
                                        ...field.conditionalLogic,
                                        action: e.target.value,
                                      },
                                    })
                                  }
                                  options={COND_ACTION_OPTIONS}
                                />
                                <Select
                                  label="When Field"
                                  value={field.conditionalLogic?.field || ""}
                                  onChange={(e) =>
                                    updateField(idx, {
                                      conditionalLogic: {
                                        ...field.conditionalLogic,
                                        field: e.target.value,
                                      },
                                    })
                                  }
                                  options={[
                                    { value: "", label: "-- Select field --" },
                                    ...otherFieldNames(idx),
                                  ]}
                                />
                                <Select
                                  label="Operator"
                                  value={
                                    field.conditionalLogic?.operator || "equals"
                                  }
                                  onChange={(e) =>
                                    updateField(idx, {
                                      conditionalLogic: {
                                        ...field.conditionalLogic,
                                        operator: e.target.value,
                                      },
                                    })
                                  }
                                  options={COND_OPERATOR_OPTIONS}
                                />
                                {!["is_empty", "is_not_empty"].includes(
                                  field.conditionalLogic?.operator,
                                ) && (
                                  <Input
                                    label="Value"
                                    value={field.conditionalLogic?.value || ""}
                                    onChange={(e) =>
                                      updateField(idx, {
                                        conditionalLogic: {
                                          ...field.conditionalLogic,
                                          value: e.target.value,
                                        },
                                      })
                                    }
                                    placeholder="Match value"
                                  />
                                )}
                              </div>
                              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                                {field.conditionalLogic.action === "show"
                                  ? "Show"
                                  : "Hide"}{" "}
                                this field when &quot;
                                {field.conditionalLogic.field || "…"}&quot;{" "}
                                {field.conditionalLogic.operator?.replace(
                                  "_",
                                  " ",
                                )}
                                {!["is_empty", "is_not_empty"].includes(
                                  field.conditionalLogic?.operator,
                                ) && (
                                  <>
                                    {" "}
                                    &quot;{field.conditionalLogic.value || "…"}
                                    &quot;
                                  </>
                                )}
                              </p>
                            </div>
                          )}

                          {!field.conditionalLogic?.enabled && (
                            <p className="text-xs italic text-gray-400">
                              When enabled, this field will only appear based on
                              the value of another field.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Field Button */}
        <button
          type="button"
          onClick={addField}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/10 dark:hover:text-indigo-400"
        >
          <Plus className="h-4 w-4" /> Add Custom Field
        </button>

        {fields.length === 0 && (
          <p className="mt-2 text-center text-sm italic text-gray-400 dark:text-gray-500">
            No custom fields yet. The form uses only the default fields above.
          </p>
        )}
      </div>
    </div>
  );
};

export default FormFieldsBuilder;

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Save,
  X,
  Columns,
  Layout,
  ChevronDown,
  ChevronRight,
  Eye,
  List,
  LayoutGrid,
  Layers,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import crmApi from "../../services/crmApi";

const BUILT_IN_MODULES = [
  { apiName: "contacts", label: "Contacts" },
  { apiName: "accounts", label: "Accounts" },
  { apiName: "deals", label: "Deals" },
  { apiName: "activities", label: "Activities" },
  { apiName: "leads", label: "Leads" },
];

const LAYOUT_TYPES = [
  { value: "detail", label: "Detail View", icon: Eye },
  { value: "edit", label: "Edit Form", icon: Pencil },
  { value: "create", label: "Create Form", icon: Plus },
  { value: "list", label: "List View", icon: List },
  { value: "kanban", label: "Kanban", icon: LayoutGrid },
];

// ── Section Editor Panel ────────────────────────────────
function SectionEditor({ section, availableFields, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);

  const handleFieldToggle = (fieldApiName) => {
    const fields = [...(section.fields || [])];
    const idx = fields.indexOf(fieldApiName);
    if (idx > -1) {
      fields.splice(idx, 1);
    } else {
      fields.push(fieldApiName);
    }
    onChange({ ...section, fields });
  };

  const moveField = (fromIdx, direction) => {
    const fields = [...(section.fields || [])];
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= fields.length) return;
    [fields[fromIdx], fields[toIdx]] = [fields[toIdx], fields[fromIdx]];
    onChange({ ...section, fields });
  };

  return (
    <div className="border border-slate-700 rounded-lg bg-slate-800/80 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
        <GripVertical size={14} className="text-slate-500 cursor-grab" />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <input
          type="text"
          value={section.title || ""}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Section Title"
          className="flex-1 bg-transparent text-white font-medium text-sm border-none outline-none placeholder-slate-500"
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <Columns size={12} />
            <select
              value={section.columns || 2}
              onChange={(e) =>
                onChange({ ...section, columns: Number(e.target.value) })
              }
              className="bg-slate-700 text-white text-xs rounded px-1.5 py-0.5 border border-slate-600"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} col{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={onRemove}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
            title="Remove section"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Section Body */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Selected fields */}
          {section.fields?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Fields in this section ({section.fields.length})
              </p>
              {section.fields.map((fieldApiName, fIdx) => (
                <div
                  key={fieldApiName}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-900/30 border border-blue-800/50 text-sm"
                >
                  <GripVertical size={12} className="text-slate-500" />
                  <span className="flex-1 text-blue-200">{fieldApiName}</span>
                  <button
                    onClick={() => moveField(fIdx, -1)}
                    disabled={fIdx === 0}
                    className="text-slate-500 hover:text-white disabled:opacity-20 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveField(fIdx, 1)}
                    disabled={fIdx === section.fields.length - 1}
                    className="text-slate-500 hover:text-white disabled:opacity-20 text-xs"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleFieldToggle(fieldApiName)}
                    className="text-slate-500 hover:text-red-400 text-xs"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Available fields to add */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Available fields
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableFields
                .filter((f) => !section.fields?.includes(f.apiName))
                .map((f) => (
                  <button
                    key={f.apiName}
                    type="button"
                    onClick={() => handleFieldToggle(f.apiName)}
                    className="px-2.5 py-1 rounded text-xs font-medium border border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-blue-500 hover:text-blue-300 transition-colors"
                  >
                    + {f.label || f.apiName}
                  </button>
                ))}
              {availableFields.filter(
                (f) => !section.fields?.includes(f.apiName),
              ).length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  All fields assigned
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Layout Builder ─────────────────────────────────
export default function LayoutBuilderPage() {
  const [selectedModule, setSelectedModule] = useState("contacts");
  const [selectedType, setSelectedType] = useState("detail");
  const [, setLayout] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);

  // Built-in fields for each module
  const builtInFields = useMemo(() => {
    const common = [
      { apiName: "tags", label: "Tags" },
      { apiName: "createdAt", label: "Created At" },
      { apiName: "updatedAt", label: "Updated At" },
    ];

    const moduleFields = {
      contacts: [
        { apiName: "firstName", label: "First Name" },
        { apiName: "lastName", label: "Last Name" },
        { apiName: "email", label: "Email" },
        { apiName: "phone", label: "Phone" },
        { apiName: "title", label: "Title" },
        { apiName: "department", label: "Department" },
        { apiName: "accountId", label: "Account" },
        { apiName: "ownerId", label: "Owner" },
        { apiName: "source", label: "Source" },
      ],
      accounts: [
        { apiName: "name", label: "Name" },
        { apiName: "industry", label: "Industry" },
        { apiName: "website", label: "Website" },
        { apiName: "phone", label: "Phone" },
        { apiName: "email", label: "Email" },
        { apiName: "type", label: "Type" },
        { apiName: "ownerId", label: "Owner" },
      ],
      deals: [
        { apiName: "name", label: "Deal Name" },
        { apiName: "amount", label: "Amount" },
        { apiName: "stage", label: "Stage" },
        { apiName: "probability", label: "Probability" },
        { apiName: "closeDate", label: "Close Date" },
        { apiName: "accountId", label: "Account" },
        { apiName: "contactId", label: "Contact" },
        { apiName: "ownerId", label: "Owner" },
      ],
      activities: [
        { apiName: "type", label: "Type" },
        { apiName: "subject", label: "Subject" },
        { apiName: "startDate", label: "Start Date" },
        { apiName: "endDate", label: "End Date" },
        { apiName: "description", label: "Description" },
        { apiName: "ownerId", label: "Owner" },
      ],
      leads: [
        { apiName: "name", label: "Name" },
        { apiName: "email", label: "Email" },
        { apiName: "phone", label: "Phone" },
        { apiName: "source", label: "Source" },
        { apiName: "assignedTo", label: "Assigned To" },
        { apiName: "status", label: "Status" },
      ],
    };

    return [...(moduleFields[selectedModule] || []), ...common];
  }, [selectedModule]);

  const allFields = useMemo(
    () => [
      ...builtInFields,
      ...customFields.map((f) => ({ apiName: f.apiName, label: f.label })),
    ],
    [builtInFields, customFields],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [layoutData, fieldsData] = await Promise.all([
        crmApi.getActiveLayout(selectedModule, selectedType).catch(() => null),
        crmApi.getFieldsByModule(selectedModule).catch(() => []),
      ]);

      setCustomFields(fieldsData || []);
      setLayout(layoutData);

      if (layoutData?.sections?.length) {
        setSections(
          layoutData.sections.map((s) => ({
            title: s.title || "",
            columns: s.columns || 2,
            collapsed: s.collapsed || false,
            fields: s.fields || [],
            sortOrder: s.sortOrder ?? 0,
            _id: s._id,
          })),
        );
      } else {
        // Default layout: single section with all fields
        setSections([
          {
            title: "Details",
            columns: 2,
            collapsed: false,
            fields: builtInFields.map((f) => f.apiName),
            sortOrder: 0,
          },
        ]);
      }
    } catch {
      toast.error("Failed to load layout data");
    } finally {
      setLoading(false);
    }
  }, [selectedModule, selectedType, builtInFields]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        title: `Section ${prev.length + 1}`,
        columns: 2,
        collapsed: false,
        fields: [],
        sortOrder: prev.length,
      },
    ]);
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index, data) => {
    setSections((prev) => prev.map((s, i) => (i === index ? data : s)));
  };

  const moveSection = (index, direction) => {
    setSections((prev) => {
      const next = [...prev];
      const toIdx = index + direction;
      if (toIdx < 0 || toIdx >= next.length) return prev;
      [next[index], next[toIdx]] = [next[toIdx], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        moduleApiName: selectedModule,
        layoutType: selectedType,
        sections: sections.map((s, i) => ({
          ...s,
          sortOrder: i,
        })),
        isActive: true,
        isDefault: true,
      };

      await crmApi.upsertLayout(payload);
      toast.success("Layout saved successfully");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers size={24} className="text-blue-400" />
            Layout Builder
          </h1>
          <p className="text-slate-400 mt-1">
            Customize field arrangement for module views
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : "Save Layout"}
        </button>
      </div>

      {/* Module + Layout Type Selectors */}
      <div className="flex gap-4">
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
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {LAYOUT_TYPES.map(({ value, label, icon }) => {
            const Icon = icon;
            return (
              <button
                key={value}
                onClick={() => setSelectedType(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedType === value
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Builder Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sections */}
          {sections.map((section, idx) => (
            <div key={idx} className="relative">
              {/* Move buttons */}
              <div className="absolute -left-10 top-3 flex flex-col gap-1">
                <button
                  onClick={() => moveSection(idx, -1)}
                  disabled={idx === 0}
                  className="text-slate-500 hover:text-white disabled:opacity-20 text-xs"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveSection(idx, 1)}
                  disabled={idx === sections.length - 1}
                  className="text-slate-500 hover:text-white disabled:opacity-20 text-xs"
                >
                  ↓
                </button>
              </div>
              <SectionEditor
                section={section}
                index={idx}
                availableFields={allFields}
                onChange={(data) => updateSection(idx, data)}
                onRemove={() => removeSection(idx)}
              />
            </div>
          ))}

          {/* Add Section */}
          <button
            onClick={addSection}
            className="flex items-center gap-2 w-full justify-center py-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            <Plus size={16} />
            Add Section
          </button>

          {/* Summary */}
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
            <p className="text-sm text-slate-400">
              <strong className="text-white">{sections.length}</strong> section
              {sections.length !== 1 ? "s" : ""} &middot;{" "}
              <strong className="text-white">
                {sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0)}
              </strong>{" "}
              fields assigned &middot;{" "}
              <strong className="text-white">
                {allFields.length -
                  sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0)}
              </strong>{" "}
              unassigned
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

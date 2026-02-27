import { useState, useEffect, useMemo, useCallback } from "react";
import { Save, Loader2, AlertCircle, CheckCircle, Search } from "lucide-react";
import crmApi from "../services/crmApi";

// ── Reference Field Input (search-based) ────────────────
function ReferenceFieldInput({
  field,
  value,
  onChange,
  readOnly,
  inputBase,
  isDark,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useState("");

  const targetModule =
    field.referenceConfig?.targetModule ||
    field.lookupConfig?.targetModule ||
    "";
  const displayField =
    field.referenceConfig?.displayField ||
    field.lookupConfig?.displayField ||
    "name";

  // Load display label for existing value
  useEffect(() => {
    if (!value || !targetModule) {
      setDisplayLabel("");
      return;
    }
    crmApi
      .getById(targetModule, value)
      .then((rec) => setDisplayLabel(rec?.[displayField] || rec?.name || value))
      .catch(() => setDisplayLabel(value));
  }, [value, targetModule, displayField]);

  // Debounced search
  useEffect(() => {
    if (!search || search.length < 2 || !targetModule) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await crmApi.list(targetModule, { search, limit: 10 });
        setResults(res.list || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, targetModule]);

  if (readOnly) {
    return (
      <input
        type="text"
        value={displayLabel || value || ""}
        disabled
        className={`${inputBase} opacity-60`}
      />
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-500" : "text-gray-400"}`}
          />
          <input
            type="text"
            value={open ? search : displayLabel || ""}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={`Search ${targetModule}...`}
            className={`${inputBase} pl-8`}
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setDisplayLabel("");
              setSearch("");
            }}
            className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-slate-600 rounded"
          >
            Clear
          </button>
        )}
      </div>
      {open && (search.length >= 2 || results.length > 0) && (
        <div
          className={`absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border shadow-xl ${
            isDark
              ? "bg-slate-800 border-slate-600"
              : "bg-white border-gray-200"
          }`}
        >
          {loading && (
            <div
              className={`px-3 py-2 text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}
            >
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && search.length >= 2 && (
            <div
              className={`px-3 py-2 text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}
            >
              No results
            </div>
          )}
          {results.map((rec) => (
            <button
              key={rec._id}
              type="button"
              onClick={() => {
                onChange(rec._id);
                setDisplayLabel(rec[displayField] || rec.name || rec._id);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                isDark
                  ? "text-white hover:bg-slate-700"
                  : "text-gray-900 hover:bg-gray-100"
              } ${rec._id === value ? (isDark ? "bg-slate-700" : "bg-blue-50") : ""}`}
            >
              {rec[displayField] || rec.name || rec._id}
              {rec.email ? (
                <span
                  className={`ml-2 text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}
                >
                  ({rec.email})
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * DynamicFormRenderer — renders a form from field definitions and/or
 * a FormDefinition. Works for both authenticated CRM views and
 * public embeddable forms.
 *
 * Props:
 *  - fields       : Array of CustomField documents (sorted)
 *  - formDef      : Optional FormDefinition.fieldMappings overrides
 *  - initialValues: Existing customData map (for edit mode)
 *  - onSubmit     : async (values) => void
 *  - submitLabel  : button text (default "Save")
 *  - readOnly     : disable all inputs
 *  - compact      : tighter spacing mode
 *  - theme        : "dark" (default) | "light"
 *  - userRole     : current user's role for visibility filtering
 */
export default function DynamicFormRenderer({
  fields = [],
  formDef = null,
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  readOnly = false,
  compact = false,
  theme = "dark",
  userRole = null,
}) {
  // Build effective field list from formDef overrides or raw fields
  const effectiveFields = useMemo(() => {
    // Role-based visibility filter
    const roleFilter = (f) => {
      if (!userRole) return true;
      if (!f.visibleToRoles || f.visibleToRoles.length === 0) return true;
      return f.visibleToRoles.includes(userRole);
    };

    if (!formDef?.fieldMappings?.length) {
      return fields
        .filter((f) => f.isActive !== false)
        .filter(roleFilter)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    return formDef.fieldMappings
      .filter((fm) => !fm.isHidden)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((fm) => {
        const base = fields.find((f) => f.apiName === fm.fieldApiName) || {};
        return {
          ...base,
          label: fm.label || base.label || fm.fieldApiName,
          apiName: fm.fieldApiName,
          fieldType: fm.overrideType || base.fieldType || "text",
          isRequired: fm.isRequired ?? base.isRequired ?? false,
          placeholder: fm.placeholder || base.placeholder || "",
          helpText: fm.helpText || base.helpText || "",
          defaultValue: fm.defaultValue ?? base.defaultValue ?? "",
        };
      })
      .filter(roleFilter);
  }, [fields, formDef, userRole]);

  // Form state
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const defaults = {};
    effectiveFields.forEach((f) => {
      defaults[f.apiName] =
        initialValues[f.apiName] ??
        f.defaultValue ??
        (f.fieldType === "boolean" ? false : "");
    });
    setValues(defaults);
  }, [effectiveFields, initialValues]);

  const handleChange = (apiName, value) => {
    setValues((prev) => ({ ...prev, [apiName]: value }));
    setErrors((prev) => ({ ...prev, [apiName]: null }));
  };

  // ── Conditional Required Evaluator ───────────────────
  const evaluateConditionalRequired = useCallback((field, currentValues) => {
    const rules = field.validation?.conditionalRequired;
    if (!rules || rules.length === 0) return false;

    return rules.every((rule) => {
      const depVal = currentValues[rule.field];
      switch (rule.operator) {
        case "eq":
          return depVal == rule.value;
        case "neq":
          return depVal != rule.value;
        case "in":
          return Array.isArray(rule.value) && rule.value.includes(depVal);
        case "nin":
          return Array.isArray(rule.value) && !rule.value.includes(depVal);
        case "exists":
          return depVal !== undefined && depVal !== null && depVal !== "";
        case "gt":
          return Number(depVal) > Number(rule.value);
        case "lt":
          return Number(depVal) < Number(rule.value);
        case "gte":
          return Number(depVal) >= Number(rule.value);
        case "lte":
          return Number(depVal) <= Number(rule.value);
        default:
          return false;
      }
    });
  }, []);

  const validate = () => {
    const errs = {};
    effectiveFields.forEach((f) => {
      const val = values[f.apiName];
      const isEmpty = val === undefined || val === null || val === "";

      // Standard required
      if (f.isRequired && isEmpty) {
        errs[f.apiName] = `${f.label} is required`;
        return;
      }
      // Conditional required
      if (isEmpty && evaluateConditionalRequired(f, values)) {
        errs[f.apiName] = `${f.label} is required based on current values`;
        return;
      }
      // Skip further validation if empty and not required
      if (isEmpty) return;

      // Email
      if (
        f.fieldType === "email" &&
        val &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      ) {
        errs[f.apiName] = "Invalid email address";
      }
      // URL
      if (f.fieldType === "url" && val) {
        try {
          new URL(val);
        } catch {
          errs[f.apiName] = "Invalid URL";
        }
      }
      // Numeric types
      if (
        ["number", "currency", "percent"].includes(f.fieldType) &&
        val !== "" &&
        val != null
      ) {
        const num = Number(val);
        if (isNaN(num)) errs[f.apiName] = "Must be a number";
        if (f.numberConfig?.min != null && num < f.numberConfig.min)
          errs[f.apiName] = `Min: ${f.numberConfig.min}`;
        if (f.numberConfig?.max != null && num > f.numberConfig.max)
          errs[f.apiName] = `Max: ${f.numberConfig.max}`;
      }
      // Phone
      if (
        f.fieldType === "phone" &&
        val &&
        !/^\+?[\d\s\-()]{7,20}$/.test(val)
      ) {
        errs[f.apiName] = "Invalid phone number";
      }

      // ── Generic validation rules from validation config ──
      if (f.validation) {
        const v = f.validation;
        if (v.min != null && Number(val) < v.min) {
          errs[f.apiName] = errs[f.apiName] || `Minimum value is ${v.min}`;
        }
        if (v.max != null && Number(val) > v.max) {
          errs[f.apiName] = errs[f.apiName] || `Maximum value is ${v.max}`;
        }
        if (v.regex && typeof val === "string") {
          try {
            if (!new RegExp(v.regex).test(val)) {
              errs[f.apiName] =
                v.regexMessage || `Does not match required pattern`;
            }
          } catch {
            // invalid regex from server — skip client validation
          }
        }
      }
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      // Cast numeric types
      const castValues = { ...values };
      effectiveFields.forEach((f) => {
        if (
          ["number", "currency", "percent"].includes(f.fieldType) &&
          castValues[f.apiName] !== ""
        ) {
          castValues[f.apiName] = Number(castValues[f.apiName]);
        }
      });
      await onSubmit(castValues);
      setSubmitted(true);
    } catch {
      // Propagate errors from parent
    } finally {
      setSubmitting(false);
    }
  };

  // Styling helpers
  const isDark = theme === "dark";
  const inputBase = `w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 transition-colors ${
    isDark
      ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
  }`;
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-gray-700"}`;
  const helpClass = `text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`;
  const errClass = "text-xs mt-0.5 text-red-400";
  const gap = compact ? "space-y-3" : "space-y-5";

  // Success state for public forms
  if (submitted && formDef?.settings?.successMessage) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-12 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        <CheckCircle size={48} className="text-green-500 mb-4" />
        <p className="text-lg font-medium">{formDef.settings.successMessage}</p>
      </div>
    );
  }

  const renderField = (field) => {
    const {
      apiName,
      label,
      fieldType,
      placeholder,
      helpText,
      isRequired,
      options,
    } = field;
    const value = values[apiName] ?? "";
    const error = errors[apiName];

    const wrapperClass = compact ? "" : "";

    const fieldInput = (() => {
      switch (fieldType) {
        case "textarea":
          return (
            <textarea
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              placeholder={placeholder}
              disabled={readOnly}
              rows={3}
              className={`${inputBase} resize-y`}
            />
          );

        case "select":
          return (
            <select
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              disabled={readOnly}
              className={inputBase}
            >
              <option value="">-- Select --</option>
              {(options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );

        case "multiselect": {
          const selected = Array.isArray(value) ? value : [];
          return (
            <div className="flex flex-wrap gap-2">
              {(options || []).map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      const next = isSelected
                        ? selected.filter((v) => v !== opt.value)
                        : [...selected, opt.value];
                      handleChange(apiName, next);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-blue-600 border-blue-500 text-white"
                        : isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          );
        }

        case "boolean":
          return (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleChange(apiName, e.target.checked)}
                disabled={readOnly}
                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span
                className={`text-sm ${isDark ? "text-slate-300" : "text-gray-700"}`}
              >
                {label}
              </span>
            </label>
          );

        case "date":
          return (
            <input
              type="date"
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              disabled={readOnly}
              className={inputBase}
            />
          );

        case "datetime":
          return (
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              disabled={readOnly}
              className={inputBase}
            />
          );

        case "number":
        case "currency":
        case "percent":
          return (
            <div className="relative">
              {fieldType === "currency" && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  $
                </span>
              )}
              <input
                type="number"
                value={value}
                onChange={(e) => handleChange(apiName, e.target.value)}
                placeholder={placeholder}
                disabled={readOnly}
                min={field.numberConfig?.min}
                max={field.numberConfig?.max}
                step={
                  field.numberConfig?.precision
                    ? Math.pow(10, -field.numberConfig.precision)
                    : undefined
                }
                className={`${inputBase} ${fieldType === "currency" ? "pl-7" : ""} ${fieldType === "percent" ? "pr-7" : ""}`}
              />
              {fieldType === "percent" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  %
                </span>
              )}
            </div>
          );

        case "email":
          return (
            <input
              type="email"
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              placeholder={placeholder || "email@example.com"}
              disabled={readOnly}
              className={inputBase}
            />
          );

        case "phone":
          return (
            <input
              type="tel"
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              placeholder={placeholder || "+1 (555) 123-4567"}
              disabled={readOnly}
              className={inputBase}
            />
          );

        case "url":
          return (
            <input
              type="url"
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              placeholder={placeholder || "https://"}
              disabled={readOnly}
              className={inputBase}
            />
          );

        case "auto_number":
          return (
            <input
              type="text"
              value={value || "(auto-generated)"}
              disabled
              className={`${inputBase} opacity-60`}
            />
          );

        case "reference":
        case "lookup":
          return (
            <ReferenceFieldInput
              field={field}
              value={value}
              onChange={(v) => handleChange(apiName, v)}
              readOnly={readOnly}
              inputBase={inputBase}
              isDark={isDark}
            />
          );

        // text, user_lookup — fallback to text input
        default:
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(apiName, e.target.value)}
              placeholder={placeholder}
              disabled={readOnly}
              className={inputBase}
            />
          );
      }
    })();

    return (
      <div key={apiName} className={wrapperClass}>
        {fieldType !== "boolean" && (
          <label className={labelClass}>
            {label}
            {isRequired && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        {fieldInput}
        {helpText && <p className={helpClass}>{helpText}</p>}
        {error && (
          <p className={errClass}>
            <AlertCircle size={12} className="inline mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={gap}>
      {effectiveFields.map(renderField)}

      {!readOnly && onSubmit && (
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {submitting ? "Submitting..." : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Input, Select, Textarea } from "../../ui";
import crmApi from "../../../services/crmApi";
import {
  canViewFieldByRole,
  validateDynamicField,
} from "./fieldValidation";

const normalizeOptions = (options = []) =>
  options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return {
      value: option?.value ?? option?.id ?? option?.label ?? "",
      label: option?.label ?? option?.value ?? option?.id ?? "",
    };
  });

const ReferenceField = ({ field, value, onChange, error, required }) => {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const relatedModule = field?.referenceConfig?.targetModule || null;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!relatedModule || query.trim().length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await crmApi.list(relatedModule, {
          search: query.trim(),
          limit: 10,
        });
        if (cancelled) return;
        const result = Array.isArray(response?.list) ? response.list : [];
        setOptions(
          result.map((item) => ({
            value: item?._id,
            label: item?.fullName || item?.name || item?.subject || item?.email,
          })),
        );
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, relatedModule]);

  return (
    <div className="space-y-2">
      <Input
        label={field?.label}
        value={query}
        required={required}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${relatedModule || "records"}...`}
        error={error}
      />
      <Select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={loading ? "Searching..." : "Select record"}
      />
    </div>
  );
};

const DynamicFieldRenderer = ({
  field,
  value,
  onChange,
  error,
  currentRole,
  ownerOptions = [],
  statusOptions = [],
  activityTypeOptions = [],
}) => {
  const options = useMemo(() => {
    if (field?.optionsKey === "owners") return ownerOptions;
    if (field?.optionsKey === "status") return statusOptions;
    if (field?.optionsKey === "activityType") return activityTypeOptions;
    return normalizeOptions(field?.options || []);
  }, [
    field?.options,
    field?.optionsKey,
    ownerOptions,
    statusOptions,
    activityTypeOptions,
  ]);

  if (!field || !canViewFieldByRole(field, currentRole)) return null;

  const handleValueChange = (nextValue) => {
    const validationError = validateDynamicField(field, nextValue, {
      [field.apiName]: nextValue,
    });
    onChange(field.apiName, nextValue, validationError);
  };

  switch (field.fieldType) {
    case "textarea":
      return (
        <Textarea
          label={field.label}
          required={field.isRequired}
          value={value || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={field.placeholder}
          error={error}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          label={field.label}
          required={field.isRequired}
          value={value ?? ""}
          onChange={(e) =>
            handleValueChange(
              e.target.value === "" ? "" : Number(e.target.value),
            )
          }
          placeholder={field.placeholder}
          error={error}
        />
      );

    case "date":
      return (
        <Input
          type="date"
          label={field.label}
          required={field.isRequired}
          value={value || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          error={error}
        />
      );

    case "boolean":
      return (
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 dark:border-gray-600">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleValueChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {value ? "Enabled" : "Disabled"}
            </span>
          </label>
          {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        </div>
      );

    case "select":
      return (
        <Select
          label={field.label}
          required={field.isRequired}
          value={value || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          options={options}
          placeholder={field.placeholder || "Select an option"}
          error={error}
        />
      );

    case "multiselect":
      return (
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.isRequired && <span className="ml-1 text-red-500">*</span>}
          </label>
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (opt) => opt.value,
              );
              handleValueChange(selected);
            }}
            className="min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        </div>
      );

    case "currency":
      return (
        <Input
          type="number"
          label={field.label}
          required={field.isRequired}
          value={value ?? ""}
          onChange={(e) =>
            handleValueChange(
              e.target.value === "" ? "" : Number(e.target.value),
            )
          }
          placeholder={
            field.currencySymbol ? `${field.currencySymbol}0.00` : "$0.00"
          }
          error={error}
        />
      );

    case "reference":
      return (
        <ReferenceField
          field={field}
          value={value}
          onChange={handleValueChange}
          required={field.isRequired}
          error={error}
        />
      );

    case "email":
    case "text":
    default:
      return (
        <Input
          type={field.fieldType === "email" ? "email" : "text"}
          label={field.label}
          required={field.isRequired}
          value={value || ""}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={field.placeholder}
          error={error}
        />
      );
  }
};

export default DynamicFieldRenderer;

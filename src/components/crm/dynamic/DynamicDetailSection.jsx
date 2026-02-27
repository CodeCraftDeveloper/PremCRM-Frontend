import { canViewFieldByRole } from "./fieldValidation";

const formatValue = (field, value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (field.fieldType === "date") {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? String(value) : dt.toLocaleDateString();
  }
  if (field.fieldType === "currency") {
    const amount = Number(value);
    if (Number.isNaN(amount)) return String(value);
    const symbol = field.currencySymbol || "$";
    return `${symbol}${amount.toLocaleString()}`;
  }
  if (field.fieldType === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return value.name || value.label || JSON.stringify(value);
  return String(value);
};

const DynamicDetailSection = ({
  metadata,
  detail,
  currentRole,
  hideEmptyCustomFields = true,
}) => {
  if (!metadata?.loaded) return null;

  const fields = [...(metadata.systemFields || []), ...(metadata.customFields || [])];

  const visibleFields = fields.filter((field) => {
    if (!canViewFieldByRole(field, currentRole)) return false;
    if (!hideEmptyCustomFields || !field.isCustom) return true;
    const value = detail?.[field.apiName];
    const isEmpty =
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    return field.isRequired || !isEmpty;
  });

  return (
    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
      {visibleFields.map((field) => (
        <div key={field.apiName} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {field.label}
          </p>
          <p className="mt-1 break-all text-gray-900 dark:text-gray-200">
            {formatValue(field, detail?.[field.apiName])}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DynamicDetailSection;

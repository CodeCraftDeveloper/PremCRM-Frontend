import DynamicFieldRenderer from "./DynamicFieldRenderer";
import { canViewFieldByRole, validateDynamicField } from "./fieldValidation";

const mapLegacyFieldType = (legacyType = "text") => {
  if (legacyType === "textarea") return "textarea";
  if (legacyType === "date") return "date";
  if (legacyType === "number") return "number";
  if (legacyType === "select") return "select";
  if (legacyType === "email") return "email";
  return "text";
};

const buildFallbackFields = (fields = []) =>
  fields.map((field, index) => ({
    id: field.name || String(index),
    apiName: field.name,
    label: field.label || field.name,
    fieldType: mapLegacyFieldType(field.type),
    required: Boolean(field.isRequired),
    isRequired: Boolean(field.isRequired),
    optionsKey: field.optionsKey,
    options: field.options || [],
    order: index,
    fullWidth: Boolean(field.fullWidth),
    visibleToRoles: [],
    isCustom: false,
    placeholder: field.placeholder,
  }));

// eslint-disable-next-line react-refresh/only-export-components
export const getOrderedFormFields = (metadata, fallbackFields = []) => {
  const hasMetadata =
    metadata &&
    metadata.loaded &&
    (metadata.systemFields?.length || metadata.customFields?.length);
  if (!hasMetadata) return buildFallbackFields(fallbackFields);

  const systemFields = [...(metadata.systemFields || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
  const customFields = [...(metadata.customFields || [])];

  const layoutSections = metadata.layout?.sections || [];
  if (!layoutSections.length) {
    return [...systemFields, ...customFields].sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    );
  }

  const layoutCustomOrder = [];
  layoutSections.forEach((section) => {
    (section.fields || []).forEach((apiName) => {
      if (!layoutCustomOrder.includes(apiName)) {
        layoutCustomOrder.push(apiName);
      }
    });
  });

  const customByName = customFields.reduce((acc, field) => {
    acc[field.apiName] = field;
    return acc;
  }, {});

  const orderedCustom = layoutCustomOrder
    .map((apiName) => customByName[apiName])
    .filter(Boolean);

  const missingCustom = customFields
    .filter(
      (field) =>
        !orderedCustom.find(
          (orderedField) => orderedField.apiName === field.apiName,
        ),
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return [...systemFields, ...orderedCustom, ...missingCustom];
};

const DynamicFormSection = ({
  metadata,
  fallbackFields,
  values,
  errors,
  onFieldChange,
  currentRole,
  ownerOptions,
  statusOptions,
  activityTypeOptions,
}) => {
  const orderedFields = getOrderedFormFields(metadata, fallbackFields);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {orderedFields
        .filter((field) => canViewFieldByRole(field, currentRole))
        .map((field) => (
          <div
            key={field.apiName}
            className={field.fullWidth ? "md:col-span-2" : ""}
          >
            <DynamicFieldRenderer
              field={field}
              value={values[field.apiName]}
              error={errors[field.apiName]}
              currentRole={currentRole}
              ownerOptions={ownerOptions}
              statusOptions={statusOptions}
              activityTypeOptions={activityTypeOptions}
              onChange={onFieldChange}
            />
          </div>
        ))}
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const validateFormFields = (fields = [], values = {}, currentRole) => {
  const nextErrors = {};

  fields
    .filter((field) => canViewFieldByRole(field, currentRole))
    .forEach((field) => {
      const fieldError = validateDynamicField(
        field,
        values[field.apiName],
        values,
      );
      if (fieldError) nextErrors[field.apiName] = fieldError;
    });

  return nextErrors;
};

export default DynamicFormSection;

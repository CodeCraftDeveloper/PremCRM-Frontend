export const canViewFieldByRole = (field, currentRole) => {
  const visibleToRoles = Array.isArray(field?.visibleToRoles)
    ? field.visibleToRoles
    : [];
  if (visibleToRoles.length === 0) return true;
  return visibleToRoles.includes(currentRole);
};

const evaluateConditionalRequired = (field, currentValues = {}) => {
  const rules = field?.validation?.conditionalRequired;
  if (!Array.isArray(rules) || rules.length === 0) return false;

  return rules.every((rule) => {
    const depVal = currentValues[rule.field];
    switch (rule.operator) {
      case "eq":
        return depVal === rule.value;
      case "neq":
        return depVal !== rule.value;
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
};

export const validateDynamicField = (field, value, currentValues = {}) => {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  const isConditionallyRequired = evaluateConditionalRequired(
    field,
    currentValues,
  );

  if (field?.isRequired === true || isConditionallyRequired) {
    if (isEmpty) return "This field is required";
  }

  if (!isEmpty && field?.min != null && Number(value) < Number(field.min)) {
    return `Minimum value is ${field.min}`;
  }

  if (!isEmpty && field?.max != null && Number(value) > Number(field.max)) {
    return `Maximum value is ${field.max}`;
  }

  if (!isEmpty && field?.regex) {
    try {
      const pattern = new RegExp(field.regex);
      if (!pattern.test(String(value))) {
        return "Invalid format";
      }
    } catch {
      return null;
    }
  }

  return null;
};

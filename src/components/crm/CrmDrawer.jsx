import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "../ui";
import {
  DynamicFormSection,
  getOrderedFormFields,
  validateFormFields,
} from "./dynamic";

const CrmDrawer = ({
  isOpen,
  onClose,
  fields,
  initialData,
  onSubmit,
  title,
  submitLabel,
  ownerOptions,
  statusOptions,
  activityTypeOptions,
  metadata,
  currentUserRole,
}) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const orderedFields = useMemo(
    () => getOrderedFormFields(metadata, fields),
    [metadata, fields],
  );

  const defaultForm = useMemo(
    () =>
      orderedFields.reduce((acc, field) => {
        const sourceValue =
          initialData?.[field.apiName] ?? field.defaultValue ?? "";

        if (field.fieldType === "multiselect") {
          acc[field.apiName] = Array.isArray(sourceValue) ? sourceValue : [];
          return acc;
        }

        if (field.fieldType === "boolean") {
          acc[field.apiName] = Boolean(sourceValue);
          return acc;
        }

        if (
          (field.fieldType === "select" || field.fieldType === "reference") &&
          sourceValue &&
          typeof sourceValue === "object"
        ) {
          acc[field.apiName] =
            sourceValue._id || sourceValue.id || sourceValue.value || "";
          return acc;
        }

        acc[field.apiName] = sourceValue;
        return acc;
      }, {}),
    [orderedFields, initialData],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(defaultForm);
    setErrors({});
  }, [defaultForm]);

  const handleChange = (name, value, validationError = null) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!validationError && !prev[name]) return prev;
      const next = { ...prev };
      if (validationError) {
        next[name] = validationError;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateFormFields(
      orderedFields,
      form,
      currentUserRole,
    );
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <DynamicFormSection
          metadata={metadata}
          fallbackFields={fields}
          values={form}
          errors={errors}
          onFieldChange={handleChange}
          ownerOptions={ownerOptions}
          statusOptions={statusOptions}
          activityTypeOptions={activityTypeOptions}
          currentRole={currentUserRole}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CrmDrawer;

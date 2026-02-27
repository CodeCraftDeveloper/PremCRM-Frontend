import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ListSkeleton } from "../../components/ui";
import DynamicFormRenderer from "../../components/DynamicFormRenderer";
import crmApi from "../../services/crmApi";

const PublicFormPreviewPage = () => {
  const { tenantSlug, apiName } = useParams();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let active = true;
    const loadForm = async () => {
      try {
        const data = await crmApi.getPublicForm(tenantSlug, apiName);
        if (active) setForm(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadForm();
    return () => {
      active = false;
    };
  }, [tenantSlug, apiName]);

  if (loading) return <ListSkeleton />;

  if (!form) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center text-sm text-gray-500">
        Form not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">{form.name}</h1>
      <DynamicFormRenderer
        formDef={form}
        fields={[]}
        submitLabel={form.settings?.submitLabel || "Submit"}
        theme={form.settings?.theme || "light"}
        onSubmit={async () => {}}
      />
    </div>
  );
};

export default PublicFormPreviewPage;

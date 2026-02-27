import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Button, Input, ListSkeleton, Modal, Select, Textarea } from "../../components/ui";
import { fetchBlueprints, saveBlueprint } from "../../store/slices/crm/crmSlice";

const toRequiredFieldsByStage = (transitions = []) => {
  const grouped = {};
  transitions.forEach((transition) => {
    const stage = transition?.toStage;
    if (!stage) return;
    const required = Array.isArray(transition.requiredFields)
      ? transition.requiredFields
      : [];
    grouped[stage] = Array.from(new Set([...(grouped[stage] || []), ...required]));
  });
  return grouped;
};

const normalizeTransitions = (transitionsRaw, requiredFieldsByStage = {}) => {
  if (!Array.isArray(transitionsRaw)) return [];

  const normalized = [];
  transitionsRaw.forEach((transition) => {
    // Backend-native format
    if (transition?.fromStage && transition?.toStage) {
      normalized.push({
        fromStage: transition.fromStage,
        toStage: transition.toStage,
        requiredFields:
          transition.requiredFields ||
          requiredFieldsByStage[transition.toStage] ||
          [],
        requiredActions: transition.requiredActions || [],
        allowedRoles: transition.allowedRoles || ["admin", "marketing", "superadmin"],
      });
      return;
    }

    // UI-friendly compact format: { from: "New", to: ["Qualified", "Lost"] }
    if (transition?.from && Array.isArray(transition.to)) {
      transition.to.forEach((toStage) => {
        normalized.push({
          fromStage: transition.from,
          toStage,
          requiredFields: requiredFieldsByStage[toStage] || [],
          requiredActions: [],
          allowedRoles: ["admin", "marketing", "superadmin"],
        });
      });
    }
  });

  return normalized;
};

const BlueprintEditorPage = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.crm.blueprints);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState(null);
  const [form, setForm] = useState({
    name: "",
    module: "deal",
    transitions: "[]",
    requiredFields: "{}",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchBlueprints());
  }, [dispatch]);

  const openModal = (blueprint = null) => {
    if (blueprint) {
      setEditingBlueprint(blueprint);
      setForm({
        name: blueprint.name || "",
        module: blueprint.module || "deal",
        transitions: JSON.stringify(blueprint.transitions || [], null, 2),
        requiredFields: JSON.stringify(
          toRequiredFieldsByStage(blueprint.transitions || []),
          null,
          2,
        ),
        isActive: blueprint.isActive !== false,
      });
    } else {
      setEditingBlueprint(null);
      setForm({
        name: "",
        module: "deal",
        transitions: "[]",
        requiredFields: "{}",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const requiredFieldsByStage = JSON.parse(form.requiredFields || "{}");
      const parsedTransitions = JSON.parse(form.transitions || "[]");
      const transitions = normalizeTransitions(parsedTransitions, requiredFieldsByStage);

      if (!Array.isArray(transitions) || transitions.length === 0) {
        throw new Error("At least one valid transition is required");
      }

      const payload = {
        name: form.name,
        module: form.module,
        transitions,
        isActive: form.isActive,
      };

      await dispatch(
        saveBlueprint({ payload, id: editingBlueprint?._id || null }),
      ).unwrap();

      toast.success("Blueprint saved");
      setIsModalOpen(false);
      dispatch(fetchBlueprints());
    } catch (error) {
      toast.error(error || "Invalid JSON or save failed");
    }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blueprint Editor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define stage transitions and required fields for process control.
          </p>
        </div>
        <Button onClick={() => openModal()}>New Blueprint</Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-3">
          {items.map((blueprint) => (
            <div
              key={blueprint._id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{blueprint.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {blueprint.module} - {blueprint.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openModal(blueprint)}>
                Edit
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No blueprints configured yet.</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlueprint ? "Edit Blueprint" : "Create Blueprint"}
        size="full"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Blueprint Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Select
            label="Module"
            value={form.module}
            onChange={(e) => setForm((prev) => ({ ...prev, module: e.target.value }))}
            options={[
              { value: "deal", label: "Deal" },
              { value: "lead", label: "Lead" },
              { value: "contact", label: "Contact" },
            ]}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Allowed Stage Transitions (JSON)"
              value={form.transitions}
              onChange={(e) => setForm((prev) => ({ ...prev, transitions: e.target.value }))}
              rows={6}
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Required Fields by Stage (JSON)"
              value={form.requiredFields}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, requiredFields: e.target.value }))
              }
              rows={6}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Blueprint</Button>
        </div>
      </Modal>
    </div>
  );
};

export default BlueprintEditorPage;

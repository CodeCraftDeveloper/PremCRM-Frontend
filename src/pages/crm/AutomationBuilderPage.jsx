import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Button,
  Input,
  ListSkeleton,
  Modal,
  Select,
  Textarea,
} from "../../components/ui";
import {
  fetchAutomationRules,
  saveAutomationRule,
  toggleAutomationRule,
} from "../../store/slices/crm/crmSlice";

const TRIGGERS = [
  { value: "on_create", label: "Record Created" },
  { value: "on_update", label: "Record Updated" },
  { value: "on_stage_change", label: "Stage Changed" },
  { value: "on_field_change", label: "Field Changed" },
  { value: "time_based", label: "Time-Based" },
];

const ACTIONS = [
  { value: "assign_owner", label: "Assign Owner" },
  { value: "create_task", label: "Create Task" },
  { value: "send_notification", label: "Send Notification" },
  { value: "update_field", label: "Update Field" },
  { value: "webhook", label: "Webhook" },
];

const OPERATOR_ALIASES = {
  "==": "equals",
  "!=": "not_equals",
  ">": "greater_than",
  "<": "less_than",
  contains: "contains",
  not_contains: "not_contains",
  in: "in",
  not_in: "not_in",
  is_empty: "is_empty",
  is_not_empty: "is_not_empty",
  equals: "equals",
  not_equals: "not_equals",
  greater_than: "greater_than",
  less_than: "less_than",
};

const normalizeConditions = (conditionsRaw) => {
  if (!Array.isArray(conditionsRaw)) return [];
  return conditionsRaw
    .map((condition) => {
      if (!condition?.field) return null;
      const mappedOperator =
        OPERATOR_ALIASES[String(condition.operator || "equals")] || "equals";
      return {
        field: condition.field,
        operator: mappedOperator,
        value: condition.value,
      };
    })
    .filter(Boolean);
};

const normalizeActions = (actionsRaw) => {
  if (!Array.isArray(actionsRaw)) return [];
  return actionsRaw
    .map((action) => {
      if (!action?.type) return null;
      return {
        type: action.type,
        config:
          action.config && typeof action.config === "object" ? action.config : {},
      };
    })
    .filter(Boolean);
};

const AutomationBuilderPage = () => {
  const dispatch = useDispatch();
  const { rules, loading } = useSelector((state) => state.crm.automation);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({
    name: "",
    module: "deal",
    triggerType: "on_stage_change",
    conditions: "[]",
    actions: "[]",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchAutomationRules());
  }, [dispatch]);

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name || "",
        module: rule.module || "deal",
        triggerType: rule.trigger?.type || "on_create",
        conditions: JSON.stringify(rule.conditions || [], null, 2),
        actions: JSON.stringify(rule.actions || [], null, 2),
        isActive: rule.isActive !== false,
      });
    } else {
      setEditingRule(null);
      setForm({
        name: "",
        module: "deal",
        triggerType: "on_stage_change",
        conditions: "[]",
        actions: "[]",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const parsedConditions = JSON.parse(form.conditions || "[]");
      const parsedActions = JSON.parse(form.actions || "[]");
      const actions = normalizeActions(parsedActions);
      const conditions = normalizeConditions(parsedConditions);

      if (!actions.length) {
        throw new Error("At least one action is required");
      }

      const payload = {
        name: form.name,
        module: form.module,
        trigger: { type: form.triggerType },
        conditions,
        actions,
        isActive: form.isActive,
      };
      await dispatch(
        saveAutomationRule({ payload, id: editingRule?._id || null }),
      ).unwrap();
      toast.success("Automation rule saved");
      setIsModalOpen(false);
      dispatch(fetchAutomationRules());
    } catch (error) {
      toast.error(error || "Invalid JSON or save failed");
    }
  };

  const handleToggle = async (rule) => {
    try {
      await dispatch(
        toggleAutomationRule({ id: rule._id, isActive: !rule.isActive }),
      ).unwrap();
      dispatch(fetchAutomationRules());
    } catch (error) {
      toast.error(error || "Failed to update rule");
    }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Automation Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure trigger, condition, and action workflows.
          </p>
        </div>
        <Button onClick={() => openModal()}>New Rule</Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule._id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {rule.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {rule.module} - {rule.trigger?.type || rule.trigger}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal(rule)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant={rule.isActive ? "secondary" : "primary"}
                  onClick={() => handleToggle(rule)}
                >
                  {rule.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No automation rules configured yet.
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? "Edit Automation Rule" : "Create Automation Rule"}
        size="full"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Rule Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Select
            label="Module"
            value={form.module}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, module: e.target.value }))
            }
            options={[
              { value: "lead", label: "Lead" },
              { value: "contact", label: "Contact" },
              { value: "deal", label: "Deal" },
              { value: "account", label: "Account" },
            ]}
          />
          <Select
            label="Trigger"
            value={form.triggerType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, triggerType: e.target.value }))
            }
            options={TRIGGERS}
          />
          <Select
            label="Primary Action"
            value={form.primaryAction || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                primaryAction: e.target.value,
                actions: JSON.stringify([{ type: e.target.value }], null, 2),
              }))
            }
            options={ACTIONS}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Conditions (JSON)"
              value={form.conditions}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, conditions: e.target.value }))
              }
              rows={5}
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Actions (JSON)"
              value={form.actions}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, actions: e.target.value }))
              }
              rows={6}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Rule</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AutomationBuilderPage;

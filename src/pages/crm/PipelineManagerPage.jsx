import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Input, ListSkeleton, Modal } from "../../components/ui";
import crmApi from "../../services/crmApi";

const DEFAULT_STAGES = [
  {
    name: "Qualification",
    probability: 10,
    order: 0,
    isClosed: false,
    isWon: false,
  },
  {
    name: "Proposal",
    probability: 40,
    order: 1,
    isClosed: false,
    isWon: false,
  },
  {
    name: "Negotiation",
    probability: 70,
    order: 2,
    isClosed: false,
    isWon: false,
  },
  {
    name: "Closed Won",
    probability: 100,
    order: 3,
    isClosed: true,
    isWon: true,
  },
  {
    name: "Closed Lost",
    probability: 0,
    order: 4,
    isClosed: true,
    isWon: false,
  },
];

const normalizeStages = (stages) =>
  (Array.isArray(stages) ? stages : []).map((stage, index) => ({
    name: (stage?.name || "").trim(),
    probability: Number.isFinite(Number(stage?.probability))
      ? Number(stage.probability)
      : 0,
    order: index,
    isClosed: Boolean(stage?.isClosed),
    isWon: Boolean(stage?.isWon),
  }));

const PipelineManagerPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pipelines, setPipelines] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    isDefault: false,
    isActive: true,
    stages: normalizeStages(DEFAULT_STAGES),
  });

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const data = await crmApi.listPipelines();
      setPipelines(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      isDefault: false,
      isActive: true,
      stages: normalizeStages(DEFAULT_STAGES),
    });
    setIsOpen(true);
  };

  const openEdit = (pipeline) => {
    setEditing(pipeline);
    setForm({
      name: pipeline.name || "",
      isDefault: Boolean(pipeline.isDefault),
      isActive: pipeline.isActive !== false,
      stages: normalizeStages(pipeline.stages || []),
    });
    setIsOpen(true);
  };

  const validateStages = (stages) => {
    if (!Array.isArray(stages) || stages.length < 2) {
      throw new Error("Pipeline must contain at least 2 stages");
    }
    const hasEmptyName = stages.some((stage) => !stage.name?.trim());
    if (hasEmptyName) {
      throw new Error("Every stage must have a name");
    }
    const invalidProbability = stages.some(
      (stage) => Number(stage.probability) < 0 || Number(stage.probability) > 100,
    );
    if (invalidProbability) {
      throw new Error("Stage probability must be between 0 and 100");
    }
  };

  const updateStage = (index, patch) => {
    setForm((prev) => {
      const nextStages = prev.stages.map((stage, i) =>
        i === index ? { ...stage, ...patch } : stage,
      );
      return { ...prev, stages: normalizeStages(nextStages) };
    });
  };

  const addStage = () => {
    setForm((prev) => ({
      ...prev,
      stages: normalizeStages([
        ...prev.stages,
        { name: "", probability: 0, isClosed: false, isWon: false },
      ]),
    }));
  };

  const removeStage = (index) => {
    setForm((prev) => {
      if (prev.stages.length <= 2) return prev;
      return {
        ...prev,
        stages: normalizeStages(prev.stages.filter((_, i) => i !== index)),
      };
    });
  };

  const moveStage = (index, direction) => {
    setForm((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.stages.length) return prev;
      const nextStages = [...prev.stages];
      [nextStages[index], nextStages[targetIndex]] = [
        nextStages[targetIndex],
        nextStages[index],
      ];
      return { ...prev, stages: normalizeStages(nextStages) };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsedStages = normalizeStages(form.stages);
      validateStages(parsedStages);

      if (!form.name.trim()) {
        throw new Error("Pipeline name is required");
      }

      if (!editing?._id) {
        await crmApi.createPipeline({
          name: form.name.trim(),
          isDefault: form.isDefault,
          isActive: form.isActive,
          stages: parsedStages,
        });
        toast.success("Pipeline created");
      } else {
        await crmApi.updatePipeline(editing._id, {
          name: form.name.trim(),
          isDefault: form.isDefault,
          isActive: form.isActive,
        });
        await crmApi.updatePipelineStages(editing._id, parsedStages);
        toast.success("Pipeline updated");
      }

      setIsOpen(false);
      await loadPipelines();
    } catch (error) {
      toast.error(error?.message || "Failed to save pipeline");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage deal pipelines and stage configuration.
          </p>
        </div>
        <Button onClick={openCreate}>New Pipeline</Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-3">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline._id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {pipeline.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pipeline.stages?.length || 0} stages -{" "}
                  {pipeline.isDefault ? "Default" : "Custom"} -{" "}
                  {pipeline.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(pipeline)}>
                Edit
              </Button>
            </div>
          ))}
          {pipelines.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No pipelines found. Create your first pipeline.
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? "Edit Pipeline" : "Create Pipeline"}
        size="full"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Pipeline Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3 pt-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
              />
              Default
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              Active
            </label>
          </div>

          <div className="md:col-span-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Stages
                </p>
                <Button variant="outline" size="sm" onClick={addStage}>
                  Add Stage
                </Button>
              </div>

              {form.stages.map((stage, index) => (
                <div
                  key={`${index}-${stage.name || "stage"}`}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Input
                      label={`Stage ${index + 1} Name`}
                      value={stage.name}
                      onChange={(e) => updateStage(index, { name: e.target.value })}
                    />
                    <Input
                      label="Probability (0-100)"
                      type="number"
                      min="0"
                      max="100"
                      value={stage.probability}
                      onChange={(e) =>
                        updateStage(index, { probability: Number(e.target.value) })
                      }
                    />
                    <label className="flex items-center gap-2 pt-8 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={stage.isClosed}
                        onChange={(e) =>
                          updateStage(index, { isClosed: e.target.checked })
                        }
                      />
                      Closed Stage
                    </label>
                    <label className="flex items-center gap-2 pt-8 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={stage.isWon}
                        onChange={(e) => updateStage(index, { isWon: e.target.checked })}
                      />
                      Won Stage
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveStage(index, -1)}
                      disabled={index === 0}
                    >
                      Move Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveStage(index, 1)}
                      disabled={index === form.stages.length - 1}
                    >
                      Move Down
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeStage(index)}
                      disabled={form.stages.length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Pipeline
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PipelineManagerPage;

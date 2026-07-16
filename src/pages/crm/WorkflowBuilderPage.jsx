import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchRegistry,
  fetchWorkflow,
  saveWorkflow,
  activateWorkflow,
  addNode,
  updateNode,
  removeNode,
  addEdge,
  moveNode,
  selectNode,
  clearSelection,
  setWorkflowName,
  setActiveWorkflow,
  clearActiveWorkflow,
} from "../../store/slices/workflowV2Slice";
import {
  Zap, GitBranch, Clock, Shield, Brain, Filter, ArrowRight,
  Save, ChevronLeft, Plus, Trash2, X, GripVertical, Search,
  Play, Pause, Settings, ChevronDown, ChevronRight, Workflow,
  Mail, MessageSquare, Star, Globe, Bell, Webhook, MousePointer,
  AlertTriangle, CheckCircle, Power,
} from "lucide-react";

/* ── constants ──────────────────────────────────────────── */
const TYPE_META = {
  trigger:  { icon: Zap, color: "#f59e0b", bg: "#fef3c7", darkBg: "#78350f", label: "Triggers" },
  condition:{ icon: Filter, color: "#8b5cf6", bg: "#ede9fe", darkBg: "#4c1d95", label: "Conditions" },
  action:   { icon: Play, color: "#3b82f6", bg: "#dbeafe", darkBg: "#1e3a5f", label: "Actions" },
  ai:       { icon: Brain, color: "#ec4899", bg: "#fce7f3", darkBg: "#831843", label: "AI" },
  approval: { icon: Shield, color: "#10b981", bg: "#d1fae5", darkBg: "#064e3b", label: "Approvals" },
  delay:    { icon: Clock, color: "#f97316", bg: "#ffedd5", darkBg: "#7c2d12", label: "Delays" },
  branch:   { icon: GitBranch, color: "#6366f1", bg: "#e0e7ff", darkBg: "#312e81", label: "Branches" },
};

const CATEGORY_ICONS = {
  crm: MousePointer, gmail: Mail, whatsapp: MessageSquare, gmb: Star,
  meta: Globe, notification: Bell, integration: Webhook, logic: Filter,
  ai: Brain, approval: Shield, schedule: Clock,
};

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Node Palette (left panel) ──────────────────────────── */
function NodePalette({ registry, onAdd }) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});

  const filtered = useMemo(() => {
    if (!registry) return {};
    const q = search.toLowerCase();
    const out = {};
    for (const [type, entries] of Object.entries(registry)) {
      const f = entries.filter(
        (e) => !q || e.displayName.toLowerCase().includes(q) || e.subtype.toLowerCase().includes(q)
      );
      if (f.length) out[type] = f;
    }
    return out;
  }, [registry, search]);

  const toggle = (type) => setCollapsed((p) => ({ ...p, [type]: !p[type] }));

  return (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-3 dark:border-gray-700">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Node Palette
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filtered).map(([type, entries]) => {
          const meta = TYPE_META[type] || TYPE_META.action;
          const Icon = meta.icon;
          const isOpen = !collapsed[type];
          return (
            <div key={type} className="mb-1">
              <button
                onClick={() => toggle(type)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                <span className="flex-1">{meta.label}</span>
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {entries.length}
                </span>
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {isOpen && (
                <div className="ml-1 space-y-0.5 py-1">
                  {entries.map((entry) => {
                    const CatIcon = CATEGORY_ICONS[entry.category] || Zap;
                    return (
                      <button
                        key={entry.subtype}
                        onClick={() => onAdd(entry)}
                        className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={entry.description}
                      >
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-md"
                          style={{ backgroundColor: meta.bg, color: meta.color }}
                        >
                          <CatIcon className="h-3 w-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                            {entry.displayName}
                          </p>
                        </div>
                        {entry.status === "preview" && (
                          <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            BETA
                          </span>
                        )}
                        <Plus className="h-3 w-3 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(filtered).length === 0 && (
          <p className="mt-8 text-center text-xs text-gray-400">No nodes match your search.</p>
        )}
      </div>
    </div>
  );
}

/* ── Canvas Node ────────────────────────────────────────── */
function CanvasNode({ node, selected, onSelect, onDragStart, onDelete, onConnect }) {
  const meta = TYPE_META[node.type] || TYPE_META.action;
  const Icon = meta.icon;
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);
    onDragStart(node.id, e);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute cursor-grab select-none transition-shadow ${selected ? "z-20" : "z-10"}`}
      style={{ left: node.position?.x || 0, top: node.position?.y || 0 }}
    >
      <div
        className={`group relative w-52 rounded-xl border-2 bg-white p-3 shadow-md transition-all dark:bg-gray-800 ${
          selected
            ? "border-blue-500 shadow-blue-500/25 shadow-lg ring-2 ring-blue-500/20"
            : "border-gray-200 hover:border-gray-300 hover:shadow-lg dark:border-gray-600 dark:hover:border-gray-500"
        }`}
      >
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
              {node.label || node.subtype?.split(".").pop()?.replace(/_/g, " ") || "Node"}
            </p>
            <p className="truncate text-[10px] text-gray-400">{node.subtype}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            className="rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/30"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        {/* Type badge */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            {node.type}
          </span>
          {node.requiresApproval && (
            <Shield className="h-3 w-3 text-amber-500" title="Requires approval" />
          )}
        </div>
        {/* Connection handles */}
        {node.type !== "trigger" && (
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-gray-300 bg-white transition-colors hover:border-blue-500 hover:bg-blue-500 dark:border-gray-500 dark:bg-gray-700" />
        )}
        <div
          onMouseDown={(e) => { e.stopPropagation(); onConnect(node.id, e); }}
          className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 cursor-crosshair rounded-full border-2 border-gray-300 bg-white transition-colors hover:border-blue-500 hover:bg-blue-500 dark:border-gray-500 dark:bg-gray-700"
        />
      </div>
    </div>
  );
}

/* ── Canvas Edge (SVG) ──────────────────────────────────── */
function CanvasEdges({ edges, nodes }) {
  const getCenter = (nodeId) => {
    const n = nodes.find((nd) => nd.id === nodeId);
    if (!n) return { x: 0, y: 0 };
    return { x: (n.position?.x || 0) + 104, y: (n.position?.y || 0) + 40 };
  };

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = getCenter(edge.from);
        const to = getCenter(edge.to);
        const midY = (from.y + to.y) / 2;
        return (
          <path
            key={edge.id}
            d={`M${from.x},${from.y + 20} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y - 20}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="6 3"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}

/* ── Schema-driven Config Field ─────────────────────────── */
function ConfigField({ fieldKey, spec, value, onChange }) {
  const label = fieldKey.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
  const fieldId = `config-${fieldKey}`;

  if (spec.type === "enum" && Array.isArray(spec.values)) {
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label} {spec.required && <span className="text-red-400">*</span>}
        </label>
        <select
          id={fieldId}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">— Select —</option>
          {spec.values.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    );
  }

  if (spec.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={fieldId}
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-500"
        />
        <label htmlFor={fieldId} className="text-xs text-gray-600 dark:text-gray-300">
          {label} {spec.required && <span className="text-red-400">*</span>}
        </label>
      </div>
    );
  }

  if (spec.type === "number") {
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label} {spec.required && <span className="text-red-400">*</span>}
        </label>
        <input
          id={fieldId}
          type="number"
          value={value ?? ""}
          min={spec.min}
          max={spec.max}
          step={spec.integer ? 1 : "any"}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          placeholder={spec.min !== undefined ? `${spec.min} – ${spec.max || "∞"}` : ""}
        />
      </div>
    );
  }

  if (spec.type === "objectIdString") {
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label} {spec.required && <span className="text-red-400">*</span>}
        </label>
        <input
          id={fieldId}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          placeholder="24-char ObjectId"
          maxLength={24}
        />
      </div>
    );
  }

  // Default: string
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label} {spec.required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={fieldId}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        placeholder={label}
        maxLength={spec.maxLength || 256}
      />
    </div>
  );
}

/* ── Node Inspector (right panel) ───────────────────────── */
function NodeInspector({ node, registry, onUpdate, onClose }) {
  if (!node) return null;
  const meta = TYPE_META[node.type] || TYPE_META.action;
  const Icon = meta.icon;

  // Find the registry entry's configSchema for this node's subtype
  const registryEntries = registry?.[node.type] || [];
  const entry = registryEntries.find((e) => e.subtype === node.subtype);
  const configSchema = entry?.configSchema;
  const fields = configSchema?.fields || {};
  const fieldKeys = Object.keys(fields);

  const handleConfigChange = (key, value) => {
    const newConfig = { ...(node.config || {}), [key]: value };
    if (value === undefined || value === null || value === "") {
      delete newConfig[key];
    }
    onUpdate(node.id, { config: newConfig });
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: meta.bg, color: meta.color }}>
            <Icon className="h-3 w-3" />
          </div>
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200">Configure Node</h3>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Label */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Label</label>
          <input
            value={node.label || ""}
            onChange={(e) => onUpdate(node.id, { label: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Node label"
          />
        </div>
        {/* Subtype (read-only) */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Subtype</label>
          <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">{node.subtype}</p>
        </div>
        {/* Type badge */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</label>
          <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: meta.bg, color: meta.color }}>
            {node.type}
          </span>
          {entry?.status === "preview" && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <AlertTriangle className="h-2.5 w-2.5" /> PREVIEW
            </span>
          )}
        </div>
        {/* Approval toggle */}
        {node.type !== "trigger" && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reqApproval"
              checked={node.requiresApproval || false}
              onChange={(e) => onUpdate(node.id, { requiresApproval: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-500"
            />
            <label htmlFor="reqApproval" className="text-xs text-gray-600 dark:text-gray-300">Requires approval</label>
          </div>
        )}

        {/* ── Schema-driven config fields ── */}
        {fieldKeys.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <Settings className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Configuration
              </span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-3 dark:border-gray-700 dark:bg-gray-800/50">
              {fieldKeys.map((key) => (
                <ConfigField
                  key={key}
                  fieldKey={key}
                  spec={fields[key]}
                  value={node.config?.[key]}
                  onChange={(val) => handleConfigChange(key, val)}
                />
              ))}
            </div>
          </div>
        )}

        {fieldKeys.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
            <p className="text-center text-[11px] text-gray-400">
              <CheckCircle className="mx-auto mb-1 h-4 w-4" />
              No configuration required for this node type.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Builder Page ──────────────────────────────────── */
const WorkflowBuilderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    active, activeLoading, dirty, saving, registry, registryLoading, selectedNodeId,
  } = useSelector((s) => s.workflowV2);

  const canvasRef = useRef(null);
  const [_pan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const dragStart = useRef(null);

  // Load registry + workflow
  useEffect(() => {
    if (!registry) dispatch(fetchRegistry());
    if (id && id !== "new") {
      dispatch(fetchWorkflow(id));
    } else {
      dispatch(setActiveWorkflow({
        name: "Untitled Workflow",
        description: "",
        nodes: [],
        edges: [],
        status: "draft",
      }));
    }
    return () => dispatch(clearActiveWorkflow());
  }, [dispatch, id, registry]);

  // Add node from palette
  const handleAddNode = useCallback((entry) => {
    const nodeId = `${entry.type}_${uid()}`;
    const existingNodes = active?.nodes || [];
    dispatch(addNode({
      id: nodeId,
      type: entry.type,
      subtype: entry.subtype,
      label: entry.displayName,
      config: {},
      position: { x: 200 + existingNodes.length * 40, y: 100 + existingNodes.length * 80 },
      requiresApproval: entry.requiresApproval || false,
    }));
    dispatch(selectNode(nodeId));
  }, [dispatch, active]);

  // Drag node
  const handleDragStart = useCallback((nodeId, e) => {
    const node = active?.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragStart.current = { x: e.clientX - (node.position?.x || 0), y: e.clientY - (node.position?.y || 0) };
    setDragging(nodeId);
  }, [active]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      if (!dragStart.current) return;
      dispatch(moveNode({
        id: dragging,
        x: Math.round((e.clientX - dragStart.current.x) / zoom),
        y: Math.round((e.clientY - dragStart.current.y) / zoom),
      }));
    };
    const up = () => { setDragging(null); dragStart.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, dispatch, zoom]);

  // Connection
  const handleConnect = useCallback((fromId) => {
    if (connecting) {
      if (connecting !== fromId) {
        dispatch(addEdge({ id: `e_${uid()}`, from: connecting, to: fromId }));
      }
      setConnecting(null);
    } else {
      setConnecting(fromId);
    }
  }, [connecting, dispatch]);

  // Delete
  const handleDelete = useCallback((nodeId) => dispatch(removeNode(nodeId)), [dispatch]);

  // Save
  const handleSave = async () => {
    if (!active) return;
    try {
      const payload = {
        name: active.name,
        description: active.description,
        nodes: active.nodes,
        edges: active.edges,
        status: active.status || "draft",
      };
      const result = await dispatch(saveWorkflow({ id: active._id || null, payload })).unwrap();
      toast.success("Workflow saved!");
      if (!active._id && result._id) navigate(`/admin/crm/workflows/${result._id}`, { replace: true });
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to save");
    }
  };

  // Update node from inspector
  const handleUpdateNode = useCallback((nodeId, changes) => {
    dispatch(updateNode({ id: nodeId, changes }));
  }, [dispatch]);

  const selectedNode = active?.nodes?.find((n) => n.id === selectedNodeId);

  // Zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
    }
  }, []);

  if (activeLoading || registryLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
          <p className="text-sm text-gray-500">Loading builder…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/crm/workflows")}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-blue-500" />
            <input
              value={active?.name || ""}
              onChange={(e) => dispatch(setWorkflowName(e.target.value))}
              className="border-none bg-transparent text-sm font-semibold text-gray-800 outline-none focus:ring-0 dark:text-gray-100"
              placeholder="Workflow name"
            />
          </div>
          {dirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              UNSAVED
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            active?.status === "active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}>
            {active?.status || "draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connecting && (
            <span className="mr-2 animate-pulse rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              Click a target node to connect…
              <button onClick={() => setConnecting(null)} className="ml-2 text-blue-400 hover:text-blue-600">
                <X className="inline h-3 w-3" />
              </button>
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            {active?.nodes?.length || 0} nodes · {active?.edges?.length || 0} edges
          </span>
          {/* Activate / Deactivate button */}
          {active?._id && (
            <button
              onClick={async () => {
                const isActive = active.status === "active";
                if (isActive && !window.confirm("Deactivate this workflow? It will stop firing on CRM events.")) return;
                try {
                  await dispatch(activateWorkflow({ id: active._id, activate: !isActive })).unwrap();
                  toast.success(isActive ? "Workflow deactivated" : "Workflow activated!");
                } catch (err) {
                  toast.error(typeof err === "string" ? err : "Activation failed");
                }
              }}
              disabled={saving || (dirty && active.status !== "active")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                active?.status === "active"
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
              }`}
              title={active?.status === "active" ? "Deactivate workflow" : dirty ? "Save first, then activate" : "Activate workflow"}
            >
              <Power className="h-3.5 w-3.5" />
              {active?.status === "active" ? "Deactivate" : "Activate"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        <NodePalette registry={registry} onAdd={handleAddNode} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          onWheel={handleWheel}
          onClick={() => dispatch(clearSelection())}
          className="relative flex-1 overflow-hidden"
          style={{ backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)", backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}
        >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }} className="absolute inset-0">
            {active?.edges && <CanvasEdges edges={active.edges} nodes={active.nodes || []} />}
            {active?.nodes?.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                selected={selectedNodeId === node.id}
                onSelect={(nid) => { dispatch(selectNode(nid)); }}
                onDragStart={handleDragStart}
                onDelete={handleDelete}
                onConnect={handleConnect}
              />
            ))}
            {(!active?.nodes || active.nodes.length === 0) && (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                  <Workflow className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="mb-1 text-sm font-medium text-gray-400 dark:text-gray-500">Empty Canvas</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    Drag nodes from the palette on the left to build your workflow
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* Zoom indicator */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-medium text-gray-500 shadow-sm backdrop-blur dark:bg-gray-800/80 dark:text-gray-400">
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="px-1 hover:text-gray-800 dark:hover:text-gray-200">+</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} className="px-1 hover:text-gray-800 dark:hover:text-gray-200">−</button>
          </div>
        </div>

        {/* Inspector */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            registry={registry}
            onUpdate={handleUpdateNode}
            onClose={() => dispatch(clearSelection())}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;

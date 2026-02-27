import { useState, useEffect, useRef, useMemo } from "react";
import { Bookmark, ChevronDown, Plus, Trash2, Check } from "lucide-react";

const STORAGE_KEY = "crm_saved_views";

const getStoredViews = (module) => {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[module] || [];
  } catch {
    return [];
  }
};

const setStoredViews = (module, views) => {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[module] = views;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
};

const SavedViews = ({ module, currentFilters, onApply }) => {
  const [viewVersion, setViewVersion] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const views = useMemo(() => getStoredViews(module), [module, viewVersion]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const prevModuleRef = useRef(module);
  const [activeViewId, setActiveViewId] = useState(null);
  const dropdownRef = useRef(null);

  // Reset active view when module changes (no effect needed)
  if (prevModuleRef.current !== module) {
    prevModuleRef.current = module;
    if (activeViewId !== null) setActiveViewId(null);
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveView = () => {
    if (!newName.trim()) return;
    const newView = {
      id: Date.now().toString(36),
      name: newName.trim(),
      filters: { ...currentFilters },
    };
    const updated = [...views, newView];
    setStoredViews(module, updated);
    setViewVersion((v) => v + 1);
    setNewName("");
    setIsCreating(false);
    setActiveViewId(newView.id);
  };

  const handleApply = (view) => {
    setActiveViewId(view.id);
    onApply(view.filters);
    setIsOpen(false);
  };

  const handleDelete = (viewId, event) => {
    event.stopPropagation();
    const updated = views.filter((v) => v.id !== viewId);
    setStoredViews(module, updated);
    setViewVersion((v) => v + 1);
    if (activeViewId === viewId) setActiveViewId(null);
  };

  const activeView = views.find((v) => v.id === activeViewId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
          activeView
            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        }`}
      >
        <Bookmark className="h-4 w-4" />
        <span>{activeView ? activeView.name : "Views"}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-56 overflow-y-auto p-1.5">
            {views.length === 0 && !isCreating && (
              <p className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                No saved views yet
              </p>
            )}
            {views.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => handleApply(view)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeViewId === view.id
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {activeViewId === view.id && (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{view.name}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDelete(view.id, e)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveView()}
                  placeholder="View name..."
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveView}
                  className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Plus className="h-4 w-4" />
                Save current view
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedViews;

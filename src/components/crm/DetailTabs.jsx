const DetailTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default DetailTabs;

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Globe,
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { fetchLeadAnalytics } from "../../store/slices/leadsSlice";
import { LoadingSpinner, StatCard } from "../../components/ui";

const LeadAnalytics = ({ isAdmin = true }) => {
  const dispatch = useDispatch();
  const { analytics, isAnalyticsLoading } = useSelector((state) => state.leads);

  useEffect(() => {
    dispatch(fetchLeadAnalytics());
  }, [dispatch]);

  if (isAnalyticsLoading && !analytics) {
    return <LoadingSpinner />;
  }

  const backPath = isAdmin ? "/admin/leads" : "/marketing/leads";
  const summary = analytics?.summary || {};
  const byStatus = analytics?.byStatus || [];
  const bySource = analytics?.bySource || [];
  const byWebsite = analytics?.byWebsite || [];
  const conversionRate = analytics?.conversionRate || 0;
  const avgScore = analytics?.averageScore || 0;

  const STATUS_COLORS = {
    new: "#3B82F6",
    contacted: "#EAB308",
    interested: "#A855F7",
    qualified: "#22C55E",
    closed: "#10B981",
    lost: "#EF4444",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={backPath}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Lead Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview of lead performance and conversion metrics
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={summary.total || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Avg Lead Score"
          value={avgScore.toFixed(0)}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Unassigned"
          value={summary.unassigned || 0}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Leads by Status
          </h2>
          {byStatus.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No data available
            </p>
          ) : (
            <div className="space-y-3">
              {byStatus.map((item) => {
                const total = summary.total || 1;
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item._id || item.status}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {item._id || item.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            STATUS_COLORS[item._id || item.status] || "#6B7280",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads by Source */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Globe className="h-5 w-5 text-green-500" />
            Leads by Source
          </h2>
          {bySource.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No data available
            </p>
          ) : (
            <div className="space-y-3">
              {bySource.map((item) => {
                const total = summary.total || 1;
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item._id || item.source}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {(item._id || item.source || "").replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads by Website */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Globe className="h-5 w-5 text-purple-500" />
            Leads by Website
          </h2>
          {byWebsite.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No data available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Website
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Leads
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      Avg Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {byWebsite.map((item) => (
                    <tr key={item._id}>
                      <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                        {item.websiteName || item._id}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-sm text-gray-600 dark:text-gray-300">
                        {item.count}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-sm text-gray-600 dark:text-gray-300">
                        {(item.avgScore || 0).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Clock className="h-5 w-5 text-amber-500" />
            Quick Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickStat label="New Today" value={summary.newToday || 0} />
            <QuickStat label="New This Week" value={summary.newThisWeek || 0} />
            <QuickStat
              label="New This Month"
              value={summary.newThisMonth || 0}
            />
            <QuickStat label="Duplicates" value={summary.duplicates || 0} />
            <QuickStat label="Qualified" value={summary.qualified || 0} />
            <QuickStat label="Closed Won" value={summary.closed || 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </div>
);

export default LeadAnalytics;

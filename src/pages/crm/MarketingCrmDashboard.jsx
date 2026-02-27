import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard, DashboardSkeleton } from "../../components/ui";
import { fetchCrmDashboard } from "../../store/slices/crm/crmSlice";
import {
  UserCheck,
  TrendingUp,
  CheckCircle,
  CalendarDays,
  ListChecks,
} from "lucide-react";

const STATUS_COLORS = {
  completed: "#22c55e",
  planned: "#3b82f6",
  overdue: "#ef4444",
  "in-progress": "#f59e0b",
};

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const MarketingCrmDashboard = () => {
  const dispatch = useDispatch();
  const { marketing, loading } = useSelector((state) => state.crm.dashboards);
  const [dateRange, setDateRange] = useState("30d");

  const loadDashboard = useCallback(() => {
    dispatch(fetchCrmDashboard({ role: "marketing", dateRange }));
  }, [dispatch, dateRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading || !marketing) {
    return <DashboardSkeleton />;
  }

  const weeklyData = marketing.weeklyPerformance || [];
  const activityBreakdown = marketing.activityBreakdown || [];
  const conversionTrend = marketing.conversionTrend || [];

  return (
    <div className="space-y-5">
      {/* Header with Date Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My CRM Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assigned lead and activity metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Leads"
          value={marketing.assignedLeads || 0}
          icon={UserCheck}
        />
        <StatCard
          title="Conversion Rate"
          value={`${marketing.conversionRate || 0}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Activity Completion"
          value={`${marketing.activityCompletionRate || 0}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Tasks"
          value={marketing.pendingTasks || 0}
          icon={ListChecks}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Weekly Performance */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Weekly Performance
          </h3>
          <div className="h-72">
            {weeklyData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-400">
                No weekly data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="converted"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                    name="Converted"
                  />
                  <Bar
                    dataKey="activitiesCompleted"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    name="Activities Done"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Activity Breakdown Pie */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Activity Breakdown
          </h3>
          <div className="h-72">
            {activityBreakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-400">
                No activity data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityBreakdown}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ status, percent }) =>
                      `${status} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {activityBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Conversion Trend Line */}
      {conversionTrend.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Conversion Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Conversion %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingCrmDashboard;

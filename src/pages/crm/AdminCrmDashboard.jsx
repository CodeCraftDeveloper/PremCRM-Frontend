import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { StatCard, DashboardSkeleton } from "../../components/ui";
import { fetchCrmDashboard } from "../../store/slices/crm/crmSlice";
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  Users,
  CalendarDays,
} from "lucide-react";

const PIE_COLORS = [
  "#2563eb",
  "#0891b2",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
];

const AdminCrmDashboard = () => {
  const dispatch = useDispatch();
  const { admin, loading } = useSelector((state) => state.crm.dashboards);
  const [dateRange, setDateRange] = useState("30d");

  const loadDashboard = useCallback(() => {
    dispatch(fetchCrmDashboard({ role: "admin", dateRange }));
  }, [dispatch, dateRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading || !admin) {
    return <DashboardSkeleton />;
  }

  const funnelData = admin.pipelineFunnel || [];
  const teamPerf = admin.teamPerformance || [];
  const leadSource = admin.leadSourceChart || [];
  const revenueTrend = admin.revenueTrend || [];

  return (
    <div className="space-y-5">
      {/* Header with Date Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            CRM Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Admin analytics for pipeline and revenue health.
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
          title="Revenue Forecast"
          value={`$${Number(admin.revenueForecast || 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Open Deals"
          value={admin.openDeals || 0}
          icon={Briefcase}
        />
        <StatCard
          title="Win Rate"
          value={`${admin.winRate || 0}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Active Contacts"
          value={admin.activeContacts || 0}
          icon={Users}
        />
      </div>

      {/* Pipeline Funnel + Lead Source */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Pipeline Funnel
          </h3>
          <div className="h-64">
            {funnelData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-400">
                No funnel data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip formatter={(value) => [value, "Deals"]} />
                  <Funnel dataKey="count" data={funnelData} isAnimationActive>
                    <LabelList
                      position="right"
                      fill="#334155"
                      stroke="none"
                      dataKey="stage"
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Lead Source Distribution
          </h3>
          <div className="h-64">
            {leadSource.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-gray-400">
                No lead source data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSource}
                    dataKey="count"
                    nameKey="source"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ source, percent }) =>
                      `${source} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {leadSource.map((entry, index) => (
                      <Cell
                        key={`${entry.source}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
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

      {/* Revenue Trend Area Chart */}
      {revenueTrend.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            Revenue Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(v) => [
                    `$${Number(v).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Team Performance Leaderboard */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Team Leaderboard
        </h3>
        {teamPerf.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No team performance data
          </p>
        ) : (
          <div className="space-y-0">
            <div className="mb-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teamPerf}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="dealsWon"
                    fill="#2563eb"
                    radius={[0, 4, 4, 0]}
                    name="Deals Won"
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#14b8a6"
                    radius={[0, 4, 4, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-3">
              {teamPerf.slice(0, 3).map((member, idx) => (
                <div
                  key={member.name || idx}
                  className={`rounded-lg border p-3 text-center ${
                    idx === 0
                      ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                      : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <span className="text-2xl">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.dealsWon || 0} deals
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCrmDashboard;

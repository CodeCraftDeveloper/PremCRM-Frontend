import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchAdminDashboard } from "../../store/slices/dashboardSlice";
import { StatCard, LoadingSpinner, StatusBadge } from "../../components/ui";
import { format } from "date-fns";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const STATUS_KEYS = [
  "new",
  "contacted",
  "interested",
  "negotiation",
  "converted",
  "lost",
];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { adminStats, isLoading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (isLoading || !adminStats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  const {
    overview,
    clientStats,
    monthlyTrend,
    topMarketers,
    recentClients,
  } = adminStats;

  const statusChartData = STATUS_KEYS.map((key) => ({
    name: key,
    value: clientStats?.[key] || 0,
  })).filter((item) => item.value > 0);

  const trendsChartData =
    monthlyTrend?.map((item) => ({
      name: `${item._id.month}/${item._id.year}`,
      clients: item.count,
    })) || [];

  const upcomingFollowUps =
    recentClients
      ?.filter((c) => c.nextFollowUpDate)
      .sort(
        (a, b) => new Date(a.nextFollowUpDate) - new Date(b.nextFollowUpDate),
      )
      .slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Overview of your CRM system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={overview?.totalUsers || 0}
          icon={Users}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Events"
          value={overview?.activeEvents || 0}
          icon={Calendar}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Clients"
          value={overview?.totalClients || 0}
          icon={Briefcase}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Converted Leads"
          value={clientStats?.converted || 0}
          icon={CheckCircle}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Client Status Distribution
          </h3>
          <div className="h-64">
            {statusChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                No client status data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Client Acquisition Trends
          </h3>
          <div className="h-64">
            {trendsChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="clients" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performers
            </h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            {topMarketers?.length ? (
              topMarketers.slice(0, 5).map((user, index) => (
                <div key={user.email || index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {user.totalClients} clients
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No performance data yet
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Clients
            </h3>
            <Link
              to="/admin/clients"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentClients?.length ? (
              recentClients.slice(0, 5).map((client) => (
                <div
                  key={client._id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {client.companyName}
                    </p>
                  </div>
                  <StatusBadge status={client.followUpStatus} />
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No recent clients
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Follow-ups
            </h3>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-3">
            {upcomingFollowUps.map((client) => (
              <div
                key={client._id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(client.nextFollowUpDate), "MMM d, yyyy")}
                  </p>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            ))}
            {upcomingFollowUps.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No upcoming follow-ups
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fetchMarketingDashboard } from "../../store/slices/dashboardSlice";
import { StatCard, LoadingSpinner, StatusBadge } from "../../components/ui";
import { format } from "date-fns";
import { connectSocket } from "../../services/socket";

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

const MarketingDashboard = () => {
  const dispatch = useDispatch();
  const { marketingStats, isLoading } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);
  const token = localStorage.getItem("accessToken");
  const refreshTimerRef = useRef(null);
  const initializedRef = useRef(false);
  const dashboardInFlightRef = useRef(false);
  const performanceInFlightRef = useRef(false);
  const lastDashboardFetchAtRef = useRef(0);
  const lastPerformanceFetchAtRef = useRef(0);
  const [myPerformance, setMyPerformance] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const MIN_FETCH_INTERVAL_MS = 3000;

  const fetchLatestDashboard = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastDashboardFetchAtRef.current < MIN_FETCH_INTERVAL_MS) {
      return;
    }
    if (dashboardInFlightRef.current) return;

    dashboardInFlightRef.current = true;
    try {
      await dispatch(fetchMarketingDashboard());
      lastDashboardFetchAtRef.current = Date.now();
    } finally {
      dashboardInFlightRef.current = false;
    }
  }, [dispatch]);

  const fetchMyPerformance = useCallback(async (force = false) => {
    if (!token) return;
    const now = Date.now();
    if (!force && now - lastPerformanceFetchAtRef.current < MIN_FETCH_INTERVAL_MS) {
      return;
    }
    if (performanceInFlightRef.current) return;

    performanceInFlightRef.current = true;
    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "")}/sessions/marketing/my-performance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (data?.success && data?.data) {
        setMyPerformance({
          ...data.data,
          _receivedAt: Date.now(),
        });
        lastPerformanceFetchAtRef.current = Date.now();
      }
    } catch {
      // Keep dashboard usable even if performance endpoint fails.
    } finally {
      performanceInFlightRef.current = false;
    }
  }, [token]);

  const queueDashboardRefresh = useCallback(() => {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      fetchLatestDashboard();
      fetchMyPerformance();
    }, 1200);
  }, [fetchLatestDashboard, fetchMyPerformance]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    fetchLatestDashboard(true);
    fetchMyPerformance(true);
  }, [fetchLatestDashboard, fetchMyPerformance]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const socket = connectSocket(token);
    if (!socket) return undefined;

    const handleDashboardRefresh = () => {
      queueDashboardRefresh();
    };

    socket.on("dashboard:refresh", handleDashboardRefresh);

    return () => {
      socket.off("dashboard:refresh", handleDashboardRefresh);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [queueDashboardRefresh, token]);

  if (isLoading || !marketingStats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  const { clientStats, pendingFollowUps, myActivity } = marketingStats;
  const totalClients = clientStats?.total || 0;
  const convertedClients = clientStats?.converted || 0;
  const workedLeads =
    (clientStats?.contacted || 0) +
    (clientStats?.interested || 0) +
    (clientStats?.negotiation || 0) +
    (clientStats?.converted || 0) +
    (clientStats?.lost || 0);
  const pendingCount = pendingFollowUps?.length || 0;
  const conversionRate =
    workedLeads > 0 ? ((convertedClients / workedLeads) * 100).toFixed(1) : 0;

  const statusChartData = STATUS_KEYS.map((key) => ({
    name: key,
    value: clientStats?.[key] || 0,
  })).filter((item) => item.value > 0);
  const todayKey = new Date().toISOString().split("T")[0];
  const liveTodaySeconds =
    myPerformance && myPerformance.isOnline
      ? (myPerformance.todayTotalOnlineSeconds || 0) +
        Math.max(
          0,
          Math.floor((nowTick - (myPerformance._receivedAt || nowTick)) / 1000),
        )
      : myPerformance?.todayTotalOnlineSeconds || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Here is your sales dashboard overview
        </p>
      </div>

      {myPerformance && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            My Live Performance
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div
              className={`rounded p-3 ${
                myPerformance.isOnline
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <p className="text-xs">Status</p>
              <p className="text-xl font-bold">
                {myPerformance.isOnline ? "Online" : "Offline"}
              </p>
            </div>
            <div className="rounded bg-blue-50 p-3">
              <p className="text-xs text-gray-600">Today Working Time</p>
              <p className="text-xl font-bold text-blue-700">
                {formatSeconds(liveTodaySeconds)}
              </p>
            </div>
            <div className="rounded bg-purple-50 p-3">
              <p className="text-xs text-gray-600">Today Sessions</p>
              <p className="text-xl font-bold text-purple-700">
                {myPerformance.todaySessions || 0}
              </p>
            </div>
            <div className="rounded bg-orange-50 p-3">
              <p className="text-xs text-gray-600">Contacted Today</p>
              <p className="text-xl font-bold text-orange-700">
                {myPerformance.dailyContactedUsers || 0}
              </p>
            </div>
            <div className="rounded bg-slate-50 p-3">
              <p className="text-xs text-gray-600">Avg Session</p>
              <p className="text-xl font-bold text-slate-700">
                {myPerformance.avgSessionDuration || "0s"}
              </p>
            </div>
          </div>

          {Array.isArray(myPerformance.dayWiseStats) &&
            myPerformance.dayWiseStats.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Day Wise Live Working Time & Daily Contacted
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                  {myPerformance.dayWiseStats.map((day) => {
                    const dayLiveSeconds =
                      day.date === todayKey
                        ? liveTodaySeconds
                        : day.totalOnlineSeconds || 0;
                    const dayOnline =
                      day.date === todayKey
                        ? myPerformance.isOnline
                        : day.status === "online";
                    return (
                      <div
                        key={`my-day-${day.date}`}
                        className="rounded-md bg-gray-50 p-3 dark:bg-gray-700/50"
                      >
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-300">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatSeconds(dayLiveSeconds)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Contacted: {day.contactedUsers || 0}
                        </p>
                        <p
                          className={`mt-1 text-xs font-medium ${
                            dayOnline ? "text-emerald-600" : "text-gray-500"
                          }`}
                        >
                          {dayOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Clients"
          value={totalClients}
          icon={Briefcase}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Pending Follow-ups"
          value={pendingCount}
          icon={Clock}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Converted Leads"
          value={convertedClients}
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Conversion Rate (Worked)"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Client Status Distribution
          </h3>
          <div className="h-48 min-h-[192px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
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
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Follow-ups
            </h3>
            <Link
              to="/marketing/clients"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingFollowUps?.slice(0, 5).map((client) => (
              <Link
                key={client._id}
                to={`/marketing/clients/${client._id}`}
                className="block rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {client.companyName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {client.nextFollowUpDate
                        ? format(new Date(client.nextFollowUpDate), "MMM d")
                        : "Not set"}
                    </p>
                    <StatusBadge status={client.followUpStatus} />
                  </div>
                </div>
              </Link>
            ))}
            {(!pendingFollowUps || pendingFollowUps.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No upcoming follow-ups
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link
              to="/marketing/clients/new"
              className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-sm font-medium">Add New Client</span>
            </Link>
            <Link
              to="/marketing/events"
              className="flex items-center gap-3 rounded-lg bg-green-50 p-3 text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">View Events</span>
            </Link>
          </div>
        </div>
      </div>

      {myActivity && myActivity.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {myActivity.map((activity) => (
              <div
                key={activity._id}
                className="flex items-start gap-3 border-l-2 border-blue-500 pl-3"
              >
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.createdAt
                      ? format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function formatSeconds(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

export default MarketingDashboard;

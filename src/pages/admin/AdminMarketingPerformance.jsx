import { useState, useEffect, useCallback, useRef } from "react";
import { LoadingSpinner, EmptyState } from "../../components";
import { Activity, Clock, TrendingUp } from "lucide-react";
import api from "../../services/api";
import { connectSocket } from "../../services/socket";

export default function AdminMarketingPerformance() {
  const [marketingUsers, setMarketingUsers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("status"); // status or performance
  const [userReport, setUserReport] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const performanceRefreshTimerRef = useRef(null);

  const withReceivedAt = (status) => ({
    ...status,
    _receivedAt: Date.now(),
  });

  const getLiveSeconds = (status, key) => {
    if (!status) return 0;
    const base = Number(status[key] || 0);
    if (!status.isOnline) return base;
    const elapsed = Math.floor((nowTick - (status._receivedAt || nowTick)) / 1000);
    return base + Math.max(0, elapsed);
  };

  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchMarketingUsersStatus = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/sessions/marketing/status");

        if (response.data.success) {
          setMarketingUsers((response.data.data || []).map(withReceivedAt));
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch marketing users status",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketingUsersStatus();
  }, []);

  // Live ticker to update durations every second without refresh.
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchPerformanceData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      const response = await api.get("/sessions/marketing/performance");

      if (response.data.success) {
        setPerformanceData(response.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch performance data",
      );
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleSnapshot = (statuses) => {
      setMarketingUsers(
        (Array.isArray(statuses) ? statuses : []).map(withReceivedAt),
      );
    };

    const handleStatusChanged = (status) => {
      setMarketingUsers((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const index = list.findIndex(
          (user) => String(user.userId) === String(status.userId),
        );
        const incoming = withReceivedAt(status);
        if (index >= 0) {
          list[index] = incoming;
        } else {
          list.push(incoming);
        }
        return list;
      });
    };

    const queuePerformanceRefresh = () => {
      if (activeTab !== "performance") return;
      if (performanceRefreshTimerRef.current) return;
      performanceRefreshTimerRef.current = setTimeout(() => {
        performanceRefreshTimerRef.current = null;
        fetchPerformanceData(false);
      }, 700);
    };

    const handleDashboardRefresh = () => {
      queuePerformanceRefresh();
    };

    socket.on("marketing:status_snapshot", handleSnapshot);
    socket.on("marketing:status_changed", handleStatusChanged);
    socket.on("dashboard:refresh", handleDashboardRefresh);

    return () => {
      socket.off("marketing:status_snapshot", handleSnapshot);
      socket.off("marketing:status_changed", handleStatusChanged);
      socket.off("dashboard:refresh", handleDashboardRefresh);
      if (performanceRefreshTimerRef.current) {
        clearTimeout(performanceRefreshTimerRef.current);
        performanceRefreshTimerRef.current = null;
      }
    };
  }, [activeTab, fetchPerformanceData]);

  const fetchUserReport = async (userId) => {
    try {
      const response = await api.get(`/sessions/marketing/${userId}/report`, {
        params: { days: 30 },
      });

      if (response.data.success) {
        setUserReport(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user report");
    }
  };

  useEffect(() => {
    if (activeTab === "performance") {
      fetchPerformanceData(true);
    }
  }, [activeTab, fetchPerformanceData]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Marketing Team Performance</h2>
          <p className="text-sm text-gray-500">Live status and productivity by manager</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("status")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === "status"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity size={18} />
              Online Status
            </div>
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === "performance"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={18} />
              Performance
            </div>
          </button>
        </div>

        {/* Online Status Tab */}
        {activeTab === "status" && (
          <div>
            <div className="grid gap-4">
              {marketingUsers.length === 0 ? (
                <EmptyState message="No marketing users found" />
              ) : (
                marketingUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-600">{user.phone}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Online Status */}
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                              user.isOnline
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                user.isOnline ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            {user.isOnline ? "Online" : "Offline"}
                          </div>
                          {user.lastLogin && (
                            <p className="text-xs text-gray-500 mt-2">
                              Last: {new Date(user.lastLogin).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Time Info */}
                        <div className="text-right bg-gray-50 p-3 rounded">
                          {user.isOnline && user.currentSessionDuration > 0 && (
                            <div>
                              <p className="text-xs text-gray-600">
                                Current Session
                              </p>
                              <p className="font-semibold text-gray-900">
                                {formatSeconds(getLiveSeconds(user, "currentSessionDuration"))}
                              </p>
                            </div>
                          )}
                          <div className="mt-2">
                            <p className="text-xs text-gray-600">
                              Today's Total
                            </p>
                            <p className="font-semibold text-gray-900">
                              {formatSeconds(
                                getLiveSeconds(user, "todayTotalOnlineSeconds"),
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.sessionsToday} session
                              {user.sessionsToday !== 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-gray-500">
                              Contacted today: {user.dailyContactedUsers || 0}
                            </p>
                          </div>
                        </div>

                        {/* View Report Button */}
                        <button
                          onClick={() => fetchUserReport(user.userId)}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div>
            <div className="grid gap-4">
              {performanceData.length === 0 ? (
                <EmptyState message="No performance data available" />
              ) : (
                performanceData.map((user) => {
                  const live = marketingUsers.find(
                    (item) => String(item.userId) === String(user.userId),
                  );
                  const liveSessions = live ? live.sessionsToday : user.totalSessions;
                  const liveTotalSeconds = live
                    ? getLiveSeconds(live, "todayTotalOnlineSeconds")
                    : user.todayTotalOnlineSeconds || user.totalOnlineSeconds || 0;
                  const liveAvgSeconds =
                    liveSessions > 0 ? Math.floor(liveTotalSeconds / liveSessions) : 0;
                  const isOnline = live ? live.isOnline : Boolean(user.isOnline);
                  const dayWiseStats = Array.isArray(user.dayWiseStats)
                    ? user.dayWiseStats
                    : [];

                  return (
                    <div
                      key={user.userId}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>

                        <div className="grid grid-cols-6 gap-4">
                          <div
                            className={`p-4 rounded ${
                              isOnline
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <p className="text-xs mb-1">Status</p>
                            <p className="text-xl font-bold">
                              {isOnline ? "Online" : "Offline"}
                            </p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Total Sessions
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {liveSessions}
                            </p>
                          </div>

                          <div className="bg-green-50 p-4 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Total Online Time
                            </p>
                            <p className="text-xl font-bold text-green-600">
                              {formatSeconds(liveTotalSeconds)}
                            </p>
                          </div>

                          <div className="bg-purple-50 p-4 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Avg Session
                            </p>
                            <p className="text-xl font-bold text-purple-600">
                              {formatSeconds(liveAvgSeconds)}
                            </p>
                          </div>

                          <div className="bg-orange-50 p-4 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Contacted Today
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {user.dailyContactedUsers || 0}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-4 rounded">
                            <p className="text-xs text-gray-600 mb-1">
                              Tickets Created
                            </p>
                            <p className="text-2xl font-bold text-slate-700">
                              {user.ticketsCreated}
                            </p>
                          </div>
                        </div>
                      </div>

                      {dayWiseStats.length > 0 && (
                        <div className="mt-4 rounded-lg border border-gray-200 p-3">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Day Wise Live Working Time & Daily Contacted
                          </p>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                            {dayWiseStats.map((day) => {
                              const dayLiveSeconds =
                                day.date === todayKey && live
                                  ? getLiveSeconds(live, "todayTotalOnlineSeconds")
                                  : day.totalOnlineSeconds || 0;
                              const dayOnline =
                                day.date === todayKey && live
                                  ? live.isOnline
                                  : day.status === "online";

                              return (
                                <div
                                  key={`${user.userId}-${day.date}`}
                                  className="rounded-md bg-gray-50 p-3"
                                >
                                  <p className="text-xs font-medium text-gray-500">
                                    {new Date(day.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {formatSeconds(dayLiveSeconds)}
                                  </p>
                                  <p className="text-xs text-gray-600">
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
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User Report Modal */}
        {userReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userReport.user.name} - Detailed Report
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {userReport.reportPeriod.days} days report
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUserReport(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Metrics Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {userReport.metrics.totalSessions}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Total Online Time</p>
                    <p className="text-2xl font-bold text-green-600">
                      {userReport.metrics.totalOnlineTime}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-sm text-gray-600">
                      Avg Session Duration
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {userReport.metrics.avgSessionDuration}
                    </p>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Breakdown
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userReport.dailyBreakdown.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <span className="text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {day.sessions} session
                            {day.sessions !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-gray-600">
                            {day.totalTime}
                          </p>
                          <p className="text-xs text-gray-600">
                            Contacted: {day.contactedUsers || 0}
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              day.status === "online"
                                ? "text-emerald-600"
                                : "text-gray-500"
                            }`}
                          >
                            {day.status === "online" ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Sessions
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userReport.recentSessions.map((session, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(session.loginTime).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              Duration: {session.durationFormatted}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              session.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {session.isActive ? "Active" : "Completed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSeconds(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

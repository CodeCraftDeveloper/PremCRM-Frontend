import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Globe,
  Target,
  Briefcase,
  Calendar,
  Activity,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { fetchPlatformDashboard } from "../../store/slices/superAdminSlice";

const COLOR_MAP = {
  blue: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  violet: {
    bg: "bg-violet-500/15",
    text: "text-violet-600 dark:text-violet-400",
  },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400" },
  emerald: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
};

const StatCard = ({ icon: Icon, label, value, color = "blue", sub }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/60">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${c.bg}`}
        >
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value ?? "—"}
          </p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const PlanBadge = ({ plan }) => {
  const colors = {
    free: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    enterprise:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[plan] || colors.free}`}
    >
      {plan}
    </span>
  );
};

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, isLoading } = useSelector((state) => state.superAdmin);

  useEffect(() => {
    dispatch(fetchPlatformDashboard());
  }, [dispatch]);

  if (isLoading && !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const o = dashboard?.overview || {};
  const g = dashboard?.growth || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Platform Dashboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          SaaS-wide overview of all tenants, users, and activity
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          icon={Building2}
          label="Total Tenants"
          value={o.totalTenants}
          color="violet"
          sub={`${o.activeTenants || 0} active`}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={o.totalUsers}
          color="blue"
          sub={`${o.activeUsers || 0} active`}
        />
        <StatCard
          icon={Target}
          label="Total Leads"
          value={o.totalLeads}
          color="cyan"
        />
        <StatCard
          icon={Briefcase}
          label="Total Clients"
          value={o.totalClients}
          color="emerald"
        />
        <StatCard
          icon={Wifi}
          label="Live Sessions"
          value={o.activeSessions}
          color="amber"
        />
      </div>

      {/* Growth Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">New Tenants (30&nbsp;d)</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {g.tenantsThisMonth ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Users className="h-4 w-4" />
            <span className="text-sm">New Users (30&nbsp;d)</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {g.usersThisMonth ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Target className="h-4 w-4" />
            <span className="text-sm">New Leads (30&nbsp;d)</span>
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {g.leadsThisMonth ?? "—"}
          </p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800/60">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Tenants by Plan
          </h2>
          <div className="space-y-3">
            {["free", "pro", "enterprise"].map((plan) => {
              const count = dashboard?.tenantsByPlan?.[plan] || 0;
              const pct =
                o.totalTenants > 0
                  ? Math.round((count / o.totalTenants) * 100)
                  : 0;
              return (
                <div key={plan}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <PlanBadge plan={plan} />
                    <span className="text-slate-700 dark:text-slate-300">
                      {count}{" "}
                      <span className="text-slate-500 dark:text-slate-500">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full ${
                        plan === "free"
                          ? "bg-gray-400 dark:bg-gray-500"
                          : plan === "pro"
                            ? "bg-blue-500 dark:bg-blue-500"
                            : "bg-violet-500 dark:bg-violet-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Tenants by Leads */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800/60">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Top Tenants by Leads
          </h2>
          <div className="space-y-2">
            {(dashboard?.topTenants || []).slice(0, 7).map((t, i) => (
              <Link
                key={t._id}
                to={`/superadmin/tenants/${t._id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {t.tenantName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {t.tenantSlug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PlanBadge plan={t.plan} />
                  <span className="text-sm font-semibold text-cyan-400">
                    {t.leadCount}
                  </span>
                </div>
              </Link>
            ))}
            {(!dashboard?.topTenants || dashboard.topTenants.length === 0) && (
              <p className="text-sm text-slate-500 dark:text-slate-500">
                No data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/superadmin/tenants"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-violet-500/40"
        >
          <Building2 className="h-6 w-6 text-violet-400" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Manage Tenants
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Create, edit, deactivate workspaces
            </p>
          </div>
        </Link>
        <Link
          to="/superadmin/users"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-blue-500/40"
        >
          <Users className="h-6 w-6 text-blue-400" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              All Users
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cross-tenant user management
            </p>
          </div>
        </Link>
        <Link
          to="/superadmin/activity"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-emerald-500/40"
        >
          <Activity className="h-6 w-6 text-emerald-400" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              Platform Activity
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Audit logs across tenants
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  User,
} from "lucide-react";
import { fetchPlatformActivity } from "../../store/slices/superAdminSlice";

const actionColors = {
  CREATE: "text-emerald-400",
  UPDATE: "text-blue-400",
  DELETE: "text-red-400",
  LOGIN: "text-cyan-400",
  LOGOUT: "text-slate-400",
  EXPORT: "text-amber-400",
};

const PlatformActivity = () => {
  const dispatch = useDispatch();
  const { activity, activityPagination, isLoading } = useSelector(
    (state) => state.superAdmin,
  );

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const params = { page, limit: 30 };
    if (actionFilter) params.action = actionFilter;
    dispatch(fetchPlatformActivity(params));
  }, [dispatch, page, actionFilter]);

  const pagination = activityPagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Activity</h1>
        <p className="text-sm text-slate-400">
          Audit log of all actions across every tenant
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="EXPORT">Export</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/60">
        {isLoading && activity.length === 0 ? (
          <div className="px-5 py-16 text-center text-slate-500">
            Loading...
          </div>
        ) : activity.length === 0 ? (
          <div className="px-5 py-16 text-center text-slate-500">
            No activity logs found
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {activity.map((a) => (
              <div
                key={a._id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-700/20 transition"
              >
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700/60">
                  <Activity
                    className={`h-4 w-4 ${actionColors[a.action] || "text-slate-400"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold uppercase ${actionColors[a.action] || "text-slate-400"}`}
                    >
                      {a.action}
                    </span>
                    {a.resource && (
                      <span className="text-sm text-white">
                        {a.resource}
                        {a.resourceId && (
                          <span className="text-slate-500">
                            {" "}
                            #{a.resourceId.slice(-6)}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {a.description && (
                    <p className="mt-0.5 text-sm text-slate-300 truncate">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {a.user && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {a.user.name || a.user.email || "—"}
                      </span>
                    )}
                    {a.tenant && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {a.tenant.name || a.tenant.slug || "—"}
                      </span>
                    )}
                    <span>{new Date(a.createdAt).toLocaleString()}</span>
                    {a.ip && <span>IP: {a.ip}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
            total)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformActivity;

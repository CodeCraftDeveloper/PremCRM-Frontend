import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Building2,
  Users,
  Target,
  Calendar,
  Globe,
  Activity,
  ToggleLeft,
  ToggleRight,
  Crown,
  Shield,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchTenantDetail,
  updateTenant,
  toggleUserActive,
  changeUserRole,
} from "../../store/slices/superAdminSlice";

const RoleIcon = ({ role }) => {
  if (role === "admin") return <Crown className="h-3.5 w-3.5 text-amber-400" />;
  if (role === "marketing")
    return <Shield className="h-3.5 w-3.5 text-blue-400" />;
  return <User className="h-3.5 w-3.5 text-slate-400" />;
};

const TenantDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { tenantDetail, isLoading } = useSelector((state) => state.superAdmin);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    dispatch(fetchTenantDetail(id));
  }, [dispatch, id]);

  const startEdit = () => {
    if (tenantDetail?.tenant) {
      setEditForm({
        name: tenantDetail.tenant.name || "",
        companyName: tenantDetail.tenant.company?.name || "",
        plan: tenantDetail.tenant.plan || "free",
        isActive: tenantDetail.tenant.isActive,
        maxUsers: tenantDetail.tenant.settings?.maxUsers || 10,
        maxEvents: tenantDetail.tenant.settings?.maxEvents || 5,
      });
    }
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await dispatch(
        updateTenant({
          id,
          data: {
            name: editForm.name,
            company: { name: editForm.companyName },
            plan: editForm.plan,
            isActive: editForm.isActive,
            settings: {
              maxUsers: Number(editForm.maxUsers),
              maxEvents: Number(editForm.maxEvents),
            },
          },
        }),
      ).unwrap();
      toast.success("Tenant updated");
      setEditMode(false);
      dispatch(fetchTenantDetail(id));
    } catch (err) {
      toast.error(err || "Update failed");
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await dispatch(toggleUserActive(userId)).unwrap();
      toast.success("User status toggled");
      dispatch(fetchTenantDetail(id));
    } catch (err) {
      toast.error(err);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await dispatch(changeUserRole({ id: userId, role })).unwrap();
      toast.success("Role updated");
      dispatch(fetchTenantDetail(id));
    } catch (err) {
      toast.error(err);
    }
  };

  if (isLoading && !tenantDetail) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!tenantDetail?.tenant) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Tenant not found
      </div>
    );
  }

  const { tenant, users, events, websites, recentActivity } = tenantDetail;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/superadmin/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-violet-400 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tenants
      </Link>

      {/* Tenant header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-900/40">
              <Building2 className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              {editMode ? (
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-lg font-bold text-white focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              )}
              <p className="text-sm text-slate-400">
                Slug: {tenant.slug} &bull; Created:{" "}
                {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            >
              Edit Tenant
            </button>
          )}
        </div>
      </div>

      {/* Editable Details */}
      {editMode && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-700/60 bg-slate-800/60 p-5">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Company Name
            </label>
            <input
              value={editForm.companyName}
              onChange={(e) =>
                setEditForm({ ...editForm, companyName: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Plan</label>
            <select
              value={editForm.plan}
              onChange={(e) =>
                setEditForm({ ...editForm, plan: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Max Users
            </label>
            <input
              type="number"
              value={editForm.maxUsers}
              onChange={(e) =>
                setEditForm({ ...editForm, maxUsers: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Max Events
            </label>
            <input
              type="number"
              value={editForm.maxEvents}
              onChange={(e) =>
                setEditForm({ ...editForm, maxEvents: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Active</label>
            <button
              onClick={() =>
                setEditForm({ ...editForm, isActive: !editForm.isActive })
              }
            >
              {editForm.isActive ? (
                <ToggleRight className="h-6 w-6 text-emerald-400" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-red-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Users",
            value: users?.length || 0,
            icon: Users,
            color: "text-blue-400",
          },
          {
            label: "Leads",
            value: tenant.stats?.leadCount ?? 0,
            icon: Target,
            color: "text-cyan-400",
          },
          {
            label: "Clients",
            value: tenant.stats?.clientCount ?? 0,
            icon: Building2,
            color: "text-emerald-400",
          },
          {
            label: "Events",
            value: events?.length || 0,
            icon: Calendar,
            color: "text-amber-400",
          },
          {
            label: "Websites",
            value: websites?.length || 0,
            icon: Globe,
            color: "text-violet-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4"
          >
            <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/60">
        <div className="border-b border-slate-700/60 px-5 py-3">
          <h2 className="text-lg font-semibold text-white">
            Users ({users?.length || 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="px-4 py-2.5 text-slate-400 font-medium">Name</th>
                <th className="px-4 py-2.5 text-slate-400 font-medium">
                  Email
                </th>
                <th className="px-4 py-2.5 text-slate-400 font-medium">Role</th>
                <th className="px-4 py-2.5 text-slate-400 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => {
                const isProtectedUser =
                  tenant?.slug === "__platform__" && u.role === "superadmin";

                return (
                  <tr
                    key={u._id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20"
                  >
                    <td className="px-4 py-2.5 text-white">{u.name}</td>
                    <td className="px-4 py-2.5 text-slate-300">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <RoleIcon role={u.role} />
                        {isProtectedUser ? (
                          <span className="rounded bg-violet-900/40 px-2 py-0.5 text-xs text-violet-300">
                            superadmin
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value)
                            }
                            className="rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs text-white focus:outline-none"
                          >
                            <option value="admin">admin</option>
                            <option value="marketing">marketing</option>
                            <option value="user">user</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {isProtectedUser ? (
                        <span className="text-xs text-violet-300">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleToggleUser(u._id)}
                          className="flex items-center gap-1"
                        >
                          {u.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-red-400" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!users || users.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events */}
      {events && events.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60">
          <div className="border-b border-slate-700/60 px-5 py-3">
            <h2 className="text-lg font-semibold text-white">
              Events ({events.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="px-4 py-2.5 text-slate-400 font-medium">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-slate-400 font-medium">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-slate-400 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e._id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20"
                  >
                    <td className="px-4 py-2.5 text-white">{e.name}</td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {e.status || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Websites */}
      {websites && websites.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60">
          <div className="border-b border-slate-700/60 px-5 py-3">
            <h2 className="text-lg font-semibold text-white">
              Websites ({websites.length})
            </h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((w) => (
              <div
                key={w._id}
                className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3"
              >
                <p className="font-medium text-white">{w.name}</p>
                <p className="text-xs text-slate-400 truncate">
                  {w.url || w.domain || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/60">
          <div className="border-b border-slate-700/60 px-5 py-3">
            <h2 className="text-lg font-semibold text-white">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-slate-700/30">
            {recentActivity.map((a) => (
              <div key={a._id} className="flex items-start gap-3 px-5 py-3">
                <Activity className="mt-0.5 h-4 w-4 text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm text-white">{a.action}</p>
                  <p className="text-xs text-slate-500">
                    {a.user?.name || "System"} &bull;{" "}
                    {new Date(a.createdAt).toLocaleString()}
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

export default TenantDetail;

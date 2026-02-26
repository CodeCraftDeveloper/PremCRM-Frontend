import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Crown,
  Shield,
  User,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAllUsers,
  toggleUserActive,
  changeUserRole,
} from "../../store/slices/superAdminSlice";

const RoleIcon = ({ role }) => {
  if (role === "admin") return <Crown className="h-3.5 w-3.5 text-amber-400" />;
  if (role === "marketing")
    return <Shield className="h-3.5 w-3.5 text-blue-400" />;
  return <User className="h-3.5 w-3.5 text-slate-400" />;
};

const AllUsersPage = () => {
  const dispatch = useDispatch();
  const { users, usersPagination, isLoading } = useSelector(
    (state) => state.superAdmin,
  );

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = { page, limit: 25 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.isActive = statusFilter;
    dispatch(fetchAllUsers(params));
  }, [dispatch, page, search, roleFilter, statusFilter]);

  const handleToggle = async (userId) => {
    try {
      await dispatch(toggleUserActive(userId)).unwrap();
      toast.success("User status toggled");
    } catch (err) {
      toast.error(err);
    }
  };

  const handleRole = async (userId, role) => {
    try {
      await dispatch(changeUserRole({ id: userId, role })).unwrap();
      toast.success("Role updated");
    } catch (err) {
      toast.error(err);
    }
  };

  const pagination = usersPagination || {};
  const platformOwners = users.filter(
    (u) => u.isProtected || (u.role === "superadmin" && u.tenantId?.slug === "__platform__"),
  );
  const regularUsers = users.filter(
    (u) => !(u.isProtected || (u.role === "superadmin" && u.tenantId?.slug === "__platform__")),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Users</h1>
        <p className="text-sm text-slate-400">
          Manage every user across all tenants
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
            placeholder="Search by name or email..."
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="marketing">Marketing</option>
          <option value="user">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Platform Owner Block */}
      {platformOwners.length > 0 && (
        <div className="rounded-xl border border-violet-500/40 bg-violet-900/10 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-300">
            Platform Owner
          </h2>
          <div className="space-y-2">
            {platformOwners.map((u) => (
              <div
                key={u._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-violet-900/40 px-2 py-0.5 text-violet-300">
                    superadmin
                  </span>
                  <span className="text-violet-300">Protected</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/60">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/60">
              <th className="px-4 py-3 text-slate-400 font-medium">User</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Email</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Role</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && regularUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : regularUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No non-owner users found
                </td>
              </tr>
            ) : (
              regularUsers.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-white">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.tenantId ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-violet-400" />
                        <span className="text-slate-300">
                          {u.tenantId.name || u.tenantId.slug || "—"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RoleIcon role={u.role} />
                      {u.role === "superadmin" ? (
                        <span className="rounded bg-violet-900/40 px-2 py-0.5 text-xs text-violet-300">
                          superadmin
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRole(u._id, e.target.value)}
                          className="rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs text-white focus:outline-none"
                        >
                          <option value="admin">admin</option>
                          <option value="marketing">marketing</option>
                          <option value="user">user</option>
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "superadmin" ? (
                      <span className="text-xs text-violet-300">Protected</span>
                    ) : (
                      <button
                        onClick={() => handleToggle(u._id)}
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
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

export default AllUsersPage;

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Users,
  Target,
  Globe,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "../../store/slices/superAdminSlice";

const PlanBadge = ({ plan }) => {
  const colors = {
    free: "bg-gray-700 text-gray-300",
    pro: "bg-blue-900/60 text-blue-300",
    enterprise: "bg-violet-900/60 text-violet-300",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[plan] || colors.free}`}
    >
      {plan}
    </span>
  );
};

const TenantsManagement = () => {
  const dispatch = useDispatch();
  const { tenants, tenantsPagination, isLoading } = useSelector(
    (state) => state.superAdmin,
  );

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: "",
    slug: "",
    companyName: "",
    plan: "free",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  useEffect(() => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (planFilter) params.plan = planFilter;
    if (statusFilter) params.isActive = statusFilter;
    dispatch(fetchAllTenants(params));
  }, [dispatch, page, search, planFilter, statusFilter]);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createTenant(form)).unwrap();
      toast.success("Tenant created successfully");
      setShowCreate(false);
      setForm({
        name: "",
        slug: "",
        companyName: "",
        plan: "free",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      });
      dispatch(fetchAllTenants({ page: 1, limit: 20 }));
    } catch (err) {
      toast.error(err || "Failed to create tenant");
    }
  };

  const handleToggleActive = async (tenant) => {
    if (tenant.isActive) {
      if (
        !window.confirm(
          `Deactivate "${tenant.name}"? All users will be disabled.`,
        )
      )
        return;
      try {
        await dispatch(deleteTenant(tenant._id)).unwrap();
        toast.success("Tenant deactivated");
      } catch (err) {
        toast.error(err);
      }
    } else {
      try {
        await dispatch(
          updateTenant({ id: tenant._id, data: { isActive: true } }),
        ).unwrap();
        toast.success("Tenant reactivated");
      } catch (err) {
        toast.error(err);
      }
    }
  };

  const handlePlanChange = async (tenant, newPlan) => {
    try {
      await dispatch(
        updateTenant({ id: tenant._id, data: { plan: newPlan } }),
      ).unwrap();
      toast.success(`Plan changed to ${newPlan}`);
    } catch (err) {
      toast.error(err);
    }
  };

  const pagination = tenantsPagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-sm text-slate-400">
            Manage all workspaces / companies on the platform
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition"
        >
          <Plus className="h-4 w-4" />
          New Tenant
        </button>
      </div>

      {/* Create Tenant Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateTenant}
          className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">
            Provision New Workspace
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Tenant Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Slug (auto-generated if blank)
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                placeholder="acme-corp"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Company Name
              </label>
              <input
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                placeholder="Acme Industries Pvt Ltd"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Admin Name
              </label>
              <input
                value={form.adminName}
                onChange={(e) =>
                  setForm({ ...form, adminName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Admin Email
              </label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) =>
                  setForm({ ...form, adminEmail: e.target.value })
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                placeholder="admin@acme.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Admin Password
              </label>
              <input
                type="password"
                value={form.adminPassword}
                onChange={(e) =>
                  setForm({ ...form, adminPassword: e.target.value })
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                placeholder="Min 8 characters"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
            >
              Create Tenant
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-600 px-5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
            placeholder="Search tenants..."
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
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

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-800/60">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/60">
              <th className="px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Plan</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Users</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Leads</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Clients</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Websites</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && tenants.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No tenants found
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr
                  key={t._id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition"
                >
                  <td className="px-4 py-3">
                    <Link to={`/superadmin/tenants/${t._id}`} className="group">
                      <p className="font-medium text-white group-hover:text-violet-400 transition">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500">{t.slug}</p>
                      {t.company?.name && (
                        <p className="text-xs text-slate-500">
                          {t.company.name}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.plan}
                      onChange={(e) => handlePlanChange(t, e.target.value)}
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="h-3.5 w-3.5 text-blue-400" />
                      {t.stats?.userCount ?? t.activeUsers ?? 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Target className="h-3.5 w-3.5 text-cyan-400" />
                      {t.stats?.leadCount ?? 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {t.stats?.clientCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Globe className="h-3.5 w-3.5 text-emerald-400" />
                      {t.stats?.websiteCount ?? 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(t)}
                      className="flex items-center gap-1.5"
                      title={t.isActive ? "Deactivate" : "Activate"}
                    >
                      {t.isActive ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-400" />
                          <span className="text-xs text-emerald-400">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-red-400" />
                          <span className="text-xs text-red-400">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/superadmin/tenants/${t._id}`}
                      className="text-sm text-violet-400 hover:text-violet-300 transition"
                    >
                      View Details
                    </Link>
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

export default TenantsManagement;

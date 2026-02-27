import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  TrendingUp,
  Target,
  Globe,
  FileSpreadsheet,
  Workflow,
  GitBranch,
  ClipboardList,
  Layers,
  Ticket,
} from "lucide-react";
import {
  toggleSidebar,
  setMobileSidebarOpen,
} from "../../store/slices/uiSlice";
import { useSocketStatus } from "../../hooks";

const Sidebar = ({ role = "admin" }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector(
    (state) => state.ui,
  );
  const user = useSelector((state) => state.auth.user);
  const socketStatus = useSocketStatus();
  const isLiveOnline = socketStatus === "connected";

  // Auto-expand CRM section when navigating to a CRM route
  const isCrmRoute = location.pathname.includes("/crm/");
  const [crmExpanded, setCrmExpanded] = useState(isCrmRoute);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCrmRoute) setCrmExpanded(true);
  }, [isCrmRoute]);

  const hasPermission = (permission) => {
    if (!permission) return true;
    const rolePermissions = user?.permissions || [];
    if (!Array.isArray(rolePermissions) || rolePermissions.length === 0) {
      return role === "admin";
    }
    return rolePermissions.includes(permission);
  };

  const prefix = role === "admin" ? "/admin" : "/marketing";

  // --- CRM Section Items ---
  const crmItems = [
    {
      path: `${prefix}/crm/dashboard`,
      icon: LayoutDashboard,
      label: "Overview",
    },
    {
      path: `${prefix}/crm/leads`,
      icon: Target,
      label: "Leads",
      permission: "crm.leads.view",
    },
    {
      path: `${prefix}/crm/contacts`,
      icon: Users,
      label: "Contacts",
      permission: "crm.contacts.view",
    },
    {
      path: `${prefix}/crm/accounts`,
      icon: Building2,
      label: "Accounts",
      permission: "crm.accounts.view",
    },
    {
      path: `${prefix}/crm/deals`,
      icon: Briefcase,
      label: "Deals",
      permission: "crm.deals.view",
    },
    {
      path:
        role === "admin"
          ? `${prefix}/crm/pipelines`
          : `${prefix}/crm/deals/kanban`,
      icon: Layers,
      label: "Pipeline",
      permission: "crm.deals.view",
    },
    {
      path: `${prefix}/crm/activities`,
      icon: ClipboardList,
      label: "Activities",
      permission: "crm.activities.view",
    },
    ...(role === "admin"
      ? [
          {
            path: `${prefix}/crm/automation`,
            icon: Workflow,
            label: "Automation",
            permission: "crm.automation.manage",
          },
          {
            path: `${prefix}/crm/blueprints`,
            icon: GitBranch,
            label: "Blueprints",
            permission: "crm.blueprints.manage",
          },
        ]
      : []),
  ].filter((item) => hasPermission(item.permission));

  // --- Core Section Items ---
  const coreItems = [
    { path: prefix, icon: LayoutDashboard, label: "Dashboard", exact: true },
    ...(role === "admin"
      ? [
          { path: "/admin/users", icon: Users, label: "Users" },
          { path: "/admin/events", icon: Calendar, label: "Events" },
          { path: "/admin/clients", icon: Briefcase, label: "Clients" },
          { path: "/admin/leads", icon: Target, label: "Leads" },
          { path: "/admin/tickets", icon: Ticket, label: "Tickets" },
          { path: "/admin/queries", icon: FileSpreadsheet, label: "Queries" },
          { path: "/admin/websites", icon: Globe, label: "Websites" },
          {
            path: "/admin/marketing/performance",
            icon: TrendingUp,
            label: "Team Performance",
          },
          { path: "/admin/reports", icon: FileText, label: "Reports" },
          { path: "/admin/settings", icon: Settings, label: "Settings" },
        ]
      : [
          { path: "/marketing/clients", icon: Briefcase, label: "My Clients" },
          { path: "/marketing/leads", icon: Target, label: "My Leads" },
          { path: "/marketing/tickets", icon: Ticket, label: "Tickets" },
          {
            path: "/marketing/queries",
            icon: FileSpreadsheet,
            label: "Queries",
          },
          { path: "/marketing/events", icon: Calendar, label: "Events" },
          { path: "/marketing/settings", icon: Building2, label: "Settings" },
        ]),
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  useEffect(() => {
    dispatch(setMobileSidebarOpen(false));
  }, [dispatch, location.pathname]);

  const handleMobileClose = () => dispatch(setMobileSidebarOpen(false));

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    const active = isActive(item);
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          onClick={isMobile ? handleMobileClose : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
            active
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
          title={sidebarCollapsed ? item.label : ""}
        >
          <Icon className="h-4.5 w-4.5 flex-shrink-0" />
          {(!sidebarCollapsed || isMobile) && (
            <span className="text-sm font-medium">{item.label}</span>
          )}
        </Link>
      </li>
    );
  };

  const renderCrmSection = (isMobile = false) => {
    const showLabels = !sidebarCollapsed || isMobile;
    const isAnyCrmActive = crmItems.some((item) => isActive(item));

    return (
      <div className="mt-1">
        {/* CRM Section Header */}
        <button
          type="button"
          onClick={() => setCrmExpanded((prev) => !prev)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
            isAnyCrmActive && !crmExpanded
              ? "bg-blue-900/40 text-blue-300"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
          title={sidebarCollapsed ? "CRM" : ""}
        >
          <TrendingUp className="h-4.5 w-4.5 flex-shrink-0" />
          {showLabels && (
            <>
              <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                CRM
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  crmExpanded ? "rotate-0" : "-rotate-90"
                }`}
              />
            </>
          )}
        </button>

        {/* CRM Sub-items */}
        {(crmExpanded || sidebarCollapsed) && (
          <ul
            className={`mt-0.5 space-y-0.5 ${showLabels ? "ml-2 border-l border-gray-700 pl-2" : ""}`}
          >
            {crmItems.map((item) => renderNavItem(item, isMobile))}
          </ul>
        )}
      </div>
    );
  };

  const renderNav = (isMobile = false) => (
    <nav className="mt-3 flex-1 overflow-y-auto px-2">
      {/* Core items */}
      <ul className="space-y-0.5">
        {coreItems.slice(0, 1).map((item) => renderNavItem(item, isMobile))}
        {role === "admin" &&
          coreItems.slice(1, 2).map((item) => renderNavItem(item, isMobile))}
      </ul>

      {/* CRM Section (collapsible) */}
      {renderCrmSection(isMobile)}

      {/* Separator */}
      <div className="my-2 border-t border-gray-800" />

      {/* Remaining core items */}
      <ul className="space-y-0.5">
        {coreItems
          .slice(role === "admin" ? 2 : 1)
          .map((item) => renderNavItem(item, isMobile))}
      </ul>
    </nav>
  );

  return (
    <>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={handleMobileClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <div className="rounded-lg bg-white px-2 py-1.5">
            <img
              src="/logo.png"
              alt="Prem Industries India Limited"
              className="h-10 w-auto max-w-[190px] object-contain"
            />
          </div>
          <button
            onClick={handleMobileClose}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {renderNav(true)}
      </aside>

      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen bg-gray-900 text-white transition-all duration-300 md:flex md:flex-col ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <div
            className={`${sidebarCollapsed ? "p-1.5" : "px-2 py-1.5"} rounded-lg bg-white`}
          >
            <img
              src="/logo.png"
              alt="Prem Industries India Limited"
              className={`${sidebarCollapsed ? "h-8 w-8 object-contain" : "h-10 w-auto max-w-[190px] object-contain"}`}
            />
          </div>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        {renderNav(false)}

        {/* Role Badge */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div
              className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                role === "admin"
                  ? "bg-purple-900/50 text-purple-300"
                  : "bg-green-900/50 text-green-300"
              }`}
            >
              {role === "admin" ? "Administrator" : "Marketing Team"}
            </div>
            {role === "marketing" && (
              <div
                className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  isLiveOnline
                    ? "bg-emerald-900/40 text-emerald-300"
                    : "bg-gray-800 text-gray-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLiveOnline ? "bg-emerald-400" : "bg-gray-400"
                  }`}
                />
                {isLiveOnline ? "Live: Online" : "Live: Offline"}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

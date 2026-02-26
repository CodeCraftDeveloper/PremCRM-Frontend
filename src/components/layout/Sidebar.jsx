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
  Building2,
  TrendingUp,
  Target,
  Globe,
  FileSpreadsheet,
} from "lucide-react";
import {
  toggleSidebar,
  setMobileSidebarOpen,
} from "../../store/slices/uiSlice";
import { connectSocket, getSocket } from "../../services/socket";

const Sidebar = ({ role = "admin" }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector(
    (state) => state.ui,
  );
  const [isLiveOnline, setIsLiveOnline] = useState(() =>
    Boolean(getSocket()?.connected),
  );

  const adminMenuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/events", icon: Calendar, label: "Events" },
    { path: "/admin/clients", icon: Briefcase, label: "Clients" },
    { path: "/admin/leads", icon: Target, label: "Leads" },
    { path: "/admin/queries", icon: FileSpreadsheet, label: "Queries" },
    { path: "/admin/websites", icon: Globe, label: "Websites" },
    {
      path: "/admin/marketing/performance",
      icon: TrendingUp,
      label: "Team Performance",
    },
    { path: "/admin/reports", icon: FileText, label: "Reports" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const marketingMenuItems = [
    {
      path: "/marketing",
      icon: LayoutDashboard,
      label: "Dashboard",
      exact: true,
    },
    { path: "/marketing/clients", icon: Briefcase, label: "My Clients" },
    { path: "/marketing/leads", icon: Target, label: "My Leads" },
    { path: "/marketing/queries", icon: FileSpreadsheet, label: "Queries" },
    { path: "/marketing/events", icon: Calendar, label: "Events" },
    { path: "/marketing/settings", icon: Building2, label: "Settings" },
  ];

  const menuItems = role === "admin" ? adminMenuItems : marketingMenuItems;

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  useEffect(() => {
    if (role !== "marketing") return undefined;
    const socket = getSocket() || connectSocket();
    if (!socket) return undefined;

    const handleConnect = () => setIsLiveOnline(true);
    const handleDisconnect = () => setIsLiveOnline(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
    };
  }, [role]);

  useEffect(() => {
    dispatch(setMobileSidebarOpen(false));
  }, [dispatch, location.pathname]);

  const handleMobileClose = () => dispatch(setMobileSidebarOpen(false));

  const renderNav = (isMobile = false) => (
    <nav className="mt-4 px-2">
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={isMobile ? handleMobileClose : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
                title={sidebarCollapsed ? item.label : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(!sidebarCollapsed || isMobile) && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            </li>
          );
        })}
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

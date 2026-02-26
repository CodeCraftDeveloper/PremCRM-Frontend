import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  toggleSidebar,
  setMobileSidebarOpen,
} from "../../store/slices/uiSlice";

const SuperAdminSidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector(
    (state) => state.ui,
  );

  const menuItems = [
    {
      path: "/superadmin",
      icon: LayoutDashboard,
      label: "Dashboard",
      exact: true,
    },
    { path: "/superadmin/tenants", icon: Building2, label: "Tenants" },
    { path: "/superadmin/users", icon: Users, label: "All Users" },
    { path: "/superadmin/activity", icon: Activity, label: "Activity Log" },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

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
                    ? "bg-violet-600 text-white"
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
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={handleMobileClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 md:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-violet-400" />
            <span className="text-lg font-bold text-white">SuperAdmin</span>
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

      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen bg-gray-900 text-white transition-all duration-300 md:flex md:flex-col ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 flex-shrink-0 text-violet-400" />
            {!sidebarCollapsed && (
              <span className="text-lg font-bold text-white">SuperAdmin</span>
            )}
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

        {renderNav(false)}

        {!sidebarCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-lg bg-violet-900/50 px-3 py-2 text-center text-sm font-medium text-violet-300">
              Platform Owner
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default SuperAdminSidebar;

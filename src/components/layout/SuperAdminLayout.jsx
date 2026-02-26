import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "./Header";

const SuperAdminLayout = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SuperAdminSidebar />
      <div
        className={`ml-0 transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Header />
        <main className="p-3 sm:p-4 md:p-6">
          <div className="mx-auto w-full max-w-360">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;

import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Header from "./Header";

const AdminLayout = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="admin" />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Header />
        <main className="p-4 sm:p-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

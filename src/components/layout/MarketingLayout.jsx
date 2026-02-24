import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MarketingLayout = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="marketing" />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MarketingLayout;

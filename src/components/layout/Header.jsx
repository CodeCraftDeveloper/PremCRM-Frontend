import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, User, Menu, Moon, Sun, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logout } from "../../store/slices/authSlice";
import {
  toggleTheme,
  toggleSidebar,
  toggleMobileSidebar,
} from "../../store/slices/uiSlice";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout()).then(() => {
      navigate("/login");
    });
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    const profilePath =
      user?.role === "superadmin"
        ? "/superadmin"
        : user?.role === "admin"
          ? "/admin/settings"
          : "/marketing/settings";
    navigate(profilePath);
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      dispatch(toggleMobileSidebar());
      return;
    }
    dispatch(toggleSidebar());
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Left side */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          onClick={handleMenuClick}
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-700"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-sm md:text-lg font-semibold text-gray-800 dark:text-white truncate">
          {user?.role === "superadmin"
            ? "SuperAdmin Panel"
            : user?.role === "admin"
              ? "Admin Panel"
              : "Marketing Dashboard"}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-gray-600" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-xs md:text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || "Member"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={handleProfileClick}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

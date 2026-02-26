import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Protected route wrapper for authenticated users
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth,
  );
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    }
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user?.role === "marketing") {
      return <Navigate to="/marketing" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
};

/**
 * Public route wrapper - redirects authenticated users to dashboard
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    if (user?.role === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    }
    if (user?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user?.role === "marketing") {
      return <Navigate to="/marketing" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

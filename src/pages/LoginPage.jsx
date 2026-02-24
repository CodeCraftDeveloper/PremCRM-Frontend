import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { login, clearError } from "../store/slices/authSlice";
import { Button, Input } from "../components/ui";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    try {
      const result = await dispatch(login(data)).unwrap();
      toast.success("Login successful!");

      // Redirect based on role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(result.role === "admin" ? "/admin" : "/marketing", {
          replace: true,
        });
      }
    } catch (err) {
      toast.error(err || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            CRM Pro
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-600 dark:text-gray-400">
            Query Management & CRM System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Sign in to your account
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  icon={Lock}
                  error={errors.password?.message}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              size="lg"
              className="text-sm sm:text-base"
            >
              Sign in
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mb-2 sm:mb-3">
              Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3">
                <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                  Admin
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  admin@crm.com
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  Admin@123
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3">
                <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                  Marketing
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  marketing@crm.com
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  Marketing@123
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          &copy; 2024 CRM Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

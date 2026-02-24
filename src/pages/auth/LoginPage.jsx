import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { login } from "../../store/slices/authSlice";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);
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
    try {
      const result = await dispatch(login(data)).unwrap();

      toast.success(`Welcome back, ${result.user.name}!`);

      if (result.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/marketing");
      }
    } catch (error) {
      toast.error(error || "Login failed");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/40">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">CRM Portal</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to manage your clients</p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-100">Email Address</label>
              <div
                className={`flex h-11 items-center rounded-lg border bg-slate-950 ${
                  errors.email ? "border-red-500" : "border-slate-700"
                }`}
              >
                <Mail className="ml-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-100">Password</label>
              <div
                className={`flex h-11 items-center rounded-lg border bg-slate-950 ${
                  errors.password ? "border-red-500" : "border-slate-700"
                }`}
              >
                <Lock className="ml-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  className="h-full w-full bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="mr-3 text-slate-400 hover:text-slate-200"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="-ml-1 mr-2 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 border-t border-slate-700 pt-4 text-center">
            <Link
              to="/register-marketing-manager"
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Register Marketing Manager
            </Link>
            <p className="mt-1 text-xs text-slate-400">No admin login required</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

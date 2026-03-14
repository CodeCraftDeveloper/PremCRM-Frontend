import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  UserPlus,
} from "lucide-react";
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
  const [accessLink, setAccessLink] = useState("");

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

      if (result.user.role === "superadmin") {
        navigate("/superadmin");
      } else if (result.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/marketing");
      }
    } catch (error) {
      toast.error(error || "Login failed");
    }
  };

  const handleOpenAccessLink = () => {
    const trimmedLink = accessLink.trim();

    if (!trimmedLink) {
      toast.error("Paste the invite or reset link from the email first");
      return;
    }

    const normalizedInput = /^https?:\/\//i.test(trimmedLink)
      ? trimmedLink
      : `${window.location.origin}${trimmedLink.startsWith("/") ? "" : "/"}${trimmedLink}`;

    try {
      const parsed = new URL(normalizedInput);
      const inviteMatch = parsed.pathname.match(/\/accept-invite\/([^/]+)/i);
      const resetMatch = parsed.pathname.match(/\/reset-password\/([^/]+)/i);

      if (inviteMatch?.[1]) {
        navigate(`/accept-invite/${inviteMatch[1]}`);
        return;
      }

      if (resetMatch?.[1]) {
        navigate(`/reset-password/${resetMatch[1]}`);
        return;
      }

      toast.error("This link does not look like an invite or reset link");
    } catch {
      toast.error("Paste the full link from the email so it can be opened");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/40">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Orbinest
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            From registration to revenue
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/75 p-5 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-100">
                Email Address
              </label>
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
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-100">
                Password
              </label>
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Forgot password?
                </Link>
              </div>
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
              to="/register"
              className="text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              Create Orbinest Workspace
            </Link>
            <p className="mt-1 text-xs text-slate-400">
              Set up tenant + admin + company link
            </p>
          </div>

          <div className="mt-4 border-t border-slate-700 pt-4 text-center">
            <Link
              to="/register-marketing-manager"
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Register Marketing Manager
            </Link>
            <p className="mt-1 text-xs text-slate-400">
              No admin login required
            </p>
          </div>

          <div className="mt-4 border-t border-slate-700 pt-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-start gap-3">
                <div className="rounded-lg bg-slate-800 p-2">
                  <KeyRound className="h-4 w-4 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Recovery &amp; Invite Access
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Request a reset link, or open the invite/reset link you
                    received by email.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to="/forgot-password"
                  className="flex min-w-45 flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  <Mail className="h-4 w-4" />
                  Forgot Password
                </Link>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="flex min-w-45 flex-1 items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
                >
                  <UserPlus className="h-4 w-4" />
                  Need a New Link?
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Paste invite or reset link
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={accessLink}
                    onChange={(event) => setAccessLink(event.target.value)}
                    placeholder="https://.../accept-invite/token or /reset-password/token"
                    className="h-11 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleOpenAccessLink}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Open Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

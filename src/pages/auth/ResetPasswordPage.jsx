import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui";
import { useAuth } from "../../hooks";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Password must include uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const strengthScore = (() => {
    let score = 0;
    if (passwordValue.length >= 8) score += 1;
    if (/[a-z]/.test(passwordValue)) score += 1;
    if (/[A-Z]/.test(passwordValue)) score += 1;
    if (/\d/.test(passwordValue)) score += 1;
    return score;
  })();
  const strengthLabel =
    strengthScore >= 4 ? "Strong" : strengthScore >= 2 ? "Medium" : "Weak";

  const onSubmit = async (values) => {
    if (!token) {
      toast.error("Reset token is missing or invalid");
      return;
    }

    const result = await resetPassword(
      token,
      values.password,
      values.confirmPassword,
    );

    if (result.success) {
      toast.success(result.message || "Password reset successful");
      navigate("/login", { replace: true });
    } else {
      toast.error(result.error || "Failed to reset password");
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
        <div className="relative w-full max-w-md rounded-2xl border border-rose-700/40 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3 text-rose-300">
            <AlertTriangle className="h-6 w-6" />
            <h1 className="text-xl font-bold">Invalid Reset Link</h1>
          </div>
          <p className="text-sm text-slate-300">
            This password reset link is missing a token or has become invalid.
            Request a new link to continue.
          </p>
          <div className="mt-5">
            <Link to="/forgot-password">
              <Button fullWidth>Request New Reset Link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-300">
            Set a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-200">
              New Password<span className="ml-1 text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-600 bg-slate-950 py-2.5 pr-11 pl-10 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none"
                {...register("password", {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
            {errors.password?.message && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Password strength</span>
              <span
                className={`${
                  strengthLabel === "Strong"
                    ? "text-emerald-300"
                    : strengthLabel === "Medium"
                      ? "text-amber-300"
                      : "text-rose-300"
                }`}
              >
                {strengthLabel}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full ${
                  strengthLabel === "Strong"
                    ? "bg-emerald-500"
                    : strengthLabel === "Medium"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${(strengthScore / 4) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-200">
              Confirm Password<span className="ml-1 text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-slate-600 bg-slate-950 py-2.5 pr-11 pl-10 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:outline-none"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
            {errors.confirmPassword?.message && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Reset Password
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-300">
          Back to{" "}
          <Link
            to="/login"
            className="font-medium text-cyan-300 hover:text-cyan-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

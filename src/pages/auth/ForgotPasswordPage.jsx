import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Input, Button } from "../../components/ui";
import { useAuth } from "../../hooks";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [requestSent, setRequestSent] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    const result = await forgotPassword(values.email);

    if (result.success) {
      toast.success(result.message || "Reset link requested successfully");
      setRequestedEmail(values.email);
      setRequestSent(true);
    } else {
      toast.error(result.error || "Failed to request reset link");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-300">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            labelClassName="text-slate-200"
            className="bg-slate-950 text-white border-slate-600 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-500/20"
            required
            {...register("email")}
          />

          {requestSent && (
            <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4.5 w-4.5" />
                Reset Link Requested
              </div>
              <p>
                If an account exists for{" "}
                <span className="font-semibold">{requestedEmail}</span>, a reset
                link will arrive shortly.
              </p>
            </div>
          )}

          <Button type="submit" fullWidth loading={isSubmitting}>
            {requestSent ? "Resend Reset Link" : "Send Reset Link"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-300">
          Remembered your password?{" "}
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

export default ForgotPasswordPage;

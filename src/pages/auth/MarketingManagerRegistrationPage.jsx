import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Input, Button } from "../../components/ui";
import { authService } from "../../services";
import toast from "react-hot-toast";

const registerSchema = z.object({
  tenantSlug: z
    .string()
    .min(2, "Company ID must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Company ID can only contain lowercase letters, numbers, and hyphens",
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must include uppercase, lowercase, and a number",
    ),
  phone: z.string().optional(),
});

const MarketingManagerRegistrationPage = () => {
  const darkFieldClasses =
    "bg-slate-950 text-white border-slate-600 placeholder:text-slate-400 focus:border-cyan-400 focus:ring-cyan-500/20";

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantSlug: "",
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await authService.registerMarketingManager(data);
      toast.success(
        "Registration submitted successfully. Please wait for admin approval.",
        { duration: 5000 },
      );
      navigate("/login");
    } catch (error) {
      const apiMessage =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        "Failed to register marketing manager";
      toast.error(apiMessage);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <UserPlus className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Register Marketing Manager
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Create your marketing manager account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="Company ID"
              placeholder="acme-workspace"
              error={errors.tenantSlug?.message}
              labelClassName="text-slate-200"
              className={darkFieldClasses}
              required
              {...register("tenantSlug")}
            />
            <p className="mt-1 text-xs text-slate-400">
              Ask your company admin for this ID
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              labelClassName="text-slate-200"
              className={darkFieldClasses}
              required
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              labelClassName="text-slate-200"
              className={darkFieldClasses}
              required
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="********"
              error={errors.password?.message}
              labelClassName="text-slate-200"
              className={darkFieldClasses}
              required
              {...register("password")}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              error={errors.phone?.message}
              labelClassName="text-slate-200"
              className={darkFieldClasses}
              {...register("phone")}
            />
          </div>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Register
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-300">
          Already have an account?{" "}
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

export default MarketingManagerRegistrationPage;

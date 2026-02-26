import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Mail, Lock, User, Building, Fingerprint } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const createTenantSchema = z.object({
  tenantName: z.string().min(2, "Tenant name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  companyName: z.string().optional(),
  companyRef: z.string().optional(),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Please enter a valid admin email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const CreateTenantPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      tenantName: "",
      slug: "",
      companyName: "",
      companyRef: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await api.post("/tenants/bootstrap", {
        ...data,
        companyName: data.companyName || undefined,
        companyRef: data.companyRef || undefined,
      });
      toast.success("Tenant created and linked successfully");
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create tenant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/70 bg-slate-900/75 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/40">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Tenant</h1>
          <p className="mt-2 text-sm text-slate-300">
            Create a workspace and link it to a specific company
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100">Tenant Name</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.tenantName ? "border-red-500" : "border-slate-700"}`}>
              <Building2 className="ml-3 h-4 w-4 text-slate-400" />
              <input className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="Acme Workspace" {...register("tenantName")} />
            </div>
            {errors.tenantName && <p className="mt-1 text-xs text-red-400">{errors.tenantName.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100">Tenant Slug</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.slug ? "border-red-500" : "border-slate-700"}`}>
              <Fingerprint className="ml-3 h-4 w-4 text-slate-400" />
              <input className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="acme-workspace" {...register("slug")} />
            </div>
            {errors.slug && <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100">Company Name</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.companyName ? "border-red-500" : "border-slate-700"}`}>
              <Building className="ml-3 h-4 w-4 text-slate-400" />
              <input className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="Acme Pvt Ltd" {...register("companyName")} />
            </div>
            {errors.companyName && <p className="mt-1 text-xs text-red-400">{errors.companyName.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100">Company Reference ID</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.companyRef ? "border-red-500" : "border-slate-700"}`}>
              <Fingerprint className="ml-3 h-4 w-4 text-slate-400" />
              <input className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="COMP-001" {...register("companyRef")} />
            </div>
            {errors.companyRef && <p className="mt-1 text-xs text-red-400">{errors.companyRef.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100">Admin Name</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.adminName ? "border-red-500" : "border-slate-700"}`}>
              <User className="ml-3 h-4 w-4 text-slate-400" />
              <input className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="John Admin" {...register("adminName")} />
            </div>
            {errors.adminName && <p className="mt-1 text-xs text-red-400">{errors.adminName.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-100">Admin Email</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.adminEmail ? "border-red-500" : "border-slate-700"}`}>
              <Mail className="ml-3 h-4 w-4 text-slate-400" />
              <input className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="admin@acme.com" {...register("adminEmail")} />
            </div>
            {errors.adminEmail && <p className="mt-1 text-xs text-red-400">{errors.adminEmail.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-100">Admin Password</label>
            <div className={`flex h-11 items-center rounded-lg border bg-slate-950 ${errors.adminPassword ? "border-red-500" : "border-slate-700"}`}>
              <Lock className="ml-3 h-4 w-4 text-slate-400" />
              <input type="password" className="h-full w-full rounded-r-lg bg-transparent px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none" placeholder="Minimum 8 characters" {...register("adminPassword")} />
            </div>
            {errors.adminPassword && <p className="mt-1 text-xs text-red-400">{errors.adminPassword.message}</p>}
          </div>

          <div className="mt-2 md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Tenant"}
            </button>
          </div>
        </form>

        <div className="mt-5 border-t border-slate-700 pt-4 text-center">
          <Link to="/login" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateTenantPage;

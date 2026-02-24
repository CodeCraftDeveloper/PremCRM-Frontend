import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createUser } from "../../store/slices/usersSlice";
import { Button, Input, Select } from "../../components/ui";
import toast from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  isActive: z.enum(["true", "false"]).default("true"),
});

const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const MarketingManagerRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      isActive: "true",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role: "marketing",
          phone: data.phone || undefined,
          isActive: data.isActive === "true",
        }),
      ).unwrap();

      toast.success("Marketing manager registered successfully");
      navigate("/admin/users");
    } catch (error) {
      toast.error(error || "Failed to register marketing manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Register Marketing Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create a new marketing manager account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Manager Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
              required
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="********"
              error={errors.password?.message}
              required
              {...register("password")}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              error={errors.phone?.message}
              {...register("phone")}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.isActive?.message}
              {...register("isActive")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/users")}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} icon={UserPlus}>
            Register Manager
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MarketingManagerRegister;

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import {
  createUser,
  updateUser,
  fetchUser,
  clearSelectedUser,
} from "../../store/slices/usersSlice";
import { Button, Input, Select, LoadingSpinner } from "../../components/ui";
import toast from "react-hot-toast";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "marketing"], { required_error: "Role is required" }),
  phone: z.string().optional(),
  isActive: z.enum(["true", "false"]).default("true"),
});

const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "marketing"], { required_error: "Role is required" }),
  phone: z.string().optional(),
  isActive: z.enum(["true", "false"]).default("true"),
});

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "marketing", label: "Marketing" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const UserForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedUser, isLoading } = useSelector((state) => state.users);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "marketing",
      phone: "",
      isActive: "true",
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchUser(id));
    }

    return () => {
      dispatch(clearSelectedUser());
    };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (isEdit && selectedUser) {
      reset({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        role: selectedUser.role || "marketing",
        phone: selectedUser.phone || "",
        isActive: selectedUser.isActive ? "true" : "false",
      });
    }
  }, [isEdit, selectedUser, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      if (isEdit) {
        const payload = {
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone || undefined,
          isActive: data.isActive === "true",
        };
        await dispatch(updateUser({ id, data: payload })).unwrap();
        toast.success("User updated successfully");
      } else {
        const payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          phone: data.phone || undefined,
          isActive: data.isActive === "true",
        };
        await dispatch(createUser(payload)).unwrap();
        toast.success("User created successfully");
      }

      navigate("/admin/users");
    } catch (error) {
      toast.error(error || `Failed to ${isEdit ? "update" : "create"} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading user..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit User" : "Add New User"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEdit ? "Update user details" : "Create a new user account"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            User Information
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
            {!isEdit && (
              <Input
                label="Password"
                type="password"
                placeholder="********"
                error={errors.password?.message}
                required
                {...register("password")}
              />
            )}
            <Input
              label="Phone"
              type="tel"
              placeholder="+91 98765 43210"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
        </div>

        {/* Role & Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Role & Access
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Role"
              options={ROLE_OPTIONS}
              error={errors.role?.message}
              required
              {...register("role")}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.isActive?.message}
              {...register("isActive")}
            />
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Role Permissions
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <strong>Admin:</strong> Full access - manage users, events,
                clients, view all data, reports
              </li>
              <li>
                <strong>Marketing:</strong> Create/edit own clients, add
                remarks, upload visiting cards
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/users")}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;

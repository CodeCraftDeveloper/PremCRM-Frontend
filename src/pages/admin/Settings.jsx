import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Lock, Bell, Palette, Shield } from "lucide-react";
import { changePassword, updateProfile } from "../../store/slices/authSlice";
import { setTheme } from "../../store/slices/uiSlice";
import { Button, Input } from "../../components/ui";
import toast from "react-hot-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data) => {
    setIsUpdatingProfile(true);
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsChangingPassword(true);
    try {
      await dispatch(
        changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      ).unwrap();
      toast.success("Password changed successfully");
      resetPassword();
    } catch (error) {
      toast.error(error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your personal information
                </p>
              </div>

              <form
                onSubmit={handleProfileSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield
                        className={`h-4 w-4 ${
                          user?.role === "admin"
                            ? "text-purple-600"
                            : "text-green-600"
                        }`}
                      />
                      <span
                        className={`capitalize ${
                          user?.role === "admin"
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  error={profileErrors.name?.message}
                  required
                  {...registerProfile("name")}
                />
                <Input
                  label="Email"
                  type="email"
                  error={profileErrors.email?.message}
                  required
                  {...registerProfile("email")}
                />
                <Input
                  label="Phone"
                  type="tel"
                  error={profileErrors.phone?.message}
                  {...registerProfile("phone")}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={isUpdatingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ensure your account is using a strong password
                </p>
              </div>

              <form
                onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <Input
                  label="Current Password"
                  type="password"
                  error={passwordErrors.currentPassword?.message}
                  required
                  {...registerPassword("currentPassword")}
                />
                <Input
                  label="New Password"
                  type="password"
                  error={passwordErrors.newPassword?.message}
                  required
                  {...registerPassword("newPassword")}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  error={passwordErrors.confirmPassword?.message}
                  required
                  {...registerPassword("confirmPassword")}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={isChangingPassword}>
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose what notifications you receive
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: "New client assigned",
                    description:
                      "Get notified when a client is assigned to you",
                  },
                  {
                    label: "Follow-up reminders",
                    description: "Receive reminders for pending follow-ups",
                  },
                  {
                    label: "Status updates",
                    description: "Get notified when client status changes",
                  },
                  {
                    label: "Weekly reports",
                    description: "Receive weekly performance summary",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={index < 2}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Appearance
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize the look and feel of the application
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Theme
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Select your preferred theme
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {["light", "dark", "system"].map((themeOption) => (
                      <button
                        key={themeOption}
                        type="button"
                        onClick={() => dispatch(setTheme(themeOption))}
                        className={`rounded-lg border-2 p-4 text-center transition-colors ${
                          theme === themeOption
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`mx-auto mb-2 h-8 w-8 rounded-full ${
                            themeOption === "light"
                              ? "bg-yellow-400"
                              : themeOption === "dark"
                                ? "bg-gray-800"
                                : "bg-gradient-to-br from-yellow-400 to-gray-800"
                          }`}
                        />
                        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                          {themeOption}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Compact Mode
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Reduce spacing for a denser layout
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Enable compact mode
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

export { Settings };

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Lock, Bell, Palette, Shield } from "lucide-react";
import {
  changePassword,
  getMe,
  updateProfile,
} from "../../store/slices/authSlice";
import { setTheme } from "../../store/slices/uiSlice";
import { Button, Input } from "../../components/ui";
import toast from "react-hot-toast";
import api from "../../services/api";

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

const DEFAULT_NOTIFICATION_PREFERENCES = {
  newClientAssigned: true,
  followUpReminders: true,
  statusUpdates: false,
  weeklyReports: false,
};

const NOTIFICATION_OPTIONS = [
  {
    key: "newClientAssigned",
    label: "New client assigned",
    description: "Get notified when a client is assigned to you",
  },
  {
    key: "followUpReminders",
    label: "Follow-up reminders",
    description: "Receive reminders for pending follow-ups",
  },
  {
    key: "statusUpdates",
    label: "Status updates",
    description: "Get notified when client status changes",
  },
  {
    key: "weeklyReports",
    label: "Weekly reports",
    description: "Receive weekly performance summary",
  },
];

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingBranding, setIsUpdatingBranding] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [isLoadingTenantBranding, setIsLoadingTenantBranding] = useState(false);
  const [tenantSettings, setTenantSettings] = useState({});
  const [companyName, setCompanyName] = useState(
    user?.tenantCompany?.name || "",
  );
  const [companyLogoUrl, setCompanyLogoUrl] = useState(
    user?.tenantCompany?.logoUrl || "",
  );
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [publicHeroTagline, setPublicHeroTagline] = useState("");
  const [publicHeroImageUrl, setPublicHeroImageUrl] = useState("");
  const [publicAccentColor, setPublicAccentColor] = useState("#06b6d4");
  const [notificationPreferences, setNotificationPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const persistedNotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(user?.notificationPreferences || {}),
  };
  const hasNotificationChanges = NOTIFICATION_OPTIONS.some(
    ({ key }) =>
      Boolean(notificationPreferences[key]) !==
      Boolean(persistedNotificationPreferences[key]),
  );

  useEffect(() => {
    setCompanyName(user?.tenantCompany?.name || "");
    setCompanyLogoUrl(user?.tenantCompany?.logoUrl || "");
  }, [user?.tenantCompany?.name, user?.tenantCompany?.logoUrl]);

  useEffect(() => {
    let isActive = true;

    const loadTenantBranding = async () => {
      if (user?.role !== "admin" || !user?.tenantId) return;
      setIsLoadingTenantBranding(true);
      try {
        const response = await api.get(`/tenants/${user.tenantId}`);
        const tenant = response?.data?.data?.tenant;
        const settings = tenant?.settings || {};
        const publicEventLanding = settings?.publicEventLanding || {};

        if (!isActive) return;

        setTenantSettings(settings);
        setPublicHeroTagline(publicEventLanding.heroTagline || "");
        setPublicHeroImageUrl(publicEventLanding.heroImageUrl || "");
        setPublicAccentColor(publicEventLanding.accentColor || "#06b6d4");
      } catch {
        if (isActive) {
          toast.error("Failed to load tenant branding settings");
        }
      } finally {
        if (isActive) {
          setIsLoadingTenantBranding(false);
        }
      }
    };

    loadTenantBranding();

    return () => {
      isActive = false;
    };
  }, [user?.role, user?.tenantId]);

  useEffect(() => {
    setNotificationPreferences({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notificationPreferences || {}),
    });
  }, [user?.notificationPreferences]);

  // Compute the current logo display URL – route S3 logos through API proxy
  const currentLogoDisplay = (() => {
    if (companyLogoPreview) return companyLogoPreview; // user picked a new file
    const rawUrl = user?.tenantCompany?.logoUrl || "";
    const isS3 = Boolean(
      user?.tenantCompany?.logoS3Key ||
      rawUrl.includes(".s3.") ||
      rawUrl.includes("s3.amazonaws.com"),
    );
    if (isS3 && user?.tenantId) {
      const apiBaseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const ts = user?.tenantCompany?.logoUpdatedAt
        ? new Date(user.tenantCompany.logoUpdatedAt).getTime()
        : Date.now();
      return `${apiBaseUrl}/tenants/${user.tenantId}/company-logo/public?v=${ts}`;
    }
    if (rawUrl) return rawUrl;
    return "/logo.png";
  })();

  useEffect(() => {
    if (!companyLogoFile) {
      setCompanyLogoPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(companyLogoFile);
    setCompanyLogoPreview(previewUrl);
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [companyLogoFile]);

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
          confirmPassword: data.confirmPassword,
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
    ...(user?.role === "admin"
      ? [{ id: "branding", label: "Branding", icon: Shield }]
      : []),
  ];

  const onBrandingSubmit = async (e) => {
    e.preventDefault();

    if (!user?.tenantId) {
      toast.error("Tenant context missing");
      return;
    }

    if (companyLogoUrl && !/^https?:\/\/.+/i.test(companyLogoUrl.trim())) {
      toast.error("Please enter a valid logo URL");
      return;
    }

    const normalizedAccent = String(publicAccentColor || "")
      .trim()
      .replace(/^([^#])/, "#$1");

    if (normalizedAccent && !/^#[0-9A-Fa-f]{3,8}$/.test(normalizedAccent)) {
      toast.error("Please enter a valid accent hex color");
      return;
    }

    setIsUpdatingBranding(true);
    try {
      let resolvedLogoUrl = companyLogoUrl?.trim() || undefined;
      let didUploadLogoFile = false;

      if (companyLogoFile) {
        const formData = new FormData();
        formData.append("logo", companyLogoFile);
        await api.post(`/tenants/${user.tenantId}/company-logo`, formData);
        didUploadLogoFile = true;
      }

      const companyPayload = {
        name: companyName?.trim() || undefined,
      };

      // Only persist manual URL when a file wasn't uploaded in this action.
      if (!didUploadLogoFile) {
        companyPayload.logoUrl = resolvedLogoUrl;
      }

      const mergedSettings = {
        ...(tenantSettings || {}),
        publicEventLanding: {
          ...(tenantSettings?.publicEventLanding || {}),
          heroTagline: publicHeroTagline?.trim() || "",
          heroImageUrl: publicHeroImageUrl?.trim() || "",
          accentColor: normalizedAccent || "#06b6d4",
        },
      };

      const updateResponse = await api.put(`/tenants/${user.tenantId}`, {
        company: companyPayload,
        settings: mergedSettings,
      });
      const updatedTenant = updateResponse?.data?.data?.tenant;

      if (updatedTenant?.settings) {
        setTenantSettings(updatedTenant.settings);
      }

      await dispatch(getMe()).unwrap();
      setCompanyLogoFile(null);
      toast.success("Company branding updated successfully");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update company branding",
      );
    } finally {
      setIsUpdatingBranding(false);
    }
  };

  const onNotificationPreferenceChange = (key, value) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onNotificationsSubmit = async () => {
    if (!hasNotificationChanges) {
      return;
    }

    setIsUpdatingNotifications(true);
    try {
      await dispatch(updateProfile({ notificationPreferences })).unwrap();
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error(error || "Failed to save notification preferences");
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

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
                {NOTIFICATION_OPTIONS.map((item) => (
                  <div
                    key={item.key}
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
                        checked={Boolean(notificationPreferences[item.key])}
                        onChange={(e) =>
                          onNotificationPreferenceChange(
                            item.key,
                            e.target.checked,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  type="button"
                  loading={isUpdatingNotifications}
                  disabled={!hasNotificationChanges}
                  onClick={onNotificationsSubmit}
                >
                  Save Preferences
                </Button>
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
                                : "bg-linear-to-br from-yellow-400 to-gray-800"
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      Enable compact mode
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab (Admin only) */}
          {activeTab === "branding" && user?.role === "admin" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Company Branding
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update company name and logo shown in the sidebar
                </p>
              </div>

              <form onSubmit={onBrandingSubmit} className="space-y-4">
                <Input
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Pvt Ltd"
                />
                <Input
                  label="Company Logo URL"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Upload Company Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCompanyLogoFile(e.target.files?.[0] || null)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose a logo image to replace the current logo.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Logo Preview
                  </p>
                  <div className="inline-flex rounded-lg bg-white p-2">
                    <img
                      src={currentLogoDisplay}
                      alt={companyName || "Company Logo"}
                      onError={(e) => {
                        e.currentTarget.src = "/logo.png";
                      }}
                      className="h-10 w-auto max-w-47.5 object-contain"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Public Event Landing Defaults
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    These defaults apply to tenant event landing pages and can
                    be overridden per event.
                  </p>

                  {isLoadingTenantBranding ? (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      Loading tenant landing settings...
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <Input
                        label="Hero Tagline"
                        value={publicHeroTagline}
                        onChange={(e) => setPublicHeroTagline(e.target.value)}
                        placeholder="Discover events, register fast, and stay connected"
                      />

                      <Input
                        label="Hero Image URL"
                        value={publicHeroImageUrl}
                        onChange={(e) => setPublicHeroImageUrl(e.target.value)}
                        placeholder="https://example.com/tenant-event-hero.jpg"
                      />

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Accent Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={publicAccentColor}
                            onChange={(e) =>
                              setPublicAccentColor(e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            placeholder="#06b6d4"
                          />
                          <span
                            className="h-9 w-9 rounded-lg border border-gray-300 dark:border-gray-600"
                            style={{
                              backgroundColor: /^#?[0-9A-Fa-f]{3,8}$/.test(
                                publicAccentColor || "",
                              )
                                ? publicAccentColor.startsWith("#")
                                  ? publicAccentColor
                                  : `#${publicAccentColor}`
                                : "#06b6d4",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" loading={isUpdatingBranding}>
                    Save Branding
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

export { Settings };

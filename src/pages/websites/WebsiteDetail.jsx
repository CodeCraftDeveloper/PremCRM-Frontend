import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Edit,
  Activity,
  MessageSquare,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  fetchWebsite,
  fetchWebsiteStats,
  regenerateApiKey,
  testWebsiteConnection,
  deleteWebsite,
  clearSelectedWebsite,
} from "../../store/slices/websitesSlice";
import { Button, LoadingSpinner, Modal, StatCard } from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const CATEGORY_LABELS = {
  contact_form: "Contact Form",
  landing_page: "Landing Page",
  webinar: "Webinar",
  partner: "Partner",
  other: "Other",
};

const WebsiteDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    selectedWebsite: website,
    isLoading,
  } = useSelector((state) => state.websites);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    dispatch(fetchWebsite(id));
    dispatch(fetchWebsiteStats(id));
    return () => {
      dispatch(clearSelectedWebsite());
    };
  }, [dispatch, id]);

  const handleRegenerateApiKey = async () => {
    try {
      const result = await dispatch(regenerateApiKey(id)).unwrap();
      setNewApiKey(result?.apiKey || result?.website?.apiKey);
      toast.success("API key regenerated successfully");
      setRegenerateModalOpen(false);
    } catch (error) {
      toast.error(error || "Failed to regenerate API key");
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await dispatch(testWebsiteConnection(id)).unwrap();
      toast.success("Webhook connection test successful");
    } catch (error) {
      toast.error(error || "Webhook test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteWebsite(id)).unwrap();
      toast.success("Website deleted successfully");
      navigate("/admin/websites");
    } catch (error) {
      toast.error(error || "Failed to delete website");
    }
  };

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading || !website) {
    return <LoadingSpinner />;
  }

  const apiBaseUrl = (
    import.meta.env.VITE_API_URL || `${window.location.origin}/api`
  ).replace(/\/api\/?$/, "");

  const integrationSnippet = `<!-- Lead Form Integration (with attachments support) -->
<script>
  // Expected HTML:
  // <input name="firstName" />
  // <input name="email" />
  // <input type="file" id="attachments" multiple />

  async function submitLead(formValues, fileInputId = 'attachments') {
    const payload = new FormData();
    payload.append('firstName', formValues.firstName || '');
    payload.append('lastName', formValues.lastName || '');
    payload.append('email', formValues.email || '');
    payload.append('phone', formValues.phone || '');
    payload.append('message', formValues.message || '');
    payload.append('company', formValues.company || '');
    payload.append('productInterest', formValues.productInterest || '');
    payload.append('source', '${website.name}');

    const fileInput = document.getElementById(fileInputId);
    if (fileInput?.files?.length) {
      Array.from(fileInput.files)
        .slice(0, 5)
        .forEach((file) => payload.append('attachments', file));
    }

    const response = await fetch('${apiBaseUrl}/api/public/lead', {
      method: 'POST',
      headers: {
        'x-api-key': 'YOUR_API_KEY'
      },
      body: payload
    });
    return response.json();
  }
</script>`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/websites"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                website.isActive
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Globe
                className={`h-6 w-6 ${
                  website.isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {website.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {website.domain} •{" "}
                {website.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-500">Inactive</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/queries/${id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              View Queries
            </Button>
          </Link>
          <Link to={`/admin/websites/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={website.stats?.totalLeads || 0}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="This Month"
          value={website.stats?.leadsThisMonth || 0}
          icon={Zap}
          color="green"
        />
        <StatCard
          title="Duplicates"
          value={website.stats?.duplicatesDetected || 0}
          icon={Shield}
          color="amber"
        />
        <StatCard
          title="Rate Limit"
          value={`${website.rateLimit?.requestsPerMinute || 60}/min`}
          icon={Activity}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Website Details */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Website Details
          </h2>
          <div className="space-y-4">
            <DetailRow label="Name" value={website.name} />
            <DetailRow label="Domain" value={website.domain} />
            <DetailRow
              label="Category"
              value={CATEGORY_LABELS[website.category] || website.category}
            />
            <DetailRow label="Description" value={website.description || "—"} />
            <DetailRow
              label="Created"
              value={
                website.createdAt
                  ? format(new Date(website.createdAt), "MMM dd, yyyy")
                  : "—"
              }
            />
            <DetailRow
              label="Last Lead"
              value={
                website.stats?.lastLeadAt
                  ? format(
                      new Date(website.stats.lastLeadAt),
                      "MMM dd, yyyy hh:mm a",
                    )
                  : "No leads yet"
              }
            />
          </div>
        </div>

        {/* API Key Management */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Key className="h-5 w-5 text-amber-500" />
            API Key
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                API Key Prefix
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-gray-100 px-3 py-2 text-sm font-mono dark:bg-gray-700 dark:text-gray-200">
                  {website.apiKeyPrefix || "••••••••"}...
                </code>
              </div>
            </div>

            {newApiKey && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  New API Key (save it now — it won't be shown again):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-xs font-mono dark:bg-gray-800 dark:text-gray-200">
                    {showApiKey ? newApiKey : "•".repeat(40)}
                  </code>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="rounded p-1.5 text-gray-400 hover:text-gray-600"
                    title={showApiKey ? "Hide" : "Show"}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard(newApiKey, "API Key")}
                    className="rounded p-1.5 text-gray-400 hover:text-gray-600"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateModalOpen(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate API Key
            </Button>
          </div>

          {/* Duplicate Settings */}
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Duplicate Detection
            </h3>
            <div className="space-y-2">
              <SettingRow
                label="Check Email"
                enabled={website.duplicateSettings?.checkEmail}
              />
              <SettingRow
                label="Check Phone"
                enabled={website.duplicateSettings?.checkPhone}
              />
              <SettingRow
                label="Check Name + Email"
                enabled={website.duplicateSettings?.checkNameEmail}
              />
            </div>
          </div>

          {/* Webhook */}
          {website.webhookUrl && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Webhook
              </h3>
              <p className="mb-2 break-all text-sm text-gray-600 dark:text-gray-300">
                {website.webhookUrl}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                <Zap className="mr-2 h-4 w-4" />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          )}

          {/* IP Whitelist */}
          {website.ipWhitelist && website.ipWhitelist.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                IP Whitelist
              </h3>
              <div className="flex flex-wrap gap-2">
                {website.ipWhitelist.map((ip, i) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {ip}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Code Snippet */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Integration Code
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleCopyToClipboard(integrationSnippet, "Code snippet")
            }
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </Button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
          <code>{integrationSnippet}</code>
        </pre>
      </div>

      {/* Regenerate API Key Modal */}
      <Modal
        isOpen={regenerateModalOpen}
        onClose={() => setRegenerateModalOpen(false)}
        title="Regenerate API Key"
      >
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> Regenerating the API key will immediately
            invalidate the current key. Any integrations using the old key will
            stop working.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setRegenerateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRegenerateApiKey}>
            Regenerate Key
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Website"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{website.name}</strong>? This
          will disable lead collection from this source. Existing leads will NOT
          be deleted.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
  </div>
);

const SettingRow = ({ label, enabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
    {enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )}
  </div>
);

export default WebsiteDetail;

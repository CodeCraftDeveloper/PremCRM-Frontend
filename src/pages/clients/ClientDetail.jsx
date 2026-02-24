import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Building,
  DollarSign,
  Clock,
  MessageSquare,
  Plus,
  Image,
} from "lucide-react";
import {
  fetchClient,
  fetchRemarks,
  createRemark,
  uploadVisitingCard,
  clearSelectedClient,
} from "../../store/slices/clientsSlice";
import {
  Button,
  LoadingSpinner,
  StatusBadge,
  PriorityBadge,
  Modal,
  Textarea,
  Select,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

const REMARK_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "follow_up", label: "Follow Up" },
];

const ClientDetail = ({ isAdmin = true }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    selectedClient: client,
    remarks,
    isLoading,
    isRemarksLoading,
  } = useSelector((state) => state.clients);

  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [remarkContent, setRemarkContent] = useState("");
  const [remarkType, setRemarkType] = useState("note");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    dispatch(fetchClient(id));
    dispatch(fetchRemarks({ clientId: id }));

    return () => {
      dispatch(clearSelectedClient());
    };
  }, [dispatch, id]);

  const handleAddRemark = async () => {
    if (!remarkContent.trim()) {
      toast.error("Please enter remark content");
      return;
    }

    try {
      await dispatch(
        createRemark({
          clientId: id,
          data: { content: remarkContent, type: remarkType },
        }),
      ).unwrap();

      toast.success("Remark added successfully");
      setRemarkModalOpen(false);
      setRemarkContent("");
      setRemarkType("note");
    } catch (error) {
      toast.error(error || "Failed to add remark");
    }
  };

  const handleUploadVisitingCard = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      await dispatch(uploadVisitingCard({ id, file: selectedFile })).unwrap();
      toast.success("Visiting card uploaded successfully");
      setUploadModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(error || "Failed to upload visiting card");
    }
  };

  const basePath = isAdmin ? "/admin" : "/marketing";

  if (isLoading || !client) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading client details..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {client.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 truncate">
                {client.companyName}
              </p>
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              icon={Image}
              onClick={() => setUploadModalOpen(true)}
              className="flex-1 sm:flex-none text-sm"
            >
              <span className="hidden sm:inline">Upload Card</span>
              <span className="sm:hidden">Card</span>
            </Button>
            <Link
              to={`${basePath}/clients/${id}/edit`}
              className="flex-1 sm:flex-none"
            >
              <Button icon={Edit} className="w-full sm:w-auto text-sm">
                <span className="hidden sm:inline">Edit</span>
                <span className="sm:hidden">✎</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Contact Info */}
          <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30 flex-shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-sm sm:text-base text-blue-600 hover:underline break-all"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30 flex-shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm sm:text-base text-green-600 hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
              {client.alternatePhone && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30 flex-shrink-0">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Alternate Phone
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                      {client.alternatePhone}
                    </p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30 flex-shrink-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Address
                    </p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                      {[
                        client.address.street,
                        client.address.city,
                        client.address.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Remarks Section */}
          <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Remarks & Notes
              </h3>
              <Button
                size="sm"
                icon={Plus}
                onClick={() => setRemarkModalOpen(true)}
                className="text-sm"
              >
                Add Remark
              </Button>
            </div>

            {isRemarksLoading ? (
              <LoadingSpinner size="sm" />
            ) : remarks.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No remarks yet. Add your first remark!
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {remarks.map((remark) => (
                  <div
                    key={remark._id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                          {remark.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          by {remark.user?.name || "Unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(
                          new Date(remark.createdAt),
                          "MMM d, yyyy h:mm a",
                        )}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      {remark.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Status Card */}
          <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Status
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Follow-up Status
                </span>
                <StatusBadge status={client.followUpStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Priority
                </span>
                <PriorityBadge priority={client.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Next Follow-up
                </span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  {client.nextFollowUpDate
                    ? format(new Date(client.nextFollowUpDate), "MMM d, yyyy")
                    : "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Event Info */}
          {client.event && (
            <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Event
              </h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30 flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                    {client.event.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {client.event.location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Marketing Person */}
          {client.marketingPerson && (
            <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Assigned To
              </h3>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-full bg-blue-500 text-white flex-shrink-0 text-xs sm:text-sm">
                  {client.marketingPerson.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                    {client.marketingPerson.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {client.marketingPerson.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Visiting Card */}
          {client.visitingCard?.url && (
            <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Visiting Card
              </h3>
              <a
                href={client.visitingCardUrl || client.visitingCard.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={client.visitingCardUrl || client.visitingCard.url}
                  alt="Visiting Card"
                  className="h-40 w-full object-cover transition-transform hover:scale-105 sm:h-48"
                />
              </a>
            </div>
          )}

          {/* Additional Info */}
          <div className="rounded-lg sm:rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Additional Info
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {client.industry && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Industry
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {client.industry}
                  </span>
                </div>
              )}
              {client.estimatedValue && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Est. Value
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    INR {client.estimatedValue.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Created
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(client.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Remark Modal */}
      <Modal
        isOpen={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        title="Add Remark"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Type"
            options={REMARK_TYPES}
            value={remarkType}
            onChange={(e) => setRemarkType(e.target.value)}
          />
          <Textarea
            label="Content"
            value={remarkContent}
            onChange={(e) => setRemarkContent(e.target.value)}
            placeholder="Enter your remark..."
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRemarkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRemark}>Add Remark</Button>
          </div>
        </div>
      </Modal>

      {/* Upload Visiting Card Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Visiting Card"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
              id="visitingCard"
            />
            <label htmlFor="visitingCard" className="cursor-pointer">
              <Image className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {selectedFile ? selectedFile.name : "Click to select an image"}
              </p>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadVisitingCard} disabled={!selectedFile}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientDetail;

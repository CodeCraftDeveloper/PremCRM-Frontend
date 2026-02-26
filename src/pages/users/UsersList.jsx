import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  fetchUsers,
  deleteUser,
  resetUserPassword,
  approveUser,
  rejectUser,
  setPage,
} from "../../store/slices/usersSlice";
import {
  Button,
  SearchInput,
  Select,
  Pagination,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  Modal,
} from "../../components/ui";
import api from "../../services/api";
import { connectSocket } from "../../services/socket";
import toast from "react-hot-toast";
import { format } from "date-fns";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "marketing", label: "Marketing" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const APPROVAL_OPTIONS = [
  { value: "pending", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const UsersList = () => {
  const dispatch = useDispatch();
  const { users, pagination, isLoading } = useSelector((state) => state.users);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [liveStatusMap, setLiveStatusMap] = useState({});

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search,
      role: roleFilter,
      isActive: statusFilter,
      approvalStatus: approvalFilter,
    };
    dispatch(fetchUsers(params));
  }, [
    dispatch,
    pagination.page,
    pagination.limit,
    search,
    roleFilter,
    statusFilter,
    approvalFilter,
  ]);

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const response = await api.get("/sessions/marketing/status");
        const statuses = response.data?.data || [];
        const map = statuses.reduce((acc, item) => {
          acc[String(item.userId)] = item;
          return acc;
        }, {});
        setLiveStatusMap(map);
      } catch {
        // Keep UI functional even if live status endpoint is unavailable
      }
    };

    fetchLiveStatus();

    const socket = connectSocket();
    if (!socket) return;

    const handleSnapshot = (statuses) => {
      const map = (statuses || []).reduce((acc, item) => {
        acc[String(item.userId)] = item;
        return acc;
      }, {});
      setLiveStatusMap(map);
    };

    const handleStatusChanged = (status) => {
      setLiveStatusMap((prev) => ({
        ...prev,
        [String(status.userId)]: status,
      }));
    };

    socket.on("marketing:status_snapshot", handleSnapshot);
    socket.on("marketing:status_changed", handleStatusChanged);

    return () => {
      socket.off("marketing:status_snapshot", handleSnapshot);
      socket.off("marketing:status_changed", handleStatusChanged);
    };
  }, []);

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleResetClick = (user) => {
    setSelectedUser(user);
    setResetModalOpen(true);
  };

  const handleApproveClick = (user) => {
    setSelectedUser(user);
    setApproveModalOpen(true);
  };

  const handleRejectClick = (user) => {
    setSelectedUser(user);
    setRejectModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedUser) return;
    try {
      await dispatch(approveUser(selectedUser._id)).unwrap();
      toast.success(`${selectedUser.name} has been approved`);
      setApproveModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error || "Failed to approve user");
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedUser) return;
    try {
      await dispatch(rejectUser(selectedUser._id)).unwrap();
      toast.success(`${selectedUser.name} has been rejected`);
      setRejectModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error || "Failed to reject user");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await dispatch(deleteUser(selectedUser._id)).unwrap();
      toast.success("User deleted successfully");
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error || "Failed to delete user");
    }
  };

  const handleConfirmReset = async () => {
    if (!selectedUser) return;
    try {
      const temporaryPassword = `Temp@${Math.random().toString(36).slice(-8)}`;
      await dispatch(
        resetUserPassword({
          id: selectedUser._id,
          newPassword: temporaryPassword,
        }),
      ).unwrap();
      toast.success(`Password reset to: ${temporaryPassword}`);
      setResetModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error || "Failed to reset password");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {pagination.total} users found
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users/marketing/register">
            <Button variant="secondary">Register Marketing Manager</Button>
          </Link>
          <Link to="/admin/users/new">
            <Button icon={Plus}>Add User</Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full sm:max-w-md"
          />
          <Select
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            placeholder="All Roles"
            className="w-full sm:w-48"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Status"
            className="w-full sm:w-48"
          />
          <Select
            options={APPROVAL_OPTIONS}
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            placeholder="All Approvals"
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Loading users..." />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <EmptyState
            title="No users found"
            description="Try adjusting your filters or add a new user."
            action={
              <Link to="/admin/users/new">
                <Button icon={Plus}>Add User</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Approval
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Live
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) =>
                  (() => {
                    const live = liveStatusMap[String(user._id)];
                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Shield
                              className={`h-4 w-4 ${
                                user.role === "admin"
                                  ? "text-purple-600"
                                  : "text-green-600"
                              }`}
                            />
                            <span
                              className={`capitalize text-sm font-medium ${
                                user.role === "admin"
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge
                            status={user.isActive ? "active" : "inactive"}
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {user.approvalStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          ) : user.approvalStatus === "rejected" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {user.role === "marketing" ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  live?.isOnline
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {live?.isOnline ? "Online" : "Offline"}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {live?.todayTotalOnlineTime || "0s"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {user.approvalStatus === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => handleApproveClick(user)}
                                  title="Approve"
                                  className="text-green-600 hover:text-green-700"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={XCircle}
                                  onClick={() => handleRejectClick(user)}
                                  title="Reject"
                                  className="text-red-600 hover:text-red-700"
                                />
                              </>
                            )}
                            <Link to={`/admin/users/${user._id}/edit`}>
                              <Button variant="ghost" size="sm" icon={Edit} />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={RefreshCw}
                              onClick={() => handleResetClick(user)}
                              title="Reset Password"
                              className="text-yellow-600 hover:text-yellow-700"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600 hover:text-red-700"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })(),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => dispatch(setPage(page))}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Password"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reset the password for{" "}
            <strong>{selectedUser?.name}</strong>? A temporary password will be
            generated.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReset}>Reset Password</Button>
          </div>
        </div>
      </Modal>

      {/* Approve User Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to approve{" "}
            <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? They
            will be able to log in and access the system.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setApproveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmApprove}>Approve</Button>
          </div>
        </div>
      </Modal>

      {/* Reject User Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reject the registration of{" "}
            <strong>{selectedUser?.name}</strong> ({selectedUser?.email})? They
            will not be able to log in.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersList;

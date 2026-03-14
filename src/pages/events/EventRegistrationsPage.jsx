import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import api from "../../services/api";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  confirmed: "bg-green-900/30 text-green-300",
  pending: "bg-amber-900/30 text-amber-300",
  cancelled: "bg-rose-900/30 text-rose-300",
  checked_in: "bg-blue-900/30 text-blue-300",
  no_show: "bg-slate-700 text-slate-400",
};

const STATUS_ICONS = {
  confirmed: CheckCircle,
  pending: Clock,
  cancelled: XCircle,
  checked_in: CheckCircle,
  no_show: AlertCircle,
};

const BULK_STATUSES = ["confirmed", "no_show", "cancelled"];

const csvEscape = (value) => {
  const normalized = String(value ?? "").replace(/\r?\n|\r/g, " ");
  if (normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  if (normalized.includes(",")) {
    return `"${normalized}"`;
  }
  return normalized;
};

const downloadCsv = (filename, headers, rows) => {
  const headerLine = headers.map(csvEscape).join(",");
  const body = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const csv = `${headerLine}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function EventRegistrationsPage({ isAdmin = true }) {
  const { id: eventId } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReg, setSelectedReg] = useState(null);
  const [isEditingAttendee, setIsEditingAttendee] = useState(false);
  const [savingAttendee, setSavingAttendee] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [attendeeForm, setAttendeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [lifecycleForm, setLifecycleForm] = useState({
    reason: "",
    refundAmount: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 20, search, status: statusFilter };
    try {
      const response = await api.get(`/events/${eventId}/registrations`, {
        params,
      });
      setRegistrations(response.data.data);
      setSelectedIds([]);
      setTotalPages(response.data.pagination?.totalPages ?? 1);
      setTotalDocs(response.data.pagination?.totalDocs ?? 0);
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [eventId, page, search, statusFilter]);

  const loadStats = useCallback(async () => {
    try {
      const response = await api.get(`/events/${eventId}/registrations/stats`);
      setStats(response.data.data);
    } catch {
      // Keep UI usable even when stats request fails.
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const updateStatus = async (reg, status) => {
    try {
      await api.patch(`/events/${eventId}/registrations/${reg._id}/status`, {
        status,
      });
      toast.success("Status updated");
      await Promise.all([load(), loadStats()]);
      setSelectedReg(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const openRegistration = (reg) => {
    setSelectedReg(reg);
    setIsEditingAttendee(false);
    setAttendeeForm({
      firstName: reg.attendee?.firstName || "",
      lastName: reg.attendee?.lastName || "",
      email: reg.attendee?.email || "",
      phone: reg.attendee?.phone || "",
      company: reg.attendee?.company || "",
      notes: reg.notes || "",
    });
    setLifecycleForm({
      reason: reg.refundReason || reg.cancelReason || "",
      refundAmount:
        reg.refundAmount && reg.refundAmount > 0
          ? String(reg.refundAmount)
          : "",
    });
  };

  const closeRegistration = () => {
    setSelectedReg(null);
    setIsEditingAttendee(false);
    setSavingAttendee(false);
    setLifecycleForm({ reason: "", refundAmount: "" });
  };

  const cancelRegistration = async () => {
    if (!selectedReg?._id) return;
    try {
      const response = await api.patch(
        `/events/${eventId}/registrations/${selectedReg._id}/status`,
        {
          status: "cancelled",
          reason: lifecycleForm.reason.trim(),
        },
      );
      const updatedReg = response?.data?.data?.registration;
      setSelectedReg(updatedReg);
      setRegistrations((prev) =>
        prev.map((reg) => (reg._id === updatedReg._id ? updatedReg : reg)),
      );
      toast.success("Registration cancelled");
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };

  const refundRegistration = async () => {
    if (!selectedReg?._id) return;
    try {
      const response = await api.patch(
        `/events/${eventId}/registrations/${selectedReg._id}/refund`,
        {
          reason: lifecycleForm.reason.trim(),
          refundAmount:
            lifecycleForm.refundAmount === ""
              ? undefined
              : Number(lifecycleForm.refundAmount),
        },
      );
      const updatedReg = response?.data?.data?.registration;
      setSelectedReg(updatedReg);
      setRegistrations((prev) =>
        prev.map((reg) => (reg._id === updatedReg._id ? updatedReg : reg)),
      );
      toast.success("Refund recorded");
      await Promise.all([load(), loadStats()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    }
  };

  const saveAttendee = async () => {
    if (!selectedReg?._id) return;

    const payload = {
      firstName: attendeeForm.firstName.trim(),
      lastName: attendeeForm.lastName.trim(),
      email: attendeeForm.email.trim(),
      phone: attendeeForm.phone.trim(),
      company: attendeeForm.company.trim(),
      notes: attendeeForm.notes.trim(),
    };

    if (!payload.firstName || !payload.email) {
      toast.error("First name and email are required");
      return;
    }

    setSavingAttendee(true);
    try {
      const response = await api.patch(
        `/events/${eventId}/registrations/${selectedReg._id}/attendee`,
        payload,
      );
      const updatedReg = response?.data?.data?.registration;

      setRegistrations((prev) =>
        prev.map((reg) => (reg._id === selectedReg._id ? updatedReg : reg)),
      );
      setSelectedReg(updatedReg);
      setIsEditingAttendee(false);
      toast.success("Attendee details updated");
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update attendee");
    } finally {
      setSavingAttendee(false);
    }
  };

  const toggleSelectOne = (regId) => {
    setSelectedIds((prev) =>
      prev.includes(regId)
        ? prev.filter((id) => id !== regId)
        : [...prev, regId],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = registrations.map((reg) => reg._id);
    if (
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id))
    ) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(visibleIds);
  };

  const bulkUpdateStatus = async (status) => {
    if (!selectedIds.length) return;

    setIsBulkUpdating(true);
    try {
      const selectedSet = new Set(selectedIds);
      const selectedRegs = registrations
        .filter((reg) => selectedSet.has(reg._id))
        .filter((reg) => reg.status !== status);

      if (!selectedRegs.length) {
        toast("No selected attendees require this status change");
        return;
      }

      const results = await Promise.allSettled(
        selectedRegs.map((reg) =>
          api.patch(`/events/${eventId}/registrations/${reg._id}/status`, {
            status,
          }),
        ),
      );

      const successCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `${successCount} attendee(s) updated to ${status.replace("_", " ")}`,
        );
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} attendee update(s) failed`);
      }

      await Promise.all([load(), loadStats()]);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const buildCsvRows = (records) =>
    records.map((reg) => [
      reg.registrationNumber,
      reg.attendee?.firstName || "",
      reg.attendee?.lastName || "",
      reg.attendee?.email || "",
      reg.attendee?.phone || "",
      reg.attendee?.company || "",
      reg.ticketTypeId?.name || "",
      reg.quantity,
      reg.totalAmount,
      reg.currency,
      reg.status,
      reg.paymentStatus,
      reg.notes || "",
      reg.createdAt ? format(new Date(reg.createdAt), "yyyy-MM-dd HH:mm") : "",
      reg.checkedInAt
        ? format(new Date(reg.checkedInAt), "yyyy-MM-dd HH:mm")
        : "",
    ]);

  const csvHeaders = [
    "Registration Number",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Company",
    "Ticket",
    "Quantity",
    "Total Amount",
    "Currency",
    "Status",
    "Payment Status",
    "Notes",
    "Registered At",
    "Checked In At",
  ];

  const exportSelectedRegistrations = () => {
    const selectedSet = new Set(selectedIds);
    const selectedRows = registrations.filter((reg) =>
      selectedSet.has(reg._id),
    );
    if (!selectedRows.length) {
      toast("No attendees selected for export");
      return;
    }

    const today = format(new Date(), "yyyyMMdd-HHmmss");
    downloadCsv(
      `event-${eventId}-attendees-selected-${today}.csv`,
      csvHeaders,
      buildCsvRows(selectedRows),
    );
    toast.success(`Exported ${selectedRows.length} selected attendee(s)`);
  };

  const clearSelection = () => setSelectedIds([]);

  const exportFilteredRegistrations = async () => {
    setIsExporting(true);
    try {
      const limit = 200;
      const firstResponse = await api.get(`/events/${eventId}/registrations`, {
        params: { page: 1, limit, search, status: statusFilter },
      });

      const all = [...(firstResponse?.data?.data || [])];
      const pages = firstResponse?.data?.pagination?.totalPages || 1;
      const safePages = Math.min(pages, 50);

      for (let p = 2; p <= safePages; p += 1) {
        const response = await api.get(`/events/${eventId}/registrations`, {
          params: { page: p, limit, search, status: statusFilter },
        });
        all.push(...(response?.data?.data || []));
      }

      const today = format(new Date(), "yyyyMMdd-HHmmss");
      downloadCsv(
        `event-${eventId}-attendees-${today}.csv`,
        csvHeaders,
        buildCsvRows(all),
      );
      toast.success(`Exported ${all.length} attendee record(s)`);
    } catch {
      toast.error("Failed to export attendees");
    } finally {
      setIsExporting(false);
    }
  };

  const allVisibleSelected =
    registrations.length > 0 &&
    registrations.every((reg) => selectedIds.includes(reg._id));

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isAdmin) return;

      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        if (isTypingTarget) return;
        event.preventDefault();
        const visibleIds = registrations.map((reg) => reg._id);
        if (
          visibleIds.length > 0 &&
          visibleIds.every((id) => selectedIds.includes(id))
        ) {
          setSelectedIds([]);
        } else {
          setSelectedIds(visibleIds);
        }
      }

      if (event.key === "Escape") {
        if (selectedReg) {
          setSelectedReg(null);
          setIsEditingAttendee(false);
          setSavingAttendee(false);
          return;
        }
        if (selectedIds.length > 0) {
          setSelectedIds([]);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAdmin, selectedIds.length, selectedReg, registrations, selectedIds]);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Attendees",
              value: stats.totalAttendees,
              color: "text-white",
            },
            {
              label: "Confirmed",
              value: stats.byStatus?.confirmed ?? 0,
              color: "text-green-400",
            },
            {
              label: "Checked In",
              value: stats.byStatus?.checked_in ?? 0,
              color: "text-blue-400",
            },
            {
              label: "Revenue",
              value:
                stats.totalRevenue === 0
                  ? "Free"
                  : `₹${stats.totalRevenue?.toLocaleString()}`,
              color: "text-yellow-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-slate-900 border border-slate-800 p-4"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                {s.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                {s.value ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setLoading(true);
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, reg#…"
            className="bg-transparent text-sm text-white outline-none placeholder-slate-500 flex-1"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setLoading(true);
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white outline-none"
        >
          <option value="">All Statuses</option>
          {["pending", "confirmed", "cancelled", "checked_in", "no_show"].map(
            (s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ),
          )}
        </select>

        {isAdmin && (
          <button
            onClick={exportFilteredRegistrations}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        )}
      </div>

      {isAdmin && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-indigo-900 bg-indigo-950/30 px-4 py-3">
          <span className="text-sm text-indigo-200">
            {selectedIds.length} selected
          </span>
          <span className="text-xs text-indigo-300/80">
            Shortcuts: Ctrl/Cmd+A toggle visible, Esc clear selection
          </span>
          <button
            onClick={exportSelectedRegistrations}
            className="rounded-lg border border-indigo-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-100 hover:bg-indigo-900/40"
          >
            Export Selected
          </button>
          <button
            onClick={clearSelection}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
          >
            Clear Selection
          </button>
          {BULK_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => bulkUpdateStatus(status)}
              disabled={isBulkUpdating}
              className="rounded-lg border border-indigo-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-100 hover:bg-indigo-900/40 disabled:opacity-60"
            >
              {isBulkUpdating
                ? "Updating..."
                : `Mark ${status.replace("_", " ")}`}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : registrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-slate-500">
          No registrations found.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-800">
                <tr>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-500 font-medium w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                      />
                    </th>
                  )}
                  {[
                    "Reg #",
                    "Attendee",
                    "Ticket",
                    "Qty",
                    "Amount",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-500 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {registrations.map((reg) => {
                  const Icon = STATUS_ICONS[reg.status] ?? Clock;
                  return (
                    <tr
                      key={reg._id}
                      className="bg-slate-950 hover:bg-slate-900"
                    >
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(reg._id)}
                            onChange={() => toggleSelectOne(reg._id)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {reg.registrationNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">
                          {reg.attendee.firstName} {reg.attendee.lastName}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {reg.attendee.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {reg.ticketTypeId?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {reg.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {reg.totalAmount === 0
                          ? "Free"
                          : `${reg.currency} ${reg.totalAmount.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[reg.status]}`}
                        >
                          <Icon className="h-3 w-3" />
                          {reg.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openRegistration(reg)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>
                {totalDocs} total · page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => p - 1);
                  }}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => p + 1);
                  }}
                  className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Registration Detail
            </h3>
            {isEditingAttendee ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={attendeeForm.firstName}
                    onChange={(e) =>
                      setAttendeeForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="First name"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    value={attendeeForm.lastName}
                    onChange={(e) =>
                      setAttendeeForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Last name"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <input
                  value={attendeeForm.email}
                  onChange={(e) =>
                    setAttendeeForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={attendeeForm.phone}
                    onChange={(e) =>
                      setAttendeeForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Phone"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    value={attendeeForm.company}
                    onChange={(e) =>
                      setAttendeeForm((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    placeholder="Company"
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <textarea
                  value={attendeeForm.notes}
                  onChange={(e) =>
                    setAttendeeForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Internal notes"
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                {[
                  ["Reg #", selectedReg.registrationNumber],
                  [
                    "Name",
                    `${selectedReg.attendee.firstName} ${selectedReg.attendee.lastName}`,
                  ],
                  ["Email", selectedReg.attendee.email],
                  ["Phone", selectedReg.attendee.phone || "—"],
                  ["Company", selectedReg.attendee.company || "—"],
                  ["Notes", selectedReg.notes || "—"],
                  ["Ticket", selectedReg.ticketTypeId?.name ?? "—"],
                  ["Qty", selectedReg.quantity],
                  [
                    "Subtotal",
                    `${selectedReg.currency} ${selectedReg.subtotalAmount ?? selectedReg.totalAmount}`,
                  ],
                  [
                    "Discount",
                    selectedReg.discountAmount
                      ? `${selectedReg.currency} ${selectedReg.discountAmount}`
                      : "—",
                  ],
                  ["Coupon", selectedReg.couponCode || "—"],
                  [
                    "Amount",
                    selectedReg.totalAmount === 0
                      ? "Free"
                      : `${selectedReg.currency} ${selectedReg.totalAmount}`,
                  ],
                  ["Status", selectedReg.status.replace("_", " ")],
                  ["Payment", selectedReg.paymentStatus],
                  ["Cancel Reason", selectedReg.cancelReason || "—"],
                  ["Refund Reason", selectedReg.refundReason || "—"],
                  [
                    "Refund Amount",
                    selectedReg.refundAmount
                      ? `${selectedReg.currency} ${selectedReg.refundAmount}`
                      : "—",
                  ],
                  [
                    "Registered",
                    format(new Date(selectedReg.createdAt), "PPP p"),
                  ],
                  selectedReg.checkedInAt
                    ? [
                        "Checked in",
                        format(new Date(selectedReg.checkedInAt), "PPP p"),
                      ]
                    : null,
                ]
                  .filter(Boolean)
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-white text-right">{value}</dd>
                    </div>
                  ))}
              </dl>
            )}

            {isAdmin && !isEditingAttendee && (
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-semibold text-white">
                  Cancellation / Refund Tracking
                </p>
                <textarea
                  value={lifecycleForm.reason}
                  onChange={(e) =>
                    setLifecycleForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Reason for cancellation or refund"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lifecycleForm.refundAmount}
                  onChange={(e) =>
                    setLifecycleForm((prev) => ({
                      ...prev,
                      refundAmount: e.target.value,
                    }))
                  }
                  placeholder={`Refund amount (default ${selectedReg.totalAmount || 0})`}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            )}

            {isAdmin && (
              <div className="flex gap-2">
                {isEditingAttendee ? (
                  <>
                    <button
                      onClick={saveAttendee}
                      disabled={savingAttendee}
                      className="flex-1 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold py-2 transition-colors"
                    >
                      {savingAttendee ? "Saving..." : "Save Attendee"}
                    </button>
                    <button
                      onClick={() => setIsEditingAttendee(false)}
                      disabled={savingAttendee}
                      className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-sm font-semibold py-2 transition-colors"
                    >
                      Cancel Edit
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingAttendee(true)}
                    className="w-full rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-semibold py-2 transition-colors"
                  >
                    Manage Attendee
                  </button>
                )}
              </div>
            )}

            {isAdmin &&
              !isEditingAttendee &&
              selectedReg.status !== "cancelled" &&
              selectedReg.status !== "checked_in" && (
                <div className="flex gap-2 pt-2">
                  {selectedReg.status !== "confirmed" && (
                    <button
                      onClick={() => updateStatus(selectedReg, "confirmed")}
                      className="flex-1 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold py-2 transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(selectedReg, "no_show")}
                    className="flex-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 transition-colors"
                  >
                    No Show
                  </button>
                  <button
                    onClick={cancelRegistration}
                    className="flex-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-sm font-semibold py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

            {isAdmin &&
              !isEditingAttendee &&
              selectedReg.paymentStatus !== "refunded" &&
              selectedReg.totalAmount > 0 && (
                <button
                  onClick={refundRegistration}
                  className="w-full rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold py-2 transition-colors"
                >
                  Mark Refunded
                </button>
              )}

            <button
              onClick={closeRegistration}
              className="w-full rounded-lg border border-slate-600 text-slate-300 text-sm font-semibold py-2 hover:border-slate-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

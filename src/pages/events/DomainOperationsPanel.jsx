import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { eventDomainService } from "../../services";
import { Button, Pagination, Select } from "../../components/ui";
import toast from "react-hot-toast";

const ORDER_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const CHECKIN_CHANNEL_OPTIONS = [
  { value: "qr", label: "QR" },
  { value: "manual", label: "Manual" },
  { value: "api", label: "API" },
];

const formatCurrency = (amount, currency = "INR") =>
  `${currency} ${Number(amount || 0).toLocaleString()}`;

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

const DomainOperationsPanel = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [overview, setOverview] = useState(null);

  const [rows, setRows] = useState([]);
  const [isRowsLoading, setIsRowsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    orderStatus: "",
    paymentStatus: "",
    paymentMethod: "",
    checkinChannel: "",
    checkinFrom: "",
    checkinTo: "",
  });

  const loadOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    try {
      const response = await eventDomainService.getOverview(eventId);
      setOverview(response?.data || null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load domain overview",
      );
    } finally {
      setIsOverviewLoading(false);
    }
  }, [eventId]);

  const listApi = useMemo(() => {
    if (activeTab === "orders") return eventDomainService.getOrders;
    if (activeTab === "payments") return eventDomainService.getPayments;
    if (activeTab === "checkins") return eventDomainService.getCheckIns;
    return null;
  }, [activeTab]);

  const buildParams = useCallback(
    (overrides = {}) => {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...overrides,
      };

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }

      if (activeTab === "orders" && filters.orderStatus) {
        params.status = filters.orderStatus;
      }

      if (activeTab === "payments") {
        if (filters.paymentStatus) params.status = filters.paymentStatus;
        if (filters.paymentMethod) params.method = filters.paymentMethod;
      }

      if (activeTab === "checkins") {
        if (filters.checkinChannel) params.channel = filters.checkinChannel;
        if (filters.checkinFrom) params.from = filters.checkinFrom;
        if (filters.checkinTo) params.to = filters.checkinTo;
      }

      return params;
    },
    [activeTab, filters, pagination.limit, pagination.page],
  );

  const loadRows = useCallback(async () => {
    if (!listApi) return;

    setIsRowsLoading(true);
    try {
      const response = await listApi(eventId, buildParams());
      setRows(response?.data || []);
      setPagination((prev) => ({
        ...prev,
        page: response?.pagination?.page || prev.page,
        limit: response?.pagination?.limit || prev.limit,
        totalPages: response?.pagination?.totalPages || 1,
        totalDocs: response?.pagination?.totalDocs || 0,
      }));
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load domain data",
      );
      setRows([]);
      setPagination((prev) => ({ ...prev, totalPages: 1, totalDocs: 0 }));
    } finally {
      setIsRowsLoading(false);
    }
  }, [buildParams, eventId, listApi]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "overview") return;
    loadRows();
  }, [activeTab, loadRows]);

  const onSearchChange = (value) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, search: value }));
  };

  useEffect(() => {
    if (activeTab === "overview") return;
    const timer = setTimeout(() => {
      loadRows();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    filters.search,
    filters.orderStatus,
    filters.paymentStatus,
    filters.paymentMethod,
    filters.checkinChannel,
    filters.checkinFrom,
    filters.checkinTo,
    pagination.page,
    loadRows,
  ]);

  const refresh = () => {
    if (activeTab === "overview") {
      loadOverview();
      return;
    }
    loadRows();
  };

  const getOverviewCount = (obj = {}, keys = []) =>
    keys.reduce((sum, key) => sum + Number(obj?.[key] || 0), 0);

  const mapRowsToCsv = useCallback(
    (items) => {
      if (activeTab === "orders") {
        return {
          headers: [
            "Order Number",
            "Attendee Name",
            "Attendee Email",
            "Amount",
            "Currency",
            "Order Status",
            "Payment Status",
            "Payment Method",
            "Created At",
          ],
          rows: items.map((item) => [
            item.orderNumber || "",
            `${item.attendeeId?.firstName || ""} ${item.attendeeId?.lastName || ""}`.trim(),
            item.attendeeId?.email || "",
            item.totalAmount ?? 0,
            item.currency || "INR",
            item.status || "",
            item.payment?.status || "",
            item.payment?.method || "",
            item.createdAt ? new Date(item.createdAt).toISOString() : "",
          ]),
        };
      }

      if (activeTab === "payments") {
        return {
          headers: [
            "Order Number",
            "Attendee Name",
            "Attendee Email",
            "Amount",
            "Currency",
            "Payment Status",
            "Payment Method",
            "Transaction ID",
            "Paid At",
            "Created At",
          ],
          rows: items.map((item) => [
            item.orderId?.orderNumber || "",
            `${item.orderId?.attendeeId?.firstName || ""} ${item.orderId?.attendeeId?.lastName || ""}`.trim(),
            item.orderId?.attendeeId?.email || "",
            item.amount ?? 0,
            item.currency || "INR",
            item.status || "",
            item.method || "",
            item.transactionId || "",
            item.paidAt ? new Date(item.paidAt).toISOString() : "",
            item.createdAt ? new Date(item.createdAt).toISOString() : "",
          ]),
        };
      }

      return {
        headers: [
          "Registration Number",
          "Attendee Name",
          "Attendee Email",
          "Channel",
          "Checked In At",
          "Checked In By",
          "Scan Code",
        ],
        rows: items.map((item) => [
          item.legacyRegistrationId?.registrationNumber || "",
          `${item.legacyRegistrationId?.attendee?.firstName || ""} ${item.legacyRegistrationId?.attendee?.lastName || ""}`.trim(),
          item.legacyRegistrationId?.attendee?.email || "",
          item.channel || "",
          item.checkedInAt ? new Date(item.checkedInAt).toISOString() : "",
          item.checkedInBy?.name || item.checkedInBy?.email || "",
          item.scanCode || "",
        ]),
      };
    },
    [activeTab],
  );

  const handleExport = useCallback(async () => {
    if (activeTab === "overview" || !listApi) return;

    setIsExporting(true);
    try {
      const exportLimit = 100;
      const firstResponse = await listApi(
        eventId,
        buildParams({ page: 1, limit: exportLimit }),
      );

      const allItems = [...(firstResponse?.data || [])];
      const totalPages = Math.min(
        firstResponse?.pagination?.totalPages || 1,
        200,
      );

      for (let pageIndex = 2; pageIndex <= totalPages; pageIndex += 1) {
        const pageResponse = await listApi(
          eventId,
          buildParams({ page: pageIndex, limit: exportLimit }),
        );
        allItems.push(...(pageResponse?.data || []));
      }

      if (!allItems.length) {
        toast("No records to export for current filters");
        return;
      }

      const { headers, rows: csvRows } = mapRowsToCsv(allItems);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadCsv(
        `event-${eventId}-${activeTab}-${timestamp}.csv`,
        headers,
        csvRows,
      );
      toast.success(`Exported ${allItems.length} ${activeTab} records`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, buildParams, eventId, listApi, mapRowsToCsv]);

  const tabButton = (tab, label) => (
    <button
      key={tab}
      onClick={() => {
        setActiveTab(tab);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        activeTab === tab
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Domain Operations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Normalized domain entities: attendees, orders, payments, check-ins.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={refresh}
          loading={activeTab === "overview" ? isOverviewLoading : isRowsLoading}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabButton("overview", "Overview")}
        {tabButton("orders", "Orders")}
        {tabButton("payments", "Payments")}
        {tabButton("checkins", "Check-Ins")}
      </div>

      {activeTab === "overview" && (
        <div className="mt-5">
          {isOverviewLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading overview...
            </p>
          ) : !overview ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No overview data available.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs text-gray-500">Tenant Attendees</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {overview.attendees?.totalTenantAttendees || 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs text-gray-500">Orders</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {getOverviewCount(overview.orders, [
                    "draft",
                    "pending",
                    "confirmed",
                    "cancelled",
                    "refunded",
                  ])}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs text-gray-500">Payments</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {getOverviewCount(overview.payments, [
                    "free",
                    "pending",
                    "paid",
                    "refunded",
                    "failed",
                  ])}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs text-gray-500">Registrations</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {getOverviewCount(overview.registrations, [
                    "pending",
                    "confirmed",
                    "cancelled",
                    "checked_in",
                    "no_show",
                  ])}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs text-gray-500">Check-Ins</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {overview.checkIns?.total || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab !== "overview" && (
        <div className="mt-5 space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExport}
              loading={isExporting}
            >
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <input
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Search by attendee/order/registration"
            />

            {activeTab === "orders" && (
              <Select
                placeholder="All order statuses"
                options={ORDER_STATUS_OPTIONS}
                value={filters.orderStatus}
                onChange={(e) => {
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  setFilters((prev) => ({
                    ...prev,
                    orderStatus: e.target.value,
                  }));
                }}
              />
            )}

            {activeTab === "payments" && (
              <>
                <Select
                  placeholder="All payment statuses"
                  options={PAYMENT_STATUS_OPTIONS}
                  value={filters.paymentStatus}
                  onChange={(e) => {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    setFilters((prev) => ({
                      ...prev,
                      paymentStatus: e.target.value,
                    }));
                  }}
                />
                <Select
                  placeholder="All methods"
                  options={PAYMENT_METHOD_OPTIONS}
                  value={filters.paymentMethod}
                  onChange={(e) => {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    setFilters((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }));
                  }}
                />
              </>
            )}

            {activeTab === "checkins" && (
              <>
                <Select
                  placeholder="All channels"
                  options={CHECKIN_CHANNEL_OPTIONS}
                  value={filters.checkinChannel}
                  onChange={(e) => {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    setFilters((prev) => ({
                      ...prev,
                      checkinChannel: e.target.value,
                    }));
                  }}
                />
                <input
                  type="date"
                  value={filters.checkinFrom}
                  onChange={(e) => {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    setFilters((prev) => ({
                      ...prev,
                      checkinFrom: e.target.value,
                    }));
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="date"
                  value={filters.checkinTo}
                  onChange={(e) => {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    setFilters((prev) => ({
                      ...prev,
                      checkinTo: e.target.value,
                    }));
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </>
            )}
          </div>

          {isRowsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading records...
            </p>
          ) : rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No {activeTab} records found for current filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  {activeTab === "orders" && (
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Order #
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Attendee
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Payment
                      </th>
                    </tr>
                  )}
                  {activeTab === "payments" && (
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Order #
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Attendee
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Method
                      </th>
                    </tr>
                  )}
                  {activeTab === "checkins" && (
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Registration #
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Attendee
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Channel
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Checked In At
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                        Checked In By
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {activeTab === "orders" &&
                    rows.map((row) => (
                      <tr key={row._id}>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {row.orderNumber}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.attendeeId?.firstName || ""}{" "}
                          {row.attendeeId?.lastName || ""}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.attendeeId?.email || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {formatCurrency(row.totalAmount, row.currency)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 capitalize dark:text-gray-200">
                          {row.status}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.payment
                            ? `${row.payment.status} (${row.payment.method})`
                            : "-"}
                        </td>
                      </tr>
                    ))}

                  {activeTab === "payments" &&
                    rows.map((row) => (
                      <tr key={row._id}>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {row.orderId?.orderNumber || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.orderId?.attendeeId?.firstName || ""}{" "}
                          {row.orderId?.attendeeId?.lastName || ""}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.orderId?.attendeeId?.email || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {formatCurrency(row.amount, row.currency)}
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-700 dark:text-gray-200">
                          {row.status}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.method}
                        </td>
                      </tr>
                    ))}

                  {activeTab === "checkins" &&
                    rows.map((row) => (
                      <tr key={row._id}>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {row.legacyRegistrationId?.registrationNumber || "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.legacyRegistrationId?.attendee?.firstName || ""}{" "}
                          {row.legacyRegistrationId?.attendee?.lastName || ""}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {row.legacyRegistrationId?.attendee?.email || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2 capitalize text-gray-700 dark:text-gray-200">
                          {row.channel}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.checkedInAt
                            ? new Date(row.checkedInAt).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                          {row.checkedInBy?.name ||
                            row.checkedInBy?.email ||
                            "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(nextPage) =>
                setPagination((prev) => ({ ...prev, page: nextPage }))
              }
              totalItems={pagination.totalDocs}
              itemsPerPage={pagination.limit}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DomainOperationsPanel;

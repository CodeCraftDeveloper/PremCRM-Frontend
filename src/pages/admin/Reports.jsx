import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  FilterX,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  dashboardService,
  exportService,
  eventsService,
  usersService,
} from "../../services";
import {
  Button,
  Input,
  Select,
  LoadingSpinner,
  StatCard,
} from "../../components/ui";
import toast from "react-hot-toast";

const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" },
];

const PIE_COLORS = [
  "#0f766e",
  "#1d4ed8",
  "#ea580c",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
];

const STATUS_COLORS = {
  new: "#94a3b8",
  contacted: "#38bdf8",
  interested: "#6366f1",
  negotiation: "#f59e0b",
  converted: "#22c55e",
  lost: "#ef4444",
};

const formatDateInput = (date) => format(date, "yyyy-MM-dd");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const toLabel = (value) =>
  value
    ? String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "Unknown";

const normalizeResponseList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const SectionCard = ({ title, subtitle, children, actions = null }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions}
    </div>
    {children}
  </div>
);

const Reports = () => {
  const [rangePreset, setRangePreset] = useState("30");
  const [startDate, setStartDate] = useState(
    formatDateInput(subDays(new Date(), 30)),
  );
  const [endDate, setEndDate] = useState(formatDateInput(new Date()));
  const [eventId, setEventId] = useState("");
  const [marketerId, setMarketerId] = useState("");
  const [source, setSource] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [marketers, setMarketers] = useState([]);

  useEffect(() => {
    eventsService
      .getAll({ limit: 100 })
      .then((res) => setEvents(normalizeResponseList(res, "events")))
      .catch(() => {});

    usersService
      .getMarketingUsers()
      .then((res) => setMarketers(normalizeResponseList(res, "users")))
      .catch(() => {});
  }, []);

  const applyPreset = useCallback((value) => {
    setRangePreset(value);
    if (value === "custom") return;

    const end = new Date();
    const start = subDays(end, Number(value));
    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
  }, []);

  const params = useMemo(() => {
    const nextParams = {
      startDate,
      endDate,
    };

    if (eventId) nextParams.eventId = eventId;
    if (marketerId) nextParams.marketerId = marketerId;
    if (source) nextParams.source = source;

    return nextParams;
  }, [endDate, eventId, marketerId, source, startDate]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await dashboardService.getAnalytics(params);
      setAnalytics(response.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      let blob;
      let filename;

      if (type === "clients") {
        blob = await exportService.exportClients(params);
        filename = `clients-export-${Date.now()}.csv`;
      } else if (type === "events") {
        blob = await exportService.exportEvents();
        filename = `events-export-${Date.now()}.csv`;
      } else {
        blob = await exportService.exportActivityLogs();
        filename = `activity-logs-export-${Date.now()}.csv`;
      }

      downloadBlob(blob, filename);
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    applyPreset("30");
    setEventId("");
    setMarketerId("");
    setSource("");
  };

  const summary = analytics?.summary || {
    totalClients: 0,
    convertedClients: 0,
    conversionRate: 0,
    totalPipelineValue: 0,
    realizedRevenue: 0,
  };
  const roiSummary = analytics?.roiSummary || {
    totalBudget: 0,
    totalPipelineValue: 0,
    realizedRevenue: 0,
    roi: null,
  };
  const conversionTime = analytics?.conversionTime || {
    avgDays: 0,
    minDays: 0,
    maxDays: 0,
  };

  const statusData = (analytics?.statusDistribution || []).map((item) => ({
    name: toLabel(item._id),
    count: Number(item.count || 0),
    value: Number(item.value || 0),
  }));

  const sourceData = (analytics?.sourceDistribution || []).map((item) => ({
    name: toLabel(item._id),
    count: Number(item.count || 0),
    value: Number(item.value || 0),
  }));

  const trendData = (analytics?.dailyTrend || []).map((item) => ({
    date: item._id,
    leads: Number(item.count || 0),
    converted: Number(item.converted || 0),
    revenue: Number(item.revenue || 0),
  }));

  const funnelData = (analytics?.revenueFunnel || []).map((item) => ({
    stage: toLabel(item.stage),
    rawStage: item.stage,
    count: Number(item.count || 0),
    revenue: Number(item.revenue || 0),
  }));

  const roiEventData = (analytics?.roiByEvent || []).map((item) => ({
    ...item,
    eventName: item.eventName || "Unassigned Event",
    leadCount: Number(item.leadCount || 0),
    convertedCount: Number(item.convertedCount || 0),
    pipelineValue: Number(item.pipelineValue || 0),
    realizedRevenue: Number(item.realizedRevenue || 0),
    budget: Number(item.budget || 0),
    roi: item.roi,
  }));

  const eventOptions = useMemo(
    () => [
      { value: "", label: "All Events" },
      ...events.map((event) => ({
        value: event._id,
        label: event.name || event.title || event._id,
      })),
    ],
    [events],
  );

  const marketerOptions = useMemo(
    () => [
      { value: "", label: "All Marketers" },
      ...marketers.map((marketer) => ({
        value: marketer._id,
        label: marketer.name || marketer.email || marketer._id,
      })),
    ],
    [marketers],
  );

  const sourceOptions = useMemo(
    () => [
      { value: "", label: "All Sources" },
      ...(analytics?.availableSources || []).map((item) => ({
        value: item,
        label: toLabel(item),
      })),
    ],
    [analytics?.availableSources],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Slice performance by event, marketer, source, and date range with
            ROI and revenue funnel visibility.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            icon={RefreshCw}
            variant="outline"
            onClick={loadAnalytics}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button icon={FilterX} variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      <SectionCard
        title="Filters"
        subtitle="Use quick presets or a custom window, then narrow by event owner and source."
      >
        <div className="grid gap-4 xl:grid-cols-6 md:grid-cols-2">
          <Select
            label="Date Preset"
            options={DATE_RANGE_OPTIONS}
            value={rangePreset}
            onChange={(event) => applyPreset(event.target.value)}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event) => {
              setRangePreset("custom");
              setStartDate(event.target.value);
            }}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(event) => {
              setRangePreset("custom");
              setEndDate(event.target.value);
            }}
          />
          <Select
            label="Event"
            options={eventOptions}
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          />
          <Select
            label="Marketer"
            options={marketerOptions}
            value={marketerId}
            onChange={(event) => setMarketerId(event.target.value)}
          />
          <Select
            label="Source"
            options={sourceOptions}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        </div>
      </SectionCard>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center">
          <LoadingSpinner text="Loading analytics..." />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Total Leads" value={summary.totalClients} />
            <StatCard title="Converted" value={summary.convertedClients} />
            <StatCard
              title="Conversion Rate"
              value={`${Number(summary.conversionRate || 0).toFixed(1)}%`}
            />
            <StatCard
              title="Pipeline Value"
              value={formatCurrency(summary.totalPipelineValue)}
            />
            <StatCard
              title="Realized Revenue"
              value={formatCurrency(summary.realizedRevenue)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <StatCard
              title="Campaign Budget"
              value={formatCurrency(roiSummary.totalBudget)}
            />
            <StatCard
              title="ROI"
              value={
                roiSummary.roi == null
                  ? "No Budget"
                  : `${Number(roiSummary.roi).toFixed(1)}%`
              }
            />
            <StatCard
              title="Avg Conversion"
              value={`${Number(conversionTime.avgDays || 0).toFixed(1)}d`}
            />
            <StatCard
              title="Fastest to Convert"
              value={`${Number(conversionTime.minDays || 0).toFixed(1)}d`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <SectionCard
              title="Lead and Revenue Trend"
              subtitle="Daily volume and realized revenue across the selected range."
            >
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatCurrency(value), "Revenue"]
                          : [value, toLabel(name)]
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="leads"
                      name="Leads"
                      fill="#0f766e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="converted"
                      name="Converted"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No trend data available for the selected filters.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Source Mix"
              subtitle="Lead share by acquisition source."
            >
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {sourceData.map((item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Leads"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No source data available for the selected filters.
                </p>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Revenue Funnel"
              subtitle="Lead counts and revenue potential through the follow-up stages."
            >
              {funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatCurrency(value), "Pipeline Value"]
                          : [value, "Leads"]
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Leads"
                      fill="#1d4ed8"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Pipeline Value"
                      fill="#f97316"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No funnel data available for the selected filters.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Status Performance"
              subtitle="Volume and total value by lead status."
            >
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={statusData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "value"
                          ? [formatCurrency(value), "Value"]
                          : [value, "Leads"]
                      }
                    />
                    <Legend />
                    <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                      {statusData.map((item) => (
                        <Cell
                          key={item.name}
                          fill={
                            STATUS_COLORS[
                              item.name.toLowerCase().replace(/ /g, "_")
                            ] || "#6366f1"
                          }
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="value"
                      name="Value"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No status performance data available.
                </p>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Event ROI"
            subtitle="Budget efficiency and realized revenue by event under the current filters."
            actions={
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                <TrendingUp className="h-3.5 w-3.5" />
                {roiEventData.length} event
                {roiEventData.length === 1 ? "" : "s"}
              </div>
            }
          >
            {roiEventData.length > 0 ? (
              <div className="space-y-3">
                {roiEventData.slice(0, 8).map((item) => (
                  <div
                    key={String(item.eventId)}
                    className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.eventName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.leadCount} leads
                          <ArrowRight className="mx-2 inline h-3 w-3" />
                          {item.convertedCount} converted
                          <ArrowRight className="mx-2 inline h-3 w-3" />
                          {item.conversionRate.toFixed(1)}% conversion
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Budget
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Pipeline
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.pipelineValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Revenue
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.realizedRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ROI
                          </p>
                          <p
                            className={`font-semibold ${
                              item.roi == null
                                ? "text-slate-500 dark:text-slate-400"
                                : item.roi >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {item.roi == null
                              ? "No Budget"
                              : `${item.roi.toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No event ROI rows are available for the selected filters.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Export Data"
            subtitle="Download filtered clients or broader operational exports."
          >
            <div className="flex flex-wrap gap-3">
              <Button
                icon={FileSpreadsheet}
                loading={isExporting}
                onClick={() => handleExport("clients")}
              >
                Export Clients
              </Button>
              <Button
                icon={Download}
                variant="outline"
                loading={isExporting}
                onClick={() => handleExport("events")}
              >
                Export Events
              </Button>
              <Button
                icon={Download}
                variant="outline"
                loading={isExporting}
                onClick={() => handleExport("logs")}
              >
                Export Activity Logs
              </Button>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default Reports;

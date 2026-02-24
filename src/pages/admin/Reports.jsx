import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { format, subDays } from "date-fns";
import { dashboardService, exportService } from "../../services";
import { Button, Select, LoadingSpinner, StatCard } from "../../components/ui";
import toast from "react-hot-toast";

const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

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

const Reports = () => {
  const [days, setDays] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const params = useMemo(() => {
    const end = new Date();
    const start = subDays(end, Number(days));
    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }, [days]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await dashboardService.getAnalytics(params);
      setAnalytics(response.data);
    } catch {
      toast.error("Failed to load analytics");
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner text="Loading analytics..." />
      </div>
    );
  }

  const totalLeads =
    analytics?.statusDistribution?.reduce((acc, item) => acc + item.count, 0) ||
    0;
  const converted =
    analytics?.statusDistribution?.find((x) => x._id === "converted")?.count || 0;
  const conversionRate =
    totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Quick export and summary metrics
          </p>
        </div>
        <div className="w-52">
          <Select
            options={DATE_RANGE_OPTIONS}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Leads" value={totalLeads} />
        <StatCard title="Converted" value={converted} />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Export Data
        </h3>
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
      </div>
    </div>
  );
};

export default Reports;

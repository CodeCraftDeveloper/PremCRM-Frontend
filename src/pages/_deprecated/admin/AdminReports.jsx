import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks";
import { Header, LoadingSpinner } from "../../components";
import { getTickets } from "../../services/googleSheets";
import { calculateTicketStats, parseSheetOptions } from "../../utils/helpers";
import { STATUS_OPTIONS } from "../../constants";

export default function AdminReports() {
  const { adminKey, selectedSheet, setSelectedSheet } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const sheetOptions = useMemo(
    () => parseSheetOptions(import.meta.env.VITE_SHEET_OPTIONS ?? ""),
    [],
  );

  useEffect(() => {
    const loadTickets = async () => {
      if (!adminKey) return;

      setIsLoading(true);
      setError("");
      try {
        const data = await getTickets(selectedSheet, adminKey);
        setTickets(data);
      } catch (err) {
        setError(err.message);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [adminKey, selectedSheet]);

  const stats = useMemo(() => calculateTicketStats(tickets), [tickets]);

  // Calculate additional metrics
  const metrics = useMemo(() => {
    if (tickets.length === 0) return null;

    // Group by company
    const byCompany = {};
    tickets.forEach((t) => {
      const company = t.company || "Unknown";
      byCompany[company] = (byCompany[company] || 0) + 1;
    });
    const topCompanies = Object.entries(byCompany)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Group by requirement
    const byRequirement = {};
    tickets.forEach((t) => {
      if (t.requirements) {
        t.requirements.split(",").forEach((req) => {
          const trimmed = req.trim();
          if (trimmed) {
            byRequirement[trimmed] = (byRequirement[trimmed] || 0) + 1;
          }
        });
      }
    });
    const topRequirements = Object.entries(byRequirement)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Resolution rate
    const resolved = stats.RESOLVED + stats.CLOSED;
    const resolutionRate = ((resolved / stats.total) * 100).toFixed(1);

    return {
      topCompanies,
      topRequirements,
      resolutionRate,
      uniqueCompanies: Object.keys(byCompany).length,
    };
  }, [tickets, stats]);

  return (
    <div className="reports-page">
      <Header
        title="Analytics & Insights"
        userName="Administrator"
        userEmail=""
      >
        <select
          className="sheet-selector"
          value={selectedSheet}
          onChange={(e) => setSelectedSheet(e.target.value)}
        >
          {sheetOptions.map((sheet) => (
            <option key={sheet} value={sheet}>
              {sheet}
            </option>
          ))}
        </select>
      </Header>

      <div className="page-content">
        {isLoading ? (
          <LoadingSpinner text="Loading reports..." />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="report-section">
              <h3>Status Overview - {selectedSheet}</h3>
              <div className="stats-chart">
                {STATUS_OPTIONS.map((status) => {
                  const count = stats[status.value] || 0;
                  const percentage =
                    stats.total > 0
                      ? ((count / stats.total) * 100).toFixed(0)
                      : 0;
                  return (
                    <div key={status.value} className="chart-bar">
                      <div className="bar-label">
                        <span>{status.label}</span>
                        <span>
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className={`bar-fill bar-${status.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Metrics */}
            {metrics && (
              <>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-value">{stats.total}</span>
                    <span className="metric-label">Total Tickets</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">
                      {metrics.uniqueCompanies}
                    </span>
                    <span className="metric-label">Unique Companies</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">
                      {metrics.resolutionRate}%
                    </span>
                    <span className="metric-label">Resolution Rate</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-value">{stats.BLOCKED}</span>
                    <span className="metric-label">Blocked Items</span>
                  </div>
                </div>

                {/* Top Companies */}
                <div className="report-section">
                  <h3>Top Companies</h3>
                  <div className="list-report">
                    {metrics.topCompanies.map(([company, count], idx) => (
                      <div key={company} className="list-item">
                        <span className="rank">{idx + 1}</span>
                        <span className="name">{company}</span>
                        <span className="count">{count} tickets</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Requirements */}
                <div className="report-section">
                  <h3>Most Requested Products</h3>
                  <div className="list-report">
                    {metrics.topRequirements.map(([req, count], idx) => (
                      <div key={req} className="list-item">
                        <span className="rank">{idx + 1}</span>
                        <span className="name">{req}</span>
                        <span className="count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

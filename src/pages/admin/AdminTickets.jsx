import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Header,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from "../../components";
import { getTickets, updateTicketStatus } from "../../services/googleSheets";
import {
  filterAndSortTickets,
  formatDate,
  parseSheetOptions,
} from "../../utils/helpers";
import { STATUS_OPTIONS } from "../../constants";

export default function AdminTickets() {
  const [searchParams] = useSearchParams();
  const { adminKey, selectedSheet, setSelectedSheet } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "ALL",
  );
  const [sortBy, setSortBy] = useState("latest");
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [isUpdating, setIsUpdating] = useState("");
  const [rowEdits, setRowEdits] = useState({});
  const [lastLoadedAt, setLastLoadedAt] = useState("");

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setStatusFilter(searchParams.get("status") || "ALL");
  }, [searchParams]);

  const sheetOptions = useMemo(
    () => parseSheetOptions(import.meta.env.VITE_SHEET_OPTIONS ?? ""),
    [],
  );

  const loadTickets = async () => {
    if (!adminKey) return;

    setIsLoading(true);
    setError("");
    try {
      const data = await getTickets(selectedSheet, adminKey);
      setTickets(data);

      // Initialize row edits
      const edits = {};
      data.forEach((ticket) => {
        edits[ticket.ticketId] = {
          status: ticket.ticketStatus || "NEW",
          adminNote: "",
        };
      });
      setRowEdits(edits);
      setLastLoadedAt(new Date().toLocaleString());
    } catch (err) {
      setError(err.message);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, selectedSheet]);

  const filteredTickets = useMemo(
    () => filterAndSortTickets(tickets, searchTerm, statusFilter, sortBy),
    [tickets, searchTerm, statusFilter, sortBy],
  );

  const handleRowEdit = (ticketId, key, value) => {
    setRowEdits((prev) => ({
      ...prev,
      [ticketId]: { ...prev[ticketId], [key]: value },
    }));
  };

  const handleUpdateStatus = async (ticketId, overrideStatus = null) => {
    const edit = rowEdits[ticketId];
    if (!edit) return;

    const newStatus = overrideStatus || edit.status;
    setIsUpdating(ticketId);

    try {
      await updateTicketStatus(
        selectedSheet,
        ticketId,
        newStatus,
        edit.adminNote,
        adminKey,
      );
      await loadTickets();
    } catch (err) {
      alert(err.message || "Failed to update ticket.");
    } finally {
      setIsUpdating("");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTickets(filteredTickets.map((t) => t.ticketId));
    } else {
      setSelectedTickets([]);
    }
  };

  const handleSelectTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId],
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedTickets.length === 0) return;

    const newStatus =
      action === "convert"
        ? "CONVERTED"
        : action === "close"
          ? "CLOSED"
          : action;

    for (const ticketId of selectedTickets) {
      try {
        await updateTicketStatus(
          selectedSheet,
          ticketId,
          newStatus,
          "",
          adminKey,
        );
      } catch (err) {
        console.error(`Failed to update ${ticketId}:`, err);
      }
    }

    setSelectedTickets([]);
    await loadTickets();
  };

  return (
    <div className="tickets-page admin-tickets">
      <Header title="Lead Management" userName="Administrator" userEmail="">
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
        {/* Filters Bar */}
        <div className="filters-bar admin-filters">
          <div className="search-box">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by ID, company, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="latest">Latest First</option>
              <option value="status">By Status</option>
              <option value="company">By Company</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={loadTickets}
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTickets.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedTickets.length} selected</span>
            <button
              className="btn btn-small"
              onClick={() => handleBulkAction("convert")}
            >
              Mark Converted
            </button>
            <button
              className="btn btn-small"
              onClick={() => handleBulkAction("close")}
            >
              Mark Closed
            </button>
            <button
              className="btn btn-small secondary"
              onClick={() => setSelectedTickets([])}
            >
              Clear Selection
            </button>
          </div>
        )}

        {lastLoadedAt && (
          <div className="load-meta">Last loaded: {lastLoadedAt}</div>
        )}

        {/* Tickets Table */}
        <div className="tickets-table-container">
          {isLoading ? (
            <LoadingSpinner text="Loading tickets..." />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              title="No leads found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        selectedTickets.length === filteredTickets.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Query ID</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Entered By</th>
                  <th>Status</th>
                  <th>Admin Note</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.ticketId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.ticketId)}
                        onChange={() => handleSelectTicket(ticket.ticketId)}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/admin/tickets/${ticket.ticketId}`}
                        className="ticket-id-link"
                      >
                        {ticket.ticketId}
                      </Link>
                    </td>
                    <td>{ticket.company || "-"}</td>
                    <td>
                      <div className="contact-cell">
                        <span>{ticket.fullName || "-"}</span>
                        <span className="muted">{ticket.email || "-"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="entered-by-cell">
                        {ticket.enteredBy || "-"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          rowEdits[ticket.ticketId]?.status ||
                          ticket.ticketStatus
                        }
                      />
                      <select
                        className="status-select"
                        value={
                          rowEdits[ticket.ticketId]?.status ||
                          ticket.ticketStatus ||
                          "NEW"
                        }
                        onChange={(e) =>
                          handleRowEdit(
                            ticket.ticketId,
                            "status",
                            e.target.value,
                          )
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="note-input"
                        placeholder="Add note..."
                        value={rowEdits[ticket.ticketId]?.adminNote || ""}
                        onChange={(e) =>
                          handleRowEdit(
                            ticket.ticketId,
                            "adminNote",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="date-cell">
                      {formatDate(ticket.submittedAt)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-small"
                          onClick={() => handleUpdateStatus(ticket.ticketId)}
                          disabled={isUpdating === ticket.ticketId}
                        >
                          {isUpdating === ticket.ticketId ? "..." : "Save"}
                        </button>
                        <button
                          className="btn btn-small success"
                          onClick={() =>
                            handleUpdateStatus(ticket.ticketId, "CONVERTED")
                          }
                          disabled={isUpdating === ticket.ticketId}
                        >
                          Convert
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && !error && filteredTickets.length > 0 && (
          <div className="results-info">
            Showing {filteredTickets.length} of {tickets.length} leads
          </div>
        )}
      </div>
    </div>
  );
}

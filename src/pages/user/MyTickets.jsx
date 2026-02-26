import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks";
import {
  Header,
  TicketCard,
  LoadingSpinner,
  EmptyState,
} from "../../components";
import { getTicketsByEmail } from "../../services/googleSheets";
import { filterAndSortTickets } from "../../utils/helpers";
import { STATUS_OPTIONS } from "../../constants";
import { Link } from "react-router-dom";

export default function MyTickets() {
  const { userName, userEmail, selectedSheet } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("latest");

  const loadTickets = async () => {
    if (!userEmail) return;

    setIsLoading(true);
    setError("");
    try {
      const data = await getTicketsByEmail(selectedSheet, userEmail);
      setTickets(data);
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
  }, [userEmail, selectedSheet]);

  const filteredTickets = useMemo(
    () => filterAndSortTickets(tickets, searchTerm, statusFilter, sortBy),
    [tickets, searchTerm, statusFilter, sortBy],
  );

  return (
    <div className="tickets-page">
      <Header title="My Tickets" userName={userName} userEmail={userEmail}>
        <Link to="/new-ticket" className="btn btn-primary">
          + New Ticket
        </Link>
      </Header>

      <div className="page-content">
        {/* Filters */}
        <div className="filters-bar">
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
              placeholder="Search tickets..."
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
              <option value="priority">By Priority</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={loadTickets}
              disabled={isLoading}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="tickets-container">
          {isLoading ? (
            <LoadingSpinner text="Loading tickets..." />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              title={
                searchTerm || statusFilter !== "ALL"
                  ? "No matching tickets"
                  : "No tickets yet"
              }
              description={
                searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters."
                  : "Create your first ticket to get started."
              }
              action={
                !searchTerm &&
                statusFilter === "ALL" && (
                  <Link to="/new-ticket" className="btn btn-primary">
                    Create Ticket
                  </Link>
                )
              }
            />
          ) : (
            <div className="tickets-grid">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.ticketId}
                  ticket={ticket}
                  linkTo={`/tickets/${ticket.ticketId}`}
                  showCompany={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && !error && filteredTickets.length > 0 && (
          <div className="results-info">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        )}
      </div>
    </div>
  );
}

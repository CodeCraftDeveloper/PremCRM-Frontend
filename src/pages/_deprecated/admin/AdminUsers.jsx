import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks";
import { Header, LoadingSpinner, EmptyState } from "../../components";
import { getTickets } from "../../services/googleSheets";
import { getInitials, parseSheetOptions } from "../../utils/helpers";

export default function AdminUsers() {
  const { adminKey, selectedSheet, setSelectedSheet } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Extract unique users from tickets
  const users = useMemo(() => {
    const userMap = new Map();

    tickets.forEach((ticket) => {
      const email = ticket.email?.toLowerCase();
      if (!email) return;

      if (userMap.has(email)) {
        const existing = userMap.get(email);
        existing.ticketCount++;
        if (new Date(ticket.submittedAt) > new Date(existing.lastActivity)) {
          existing.lastActivity = ticket.submittedAt;
        }
      } else {
        userMap.set(email, {
          email,
          name: ticket.fullName || "Unknown",
          company: ticket.company || "-",
          phone: ticket.phone || "-",
          ticketCount: 1,
          lastActivity: ticket.submittedAt,
        });
      }
    });

    return Array.from(userMap.values());
  }, [tickets]);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.company.toLowerCase().includes(term),
    );
  }, [users, searchTerm]);

  return (
    <div className="users-page">
      <Header title="Users" userName="Administrator" userEmail="">
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
        {/* Stats */}
        <div className="users-stats">
          <div className="stat-box">
            <span className="stat-number">{users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{tickets.length}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
        </div>

        {/* Search */}
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <div className="users-container">
          {isLoading ? (
            <LoadingSpinner text="Loading users..." />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No users found"
              description={
                searchTerm
                  ? "Try a different search term."
                  : "No tickets have been created yet."
              }
            />
          ) : (
            <div className="users-grid">
              {filteredUsers.map((user) => (
                <Link
                  key={user.email}
                  to={`/admin/tickets?search=${encodeURIComponent(user.email)}`}
                  className="user-card-link"
                >
                  <div className="user-card">
                    <div className="user-avatar">{getInitials(user.name)}</div>
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p className="user-email">{user.email}</p>
                      <p className="user-company">{user.company}</p>
                    </div>
                    <div className="user-stats">
                      <span className="ticket-count">
                        {user.ticketCount} tickets
                      </span>
                      <span className="user-phone">{user.phone}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && !error && filteredUsers.length > 0 && (
          <div className="results-info">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
}

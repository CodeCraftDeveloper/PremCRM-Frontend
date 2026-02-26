import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks";
import {
  Header,
  StatCard,
  TicketCard,
  LoadingSpinner,
  EmptyState,
} from "../../components";
import { getTicketsByEmail } from "../../services/googleSheets";
import { calculateTicketStats } from "../../utils/helpers";

export default function UserDashboard() {
  const { userName, userEmail, selectedSheet } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    loadTickets();
  }, [userEmail, selectedSheet]);

  const stats = useMemo(() => calculateTicketStats(tickets), [tickets]);
  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  return (
    <div className="dashboard-page">
      <Header title="Dashboard" userName={userName} userEmail={userEmail} />

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2>Welcome back, {userName?.split(" ")[0] || "User"}!</h2>
          <p>Here's an overview of your tickets and activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard label="Total Tickets" value={stats.total} color="blue" />
          <StatCard label="Open" value={stats.OPEN} color="cyan" />
          <StatCard
            label="In Progress"
            value={stats.IN_PROGRESS}
            color="yellow"
          />
          <StatCard label="Resolved" value={stats.RESOLVED} color="green" />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-cards">
            <Link to="/new-ticket" className="action-card">
              <div className="action-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span>New Ticket</span>
            </Link>
            <Link to="/tickets" className="action-card">
              <div className="action-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
              </div>
              <span>View All Tickets</span>
            </Link>
            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span>Profile</span>
            </Link>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Recent Tickets</h3>
            <Link to="/tickets" className="view-all-link">
              View All →
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner text="Loading tickets..." />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : recentTickets.length === 0 ? (
            <EmptyState
              title="No tickets yet"
              description="Create your first ticket to get started."
              action={
                <Link to="/new-ticket" className="btn btn-primary">
                  Create Ticket
                </Link>
              }
            />
          ) : (
            <div className="tickets-grid">
              {recentTickets.map((ticket) => (
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
      </div>
    </div>
  );
}

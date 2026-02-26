import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks";
import {
  Header,
  StatusBadge,
  PriorityBadge,
  LoadingSpinner,
} from "../../components";
import { getTicketDetails, addComment } from "../../services/googleSheets";
import { formatDate } from "../../utils/helpers";

export default function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { userName, userEmail, selectedSheet } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getTicketDetails(selectedSheet, ticketId);
        setTicket(data);
      } catch (err) {
        setError(err.message || "Failed to load ticket details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId) {
      loadTicket();
    }
  }, [ticketId, selectedSheet]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(selectedSheet, ticketId, newComment, userName);
      setNewComment("");
      // Reload ticket to get updated comments
      const data = await getTicketDetails(selectedSheet, ticketId);
      setTicket(data);
    } catch (err) {
      alert(err.message || "Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ticket-detail-page">
        <Header
          title="Ticket Details"
          userName={userName}
          userEmail={userEmail}
        />
        <div className="page-content">
          <LoadingSpinner text="Loading ticket..." />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="ticket-detail-page">
        <Header
          title="Ticket Details"
          userName={userName}
          userEmail={userEmail}
        />
        <div className="page-content">
          <div className="error-state">
            <h2>Ticket Not Found</h2>
            <p>{error || "The requested ticket could not be found."}</p>
            <Link to="/tickets" className="btn btn-primary">
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-page">
      <Header title="Ticket Details" userName={userName} userEmail={userEmail}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </Header>

      <div className="page-content">
        <div className="ticket-detail-container">
          {/* Main Info */}
          <div className="ticket-main">
            <div className="ticket-header">
              <div className="ticket-id-large">{ticket.ticketId}</div>
              <div className="ticket-badges">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.ticketStatus} />
              </div>
            </div>

            <h1 className="ticket-summary">
              {ticket.autoSummary || "No summary"}
            </h1>

            <div className="ticket-meta">
              <span>Created {formatDate(ticket.submittedAt)}</span>
              {ticket.company && <span>• {ticket.company}</span>}
            </div>

            {/* Requirements */}
            <div className="ticket-section">
              <h3>Requirements</h3>
              <div className="requirements-list">
                {ticket.requirements ? (
                  ticket.requirements.split(",").map((req, idx) => (
                    <span key={idx} className="requirement-tag">
                      {req.trim()}
                    </span>
                  ))
                ) : (
                  <span className="no-data">No requirements specified</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {ticket.notes && (
              <div className="ticket-section">
                <h3>Additional Notes</h3>
                <p className="ticket-notes">{ticket.notes}</p>
              </div>
            )}

            {/* Comments Section */}
            <div className="ticket-section">
              <h3>Comments</h3>
              <div className="comments-list">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((comment, idx) => (
                    <div key={idx} className="comment-item">
                      <div className="comment-header">
                        <strong>{comment.author}</strong>
                        <span>{formatDate(comment.timestamp)}</span>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-comments">No comments yet</p>
                )}
              </div>

              <form className="comment-form" onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingComment || !newComment.trim()}
                >
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="ticket-sidebar">
            <div className="sidebar-card">
              <h4>Contact Information</h4>
              <div className="info-row">
                <span className="label">Name</span>
                <span className="value">{ticket.fullName || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label">Email</span>
                <span className="value">{ticket.email || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone</span>
                <span className="value">{ticket.phone || "-"}</span>
              </div>
              <div className="info-row">
                <span className="label">Address</span>
                <span className="value">{ticket.address || "-"}</span>
              </div>
              {ticket.website && (
                <div className="info-row">
                  <span className="label">Website</span>
                  <a
                    href={ticket.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ticket.website}
                  </a>
                </div>
              )}
            </div>

            <div className="sidebar-card">
              <h4>Ticket Info</h4>
              <div className="info-row">
                <span className="label">Type</span>
                <span className="value">{ticket.ticketType || "General"}</span>
              </div>
              <div className="info-row">
                <span className="label">Attendees</span>
                <span className="value">{ticket.attendees || "1"}</span>
              </div>
              {ticket.adminNote && (
                <div className="info-row">
                  <span className="label">Admin Note</span>
                  <span className="value">{ticket.adminNote}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

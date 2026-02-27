import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks";
import { Header, StatusBadge, LoadingSpinner } from "../../components";
import {
  getTicketDetails,
  updateTicketStatus,
  addComment,
} from "../../services/googleSheets";
import { formatDate } from "../../utils/helpers";
import {
  STATUS_OPTIONS,
  MARKETING_REVIEWERS,
  QUICK_REPLY_TEMPLATES,
} from "../../constants";

export default function AdminTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { adminKey, selectedSheet } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getReviewerValue = (data) =>
    data?.reviewer || data?.assignedReviewer || data?.assigned_reviewer || "";

  const applyQuickReply = (reply) => {
    setAdminNote((prev) =>
      prev?.trim() ? `${prev.trim()} | ${reply}` : reply,
    );
  };

  const visibleReplies = showAllReplies
    ? QUICK_REPLY_TEMPLATES
    : QUICK_REPLY_TEMPLATES.slice(0, 4);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getTicketDetails(selectedSheet, ticketId, adminKey);
        setTicket(data);
        setNewStatus(data?.ticketStatus || "NEW");
        setReviewer(getReviewerValue(data));
      } catch (err) {
        setError(err.message || "Failed to load ticket details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId && adminKey) {
      loadTicket();
    }
  }, [ticketId, selectedSheet, adminKey]);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      await updateTicketStatus(
        selectedSheet,
        ticketId,
        newStatus,
        adminNote,
        adminKey,
        reviewer,
        reviewer, // updatedBy - person who made the update
      );
      // Reload ticket
      const data = await getTicketDetails(selectedSheet, ticketId, adminKey);
      setTicket(data);
      setReviewer(getReviewerValue(data));
      setAdminNote("");
    } catch (err) {
      alert(err.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(selectedSheet, ticketId, newComment, "Admin", adminKey);
      setNewComment("");
      // Reload ticket
      const data = await getTicketDetails(selectedSheet, ticketId, adminKey);
      setTicket(data);
    } catch (err) {
      alert(err.message || "Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ticket-detail-page admin-detail">
        <Header title="Lead Details" userName="Administrator" userEmail="" />
        <div className="page-content">
          <LoadingSpinner text="Loading lead..." />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="ticket-detail-page admin-detail">
        <Header title="Lead Details" userName="Administrator" userEmail="" />
        <div className="page-content">
          <div className="error-state">
            <h2>Lead Not Found</h2>
            <p>{error || "The requested lead could not be found."}</p>
            <Link to="/admin/tickets" className="btn btn-primary">
              Back to Leads
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-page admin-detail">
      <Header title="Lead Details" userName="Administrator" userEmail="">
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
                <StatusBadge status={ticket.ticketStatus} />
              </div>
            </div>

            <h1 className="ticket-summary">
              {ticket.autoSummary ||
                "Inquiry from " + (ticket.company || ticket.fullName)}
            </h1>

            <div className="ticket-meta">
              <span>Received {formatDate(ticket.submittedAt)}</span>
              {ticket.company && <span>• {ticket.company}</span>}
              {ticket.source && (
                <span className="source-tag">via {ticket.source}</span>
              )}
            </div>

            <div className="ticket-section">
              <h3>Lead Snapshot</h3>
              <div className="snapshot-grid">
                <div className="snapshot-item">
                  <span className="snapshot-label">Company</span>
                  <span className="snapshot-value">
                    {ticket.company || "-"}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Contact</span>
                  <span className="snapshot-value">
                    {ticket.fullName || "-"}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Email</span>
                  {ticket.email ? (
                    <a
                      href={`mailto:${ticket.email}`}
                      className="snapshot-value value-link"
                    >
                      {ticket.email}
                    </a>
                  ) : (
                    <span className="snapshot-value">-</span>
                  )}
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Phone</span>
                  {ticket.phone ? (
                    <a
                      href={`tel:${ticket.phone}`}
                      className="snapshot-value value-link"
                    >
                      {ticket.phone}
                    </a>
                  ) : (
                    <span className="snapshot-value">-</span>
                  )}
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Website</span>
                  {ticket.website ? (
                    <a
                      href={ticket.website}
                      className="snapshot-value value-link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open site
                    </a>
                  ) : (
                    <span className="snapshot-value">-</span>
                  )}
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Location</span>
                  <span className="snapshot-value">
                    {[ticket.city, ticket.country].filter(Boolean).join(", ") ||
                      ticket.address ||
                      "-"}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Source</span>
                  <span className="snapshot-value">
                    {ticket.source || "Direct"}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Assigned Reviewer</span>
                  <span className="snapshot-value">
                    {getReviewerValue(ticket) || reviewer || "-"}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Entered By</span>
                  <span className="snapshot-value">
                    {ticket.enteredBy || "-"}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Last Updated</span>
                  <span className="snapshot-value">
                    {ticket.updatedAt ? formatDate(ticket.updatedAt) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Requirements */}
            <div className="ticket-section">
              <h3>Product Interest</h3>
              <div className="requirements-list">
                {ticket.requirements ? (
                  ticket.requirements.split(",").map((req, idx) => (
                    <span key={idx} className="requirement-tag">
                      {req.trim()}
                    </span>
                  ))
                ) : (
                  <span className="no-data">
                    No specific products mentioned
                  </span>
                )}
              </div>
            </div>

            {/* Expected Volume */}
            {ticket.expectedVolume && (
              <div className="ticket-section">
                <h3>Expected Volume</h3>
                <p className="volume-info">{ticket.expectedVolume}</p>
              </div>
            )}

            {/* Notes/Message */}
            {ticket.notes && (
              <div className="ticket-section">
                <h3>Message from Customer</h3>
                <div className="customer-message">
                  <p>{ticket.notes}</p>
                </div>
              </div>
            )}

            {/* Admin Response Section */}
            <div className="ticket-section response-section">
              <h3>Admin Response / Follow-up Notes</h3>
              <div className="comments-list">
                {Array.isArray(ticket.comments) &&
                ticket.comments.length > 0 ? (
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
                  <p className="no-comments">No follow-up notes added yet</p>
                )}
              </div>

              <form className="comment-form" onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add follow-up notes, response details, or action taken..."
                  rows="4"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingComment || !newComment.trim()}
                >
                  {isSubmittingComment ? "Saving..." : "Add Note"}
                </button>
              </form>
            </div>
          </div>

          {/* Admin Sidebar */}
          <div className="ticket-sidebar admin-sidebar">
            {/* Quick Actions */}
            <div className="sidebar-card quick-actions-card">
              <h4>Quick Actions</h4>
              <div className="quick-action-buttons">
                <a
                  href={`mailto:${ticket.email}`}
                  className="btn btn-primary btn-block"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Send Email
                </a>
                <a
                  href={`tel:${ticket.phone}`}
                  className="btn btn-secondary btn-block"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Call Now
                </a>
              </div>
            </div>

            {/* Status Update */}
            <div className="sidebar-card">
              <h4>Update Status</h4>
              <div className="status-form">
                <label>
                  Current Status
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Marketing Reviewer
                  <select
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                  >
                    <option value="">Select reviewer</option>
                    {MARKETING_REVIEWERS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Update Note
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows="3"
                    placeholder="e.g., Discussed pricing, awaiting PO"
                  />
                </label>
                <div className="quick-reply-header">
                  <span>Quick Replies</span>
                  <button
                    type="button"
                    className="toggle-replies-btn"
                    onClick={() => setShowAllReplies((prev) => !prev)}
                  >
                    {showAllReplies ? "Show less" : "Show more"}
                  </button>
                </div>
                <div className="quick-reply-list">
                  {visibleReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      className="quick-reply-chip"
                      onClick={() => applyQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>

            {/* Current Status Details */}
            <div className="sidebar-card status-details-card">
              <h4>Current Status Details</h4>
              <div className="status-detail-row">
                <span className="status-label">Status</span>
                <StatusBadge status={ticket.ticketStatus} />
              </div>
              {ticket.updatedBy && (
                <div className="status-detail-row">
                  <span className="status-label">Updated By</span>
                  <span className="reviewer-name">{ticket.updatedBy}</span>
                </div>
              )}
              {getReviewerValue(ticket) && (
                <div className="status-detail-row">
                  <span className="status-label">Assigned To</span>
                  <span className="reviewer-name">
                    {getReviewerValue(ticket)}
                  </span>
                </div>
              )}
              {ticket.adminNote && (
                <div className="status-detail-row full-width">
                  <span className="status-label">Last Note</span>
                  <p className="admin-note-text">{ticket.adminNote}</p>
                </div>
              )}
              {ticket.updatedAt && (
                <div className="status-detail-row">
                  <span className="status-label">Last Updated</span>
                  <span className="update-time">
                    {formatDate(ticket.updatedAt)}
                  </span>
                </div>
              )}
              {!ticket.adminNote && !ticket.reviewer && !ticket.updatedBy && (
                <p className="no-updates-text">No status updates yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

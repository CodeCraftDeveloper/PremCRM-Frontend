import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import { formatRelativeTime, truncateText } from "../utils/helpers";

export default function TicketCard({ ticket, linkTo, showCompany = true }) {
  return (
    <Link to={linkTo} className="ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-id">{ticket.ticketId}</span>
        <div className="ticket-badges">
          <StatusBadge status={ticket.ticketStatus} />
        </div>
      </div>
      <div className="ticket-card-body">
        <h3 className="ticket-title">
          {truncateText(ticket.autoSummary, 80) || "No summary"}
        </h3>
        {showCompany && (
          <p className="ticket-company">{ticket.company || "No company"}</p>
        )}
        <p className="ticket-requirements">
          {truncateText(ticket.requirements, 60) || "No requirements"}
        </p>
      </div>
      <div className="ticket-card-footer">
        <span className="ticket-contact">{ticket.fullName}</span>
        <span className="ticket-date">
          {formatRelativeTime(ticket.submittedAt)}
        </span>
      </div>
    </Link>
  );
}

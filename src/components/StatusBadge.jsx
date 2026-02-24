import { getStatusColor } from "../utils/helpers";

const STATUS_LABELS = {
  NEW: "New",
  IN_REVIEW: "In Review",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  FOLLOW_UP: "Follow Up",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

export default function StatusBadge({ status }) {
  const displayStatus =
    STATUS_LABELS[status] || status?.replace("_", " ") || "New";
  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {displayStatus}
    </span>
  );
}

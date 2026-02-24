import { DEFAULT_SHEET_OPTIONS } from "../constants";

// Parse sheet options from environment variable
export const parseSheetOptions = (rawValue) => {
  if (!rawValue) return DEFAULT_SHEET_OPTIONS;
  const parsed = rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_SHEET_OPTIONS;
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format relative time
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// Get status color class
export const getStatusColor = (status) => {
  const colors = {
    NEW: "status-new",
    IN_REVIEW: "status-in_review",
    CONTACTED: "status-contacted",
    QUALIFIED: "status-qualified",
    FOLLOW_UP: "status-follow_up",
    CONVERTED: "status-converted",
    CLOSED: "status-closed",
  };
  return colors[status] || "status-new";
};

// Get priority color class
export const getPriorityColor = (priority) => {
  const colors = {
    LOW: "priority-low",
    MEDIUM: "priority-medium",
    HIGH: "priority-high",
    CRITICAL: "priority-critical",
  };
  return colors[priority] || "priority-medium";
};

// Calculate ticket stats from array
export const calculateTicketStats = (tickets) => {
  const stats = {
    total: tickets.length,
    NEW: 0,
    IN_REVIEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    FOLLOW_UP: 0,
    CONVERTED: 0,
    CLOSED: 0,
  };

  tickets.forEach((ticket) => {
    const status = ticket.ticketStatus || "NEW";
    if (Object.prototype.hasOwnProperty.call(stats, status)) {
      stats[status]++;
    }
  });

  return stats;
};

// Filter and sort tickets
export const filterAndSortTickets = (
  tickets,
  searchTerm,
  statusFilter,
  sortBy,
) => {
  let filtered = [...tickets];
  const term = searchTerm.trim().toLowerCase();

  // Apply search filter
  if (term) {
    filtered = filtered.filter((ticket) => {
      const haystack = [
        ticket.ticketId,
        ticket.company,
        ticket.fullName,
        ticket.email,
        ticket.phone,
        ticket.ticketStatus,
        ticket.autoSummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  // Apply status filter
  if (statusFilter !== "ALL") {
    filtered = filtered.filter(
      (ticket) => (ticket.ticketStatus || "NEW") === statusFilter,
    );
  }

  // Apply sorting
  if (sortBy === "status") {
    filtered.sort((a, b) =>
      (a.ticketStatus || "").localeCompare(b.ticketStatus || ""),
    );
  } else if (sortBy === "company") {
    filtered.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
  } else {
    // Latest first (default)
    filtered.reverse();
  }

  return filtered;
};

// Generate initials from name
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

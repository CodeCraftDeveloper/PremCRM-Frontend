const Badge = ({
  children,
  variant = "default", // default, success, warning, danger, info, secondary
  size = "md", // sm, md, lg
  className = "",
}) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400",
    secondary:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

// Status specific badges
export const StatusBadge = ({ status }) => {
  const statusConfig = {
    // Follow-up statuses
    new: { label: "New", variant: "info" },
    contacted: { label: "Contacted", variant: "secondary" },
    interested: { label: "Interested", variant: "warning" },
    negotiation: { label: "Negotiation", variant: "secondary" },
    converted: { label: "Converted", variant: "success" },
    lost: { label: "Lost", variant: "danger" },
    // Event statuses
    upcoming: { label: "Upcoming", variant: "info" },
    active: { label: "Active", variant: "success" },
    inactive: { label: "Inactive", variant: "default" },
    completed: { label: "Completed", variant: "default" },
    cancelled: { label: "Cancelled", variant: "danger" },
  };

  const config = statusConfig[status] || { label: status, variant: "default" };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: { label: "Low", variant: "default" },
    medium: { label: "Medium", variant: "warning" },
    high: { label: "High", variant: "danger" },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    variant: "default",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default Badge;

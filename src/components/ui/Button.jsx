import { Loader2 } from "lucide-react";

const Button = ({
  children,
  type = "button",
  variant = "primary", // primary, secondary, danger, ghost, outline
  size = "md", // sm, md, lg
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  onClick,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 focus:ring-cyan-500/20",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500/20 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 focus:ring-red-500/20",
    ghost:
      "text-slate-700 hover:bg-slate-100 focus:ring-slate-500/20 dark:text-slate-200 dark:hover:bg-slate-700",
    outline:
      "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-500/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${iconSizes[size]}`} />
      ) : (
        Icon && iconPosition === "left" && <Icon className={iconSizes[size]} />
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        <Icon className={iconSizes[size]} />
      )}
    </button>
  );
};

export default Button;

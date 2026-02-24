import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = "neutral", // increase, decrease, neutral
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
  onClick,
}) => {
  const getTrendIcon = () => {
    if (changeType === "increase") {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (changeType === "decrease") {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (changeType === "increase") return "text-green-600";
    if (changeType === "decrease") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-6 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800 ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-blue-300" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-1 sm:mt-2 flex items-center gap-1">
              {getTrendIcon()}
              <span
                className={`text-xs sm:text-sm font-medium ${getTrendColor()}`}
              >
                {change}%
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                vs last month
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 sm:p-3 ${iconBgColor} shrink-0`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

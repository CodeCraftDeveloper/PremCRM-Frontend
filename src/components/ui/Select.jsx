import { forwardRef } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

const Select = forwardRef(
  (
    {
      label,
      options = [],
      error,
      helperText,
      placeholder = "Select an option",
      className = "",
      required = false,
      ...props
    },
    ref,
  ) => {
    const selectClasses = `
      w-full appearance-none rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
      dark:bg-gray-800 dark:text-white dark:border-gray-600
      ${
        error
          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
          : "border-gray-300 dark:border-gray-600"
      }
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select ref={ref} className={selectClasses} {...props}>
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;

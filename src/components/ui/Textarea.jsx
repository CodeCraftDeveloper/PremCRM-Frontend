import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      rows = 4,
      className = "",
      required = false,
      ...props
    },
    ref,
  ) => {
    const textareaClasses = `
      w-full rounded-lg border px-4 py-2.5 text-sm transition-colors resize-none
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
        <textarea
          ref={ref}
          rows={rows}
          className={textareaClasses}
          {...props}
        />
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

Textarea.displayName = "Textarea";

export default Textarea;

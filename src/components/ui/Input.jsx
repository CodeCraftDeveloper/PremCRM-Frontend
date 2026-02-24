import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

const Input = forwardRef(
  (
    {
      label,
      type = "text",
      error,
      helperText,
      icon: Icon,
      iconPosition = "left",
      className = "",
      labelClassName = "",
      required = false,
      ...props
    },
    ref,
  ) => {
    const inputClasses = `
      w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500
      disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
      dark:bg-slate-800 dark:text-white dark:border-slate-600
      ${
        error
          ? "border-red-500 focus:ring-red-500/15 focus:border-red-500"
          : "border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
      }
      ${Icon && iconPosition === "left" ? "pl-10" : ""}
      ${Icon && iconPosition === "right" ? "pr-10" : ""}
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label
            className={`mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200 ${labelClassName}`}
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && iconPosition === "left" && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <input ref={ref} type={type} className={inputClasses} {...props} />
          {Icon && iconPosition === "right" && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
          )}
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

Input.displayName = "Input";

export default Input;

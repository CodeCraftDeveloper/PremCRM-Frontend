import { Search, X } from "lucide-react";
import { useState } from "react";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  className = "",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange({ target: { value: "" } });
    onClear?.();
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className={`absolute left-3 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
          isFocused ? "text-blue-500" : "text-gray-400"
        }`}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 sm:py-2.5 pl-9 sm:pl-10 pr-9 sm:pr-10 text-xs sm:text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

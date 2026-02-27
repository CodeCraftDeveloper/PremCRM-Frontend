/**
 * Reusable skeleton primitives for loading states.
 * Uses Tailwind's built-in `animate-pulse` for the shimmer effect.
 */

/** Generic pulsing bar skeleton */
export const SkeletonLine = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
  />
);

/** Card-shaped skeleton with optional line count */
export const SkeletonCard = ({ lines = 3 }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <SkeletonLine className="mb-3 h-4 w-1/3" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine
        key={i}
        className={`mb-2 h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
      />
    ))}
  </div>
);

/** Stat card skeleton (icon circle + number + label) */
export const SkeletonStatCard = () => (
  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    <div className="flex-1">
      <SkeletonLine className="mb-2 h-6 w-16" />
      <SkeletonLine className="h-3 w-24" />
    </div>
  </div>
);

/** Dashboard skeleton: stat row + chart placeholders */
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stat cards row */}
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    {/* Chart placeholders */}
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <SkeletonLine className="mb-4 h-5 w-32" />
        <SkeletonLine className="h-48 w-full rounded-lg" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <SkeletonLine className="mb-4 h-5 w-32" />
        <SkeletonLine className="h-48 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

/** Table/list skeleton: header bar + N rows */
export const ListSkeleton = ({ rows = 6 }) => (
  <div className="space-y-4">
    {/* Search/filter bar */}
    <div className="flex gap-3">
      <SkeletonLine className="h-10 flex-1 rounded-lg" />
      <SkeletonLine className="h-10 w-28 rounded-lg" />
      <SkeletonLine className="h-10 w-28 rounded-lg" />
    </div>
    {/* Rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <SkeletonLine className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-1/3" />
            <SkeletonLine className="h-3 w-1/2" />
          </div>
          <SkeletonLine className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  </div>
);

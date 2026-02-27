import { format } from "date-fns";
import { Button, EmptyState, Select } from "../ui";
import {
  ClipboardList,
  Plus,
  Phone,
  Video,
  CheckSquare,
  Mail,
  Calendar,
  Check,
  Clock,
} from "lucide-react";

const TYPE_CONFIG = {
  task: { icon: CheckSquare, color: "bg-blue-500", label: "Task" },
  call: { icon: Phone, color: "bg-green-500", label: "Call" },
  meeting: { icon: Video, color: "bg-violet-500", label: "Meeting" },
  email: { icon: Mail, color: "bg-amber-500", label: "Email" },
};

const ActivityTimeline = ({
  activities,
  onCreate,
  isLoading,
  newActivity,
  setNewActivity,
  onToggleStatus,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity Timeline
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {activities.length} activities
        </span>
      </div>

      {/* Inline Add Form */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          placeholder="Subject"
          value={newActivity.subject}
          onChange={(e) =>
            setNewActivity((prev) => ({ ...prev, subject: e.target.value }))
          }
        />
        <Select
          value={newActivity.type}
          onChange={(e) =>
            setNewActivity((prev) => ({ ...prev, type: e.target.value }))
          }
          options={[
            { value: "task", label: "Task" },
            { value: "call", label: "Call" },
            { value: "meeting", label: "Meeting" },
            { value: "email", label: "Email" },
          ]}
        />
        <Select
          value={newActivity.status}
          onChange={(e) =>
            setNewActivity((prev) => ({ ...prev, status: e.target.value }))
          }
          options={[
            { value: "planned", label: "Pending" },
            { value: "completed", label: "Completed" },
          ]}
        />
        <Button onClick={onCreate} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No activities yet"
          description="Add tasks, calls, and meetings to track progress."
        />
      ) : (
        <div className="relative ml-4 space-y-0 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
          {activities.map((activity) => {
            const typeConfig = TYPE_CONFIG[activity.type] || TYPE_CONFIG.task;
            const TypeIcon = typeConfig.icon;
            const isCompleted = activity.status === "completed";

            return (
              <div key={activity._id} className="relative pb-6 last:pb-0">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-7.75 flex h-5 w-5 items-center justify-center rounded-full ${
                    isCompleted ? "bg-emerald-500" : typeConfig.color
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <TypeIcon className="h-3 w-3 text-white" />
                  )}
                </div>

                {/* Activity Card */}
                <div
                  className={`rounded-lg border p-3 transition-colors ${
                    isCompleted
                      ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                      : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "text-gray-400 line-through dark:text-gray-500"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {activity.subject}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${typeConfig.color} text-white`}
                        >
                          {typeConfig.label}
                        </span>
                        {activity.dueDate && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(activity.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Toggle */}
                      {onToggleStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(activity)}
                          className={`rounded p-1 transition-colors ${
                            isCompleted
                              ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                              : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={
                            isCompleted
                              ? "Mark as pending"
                              : "Mark as completed"
                          }
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.createdAt
                          ? format(
                              new Date(activity.createdAt),
                              "MMM d, h:mm a",
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;

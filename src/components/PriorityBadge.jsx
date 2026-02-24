import { getPriorityColor } from "../utils/helpers";

export default function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge ${getPriorityColor(priority)}`}>
      {priority || "MEDIUM"}
    </span>
  );
}

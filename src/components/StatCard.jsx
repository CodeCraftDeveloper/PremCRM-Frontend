export default function StatCard({ label, value, color = "blue", icon }) {
  return (
    <div className={`stat-card stat-${color}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  );
}

export default function LoadingSpinner({
  size = "medium",
  text = "Loading...",
}) {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner"></div>
      {text && <span>{text}</span>}
    </div>
  );
}

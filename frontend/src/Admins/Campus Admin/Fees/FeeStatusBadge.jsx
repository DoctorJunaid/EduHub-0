export default function FeeStatusBadge({ status }) {
  const norm = String(status || "Pending").trim();
  const title =
    norm.toLowerCase() === "partially_paid" || norm.toLowerCase() === "partially paid"
      ? "Partially Paid"
      : norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase();

  const getPillClass = () => {
    switch (title) {
      case "Paid":
        return "is-active";
      case "Pending":
        return "is-pending";
      case "Overdue":
        return "is-danger";
      default:
        return "is-pending";
    }
  };

  const getCustomStyle = () => {
    if (title === "Partially Paid") {
      return { background: "#2563eb", color: "#ffffff" };
    }
    if (title === "Waived") {
      return { background: "#7c3aed", color: "#ffffff" };
    }
    if (title === "Cancelled") {
      return { background: "#71717a", color: "#ffffff" };
    }
    return undefined;
  };

  return (
    <span className={`campus-status-pill ${getPillClass()}`} style={getCustomStyle()}>
      <span className="dot" />
      {title}
    </span>
  );
}

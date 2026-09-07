import './Progress.css';
export default function Progress({ value, label, className = '' }) {
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return <progress className={`shared-progress ${className}`} value={percent} max={100} aria-label={label}>{percent.toFixed(1)}%</progress>;
}

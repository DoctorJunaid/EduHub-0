import './charts.css';
const colors = ['var(--primary)', 'var(--color-success)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-danger)', 'var(--muted-foreground)'];
export default function DonutChart({ data, label, unit = 'Results' }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <p className="chart-empty">No recorded categories to chart.</p>;
  return <div className="donut-chart"><svg viewBox="0 0 180 180" role="img" aria-label={label}>
    {data.map((item, index) => {
      const length = item.value / total * 100;
      const start = data.slice(0, index).reduce((sum, entry) => sum + entry.value, 0) / total * 100;
      return <circle key={item.label} cx="90" cy="90" r="64" fill="none" stroke={colors[index % colors.length]} strokeWidth="25" pathLength="100" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 90 90)"><title>{`${item.label}: ${item.value} (${length.toFixed(1)}%)`}</title></circle>;
    })}<text x="90" y="87" textAnchor="middle" className="donut-total">{total}</text><text x="90" y="108" textAnchor="middle">{unit}</text>
  </svg><ul>{data.map((item, index) => <li key={item.label}><i style={{ background: colors[index % colors.length] }} /><span>{item.label}</span><span>{(item.value / total * 100).toFixed(1)}% <small>({item.value})</small></span></li>)}</ul></div>;
}

import { useId } from 'react';
import './charts.css';

export default function LineChart({ points, label }) {
  const id = useId();
  if (!points.length) return <p className="chart-empty">No recorded values to chart.</p>;
  const width = Math.max(600, points.length * 115), height = 190, left = 36, bottom = 150;
  const max = Math.max(1, ...points.map((point) => point.value));
  const rounded = Math.ceil(max * 2) / 2;
  const ceiling = Number.isFinite(rounded) ? rounded : max;
  const coords = points.map((point, i) => ({ ...point, x: points.length === 1 ? width / 2 : left + i * (width - left - 20) / (points.length - 1), y: bottom - point.value / ceiling * 125 }));
  const path = coords.map((point) => `${point.x},${point.y}`).join(' ');
  return <div className="chart-scroll"><svg className="line-chart" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} role="img" aria-label={label}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity=".2" /><stop offset="100%" stopColor="var(--primary)" stopOpacity=".02" /></linearGradient></defs>
    {Array.from({ length: 5 }, (_, i) => <g key={i}><line x1={left} x2={width - 10} y1={bottom - i * 31.25} y2={bottom - i * 31.25} stroke="var(--border)" /><text x={left - 8} y={bottom - i * 31.25 + 3} textAnchor="end">{(ceiling * i / 4).toFixed(1)}</text></g>)}
    <polygon points={`${coords[0].x},${bottom} ${path} ${coords.at(-1).x},${bottom}`} fill={`url(#${id})`} />
    <polyline points={path} fill="none" stroke="var(--primary)" strokeWidth="2" />
    {coords.map((point) => <g key={point.label}><circle cx={point.x} cy={point.y} r="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="2"><title>{`${point.label}: ${point.value.toFixed(2)}`}</title></circle><text x={point.x} y={174} textAnchor={point === coords[0] ? 'start' : point === coords.at(-1) ? 'end' : 'middle'}>{point.label}</text></g>)}
  </svg><ul className="sr-only">{points.map((point) => <li key={point.label}>{point.label}: {point.value.toFixed(2)}</li>)}</ul></div>;
}

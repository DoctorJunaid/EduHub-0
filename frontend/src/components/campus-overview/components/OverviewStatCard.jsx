import { ArrowUp, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function OverviewStatCard({ icon: Icon, value, label, change, period, trend, showTrend = true }) {
  return (
    <Card className="overview-stat overview-card">
      <div className="overview-stat-top">
        <span className="overview-icon-tile"><Icon size={23} aria-hidden="true" /></span>
        <Button className="overview-icon-button" variant="ghost" disabled aria-label={`${label} options`}><MoreVertical size={19} /></Button>
      </div>
      <strong className="overview-stat-value">{value}</strong>
      <span className="overview-stat-label">{label}</span>
      <div className="overview-stat-bottom">
        <p><span><ArrowUp size={12} /> {change}</span> vs last {period}</p>
        {showTrend && <svg className="overview-sparkline" viewBox="0 0 100 40" aria-hidden="true">
          <polyline points={trend} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </div>
    </Card>
  );
}

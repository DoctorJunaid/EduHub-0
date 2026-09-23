import { ArrowUp, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

export default function OverviewStatCard({ icon: Icon, value, label, change, period }) {
  return (
    <Card className="overview-stat overview-card">
      <div className="overview-stat-header">
        <span className="overview-icon-tile"><Icon size={20} aria-hidden="true" /></span>
        <div className="overview-stat-title-wrap">
          <span className="overview-stat-label">{label}</span>
        </div>
        <Button className="overview-icon-button" variant="ghost" disabled aria-label={`${label} options`}><MoreVertical size={16} /></Button>
      </div>

      <div className="overview-stat-main">
        <strong className="overview-stat-value">{value}</strong>
      </div>

      <div className="overview-stat-footer">
        <div className="overview-stat-trend">
          <span className="trend-positive"><ArrowUp size={12} /> {change}</span> vs last {period}
        </div>
      </div>
    </Card>
  );
}

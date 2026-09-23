import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

export default function OverviewPanel({ title, description, icon: Icon, action, children, className = '' }) {
  return (
    <Card className={`overview-card overview-panel ${className}`}>
      <div className="overview-panel-heading">
        <div className="overview-panel-title"><Icon size={20} aria-hidden="true" /><h2>{title}</h2></div>
        <Button className="overview-text-button" variant="ghost" disabled>{action}<ArrowRight size={13} /></Button>
        <p>{description}</p>
      </div>
      {children}
    </Card>
  );
}

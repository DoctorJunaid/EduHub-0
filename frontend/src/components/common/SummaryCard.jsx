import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
export default function SummaryCard({ icon: Icon, value, label, className = '' }) {
  return <Card className={`summary-card ${className}`}><span className="summary-icon"><Icon size={21} /></span><div><strong>{value}</strong><span>{label}</span></div><ChevronRight size={17} aria-hidden="true" /></Card>;
}

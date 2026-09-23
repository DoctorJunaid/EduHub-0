import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function Pagination({ total, page, pageSize, onPage, onPageSize, label = 'records' }) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, count);
  return <nav className="tt-pagination" aria-label={`${label} pagination`}>
    <span role="status">Showing {Math.min(pageSize, Math.max(0, total - (current - 1) * pageSize))} of {total} {label}</span>
    <Button variant="outline" disabled={current === 1} aria-label="Previous page" onClick={() => onPage(current - 1)}><ChevronLeft size={15} /></Button>
    {Array.from({ length: Math.min(3, count) }, (_, i) => Math.max(1, Math.min(current - 1, count - 2)) + i).map((number) => <Button key={number} variant="outline" aria-current={number === current ? 'page' : undefined} onClick={() => onPage(number)}>{number}</Button>)}
    <Button variant="outline" disabled={current === count} aria-label="Next page" onClick={() => onPage(current + 1)}><ChevronRight size={15} /></Button>
    <select aria-label={`${label} per page`} value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>{[10, 25, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}</select>
  </nav>;
}

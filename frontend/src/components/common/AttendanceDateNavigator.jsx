import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import DatePicker from './DatePicker';
import { dateKey, parseDate } from '@/lib/dates';
import { shiftDays } from '@/lib/schedule';
import './AttendanceDateNavigator.css';

export default function AttendanceDateNavigator({ date, onChange, markedDates }) {
  return <div className="attendance-date-controls"><div><DatePicker value={date} onChange={onChange} markedDates={markedDates} /><Button variant="ghost" aria-label="Previous date" onClick={() => onChange(dateKey(shiftDays(parseDate(date), -1)))}><ChevronLeft size={15} /></Button><Button variant="ghost" aria-label="Next date" onClick={() => onChange(dateKey(shiftDays(parseDate(date), 1)))}><ChevronRight size={15} /></Button></div><Button variant="outline" onClick={() => onChange(dateKey(new Date()))}>Today</Button></div>;
}

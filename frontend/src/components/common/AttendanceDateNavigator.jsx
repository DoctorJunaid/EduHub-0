import { ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from './DatePicker';
import { dateKey, parseDate } from '@/lib/dates';
import { shiftDays } from '@/lib/schedule';
import './AttendanceDateNavigator.css';

export default function AttendanceDateNavigator({ date, onChange, markedDates }) {
  return (
    <div className="attendance-date-controls">
      <div className="attendance-date-box">
        <DatePicker value={date} onChange={onChange} markedDates={markedDates} />
        <button
          type="button"
          className="date-nav-arrow"
          aria-label="Previous date"
          onClick={() => onChange(dateKey(shiftDays(parseDate(date), -1)))}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          className="date-nav-arrow"
          aria-label="Next date"
          onClick={() => onChange(dateKey(shiftDays(parseDate(date), 1)))}
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <button
        type="button"
        className="toolbar-btn toolbar-btn-outline"
        onClick={() => onChange(dateKey(new Date()))}
      >
        Today
      </button>
    </div>
  );
}

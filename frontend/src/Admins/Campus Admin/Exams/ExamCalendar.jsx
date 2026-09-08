import { Button } from '@/components/ui/Button';
import { weekdays, shiftDays, gridRange, dayBlocks, minutes, timeLabel } from '../../../lib/schedule.js';
import { dateKey } from './examData.js';
export default function ExamCalendar({ records, week, onView }) {
  const visible = records.filter((record) => record.date >= dateKey(week) && record.date <= dateKey(shiftDays(week, 4)));
  const scheduled = visible.map((record) => ({ ...record, days: [new Date(`${record.date}T12:00:00`).getDay()] }));
  const range = gridRange(scheduled);
  const start = range.start, end = Math.max(18 * 60, range.end), scale = 25;
  return <><div className="tt-grid-scroll"><div className="tt-grid exam-grid" role="region" aria-label="Monday to Friday exam calendar">
    <div className="tt-grid-heading"><span /><>{weekdays.map((day, i) => <div key={day}><strong>{day.slice(0, 3)}</strong><span>{shiftDays(week, i).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>)}</></div>
    <div className="tt-grid-body" style={{ height: (end - start) / 60 * scale }}>
      <div className="tt-time-axis">{Array.from({ length: Math.ceil((end - start) / 120) + 1 }, (_, i) => Math.min(start + i * 120, end)).map((time) => <span key={time} style={{ top: (time - start) / 60 * scale }}>{timeLabel(`${String(Math.floor(time / 60)).padStart(2, '0')}:00`)}</span>)}</div>
      {weekdays.map((day, i) => <div className="tt-day-column" key={day}>{dayBlocks(scheduled, i + 1).map(({ record, lane, laneCount }) => <Button key={record.id} variant="ghost" className={`exam-block exam-${record.examType.toLowerCase()}`} onClick={() => onView(record.id)} aria-label={`${record.subject}, ${record.date}, ${timeLabel(record.startTime)} to ${timeLabel(record.endTime)}`} style={{ top: (minutes(record.startTime) - start) / 60 * scale, height: (minutes(record.endTime) - minutes(record.startTime)) / 60 * scale, left: `calc(${lane / laneCount * 100}% + 6px)`, width: `calc(${100 / laneCount}% - 12px)` }}>
        <i /><span><strong>{record.subject}</strong><small>{record.section} · {timeLabel(record.startTime)} – {timeLabel(record.endTime)}</small><small>• {record.room}</small></span>
      </Button>)}</div>)}
    </div>
  </div></div>{!visible.length && <p className="tt-empty">No exams scheduled Monday–Friday for this week.</p>}</>;
}

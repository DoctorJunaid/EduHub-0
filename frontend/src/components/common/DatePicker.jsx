import { useEffect, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { dateKey, parseDate, longDate, shortDate } from '@/lib/dates';
import { mondayOf, shiftDays } from '@/lib/schedule';
import './DatePicker.css';

export default function DatePicker({ value, onChange, markedDates = [] }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(value);
  const [month, setMonth] = useState(() => parseDate(value));
  const grid = useRef(null), moveFocus = useRef(false);
  useEffect(() => {
    if (moveFocus.current) { grid.current?.querySelector(`[data-date="${focused}"]`)?.focus(); moveFocus.current = false; }
  }, [focused, month]);
  const start = mondayOf(new Date(month.getFullYear(), month.getMonth(), 1, 12));
  const marked = new Set(markedDates);
  const keyboard = (event, day) => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -((day.getDay() + 6) % 7), End: 6 - ((day.getDay() + 6) % 7) };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = shiftDays(day, offsets[event.key]);
    moveFocus.current = true; setFocused(dateKey(next)); setMonth(next);
  };
  return <Popover.Root open={open} onOpenChange={(next) => { if (next) { setMonth(parseDate(value)); setFocused(value); } setOpen(next); }}>
    <Popover.Trigger asChild><button type="button" className="date-picker-trigger"><CalendarDays size={13} /><span>{shortDate(value)}</span></button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="date-picker-popup" align="start" sideOffset={8} aria-label="Choose date" onOpenAutoFocus={(event) => { event.preventDefault(); grid.current?.querySelector(`[data-date="${value}"]`)?.focus(); }}>
      <div className="date-picker-heading"><Button variant="ghost" aria-label="Previous month" onClick={() => { const next = new Date(month.getFullYear(), month.getMonth() - 1, 1, 12); setMonth(next); setFocused(dateKey(next)); }}><ChevronLeft size={15} /></Button><strong aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong><Button variant="ghost" aria-label="Next month" onClick={() => { const next = new Date(month.getFullYear(), month.getMonth() + 1, 1, 12); setMonth(next); setFocused(dateKey(next)); }}><ChevronRight size={15} /></Button></div>
      <div className="date-picker-weekdays" aria-hidden="true">{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="date-picker-days" ref={grid} role="group" aria-label="Calendar days">{Array.from({ length: 42 }, (_, i) => shiftDays(start, i)).map((day) => {
        const key = dateKey(day);
        return <Button key={key} variant="ghost" data-date={key} tabIndex={key === focused ? 0 : -1} aria-label={`${longDate(key)}${marked.has(key) ? ', attendance recorded' : ''}`} aria-pressed={key === value} aria-current={key === dateKey(new Date()) ? 'date' : undefined} className={day.getMonth() !== month.getMonth() ? 'outside-month' : ''} onKeyDown={(event) => keyboard(event, day)} onClick={() => { onChange(key); setOpen(false); }}>{day.getDate()}{marked.has(key) && <i />}</Button>;
      })}</div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}

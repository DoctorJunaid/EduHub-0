import { Coffee, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  shiftDays,
  gridRange,
  dayBlocks,
  minutes,
  timeLabel,
} from "../../../lib/schedule.js";

export const SLOT_HEIGHT_PX = 52;
const TIME_COLUMN_PX = 80;

function slotOccupied(records, dayNum, slot) {
  const slotStart = minutes(slot.start);
  const slotEnd = minutes(slot.end);
  return records.some(
    (record) =>
      record.days.includes(dayNum) &&
      minutes(record.startTime) < slotEnd &&
      minutes(record.endTime) > slotStart,
  );
}

function topForTime(startMinutes, gridStart) {
  return ((startMinutes - gridStart) / 60) * SLOT_HEIGHT_PX;
}

function heightForRange(startTime, endTime) {
  return (
    ((minutes(endTime) - minutes(startTime)) / 60) * SLOT_HEIGHT_PX
  );
}

export default function TimetableGrid({
  records,
  week,
  matrixConfig,
  onView,
  onAction,
  onQuickAdd,
}) {
  const days = matrixConfig?.days ?? [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ];
  const schedulableSlots =
    matrixConfig?.timeSlots?.filter((slot) => !slot.isBreak) ?? [];

  const { start, end } = gridRange(records);
  const height = ((end - start) / 60) * SLOT_HEIGHT_PX;
  const breaks = records.filter((record) => record.isBreak);
  const timeMarks = Array.from(
    { length: Math.floor((end - start) / 60) + 1 },
    (_, index) => start + index * 60,
  );
  if (timeMarks[timeMarks.length - 1] !== end) timeMarks.push(end);
  const classRecords = records.filter((record) => !record.isBreak);

  const gridColumns = `${TIME_COLUMN_PX}px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto min-w-0 pb-4">
      <div
        className="min-w-[min(100%,720px)] w-full border border-zinc-200 rounded-lg overflow-hidden bg-white"
        role="region"
        aria-label="Weekly class timetable"
      >
        <div className="grid min-h-[44px] bg-white border-b border-zinc-200" style={{ gridTemplateColumns: gridColumns }}>
          <span className="w-20 text-center py-2 text-[10px] font-semibold text-zinc-500 flex items-center justify-center">Time</span>
          {days.map((day, index) => (
            <div key={day} className="flex flex-col items-center justify-center gap-1 border-l border-zinc-200 py-2">
              <strong className="text-[11px] font-semibold text-zinc-900">{day}</strong>
              <span className="text-[10px] text-zinc-500">
                {shiftDays(week, index).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
        <div
          className="relative grid bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_51px,#e4e4e7_51px,#e4e4e7_52px)]"
          style={{ height, gridTemplateColumns: gridColumns, backgroundSize: `100% ${SLOT_HEIGHT_PX}px` }}
        >
          <div className="relative border-r border-zinc-200 w-20 bg-white bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_51px,#e4e4e7_51px,#e4e4e7_52px)]" style={{ backgroundSize: `100% ${SLOT_HEIGHT_PX}px` }}>
            {timeMarks.map((mark) => (
              <span key={mark} className="absolute left-0 right-0 text-center text-[10px] font-medium text-zinc-500 -translate-y-1/2 first:translate-y-0 first:top-[3px] last:-translate-y-full bg-white px-1" style={{ top: topForTime(mark, start) }}>
                {timeLabel(
                  `${String(Math.floor(mark / 60)).padStart(2, "0")}:${String(mark % 60).padStart(2, "0")}`,
                )}
              </span>
            ))}
          </div>
          
          {breaks.map((record) => {
            const breakTop = topForTime(minutes(record.startTime), start);
            const breakHeight = Math.max(
              heightForRange(record.startTime, record.endTime),
              28,
            );
            return (
              <div
                className="absolute z-10 right-0 flex items-center justify-center gap-2 px-3 min-h-[28px] h-7 bg-amber-50/80 border-y border-amber-200/60 text-amber-800 pointer-events-none"
                key={record.id}
                style={{
                  top: breakTop,
                  height: breakHeight,
                  left: TIME_COLUMN_PX,
                }}
              >
                <Coffee size={12} aria-hidden="true" />
                <strong className="text-[10px] font-semibold">{record.subject}</strong>
                <span className="text-[10px] font-medium text-amber-700">
                  {timeLabel(record.startTime)} – {timeLabel(record.endTime)}
                </span>
              </div>
            );
          })}
          {days.map((day, index) => {
            const dayNum = index + 1;
            return (
              <div className="relative border-l border-zinc-200" key={day}>
                {schedulableSlots.map((slot) => {
                  if (slotOccupied(classRecords, dayNum, slot)) return null;
                  const slotTop =
                    topForTime(minutes(slot.start), start) + 2;
                  const slotHeight = Math.max(
                    heightForRange(slot.start, slot.end) - 4,
                    40,
                  );
                  return (
                    <div
                      key={`${day}-${slot.id}`}
                      className="absolute left-1 right-1 z-0 border border-dashed border-transparent rounded-md transition-colors hover:border-zinc-300 hover:bg-zinc-50/85 group"
                      style={{ top: slotTop, height: slotHeight }}
                    >
                      {onQuickAdd && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 p-0 border border-zinc-200 rounded-full bg-white text-zinc-500 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-zinc-900 hover:text-white hover:border-zinc-900"
                          aria-label={`Schedule class on ${day}, ${timeLabel(slot.start)} to ${timeLabel(slot.end)}`}
                          onClick={() =>
                            onQuickAdd({
                              days: [dayNum],
                              startTime: slot.start,
                              endTime: slot.end,
                            })
                          }
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {dayBlocks(classRecords, dayNum).map(
                  ({ record, lane, laneCount }) => (
                    <div
                      key={record.id}
                      className="absolute z-[2] min-h-[52px] group"
                      style={{
                        top:
                          topForTime(minutes(record.startTime), start) + 2,
                        height: Math.max(
                          heightForRange(
                            record.startTime,
                            record.endTime,
                          ) - 4,
                          44,
                        ),
                        left: `calc(${(lane / laneCount) * 100}% + 4px)`,
                        width: `calc(${100 / laneCount}% - 8px)`,
                      }}
                    >
                      {onAction && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 z-10 inline-flex items-center justify-center w-5 h-5 p-0 border border-zinc-200 rounded-full bg-white text-zinc-500 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 shadow-sm"
                          aria-label={`Edit ${record.subject}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onAction("edit", record.id);
                          }}
                        >
                          <Pencil size={12} aria-hidden="true" />
                        </button>
                      )}
                      <Button
                        variant="ghost"
                        className="relative flex items-start justify-start w-full h-full gap-0 px-2 py-1.5 whitespace-normal overflow-hidden border border-zinc-200 border-l-[3px] border-l-zinc-900 rounded-md bg-white text-zinc-900 text-left shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-900"
                        onClick={() => onView?.(record.id)}
                        aria-label={`${record.subject}, ${day}, ${timeLabel(record.startTime)} to ${timeLabel(record.endTime)}`}
                      >
                        <span className="min-w-0 flex-1 pr-5">
                          <strong className="block text-xs font-semibold text-zinc-900 truncate leading-tight">{record.subject}</strong>
                          <small className="block mt-[3px] text-[10px] text-zinc-500 truncate leading-tight">
                            {record.section} • {record.room}
                          </small>
                          <small className="block font-medium mt-[3px] text-[10px] text-zinc-500 truncate leading-tight">
                            {timeLabel(record.startTime)} –{" "}
                            {timeLabel(record.endTime)}
                          </small>
                        </span>
                      </Button>
                    </div>
                  ),
                )}
              </div>
            );
          })}
        </div>
      </div>
      {!records.length && (
        <p className="p-5 text-center text-zinc-500 text-xs">No classes match the selected filters.</p>
      )}
    </div>
  );
}

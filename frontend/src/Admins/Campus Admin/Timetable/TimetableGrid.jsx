import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { weekdays, shiftDays, gridRange, dayBlocks, minutes, timeLabel } from "../../../lib/schedule.js";

export default function TimetableGrid({ records, week, onView }) {
  const { start, end } = gridRange(records);
  const height = ((end - start) / 60) * 40;
  return (
    <div className="tt-grid-scroll">
      <div
        className="tt-grid"
        role="region"
        aria-label="Monday to Friday class timetable"
      >
        <div className="tt-grid-heading">
          <span>Time</span>
          {weekdays.map((day, index) => (
            <div key={day}>
              <strong>{day}</strong>
              <span>
                {shiftDays(week, index).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="tt-grid-body" style={{ height }}>
          <div className="tt-time-axis">
            {Array.from({ length: (end - start) / 60 + 1 }, (_, index) => (
              <span key={index} style={{ top: index * 40 }}>
                {timeLabel(
                  `${String((start / 60 + index) % 24).padStart(2, "0")}:00`,
                )}
              </span>
            ))}
          </div>
          {weekdays.map((day, index) => (
            <div className="tt-day-column" key={day}>
              {dayBlocks(records, index + 1).map(
                ({ record, lane, laneCount }) => (
                  <Button
                    key={record.id}
                    variant="ghost"
                    className="tt-class-block"
                    onClick={() => onView(record.id)}
                    aria-label={`${record.subject}, ${day}, ${timeLabel(record.startTime)} to ${timeLabel(record.endTime)}`}
                    style={{
                      top: ((minutes(record.startTime) - start) / 60) * 40,
                      height:
                        ((minutes(record.endTime) - minutes(record.startTime)) /
                          60) *
                        40,
                      left: `calc(${(lane / laneCount) * 100}% + 6px)`,
                      width: `calc(${100 / laneCount}% - 12px)`,
                    }}
                  >
                    <CalendarDays size={14} aria-hidden="true" />
                    <span>
                      <strong>{record.subject}</strong>
                      <small>
                        {record.section} • {record.room}
                      </small>
                      <small>
                        {timeLabel(record.startTime)} –{" "}
                        {timeLabel(record.endTime)}
                      </small>
                    </span>
                  </Button>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      {!records.length && (
        <p className="tt-empty">No classes match the selected filters.</p>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Clock, Calendar, BookOpen, MapPin, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimetableTab({
  timetableData,
  loading,
  onLoadTimetable,
  initialClassFilter = "",
}) {
  const [selectedClass, setSelectedClass] = useState(initialClassFilter);

  useEffect(() => {
    onLoadTimetable();
  }, [onLoadTimetable]);

  useEffect(() => {
    if (initialClassFilter) {
      setSelectedClass(initialClassFilter);
    }
  }, [initialClassFilter]);

  if (loading && !timetableData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const days = timetableData?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = timetableData?.periods || [];
  const slots = timetableData?.slots || [];

  const uniqueClasses = Array.from(new Set(slots.map((s) => s.class).filter(Boolean)));

  const filteredSlots = selectedClass
    ? slots.filter((s) => s.class?.toLowerCase().includes(selectedClass.toLowerCase()))
    : slots;

  return (
    <div className="space-y-6">
      {/* Header bar with Class Filter & Total Load */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-600" />
            Weekly Routine & Teaching Schedule
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time timetable matrix reflecting active routine periods and free slots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {uniqueClasses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Badge variant="outline" className="bg-zinc-100 text-zinc-800 font-semibold text-xs px-2.5 py-1">
            {slots.length} Total Periods / Week
          </Badge>
        </div>
      </div>

      {/* Timetable Grid View */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-900 text-white">
              <th className="p-3 text-left font-semibold border-b border-zinc-800 w-28">
                Time / Period
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="p-3 text-center font-semibold border-b border-zinc-800 min-w-[130px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {periods.map((p, idx) => {
              if (p.break) {
                return (
                  <tr key={`break-${idx}`} className="bg-zinc-100/70">
                    <td className="p-2.5 font-bold text-zinc-500 border-r border-zinc-200">
                      {p.startTime} - {p.endTime}
                    </td>
                    <td
                      colSpan={days.length}
                      className="p-2.5 text-center font-semibold tracking-wider uppercase text-zinc-500 text-[11px]"
                    >
                      &mdash; {p.name || "Recess Break"} &mdash;
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={`period-${p.period}`} className="hover:bg-zinc-50/50">
                  <td className="p-3 font-semibold text-zinc-700 bg-zinc-50 border-r border-zinc-200">
                    <div className="font-bold text-zinc-900">Period {p.period}</div>
                    <div className="text-[10px] text-zinc-400">
                      {p.startTime} - {p.endTime}
                    </div>
                  </td>

                  {days.map((day) => {
                    const match = filteredSlots.find(
                      (s) =>
                        s.day?.toLowerCase() === day.toLowerCase() &&
                        Number(s.period) === Number(p.period)
                    );

                    if (!match) {
                      return (
                        <td
                          key={`${day}-${p.period}`}
                          className="p-3 text-center border-r border-zinc-100 last:border-0"
                        >
                          <span className="text-[11px] text-zinc-300 font-medium select-none">
                            Free
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${day}-${p.period}`}
                        className="p-2 border-r border-zinc-100 last:border-0"
                      >
                        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100/90 text-left transition-all hover:bg-indigo-100/80 hover:shadow-xs">
                          <div className="font-bold text-indigo-950 text-xs truncate">
                            {match.class}
                          </div>
                          <div className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1 mt-0.5 truncate">
                            <BookOpen className="w-3 h-3 shrink-0" />
                            {match.subject}
                          </div>
                          {match.room && (
                            <div className="text-[10px] text-indigo-500/80 flex items-center gap-1 mt-1 font-medium">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {match.room}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

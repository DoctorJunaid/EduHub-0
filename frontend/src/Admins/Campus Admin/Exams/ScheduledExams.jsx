import React from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  Download,
  Award,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import DataPagination from "@/components/shared/DataPagination";
import { timeLabel } from "../../../lib/schedule.js";

export default function ScheduledExams({
  records = [],
  page = 1,
  pageSize = 20,
  onPage,
  onPageSize,
  onAction,
}) {
  const count = Math.max(1, Math.ceil(records.length / pageSize));
  const current = Math.min(page, count);
  const displayed = records.slice((current - 1) * pageSize, current * pageSize);

  const handleExportCSV = () => {
    if (!records.length) return;
    const headers = [
      "Exam Type",
      "Subject",
      "Class / Program",
      "Section",
      "Date",
      "Start Time",
      "End Time",
      "Hall / Room",
      "Invigilator",
      "Total Marks",
    ];

    const rows = records.map((r) => [
      `"${r.examType || "Midterm"}"`,
      `"${r.subject || ""}"`,
      `"${r.className || r.program || r.gradeOrClass || ""}"`,
      `"${r.section || ""}"`,
      `"${r.date || ""}"`,
      `"${r.startTime || ""}"`,
      `"${r.endTime || ""}"`,
      `"${r.room || r.roomNumber || ""}"`,
      `"${r.invigilator || r.teacherName || ""}"`,
      `"${r.totalMarks ?? 100}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `exam_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columnDefs = [
    { label: "Subject & Exam Type", width: "24%", align: "left" },
    { label: "Class & Section", width: "16%", align: "left" },
    { label: "Date & Time", width: "20%", align: "left" },
    { label: "Daily Load", width: "14%", align: "center" },
    { label: "Hall / Room", width: "14%", align: "left" },
    { label: "Marks", width: "6%", align: "center" },
    { label: "Actions", width: "6%", align: "right" },
  ];

  return (
    <Card className="tt-card exam-table">
      <div className="tt-panel-heading flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Scheduled Examinations
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
            {records.length} {records.length === 1 ? "paper" : "papers"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      <Table aria-label="Scheduled exams">
        <TableHeader>
          <TableRow>
            {columnDefs.map(({ label, width, align }) => (
              <TableHead key={label} scope="col" style={{ width, textAlign: align }}>
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.slice((current - 1) * pageSize, current * pageSize).map((record) => {
            const recId = record._id || record.id;
            const subject = record.subject || "Exam";
            const initials =
              subject
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((word) => word[0] || "")
                .join("")
                .toUpperCase() || "EX";
            const marks = record.totalMarks ?? 100;
            const className =
              record.className || record.program || record.gradeOrClass || "General";
            const section = record.section || "A";

            return (
              <TableRow key={recId}>
                {/* Subject & Type */}
                <TableCell style={{ width: "22%" }}>
                  <div className="tt-person">
                    <span className="tt-avatar">{initials}</span>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <strong
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {subject}
                      </strong>
                      <Badge
                        className={`exam-badge exam-${(record.examType || "midterm").toLowerCase()}`}
                      >
                        {record.examType || "Midterm"}
                      </Badge>
                    </div>
                  </div>
                </TableCell>

                {/* Class & Section */}
                <TableCell style={{ width: "16%" }}>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate">
                      {className}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Section {section}
                    </span>
                  </div>
                </TableCell>

                {/* Date & Time */}
                <TableCell style={{ width: "17%", whiteSpace: "nowrap" }}>
                  <span className="exam-detail-line font-medium text-zinc-800 dark:text-zinc-200">
                    <CalendarDays size={13} />
                    {record.date}
                  </span>
                  <small className="exam-detail-line text-zinc-500">
                    <Clock size={12} />
                    {timeLabel(record.startTime)} – {timeLabel(record.endTime)}
                  </small>
                </TableCell>

                {/* Daily Load */}
                <TableCell style={{ width: "12%", textAlign: "center", whiteSpace: "nowrap" }}>
                  {record.isDualExamDay ? (
                    <span className="exam-day-pill dual">
                      Dual-Paper (Rare)
                    </span>
                  ) : (
                    <span className="exam-day-pill standard">
                      Single Paper
                    </span>
                  )}
                </TableCell>

                {/* Exam Hall / Room */}
                <TableCell style={{ width: "14%", whiteSpace: "nowrap" }}>
                  <span className="exam-detail-line font-medium">
                    <MapPin size={13} className="text-zinc-400" />
                    {record.room || record.roomNumber || "Hall A"}
                  </span>
                </TableCell>

                {/* Total Marks */}
                <TableCell style={{ width: "6%", textAlign: "center", whiteSpace: "nowrap" }}>
                  <span className="exam-marks font-bold text-zinc-800 dark:text-zinc-200">
                    {marks} pts
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell style={{ width: "6%", textAlign: "right" }}>
                  <div className="tt-row-actions" style={{ justifyContent: "flex-end" }}>
                    {[
                      ["view", Eye],
                      ["edit", Pencil],
                      ["delete", Trash2],
                    ].map(([mode, Icon]) => (
                      <Button
                        key={mode}
                        variant="outline"
                        className={`tt-${mode}`}
                        aria-label={`${mode[0].toUpperCase() + mode.slice(1)} ${subject}`}
                        onClick={() => onAction(mode, recId, record)}
                      >
                        <Icon size={13} />
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {!records.length && (
            <TableRow>
              <TableCell colSpan={7} className="tt-empty text-center py-8 text-zinc-400">
                No examinations match your search criteria and class filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataPagination
        page={current}
        pageSize={pageSize}
        total={records.length}
        pageCount={count}
        onPageChange={onPage}
        onPageSizeChange={onPageSize}
        itemLabel="exams"
      />
    </Card>
  );
}

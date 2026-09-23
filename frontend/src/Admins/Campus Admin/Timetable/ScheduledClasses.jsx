import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { dayLabel, timeLabel } from "../../../lib/schedule.js";

const WEEKDAY_ABBRS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDays(days) {
  if (!Array.isArray(days) || !days.length) return "–";
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_ABBRS[d - 1] || `Day ${d}`)
    .join(", ");
}

export default function ScheduledClasses({
  records,
  page,
  pageSize,
  onPage,
  onPageSize,
  onAction,
}) {
  const count = Math.max(1, Math.ceil(records.length / pageSize));
  const current = Math.min(page, count);
  const displayed = records.slice((current - 1) * pageSize, current * pageSize);

  return (
    <Card className="tt-card tt-table-panel">
      <div className="tt-panel-heading">
        <h2>Scheduled Classes</h2>
        <div className="tt-pagination">
          <span role="status">
            Showing {displayed.length} of {records.length} records
          </span>
          <Button
            variant="outline"
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </Button>
          <Button aria-current="page">{current}</Button>
          <Button
            variant="outline"
            disabled={current === count}
            onClick={() => onPage(current + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </Button>
          <select
            aria-label="Records per page"
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
          >
            {[10, 25, 50].map((size) => (
              <option value={size} key={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      <Table aria-label="Scheduled classes">
        <TableHeader>
          <TableRow>
            {[
              { label: "Subject & Section", width: "26%" },
              { label: "Days & Time", width: "22%" },
              { label: "Room / Lab", width: "14%" },
              { label: "Assigned Instructor", width: "18%" },
              { label: "Status", width: "10%" },
              { label: "Actions", width: "10%" },
            ].map(({ label, width }) => (
              <TableHead scope="col" key={label} style={{ width }}>
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {displayed.map((record) => {
            const isBreak = Boolean(record.isBreak);
            const subjectName = record.subject || record.breakTitle || "Untitled";
            // Safely get first letter — guard against empty string
            const subjectInitials = subjectName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0] || "")
              .join("")
              .toUpperCase();
            const instructorName = record.instructor || record.teacherName || "";
            const instructorInitial = instructorName.trim()[0] || "?";

            return (
              <TableRow
                key={record._id || record.id}
                style={isBreak ? { background: "#fffbeb" } : undefined}
              >
                <TableCell>
                  <div className="tt-person">
                    <span
                      className="tt-avatar"
                      style={isBreak ? { background: "#d97706", color: "#fff" } : undefined}
                    >
                      {isBreak ? <Coffee size={12} /> : subjectInitials}
                    </span>
                    <div>
                      <strong>
                        {isBreak && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "#92400e",
                              background: "#fef3c7",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              marginRight: "6px",
                              border: "1px solid #fde68a",
                            }}
                          >
                            BREAK
                          </span>
                        )}
                        {subjectName}
                      </strong>
                      <small>
                        {isBreak
                          ? "Campus-wide interval"
                          : `Section: ${record.section || "—"}`}
                      </small>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="tt-person">
                    <Clock size={14} />
                    <div>
                      {formatDays(record.days)}
                      <small>
                        {timeLabel(record.startTime)} –{" "}
                        {timeLabel(record.endTime)}
                      </small>
                    </div>
                  </div>
                </TableCell>

                <TableCell>{record.room || record.roomNumber || "—"}</TableCell>

                <TableCell>
                  {isBreak ? (
                    <span style={{ color: "#92400e", fontStyle: "italic", fontSize: "12px" }}>
                      Campus Staff
                    </span>
                  ) : (
                    <div className="tt-person">
                      <span className="tt-instructor-avatar">
                        {instructorInitial}
                      </span>
                      {instructorName || <em style={{ color: "#a1a1aa" }}>Unassigned</em>}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`tt-status ${record.status === "Pending" ? "tt-pending" : ""}`}
                  >
                    <span />
                    {record.status || "Active"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="tt-row-actions">
                    {[
                      { mode: "view", label: "View", Icon: Eye },
                      { mode: "edit", label: "Edit", Icon: Pencil },
                      { mode: "delete", label: "Delete", Icon: Trash2 },
                    ].map(({ mode, label, Icon }) => (
                      <Button
                        key={mode}
                        variant="outline"
                        className={`tt-${mode}`}
                        aria-label={`${label} ${subjectName}`}
                        onClick={() => onAction(mode, record._id || record.id)}
                      >
                        <Icon size={14} />
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}

          {!displayed.length && (
            <TableRow>
              <TableCell colSpan={6} className="tt-empty">
                <CalendarDays size={18} /> No scheduled classes for this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

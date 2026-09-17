import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
            Showing {displayed.length} of {records.length} classes
          </span>
          <Button
            variant="outline"
            disabled={current === 1}
            onClick={() => onPage(current - 1)}
            aria-label="Previous class page"
          >
            <ChevronLeft size={15} />
          </Button>
          <Button aria-current="page">{current}</Button>
          <Button
            variant="outline"
            disabled={current === count}
            onClick={() => onPage(current + 1)}
            aria-label="Next class page"
          >
            <ChevronRight size={15} />
          </Button>
          <select
            aria-label="Classes per page"
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
          {displayed.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <div className="tt-person">
                  <span className="tt-avatar">
                    {record.subject
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{record.subject}</strong>
                    <small>Section: {record.section}</small>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="tt-person">
                  <Clock size={14} />
                  <div>
                    {dayLabel(record.days)}
                    <small>
                      {timeLabel(record.startTime)} –{" "}
                      {timeLabel(record.endTime)}
                    </small>
                  </div>
                </div>
              </TableCell>
              <TableCell>{record.room}</TableCell>
              <TableCell>
                <div className="tt-person">
                  <span className="tt-instructor-avatar">
                    {record.instructor[0]}
                  </span>
                  {record.instructor}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`tt-status ${record.status === "Pending" ? "tt-pending" : ""}`}
                >
                  <span />
                  {record.status}
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
                      aria-label={`${label} ${record.subject}`}
                      onClick={() => onAction(mode, record.id)}
                    >
                      <Icon size={14} />
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!displayed.length && (
            <TableRow>
              <TableCell colSpan={6} className="tt-empty">
                <CalendarDays size={18} /> No scheduled classes match these
                filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

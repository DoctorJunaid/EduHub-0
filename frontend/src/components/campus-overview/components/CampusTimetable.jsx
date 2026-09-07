import {
  ArrowRight,
  CalendarDays,
  MoreVertical,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import OverviewPanel from "./OverviewPanel";
import OverviewStatusBadge from "./OverviewStatusBadge";
import { campusClasses } from "../campusOverviewData.js";

export default function CampusTimetable() {
  return (
    <OverviewPanel
      title="Active Class Timetable"
      description="Current weekly course allocations for this campus"
      icon={CalendarDays}
      action="View All Schedules"
      className="overview-timetable"
    >
      <Table aria-label="Active class timetable">
        <TableHeader>
          <TableRow>
            {[
              "Subject & Section",
              "Day & Time",
              "Room / Lab",
              "Instructor",
              "Status",
            ].map((label) => (
              <TableHead key={label} scope="col">
                {label}
              </TableHead>
            ))}
            <TableHead scope="col">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campusClasses.map((item) => (
            <TableRow key={item.subject}>
              <TableCell>
                <strong>{item.subject}</strong>
                <small>Sec: {item.section}</small>
              </TableCell>
              <TableCell>
                {item.days}
                <small>{item.time}</small>
              </TableCell>
              <TableCell>{item.room}</TableCell>
              <TableCell>
                <div className="overview-person">
                  <span className="overview-instructor-icon">
                    <UserRound size={17} aria-hidden="true" />
                  </span>
                  <span>
                    Dr. Usman
                    <br />
                    Khan
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <OverviewStatusBadge status="Active" />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  className="overview-icon-button"
                  disabled
                  aria-label={`${item.subject} options`}
                >
                  <MoreVertical size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="overview-timetable-footer">
        <Button variant="ghost" className="overview-text-button" disabled>
          View Full Timetable
          <ArrowRight size={13} />
        </Button>
      </div>
    </OverviewPanel>
  );
}

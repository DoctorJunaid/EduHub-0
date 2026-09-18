import { LogIn, LogOut, MoreVertical, Eye, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { timeLabel } from "@/lib/schedule";
import { attendanceStatuses } from "./attendanceData.js";
import AttendanceStatusBadge from "@/components/common/AttendanceStatusBadge";

export default function AttendanceTable({
  rows,
  view,
  page,
  pageSize,
  onAction,
  onQuickAction,
  pendingAction,
}) {
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(rows.length / pageSize)),
  );
  const columns =
    view === "weekly"
      ? ["#", "Teacher / Staff", "Department", ...attendanceStatuses]
      : view === "history"
        ? [
            "#",
            "Teacher / Staff",
            "Department",
            "Date",
            "Check-in",
            "Check-out",
            "Status",
            "Actions",
          ]
        : [
            "#",
            "Teacher / Staff",
            "Department",
            "Check-in",
            "Check-out",
            "Status",
            "Actions",
          ];

  const colWidths =
    view === "weekly"
      ? {
          "#": "4%",
          "Teacher / Staff": "22%",
          Department: "16%",
          Present: "11%",
          Late: "11%",
          Absent: "12%",
          "On Leave": "12%",
          "Half Day": "12%",
        }
      : view === "history"
        ? {
            "#": "4%",
            "Teacher / Staff": "22%",
            Department: "15%",
            Date: "12%",
            "Check-in": "11%",
            "Check-out": "11%",
            Status: "13%",
            Actions: "12%",
          }
        : {
            "#": "4%",
            "Teacher / Staff": "20%",
            Department: "14%",
            "Check-in": "10%",
            "Check-out": "10%",
            Status: "12%",
            Actions: "30%",
          };

  const colAlign = {
    "#": "left",
    "Teacher / Staff": "left",
    Department: "left",
    Date: "center",
    "Check-in": "center",
    "Check-out": "center",
    Status: "center",
    Actions: "center",
  };

  return (
    <Table aria-label={`${view} faculty attendance`}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              scope="col"
              key={column}
              style={{
                width: colWidths[column] || "auto",
                textAlign:
                  colAlign[column] ||
                  (attendanceStatuses.includes(column) ? "center" : "left"),
              }}
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows
          .slice((current - 1) * pageSize, current * pageSize)
          .map(({ person, record, date, counts }, index) => {
            const isAbsentOrLeave = ["Absent", "On Leave"].includes(
              record?.status,
            );
            const hasCheckIn = Boolean(record?.checkInTime);
            const hasCheckOut = Boolean(record?.checkOutTime);
            const isPending = Boolean(pendingAction);

            const isCheckInDisabled =
              hasCheckIn || isAbsentOrLeave || isPending;
            const isCheckOutDisabled =
              !hasCheckIn || hasCheckOut || isAbsentOrLeave || isPending;

            return (
              <TableRow
                key={record?.id ?? `${person.id}-${date || index}`}
                onClick={() =>
                  onAction(record ? "view" : "edit", person.id, record?.id)
                }
                className="campus-clickable-row"
                style={{ cursor: "pointer" }}
                title="Click row to view full attendance details"
              >
                <TableCell style={{ width: colWidths["#"] }}>
                  {(current - 1) * pageSize + index + 1}
                </TableCell>

                <TableCell style={{ width: colWidths["Teacher / Staff"] }}>
                  <div className="attendance-person">
                    <Avatar>
                      <AvatarFallback>
                        {person.initials || person.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <strong
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {person.name}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "#71717a",
                        }}
                      >
                        {person.email}
                      </small>
                    </div>
                  </div>
                </TableCell>

                <TableCell
                  style={{
                    width: colWidths["Department"],
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {person.department || "—"}
                </TableCell>

                {view === "weekly" ? (
                  attendanceStatuses.map((status) => (
                    <TableCell
                      key={status}
                      style={{ textAlign: "center", width: colWidths[status] }}
                    >
                      {counts[status]}
                    </TableCell>
                  ))
                ) : (
                  <>
                    {view === "history" && (
                      <TableCell
                        style={{
                          width: colWidths["Date"],
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {date}
                      </TableCell>
                    )}
                    <TableCell
                      style={{
                        width: colWidths["Check-in"],
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {record?.checkInTime
                        ? timeLabel(record.checkInTime)
                        : "—"}
                    </TableCell>
                    <TableCell
                      style={{
                        width: colWidths["Check-out"],
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {record?.checkOutTime
                        ? timeLabel(record.checkOutTime)
                        : "—"}
                    </TableCell>
                    <TableCell
                      style={{
                        width: colWidths["Status"],
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <AttendanceStatusBadge status={record?.status} />
                    </TableCell>

                    <TableCell
                      style={{
                        width: colWidths["Actions"],
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div
                        className="attendance-actions"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          flexWrap: "nowrap",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {view === "daily" && (
                          <>
                            <button
                              type="button"
                              className={`attendance-action-btn ${isCheckInDisabled ? "btn-disabled" : "btn-active"}`}
                              disabled={isCheckInDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickAction("checkIn", person.id);
                              }}
                              aria-label={`Check in ${person.name}`}
                              title={
                                record?.checkInTime
                                  ? `Checked in at ${record.checkInTime}`
                                  : isAbsentOrLeave
                                    ? `Status: ${record?.status}`
                                    : "Record check in time"
                              }
                            >
                              <LogIn size={13} />
                              Check in
                            </button>

                            <button
                              type="button"
                              className={`attendance-action-btn ${isCheckOutDisabled ? "btn-disabled" : "btn-active"}`}
                              disabled={isCheckOutDisabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickAction("checkOut", person.id);
                              }}
                              aria-label={`Check out ${person.name}`}
                              title={
                                record?.checkOutTime
                                  ? `Checked out at ${record.checkOutTime}`
                                  : !hasCheckIn
                                    ? "Must check in first"
                                    : isAbsentOrLeave
                                      ? `Status: ${record?.status}`
                                      : "Record check out time"
                              }
                            >
                              <LogOut size={13} />
                              Check out
                            </button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="table-icon-btn"
                              style={{ width: "26px", height: "26px" }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`More options for ${person.name}`}
                              title="More options"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="attendance-more-menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              className="attendance-more-item"
                              onSelect={() =>
                                onAction("view", person.id, record?.id)
                              }
                            >
                              <Eye size={13} style={{ marginRight: "6px" }} />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="attendance-more-item"
                              onSelect={() =>
                                onAction("edit", person.id, record?.id)
                              }
                            >
                              <Pencil
                                size={13}
                                style={{ marginRight: "6px" }}
                              />
                              Update attendance
                            </DropdownMenuItem>
                            {view === "daily" &&
                              !hasCheckIn &&
                              !isAbsentOrLeave && (
                                <DropdownMenuItem
                                  className="attendance-more-item"
                                  onSelect={() =>
                                    onQuickAction("checkIn", person.id)
                                  }
                                >
                                  <LogIn
                                    size={13}
                                    style={{ marginRight: "6px" }}
                                  />
                                  Quick Check In
                                </DropdownMenuItem>
                              )}
                            {view === "daily" &&
                              hasCheckIn &&
                              !hasCheckOut &&
                              !isAbsentOrLeave && (
                                <DropdownMenuItem
                                  className="attendance-more-item"
                                  onSelect={() =>
                                    onQuickAction("checkOut", person.id)
                                  }
                                >
                                  <LogOut
                                    size={13}
                                    style={{ marginRight: "6px" }}
                                  />
                                  Quick Check Out
                                </DropdownMenuItem>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        {!rows.length && (
          <TableRow>
            <TableCell colSpan={columns.length} className="tt-empty">
              {view === "history"
                ? "No attendance records match this date range and filters."
                : "No faculty or attendance records match these filters."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

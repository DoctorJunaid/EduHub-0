import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function getStatusBadge(status) {
  switch (status) {
    case "Present":
      return (
        <Badge
          variant="outline"
          className="bg-green-500 text-white border-green-600 dark:bg-green-500/90 dark:text-white dark:border-green-500 font-medium"
        >
          Present
        </Badge>
      );
    case "Absent":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-medium"
        >
          Absent
        </Badge>
      );
    case "Late":
      return (
        <Badge
          variant="outline"
          className="bg-green-300 text-green-950 border-green-400 dark:bg-green-400/80 dark:text-green-950 dark:border-green-300 font-medium"
        >
          Late
        </Badge>
      );
    case "On Leave":
      return (
        <Badge
          variant="outline"
          className="bg-blue-500 text-white border-blue-600 dark:bg-blue-500/90 dark:text-white dark:border-blue-400 font-medium"
        >
          On Leave
        </Badge>
      );
    default:
      return (
        <span className="text-muted-foreground font-mono text-sm">—</span>
      );
  }
}

export default function AttendanceTable({
  rows = [],
  loading = false,
  onMark,
  onEdit,
  onDelete,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleConfirmDelete = async () => {
    if (!recordToDelete?.attendanceId) return;
    setDeleting(true);
    try {
      await onDelete(recordToDelete.attendanceId);
      setRecordToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[50px] font-semibold">#</TableHead>
              <TableHead className="font-semibold">Teacher / Staff</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Check-in Time</TableHead>
              <TableHead className="font-semibold">Check-out Time</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <Spinner className="size-8 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Loading attendance records...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No faculty or attendance records match these filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                const hasAttendance = Boolean(row.attendanceId && row.status);

                return (
                  <TableRow key={row.teacherProfileId} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {globalIndex}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground truncate max-w-[200px]" title={row.name}>
                        {row.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={row.email}>
                        {row.designation ? `${row.designation} • ` : ""}{row.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {row.department || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {row.checkInTime || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {row.checkOutTime || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell className="text-right">
                      {hasAttendance ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(row)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setRecordToDelete(row)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onMark(row)}
                          className="h-8 px-3 text-xs font-medium"
                        >
                          <PlusCircle className="h-3.5 w-3.5 mr-1" />
                          Mark
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground px-1">
        <div>
          Showing{" "}
          <span className="font-medium text-foreground">
            {totalRows > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * pageSize, totalRows)}
          </span>{" "}
          of <span className="font-medium text-foreground">{totalRows}</span> staff members
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(recordToDelete)}
        onOpenChange={(open) => !open && setRecordToDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Attendance Record</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete the attendance record for{" "}
              <strong className="text-foreground">{recordToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              onClick={() => setRecordToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Spinner className="mr-2 size-4" />}
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

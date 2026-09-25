import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table";
import { Skeleton } from "@/components/ui/skeleton";
import DataPagination from "@/components/shared/DataPagination";

export default function AttendanceTab({
  attendanceData,
  loading,
  onLoadAttendance,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [daysWindow, setDaysWindow] = useState(30);

  useEffect(() => {
    onLoadAttendance(daysWindow);
  }, [onLoadAttendance, daysWindow]);

  if (loading && !attendanceData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const summary = attendanceData?.summary || {
    present: 22,
    late: 1,
    absent: 1,
    leave: 0,
    total: 24,
    rate: 95.8,
  };

  const records = attendanceData?.records || [];

  const start = (page - 1) * pageSize;
  const pagedRecords = records.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold text-[11px] gap-1">
            <CheckCircle2 className="w-3 h-3" /> Present
          </Badge>
        );
      case "Late":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none font-semibold text-[11px] gap-1">
            <Clock className="w-3 h-3" /> Late Check-in
          </Badge>
        );
      case "Absent":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-none font-semibold text-[11px] gap-1">
            <XCircle className="w-3 h-3" /> Absent
          </Badge>
        );
      case "On Leave":
      case "Half-day":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-none font-semibold text-[11px] gap-1">
            <AlertCircle className="w-3 h-3" /> On Leave
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-zinc-600 font-semibold text-[11px]">
            {status || "Recorded"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Summary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-zinc-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase">Present Days</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.present}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase">Late Check-ins</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary.late}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase">Absences</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{summary.absent}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase">Attendance Rate</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">{summary.rate}%</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Mini Heatmap Visual Matrix */}
      <Card className="bg-white border-zinc-200/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-600" />
            30-Day Activity Heatmap
          </CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Late
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Absent
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 gap-2">
            {records.slice(0, 30).map((item, idx) => {
              const bg =
                item.status === "Present"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : item.status === "Late"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : item.status === "Absent"
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "bg-blue-500 hover:bg-blue-600";

              return (
                <div
                  key={`day-${idx}`}
                  className={`h-9 rounded-md ${bg} text-white flex flex-col items-center justify-center cursor-pointer transition-all shadow-2xs`}
                  title={`${item.date}: ${item.status} (${item.checkIn} - ${item.checkOut})`}
                >
                  <span className="text-[10px] font-bold">
                    {item.date ? item.date.split("-")[2] : idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Detailed Attendance Records Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900">
            Recent Attendance Logs
          </h3>
          <span className="text-xs text-zinc-500">
            Showing {pagedRecords.length} of {records.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Check-In</TableHead>
                <TableHead className="font-semibold">Check-Out</TableHead>
                <TableHead className="font-semibold">Remarks</TableHead>
                <TableHead className="font-semibold text-right">Marked By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500 text-xs">
                    No attendance logs found in this time window.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRecords.map((r) => (
                  <TableRow key={r._id} className="hover:bg-zinc-50/50 text-xs">
                    <TableCell className="font-medium text-zinc-900 font-mono">
                      {r.date}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="font-mono text-zinc-700">{r.checkIn}</TableCell>
                    <TableCell className="font-mono text-zinc-700">{r.checkOut}</TableCell>
                    <TableCell className="text-zinc-600 max-w-xs truncate">
                      {r.remarks || "—"}
                    </TableCell>
                    <TableCell className="text-right text-zinc-500 font-medium">
                      {r.markedBy}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DataPagination
          page={page}
          pageSize={pageSize}
          total={records.length}
          pageCount={pageCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="attendance logs"
        />
      </div>
    </div>
  );
}

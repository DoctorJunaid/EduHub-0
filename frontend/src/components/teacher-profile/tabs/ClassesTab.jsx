import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Download,
  Award,
  Clock,
  Users,
  Search,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ClassCard from "../ClassCard";
import AssignClassDialog from "../AssignClassDialog";
import UnassignClassDialog from "../UnassignClassDialog";
import toast from "react-hot-toast";

export default function ClassesTab({
  teacher,
  classesData,
  loading,
  onLoadClasses,
  onAssignClass,
  onUnassignClass,
  onViewTimetable,
}) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    onLoadClasses();
  }, [onLoadClasses]);

  const teacherName = teacher?.userId?.name || "Teacher";
  const classesList = classesData || [];

  const filteredClasses = classesList.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.className?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    if (!classesList.length) {
      toast.error("No classes to export");
      return;
    }
    const headers = ["Class", "Grade Level", "Section", "Subject", "Periods Per Week", "Role", "Enrolled Students"];
    const rows = classesList.map((c) => [
      c.className,
      c.gradeLevel,
      c.section,
      c.subject,
      c.periodsPerWeek,
      c.isClassTeacher ? "Class Incharge" : "Subject Teacher",
      c.studentCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${teacherName.replace(/\s+/g, "_")}_classes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Classes exported successfully!");
  };

  if (loading && !classesData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Top Sub-header Toolbar */}
      <div className="campus-toolbar" style={{ borderRadius: "8px", border: "1px solid #e4e4e7" }}>
        <div className="toolbar-left">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#09090b" }}>
              Assigned Classes & Sections
            </span>
            <span className="campus-status-pill status-active" style={{ fontSize: "10px", padding: "2px 8px" }}>
              {classesList.length} Total
            </span>
          </div>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            onClick={exportCsv}
            disabled={!classesList.length}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="toolbar-btn toolbar-btn-primary"
            onClick={() => setAssignDialogOpen(true)}
          >
            <Plus size={13} />
            <span>Assign More Classes</span>
          </button>
        </div>
      </div>

      {/* 2. Empty State */}
      {classesList.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-200 rounded-lg p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center mb-3">
            <BookOpen size={22} />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            No Classes Assigned Yet
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-4">
            {teacherName} has not been linked to any academic grade sections or subjects in this campus.
          </p>
          <button
            type="button"
            onClick={() => setAssignDialogOpen(true)}
            className="toolbar-btn toolbar-btn-primary"
          >
            <Plus size={13} />
            <span>Assign Classes Now</span>
          </button>
        </div>
      ) : (
        <>
          {/* 3. Cards Grid */}
          <div className="teacher-class-grid">
            {filteredClasses.map((item) => (
              <ClassCard
                key={item.assignmentId || item.classId}
                item={item}
                onViewTimetable={onViewTimetable}
                onUnassign={(target) => setUnassignTarget(target)}
              />
            ))}
          </div>

          {/* 4. Allocation Summary Table */}
          <div className="campus-table-container" style={{ border: "1px solid #e4e4e7", borderRadius: "8px", marginTop: "8px" }}>
            <div className="campus-toolbar" style={{ borderBottom: "1px solid #e4e4e7", background: "#ffffff" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#09090b" }}>
                Academic Allocation Summary
              </span>
              <div className="toolbar-search" style={{ width: "200px" }}>
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Filter classes or subjects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Table className="campus-table">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "22%" }}>Class / Section</TableHead>
                  <TableHead style={{ width: "22%" }}>Subject</TableHead>
                  <TableHead style={{ width: "16%", textAlign: "center" }}>Periods / Week</TableHead>
                  <TableHead style={{ width: "16%", textAlign: "center" }}>Enrolled</TableHead>
                  <TableHead style={{ width: "14%", textAlign: "center" }}>Role</TableHead>
                  <TableHead style={{ width: "10%", textAlign: "right" }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((row) => (
                  <TableRow key={row.assignmentId || row.classId}>
                    <TableCell className="font-bold text-zinc-900">
                      {row.className}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-zinc-800">{row.subject}</span>
                      {row.subjectCode && (
                        <span className="text-[10px] text-zinc-400 block font-mono">
                          {row.subjectCode}
                        </span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: "center", fontWeight: "600" }}>
                      {row.periodsPerWeek}
                    </TableCell>
                    <TableCell style={{ textAlign: "center", color: "#71717a" }}>
                      {row.studentCount} Students
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      {row.isClassTeacher ? (
                        <span className="campus-status-pill status-active" style={{ fontSize: "10px" }}>
                          <Award size={10} style={{ display: "inline", marginRight: "3px" }} />
                          Class Incharge
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#71717a" }}>Subject Teacher</span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setUnassignTarget(row)}
                        className="table-icon-btn delete"
                        style={{ height: "26px", width: "auto", padding: "0 6px", fontSize: "11px", gap: "4px" }}
                        title="Unassign Class"
                      >
                        <Trash2 size={12} />
                        <span>Unassign</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Dialogs */}
      <AssignClassDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onAssign={onAssignClass}
        teacherName={teacherName}
      />

      <UnassignClassDialog
        open={Boolean(unassignTarget)}
        onClose={() => setUnassignTarget(null)}
        assignment={unassignTarget}
        teacherName={teacherName}
        onConfirm={onUnassignClass}
      />
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  Calculator,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Edit,
  Trophy,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import StudentResultDetailModal from "./StudentResultDetailModal";

export default function ClassResultGrid({
  gridData,
  onCompile,
  onSubmitForApproval,
  onRemindTeacher,
  onSaveRemarks,
  isCompiling,
  isSubmitting,
}) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!gridData) {
    return (
      <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
        <Spinner size="sm" /> Loading class marks matrix...
      </div>
    );
  }

  const {
    classInfo,
    examName,
    term,
    status = "Draft",
    rejectionReason,
    completeness = {},
    subjects = [],
    students = [],
  } = gridData;

  const isPendingApproval = status === "Pending Approval";
  const isApproved = status === "Approved";
  const isPublished = status === "Published";
  const isRejected = status === "Rejected";

  const handleOpenStudentModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "Published":
        return (
          <span
            className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
            style={{ padding: "4px 10px" }}
          >
            Published
          </span>
        );
      case "Approved":
        return (
          <span
            className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
            style={{ padding: "4px 10px" }}
          >
            Approved
          </span>
        );
      case "Pending Approval":
        return (
          <span
            className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
            style={{ padding: "4px 10px" }}
          >
            Pending Approval
          </span>
        );
      case "Rejected":
        return (
          <span
            className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
            style={{ padding: "4px 10px" }}
          >
            Revision Requested
          </span>
        );
      default:
        return (
          <span
            className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
            style={{ padding: "4px 10px" }}
          >
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <Card className="bg-white border border-neutral-200 text-neutral-900 rounded-xl shadow-xs overflow-hidden">
        <CardHeader
          className="bg-neutral-50/50 border-b border-neutral-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          style={{ padding: "20px 24px" }}
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-neutral-900 m-0">
                    {classInfo?.className} — {examName}
                  </h3>
                  {getStatusBadge()}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 m-0">
                  Term: <span className="text-neutral-800 font-medium">{term}</span> • {students.length} Students • {subjects.length} Subjects
                </p>
              </div>
            </div>

            {isRejected && rejectionReason && (
              <div
                className="mt-3 rounded-lg bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs flex items-center gap-2"
                style={{ padding: "10px 14px" }}
              >
                <AlertTriangle size={15} className="shrink-0 text-neutral-600" />
                <span>
                  <strong>Admin Note:</strong> {rejectionReason}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {completeness.pendingTeachers?.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  completeness.pendingTeachers.forEach((pt) => {
                    if (pt.teacherUserId) onRemindTeacher(pt.teacherUserId, pt.subject);
                  });
                }}
                className="border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs flex items-center gap-1.5"
              >
                <BellRing size={13} /> Remind Pending Teachers ({completeness.pendingTeachers.length})
              </Button>
            )}

            {!isPublished && (
              <>
                <Button
                  size="sm"
                  onClick={onCompile}
                  disabled={isCompiling || isPendingApproval}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {isCompiling ? (
                    <>
                      <Spinner size="sm" /> Compiling...
                    </>
                  ) : (
                    <>
                      <Calculator size={13} /> Compile Results & Ranks
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={onSubmitForApproval}
                  disabled={isSubmitting || isPendingApproval || isApproved}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" /> Submitting...
                    </>
                  ) : isPendingApproval ? (
                    <>
                      <CheckCircle2 size={13} /> Submitted for Approval
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Submit for Approval
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {/* Completeness Bar */}
        <CardContent style={{ padding: "16px 24px" }}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="font-medium text-neutral-700 flex items-center gap-2">
                Marks Entry Progress:{" "}
                <strong className="text-neutral-900">
                  {completeness.enteredCells || 0} / {completeness.totalCells || 0} entered
                </strong>
              </span>
              <span className="font-semibold text-neutral-800">
                {completeness.percentage || 0}% Complete
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
              <div
                className="bg-neutral-800 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completeness.percentage || 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Matrix Table */}
      <Card className="bg-white border border-neutral-200 text-neutral-900 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50/50 text-neutral-500 text-[10.5px] uppercase tracking-wider font-bold border-b border-neutral-200">
              <tr>
                <th style={{ padding: "12px 16px" }} className="w-12 text-center">#</th>
                <th style={{ padding: "12px 16px" }} className="min-w-[180px]">Student</th>
                <th style={{ padding: "12px 16px" }}>Roll No</th>
                {subjects.map((sub) => (
                  <th key={sub.id || sub.name} style={{ padding: "12px 16px" }} className="text-center min-w-[90px]">
                    <div className="font-bold text-neutral-900 truncate">{sub.name}</div>
                    <div className="text-[10px] text-neutral-400 lowercase font-normal">/ 100</div>
                  </th>
                ))}
                <th style={{ padding: "12px 16px" }} className="text-center font-bold text-neutral-900">Total</th>
                <th style={{ padding: "12px 16px" }} className="text-center font-bold text-neutral-900">%</th>
                <th style={{ padding: "12px 16px" }} className="text-center font-bold text-neutral-900">Grade</th>
                <th style={{ padding: "12px 16px" }} className="text-center font-bold text-neutral-900">Rank</th>
                <th style={{ padding: "12px 16px" }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {students.map((student, idx) => {
                return (
                  <tr
                    key={student.studentId || idx}
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    <td style={{ padding: "12px 16px" }} className="text-center text-neutral-400 font-mono">
                      {idx + 1}
                    </td>
                    <td style={{ padding: "12px 16px" }} className="font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {(student.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px]">{student.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }} className="font-mono text-neutral-600 font-medium">
                      {student.rollNo || "—"}
                    </td>

                    {/* Subject cells */}
                    {student.subjects?.map((sub, sIdx) => {
                      const isPending = sub.status === "Pending";
                      const isAbsent = sub.status === "Absent";
                      return (
                        <td
                          key={sIdx}
                          style={{ padding: "12px 16px" }}
                          className="text-center font-mono font-medium"
                        >
                          {isPending ? (
                            <span
                              className="inline-flex items-center justify-center rounded bg-neutral-100 text-neutral-500 border border-neutral-200 font-medium text-[11px]"
                              style={{ padding: "2px 8px" }}
                              title="Missing marks from subject teacher"
                            >
                              --
                            </span>
                          ) : isAbsent ? (
                            <span
                              className="inline-flex items-center justify-center rounded bg-neutral-100 text-neutral-500 border border-neutral-200 text-[11px]"
                              style={{ padding: "2px 8px" }}
                              title="Absent for exam"
                            >
                              Abs
                            </span>
                          ) : (
                            <span className="font-semibold text-neutral-900">
                              {sub.marks}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Aggregate stats */}
                    <td style={{ padding: "12px 16px" }} className="text-center font-bold text-neutral-900 font-mono">
                      {student.obtainedMarks || 0}
                    </td>
                    <td style={{ padding: "12px 16px" }} className="text-center font-bold text-neutral-800 font-mono">
                      {student.percentage || 0}%
                    </td>
                    <td style={{ padding: "12px 16px" }} className="text-center">
                      <span
                        className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 font-semibold text-xs"
                        style={{ padding: "4px 8px" }}
                      >
                        {student.overallGrade || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }} className="text-center">
                      {student.classRank ? (
                        <span className="inline-flex items-center gap-1 font-bold text-neutral-900 text-xs">
                          <Trophy size={12} className="text-neutral-500" /> #{student.classRank}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px" }} className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenStudentModal(student)}
                        className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs h-7 px-2.5 flex items-center gap-1"
                      >
                        <Edit size={12} /> Remarks
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Result Detail & Remarks Modal */}
      {selectedStudent && (
        <StudentResultDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          student={selectedStudent}
          examName={examName}
          term={term}
          className={classInfo?.className}
          onSaveRemarks={async (remarks) => {
            if (onSaveRemarks) {
              await onSaveRemarks(selectedStudent.studentId, remarks);
            }
          }}
        />
      )}
    </div>
  );
}

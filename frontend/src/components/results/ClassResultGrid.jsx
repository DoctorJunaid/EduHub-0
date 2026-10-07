import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Award,
  BellRing,
  Calculator,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Edit,
  Eye,
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
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✅ Published</Badge>;
      case "Approved":
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30">✓ Approved</Badge>;
      case "Pending Approval":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">⏳ Pending Approval</Badge>;
      case "Rejected":
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">⚠️ Revision Requested</Badge>;
      default:
        return <Badge className="bg-slate-700 text-slate-300">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <Card className="bg-slate-900/90 border border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-800/40 border-b border-slate-800/80 p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-white">
                    {classInfo?.className} — {examName}
                  </h3>
                  {getStatusBadge()}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Term: <span className="text-indigo-300 font-medium">{term}</span> • {students.length} Students • {subjects.length} Subjects
                </p>
              </div>
            </div>

            {isRejected && rejectionReason && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>
                  <strong>Admin Note:</strong> {rejectionReason}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {completeness.pendingTeachers?.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  completeness.pendingTeachers.forEach((pt) => {
                    if (pt.teacherUserId) onRemindTeacher(pt.teacherUserId, pt.subject);
                  });
                }}
                className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs flex items-center gap-1.5"
              >
                <BellRing size={14} /> Remind All Pending Teachers ({completeness.pendingTeachers.length})
              </Button>
            )}

            {!isPublished && (
              <>
                <Button
                  size="sm"
                  onClick={onCompile}
                  disabled={isCompiling || isPendingApproval}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {isCompiling ? (
                    <>
                      <Spinner size="sm" /> Compiling...
                    </>
                  ) : (
                    <>
                      <Calculator size={14} /> Compile Results & Ranks
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={onSubmitForApproval}
                  disabled={isSubmitting || isPendingApproval || isApproved}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" /> Submitting...
                    </>
                  ) : isPendingApproval ? (
                    <>
                      <CheckCircle2 size={14} /> Submitted for Approval
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Submit for Approval
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {/* Completeness Bar */}
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-300 flex items-center gap-2">
                Marks Entry Progress:{" "}
                <strong className="text-white">
                  {completeness.enteredCells || 0} / {completeness.totalCells || 0} entered
                </strong>
              </span>
              <span className="font-bold text-indigo-400">
                {completeness.percentage || 0}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completeness.percentage || 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks Matrix Table */}
      <Card className="bg-slate-900/90 border border-slate-800 text-white rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5 min-w-[180px]">Student</th>
                <th className="px-3 py-3.5">Roll No</th>
                {subjects.map((sub) => (
                  <th key={sub.id || sub.name} className="px-3 py-3.5 text-center min-w-[90px]">
                    <div className="font-bold text-white truncate">{sub.name}</div>
                    <div className="text-[10px] text-slate-500 lowercase font-normal">/ 100</div>
                  </th>
                ))}
                <th className="px-3 py-3.5 text-center font-bold text-white">Total</th>
                <th className="px-3 py-3.5 text-center font-bold text-white">%</th>
                <th className="px-3 py-3.5 text-center font-bold text-white">Grade</th>
                <th className="px-3 py-3.5 text-center font-bold text-amber-400">Rank</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.map((student, idx) => {
                return (
                  <tr
                    key={student.studentId || idx}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {(student.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px]">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-indigo-300">
                      {student.rollNo || "—"}
                    </td>

                    {/* Subject cells */}
                    {student.subjects?.map((sub, sIdx) => {
                      const isPending = sub.status === "Pending";
                      const isAbsent = sub.status === "Absent";
                      return (
                        <td
                          key={sIdx}
                          className="px-3 py-3 text-center font-mono font-medium"
                        >
                          {isPending ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[11px]" title="Missing marks from subject teacher">
                              -- ❌
                            </span>
                          ) : isAbsent ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-700/60 text-slate-400 text-[11px]" title="Absent for exam">
                              Abs
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                              {sub.marks} ✅
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Aggregate stats */}
                    <td className="px-3 py-3 text-center font-bold text-white font-mono">
                      {student.obtainedMarks || 0}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-indigo-300 font-mono">
                      {student.percentage || 0}%
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/30 font-bold px-2 py-0.5 text-xs">
                        {student.overallGrade || "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {student.classRank ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400 text-xs">
                          <Trophy size={12} /> #{student.classRank}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenStudentModal(student)}
                        className="text-indigo-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs h-7 px-2.5 flex items-center gap-1"
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

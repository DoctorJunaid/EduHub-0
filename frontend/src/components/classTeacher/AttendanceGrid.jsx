import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Search,
  RotateCcw,
  CheckCheck,
  Save,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function AttendanceGrid({
  students = [],
  initialAttendance = [],
  onSave,
  saving = false,
  _dateStr,
  _className,
}) {
  const [attendanceState, setAttendanceState] = useState({});
  const [remarksState, setRemarksState] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const stateMap = {};
    const notesMap = {};

    // Initialize with existing attendance or default to "Present"
    students.forEach((s) => {
      const sId = s._id || s.studentId || s.id;
      const existing = initialAttendance.find(
        (a) => (a.studentId || a._id || a.id) === sId
      );
      stateMap[sId] = existing ? existing.status : "Present";
      notesMap[sId] = existing ? existing.remarks || "" : "";
    });

    setAttendanceState(stateMap);
    setRemarksState(notesMap);
  }, [students, initialAttendance]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleRemarkChange = (studentId, note) => {
    setRemarksState((prev) => ({
      ...prev,
      [studentId]: note,
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    students.forEach((s) => {
      const sId = s._id || s.studentId || s.id;
      updated[sId] = "Present";
    });
    setAttendanceState(updated);
  };

  const handleReset = () => {
    const updated = {};
    students.forEach((s) => {
      const sId = s._id || s.studentId || s.id;
      updated[sId] = "Present";
    });
    setAttendanceState(updated);
    setRemarksState({});
  };

  const handleSave = () => {
    const records = students.map((s) => {
      const sId = s._id || s.studentId || s.id;
      return {
        studentId: sId,
        status: attendanceState[sId] || "Present",
        remarks: remarksState[sId] || "",
      };
    });
    if (onSave) onSave(records);
  };

  // Summary counts
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  Object.values(attendanceState).forEach((st) => {
    if (st === "Present") present++;
    else if (st === "Absent") absent++;
    else if (st === "Late") late++;
    else if (st === "Excused" || st === "On Leave") excused++;
  });

  const total = students.length;
  const percentage =
    total > 0 ? Math.round(((present + late) / total) * 100) : 100;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = (s.name || "").toLowerCase();
    const roll = (s.rollNo || s.rollNumber || "").toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-neutral-200 rounded-xl"
        style={{ padding: "14px 20px", gap: "12px", boxSizing: "border-box" }}
      >
        <div className="flex items-center w-full sm:w-auto" style={{ gap: "10px" }}>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0"
            style={{
              height: "38px",
              padding: "0 16px",
              gap: "6px",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            <CheckCheck className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0"
            style={{
              height: "38px",
              padding: "0 14px",
              gap: "6px",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span>Reset</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 rounded-lg text-xs focus:outline-none focus:border-neutral-500"
            style={{ height: "38px", paddingLeft: "36px", paddingRight: "12px", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Attendance Table / Grid */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead className="bg-neutral-50/50 text-neutral-500 text-[10.5px] uppercase tracking-wider font-bold border-b border-neutral-200">
              <tr>
                <th style={{ padding: "12px 16px" }} className="w-12 text-center">#</th>
                <th style={{ padding: "12px 16px" }}>Student Details</th>
                <th style={{ padding: "12px 16px" }}>Roll No</th>
                <th style={{ padding: "12px 16px" }} className="text-center">Attendance Status</th>
                <th style={{ padding: "12px 16px" }}>Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "32px 16px" }} className="text-center text-neutral-400 text-xs">
                    No students found in this roster.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const sId = student._id || student.studentId || student.id;
                  const currentStatus = attendanceState[sId] || "Present";
                  const currentRemark = remarksState[sId] || "";

                  return (
                    <tr
                      key={sId}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td style={{ padding: "12px 16px" }} className="text-neutral-400 font-mono text-center text-xs">
                        {idx + 1}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.avatar ? (
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full rounded-lg object-cover"
                              />
                            ) : (
                              (student.name || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 text-xs">
                              {student.name || "Student"}
                            </div>
                            {student.email && (
                              <div className="text-[11px] text-neutral-500">
                                {student.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }} className="font-mono text-xs text-neutral-700 font-medium">
                        {student.rollNo || student.rollNumber || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="flex items-center justify-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 max-w-fit mx-auto">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Present")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              currentStatus === "Present"
                                ? "bg-neutral-900 text-white shadow-2xs"
                                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                            }`}
                          >
                            <CheckCircle2 size={12} /> Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Absent")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              currentStatus === "Absent"
                                ? "bg-neutral-700 text-white shadow-2xs"
                                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                            }`}
                          >
                            <XCircle size={12} /> Absent
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Late")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              currentStatus === "Late"
                                ? "bg-neutral-600 text-white shadow-2xs"
                                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                            }`}
                          >
                            <Clock size={12} /> Late
                          </button>

                          {/* Excused */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Excused")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              currentStatus === "Excused" || currentStatus === "On Leave"
                                ? "bg-neutral-500 text-white shadow-2xs"
                                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                            }`}
                          >
                            <HelpCircle size={12} /> Excused
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Input
                          placeholder="e.g. Leave or medical reason"
                          value={currentRemark}
                          onChange={(e) => handleRemarkChange(sId, e.target.value)}
                          className="bg-white border-neutral-300 text-neutral-900 text-xs rounded-lg h-8 placeholder:text-neutral-400"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Floating/Fixed Summary Bar */}
        <div
          className="bg-neutral-50 border-t border-neutral-200 flex flex-col md:flex-row items-stretch md:items-center justify-between"
          style={{ padding: "16px 20px", gap: "14px", boxSizing: "border-box" }}
        >
          <div className="flex flex-wrap items-center text-xs" style={{ gap: "8px" }}>
            <span className="text-neutral-500 font-semibold uppercase text-[10.5px] tracking-wider">Summary:</span>
            <span
              className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium text-xs"
              style={{ padding: "4px 10px" }}
            >
              {present} Present
            </span>
            <span
              className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium text-xs"
              style={{ padding: "4px 10px" }}
            >
              {absent} Absent
            </span>
            <span
              className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium text-xs"
              style={{ padding: "4px 10px" }}
            >
              {late} Late
            </span>
            <span
              className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 font-medium text-xs"
              style={{ padding: "4px 10px" }}
            >
              {excused} Excused
            </span>
            <span className="text-neutral-600 font-medium ml-1">
              Attendance Rate: <strong className="text-neutral-900">{percentage}%</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
            style={{
              height: "38px",
              padding: "0 18px",
              gap: "8px",
              minWidth: "fit-content",
              boxSizing: "border-box",
            }}
          >
            {saving ? (
              <>
                <Spinner size="sm" />
                <span>Saving Attendance...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

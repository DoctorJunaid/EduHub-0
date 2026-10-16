import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl"
        style={{ padding: "16px 20px", boxSizing: "border-box" }}
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={handleMarkAllPresent}
            className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <CheckCheck size={14} /> Mark All Present
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={15} />
          <Input
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 rounded-lg text-xs h-9"
          />
        </div>
      </div>

      {/* Attendance Table / Grid */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
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
          className="bg-neutral-50 border-t border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ padding: "14px 20px" }}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
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

          <Button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-5 py-2 rounded-lg text-xs shadow-xs flex items-center gap-2"
          >
            {saving ? (
              <>
                <Spinner size="sm" /> Saving Attendance...
              </>
            ) : (
              <>
                <Save size={14} /> Save Attendance
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

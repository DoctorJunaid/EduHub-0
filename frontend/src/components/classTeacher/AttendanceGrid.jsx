import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  dateStr,
  className,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={handleMarkAllPresent}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <CheckCheck size={15} /> Mark All Present
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <Input
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs h-9"
          />
        </div>
      </div>

      {/* Attendance Table / Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 w-16">#</th>
                <th className="px-5 py-3.5">Student Details</th>
                <th className="px-5 py-3.5">Roll No</th>
                <th className="px-5 py-3.5 text-center">Attendance Status</th>
                <th className="px-5 py-3.5">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No students found.
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
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {student.avatar ? (
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              (student.name || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">
                              {student.name || "Student"}
                            </div>
                            {student.email && (
                              <div className="text-xs text-slate-400">
                                {student.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-indigo-300 font-semibold">
                        {student.rollNo || student.rollNumber || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 max-w-fit mx-auto">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Present")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === "Present"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                : "text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50"
                            }`}
                          >
                            <CheckCircle2 size={13} /> Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Absent")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === "Absent"
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                : "text-slate-400 hover:text-rose-400 hover:bg-slate-700/50"
                            }`}
                          >
                            <XCircle size={13} /> Absent
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Late")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === "Late"
                                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                                : "text-slate-400 hover:text-amber-400 hover:bg-slate-700/50"
                            }`}
                          >
                            <Clock size={13} /> Late
                          </button>

                          {/* Excused */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sId, "Excused")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              currentStatus === "Excused" || currentStatus === "On Leave"
                                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                                : "text-slate-400 hover:text-sky-400 hover:bg-slate-700/50"
                            }`}
                          >
                            <HelpCircle size={13} /> Excused
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Input
                          placeholder="e.g. Doctor appointment"
                          value={currentRemark}
                          onChange={(e) => handleRemarkChange(sId, e.target.value)}
                          className="bg-slate-800/70 border-slate-700/80 text-white text-xs rounded-lg h-8 placeholder:text-slate-500"
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
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Summary:</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-2.5 py-1">
              ✅ {present} Present
            </Badge>
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 px-2.5 py-1">
              ❌ {absent} Absent
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-2.5 py-1">
              🟡 {late} Late
            </Badge>
            <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 px-2.5 py-1">
              🔵 {excused} Excused
            </Badge>
            <span className="text-slate-400">
              Overall Rate: <strong className="text-white">{percentage}%</strong>
            </span>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Spinner size="sm" /> Saving Attendance...
              </>
            ) : (
              <>
                <Save size={16} /> Save Attendance
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

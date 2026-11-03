import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Search,
  RotateCcw,
  CheckCheck,
  Save,
  ShieldCheck,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { normalizeImageUrl } from "@/utils/imageUrl";

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

    // Initialize with verified saved records or QR/gate scan. DO NOT default to "Present"!
    students.forEach((s) => {
      const sId = String(s._id || s.studentId || s.id);
      const existing = initialAttendance.find((a) => {
        const aId = String(a.studentId?._id || a.studentId || a._id || a.id);
        return aId === sId;
      });

      const isGateCheckedIn = Boolean(
        s.gateCheckedIn ||
        s.entryTime ||
        existing?.gateCheckedIn ||
        existing?.entryTime ||
        existing?.method === "gate_kiosk" ||
        existing?.method === "qr_scan"
      );

      let status = "";
      let remarks = "";

      if (
        existing &&
        existing.isMarked !== false &&
        existing.status &&
        existing.status !== "Not Marked"
      ) {
        status = existing.status;
        remarks = existing.remarks || "";
      } else if (isGateCheckedIn) {
        const isLate = s.isLateArrival || existing?.isLateArrival;
        status = isLate ? "Late" : "Present";
        remarks = existing?.remarks || s.remarks || "Recorded via QR Code Scan";
      }

      stateMap[sId] = status;
      notesMap[sId] = remarks;
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
      const sId = String(s._id || s.studentId || s.id);
      updated[sId] = "Present";
    });
    setAttendanceState(updated);
  };

  const handleReset = () => {
    const stateMap = {};
    const notesMap = {};

    students.forEach((s) => {
      const sId = String(s._id || s.studentId || s.id);
      const existing = initialAttendance.find((a) => {
        const aId = String(a.studentId?._id || a.studentId || a._id || a.id);
        return aId === sId;
      });

      const isGateCheckedIn = Boolean(
        s.gateCheckedIn ||
        s.entryTime ||
        existing?.gateCheckedIn ||
        existing?.entryTime ||
        existing?.method === "gate_kiosk" ||
        existing?.method === "qr_scan"
      );

      let status = "";
      let remarks = "";

      // Preserve verified QR / Gate scan records if present
      if (isGateCheckedIn) {
        const isLate = s.isLateArrival || existing?.isLateArrival;
        status = isLate ? "Late" : "Present";
        remarks = existing?.remarks || s.remarks || "Recorded via QR Code Scan";
      }

      stateMap[sId] = status;
      notesMap[sId] = remarks;
    });

    setAttendanceState(stateMap);
    setRemarksState(notesMap);
    toast.success("Attendance selections reset to unmarked.");
  };

  const handleSave = () => {
    const records = [];
    students.forEach((s) => {
      const sId = String(s._id || s.studentId || s.id);
      const st = (attendanceState[sId] || "").trim();
      if (st) {
        records.push({
          studentId: sId,
          status: st,
          remarks: remarksState[sId] || "",
        });
      }
    });

    if (records.length === 0) {
      toast.error("Please mark attendance for at least one student before saving.");
      return;
    }

    if (onSave) onSave(records);
  };

  // Summary counts
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  let markedCount = 0;

  students.forEach((s) => {
    const sId = String(s._id || s.studentId || s.id);
    const st = (attendanceState[sId] || "").trim().toLowerCase();
    if (st === "present") {
      present++;
      markedCount++;
    } else if (st === "absent") {
      absent++;
      markedCount++;
    } else if (st === "late") {
      late++;
      markedCount++;
    } else if (st === "excused" || st === "on leave") {
      excused++;
      markedCount++;
    }
  });

  const unmarked = Math.max(0, students.length - markedCount);
  const percentage =
    students.length > 0 && markedCount > 0
      ? Math.round(((present + late) / students.length) * 100)
      : 0;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = (s.name || "").toLowerCase();
    const roll = (s.rollNo || s.rollNumber || "").toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Top action toolbar */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-neutral-200 rounded-xl shadow-xs"
        style={{ padding: "14px 20px", gap: "12px", boxSizing: "border-box" }}
      >
        <div className="flex items-center w-full sm:w-auto" style={{ gap: "10px" }}>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0 cursor-pointer"
            style={{
              height: "36px",
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
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs shrink-0 cursor-pointer"
            style={{
              height: "36px",
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
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 rounded-lg text-xs focus:outline-none focus:border-neutral-500 transition-colors"
            style={{
              height: "36px",
              paddingLeft: "36px",
              paddingRight: "12px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Attendance Table / Grid */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead className="bg-neutral-50/50 text-neutral-500 text-[10.5px] uppercase tracking-wider font-bold border-b border-neutral-200">
              <tr>
                <th style={{ padding: "12px 16px" }} className="w-12 text-center align-middle">
                  #
                </th>
                <th style={{ padding: "12px 16px" }} className="align-middle">
                  Student Details
                </th>
                <th style={{ padding: "12px 16px" }} className="align-middle">
                  Roll No
                </th>
                <th style={{ padding: "12px 16px" }} className="text-center align-middle">
                  Attendance Status
                </th>
                <th style={{ padding: "12px 16px" }} className="align-middle">
                  Remarks (Optional)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "32px 16px" }}
                    className="text-center text-neutral-400 text-xs"
                  >
                    No students found in this roster.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const sId = String(student._id || student.studentId || student.id);
                  const currentStatus = attendanceState[sId] || "";
                  const currentRemark = remarksState[sId] || "";
                  const existing = initialAttendance.find((a) => {
                    const aId = String(a.studentId?._id || a.studentId || a._id || a.id);
                    return aId === sId;
                  });

                  const gateInfo =
                    student.gateCheckedIn || student.entryTime
                      ? { entryTime: student.entryTime, isLateArrival: student.isLateArrival }
                      : existing && (existing.method === "gate_kiosk" || existing.method === "qr_scan" || existing.entryTime)
                      ? { entryTime: existing.entryTime, isLateArrival: existing.isLateArrival }
                      : null;

                  return (
                    <tr
                      key={sId}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td
                        style={{ padding: "14px 16px" }}
                        className="text-neutral-400 font-mono text-center text-xs align-middle"
                      >
                        {idx + 1}
                      </td>
                      <td style={{ padding: "14px 16px" }} className="align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {student.avatar ? (
                              <img
                                src={normalizeImageUrl(student.avatar)}
                                alt={student.name}
                                className="w-full h-full rounded-lg object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (student.name || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5 flex-wrap">
                              <span>{student.name || "Student"}</span>
                              {gateInfo && (
                                <span
                                  className={`inline-flex items-center rounded-md border text-[11px] font-medium ${
                                    gateInfo.isLateArrival
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}
                                  style={{ padding: "2px 8px", gap: "4px" }}
                                  title={`Checked in at school gate via kiosk at ${
                                    gateInfo.entryTime || "morning"
                                  }${gateInfo.isLateArrival ? " (Late arrival)" : ""}`}
                                >
                                  <ShieldCheck size={11} className="shrink-0" />
                                  <span>Gate: {gateInfo.entryTime || "11:33 AM"}</span>
                                </span>
                              )}
                            </div>
                            {student.email && (
                              <div className="text-[11px] text-neutral-500">
                                {student.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{ padding: "14px 16px" }}
                        className="font-mono text-xs text-neutral-700 font-medium align-middle"
                      >
                        {student.rollNo || student.rollNumber || "—"}
                      </td>
                      <td
                        style={{ padding: "14px 16px" }}
                        className="align-middle text-center"
                      >
                        <div
                          className="inline-flex items-center justify-center flex-nowrap"
                          style={{ gap: "8px" }}
                        >
                          {[
                            { key: "Present", label: "Present", icon: CheckCircle2 },
                            { key: "Absent", label: "Absent", icon: XCircle },
                            { key: "Late", label: "Late", icon: Clock },
                            { key: "Excused", label: "Excused", icon: HelpCircle },
                          ].map(({ key, label, icon: Icon }) => {
                            const isSelected =
                              currentStatus?.toLowerCase() === key.toLowerCase();
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => handleStatusChange(sId, key)}
                                className={`inline-flex items-center justify-center rounded-lg border text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                                  isSelected
                                    ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
                                }`}
                                style={{
                                  height: "30px",
                                  padding: "0 10px",
                                  gap: "5px",
                                  boxSizing: "border-box",
                                }}
                              >
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? "text-white" : "text-neutral-400"
                                  }`}
                                />
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }} className="align-middle">
                        <input
                          type="text"
                          placeholder="e.g. Leave or medical reason"
                          value={currentRemark}
                          onChange={(e) => handleRemarkChange(sId, e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 focus:bg-white text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors"
                          style={{
                            height: "34px",
                            padding: "0 12px",
                            minWidth: "200px",
                            boxSizing: "border-box",
                          }}
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
          className="w-full border-t border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between"
          style={{
            padding: "16px 24px",
            paddingRight: "80px",
            gap: "16px",
            boxSizing: "border-box",
          }}
        >
          <div className="flex flex-wrap items-center text-xs" style={{ gap: "8px" }}>
            <span className="text-neutral-500 font-semibold uppercase text-[10.5px] tracking-wider">
              Summary:
            </span>
            <span
              className="rounded-md bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-2xs"
              style={{ padding: "4px 10px" }}
            >
              {present} Present
            </span>
            <span
              className="rounded-md bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-2xs"
              style={{ padding: "4px 10px" }}
            >
              {absent} Absent
            </span>
            <span
              className="rounded-md bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-2xs"
              style={{ padding: "4px 10px" }}
            >
              {late} Late
            </span>
            <span
              className="rounded-md bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-2xs"
              style={{ padding: "4px 10px" }}
            >
              {excused} Excused
            </span>
            {unmarked > 0 && (
              <span
                className="rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600"
                style={{ padding: "4px 10px" }}
              >
                {unmarked} Unmarked
              </span>
            )}
            <span className="text-neutral-600 font-medium ml-1">
              Attendance Rate: <strong className="text-neutral-900">{percentage}%</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
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

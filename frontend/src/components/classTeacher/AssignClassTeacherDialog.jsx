import { useState, useEffect } from "react";
import { UserCheck, Search, X, CheckCircle2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/api/axiosInstance";
import * as classTeacherApi from "@/api/classTeacher.api";
import toast from "react-hot-toast";

export default function AssignClassTeacherDialog({
  isOpen,
  onClose,
  classSection,
  onSuccess,
}) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("Assigned for 2026-2027 academic year");

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
      setSelectedTeacherId(classSection?.classTeacher?._id || classSection?.classTeacherId || "");
    }
  }, [isOpen, classSection]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/campus/faculty?limit=100");
      const list = res.data?.faculty || res.data?.teachers || res.data?.data || res.data || [];
      setTeachers(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load teachers list");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedTeacherId) {
      toast.error("Please select a teacher to assign");
      return;
    }

    setSubmitting(true);
    try {
      const classId = classSection?.classId || classSection?._id;
      const targetTeacher = teachers.find(
        (t) => (t._id || t.id) === selectedTeacherId || t.profileId === selectedTeacherId
      );
      const profileId = targetTeacher?.profileId || targetTeacher?.teacherProfileId || selectedTeacherId;

      const res = await classTeacherApi.assignClassTeacher(
        classId,
        profileId,
        assignmentNote
      );
      toast.success(res.message || "Class Teacher assigned successfully!");
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to assign class teacher");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredTeachers = teachers.filter((t) => {
    const name = t.name || t.user?.name || "";
    const email = t.email || t.user?.email || "";
    const dept = t.department || "";
    const q = teacherSearch.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  const selectedSectionName =
    classSection?.className ||
    `${classSection?.gradeName || "Class"} - ${classSection?.name || classSection?.sectionName || ""}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center"
      style={{ padding: "16px", boxSizing: "border-box" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Box — Clean White Enterprise Theme */}
      <div
        className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        style={{ boxSizing: "border-box" }}
      >
        {/* 1. Modal Header */}
        <div
          className="flex items-start justify-between border-b border-neutral-200 bg-white"
          style={{ padding: "20px 24px", gap: "12px", boxSizing: "border-box" }}
        >
          <div className="flex items-center" style={{ gap: "12px" }}>
            <div
              className="rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
              style={{ width: "40px", height: "40px" }}
            >
              <UserCheck className="w-5 h-5 text-neutral-700" />
            </div>
            <div className="flex flex-col" style={{ gap: "2px" }}>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                Assign Class Teacher
              </h3>
              <p className="text-xs text-neutral-500">
                Assign a dedicated Class Teacher for{" "}
                <span className="font-semibold text-neutral-900">
                  {selectedSectionName}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition-colors shrink-0"
            style={{ width: "32px", height: "32px" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Modal Body */}
        <div
          className="flex flex-col bg-white"
          style={{ padding: "20px 24px", gap: "16px", boxSizing: "border-box" }}
        >
          {/* Teacher Search Input (Fixed Left Padding & Single Clean Border) */}
          <div className="relative w-full">
            <Search
              className="w-4 h-4 text-neutral-400 absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: "12px" }}
            />
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="Search teacher by name, email, or department..."
              className="w-full rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
              style={{
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "12px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Selectable Teacher List (Clean Neutral Rows & Dark Avatars — NO Purple!) */}
          <div
            className="w-full border border-neutral-200 rounded-xl overflow-y-auto bg-white divide-y divide-neutral-100"
            style={{ maxHeight: "200px", boxSizing: "border-box" }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8 text-neutral-500 text-xs gap-2">
                <Spinner size="sm" /> Loading faculty directory...
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                No teachers found matching your search.
              </div>
            ) : (
              filteredTeachers.map((teacher) => {
                const tId = teacher._id || teacher.id || teacher.profileId;
                const isSelected = selectedTeacherId === tId;
                return (
                  <div
                    key={tId}
                    onClick={() => setSelectedTeacherId(tId)}
                    className={`w-full flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? "bg-neutral-100/90" : "bg-white hover:bg-neutral-50"
                    }`}
                    style={{ padding: "10px 14px", gap: "12px", boxSizing: "border-box" }}
                  >
                    <div className="flex items-center min-w-0" style={{ gap: "12px" }}>
                      <div
                        className="rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0"
                        style={{ width: "34px", height: "34px" }}
                      >
                        {teacher.name?.charAt(0)?.toUpperCase() || "T"}
                      </div>
                      <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {teacher.name}
                        </span>
                        <span className="text-[11px] text-neutral-500 truncate">
                          {teacher.department || "General Faculty"} • {teacher.email}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Assignment Note Field */}
          <div className="flex flex-col w-full" style={{ gap: "6px" }}>
            <label className="text-xs font-semibold text-neutral-700">
              Assignment Note / Academic Year (Optional)
            </label>
            <input
              type="text"
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              placeholder="Assigned for 2026-2027 academic year"
              className="w-full rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
              style={{
                height: "38px",
                padding: "0 12px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* 3. Modal Footer (Clean Neutral Buttons — NO Neon Blue Pill!) */}
        <div
          className="flex items-center justify-end border-t border-neutral-200 bg-neutral-50"
          style={{ padding: "14px 24px", gap: "10px", boxSizing: "border-box" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-medium text-neutral-700 transition-colors whitespace-nowrap"
            style={{ height: "36px", padding: "0 16px", boxSizing: "border-box" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmAssignment}
            disabled={submitting || !selectedTeacherId}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-colors shadow-xs whitespace-nowrap disabled:opacity-50"
            style={{ height: "36px", padding: "0 18px", boxSizing: "border-box" }}
          >
            {submitting ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

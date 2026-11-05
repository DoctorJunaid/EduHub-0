import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/spinner";
import { UserCheck, Search, Award, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [note, setNote] = useState("Assigned for 2026-2027 academic year");

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

  const handleAssign = async () => {
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
        note
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

  const filteredTeachers = teachers.filter((t) => {
    const name = t.name || t.user?.name || "";
    const email = t.email || t.user?.email || "";
    const dept = t.department || "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  const selectedTeacher = teachers.find(
    (t) => (t._id || t.id) === selectedTeacherId || (t.profileId === selectedTeacherId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg bg-white border border-neutral-200 text-neutral-900 rounded-2xl shadow-xl p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-start justify-between bg-white">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">
                Assign Class Teacher
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                Assign a dedicated Class Teacher for{" "}
                <span className="font-semibold text-neutral-800">
                  {classSection?.className || `${classSection?.gradeName || "Class"} - ${classSection?.name || classSection?.sectionName || ""}`}
                </span>
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 inline-flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-white">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search teacher by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-3 w-full rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors"
            />
          </div>

          {/* Teacher Selection List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
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
                const name = teacher.name || teacher.user?.name || "Teacher";
                const email = teacher.email || teacher.user?.email || "";
                const dept = teacher.department || "General Faculty";
                const isAssignedElsewhere =
                  teacher.isClassTeacher &&
                  teacher.classTeacherOf &&
                  String(teacher.classTeacherOf) !== String(classSection?._id || classSection?.classId);

                return (
                  <div
                    key={tId}
                    onClick={() => setSelectedTeacherId(tId)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-neutral-100/90 border-neutral-300 ring-1 ring-neutral-300 shadow-xs"
                        : "bg-neutral-50/50 border-neutral-200/80 hover:bg-neutral-100/60 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 truncate">
                            {name}
                          </span>
                          {isSelected && (
                            <Badge className="bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5 truncate">
                          <span className="truncate">{dept}</span>
                          {email && <span className="truncate">• {email}</span>}
                        </div>
                      </div>
                    </div>

                    {isAssignedElsewhere && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/60 text-[10px] px-1.5 py-0.5 rounded shrink-0">
                        Has other class
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
              Assignment Note / Academic Year (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Assigned for 2026-2027 academic year"
              className="w-full rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors"
            />
          </div>

          {selectedTeacher && (
            <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/70 flex items-start gap-3">
              <Award className="text-neutral-700 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-neutral-600 leading-relaxed">
                <span className="font-semibold text-neutral-900">
                  {selectedTeacher.name || selectedTeacher.user?.name}
                </span>{" "}
                will receive owner permissions to take daily attendance, review all subject marks, write report card remarks, and compile results for this class section.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-50/60 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="h-9 px-4 text-xs font-medium border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={submitting || !selectedTeacherId}
            className="h-9 px-4 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" /> Assigning...
              </>
            ) : (
              "Confirm Assignment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

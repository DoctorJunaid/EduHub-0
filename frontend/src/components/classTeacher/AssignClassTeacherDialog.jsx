import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/spinner";
import { UserCheck, Search, ShieldAlert, Award, Mail, Phone } from "lucide-react";
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
    } catch (err) {
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
      const res = await classTeacherApi.assignClassTeacher(
        classId,
        selectedTeacherId,
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
      <DialogContent className="max-w-xl bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UserCheck size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Assign Class Teacher
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Assign a dedicated Class Teacher for{" "}
                <span className="text-indigo-400 font-semibold">
                  {classSection?.className || `${classSection?.gradeName || "Class"} - ${classSection?.name || classSection?.sectionName || ""}`}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <Input
              type="text"
              placeholder="Search teacher by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl"
            />
          </div>

          {/* Teacher Selection List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Spinner size="sm" /> Loading faculty directory...
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
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
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md"
                        : "bg-slate-800/50 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {name}
                          </span>
                          {isSelected && (
                            <Badge className="bg-indigo-500 text-white text-xs px-1.5 py-0.5">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{dept}</span>
                          {email && <span>• {email}</span>}
                        </div>
                      </div>
                    </div>

                    {isAssignedElsewhere && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                        Has other class
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <Label className="text-xs text-slate-300 font-medium">
              Assignment Note / Academic Year (Optional)
            </Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Assigned for 2026-2027 Academic Session"
              className="bg-slate-800/80 border-slate-700 text-white rounded-xl text-sm"
            />
          </div>

          {selectedTeacher && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <Award className="text-indigo-400 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-slate-300">
                <span className="font-medium text-white">
                  {selectedTeacher.name || selectedTeacher.user?.name}
                </span>{" "}
                will receive owner permissions to take daily attendance, review all subject marks, write report card remarks, and compile results for this class section.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={submitting || !selectedTeacherId}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 rounded-xl shadow-lg shadow-indigo-600/30"
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" /> Assigning...
              </>
            ) : (
              "Confirm Assignment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

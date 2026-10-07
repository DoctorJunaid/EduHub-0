import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit,
  ShieldAlert,
} from "lucide-react";
import AssignClassTeacherDialog from "./AssignClassTeacherDialog";
import * as classTeacherApi from "@/api/classTeacher.api";
import toast from "react-hot-toast";

export default function ClassTeacherCard({
  classSection,
  onUpdate,
  canManage = true,
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const teacher = classSection?.classTeacher;
  const hasTeacher = !!teacher;

  const handleRemove = async () => {
    if (!window.confirm(`Are you sure you want to remove the Class Teacher for this class?`)) {
      return;
    }

    setIsRemoving(true);
    try {
      const classId = classSection?.classId || classSection?._id;
      const res = await classTeacherApi.removeClassTeacher(classId);
      toast.success(res.message || "Class teacher removed successfully");
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to remove class teacher");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Card className="bg-slate-900/90 border border-slate-800 text-white rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <CardHeader className="bg-slate-800/40 border-b border-slate-800/80 px-6 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <UserCheck size={20} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                Class Teacher
                {hasTeacher ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2 py-0.5">
                    Assigned
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5">
                    Unassigned
                  </Badge>
                )}
              </CardTitle>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              {hasTeacher ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDialogOpen(true)}
                    className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Edit size={14} /> Change
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Remove
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <UserPlus size={14} /> Assign Teacher
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {hasTeacher ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
                  {teacher.avatar ? (
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    teacher.name?.charAt(0).toUpperCase() || "T"
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    {teacher.name}
                  </h4>
                  <p className="text-xs text-indigo-300 font-medium">
                    {teacher.designation || "Senior Faculty"} • {teacher.department || "Academic Department"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                    {teacher.email && (
                      <span className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors">
                        <Mail size={13} className="text-slate-500" /> {teacher.email}
                      </span>
                    )}
                    {teacher.phone && (
                      <span className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors">
                        <Phone size={13} className="text-slate-500" /> {teacher.phone}
                      </span>
                    )}
                    {teacher.assignedAt && (
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={13} /> Assigned {new Date(teacher.assignedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {teacher.note && (
                <div className="w-full sm:w-auto p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 max-w-xs">
                  <span className="text-slate-400 font-medium block mb-0.5">Assignment Note:</span>
                  {teacher.note}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-slate-800/30 border border-dashed border-slate-700/80 rounded-2xl">
              <ShieldAlert className="mx-auto text-amber-400 mb-2" size={32} />
              <h5 className="font-semibold text-white text-base">
                No Class Teacher Assigned
              </h5>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Every class requires one designated Class Teacher responsible for daily attendance, student records, and report card compilation.
              </p>
              {canManage && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/30"
                >
                  <UserPlus size={16} className="mr-2" /> Assign Class Teacher Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignClassTeacherDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        classSection={classSection}
        onSuccess={() => {
          if (onUpdate) onUpdate();
        }}
      />
    </>
  );
}

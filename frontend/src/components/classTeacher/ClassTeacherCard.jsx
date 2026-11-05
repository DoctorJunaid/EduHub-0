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
      <Card className="bg-white border border-neutral-200 text-neutral-900 rounded-xl overflow-hidden shadow-none">
        <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 px-6 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                Class Teacher
                {hasTeacher ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5 font-medium">
                    Assigned
                  </Badge>
                ) : (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0.5 font-medium">
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
                    className="border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <Edit size={14} /> Change
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Remove
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-none"
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
                <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white text-base font-bold">
                  {teacher.avatar ? (
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    teacher.name?.charAt(0).toUpperCase() || "T"
                  )}
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    {teacher.name}
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium">
                    {teacher.designation || "Senior Faculty"} • {teacher.department || "Academic Department"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-500">
                    {teacher.email && (
                      <span className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
                        <Mail size={13} className="text-neutral-400" /> {teacher.email}
                      </span>
                    )}
                    {teacher.phone && (
                      <span className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
                        <Phone size={13} className="text-neutral-400" /> {teacher.phone}
                      </span>
                    )}
                    {teacher.assignedAt && (
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Calendar size={13} /> Assigned {new Date(teacher.assignedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {teacher.note && (
                <div className="w-full sm:w-auto p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 max-w-xs">
                  <span className="text-neutral-500 font-medium block mb-0.5">Assignment Note:</span>
                  {teacher.note}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl">
              <ShieldAlert className="mx-auto text-amber-500 mb-2" size={32} />
              <h5 className="font-semibold text-neutral-900 text-sm">
                No Class Teacher Assigned
              </h5>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                Every class requires one designated Class Teacher responsible for daily attendance, student records, and report card compilation.
              </p>
              {canManage && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium"
                >
                  <UserPlus size={14} className="mr-2" /> Assign Class Teacher Now
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

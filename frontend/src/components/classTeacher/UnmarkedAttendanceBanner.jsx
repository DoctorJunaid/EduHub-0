import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as classTeacherApi from "@/api/classTeacher.api";

export default function UnmarkedAttendanceBanner({ userRole }) {
  const [unmarkedData, setUnmarkedData] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (["campus_admin", "campus_manager", "principal", "institute_admin"].includes(userRole)) {
      classTeacherApi
        .getUnmarkedClassesToday()
        .then((res) => {
          if (res?.data?.unmarkedCount > 0) {
            setUnmarkedData(res.data);
          }
        })
        .catch(() => {});
    }
  }, [userRole]);

  if (dismissed || !unmarkedData || unmarkedData.unmarkedCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/10 border border-amber-500/40 rounded-2xl p-4 mb-6 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0">
          <ShieldAlert size={22} />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            Morning Attendance Alert
            <span className="bg-amber-500/30 text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {unmarkedData.unmarkedCount} {unmarkedData.unmarkedCount === 1 ? "Class" : "Classes"} Pending
            </span>
          </h4>
          <p className="text-xs text-amber-200/90 mt-0.5">
            The following class sections have not recorded student attendance for today:{" "}
            <span className="font-medium text-white">
              {unmarkedData.unmarkedClasses?.map((c) => c.className).join(", ")}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <Link to="/academics">
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-500/20"
          >
            Review Classes <ArrowRight size={13} />
          </Button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-amber-400/80 hover:text-white rounded-lg hover:bg-amber-500/20 transition-colors"
          title="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

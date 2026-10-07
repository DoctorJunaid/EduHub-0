import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ClipboardList,
  Award,
} from "lucide-react";

export default function MyClassWidget({ classInfo, attendance, loading }) {
  if (loading) {
    return (
      <Card className="bg-slate-900/80 border border-slate-800 rounded-2xl animate-pulse p-6">
        <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
      </Card>
    );
  }

  if (!classInfo) return null;

  const isMarkedToday = attendance?.isMarkedToday;
  const summary = attendance?.summary || {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: classInfo.studentCount || 0,
    percentage: 100,
  };

  return (
    <div className="relative group overflow-hidden rounded-3xl p-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/20 shadow-2xl transition-all duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-[22px] p-6 text-white border border-slate-800/80 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
              <GraduationCap size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-white tracking-tight">
                  My Class — {classInfo.className || "Class Section"}
                </h3>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5 font-bold">
                  Class Teacher
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <Users size={14} className="text-indigo-400" /> {classInfo.studentCount || summary.total || 0} Enrolled Students
                </span>
                <span>•</span>
                <span>Academic Session 2026–2027</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Link to="/teacher/my-class">
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs flex items-center gap-1.5"
              >
                <Users size={14} /> Class Hub
              </Button>
            </Link>
            <Link to="/teacher/my-class/results">
              <Button
                variant="outline"
                className="border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Award size={14} /> Class Results
              </Button>
            </Link>
            <Link to="/teacher/my-class/attendance">
              <Button
                className={`rounded-xl text-xs font-semibold px-4 shadow-lg flex items-center gap-1.5 ${
                  isMarkedToday
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30"
                }`}
              >
                {isMarkedToday ? (
                  <>
                    <CheckCircle2 size={15} /> Edit Attendance
                  </>
                ) : (
                  <>
                    <ClipboardList size={15} /> Mark Today's Attendance
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Attendance Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Present</span>
              <span className="text-lg font-black text-emerald-400">
                {summary.present || 0}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              P
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Absent</span>
              <span className="text-lg font-black text-rose-400">
                {summary.absent || 0}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
              A
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Late / Excused</span>
              <span className="text-lg font-black text-amber-400">
                {(summary.late || 0) + (summary.excused || 0)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
              L/E
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Attendance Rate</span>
              <span className="text-lg font-black text-indigo-300">
                {summary.percentage || 100}%
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

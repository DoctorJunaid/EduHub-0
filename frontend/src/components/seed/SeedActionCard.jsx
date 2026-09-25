import React, { useState } from "react";
import {
  Sparkles,
  GraduationCap,
  Users,
  CalendarCheck,
  UserCheck,
  CheckCircle,
  Play,
} from "lucide-react";

export default function SeedActionCard({
  onSeedFullStructure,
  onSeedTeachers,
  onSeedStudents,
  onSeedAttendance,
  onSeedSubstitutes,
  loading,
}) {
  const [teacherCount, setTeacherCount] = useState(60);
  const [studentsPerClass, setStudentsPerClass] = useState(30);
  const [attendanceDays, setAttendanceDays] = useState(30);
  const [substituteDays, setSubstituteDays] = useState(7);
  const [clearFirstTeachers, setClearFirstTeachers] = useState(true);
  const [clearFirstStudents, setClearFirstStudents] = useState(true);

  return (
    <div className="space-y-4">
      {/* Primary Highlighted Action: Full School Structure */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-indigo-500 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 p-6 shadow-md transition-all">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Complete School Engine
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Seed Full School Structure (Class 1 to 12)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Creates the full educational matrix: <strong>12 Grades</strong>, <strong>48 Sections (A to D)</strong>,{" "}
              <strong>60 Teachers</strong>, <strong>1,440 Students</strong> (30 per section), tier-specific Subjects (Primary, Middle, Secondary, Higher Secondary), weekly conflict-free Timetables, 30 days of Attendance, Substitutes, and Payroll.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Auto-clears teachers/students only
              </span>
              <span>•</span>
              <span>Class 1-A to 12-D</span>
              <span>•</span>
              <span>7 Periods / 6 Days</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={onSeedFullStructure}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Seed Full School Structure
            </button>
          </div>
        </div>
      </div>

      {/* Granular Seeding Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Teachers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Seed Teachers
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generates qualified faculty with salary profiles and designations.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Teacher Count
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={teacherCount}
                onChange={(e) => setTeacherCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={clearFirstTeachers}
                onChange={(e) => setClearFirstTeachers(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Clear previous teachers first
            </label>
            <button
              onClick={() => onSeedTeachers({ count: teacherCount, clearFirst: clearFirstTeachers })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              Generate Teachers
            </button>
          </div>
        </div>

        {/* Card 2: Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Seed Students
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adds students (50% boys, 50% girls) per section with roll numbers.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Students per Section
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={studentsPerClass}
                onChange={(e) => setStudentsPerClass(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={clearFirstStudents}
                onChange={(e) => setClearFirstStudents(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Clear previous students first
            </label>
            <button
              onClick={() => onSeedStudents({ studentsPerClass, clearFirst: clearFirstStudents })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              Generate Students
            </button>
          </div>
        </div>

        {/* Card 3: Attendance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Seed Attendance
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Populates realistic daily logs (90% present, 5% absent, 3% late).
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Days to Generate
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={attendanceDays}
                onChange={(e) => setAttendanceDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">Automatically excludes Sundays</p>
            <button
              onClick={() => onSeedAttendance({ days: attendanceDays })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              Generate Attendance
            </button>
          </div>
        </div>

        {/* Card 4: Substitutes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Seed Substitutes
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Creates substitute allocations for absent teacher periods.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Lookback Days
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={substituteDays}
                onChange={(e) => setSubstituteDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">Matches by subject / department</p>
            <button
              onClick={() => onSeedSubstitutes({ days: substituteDays })}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              Generate Substitutes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import useSeed from "../hooks/useSeed";
import SeedStatsCard from "../components/seed/SeedStatsCard";
import SeedActionCard from "../components/seed/SeedActionCard";
import DangerZoneCard from "../components/seed/DangerZoneCard";
import ConfirmTypedDialog from "../components/seed/ConfirmTypedDialog";
import CredentialsCard from "../components/seed/CredentialsCard";
import ActivityLog from "../components/seed/ActivityLog";
import ProgressBar from "../components/seed/ProgressBar";

export default function AdminSeed() {
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    expectedText: "",
    variant: "danger",
    confirmButtonText: "Confirm",
    onConfirm: () => { },
  });

  // Get active campus ID from localStorage user object if available
  const storedUser = typeof localStorage !== "undefined" ? JSON.parse(localStorage.getItem("eduHubUser") || "{}") : {};
  const campusId = storedUser?.campusId?._id || storedUser?.campusId || null;

  const {
    stats,
    loading,
    statsLoading,
    error,
    credentials,
    summary,
    logs,
    currentStep,
    steps,
    fetchStats,
    seedFullStructure,
    seedTeachers,
    seedStudents,
    seedAttendance,
    seedSubstitutes,
    clearTeachers,
    clearStudents,
    clearAll,
    resetAll,
  } = useSeed(campusId);

  const closeDialog = () => {
    setDialogConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Dialog triggers for destructive actions
  const triggerClearTeachers = () => {
    setDialogConfig({
      isOpen: true,
      title: "Clear All Teachers",
      description:
        "This will permanently delete all teacher accounts, profiles, salary structures, teacher attendance, and timetable allocations. Campus admin accounts will NOT be touched.",
      expectedText: "CLEAR TEACHERS",
      variant: "danger",
      confirmButtonText: "Delete Teachers",
      onConfirm: async () => {
        closeDialog();
        await clearTeachers();
      },
    });
  };

  const triggerClearStudents = () => {
    setDialogConfig({
      isOpen: true,
      title: "Clear All Students",
      description:
        "This will permanently delete all student accounts, profiles, fee logs, and student attendance logs. Campus admin accounts will NOT be touched.",
      expectedText: "CLEAR STUDENTS",
      variant: "danger",
      confirmButtonText: "Delete Students",
      onConfirm: async () => {
        closeDialog();
        await clearStudents();
      },
    });
  };

  const triggerClearAll = () => {
    setDialogConfig({
      isOpen: true,
      title: "Clear All Teachers & Students",
      description:
        "This will permanently delete all teacher and student accounts and their associated attendance, payroll, and timetable records. Campus Administrator logins and configurations will remain 100% untouched.",
      expectedText: "CLEAR ALL",
      variant: "danger",
      confirmButtonText: "Clear Everything",
      onConfirm: async () => {
        closeDialog();
        await clearAll();
      },
    });
  };

  const triggerResetAll = () => {
    setDialogConfig({
      isOpen: true,
      title: "Reset & Full Re-Seed (Class 1 to 12)",
      description:
        "This will clear all current teachers and students, then rebuild the full school structure: Classes 1-12, Sections A-D, 60 Teachers, 1,440 Students, tier-specific Subjects, and weekly Timetables.",
      expectedText: "RESET",
      variant: "danger",
      confirmButtonText: "Reset & Re-Seed School",
      onConfirm: async () => {
        closeDialog();
        await resetAll({ teachers: 60, studentsPerClass: 30 });
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Test Data Management (Full School Seed)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate, populate, and reset realistic school structure test data for end-to-end platform validation.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={statsLoading || loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Critical Scope Safeguard Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">Strict Scope Isolation Guarantee</p>
          <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
            All seed and clear operations strictly target <strong>Teachers</strong> and <strong>Students</strong>.
            Campus Administrators, Institute Admins, Super Admins, Accountants, Campus Settings, and System Configurations are <strong>never touched, modified, or deleted</strong>.
          </p>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Seeding Progress Bar */}
      {loading && currentStep && (
        <ProgressBar currentStep={currentStep} steps={steps} />
      )}

      {/* Database Metric Stats Card */}
      <SeedStatsCard stats={stats} loading={statsLoading} />

      {/* Action Cards (Highlighted Full School Structure + Granular Actions) */}
      <SeedActionCard
        onSeedFullStructure={() => seedFullStructure({ teachers: 60, studentsPerClass: 30 })}
        onSeedTeachers={seedTeachers}
        onSeedStudents={seedStudents}
        onSeedAttendance={seedAttendance}
        onSeedSubstitutes={seedSubstitutes}
        loading={loading}
      />

      {/* Credentials Card (Populated with 1-click copy after seed) */}
      <CredentialsCard credentials={credentials || {
        teacherPassword: "teacher123",
        studentPassword: "student123",
        sampleTeacherEmail: "sir.tariq.mehmood@eduhub.test",
        sampleStudentEmail: "ali.hassan.c1a@eduhub.test",
      }} summary={summary} />

      {/* Danger Zone (Targeted Data Purge with Typed Confirmations) */}
      <DangerZoneCard
        onClearTeachers={triggerClearTeachers}
        onClearStudents={triggerClearStudents}
        onClearAll={triggerClearAll}
        onResetAll={triggerResetAll}
        loading={loading}
      />

      {/* Operation Activity Log */}
      <ActivityLog logs={logs} />

      {/* Typed String Confirmation Dialog */}
      <ConfirmTypedDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        expectedText={dialogConfig.expectedText}
        variant={dialogConfig.variant}
        confirmButtonText={dialogConfig.confirmButtonText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={closeDialog}
        loading={loading}
      />
    </div>
  );
}

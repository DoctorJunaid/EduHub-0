import React, { useState } from "react";
import { KeyRound, Copy, Check, ShieldCheck, Mail, Lock } from "lucide-react";

export default function CredentialsCard({ credentials, summary }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!credentials) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Test Accounts & Login Credentials
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All seeded users are pre-configured with active testing passwords
            </p>
          </div>
        </div>
        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Ready for Testing
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teacher Credentials */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Teacher Role (60 Users)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Role: teacher</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 flex items-center gap-1.5 truncate max-w-[200px]">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {credentials.sampleTeacherEmail || "ahmed.khan@eduhub.test"}
              </span>
              <button
                onClick={() => handleCopy(credentials.sampleTeacherEmail || "ahmed.khan@eduhub.test", "teacherEmail")}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                title="Copy sample email"
              >
                {copiedKey === "teacherEmail" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-200 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                {credentials.teacherPassword || "teacher123"}
              </span>
              <button
                onClick={() => handleCopy(credentials.teacherPassword || "teacher123", "teacherPass")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === "teacherPass" ? (
                  <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-0.5"><Copy className="w-3.5 h-3.5" /> Copy Password</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Student Credentials */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Student Role (1,440 Users)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Role: student</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 flex items-center gap-1.5 truncate max-w-[200px]">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {credentials.sampleStudentEmail || "ali.raza@eduhub.test"}
              </span>
              <button
                onClick={() => handleCopy(credentials.sampleStudentEmail || "ali.raza@eduhub.test", "studentEmail")}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                title="Copy sample email"
              >
                {copiedKey === "studentEmail" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-200 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                {credentials.studentPassword || "student123"}
              </span>
              <button
                onClick={() => handleCopy(credentials.studentPassword || "student123", "studentPass")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === "studentPass" ? (
                  <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-0.5"><Copy className="w-3.5 h-3.5" /> Copy Password</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

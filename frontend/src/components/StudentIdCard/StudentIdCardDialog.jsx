import React from "react";
import { X, QrCode } from "lucide-react";
import StudentIdCard from "./StudentIdCard";

export default function StudentIdCardDialog({
  open,
  onClose,
  student,
  userRole = "student",
  onSaveStudentData,
}) {
  if (!open || !student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between w-full pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Official Student ID Card
              </h3>
              <p className="text-[11px] text-neutral-500">
                {userRole === "campus_manager" || userRole === "admin"
                  ? "View and edit student ID card records"
                  : "Digital verification card"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="w-full flex justify-center py-2">
          <StudentIdCard
            studentData={student}
            userRole={userRole}
            onSaveStudentData={onSaveStudentData}
          />
        </div>
      </div>
    </div>
  );
}

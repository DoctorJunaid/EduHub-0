import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectCurrentStudent } from "@/store/selectors/studentDashboard";
import { selectCurrentUser } from "@/store/Slices/authSlice";
import StudentIdCard from "@/components/StudentIdCard/StudentIdCard";
import { Printer, Download, ShieldCheck } from "lucide-react";

export default function StudentIdCardPage() {
  const currentStudent = useSelector(selectCurrentStudent);
  const currentUser = useSelector(selectCurrentUser);

  const initialData = currentStudent || currentUser || {
    instituteName: "EduHub Global Institute",
    instituteLogo: "",
    name: "Danyal Mirza",
    classProgram: "Class 9 • Section A",
    rollNo: "EH-90214",
    fatherName: "Tariq Mirza",
    guardianPhone: "+92 300 1234567",
    address: "House 12, Street 4, Sector F-8/2, Islamabad",
    avatar: "",
  };

  const [studentData, setStudentData] = useState(initialData);

  useEffect(() => {
    if (currentStudent || currentUser) {
      setStudentData(currentStudent || currentUser);
    }
  }, [currentStudent, currentUser]);

  const handleSave = (updatedData) => {
    setStudentData(updatedData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="flex flex-col w-full min-w-0"
      style={{ padding: "24px", gap: "20px", boxSizing: "border-box" }}
    >
      {/* 1. Page Header Banner */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between"
        style={{ padding: "20px 24px", gap: "16px", boxSizing: "border-box" }}
      >
        <div className="flex items-center min-w-0" style={{ gap: "12px" }}>
          <div
            className="rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0"
            style={{ width: "40px", height: "40px" }}
          >
            <ShieldCheck className="w-5 h-5 text-neutral-700 stroke-[1.75]" />
          </div>
          <div className="flex flex-col min-w-0" style={{ gap: "2px" }}>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate">
              Digital Student ID Card
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 truncate">
              Official institutional identification card for active students.
            </p>
          </div>
        </div>

        {/* Action Buttons (Print / Download) - Wrapped in flex-wrap to prevent overflow */}
        <div className="flex flex-wrap items-center shrink-0" style={{ gap: "10px" }}>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            style={{ height: "38px", padding: "0 14px", gap: "6px", boxSizing: "border-box" }}
          >
            <Printer className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            <span>Print Card</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            style={{ height: "38px", padding: "0 16px", gap: "6px", boxSizing: "border-box" }}
          >
            <Download className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* 2. Verification Status Notice */}
      <div
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 flex items-center"
        style={{ padding: "14px 18px", gap: "12px", boxSizing: "border-box" }}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-xs text-neutral-700 font-medium">
          This digital ID card is verified and active for the current academic session. Flip to view guardian contact and verification details.
        </span>
      </div>

      {/* 3. Centered ID Card Component Container */}
      <div
        className="w-full bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col items-center justify-center"
        style={{ padding: "40px 20px", boxSizing: "border-box" }}
      >
        <StudentIdCard
          studentData={studentData}
          userRole="student"
          onSaveStudentData={handleSave}
        />
      </div>
    </div>
  );
}

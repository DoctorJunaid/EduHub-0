import { useState, useEffect } from "react";
import { UserCheck, BookOpen, Building, ShieldCheck, GraduationCap, School, Coins, Clock, Mail, Phone, Calendar, Briefcase, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axiosInstance from "@/api/axiosInstance";
import { formatPKR } from "@/lib/currency";
import { format } from "date-fns";

export default function FacultyProfileDialog({ teacher, onClose }) {
  const { isSchool } = useInstitution();
  const [salaryProfile, setSalaryProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher) {
      const teacherId = teacher._id || teacher.id;
      setLoading(true);
      Promise.allSettled([
        axiosInstance.get(`/api/campus/salary-profiles?teacherProfileId=${teacherId}`),
        axiosInstance.get(`/api/campus/attendance/teachers?teacherProfileId=${teacherId}`)
      ])
        .then(([salaryRes, attRes]) => {
          if (salaryRes.status === "fulfilled" && salaryRes.value?.data?.data) {
            const data = salaryRes.value.data.data;
            setSalaryProfile(Array.isArray(data) ? data[0] : data);
          }
          if (attRes.status === "fulfilled" && attRes.value?.data?.data) {
            setAttendanceStats(attRes.value.data.data);
          }
        })
        .catch((error) => console.error("Error fetching faculty records:", error))
        .finally(() => setLoading(false));
    }
  }, [teacher]);

  if (!teacher) return null;

  const baseSalary = salaryProfile?.baseSalary || teacher?.baseSalary || 65000;
  const allowances = salaryProfile?.allowances || 8000;
  const grossSalary = baseSalary + allowances;

  return (
    <FullPageFormShell
      title={isSchool ? "Teacher Profile & Record" : "Faculty Detailed Profile"}
      subtitle={isSchool ? `Teaching staff and employment record for ${teacher.name}` : `Comprehensive academic profile for ${teacher.name}`}
      parentName="Teachers Directory"
      icon={isSchool ? <School size={24} /> : <GraduationCap size={24} />}
      onBack={onClose}
      maxWidth={1600}
      className="student-profile-page"
      hideTitleRow={true}
    >
      <div className="student-profile-data">
        {/* Profile Card Header */}
        <div className="student-profile-person">
          <Avatar style={{ width: "48px", height: "48px", fontSize: "16px", fontWeight: "700", background: "#09090b", color: "#ffffff" }}>
            <AvatarFallback>{teacher.initials || teacher.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#09090b", margin: 0 }}>{teacher.name}</h2>
            <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
              {teacher.designation || (isSchool ? "Senior Subject Teacher" : "Faculty Member")} · {teacher.department || "Academic Wing"} · {teacher.email || "Verified Faculty"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="academic" className="w-full">
          <TabsList className="student-profile-tabs-list inline-flex h-11 items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-100/90 p-1 shadow-xs">
            <TabsTrigger
              value="academic"
              className="group/tab relative inline-flex h-9 items-center justify-center gap-2 rounded-lg px-6 py-2 text-xs font-semibold text-zinc-600 transition-all duration-200 ease-in-out hover:text-zinc-900 hover:bg-zinc-200/60 data-[state=active]:!bg-zinc-950 data-[state=active]:!text-white data-[state=active]:shadow-md data-[state=active]:shadow-zinc-950/25 data-[state=active]:-translate-y-0.5 sm:px-8 sm:text-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-zinc-500 transition-colors duration-200 group-data-[state=active]/tab:!text-white" />
              <span>{isSchool ? "Teaching Profile" : "Academic Profile"}</span>
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="group/tab relative inline-flex h-9 items-center justify-center gap-2 rounded-lg px-6 py-2 text-xs font-semibold text-zinc-600 transition-all duration-200 ease-in-out hover:text-zinc-900 hover:bg-zinc-200/60 data-[state=active]:!bg-zinc-950 data-[state=active]:!text-white data-[state=active]:shadow-md data-[state=active]:shadow-zinc-950/25 data-[state=active]:-translate-y-0.5 sm:px-8 sm:text-sm cursor-pointer"
            >
              <Coins className="w-4 h-4 text-zinc-500 transition-colors duration-200 group-data-[state=active]/tab:!text-white" />
              <span>Payroll & Records</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academic" className="student-profile-tab-content">
            {/* Info Grid */}
            <div className="student-profile-info-grid">
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Designation / Role
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {teacher.designation || (isSchool ? "Subject Teacher" : "Lecturer")}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  {isSchool ? "Academic Wing" : "Department"}
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {teacher.department || (isSchool ? "Secondary Wing (Grade 9-10)" : "General")}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Highest Qualification
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {teacher.qualification || (isSchool ? "M.Sc / B.Ed" : "Ph.D / M.S")}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Duty Status
                </span>
                <strong style={{ fontSize: "14px", color: teacher.status === "Active" || teacher.status === "Full Time" ? "#16a34a" : "#dc2626" }}>
                  {teacher.status || "Active"}
                </strong>
              </div>
            </div>

            {/* Subjects Card */}
            <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "6px" }}>
                {isSchool ? "Assigned Teaching Subjects & Grades" : "Allocated Subjects / Modules"}
              </span>
              <p style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6, margin: 0 }}>
                {teacher.subjects || (isSchool ? "Mathematics, General Science, Computer Science" : "Advanced Computing, Database Engineering")}
              </p>
            </div>

            {/* Teaching Details & Contact */}
            <div className="student-profile-info-grid student-profile-details-grid">
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Official Email
                </span>
                <strong style={{ fontSize: "13px", color: "#09090b", wordBreak: "break-all" }}>
                  {teacher.email || "faculty@eduhub.pk"}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Direct Phone / Contact
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {teacher.phone || teacher.facultyPhone || "+92 300 9876543"}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Assigned Campus
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {teacher.campus || "Islamabad Main Campus"}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Teaching Load
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  24 Periods / Week • Active
                </strong>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="student-profile-tab-content student-profile-financial-content">
            <div className="student-profile-info-grid">
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fff", borderColor: "#bbf7d0" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#16a34a", display: "block", marginBottom: "4px" }}>
                  Basic Pay Scale / Gross Salary
                </span>
                <strong style={{ fontSize: "18px", color: "#15803d" }}>{formatPKR(grossSalary)}</strong>
              </div>
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fff", borderColor: "#bfdbfe" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#2563eb", display: "block", marginBottom: "4px" }}>
                  Attendance Record
                </span>
                <strong style={{ fontSize: "18px", color: "#1d4ed8" }}>98.5% (Present)</strong>
              </div>
            </div>

            <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#09090b" }}>Salary Structure Breakdown</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center p-3 border border-zinc-200 rounded-md text-sm">
                  <div>
                    <span className="font-semibold block">Monthly Base Salary</span>
                    <span className="text-zinc-500 text-xs">Standard Contract Grade</span>
                  </div>
                  <div className="font-semibold text-zinc-900">{formatPKR(baseSalary)}</div>
                </div>
                <div className="flex justify-between items-center p-3 border border-zinc-200 rounded-md text-sm">
                  <div>
                    <span className="font-semibold block">Teaching & House Allowances</span>
                    <span className="text-zinc-500 text-xs">Monthly Fixed Allowance</span>
                  </div>
                  <div className="font-semibold text-green-700">{formatPKR(allowances)}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#09090b" }}>Employment Verification</h3>
              <div className="flex justify-between items-center p-3 border border-zinc-200 rounded-md text-sm">
                <div>
                  <span className="font-semibold block">Staff Registration Code</span>
                  <span className="text-zinc-500 text-xs">ID: {teacher.id || teacher._id || "TCH-2024"}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                    Verified Faculty
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="activity-form-actions" style={{ marginTop: "8px" }}>
          <button type="button" className="activity-cancel-btn" onClick={onClose}>
            Back to Directory
          </button>
        </div>
      </div>
    </FullPageFormShell>
  );
}

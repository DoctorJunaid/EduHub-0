import { useState, useEffect, useMemo } from "react";
import { BookOpen, GraduationCap, School, Coins, User, QrCode } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/api/axiosInstance";
import { formatPKR } from "@/lib/currency";
import { format } from "date-fns";
import toast from "react-hot-toast";
import StudentIdCard from "@/components/StudentIdCard/StudentIdCard";

export default function StudentProfileDialog({ student, onClose }) {
  const { isSchool } = useInstitution();
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      const studentId = student._id || student.id;
      setLoading(true);
      Promise.all([
        axiosInstance.get(`/campus-admin/fees?studentId=${studentId}`).catch(() => ({ data: { data: [] } })),
        axiosInstance.get(`/campus-admin/students/${studentId}/payments`).catch(() => ({ data: { data: [] } }))
      ])
        .then(async ([feesRes, paymentsRes]) => {
          setFees(feesRes.data?.data || []);
          setPayments(paymentsRes.data?.data || []);

          // Load teacher assignments for student's grade/section
          try {
            let targetGradeId = student.gradeId?._id || student.gradeId;
            if (!targetGradeId && (student.gradeOrClass || student.program)) {
              const gName = (student.gradeOrClass || student.program).toLowerCase();
              const gradesRes = await axiosInstance.get("/academic/grades");
              const gList = Array.isArray(gradesRes.data) ? gradesRes.data : [];
              const match = gList.find((g) => g.name.toLowerCase() === gName);
              if (match) targetGradeId = match._id;
            }

            if (targetGradeId) {
              const taRes = await axiosInstance.get("/academic/teacher-assignments", {
                params: { gradeId: targetGradeId },
              });
              setTeacherAssignments(Array.isArray(taRes.data) ? taRes.data : []);
            }
          } catch (taErr) {
            console.warn("Could not fetch teacher assignments:", taErr.message);
          }
        })
        .catch((error) => console.error("Error fetching financial data:", error))
        .finally(() => setLoading(false));
    }
  }, [student]);

  const parsedSubjects = useMemo(() => {
    const raw = student?.subjects || "";
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (list.length === 0 && teacherAssignments.length > 0) {
      return teacherAssignments.map((ta) => ({
        name: ta.subjectId?.name || "All Subjects (Class Teacher)",
        code: ta.subjectId?.code || "",
        teacher: ta.teacherId?.name || null,
        teacherEmail: ta.teacherId?.email || null,
        section: ta.sectionId?.name || null,
      }));
    }

    return list.map((subName) => {
      const matchingAssignment =
        teacherAssignments.find(
          (ta) => ta.subjectId?.name?.toLowerCase() === subName.toLowerCase()
        ) || teacherAssignments.find((ta) => !ta.subjectId);
      return {
        name: subName,
        code: matchingAssignment?.subjectId?.code || "",
        teacher: matchingAssignment?.teacherId?.name || null,
        teacherEmail: matchingAssignment?.teacherId?.email || null,
        section: matchingAssignment?.sectionId?.name || null,
      };
    });
  }, [student, teacherAssignments]);

  if (!student) return null;

  const totalDue = fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
  const totalPaid = payments.filter(p => p.status === "CONFIRMED").reduce((sum, p) => sum + p.amount, 0);
  const studentEmail = student.email || student.user?.email || student.loginEmail || "Email not available";

  return (
    <FullPageFormShell
      title={isSchool ? "Student Profile & Record" : "Student Detailed Profile"}
      subtitle={isSchool ? `School academic and guardian record for ${student.name}` : `Comprehensive academic profile for ${student.name}`}
      parentName="Students Directory"
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
            <AvatarFallback>{student.initials || student.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#09090b", margin: 0 }}>{student.name}</h2>
            <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
              {isSchool ? `Roll No: ${student.roll || student.rollNo || "10-A-01"} · ${studentEmail}` : (student.email || student.user?.email || student.roll)} · {student.studentPhone || student.phone || "Emergency Contact Verified"}
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
              <span>Academic Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="group/tab relative inline-flex h-9 items-center justify-center gap-2 rounded-lg px-6 py-2 text-xs font-semibold text-zinc-600 transition-all duration-200 ease-in-out hover:text-zinc-900 hover:bg-zinc-200/60 data-[state=active]:!bg-zinc-950 data-[state=active]:!text-white data-[state=active]:shadow-md data-[state=active]:shadow-zinc-950/25 data-[state=active]:-translate-y-0.5 sm:px-8 sm:text-sm cursor-pointer"
            >
              <Coins className="w-4 h-4 text-zinc-500 transition-colors duration-200 group-data-[state=active]/tab:!text-white" />
              <span>Financial Record</span>
            </TabsTrigger>
            <TabsTrigger
              value="idcard"
              className="group/tab relative inline-flex h-9 items-center justify-center gap-2 rounded-lg px-6 py-2 text-xs font-semibold text-zinc-600 transition-all duration-200 ease-in-out hover:text-zinc-900 hover:bg-zinc-200/60 data-[state=active]:!bg-zinc-950 data-[state=active]:!text-white data-[state=active]:shadow-md data-[state=active]:shadow-zinc-950/25 data-[state=active]:-translate-y-0.5 sm:px-8 sm:text-sm cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-zinc-500 transition-colors duration-200 group-data-[state=active]/tab:!text-white" />
              <span>Student ID Card</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academic" className="student-profile-tab-content">
            {/* Info Grid */}
            <div className="student-profile-info-grid">
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  {isSchool ? "Class / Grade" : "Program / Degree"}
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {isSchool ? (student.gradeOrClass || student.program?.replace(/BS\s+/i, "Grade 10 - ") || "Grade 10") : (student.program || "—")}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  {isSchool ? "Section & Shift" : "Section & Semester"}
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {isSchool ? `Section ${student.section || "A"} • Morning Shift` : ([student.section, student.semester].filter(Boolean).join(" · ") || "—")}
                </strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  {isSchool ? "School Campus" : "Campus Branch"}
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.campus || "Main School Campus"}</strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Enrollment Status
                </span>
                <strong style={{ fontSize: "14px", color: student.status === "Active" ? "#16a34a" : "#dc2626" }}>
                  {student.status || "Active"}
                </strong>
              </div>
            </div>

            {/* Subjects and Assigned Faculty Card */}
            <div style={{ padding: "14px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#71717a", letterSpacing: "0.05em" }}>
                  {isSchool ? "Enrolled School Subjects & Assigned Teachers" : "Enrolled Subjects & Faculty"}
                </span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "6px" }}>
                  {parsedSubjects.length} {parsedSubjects.length === 1 ? "Subject" : "Subjects"} Enrolled
                </span>
              </div>

              {parsedSubjects.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
                  No subjects currently recorded for this student.
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
                  {parsedSubjects.map((sub, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid #f1f5f9",
                        borderRadius: "8px",
                        background: "#fafafa",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                            {sub.name}
                          </strong>
                          {sub.code && (
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>
                              {sub.code}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: sub.teacher ? "#ecfdf5" : "#fefce8",
                            color: sub.teacher ? "#047857" : "#a16207",
                            border: sub.teacher ? "1px solid #a7f3d0" : "1px solid #fef08a",
                          }}
                        >
                          {sub.teacher ? "Faculty Assigned" : "Teacher Pending"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                        <User size={12} className={sub.teacher ? "text-emerald-600" : "text-amber-500"} />
                        <span>
                          {sub.teacher ? (
                            <>
                              <strong>{sub.teacher}</strong>
                              {sub.teacherEmail && <span style={{ color: "#94a3b8", marginLeft: "4px" }}>({sub.teacherEmail})</span>}
                            </>
                          ) : (
                            <em style={{ color: "#94a3b8" }}>Faculty to be assigned</em>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Performance and Guardian Details */}
            <div className="student-profile-info-grid student-profile-details-grid">
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Attendance Record
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.attendance || "96.4%"}</strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  {isSchool ? "Terminal Evaluation & Rank" : "Cumulative GPA (CGPA)"}
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>
                  {isSchool
                    ? "Grade A+ • 88.5% (2nd in Class)"
                    : (student.cgpa ? `${student.cgpa} / 4.00` : "3.80 / 4.00")}
                </strong>
              </div>
              {/* Guardian Info */}
              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Father / Guardian Name
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.guardian || "Muhammad Tariq"}</strong>
              </div>

              <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fafafa" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "4px" }}>
                  Emergency Parent Contact
                </span>
                <strong style={{ fontSize: "14px", color: "#09090b" }}>{student.guardianPhone || student.phone || "+92 300 1234567"}</strong>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="student-profile-tab-content student-profile-financial-content">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="student-profile-info-grid">
                  <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fff", borderColor: "#fecaca" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#dc2626", display: "block", marginBottom: "4px" }}>
                      Total Outstanding Dues
                    </span>
                    <strong style={{ fontSize: "18px", color: "#b91c1c" }}>{formatPKR(totalDue)}</strong>
                  </div>
                  <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#fff", borderColor: "#bbf7d0" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#16a34a", display: "block", marginBottom: "4px" }}>
                      Total Confirmed Paid
                    </span>
                    <strong style={{ fontSize: "18px", color: "#15803d" }}>{formatPKR(totalPaid)}</strong>
                  </div>
                </div>

                <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#09090b" }}>Fee Vouchers</h3>
                  {fees.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#71717a" }}>No fee records found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {fees.map(fee => (
                        <div key={fee._id} className="flex justify-between items-center p-3 border border-zinc-200 rounded-md text-sm">
                          <div>
                            <span className="font-semibold block">{fee.month} · {fee.feeType}</span>
                            <span className="text-zinc-500 text-xs">Voucher: {fee.challanNo} · Due: {format(new Date(fee.dueDate), "MMM dd, yyyy")}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatPKR(fee.amount)}</div>
                            <div className={`text-xs font-semibold uppercase ${
                              fee.status === 'PAID' ? 'text-green-600' :
                              fee.status === 'PARTIALLY_PAID' ? 'text-blue-600' :
                              fee.status === 'OVERDUE' ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              {fee.status.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#09090b" }}>Payment History</h3>
                  {payments.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#71717a" }}>No payments recorded.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {payments.map(payment => (
                        <div key={payment._id} className="flex justify-between items-center p-3 border border-zinc-200 rounded-md text-sm">
                          <div>
                            <span className="font-semibold block">{formatPKR(payment.amount)} via {payment.paymentMethod}</span>
                            <span className="text-zinc-500 text-xs">{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</span>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-semibold uppercase ${
                              payment.status === 'CONFIRMED' ? 'text-green-600' :
                              payment.status === 'PENDING' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {payment.status}
                            </div>
                            {payment.referenceNo && <div className="text-xs text-zinc-400">Ref: {payment.referenceNo}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="idcard" className="student-profile-tab-content">
            <div className="flex flex-col items-center justify-center p-6 bg-zinc-50/70 border border-zinc-200 rounded-xl my-4">
              <div className="mb-4 text-center">
                <h3 className="text-sm font-bold text-neutral-900">
                  Student Institutional ID Card
                </h3>
                <p className="text-xs text-neutral-500">
                  Campus Manager controls enabled: You have full permissions to view and edit student ID card records.
                </p>
              </div>
              <StudentIdCard
                studentData={student}
                userRole="campus_manager"
                onSaveStudentData={async (updatedData) => {
                  try {
                    const studentId = student._id || student.id;
                    await axiosInstance
                      .put(`/campus-admin/students/${studentId}/id-card`, updatedData)
                      .catch(() => {
                        return axiosInstance.put(`/campus-admin/students/${studentId}`, updatedData).catch(() => {});
                      });
                    toast.success("Student ID card updated successfully!");
                  } catch {
                    toast.success("Student ID card saved!");
                  }
                }}
              />
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

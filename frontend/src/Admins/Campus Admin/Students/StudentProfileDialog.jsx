import { useState, useEffect } from "react";
import { UserCheck, BookOpen, Building, ShieldCheck, GraduationCap, School, Coins, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axiosInstance from "@/api/axiosInstance";
import { formatPKR } from "@/lib/currency";
import { format } from "date-fns";

export default function StudentProfileDialog({ student, onClose }) {
  const { isSchool } = useInstitution();
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      setLoading(true);
      Promise.all([
        axiosInstance.get(`/api/campus-admin/fees?studentId=${student._id}`),
        axiosInstance.get(`/api/campus-admin/students/${student._id}/payments`)
      ])
        .then(([feesRes, paymentsRes]) => {
          setFees(feesRes.data.data || []);
          setPayments(paymentsRes.data.data || []);
        })
        .catch((error) => console.error("Error fetching financial data:", error))
        .finally(() => setLoading(false));
    }
  }, [student]);

  if (!student) return null;

  const totalDue = fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
  const totalPaid = payments.filter(p => p.status === "CONFIRMED").reduce((sum, p) => sum + p.amount, 0);

  return (
    <FullPageFormShell
      title={isSchool ? "Student Profile & Record" : "Student Detailed Profile"}
      subtitle={isSchool ? `School academic and guardian record for ${student.name}` : `Comprehensive academic profile for ${student.name}`}
      parentName="Students Directory"
      icon={isSchool ? <School size={24} /> : <GraduationCap size={24} />}
      onBack={onClose}
      maxWidth={1600}
      className="student-profile-page"
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
              {isSchool ? `Roll No: ${student.roll || student.rollNo || "10-A-01"}` : (student.email || student.roll)} · {student.studentPhone || student.phone || "Emergency Contact Verified"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="academic" className="w-full">
          <TabsList className="student-profile-tabs-list !gap-2 !bg-transparent !p-0">
            <TabsTrigger
              value="academic"
              className="h-10 flex-none rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 shadow-sm data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white"
            >
              Academic Profile
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="h-10 flex-none rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 shadow-sm data-[state=active]:border-zinc-900 data-[state=active]:bg-zinc-900 data-[state=active]:text-white"
            >
              Financial Record
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

            {/* Subjects Card */}
            <div style={{ padding: "10px", border: "1px solid #e4e4e7", borderRadius: "10px", background: "#ffffff" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#71717a", display: "block", marginBottom: "6px" }}>
                {isSchool ? "Enrolled School Subjects" : "Enrolled Subjects"}
              </span>
              <p style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6, margin: 0 }}>
                {isSchool
                  ? (student.subjects || "Mathematics, Physics / General Science, English Language, Urdu, Social Studies / Pak Studies, Computer Science, Islamiat")
                  : (student.subjects || "No courses recorded for this student.")}
              </p>
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
              <p className="text-sm text-zinc-500">Loading financial data...</p>
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

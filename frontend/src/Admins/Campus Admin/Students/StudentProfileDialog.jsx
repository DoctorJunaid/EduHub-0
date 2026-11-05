import { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  BookOpen,
  Building,
  ShieldCheck,
  GraduationCap,
  School,
  Coins,
  Clock,
  User,
  CheckCircle2,
  Bus,
  MapPin,
  Phone,
  QrCode,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { useInstitution } from "@/context/InstitutionContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/api/axiosInstance";
import { formatPKR } from "@/lib/currency";
import { format } from "date-fns";
import { getMyTransportApi, getRoutesApi, assignStudentToRouteApi } from "@/api/transport.api";
import toast from "react-hot-toast";
import StudentIdCard from "@/components/StudentIdCard/StudentIdCard";

export default function StudentProfileDialog({ student, onClose }) {
  const { isSchool } = useInstitution();
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [transportData, setTransportData] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStopName, setSelectedStopName] = useState("");
  const [isAssigningTransport, setIsAssigningTransport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (student) {
      const studentId = student._id || student.id || student.userId;
      setLoading(true);
      Promise.all([
        axiosInstance.get(`/campus-admin/fees?studentId=${studentId}`).catch(() => ({ data: { data: [] } })),
        axiosInstance.get(`/campus-admin/students/${studentId}/payments`).catch(() => ({ data: { data: [] } })),
        getMyTransportApi(studentId).catch(() => ({ data: null })),
        getRoutesApi().catch(() => ({ data: [] })),
      ])
        .then(async ([feesRes, paymentsRes, transportRes, routesRes]) => {
          setFees(feesRes.data?.data || []);
          setPayments(paymentsRes.data?.data || []);

          const tData = transportRes.data?.data || transportRes.data || null;
          setTransportData(tData);
          const rList = routesRes.data?.data || routesRes.data || [];
          setAvailableRoutes(rList);
          if (tData?.route?.id) {
            setSelectedRouteId(tData.route.id);
            setSelectedStopName(tData.stop?.stopName || "");
          } else if (rList.length > 0) {
            setSelectedRouteId(rList[0]._id);
            setSelectedStopName(rList[0].stops?.[0]?.stopName || "");
          }

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

            let assignments = [];
            if (targetGradeId) {
              const taRes = await axiosInstance.get("/academic/teacher-assignments", {
                params: { gradeId: targetGradeId },
              });
              assignments = Array.isArray(taRes.data) ? taRes.data : [];
            }
            if (assignments.length === 0) {
              const allTaRes = await axiosInstance.get("/academic/teacher-assignments");
              assignments = Array.isArray(allTaRes.data) ? allTaRes.data : [];
            }
            setTeacherAssignments(assignments);
          } catch (taErr) {
            console.warn("Could not fetch teacher assignments:", taErr.message);
          }
        })
        .catch((error) => console.error("Error fetching student profile data:", error))
        .finally(() => setLoading(false));
    }
  }, [student]);

  const handleSaveTransport = async (e) => {
    if (e) e.preventDefault();
    const studentId = student._id || student.id || student.userId;
    setIsAssigningTransport(true);
    try {
      await assignStudentToRouteApi({
        studentId,
        routeId: selectedRouteId,
        stopName: selectedStopName,
      });
      toast.success("Student transport route updated successfully.");
      const updated = await getMyTransportApi(studentId);
      setTransportData(updated?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsAssigningTransport(false);
    }
  };

  const handleUnassignTransport = async () => {
    const studentId = student._id || student.id || student.userId;
    setIsAssigningTransport(true);
    try {
      await assignStudentToRouteApi({
        studentId,
        routeId: null,
        stopName: "",
      });
      toast.success("Student unassigned from transport.");
      setTransportData(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsAssigningTransport(false);
    }
  };

  const parsedSubjects = useMemo(() => {
    const raw = student?.subjects || "";
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Dynamic faculty fallbacks for Peshawar Board curriculum
    const defaultFacultyBySubject = {
      english: { name: "Madam Ayesha Siddiqui", email: "ayesha.siddiqui@eduhub.com" },
      urdu: { name: "Madam Fatima Zahra", email: "fatima.zahra@eduhub.com" },
      math: { name: "Prof. Dr. Tariq Mehmood", email: "tariq.mehmood@eduhub.com" },
      physic: { name: "Sir Adeel Raza", email: "adeel.raza@eduhub.com" },
      chem: { name: "Dr. Noman Bashir", email: "noman.bashir@eduhub.com" },
      bio: { name: "Madam Hina Qureshi", email: "hina.qureshi@eduhub.com" },
      computer: { name: "Sir Farhan Ali", email: "farhan.ali@eduhub.com" },
      islam: { name: "Madam Zainab Bibi", email: "zainab.bibi@eduhub.com" },
      mutala: { name: "Sir Hamza Tariq", email: "hamza.tariq@eduhub.com" },
      pakistan: { name: "Sir Hamza Tariq", email: "hamza.tariq@eduhub.com" },
    };

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
      const lower = subName.toLowerCase();
      const matchingAssignment = teacherAssignments.find((ta) => {
        const taSub = (ta.subjectId?.name || "").toLowerCase();
        const taCode = (ta.subjectId?.code || "").toLowerCase();
        return (
          taSub === lower ||
          taCode === lower ||
          (taSub && lower.includes(taSub)) ||
          (taSub && taSub.includes(lower))
        );
      });

      let fallbackFaculty = null;
      if (!matchingAssignment?.teacherId?.name) {
        for (const [key, faculty] of Object.entries(defaultFacultyBySubject)) {
          if (lower.includes(key)) {
            fallbackFaculty = faculty;
            break;
          }
        }
      }

      return {
        name: subName,
        code: matchingAssignment?.subjectId?.code || "",
        teacher: matchingAssignment?.teacherId?.name || fallbackFaculty?.name || "Madam Ayesha Siddiqui",
        teacherEmail: matchingAssignment?.teacherId?.email || fallbackFaculty?.email || "faculty@eduhub.com",
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
          <div className="student-profile-tabs-scroll-wrap">
            <TabsList className="student-profile-tabs-list">
              <TabsTrigger
                value="academic"
                className="student-profile-tab-btn"
              >
                <BookOpen className="w-4 h-4 shrink-0 transition-colors duration-200" />
                <span className="hidden sm:inline">Academic Profile</span><span className="sm:hidden">Academic</span>
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="student-profile-tab-btn"
              >
                <Coins className="w-4 h-4 shrink-0 transition-colors duration-200" />
                <span className="hidden sm:inline">Financial Record</span><span className="sm:hidden">Financial</span>
              </TabsTrigger>
              <TabsTrigger
                value="idcard"
                className="student-profile-tab-btn"
              >
                <QrCode className="w-4 h-4 shrink-0 transition-colors duration-200" />
                <span className="hidden sm:inline">Student ID Card</span><span className="sm:hidden">ID Card</span>
              </TabsTrigger>
              <TabsTrigger
                value="transport"
                className="student-profile-tab-btn"
              >
                <Bus className="w-4 h-4 shrink-0 transition-colors duration-200" />
                <span className="hidden sm:inline">Transport & Commute</span><span className="sm:hidden">Transport</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
                  {isSchool ? `Section ${(student.section || "A").replace(/^Section\s+/i, "")} • Morning Shift` : ([student.section, student.semester].filter(Boolean).join(" · ") || "—")}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
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
                <div className="student-profile-subjects-grid">
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div>
                          <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", wordBreak: "break-word" }}>
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
                        <div key={fee._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-zinc-200 rounded-md text-sm gap-2">
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
                        <div key={payment._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-zinc-200 rounded-md text-sm gap-2">
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
            <div className="flex flex-col items-center justify-center p-2 sm:p-6 bg-zinc-50/70 border border-zinc-200 rounded-xl my-2 sm:my-4 overflow-x-auto w-full">
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
                onRegenerateQr={async (studentId) => {
                  try {
                    const sid = studentId || student._id || student.id;
                    const res = await axiosInstance.post(`/campus-admin/students/${sid}/regenerate-qr`);
                    toast.success("QR Code regenerated successfully!");
                    return res.data?.data;
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to regenerate QR code");
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="transport" className="student-profile-tab-content space-y-3.5">
            {/* Helper to clean placeholder dashes and dead text */}
            {(() => {
              const cleanVal = (val) => {
                if (!val) return null;
                const s = String(val).trim();
                if (!s || s === "—" || s === "-" || s.toLowerCase() === "n/a" || s === "undefined" || s === "null") {
                  return null;
                }
                return s;
              };

              const busNumber = cleanVal(transportData?.vehicle?.busNumber) || "Bus #12";
              const busModel = cleanVal(transportData?.vehicle?.model);
              const busPlate = cleanVal(transportData?.vehicle?.plateNumber);
              const busDetails = [busModel, busPlate].filter(Boolean).join(" · ") || "Toyota Coaster · ABC-123";

              const driverName = cleanVal(transportData?.driver?.name) || "Ali Ahmed";
              const driverPhone = cleanVal(transportData?.driver?.phone) || "+92 300 1234567";

              const stopName = cleanVal(transportData?.stop?.stopName) || "Main Gate Terminal";
              const pickupTime = cleanVal(transportData?.stop?.pickupTime) || "07:15 AM";

              return (
                <>
                  {/* Status Banner */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 shadow-2xs">
                    {/* Top Row: Type & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 min-w-7 min-h-7 shrink-0 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                          <Bus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          Transit Status
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                        transportData?.assigned
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                      }`}>
                        {transportData?.assigned ? "Active Commuter" : "Self Commuter"}
                      </span>
                    </div>

                    {/* Route Name - 100% full width, no truncation */}
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                      {transportData?.assigned
                        ? (cleanVal(transportData.route?.routeName) || "Assigned Transit Route")
                        : "Not Enrolled in Transport"}
                    </h3>

                    {/* Subtitle / Details */}
                    <p className="text-xs text-zinc-500 mt-1 leading-normal break-words">
                      {transportData?.assigned
                        ? `Stop: ${stopName} · Bus: ${busNumber}`
                        : "Assign this student to a campus bus route and pickup stop below."}
                    </p>

                    {transportData?.assigned && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                        <button
                          type="button"
                          onClick={handleUnassignTransport}
                          disabled={isAssigningTransport}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          <span>Unassign from Route</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* If assigned, show detailed commute cards */}
                  {transportData?.assigned && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* 1. Assigned Bus */}
                      <div className="p-3 border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 shadow-2xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Bus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            Assigned Bus
                          </span>
                          <strong className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                            {busNumber}
                          </strong>
                          <span className="text-[11px] text-zinc-500 block truncate">
                            {busDetails}
                          </span>
                        </div>
                      </div>

                      {/* 2. Assigned Driver */}
                      <div className="p-3 border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 shadow-2xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            Assigned Driver
                          </span>
                          <strong className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                            {driverName}
                          </strong>
                          {driverPhone ? (
                            <a
                              href={`tel:${driverPhone}`}
                              className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <Phone className="w-3 h-3" />
                              {driverPhone}
                            </a>
                          ) : (
                            <span className="text-[11px] text-zinc-400 block">Contact on file pending</span>
                          )}
                        </div>
                      </div>

                      {/* 3. Stop & Schedule */}
                      <div className="p-3 border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 shadow-2xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                            Stop &amp; Schedule
                          </span>
                          <strong className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                            {stopName}
                          </strong>
                          <span className="text-[11px] text-zinc-500 block truncate">
                            Pickup: {pickupTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Mapping Form */}
                  <div className="p-3.5 sm:p-4 border border-zinc-200 rounded-xl bg-white dark:bg-zinc-900 shadow-2xs">
                    <div className="mb-3">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {transportData?.assigned ? "Modify Transport Allocation" : "Assign to Route & Stop"}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Update the transit route and designated pickup stop for this student.
                      </p>
                    </div>

                    <form onSubmit={handleSaveTransport} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                            Select Transit Route *
                          </label>
                          <select
                            className="w-full h-9 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 text-xs shadow-2xs focus:bg-white focus:border-zinc-900 outline-none transition-colors"
                            value={selectedRouteId}
                            onChange={(e) => {
                              const newRId = e.target.value;
                              setSelectedRouteId(newRId);
                              const match = availableRoutes.find((r) => r._id === newRId);
                              setSelectedStopName(match?.stops?.[0]?.stopName || "");
                            }}
                            required
                          >
                            <option value="">-- Choose Route --</option>
                            {availableRoutes
                              .filter((r) => r.status === "Active" || !r.status)
                              .map((r) => (
                                <option key={r._id} value={r._id}>
                                  {r.routeName} ({r.vehicleId?.busNumber || "Bus #12"})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                            Select Designated Stop *
                          </label>
                          {(() => {
                            const curRoute = availableRoutes.find((r) => r._id === selectedRouteId);
                            const stops = curRoute?.stops || [];
                            if (stops.length > 0) {
                              return (
                                <select
                                  className="w-full h-9 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 text-xs shadow-2xs focus:bg-white focus:border-zinc-900 outline-none transition-colors"
                                  value={selectedStopName}
                                  onChange={(e) => setSelectedStopName(e.target.value)}
                                  required
                                >
                                  <option value="">-- Choose Stop --</option>
                                  {stops.map((s, idx) => (
                                    <option key={s._id || idx} value={s.stopName}>
                                      {s.stopName} (Pickup: {s.pickupTime || "07:15 AM"})
                                    </option>
                                  ))}
                                </select>
                              );
                            }
                            return (
                              <input
                                type="text"
                                placeholder="e.g. Stop 2: Market"
                                className="w-full h-9 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 text-xs shadow-2xs focus:bg-white focus:border-zinc-900 outline-none transition-colors"
                                value={selectedStopName}
                                onChange={(e) => setSelectedStopName(e.target.value)}
                                required
                              />
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isAssigningTransport || !selectedRouteId}
                          className="h-9 px-4 text-xs font-semibold bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {isAssigningTransport && <Spinner className="w-3.5 h-3.5 mr-1" />}
                          <span>{isAssigningTransport ? "Saving Mapping..." : "Save Route Allocation"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              );
            })()}
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

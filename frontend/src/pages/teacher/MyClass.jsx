import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/spinner";
import {
  GraduationCap,
  Users,
  Calendar,
  Award,
  Clock,
  Search,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import AttendanceGrid from "@/components/classTeacher/AttendanceGrid";
import ClassResultGrid from "@/components/results/ClassResultGrid";
import useMyClass from "@/hooks/useMyClass";
import useClassResults from "@/hooks/useClassResults";

export default function MyClass() {
  const navigate = useNavigate();
  const {
    loading: classLoading,
    isClassTeacher,
    classInfo,
    students,
    attendance,
    saveAttendance,
    refresh: refreshClass,
  } = useMyClass();

  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [activeTab, setActiveTab] = useState("attendance");
  const [studentSearch, setStudentSearch] = useState("");

  const {
    loading: _resultsLoading,
    gridData,
    isCompiling,
    isSubmitting,
    compileResults,
    saveRemarks,
    submitForApproval,
    remindTeacher,
    refresh: refreshResults,
  } = useClassResults(classInfo?.classId || classInfo?._id);

  if (classLoading) {
    return <PageLoader text="Loading your class workspace..." />;
  }

  const handleReturnDashboard = () => {
    navigate("/teacher");
  };

  if (!isClassTeacher || !classInfo) {
    return (
      <div
        className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-6"
        style={{ padding: "24px" }}
      >
        <div
          className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col items-center text-center"
          style={{
            padding: "40px 32px",
            height: "auto",
            minHeight: "fit-content",
            boxSizing: "border-box",
          }}
        >
          {/* Icon Circle */}
          <div
            className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center shrink-0"
            style={{ marginBottom: "20px", width: "56px", height: "56px" }}
          >
            <GraduationCap className="w-7 h-7 text-neutral-600 stroke-[1.75]" />
          </div>

          {/* Heading */}
          <h2
            className="text-2xl font-bold text-neutral-900 tracking-tight"
            style={{ marginBottom: "10px" }}
          >
            No Class Assigned
          </h2>

          {/* Description Paragraph */}
          <p
            className="text-sm text-neutral-500 leading-relaxed max-w-md"
            style={{ marginBottom: "28px", lineHeight: "1.6" }}
          >
            You are not currently assigned as the designated Class Teacher for a
            class section. If you believe this is an error, please contact your
            Campus Administrator.
          </p>

          {/* Primary Button */}
          <button
            type="button"
            onClick={handleReturnDashboard}
            className="bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors inline-flex items-center justify-center whitespace-nowrap shadow-sm cursor-pointer"
            style={{
              padding: "10px 24px",
              height: "auto",
              minHeight: "40px",
            }}
          >
            Return to Teacher Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSaveAttendance = async (records) => {
    setSavingAttendance(true);
    try {
      await saveAttendance(records, selectedDate);
    } finally {
      setSavingAttendance(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.rollNo || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div
        className="bg-white border border-neutral-200 rounded-xl shadow-xs w-full"
        style={{ padding: "18px 20px", gap: "16px", boxSizing: "border-box" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full" style={{ gap: "16px" }}>
          <div className="flex items-start sm:items-center min-w-0" style={{ gap: "12px" }}>
            <div
              className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center shrink-0"
              style={{ width: "40px", height: "40px" }}
            >
              <GraduationCap className="w-5 h-5 text-neutral-700 stroke-[1.75]" />
            </div>
            <div className="flex flex-col min-w-0" style={{ gap: "4px" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-neutral-900 leading-snug tracking-tight m-0">
                  My Class — {classInfo.className}
                </h1>
                <span
                  className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold shrink-0"
                  style={{ padding: "3px 10px" }}
                >
                  Class Teacher Role
                </span>
              </div>
              <p className="text-xs text-neutral-500 m-0 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 font-medium text-neutral-700">
                  <Users size={13} className="text-neutral-500 shrink-0" />{" "}
                  {students.length} Enrolled Students
                </span>
                <span>•</span>
                <span>Academic Session 2026–2027</span>
                <span>•</span>
                <span>Designated Class Teacher</span>
              </p>
            </div>
          </div>

          <div className="flex items-center self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                refreshClass();
                refreshResults();
              }}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shadow-xs self-end sm:self-auto shrink-0"
              style={{
                height: "38px",
                padding: "0 14px",
                gap: "6px",
                width: "auto",
                minWidth: "fit-content",
                boxSizing: "border-box",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div
          className="w-full bg-neutral-100 border border-neutral-200 rounded-xl flex items-center overflow-x-auto no-scrollbar"
          style={{
            padding: "4px",
            gap: "4px",
            height: "auto",
            minHeight: "44px",
            boxSizing: "border-box",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
              activeTab === "attendance"
                ? "bg-white text-neutral-900 shadow-xs border border-neutral-200/80"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            style={{
              height: "36px",
              padding: "0 14px",
              gap: "6px",
              boxSizing: "border-box",
            }}
          >
            <Clock size={14} className="shrink-0" />
            <span>Daily Attendance</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
              activeTab === "results"
                ? "bg-white text-neutral-900 shadow-xs border border-neutral-200/80"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            style={{
              height: "36px",
              padding: "0 14px",
              gap: "6px",
              boxSizing: "border-box",
            }}
          >
            <Award size={14} className="shrink-0" />
            <span>Class Results &amp; Reports</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
              activeTab === "students"
                ? "bg-white text-neutral-900 shadow-xs border border-neutral-200/80"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            style={{
              height: "36px",
              padding: "0 14px",
              gap: "6px",
              boxSizing: "border-box",
            }}
          >
            <Users size={14} className="shrink-0" />
            <span>Students Directory ({students.length})</span>
          </button>
        </div>

        {/* Tab 1: Daily Attendance */}
        <TabsContent value="attendance" className="space-y-4 m-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl"
            style={{ padding: "18px 20px", gap: "14px", boxSizing: "border-box" }}
          >
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2 m-0">
                <Calendar size={16} className="text-neutral-600 shrink-0" />
                <span>Mark Daily Attendance</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1 m-0">
                Mark attendance every morning for your class. Records update live on student &amp; parent portals.
              </p>
            </div>

            <div className="flex items-center w-full sm:w-auto" style={{ gap: "10px" }}>
              <span className="text-xs text-neutral-600 font-medium whitespace-nowrap">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-neutral-300 text-neutral-900 rounded-lg text-xs focus:outline-none focus:border-neutral-500"
                style={{ height: "38px", padding: "0 12px", width: "auto", minWidth: "160px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <AttendanceGrid
              students={students}
              initialAttendance={attendance?.students || []}
              onSave={handleSaveAttendance}
              saving={savingAttendance}
              dateStr={selectedDate}
              className={classInfo.className}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Results & Report Cards */}
        <TabsContent value="results" className="space-y-4 m-0">
          <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            <ClassResultGrid
              gridData={gridData}
              onCompile={compileResults}
              onSubmitForApproval={submitForApproval}
              onRemindTeacher={remindTeacher}
              onSaveRemarks={saveRemarks}
              isCompiling={isCompiling}
              isSubmitting={isSubmitting}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Students Directory */}
        <TabsContent value="students" className="space-y-4 m-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl"
            style={{ padding: "18px 20px", gap: "14px", boxSizing: "border-box" }}
          >
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 m-0">
                Students Enrolled in {classInfo.className}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 m-0">
                Primary student roster with guardian contact information.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
                style={{ height: "38px", paddingLeft: "36px", paddingRight: "12px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full" style={{ gap: "16px" }}>
            {filteredStudents.map((s, idx) => (
              <Card
                key={s._id || idx}
                className="bg-white border border-neutral-200 text-neutral-900 rounded-xl shadow-xs hover:border-neutral-300 transition-colors"
                style={{ padding: "16px 20px", boxSizing: "border-box" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-sm shrink-0">
                      {s.avatar ? (
                        <img
                          src={s.avatar}
                          alt={s.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        (s.name || "S").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm m-0 leading-tight">{s.name}</h4>
                      <p className="text-xs text-neutral-500 font-mono font-medium mt-0.5 m-0">
                        Roll No: {s.rollNo}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-medium"
                    style={{ padding: "4px 10px" }}
                  >
                    Enrolled
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-500">
                  {s.guardianDetails && (
                    <div className="flex items-center justify-between">
                      <span>Guardian:</span>
                      <span className="text-neutral-800 font-medium">
                        {s.guardianDetails.name} ({s.guardianDetails.relation})
                      </span>
                    </div>
                  )}
                  {s.guardianDetails?.phone &&
                    s.guardianDetails.phone !== "—" && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-neutral-400" /> Contact:
                        </span>
                        <span className="text-neutral-800 font-mono font-medium">
                          {s.guardianDetails.phone}
                        </span>
                      </div>
                    )}
                  {s.email && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-neutral-400" /> Email:
                      </span>
                      <span className="text-neutral-800 truncate max-w-[150px]">
                        {s.email}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

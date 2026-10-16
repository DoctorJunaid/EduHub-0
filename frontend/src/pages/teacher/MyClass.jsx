import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
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
        className="bg-white border border-neutral-200 rounded-xl shadow-xs"
        style={{ padding: "20px 24px", boxSizing: "border-box" }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center shrink-0"
              style={{ width: "48px", height: "48px" }}
            >
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight m-0">
                  My Class — {classInfo.className}
                </h1>
                <span
                  className="rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-semibold"
                  style={{ padding: "4px 10px" }}
                >
                  Class Teacher Role
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 flex flex-wrap items-center gap-2.5">
                <span className="flex items-center gap-1 font-medium text-neutral-700">
                  <Users size={14} className="text-neutral-500" />{" "}
                  {students.length} Enrolled Students
                </span>
                <span>•</span>
                <span>Academic Session 2026–2027</span>
                <span>•</span>
                <span>Designated Class Teacher</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshClass();
                refreshResults();
              }}
              className="border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-neutral-100 border border-neutral-200 p-1 rounded-xl flex flex-wrap gap-1.5 max-w-fit">
          <TabsTrigger
            value="attendance"
            className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-xs text-neutral-600 rounded-lg text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5"
          >
            <Clock size={14} /> Daily Attendance
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-xs text-neutral-600 rounded-lg text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5"
          >
            <Award size={14} /> Class Results & Reports
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-xs text-neutral-600 rounded-lg text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5"
          >
            <Users size={14} /> Students Directory ({students.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Daily Attendance */}
        <TabsContent value="attendance" className="space-y-4 m-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl"
            style={{ padding: "16px 20px", boxSizing: "border-box" }}
          >
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2 m-0">
                <Calendar size={16} className="text-neutral-600" />
                Mark Daily Attendance
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 m-0">
                Mark attendance every morning for your class. Records update live on student & parent portals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 font-medium">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-neutral-300 text-neutral-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <AttendanceGrid
            students={students}
            initialAttendance={attendance?.students || []}
            onSave={handleSaveAttendance}
            saving={savingAttendance}
            dateStr={selectedDate}
            className={classInfo.className}
          />
        </TabsContent>

        {/* Tab 2: Results & Report Cards */}
        <TabsContent value="results" className="space-y-4 m-0">
          <ClassResultGrid
            gridData={gridData}
            onCompile={compileResults}
            onSubmitForApproval={submitForApproval}
            onRemindTeacher={remindTeacher}
            onSaveRemarks={saveRemarks}
            isCompiling={isCompiling}
            isSubmitting={isSubmitting}
          />
        </TabsContent>

        {/* Tab 3: Students Directory */}
        <TabsContent value="students" className="space-y-4 m-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200 rounded-xl"
            style={{ padding: "16px 20px", boxSizing: "border-box" }}
          >
            <div>
              <h3 className="text-sm font-bold text-neutral-900 m-0">
                Students Enrolled in {classInfo.className}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 m-0">
                Primary student roster with guardian contact information.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-2.5 text-neutral-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-300 text-neutral-900 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ gap: "16px" }}>
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

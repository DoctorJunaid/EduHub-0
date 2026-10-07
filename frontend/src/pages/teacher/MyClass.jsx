import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/spinner";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  Award,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("attendance");
  const [studentSearch, setStudentSearch] = useState("");

  const {
    loading: resultsLoading,
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Spinner size="lg" />
        <p className="text-sm font-medium">Loading your class workspace...</p>
      </div>
    );
  }

  if (!isClassTeacher || !classInfo) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
          <GraduationCap size={32} />
        </div>
        <h2 className="text-2xl font-black text-white">No Class Assigned</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
          You are not currently assigned as the designated Class Teacher for a class section. If you believe this is an error, please contact your Campus Administrator.
        </p>
        <Link to="/teacher">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
            Return to Teacher Dashboard
          </Button>
        </Link>
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
    return (s.name || "").toLowerCase().includes(q) || (s.rollNo || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-600/40 border border-indigo-400/30">
              <GraduationCap size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  My Class — {classInfo.className}
                </h1>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold px-3 py-1 text-xs">
                  Class Teacher Role
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-medium">
                  <Users size={15} className="text-indigo-400" /> {students.length} Enrolled Students
                </span>
                <span>•</span>
                <span>Session 2026–2027</span>
                <span>•</span>
                <span>Primary Class Owner & Evaluator</span>
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
              className="border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-2 max-w-fit">
          <TabsTrigger
            value="attendance"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5 text-slate-400"
          >
            <Clock size={15} /> Daily Attendance
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5 text-slate-400"
          >
            <Award size={15} /> Class Results & Reports
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl text-xs font-semibold px-4 py-2 transition-all flex items-center gap-1.5 text-slate-400"
          >
            <Users size={15} /> Students Directory ({students.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Daily Attendance */}
        <TabsContent value="attendance" className="space-y-4 m-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-indigo-400" />
                Mark Daily Attendance
              </h3>
              <p className="text-xs text-slate-400">
                Mark attendance every morning for your class. Records update live on student & parent portals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:border-indigo-500"
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                Students Enrolled in {classInfo.className}
              </h3>
              <p className="text-xs text-slate-400">
                Primary student roster with guardian contact information.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s, idx) => (
              <Card
                key={s._id || idx}
                className="bg-slate-900/90 border border-slate-800 text-white rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-indigo-600/20">
                      {s.avatar ? (
                        <img src={s.avatar} alt={s.name} className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        (s.name || "S").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{s.name}</h4>
                      <p className="text-xs text-indigo-300 font-mono font-medium">
                        Roll No: {s.rollNo}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                    Enrolled
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  {s.guardianDetails && (
                    <div className="flex items-center justify-between">
                      <span>Guardian:</span>
                      <span className="text-slate-200 font-medium">
                        {s.guardianDetails.name} ({s.guardianDetails.relation})
                      </span>
                    </div>
                  )}
                  {s.guardianDetails?.phone && s.guardianDetails.phone !== "—" && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> Contact:
                      </span>
                      <span className="text-slate-200 font-mono">
                        {s.guardianDetails.phone}
                      </span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> Email:
                      </span>
                      <span className="text-slate-200 truncate max-w-[150px]">
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

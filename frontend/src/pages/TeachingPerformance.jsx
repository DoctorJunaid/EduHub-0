import React, { useEffect, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  UserCheck,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Eye,
  UserPlus,
  X,
} from "lucide-react";
import {
  getCampusPerformance,
  getTeacherTimeline,
  generateSessions,
  assignSubstituteToSession,
} from "@/api/classSession.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import "./TeachingPerformance.css";

const formatPKR = (amt) =>
  `PKR ${Number(amt || 0).toLocaleString("en-PK")}`;

export default function TeachingPerformance() {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // Timeline Modal State
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [timelineRecords, setTimelineRecords] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Substitute Modal State
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [activeSessionForSub, setActiveSessionForSub] = useState(null);
  const [subTeacherId, setSubTeacherId] = useState("");
  const [subReason, setSubReason] = useState("Teacher Absent");
  const [subNotes, setSubNotes] = useState("");
  const [assigningSub, setAssigningSub] = useState(false);

  const loadPerformance = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await getCampusPerformance({ month: selectedMonth });
      if (res.data?.success) {
        setPerformanceData(res.data.data);
        if (showToast) toast.success("Teaching performance updated.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load teaching records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [selectedMonth]);

  const handleGenerateToday = async () => {
    try {
      setGenerating(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await generateSessions({ date: todayStr });
      if (res.data?.success) {
        toast.success(`Generated/synced ${res.data.count} class sessions for today.`);
        loadPerformance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate class sessions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenTimeline = async (teacher) => {
    setActiveTeacher(teacher);
    setTimelineOpen(true);
    setLoadingTimeline(true);
    try {
      const res = await getTeacherTimeline(teacher.teacherId, { month: selectedMonth });
      if (res.data?.success) {
        setTimelineRecords(res.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load teacher timeline.");
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleOpenAssignSubstitute = (session) => {
    setActiveSessionForSub(session);
    setSubTeacherId("");
    setSubReason("Teacher Absent");
    setSubNotes("");
    setSubstituteOpen(true);
  };

  const handleAssignSubstituteSubmit = async (e) => {
    e.preventDefault();
    if (!subTeacherId) {
      toast.error("Please select a substitute teacher.");
      return;
    }

    try {
      setAssigningSub(true);
      const res = await assignSubstituteToSession(activeSessionForSub._id, {
        substituteTeacherId: subTeacherId,
        reason: subReason,
        notes: subNotes,
      });

      if (res.data?.success) {
        toast.success("Substitute teacher assigned successfully!");
        setSubstituteOpen(false);
        if (activeTeacher) {
          handleOpenTimeline(activeTeacher);
        }
        loadPerformance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign substitute.");
    } finally {
      setAssigningSub(false);
    }
  };

  const teachers = performanceData?.teachers || [];
  const totals = performanceData?.totals || {};

  const departments = [
    "All",
    ...new Set(teachers.map((t) => t.department).filter(Boolean)),
  ];

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      `${t.name || ""} ${t.email || ""} ${t.designation || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === "All" ? true : t.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="teaching-performance-page">
      <section className="tp-summary-grid" aria-label="Teaching performance summary">
        <article className="tp-summary-card"><Calendar aria-hidden="true" /><div><span className="tp-summary-label">Scheduled Classes</span><strong className="tp-summary-value">{totals.scheduled || 0}</strong><span className="tp-summary-support">{performanceData?.totalTeachers || 0} Teachers</span></div></article>
        <article className="tp-summary-card"><CheckCircle2 aria-hidden="true" /><div><span className="tp-summary-label">Completed (Credits)</span><strong className="tp-summary-value">{totals.completed || 0}</strong><span className="tp-summary-support">{totals.credits || 0} Teaching Credits</span></div></article>
        <article className="tp-summary-card"><AlertCircle aria-hidden="true" /><div><span className="tp-summary-label">Missed &amp; Absent</span><strong className="tp-summary-value">{(totals.missed || 0) + (totals.absent || 0)}</strong><span className="tp-summary-support">{totals.missed || 0} Missed, {totals.absent || 0} Absent</span></div></article>
        <article className="tp-summary-card"><UserCheck aria-hidden="true" /><div><span className="tp-summary-label">Substitutions</span><strong className="tp-summary-value">{totals.substitutionsTaken || 0}</strong><span className="tp-summary-support">Duties fulfilled</span></div></article>
        <article className="tp-summary-card"><TrendingUp aria-hidden="true" /><div><span className="tp-summary-label">Bonus Accrued</span><strong className="tp-summary-value tp-summary-value-money">+{formatPKR(totals.bonusesEarned)}</strong><span className="tp-summary-support">Substitute rewards</span></div></article>
        <article className="tp-summary-card"><Clock3 aria-hidden="true" /><div><span className="tp-summary-label">Pending Reviews</span><strong className="tp-summary-value">{totals.pendingReviews || 0}</strong><span className="tp-summary-support">Requires manager review</span></div></article>
      </section>

      <section className="tp-action-toolbar" aria-label="Teaching performance actions">
        <div className="tp-header-controls">
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} aria-label="Select performance month" className="tp-month-select" />
          <Button onClick={handleGenerateToday} disabled={generating} className="tp-generate-button"><Clock3 size={14} className={generating ? "animate-spin" : ""} />Generate Today&apos;s Sessions</Button>
          <Button variant="outline" onClick={() => loadPerformance(true)} disabled={loading} className="tp-sync-button"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />Sync</Button>
        </div>
      </section>

      <section className="tp-filter-bar" aria-label="Filter teaching performance">
        <div className="tp-search-field">
          <Search size={15} aria-hidden="true" />
          <Input type="text" placeholder="Search teacher name, email, or designation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="tp-search-input" />
        </div>
        <div className="tp-department-filter">
          <Filter size={15} aria-hidden="true" />
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="tp-department-select" aria-label="Filter by department">
            {departments.map((dept) => (<option key={dept} value={dept}>{dept} Department</option>))}
          </select>
        </div>
      </section>

      <section className="tp-ledger-card">
        <div className="tp-ledger-header"><div className="tp-ledger-heading"><Award size={18} aria-hidden="true" /><h2>Teacher Class Session &amp; Credit Ledger ({selectedMonth})</h2></div><span className="tp-teacher-count">{filteredTeachers.length} teachers</span></div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm"><RefreshCw className="animate-spin inline-block mr-2" size={16} />Loading teaching records...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No teacher records found for this period.</div>
        ) : (
          <div className="tp-table-scroll">
            <table className="tp-ledger-table">
              <colgroup><col className="tp-col-faculty" /><col className="tp-col-scheduled" /><col className="tp-col-completed" /><col className="tp-col-missed" /><col className="tp-col-substitutions" /><col className="tp-col-credits" /><col className="tp-col-money" /><col className="tp-col-money" /><col className="tp-col-review" /><col className="tp-col-action" /></colgroup>
              <thead><tr><th>Faculty Member</th><th className="tp-cell-center">Scheduled</th><th className="tp-cell-center">Completed</th><th className="tp-cell-center">Missed / Absent</th><th className="tp-cell-center">Substitutions</th><th className="tp-cell-center">Credits</th><th className="tp-cell-right">Bonuses</th><th className="tp-cell-right">Deductions</th><th className="tp-cell-center">Pending Reviews</th><th className="tp-cell-right">Timeline</th></tr></thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.teacherId}>
                    <td><div className="tp-faculty-cell"><strong>{t.name}</strong><span>{t.designation || "Teacher"} {"\u2022"} {t.department || "Academics"}</span></div></td>
                    <td className="tp-cell-center tp-number-cell">{t.scheduled}</td>
                    <td className="tp-cell-center tp-number-cell tp-completed-value">{t.completed}</td>
                    <td className="tp-cell-center tp-nowrap">{t.missed > 0 || t.absent > 0 ? <span className="text-rose-600 font-bold">{t.missed} Missed / {t.absent} Absent</span> : <span className="text-slate-400">0</span>}</td>
                    <td className="tp-cell-center tp-nowrap"><span className="tp-substitution-value">+{t.substitutionsTaken} taken</span>{t.substitutedOut > 0 && <span className="tp-substitution-out">({t.substitutedOut} out)</span>}</td>
                    <td className="tp-cell-center tp-credit-value">{t.credits}</td>
                    <td className="tp-cell-right tp-money-value">+{formatPKR(t.bonusesEarned)}</td>
                    <td className="tp-cell-right tp-money-value">-{formatPKR(t.deductionsApproved)}</td>
                    <td className="tp-cell-center tp-nowrap">{t.pendingReviews > 0 ? <span className="tp-review-badge">{t.pendingReviews} Action(s)</span> : <span className="tp-clear-status">Clear</span>}</td>
                    <td className="tp-cell-right tp-nowrap"><Button size="sm" variant="outline" onClick={() => handleOpenTimeline(t)} className="tp-timeline-button"><Eye size={13} /> Timeline</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* Teacher Timeline Modal */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="sm:max-w-4xl bg-white rounded-2xl p-6 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Teaching Timeline — {activeTeacher?.name} ({selectedMonth})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chronological period-by-period class audit records, teaching credits, and adjustments.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-3 border border-slate-200 rounded-xl">
            {loadingTimeline ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Loading class session timeline...
              </div>
            ) : timelineRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No teaching session records for this teacher in {selectedMonth}.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date &amp; Period</th>
                    <th className="py-2.5 px-3">Class &amp; Subject</th>
                    <th className="py-2.5 px-3">Original Teacher</th>
                    <th className="py-2.5 px-3">Actual Teacher</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Credit</th>
                    <th className="py-2.5 px-3">Adjustment</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timelineRecords.map((sess) => (
                    <tr key={sess._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                        <div>
                          <span>{new Date(sess.date).toLocaleDateString()}</span>
                          <span className="text-slate-400 block text-[10px]">
                            Period {sess.period} ({sess.startTime}–{sess.endTime})
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                        <strong>{sess.subject}</strong>
                        <span className="block text-[11px] text-slate-500">
                          {sess.className} {sess.section ? `(${sess.section})` : ""}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {sess.originalTeacherId?.name || "Teacher"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-medium">
                        {sess.actualTeacherId?.name || "Teacher"}
                        {sess.isSubstituted && (
                          <span className="text-purple-700 block text-[10px] font-bold">
                            Substitute Duty
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          sess.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : sess.status === "Missed" || sess.status === "Absent"
                            ? "bg-rose-100 text-rose-800"
                            : sess.status === "Substituted"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {sess.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {sess.status === "Completed" ? (
                          <span className="text-emerald-700">+{sess.creditValue || 1} Cr</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {sess.bonusValue > 0 ? (
                          <span className="text-purple-700 font-bold block">
                            +{formatPKR(sess.bonusValue)}
                          </span>
                        ) : sess.deductionValue > 0 ? (
                          <span className="text-rose-600 font-bold block">
                            -{formatPKR(sess.deductionValue)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {sess.adjustmentReview?.status && sess.adjustmentReview.status !== "None" && (
                          <span className="text-[10px] text-amber-700 block font-semibold">
                            {sess.adjustmentReview.status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {sess.status === "Scheduled" && !sess.isSubstituted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssignSubstitute(sess)}
                            className="h-6 px-2 text-[11px] rounded-md text-purple-700 border-purple-200 hover:bg-purple-50"
                          >
                            <UserPlus size={11} className="mr-1" /> Substitute
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setTimelineOpen(false)}
              className="rounded-xl text-xs"
            >
              Close Timeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Substitute Modal */}
      <Dialog open={substituteOpen} onOpenChange={setSubstituteOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus size={20} className="text-purple-600" />
              Assign Substitute Teacher
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign an available colleague to cover this lecture. Timetable, credits, and bonuses will update automatically.
            </DialogDescription>
          </DialogHeader>

          {activeSessionForSub && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 mb-2">
              <div>
                <strong className="text-slate-800">Class: </strong>
                {activeSessionForSub.subject} ({activeSessionForSub.className})
              </div>
              <div>
                <strong className="text-slate-800">Time: </strong>
                Period {activeSessionForSub.period} ({activeSessionForSub.startTime} – {activeSessionForSub.endTime})
              </div>
              <div>
                <strong className="text-slate-800">Date: </strong>
                {new Date(activeSessionForSub.date).toLocaleDateString()}
              </div>
            </div>
          )}

          <form onSubmit={handleAssignSubstituteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Substitute Teacher
              </label>
              <select
                value={subTeacherId}
                onChange={(e) => setSubTeacherId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">-- Choose faculty member --</option>
                {teachers
                  .filter(
                    (t) =>
                      String(t.teacherId) !==
                      String(activeSessionForSub?.originalTeacherId?._id || activeSessionForSub?.originalTeacherId)
                  )
                  .map((t) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.department})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Substitution
              </label>
              <select
                value={subReason}
                onChange={(e) => setSubReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Teacher Absent">Teacher Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Training">Training / Workshop</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Notes / Instructions
              </label>
              <input
                type="text"
                placeholder="Chapter 4 exercises, lab supervision, etc..."
                value={subNotes}
                onChange={(e) => setSubNotes(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubstituteOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assigningSub}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                {assigningSub ? "Assigning..." : "Confirm Substitution"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

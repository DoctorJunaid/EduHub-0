import React, { useEffect, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, Loader2, UserPlus, UsersRound } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import FullPageFormShell from "@/components/common/FullPageFormShell";

const teacherName = (teacher) => teacher?.name || teacher?.user?.name || teacher?.email || "Teacher";

const AssignSubstituteDialog = ({ isOpen, onClose, onSuccess, selectedDate }) => {
  const [formData, setFormData] = useState({ date: selectedDate || new Date().toISOString().split("T")[0], period: 1, startTime: "08:00", endTime: "08:45", className: "", subject: "", section: "", originalTeacherId: "", substituteTeacherId: "", reason: "Teacher Absent", notes: "" });
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData((current) => ({ ...current, date: selectedDate || current.date }));
    api.get("/campus/faculty").then((res) => res.data.success && setAllTeachers(res.data.data)).catch(() => toast.error("Failed to load teachers."));
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!formData.date || !formData.className || !formData.period) return setAvailableTeachers([]);
      try {
        setLoadingSuggestions(true);
        const res = await api.get("/campus/substitutes/suggest", { params: { date: formData.date, period: formData.period, className: formData.className, section: formData.section } });
        if (res.data.success) {
          const teachers = res.data.data.filter((teacher) => teacher._id !== formData.originalTeacherId);
          setAvailableTeachers(teachers);
          if (!teachers.some((teacher) => teacher._id === formData.substituteTeacherId)) setFormData((current) => ({ ...current, substituteTeacherId: "" }));
        }
      } catch { toast.error("Failed to find available teachers."); }
      finally { setLoadingSuggestions(false); }
    };
    fetchSuggestions();
  }, [formData.date, formData.className, formData.section, formData.period, formData.originalTeacherId]);

  const change = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!formData.originalTeacherId || !formData.substituteTeacherId) return toast.error("Select both the original and substitute teacher.");
    try {
      setSubmitting(true);
      const res = await api.post("/campus/substitutes", formData);
      if (res.data.success) { toast.success("Substitute assigned successfully."); onSuccess(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to assign substitute."); }
    finally { setSubmitting(false); }
  };
  if (!isOpen) return null;
  const ready = formData.originalTeacherId && formData.substituteTeacherId;

  return <div className="substitute-assignment-form"><FullPageFormShell title="Assign Substitute" subtitle="Set class coverage details and select an available teacher for the period." parentName="Substitute Assignments" icon={<UsersRound size={22} />} onBack={onClose}>
    <form onSubmit={submit}>
      <div className="activity-form-grid">
        <div className="activity-section-title">Class Schedule</div>
        <div className="activity-form-field"><label htmlFor="substitute-date">Date *</label><input id="substitute-date" type="date" name="date" value={formData.date} onChange={change} required /></div>
        <div className="activity-form-field"><label htmlFor="substitute-period">Period *</label><input id="substitute-period" type="number" name="period" min="1" max="12" value={formData.period} onChange={change} required /></div>
        <div className="activity-form-field"><label htmlFor="substitute-start">Start Time *</label><input id="substitute-start" type="time" name="startTime" value={formData.startTime} onChange={change} required /></div>
        <div className="activity-form-field"><label htmlFor="substitute-end">End Time *</label><input id="substitute-end" type="time" name="endTime" value={formData.endTime} onChange={change} required /></div>

        <div className="activity-section-title">Class &amp; Teacher Details</div>
        <div className="activity-form-field"><label htmlFor="substitute-class">Class *</label><input id="substitute-class" name="className" placeholder="e.g. Grade 10" value={formData.className} onChange={change} required /></div>
        <div className="activity-form-field"><label htmlFor="substitute-section">Section</label><input id="substitute-section" name="section" placeholder="e.g. A" value={formData.section} onChange={change} /></div>
        <div className="activity-form-field"><label htmlFor="substitute-subject">Subject *</label><input id="substitute-subject" name="subject" placeholder="e.g. Mathematics" value={formData.subject} onChange={change} required /></div>
        <div className="activity-form-field"><label htmlFor="substitute-original">Original Teacher *</label><select id="substitute-original" name="originalTeacherId" value={formData.originalTeacherId} onChange={change} required><option value="">Select original teacher</option>{allTeachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacherName(teacher)}</option>)}</select></div>
        <div className="activity-form-field"><label htmlFor="substitute-reason">Reason *</label><select id="substitute-reason" name="reason" value={formData.reason} onChange={change}><option>Teacher Absent</option><option>On Leave</option><option>Training</option><option>Emergency</option><option>Other</option></select></div>

        <div className="activity-section-title">Available Substitute Teacher</div>
        <div className="activity-form-field span-2 substitute-candidates">
          {!formData.className ? <p className="substitute-form-notice"><Calendar size={16} /> Enter the class details to view available teachers.</p> : loadingSuggestions ? <p className="substitute-form-notice"><Loader2 size={16} className="animate-spin" /> Finding available teachers…</p> : availableTeachers.length === 0 ? <p className="substitute-form-warning"><AlertCircle size={16} /> No teachers are available for this period.</p> : <div className="substitute-candidate-grid">{availableTeachers.map((teacher) => {
            const selected = formData.substituteTeacherId === teacher._id;
            return <label key={teacher._id} className={`substitute-candidate ${selected ? "is-selected" : ""}`}><input type="radio" name="substituteTeacherId" value={teacher._id} checked={selected} onChange={change} /><span className="substitute-candidate-avatar">{teacherName(teacher).split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><span><strong>{teacherName(teacher)}</strong><small>{teacher.department || "General Faculty"}{teacher.subjects?.length ? ` · ${teacher.subjects.join(", ")}` : ""}</small></span>{teacher.warning && <span className="substitute-load-warning">High load</span>}</label>;
          })}</div>}
        </div>
        <div className="activity-form-field span-2"><label htmlFor="substitute-notes">Notes <span>(Optional)</span></label><textarea id="substitute-notes" name="notes" rows="3" maxLength="300" placeholder="Add instructions for the substitute teacher…" value={formData.notes} onChange={change} /></div>
      </div>
      <div className="activity-form-actions"><span className={ready ? "substitute-ready is-ready" : "substitute-ready"}>{ready ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{ready ? "Ready to assign coverage" : "Select the original and substitute teacher"}</span><div className="activity-form-action-buttons"><button type="button" className="activity-cancel-btn" onClick={onClose}>Cancel</button><button type="submit" className="activity-submit-btn" disabled={submitting || !ready}>{submitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}{submitting ? "Assigning…" : "Assign Substitute"}</button></div></div>
    </form>
  </FullPageFormShell></div>;
};

export default AssignSubstituteDialog;

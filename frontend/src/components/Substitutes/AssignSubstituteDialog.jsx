import React, { useState, useEffect } from "react";
import { X, Search, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";

const AssignSubstituteDialog = ({ isOpen, onClose, onSuccess, selectedDate }) => {
  const [formData, setFormData] = useState({
    date: selectedDate,
    period: 1,
    startTime: "08:00",
    endTime: "08:45",
    className: "",
    subject: "",
    section: "",
    originalTeacherId: "",
    substituteTeacherId: "",
    reason: "Teacher Absent",
    notes: ""
  });

  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch all teachers to populate the Original Teacher dropdown
    const fetchAllTeachers = async () => {
      try {
        const res = await api.get('/campus/faculty'); // Assuming an endpoint exists, fallback to standard profile fetching if not
        // Actually we might need a specific endpoint to list teachers. If it doesn't exist we will mock it or handle errors.
        if (res.data.success) {
          setAllTeachers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load teachers for original teacher dropdown");
      }
    };
    if (isOpen) {
      fetchAllTeachers();
    }
  }, [isOpen]);

  useEffect(() => {
    // Automatically suggest teachers when date, class, and period are selected
    if (formData.date && formData.className && formData.period) {
      fetchSuggestions();
    } else {
      setAvailableTeachers([]);
    }
  }, [formData.date, formData.className, formData.section, formData.period]);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await api.get(`/campus/substitutes/suggest`, {
        params: {
          date: formData.date,
          period: formData.period,
          className: formData.className,
          section: formData.section
        }
      });
      if (res.data.success) {
        // Exclude the original teacher from the list
        const filtered = res.data.data.filter(t => t._id !== formData.originalTeacherId);
        setAvailableTeachers(filtered);
      }
    } catch (err) {
      toast.error("Failed to fetch available teachers");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.originalTeacherId || !formData.substituteTeacherId) {
      return toast.error("Please select both original and substitute teachers");
    }

    try {
      setSubmitting(true);
      const res = await api.post('/campus/substitutes', formData);
      if (res.data.success) {
        toast.success("Substitute assigned successfully");
        onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign substitute");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="substitute-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="assign-dialog-shell bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="assign-dialog-header flex justify-between items-center p-6 border-b border-gray-800">
          <div>
            <span className="assign-dialog-kicker">Staff operations</span>
            <h2 className="text-xl font-semibold text-white">Assign Substitute</h2>
            <p>Set the coverage details and choose an available teacher.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="assign-dialog-body p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="substituteForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="assign-section">
              <div className="assign-section-title"><span>01</span><div><strong>Schedule</strong><small>When should the cover class run?</small></div></div>
            <div className="assign-field-grid grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">Period</label>
                <input type="number" name="period" value={formData.period} onChange={handleChange} required min="1" max="12"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="assign-field-grid grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            </div>

            <div className="assign-section">
              <div className="assign-section-title"><span>02</span><div><strong>Class coverage</strong><small>Identify the class and the reason.</small></div></div>
            <div className="assign-field-grid assign-field-grid-three grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">Class</label>
                <input type="text" name="className" placeholder="e.g. 10th" value={formData.className} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">Section</label>
                <input type="text" name="section" placeholder="e.g. A" value={formData.section} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                <input type="text" name="subject" placeholder="e.g. Math" value={formData.subject} onChange={handleChange} required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="assign-field">
              <label>Original teacher</label>
              <select name="originalTeacherId" value={formData.originalTeacherId} onChange={handleChange} required>
                <option value="">Select original teacher</option>
                {allTeachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name || teacher.user?.name || teacher.email || "Teacher"}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
              <select name="reason" value={formData.reason} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500">
                <option value="Teacher Absent">Teacher Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Training">Training</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
            </div>

            <div className="assign-section assign-teacher-section border-t border-gray-800 pt-6">
              <div className="assign-section-title"><span>03</span><div><strong>Choose substitute</strong><small>Suggestions update as you refine the class.</small></div></div>
              <h3 className="assign-suggestion-title text-lg font-medium text-white mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-400" />
                Select Substitute Teacher
              </h3>
              
              {loadingSuggestions ? (
                <div className="text-center py-4 text-gray-400">Finding available teachers...</div>
              ) : formData.className === "" ? (
                <div className="text-center py-4 text-gray-500">Enter Class details to see suggestions</div>
              ) : availableTeachers.length === 0 ? (
                <div className="text-center py-4 text-yellow-500">No teachers available for this period.</div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {availableTeachers.map(teacher => (
                    <label key={teacher._id} className={`assign-teacher-card flex items-start p-4 rounded-xl cursor-pointer transition-colors border ${formData.substituteTeacherId === teacher._id ? 'is-selected bg-blue-600/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>
                      <input type="radio" name="substituteTeacherId" value={teacher._id} checked={formData.substituteTeacherId === teacher._id} onChange={handleChange} className="mt-1" />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-white">{teacher.name}</span>
                          {teacher.warning && <span className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3 mr-1"/> High Load</span>}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">{teacher.department} • {teacher.subjects?.join(", ")}</div>
                        <div className="text-xs text-gray-500 mt-2 flex gap-4">
                          <span>Daily Load: {teacher.dailyLoad}</span>
                          <span>Weekly Load: {teacher.weeklyLoad}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="assign-field">
              <label>Notes <span>(optional)</span></label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" maxLength="300"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 custom-scrollbar"></textarea>
            </div>

          </form>
        </div>

        <div className="assign-dialog-footer p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button onClick={onClose} className="assign-cancel-btn px-5 py-2.5 text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button type="submit" form="substituteForm" disabled={submitting || !formData.originalTeacherId || !formData.substituteTeacherId} className="assign-submit-btn px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
            {submitting ? "Assigning..." : "Assign Substitute"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignSubstituteDialog;

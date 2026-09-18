import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar as CalendarIcon, User, RefreshCw, X, Check, XCircle } from "lucide-react";
import api from "../../api/axiosInstance";
import { toast } from "react-hot-toast";
import AssignSubstituteDialog from "./AssignSubstituteDialog";
import "./SubstituteAssignments.css";

const SubstituteAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [selectedDate]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/campus/substitutes?date=${selectedDate}`);
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load substitutes");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this assignment?")) return;
    try {
      const res = await api.delete(`/campus/substitutes/${id}`);
      if (res.data.success) {
        toast.success("Assignment cancelled");
        fetchAssignments();
      }
    } catch (err) {
      toast.error("Failed to cancel assignment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/campus/substitutes/${id}`, { status });
      if (res.data.success) {
        toast.success(`Status updated to ${status}`);
        fetchAssignments();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending Approval': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Cancelled': case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="substitutes-container p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Substitute Assignments</h1>
          <p className="text-gray-400">Manage teacher substitutions and load limits.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800/80 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Assign Substitute
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-700/50">
                <th className="p-4 font-semibold text-gray-300">Period & Time</th>
                <th className="p-4 font-semibold text-gray-300">Class</th>
                <th className="p-4 font-semibold text-gray-300">Original Teacher</th>
                <th className="p-4 font-semibold text-gray-300">Substitute</th>
                <th className="p-4 font-semibold text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No substitute assignments for this date.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">Period {assignment.period}</div>
                      <div className="text-xs text-gray-400">{assignment.startTime} - {assignment.endTime}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{assignment.className} {assignment.section && `- ${assignment.section}`}</div>
                      <div className="text-xs text-blue-400">{assignment.subject}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-300">{assignment.originalTeacherId?.user?.name || "Unknown"}</span>
                      </div>
                      <div className="text-xs text-red-400 mt-1 pl-6">{assignment.reason}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="font-medium text-white">{assignment.substituteTeacherId?.user?.name || "Unknown"}</span>
                      </div>
                      {assignment.bonusEligible && (
                        <div className="text-xs text-green-400 mt-1 pl-6">Bonus: ${assignment.bonusAmount}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusBadgeClass(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {assignment.status === 'Pending Approval' && (
                          <button onClick={() => handleUpdateStatus(assignment._id, 'Assigned')} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {assignment.status === 'Assigned' && (
                          <button onClick={() => handleUpdateStatus(assignment._id, 'Completed')} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition" title="Mark Completed">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {['Assigned', 'Pending Approval'].includes(assignment.status) && (
                          <button onClick={() => handleCancel(assignment._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <AssignSubstituteDialog 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          onSuccess={() => {
            setIsDialogOpen(false);
            fetchAssignments();
          }}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default SubstituteAssignments;

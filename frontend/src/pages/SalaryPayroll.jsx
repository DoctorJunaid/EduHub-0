import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axiosInstance";
import PayslipDialog from "../components/Payroll/PayslipDialog";
import { toast } from "react-hot-toast";
import { Play, Eye, ChevronLeft, ChevronRight, CheckCircle, Banknote } from "lucide-react";
import { selectCurrentRole } from "../store/Slices/authSlice";

const SalaryPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const role = useSelector(selectCurrentRole);
  const canEdit = ["campus_admin", "campus_manager"].includes(role);
  const canApprove = ["campus_admin", "institute_admin", "principal"].includes(role);
  const canPay = role === "accountant";

  // Default to current month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ month, page, limit });
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`/campus/salary/payroll?${params.toString()}`);
      if (res.data.success) {
        setPayrolls(res.data.data.records);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, page, statusFilter]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post("/campus/salary/payroll/generate", { month });
      if (res.data.success) {
        const { generated, skipped, total: totalTeachers } = res.data.data;
        toast.success(
          `Payroll generated: ${generated} created, ${skipped} skipped (non-Draft), ${totalTeachers} total`
        );
        fetchPayrolls();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const viewPayslip = async (id) => {
    try {
      const res = await api.get(`/campus/salary/payroll/${id}`);
      if (res.data.success) {
        setSelectedPayslip(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load payslip");
    }
  };

  const updateWorkflow = async (id, action, payload = {}) => {
    try {
      const endpoint = action === "edit"
        ? `/campus/salary/payroll/${id}`
        : `/campus/salary/payroll/${id}/${action}`;
      const response = action === "edit"
        ? await api.put(endpoint, payload)
        : await api.post(endpoint);
      if (response.data.success) {
        toast.success(action === "mark-paid" ? "Payroll marked as paid" : `Payroll ${action}d`);
        fetchPayrolls();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Payroll update failed");
    }
  };

  const addAdjustment = async (payroll, type) => {
    const reason = window.prompt(`Enter ${type} reason`);
    const amount = Number(window.prompt(`Enter ${type} amount`));
    if (!reason || !Number.isFinite(amount) || amount <= 0) return;
    await updateWorkflow(payroll._id, "edit", {
      [type === "deduction" ? "deduction" : "bonus"]: {
        reason,
        category: "Other",
        amount,
      },
    });
  };

  const formatPKR = (amount) =>
    `PKR ${(amount || 0).toLocaleString("en-PK")}`;

  const totalPages = Math.ceil(total / limit);

  const statusBadge = (status) => {
    const colors = {
      Draft: "bg-yellow-500/20 text-yellow-400",
      Approved: "bg-blue-500/20 text-blue-400",
      Paid: "bg-green-500/20 text-green-400",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-500/20 text-gray-400"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Salary & Payroll</h1>
        <div className="flex items-center gap-3">
          {/* Month Picker */}
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1); }}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
          </select>
          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : "Generate Payroll"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass-panel p-4 rounded-xl">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading payroll data...</div>
        ) : payrolls.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No payroll records found for {month}. Click "Generate Payroll" to create them.
          </div>
        ) : (
          <table className="min-w-full text-left text-white">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Teacher</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Gross</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Deductions</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Bonuses</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Net</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm">
                    {p.teacherProfileId?.user?.name || p.teacherProfileId?.employeeId || p.teacherProfileId || "Unknown teacher"}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-400">{formatPKR(p.grossSalary)}</td>
                  <td className="px-4 py-3 text-sm text-red-400">−{formatPKR(p.deductionsTotal)}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">+{formatPKR(p.bonusesTotal)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-400">{formatPKR(p.netSalary)}</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={() => viewPayslip(p._id)} className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </button>
                      {p.status === "Draft" && canEdit && <>
                        <button onClick={() => addAdjustment(p, "deduction")} className="text-red-400 hover:text-red-300">+ Deduction</button>
                        <button onClick={() => addAdjustment(p, "bonus")} className="text-green-400 hover:text-green-300">+ Bonus</button>
                      </>}
                      {p.status === "Draft" && canApprove && <button onClick={() => updateWorkflow(p._id, "approve")} className="flex items-center text-blue-400 hover:text-blue-300"><CheckCircle className="w-4 h-4 mr-1" /> Approve</button>}
                      {p.status === "Approved" && canPay && <button onClick={() => updateWorkflow(p._id, "mark-paid")} className="flex items-center text-green-400 hover:text-green-300"><Banknote className="w-4 h-4 mr-1" /> Mark Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Payslip Dialog */}
      {selectedPayslip && (
        <PayslipDialog
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
};

export default SalaryPayroll;

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axiosInstance";
import PayslipDialog from "../components/Payroll/PayslipDialog";
import { toast } from "react-hot-toast";
import { Play, Eye, ChevronLeft, ChevronRight, CheckCircle, Banknote, Search, WalletCards, CircleCheck, Clock3, ReceiptText } from "lucide-react";
import { selectCurrentRole } from "../store/Slices/authSlice";
import "./SalaryPayroll.css";

const SalaryPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
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
  const filteredPayrolls = payrolls.filter((payroll) => {
    const name = payroll.teacherProfileId?.user?.name || payroll.teacherProfileId?.employeeId || "";
    return name.toLowerCase().includes(search.trim().toLowerCase());
  });
  const summary = payrolls.reduce((result, payroll) => {
    result.gross += Number(payroll.grossSalary || 0);
    result.net += Number(payroll.netSalary || 0);
    if (payroll.status === "Draft") result.draft += 1;
    if (payroll.status === "Paid") result.paid += 1;
    return result;
  }, { gross: 0, net: 0, draft: 0, paid: 0 });

  const statusBadge = (status) => {
    const colors = {
      Draft: "payroll-status payroll-status-draft",
      Approved: "payroll-status payroll-status-approved",
      Paid: "payroll-status payroll-status-paid",
    };
    return (
      <span className={colors[status] || "payroll-status payroll-status-default"}>
        {status}
      </span>
    );
  };

  return (
    <div className="salary-payroll-page campus-tab-page">
      <div className="salary-payroll-heading">
        <div><span className="salary-payroll-eyebrow">Finance / monthly close</span><h1>Salary &amp; Payroll</h1><p>Generate, review, approve, and settle monthly teacher payroll.</p></div>
        <button type="button" className="toolbar-btn toolbar-btn-primary" onClick={handleGenerate} disabled={generating}><Play size={13} /> {generating ? "Generating..." : "Generate Payroll"}</button>
      </div>

      <div className="campus-kpi-track salary-payroll-kpis">
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><WalletCards size={16} /></div><div className="kpi-info"><span className="kpi-label">Gross payroll</span><span className="kpi-value">{formatPKR(summary.gross)}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><ReceiptText size={16} /></div><div className="kpi-info"><span className="kpi-label">Net payroll</span><span className="kpi-value">{formatPKR(summary.net)}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><Clock3 size={16} /></div><div className="kpi-info"><span className="kpi-label">Draft records</span><span className="kpi-value">{summary.draft}</span></div></div></div>
        <div className="campus-kpi-card"><div className="kpi-wrap"><div className="kpi-icon"><CircleCheck size={16} /></div><div className="kpi-info"><span className="kpi-label">Paid records</span><span className="kpi-value">{summary.paid}</span></div></div></div>
      </div>

      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search"><Search size={13} /><input type="search" placeholder="Search teacher..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <input className="payroll-month-filter" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }} aria-label="Payroll month" />
          <select className="toolbar-select" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter payroll status"><option value="">All Statuses</option><option value="Draft">Draft</option><option value="Approved">Approved</option><option value="Paid">Paid</option></select>
          {(search || statusFilter) && <button type="button" className="toolbar-btn toolbar-btn-outline" onClick={() => { setSearch(""); setStatusFilter(""); }}>Reset</button>}
        </div>
        <div className="toolbar-actions"><span className="salary-payroll-result-count">{filteredPayrolls.length} shown / {total} records</span></div>
      </div>

      <div className="campus-table-container salary-payroll-table-wrap">
        {loading ? (
          <div className="salary-payroll-state">Loading payroll data...</div>
        ) : payrolls.length === 0 ? (
          <div className="salary-payroll-state"><ReceiptText size={24} /><strong>No payroll records for {month}</strong><span>Generate payroll to create the monthly draft records.</span></div>
        ) : (
          <div className="overflow-x-auto"><table className="salary-payroll-table">
            <thead>
              <tr>
                <th>Teacher</th><th>Gross</th><th>Deductions</th><th>Bonuses</th><th>Net salary</th><th>Status</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrolls.map((p) => (
                <tr key={p._id}>
                  <td><div className="payroll-person"><span>{(p.teacherProfileId?.user?.name || "T").slice(0, 1)}</span><div><strong>{p.teacherProfileId?.user?.name || p.teacherProfileId?.employeeId || "Unknown teacher"}</strong><small>{p.teacherProfileId?.designation || p.teacherProfileId?.department || "Teaching staff"}</small></div></div></td>
                  <td><strong className="payroll-amount">{formatPKR(p.grossSalary)}</strong></td>
                  <td><span className="payroll-deduction">-{formatPKR(p.deductionsTotal)}</span></td>
                  <td><span className="payroll-bonus">+{formatPKR(p.bonusesTotal)}</span></td>
                  <td><strong className="payroll-net">{formatPKR(p.netSalary)}</strong></td>
                  <td>{statusBadge(p.status)}</td>
                  <td className="text-right"><div className="payroll-actions">
                      <button onClick={() => viewPayslip(p._id)} className="payroll-action-btn"><Eye size={13} /> View</button>
                      {p.status === "Draft" && canEdit && <>
                        <button onClick={() => addAdjustment(p, "deduction")} className="payroll-action-btn payroll-action-negative">+ Deduction</button>
                        <button onClick={() => addAdjustment(p, "bonus")} className="payroll-action-btn payroll-action-positive">+ Bonus</button>
                      </>}
                      {p.status === "Draft" && canApprove && <button onClick={() => updateWorkflow(p._id, "approve")} className="payroll-action-btn payroll-action-primary"><CheckCircle size={13} /> Approve</button>}
                      {p.status === "Approved" && canPay && <button onClick={() => updateWorkflow(p._id, "mark-paid")} className="payroll-action-btn payroll-action-positive"><Banknote size={13} /> Mark Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="salary-payroll-pagination">
          <p>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="payroll-page-controls">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="payroll-page-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="payroll-page-btn"
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

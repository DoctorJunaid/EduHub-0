import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axiosInstance";
import { toast } from "react-hot-toast";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
  FileCheck2,
  DollarSign,
} from "lucide-react";
import { selectCurrentRole } from "../store/Slices/authSlice";
import ApprovalProofDialog from "../components/Payroll/ApprovalProofDialog";
import DataPagination from "../components/shared/DataPagination";
import usePaginationParams from "../hooks/usePaginationParams";
import "./PayrollApprovals.css";

const PayrollApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [total, setTotal] = useState(0);
  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  // Role permissions
  const role = useSelector(selectCurrentRole);
  const canApprove = [
    "campus_admin",
    "campus_manager",
    "institute_admin",
    "principal",
    "super_admin",
  ].includes(role);

  // Default month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ month, page, limit: pageSize });
      if (statusFilter && statusFilter !== "All") {
        params.append("status", statusFilter);
      }
      const res = await api.get(`/campus/salary/approvals?${params.toString()}`);
      if (res.data.success) {
        setApprovals(res.data.data.records || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [month, page, pageSize, statusFilter]);

  const handleApprove = async (id, { notes } = {}) => {
    try {
      const res = await api.post(`/campus/salary/approvals/${id}/approve`, {
        notes,
      });
      if (res.data.success) {
        toast.success("Deduction & bonus approval authorized successfully");
        fetchApprovals();
        if (selectedApproval && selectedApproval._id === id) {
          setSelectedApproval(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process approval");
      throw err;
    }
  };

  const handleReject = async (id, { reason, notes } = {}) => {
    try {
      const res = await api.post(`/campus/salary/approvals/${id}/reject`, {
        reason,
        notes,
      });
      if (res.data.success) {
        toast.success("Approval request rejected. No deductions applied.");
        fetchApprovals();
        if (selectedApproval && selectedApproval._id === id) {
          setSelectedApproval(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reject approval");
      throw err;
    }
  };

  const openProofModal = async (item) => {
    try {
      // Fetch full populated record if needed
      const res = await api.get(`/campus/salary/approvals/${item._id}`);
      if (res.data.success) {
        setSelectedApproval(res.data.data);
        setIsProofModalOpen(true);
      } else {
        setSelectedApproval(item);
        setIsProofModalOpen(true);
      }
    } catch (err) {
      setSelectedApproval(item);
      setIsProofModalOpen(true);
    }
  };

  // Client search filtering
  const filteredApprovals = approvals.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const teacherName =
      item.teacherProfileId?.user?.name ||
      item.teacherProfileId?.name ||
      item.absenceProof?.teacherSnapshot?.name ||
      "";
    const dept =
      item.teacherProfileId?.department ||
      item.absenceProof?.teacherSnapshot?.department ||
      "";
    const marker = item.absenceProof?.markedBy?.name || "";
    return (
      teacherName.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q) ||
      marker.toLowerCase().includes(q)
    );
  });

  // Calculate high-level summary counts from current month records
  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const approvedCount = approvals.filter((a) => a.status === "Approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "Rejected").length;
  const totalDeductionSum = approvals.reduce(
    (sum, a) => sum + (a.deductionProof?.deductionAmount || 0),
    0
  );

  return (
    <div className="approvals-page-shell campus-tab-page">
      <div className="approvals-header">
        <nav className="approvals-breadcrumb" aria-label="Breadcrumb">
          <span>Home</span><span aria-hidden="true">/</span><span aria-current="page">Payroll Approvals</span>
        </nav>
      </div>

      <div className="approvals-kpi-grid campus-kpi-track">
        <div className="kpi-card campus-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Pending Review</span>
            <div className="kpi-value text-amber-600 dark:text-amber-400">{pendingCount}</div>
            <span className="kpi-subtext">Requires Admin authorization</span>
          </div>
          <div className="kpi-icon-box amber"><Clock size={22} /></div>
        </div>
        <div className="kpi-card campus-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Approved &amp; Applied</span>
            <div className="kpi-value text-emerald-600 dark:text-emerald-400">{approvedCount}</div>
            <span className="kpi-subtext">Cryptographically linked</span>
          </div>
          <div className="kpi-icon-box emerald"><ShieldCheck size={22} /></div>
        </div>
        <div className="kpi-card campus-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Rejected / Cancelled</span>
            <div className="kpi-value text-rose-600 dark:text-rose-400">{rejectedCount}</div>
            <span className="kpi-subtext">Zero deduction applied</span>
          </div>
          <div className="kpi-icon-box rose"><ShieldAlert size={22} /></div>
        </div>
        <div className="kpi-card campus-kpi-card">
          <div className="kpi-content">
            <span className="kpi-label">Total Deductions in Scope</span>
            <div className="kpi-value text-slate-800 dark:text-white font-mono">PKR {totalDeductionSum.toLocaleString()}</div>
            <span className="kpi-subtext">For month {month}</span>
          </div>
          <div className="kpi-icon-box indigo"><DollarSign size={22} /></div>
        </div>
      </div>

      <div className="approvals-month-row">
        <div className="approvals-month-label">Review month</div>
        <div className="approvals-header-right">
          <div className="month-picker-wrapper">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="month-input"
            />
          </div>
          <button
            type="button"
            onClick={fetchApprovals}
            className="refresh-btn"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="approvals-control-bar">
        <div className="status-tab-group">
          {["Pending", "Approved", "Rejected", "Cancelled", "All"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`status-tab ${statusFilter === tab ? "active" : ""}`}
            >
              {tab === "Pending" && pendingCount > 0 && (
                <span className="pulse-indicator" />
              )}
              {tab}
            </button>
          ))}
        </div>

        <div className="search-box-wrapper">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty name, department, or marker..."
            className="search-input"
          />
        </div>
      </div>

      {/* Main Table Section */}
      <div className="approvals-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="loading-spinner" />
            <p>Loading verifiable proof records...</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon-wrap">
              <FileCheck2 size={36} className="text-slate-400" />
            </div>
            <h3>No Approval Records Found</h3>
            <p>
              There are no {statusFilter !== "All" ? statusFilter.toLowerCase() : ""}{" "}
              deduction approvals recorded for {month}.
            </p>
          </div>
        ) : (
          <table className="approvals-table">
            <thead>
              <tr>
                <th>Faculty / Teacher</th>
                <th>Absence Date & Marker</th>
                <th>Deduction Calculation</th>
                <th>Substitute Bonus</th>
                <th>Workflow Status</th>
                <th>Verification Checksum</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map((item) => {
                const teacherName =
                  item.teacherProfileId?.user?.name ||
                  item.teacherProfileId?.name ||
                  item.absenceProof?.teacherSnapshot?.name ||
                  "Faculty Member";
                const department =
                  item.teacherProfileId?.department ||
                  item.absenceProof?.teacherSnapshot?.department ||
                  "Academics";
                const isItemPending = item.status === "Pending";
                const deduction = item.deductionProof?.deductionAmount || 0;
                const bonus = item.substituteProof?.totalBonus || 0;

                return (
                  <tr key={item._id} className="approval-table-row">
                    <td>
                      <div className="teacher-cell">
                        <div className="teacher-avatar">
                          {teacherName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="teacher-name">{teacherName}</div>
                          <div className="teacher-dept">{department}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {new Date(item.absenceProof?.date || item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="marker-info">
                          Marked by: {item.absenceProof?.markedBy?.name || "System"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="deduction-cell">
                        <span className="deduction-val font-mono">
                          - PKR {deduction.toLocaleString()}
                        </span>
                        <span className="rate-info">
                          Formula: PKR {Math.round(item.deductionProof?.dailyRate || 0)}/day
                        </span>
                      </div>
                    </td>

                    <td>
                      {bonus > 0 ? (
                        <div className="bonus-cell">
                          <span className="bonus-val font-mono">
                            + PKR {bonus.toLocaleString()}
                          </span>
                          <span className="sub-count">
                            {item.substituteProof?.assignments?.length || 1} cover class(es)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td>
                      <span className={`status-pill ${item.status.toLowerCase()}`}>
                        {item.status === "Approved" && <CheckCircle2 size={12} />}
                        {item.status === "Rejected" && <XCircle size={12} />}
                        {item.status === "Pending" && <Clock size={12} />}
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="checksum-cell">
                        <span
                          className="hash-preview font-mono"
                          title={item.application?.checksumHash || "Pending Hash"}
                        >
                          {item.application?.checksumHash
                            ? `${item.application.checksumHash.slice(0, 10)}...`
                            : "— Not yet applied —"}
                        </span>
                      </div>
                    </td>

                    <td className="text-right">
                      <div className="actions-cluster">
                        <button
                          type="button"
                          onClick={() => openProofModal(item)}
                          className="btn-view-proof"
                          title="Inspect full 6-layer audit proof"
                        >
                          <Eye size={15} />
                          <span>Inspect Proof</span>
                        </button>

                        {isItemPending && canApprove && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleApprove(item._id)}
                              className="btn-quick-approve"
                              title="Quick Approve"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openProofModal(item)}
                              className="btn-quick-reject"
                              title="Reject with Reason"
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table Footer with Pagination */}
        <DataPagination
          page={page}
          pageSize={pageSize}
          total={total}
          pageCount={Math.ceil(total / pageSize) || 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="approval requests"
        />
      </div>

      {/* Proof Modal */}
      <ApprovalProofDialog
        isOpen={isProofModalOpen}
        approval={selectedApproval}
        onClose={() => setIsProofModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        canApprove={canApprove}
      />
    </div>
  );
};

export default PayrollApprovals;

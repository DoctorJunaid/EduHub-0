import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  DollarSign,
  User,
  Clock,
  FileText,
  Hash,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";
import "./ApprovalProofDialog.css";

const ApprovalProofDialog = ({
  approval,
  isOpen,
  onClose,
  onApprove,
  onReject,
  canApprove,
}) => {
  const [copied, setCopied] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !approval) return null;

  const handleCopyChecksum = () => {
    const hash = approval.application?.checksumHash || "NO-CHECKSUM-GENERATED";
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success("Cryptographic SHA-256 checksum copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApproveClick = async () => {
    try {
      setActionLoading(true);
      await onApprove(approval._id, { notes: decisionNotes });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a valid reason for rejection");
      return;
    }
    try {
      setActionLoading(true);
      await onReject(approval._id, {
        reason: rejectReason.trim(),
        notes: decisionNotes,
      });
      setIsRejecting(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const isPending = approval.status === "Pending";
  const teacherName =
    approval.teacherProfileId?.user?.name ||
    approval.teacherProfileId?.name ||
    approval.absenceProof?.teacherSnapshot?.name ||
    "Faculty Member";
  const department =
    approval.teacherProfileId?.department ||
    approval.absenceProof?.teacherSnapshot?.department ||
    "Academics";

  return (
    <div className="proof-modal-overlay" onClick={onClose}>
      <div
        className="proof-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="proof-modal-header">
          <div className="proof-header-title-box">
            <div className={`proof-badge-icon ${approval.status.toLowerCase()}`}>
              {approval.status === "Approved" ? (
                <ShieldCheck className="text-emerald-500" size={24} />
              ) : approval.status === "Rejected" ? (
                <ShieldAlert className="text-rose-500" size={24} />
              ) : (
                <AlertCircle className="text-amber-500" size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="proof-modal-title">Verification & Audit Proof</h2>
                <span className={`proof-status-tag ${approval.status.toLowerCase()}`}>
                  {approval.status}
                </span>
              </div>
              <p className="proof-modal-subtitle">
                Cryptographic-backed salary deduction & substitute bonus audit trail
              </p>
            </div>
          </div>
          <button
            type="button"
            className="proof-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="proof-modal-body">
          {/* Layer 1: Absence Proof */}
          <div className="proof-card">
            <div className="proof-card-header">
              <Calendar size={18} className="text-indigo-500" />
              <h3>Layer 1: Absence Record Proof</h3>
            </div>
            <div className="proof-grid-2">
              <div className="proof-info-item">
                <span className="label">Absent Faculty</span>
                <span className="value font-semibold text-slate-900 dark:text-white">
                  {teacherName} ({department})
                </span>
              </div>
              <div className="proof-info-item">
                <span className="label">Date of Absence</span>
                <span className="value">
                  {new Date(approval.absenceProof?.date || approval.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="proof-info-item">
                <span className="label">Attendance Marker</span>
                <span className="value">
                  {approval.absenceProof?.markedBy?.name || "System Automated"} (
                  {approval.absenceProof?.markedBy?.email || "N/A"})
                </span>
              </div>
              <div className="proof-info-item">
                <span className="label">Recorded Remarks</span>
                <span className="value italic">
                  {approval.absenceProof?.remarks || "No specific remarks recorded"}
                </span>
              </div>
            </div>
          </div>

          {/* Layer 2: Deduction & Formula Proof */}
          <div className="proof-card">
            <div className="proof-card-header">
              <DollarSign size={18} className="text-emerald-500" />
              <h3>Layer 2: Deduction Calculation Proof</h3>
            </div>
            <div className="proof-formula-box">
              <div className="formula-badge">Computation Formula</div>
              <div className="formula-text">
                {approval.deductionProof?.formula ||
                  `PKR ${approval.deductionProof?.baseSalary || 0} / ${
                    approval.deductionProof?.workingDays || 26
                  } × ${approval.deductionProof?.multiplier || 1.0}`}
              </div>
            </div>
            <div className="proof-grid-3 mt-3">
              <div className="proof-info-item">
                <span className="label">Base Salary</span>
                <span className="value font-mono">
                  PKR {approval.deductionProof?.baseSalary?.toLocaleString() || 0}
                </span>
              </div>
              <div className="proof-info-item">
                <span className="label">Daily Salary Rate</span>
                <span className="value font-mono">
                  PKR {Math.round(approval.deductionProof?.dailyRate || 0).toLocaleString()}
                </span>
              </div>
              <div className="proof-info-item highlight-deduction">
                <span className="label">Deduction Amount</span>
                <span className="value font-bold text-rose-600 dark:text-rose-400 font-mono">
                  - PKR {approval.deductionProof?.deductionAmount?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Layer 3: Substitute Duties & Bonus Proof */}
          <div className="proof-card">
            <div className="proof-card-header">
              <Layers size={18} className="text-blue-500" />
              <h3>Layer 3: Substitute Cover & Bonus Proof</h3>
            </div>
            {approval.substituteProof?.assignments?.length > 0 ? (
              <div className="space-y-3">
                <div className="substitute-list">
                  {approval.substituteProof.assignments.map((sub, idx) => (
                    <div key={idx} className="substitute-item">
                      <div className="flex items-center gap-2">
                        <span className="sub-tag">Class {sub.class || "N/A"}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {sub.subject || "General Class"} (Period {sub.period || 1})
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Covered by: <span className="font-semibold text-blue-600 dark:text-blue-400">{sub.substituteTeacherName || "Staff"}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Substitute Bonus Rate: PKR {approval.substituteProof?.bonusPerClass || 500} / class
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                    Total Bonus: + PKR {approval.substituteProof?.totalBonus?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="proof-empty-sub">
                <Info size={16} className="text-slate-400" />
                <span>No substitute coverage assigned for this absence slot.</span>
              </div>
            )}
          </div>

          {/* Layer 4: Decision & Authority Proof */}
          {approval.status !== "Pending" && (
            <div className="proof-card">
              <div className="proof-card-header">
                <User size={18} className="text-purple-500" />
                <h3>Layer 4: Decision & Authority Proof</h3>
              </div>
              <div className="proof-grid-2">
                <div className="proof-info-item">
                  <span className="label">Decision Maker</span>
                  <span className="value font-semibold">
                    {approval.decision?.decidedBy?.name || "Administrator"} (
                    {approval.decision?.decidedBy?.role || "Campus Admin"})
                  </span>
                </div>
                <div className="proof-info-item">
                  <span className="label">Decision Timestamp</span>
                  <span className="value">
                    {approval.decision?.decidedAt
                      ? new Date(approval.decision.decidedAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div className="proof-info-item">
                  <span className="label">Audited Client IP</span>
                  <span className="value font-mono flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Globe size={13} /> {approval.decision?.ipAddress || "127.0.0.1"}
                  </span>
                </div>
                <div className="proof-info-item">
                  <span className="label">Audited User Agent</span>
                  <span className="value text-xs text-slate-500 truncate" title={approval.decision?.userAgent}>
                    {approval.decision?.userAgent || "Standard Browser"}
                  </span>
                </div>
              </div>
              {approval.decision?.reason && (
                <div className="rejection-reason-box mt-3">
                  <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    Rejection Reason
                  </div>
                  <div className="text-sm text-rose-800 dark:text-rose-200 mt-0.5">
                    {approval.decision.reason}
                  </div>
                </div>
              )}
              {approval.decision?.notes && (
                <div className="notes-box mt-2">
                  <span className="text-xs text-slate-500 font-medium">Admin Notes: </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {approval.decision.notes}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Layer 5: Cryptographic Checksum & Linkage */}
          <div className="proof-card checksum-card">
            <div className="proof-card-header">
              <Hash size={18} className="text-amber-500" />
              <h3>Layer 5: Cryptographic Checksum & Audit Integrity</h3>
            </div>
            <div className="checksum-container">
              <div className="checksum-value">
                {approval.application?.checksumHash ||
                  "CHECKSUM-GENERATED-UPON-APPROVAL"}
              </div>
              <button
                type="button"
                onClick={handleCopyChecksum}
                className="checksum-copy-btn"
                title="Copy SHA-256 Hash"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
              <span>Algorithm: SHA-256 (ApprovalID + Target + Amount + Timestamp)</span>
              <span>
                Target Month:{" "}
                <strong className="text-slate-700 dark:text-slate-300 font-mono">
                  {approval.application?.targetMonth || approval.month}
                </strong>
              </span>
            </div>
          </div>

          {/* State Timeline */}
          {approval.stateHistory?.length > 0 && (
            <div className="proof-card">
              <div className="proof-card-header">
                <Clock size={18} className="text-slate-500" />
                <h3>State Transition History</h3>
              </div>
              <div className="timeline-container">
                {approval.stateHistory.map((item, idx) => (
                  <div key={idx} className="timeline-step">
                    <div className="timeline-bullet" />
                    <div className="timeline-content">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {item.fromState} → {item.toState}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.reason} {item.performedBy?.name ? `by ${item.performedBy.name}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Form if Pending & canApprove */}
          {isPending && canApprove && (
            <div className="proof-decision-section">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Administrative Action Required
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Approving this record will apply the calculated deduction of{" "}
                <strong>PKR {approval.deductionProof?.deductionAmount || 0}</strong> and any
                associated substitute bonuses into the monthly payroll with verifiable cryptographic audit log.
              </p>

              {isRejecting ? (
                <div className="space-y-3 bg-rose-50/60 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-200 dark:border-rose-900">
                  <label className="block text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Mandatory Rejection Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide detailed explanation for rejecting this deduction (e.g. Approved official leave, school event, swapped duty)..."
                    className="w-full text-xs p-2 rounded border border-rose-300 dark:border-rose-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectClick}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="px-3 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded disabled:opacity-50"
                    >
                      {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Optional admin decision remarks..."
                    className="flex-1 text-xs p-2 rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveClick}
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />{" "}
                      {actionLoading ? "Authorizing..." : "Approve & Apply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="proof-modal-footer">
          <button
            type="button"
            className="proof-btn-secondary"
            onClick={onClose}
          >
            Close Proof Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalProofDialog;

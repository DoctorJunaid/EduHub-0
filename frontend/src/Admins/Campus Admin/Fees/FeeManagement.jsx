import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ChartNoAxesCombined,
  CircleAlert,
  Clock,
  Coins,
  Download,
  Plus,
  Search,
  Settings2,
  Wand2,
  FileText,
  RefreshCw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import Progress from "@/components/common/Progress";
import DataPagination from "@/components/shared/DataPagination";
import usePaginationParams from "@/hooks/usePaginationParams";
import { selectStudents, fetchStudents } from "@/store/Slices/studentsSlice.js";
import {
  selectFees,
  selectJoinedFees,
  selectFeesStatus,
  fetchFees,
  addFeeVoucher,
  updateFeeVoucher,
  deleteFeeVoucher,
  fetchFeeStructures,
  voucherSaved,
  fetchFinancialLedger,
  selectFinancialLedger,
  selectFinancialSummary,
  selectLedgerStatus,
} from "@/store/Slices/feesSlice.js";
import { formatPKR } from "@/lib/currency";
import { downloadCsv } from "@/lib/csv";
import { paginateStudents } from "../Students/studentData.js";
import {
  collectionSummary,
  filterVouchers,
  feeExport,
  paymentStatuses,
} from "./feeData.js";
import FeeVoucherForm from "./FeeVoucherForm";
import FeeTable from "./FeeTable";
import FeeStatusBadge from "./FeeStatusBadge";
import VoucherDetails from "./VoucherDetails";
import RecordPaymentDialog from "./RecordPaymentDialog";
import PrintChallanDialog from "./PrintChallanDialog";
import GenerateMonthlyFeesDialog from "./GenerateMonthlyFeesDialog";
import FeeStructureDialog from "./FeeStructureDialog";
import PendingPaymentsDialog from "./PendingPaymentsDialog";
import WaiveFeeDialog from "./WaiveFeeDialog";
import PaymentReceiptDialog from "./PaymentReceiptDialog";
import axiosInstance from "@/api/axiosInstance";
import { useInstitution } from "@/context/InstitutionContext";
import "../CampusShared.css";
import "./FeeManagement.css";

const defaultFilters = {
  search: "",
  feeCategory: "",
  paymentStatus: "",
  semester: "",
  dueDate: "",
};

export default function FeeManagement() {
  const dispatch = useDispatch();
  const { isSchool } = useInstitution();
  const students = useSelector(selectStudents);
  const records = useSelector(selectFees);
  const feesStatus = useSelector(selectFeesStatus);
  const joined = useSelector(selectJoinedFees);

  const financialLedger = useSelector(selectFinancialLedger) || [];
  const financialSummary = useSelector(selectFinancialSummary);
  const ledgerStatus = useSelector(selectLedgerStatus);

  const [activeTab, setActiveTab] = useState("vouchers"); // "vouchers" | "ledger"
  const [filters, setFilters] = useState(defaultFilters);
  const { page, pageSize, setPage, setPageSize } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
  });
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [allActivity, setAllActivity] = useState(false);

  // Financial Ledger local filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const {
    page: ledgerPage,
    pageSize: ledgerPageSize,
    setPage: setLedgerPage,
    setPageSize: setLedgerPageSize,
  } = usePaginationParams({
    defaultPage: 1,
    defaultPageSize: 20,
    keyPrefix: "ledger",
  });

  useEffect(() => {
    dispatch(fetchFees());
    dispatch(fetchStudents());
    dispatch(fetchFeeStructures());
    dispatch(fetchFinancialLedger());

    const interval = setInterval(() => {
      dispatch(fetchFees());
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [dispatch]);

  const filtered = useMemo(
    () => filterVouchers(joined, filters),
    [joined, filters],
  );
  const summary = useMemo(() => collectionSummary(filtered), [filtered]);
  const visible = paginateStudents(filtered, page, pageSize);

  const unique = (values) => [...new Set(values.filter(Boolean))].sort();
  const options = {
    feeCategory: unique(records.map((record) => record.feeCategory)),
    semester: unique(
      [...records, ...students].map((record) => record.semester),
    ),
  };

  const selected = joined.find((voucher) => voucher.id === modal?.id);
  const selectedRecord = records.find((voucher) => voucher.id === modal?.id);

  const close = () => setModal(null);
  const onAction = async (mode, id) => {
    if (mode === "delete") {
      if (window.confirm("Are you sure you want to delete this fee voucher?")) {
        try {
          await dispatch(deleteFeeVoucher(id)).unwrap();
          toast.success("Voucher deleted successfully.");
          dispatch(fetchFees());
          dispatch(fetchFinancialLedger());
        } catch (err) {
          toast.error(typeof err === "string" ? err : "Failed to delete voucher.");
        }
      }
      return;
    }
    setModal({ mode, id });
  };

  const reset = () => {
    setFilters(defaultFilters);
    setPage(1);
    setNotice("");
  };

  const change = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  const save = async (values) => {
    try {
      if (selectedRecord || values.id || values._id) {
        const voucherId = values.id || values._id || selectedRecord?.id;
        await dispatch(updateFeeVoucher({ ...values, _id: voucherId })).unwrap();
        toast.success("Voucher updated successfully.");
      } else {
        await dispatch(addFeeVoucher(values)).unwrap();
        toast.success("Voucher created successfully.");
      }
      dispatch(fetchFees());
      dispatch(fetchFinancialLedger());
    } catch (err) {
      dispatch(voucherSaved(values));
      toast.success(typeof err === "string" ? err : "Voucher saved.");
    }
    reset();
    close();
  };

  const exportFees = () => {
    const data = feeExport(filtered);
    downloadCsv("fee-vouchers.csv", data.headers, data.rows);
    toast.success(`Exported ${filtered.length} vouchers.`);
  };

  // Export Financial Ledger to CSV
  const exportLedgerCsv = () => {
    const headers = [
      "Voucher No",
      "Month",
      "Student Name",
      "Roll No",
      "Class / Grade",
      "Particulars",
      "Base Fee",
      "Arrears",
      "Waiver",
      "Total Payable",
      "Paid Amount",
      "Remaining Balance",
      "Status",
      "Receipt No",
      "Due Date",
    ];
    const rows = financialLedger.map((row) => [
      row.voucherNo,
      row.month,
      row.student?.name || "—",
      row.student?.roll || "—",
      row.student?.gradeOrClass || row.gradeOrClass || "—",
      row.feeCategory,
      row.amount,
      row.previousArrears || 0,
      row.waiver?.amount || 0,
      row.totalPayable,
      row.paidAmount,
      row.remainingBalance,
      row.status,
      row.receiptNo || "—",
      row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—",
    ]);
    downloadCsv("financial-ledger.csv", headers, rows);
    toast.success(`Exported ${financialLedger.length} ledger records.`);
  };

  // Filtered Financial Ledger
  const filteredLedger = useMemo(() => {
    if (!ledgerSearch.trim()) return financialLedger;
    const term = ledgerSearch.toLowerCase().trim();
    return financialLedger.filter((row) => {
      const studentName = (row.student?.name || "").toLowerCase();
      const roll = (row.student?.roll || "").toLowerCase();
      const voucherNo = (row.voucherNo || "").toLowerCase();
      const receiptNo = (row.receiptNo || "").toLowerCase();
      const grade = (row.student?.gradeOrClass || row.gradeOrClass || "").toLowerCase();
      return (
        studentName.includes(term) ||
        roll.includes(term) ||
        voucherNo.includes(term) ||
        receiptNo.includes(term) ||
        grade.includes(term)
      );
    });
  }, [financialLedger, ledgerSearch]);

  const visibleLedger = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(start, start + ledgerPageSize);
  }, [filteredLedger, ledgerPage, ledgerPageSize]);

  const recent = [...filtered].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <section className="campus-tab-page fee-management" aria-label="Fee Management">
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px height) */}
      <div className="campus-kpi-track">
        {activeTab === "vouchers" ? (
          <>
            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <Coins size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Fee Collected</span>
                  <strong className="kpi-value">{formatPKR(summary.Paid)}</strong>
                </div>
              </div>
            </div>

            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <Clock size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Pending / Unpaid</span>
                  <strong className="kpi-value">{formatPKR(summary.Pending)}</strong>
                </div>
              </div>
            </div>

            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <CircleAlert size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Overdue Dues</span>
                  <strong className="kpi-value">{formatPKR(summary.Overdue)}</strong>
                </div>
              </div>
            </div>

            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <ChartNoAxesCombined size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Collection Rate</span>
                  <strong className="kpi-value">{summary.rate.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <Coins size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Expected</span>
                  <strong className="kpi-value">{formatPKR(financialSummary?.totalExpected || 0)}</strong>
                </div>
              </div>
            </div>

            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <Coins size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Collected</span>
                  <strong className="kpi-value">{formatPKR(financialSummary?.totalCollected || 0)}</strong>
                </div>
              </div>
            </div>

            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <Clock size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Total Outstanding</span>
                  <strong className="kpi-value">{formatPKR(financialSummary?.totalOutstanding || 0)}</strong>
                </div>
              </div>
            </div>

            <div className="campus-kpi-card">
              <div className="kpi-wrap">
                <div className="kpi-icon">
                  <ChartNoAxesCombined size={16} />
                </div>
                <div className="kpi-info">
                  <span className="kpi-label">Recovery Rate</span>
                  <strong className="kpi-value">{((financialSummary?.recoveryRate ?? financialSummary?.collectionRate ?? 0)).toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Contiguous 48px Toolbar Directly Under KPI Track */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          {/* Sub-tab view buttons matching standard toolbar buttons */}
          <button
            type="button"
            className={`toolbar-btn ${activeTab === "vouchers" ? "toolbar-btn-primary" : "toolbar-btn-outline"}`}
            onClick={() => setActiveTab("vouchers")}
          >
            <BookOpen size={12} />
            Fee Vouchers ({joined.length})
          </button>
          <button
            type="button"
            className={`toolbar-btn ${activeTab === "ledger" ? "toolbar-btn-primary" : "toolbar-btn-outline"}`}
            onClick={() => {
              setActiveTab("ledger");
              dispatch(fetchFinancialLedger());
            }}
          >
            <FileText size={12} />
            Financial Ledger ({financialLedger.length})
          </button>

          <span style={{ width: "1px", height: "18px", background: "#e4e4e7", margin: "0 2px" }} />

          {activeTab === "vouchers" ? (
            <>
              <div className="toolbar-search">
                <Search size={13} />
                <input
                  type="text"
                  placeholder={isSchool ? "Search student or challan..." : "Search student or voucher..."}
                  value={filters.search}
                  onChange={(e) => change("search", e.target.value)}
                  aria-label="Search records"
                />
              </div>

              <select
                className="toolbar-select"
                aria-label="Filter by Category"
                value={filters.feeCategory}
                onChange={(e) => change("feeCategory", e.target.value)}
              >
                <option value="">All Categories</option>
                {options.feeCategory.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>

              <select
                className="toolbar-select"
                aria-label="Filter by Status"
                value={filters.paymentStatus}
                onChange={(e) => change("paymentStatus", e.target.value)}
              >
                <option value="">All Statuses</option>
                {paymentStatuses.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>

              <select
                className="toolbar-select"
                aria-label={isSchool ? "Filter by Term" : "Filter by Semester"}
                value={filters.semester}
                onChange={(e) => change("semester", e.target.value)}
              >
                <option value="">{isSchool ? "All Terms" : "All Semesters"}</option>
                {options.semester.map((val) => (
                  <option key={val} value={val}>{isSchool ? String(val).replace(/Semester\s+/i, "Term ") : val}</option>
                ))}
              </select>

              <input
                type="date"
                aria-label="Filter by due date"
                title="Filter by due date"
                value={filters.dueDate}
                onChange={(e) => change("dueDate", e.target.value)}
                className="toolbar-select"
              />

              {(filters.search || filters.feeCategory || filters.paymentStatus || filters.semester || filters.dueDate) && (
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn-outline"
                  onClick={reset}
                  title="Reset all filters"
                >
                  Reset
                </button>
              )}
            </>
          ) : (
            <div className="toolbar-search" style={{ width: "220px", maxWidth: "260px" }}>
              <Search size={13} />
              <input
                type="text"
                placeholder="Search student, roll, voucher, receipt..."
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  setLedgerPage(1);
                }}
                aria-label="Search ledger"
              />
            </div>
          )}
        </div>

        <div className="toolbar-actions">
          {activeTab === "vouchers" ? (
            <>
              <button
                type="button"
                className="toolbar-btn toolbar-btn-outline"
                onClick={() => setModal({ mode: "structure" })}
                title="School Fee Structure Setup"
              >
                <Settings2 size={13} />
                Fee Setup
              </button>
              <button
                type="button"
                className="toolbar-btn toolbar-btn-outline"
                onClick={() => setModal({ mode: "generate" })}
                title="Generate Monthly Fee Vouchers"
              >
                <Wand2 size={13} />
                Generate Monthly
              </button>
              <button
                type="button"
                className="toolbar-btn toolbar-btn-outline"
                onClick={() => setModal({ mode: "pending" })}
                title="Review Pending Payments"
              >
                <Clock size={13} />
                Pending
              </button>
              <button
                type="button"
                className="toolbar-btn toolbar-btn-outline"
                onClick={exportFees}
                title="Export CSV"
              >
                <Download size={13} />
                Export
              </button>
              <button
                type="button"
                className="toolbar-btn toolbar-btn-primary"
                disabled={!students.length}
                onClick={() => onAction("add")}
                title="Add Fee Voucher"
              >
                <Plus size={13} />
                Add Voucher
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => dispatch(fetchFinancialLedger())}
                disabled={ledgerStatus === "loading"}
                className="toolbar-btn toolbar-btn-outline"
                title="Refresh Ledger"
              >
                {ledgerStatus === "loading" ? (
                  <Spinner className="size-3.5 mr-1 text-primary" />
                ) : (
                  <RefreshCw size={13} />
                )}
                Refresh
              </button>
              <button
                type="button"
                onClick={exportLedgerCsv}
                className="toolbar-btn toolbar-btn-outline"
                title="Export Ledger CSV"
              >
                <Download size={13} />
                Export Ledger
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Frameless Table Container */}
      <div className="campus-table-container">
        {activeTab === "vouchers" ? (
          <FeeTable rows={visible.records} onAction={onAction} />
        ) : (
          <table aria-label="Financial Ledger Table">
            <thead>
              <tr>
                <th style={{ width: "13%" }}>Voucher #</th>
                <th style={{ width: "8%" }}>Month</th>
                <th style={{ width: "20%" }}>Student &amp; Roll</th>
                <th style={{ width: "16%" }}>Particulars</th>
                <th style={{ width: "13%" }}>Total Payable</th>
                <th style={{ width: "10%" }}>Paid Amount</th>
                <th className="text-center" style={{ width: "10%" }}>Status</th>
                <th className="text-center" style={{ width: "10%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLedger.map((row) => (
                <tr key={row._id}>
                  <td style={{ width: "13%", overflow: "hidden" }}>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "600", color: "#09090b" }}>
                      {row.voucherNo}
                    </span>
                  </td>
                  <td style={{ width: "8%", overflow: "hidden" }}>
                    <span style={{ fontSize: "12px", color: "#52525b" }}>
                      {row.month}
                    </span>
                  </td>
                  <td style={{ width: "20%", overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "2px", overflow: "hidden" }}>
                      <strong style={{ fontSize: "13px", fontWeight: "600", color: "#09090b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25, display: "block" }}>
                        {row.student?.name || "Student"}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2, display: "block" }}>
                        Roll: {row.student?.roll || "—"} &middot; {row.student?.gradeOrClass || row.gradeOrClass || "General"}
                      </span>
                    </div>
                  </td>
                  <td style={{ width: "16%", overflow: "hidden" }}>
                    <span style={{ fontSize: "12px", color: "#09090b" }}>
                      {row.feeCategory}
                    </span>
                  </td>
                  <td style={{ width: "13%", overflow: "hidden" }}>
                    <strong style={{ fontSize: "13px", fontWeight: "700", color: "#09090b" }}>
                      {formatPKR(row.totalPayable)}
                    </strong>
                  </td>
                  <td style={{ width: "10%", overflow: "hidden" }}>
                    <span style={{ fontSize: "12px", color: row.paidAmount > 0 ? "#16a34a" : "#71717a", fontWeight: "600" }}>
                      {formatPKR(row.paidAmount)}
                    </span>
                  </td>
                  <td className="text-center" style={{ width: "10%", overflow: "hidden" }}>
                    <FeeStatusBadge status={row.status} />
                  </td>
                  <td className="text-center" style={{ width: "10%", overflow: "hidden" }}>
                    <div className="campus-action-icons" style={{ justifyContent: "center" }}>
                      {row.paidAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => onAction("receipt", row._id)}
                          className="toolbar-btn toolbar-btn-outline"
                          style={{ height: "26px", minHeight: "26px", fontSize: "11px", padding: "0 8px", cursor: "pointer" }}
                          title="View Receipt"
                        >
                          <Receipt size={12} style={{ color: "#16a34a" }} />
                          Receipt
                        </button>
                      )}
                      {row.remainingBalance > 0 && row.status !== "WAIVED" && row.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => onAction("waive", row._id)}
                          className="toolbar-btn toolbar-btn-outline"
                          style={{ height: "26px", minHeight: "26px", fontSize: "11px", padding: "0 8px", cursor: "pointer" }}
                          title="Waive Dues"
                        >
                          Waive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleLedger.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "28px", color: "#71717a", fontSize: "12px" }}>
                    No financial ledger entries match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Standardized DataPagination Footer */}
      {activeTab === "vouchers" ? (
        <DataPagination
          page={visible.currentPage}
          pageSize={pageSize}
          total={filtered.length}
          pageCount={visible.pageCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="vouchers"
        />
      ) : (
        <DataPagination
          page={ledgerPage}
          pageSize={ledgerPageSize}
          total={filteredLedger.length}
          pageCount={Math.ceil(filteredLedger.length / ledgerPageSize) || 1}
          onPageChange={setLedgerPage}
          onPageSizeChange={setLedgerPageSize}
          itemLabel="ledger entries"
        />
      )}

      {/* Modals */}
      {(modal?.mode === "add" || (modal?.mode === "edit" && selectedRecord)) && (
        <FeeVoucherForm
          record={selectedRecord}
          students={students}
          options={options}
          onSave={save}
          onClose={close}
        />
      )}
      {modal?.mode === "view" && selected && (
        <VoucherDetails
          voucher={selected}
          onClose={close}
          onPrint={(v) => setModal({ mode: "print", id: v.id })}
        />
      )}
      {modal?.mode === "paid" && selected && (
        <RecordPaymentDialog
          voucher={selected}
          onClose={close}
          onConfirm={async (paymentData) => {
            try {
              await axiosInstance.post(`/campus-admin/fees/${selected._id || selected.id}/payments`, paymentData);
              toast.success(`Payment recorded for voucher ${selected.voucherNo}.`);
              dispatch(fetchFees());
              dispatch(fetchFinancialLedger());
            } catch (err) {
              const msg = err.response?.data?.message || err.message || "Failed to record payment.";
              toast.error(msg);
            }
            close();
          }}
        />
      )}
      {modal?.mode === "receipt" && selected && (
        <PaymentReceiptDialog
          voucher={selected}
          onClose={close}
        />
      )}
      {modal?.mode === "waive" && selected && (
        <WaiveFeeDialog
          voucher={selected}
          onClose={close}
          onUpdated={() => {
            dispatch(fetchFees());
            dispatch(fetchFinancialLedger());
          }}
        />
      )}
      {modal?.mode === "print" && selected && (
        <PrintChallanDialog voucher={selected} onClose={close} />
      )}
      {modal?.mode === "generate" && (
        <GenerateMonthlyFeesDialog
          onClose={close}
          onGenerated={() => {
            dispatch(fetchFees());
            dispatch(fetchFinancialLedger());
          }}
        />
      )}
      {modal?.mode === "structure" && (
        <FeeStructureDialog onClose={close} />
      )}
      {modal?.mode === "pending" && (
        <PendingPaymentsDialog
          onClose={close}
          onConfirm={() => {
            dispatch(fetchFees());
            dispatch(fetchFinancialLedger());
          }}
        />
      )}
    </section>
  );
}

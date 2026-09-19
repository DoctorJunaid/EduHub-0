import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChartNoAxesCombined,
  CircleAlert,
  Clock,
  Coins,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Progress from "@/components/common/Progress";
import Pagination from "@/components/common/Pagination";
import { selectStudents, fetchStudents } from "@/store/Slices/studentsSlice.js";
import {
  selectFees,
  selectJoinedFees,
  selectFeesStatus,
  fetchFees,
  addFeeVoucher,
  updateFeeVoucher,
  deleteFeeVoucher,
  voucherSaved,
  voucherMarkedPaid,
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
import MarkPaidDialog from "./MarkPaidDialog";
import { useInstitution } from "@/context/InstitutionContext";
import "../Timetable/ClassTimetable.css";
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

  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [allActivity, setAllActivity] = useState(false);

  useEffect(() => {
    if (feesStatus === "idle") {
      dispatch(fetchFees());
    }
    if (!students || students.length === 0) {
      dispatch(fetchStudents());
    }
  }, [dispatch, feesStatus, students?.length]);

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
          setNotice("Voucher deleted successfully.");
        } catch (err) {
          setNotice(typeof err === "string" ? err : "Failed to delete voucher.");
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
        setNotice("Voucher updated successfully.");
      } else {
        await dispatch(addFeeVoucher(values)).unwrap();
        setNotice("Voucher created successfully.");
      }
    } catch (err) {
      dispatch(voucherSaved(values));
      setNotice(typeof err === "string" ? err : "Voucher saved.");
    }
    reset();
    close();
  };

  const exportFees = () => {
    const data = feeExport(filtered);
    downloadCsv("fee-vouchers.csv", data.headers, data.rows);
    setNotice(`Exported ${filtered.length} vouchers.`);
  };

  const recent = [...filtered].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <section
      className="campus-tab-page fee-management"
      aria-label="Fee Management"
    >
      {/* 1. Top Thin KPI Cards (Flush Border-to-Border, 56px) */}
      <div className="campus-kpi-track">
        <div className="campus-kpi-card">
          <div className="kpi-wrap">
            <div className="kpi-icon">
              <Coins size={16} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Total Fee Collected</span>
              <span className="kpi-value">{formatPKR(summary.Paid)}</span>
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
              <span className="kpi-value">{formatPKR(summary.Pending)}</span>
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
              <span className="kpi-value">{formatPKR(summary.Overdue)}</span>
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
              <span className="kpi-value">{summary.rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contiguous 56px Toolbar */}
      <div className="campus-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-search" style={{ width: "130px", maxWidth: "145px" }}>
            <Search size={13} />
            <input
              type="search"
              placeholder="Search voucher..."
              value={filters.search}
              onChange={(e) => change("search", e.target.value)}
              aria-label="Search student or voucher"
            />
          </div>

          <select
            className="toolbar-select"
            aria-label="Filter by Category"
            style={{ maxWidth: "105px" }}
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
            style={{ maxWidth: "95px" }}
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
            style={{ maxWidth: "95px" }}
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
            value={filters.dueDate}
            onChange={(e) => change("dueDate", e.target.value)}
            style={{ height: "32px", width: "115px", fontSize: "11px", background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "0 6px", boxSizing: "border-box" }}
          />

          {(filters.search || filters.feeCategory || filters.paymentStatus || filters.semester || filters.dueDate) && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn-outline"
              onClick={reset}
            >
              Reset
            </button>
          )}
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn toolbar-btn-outline"
            onClick={exportFees}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            type="button"
            className="toolbar-btn toolbar-btn-primary"
            disabled={!students.length}
            onClick={() => onAction("add")}
          >
            <Plus size={14} />
            Add Fee Voucher
          </button>
        </div>
      </div>

      {/* 3. Progress Ribbon */}
      <div style={{ padding: "12px 20px", background: "#ffffff", borderBottom: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#09090b" }}>Overall Recovery:</span>
          <span style={{ fontSize: "12px", color: "#71717a" }}>
            <strong>{formatPKR(summary.Paid)}</strong> of {formatPKR(summary.total)} target
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "240px" }}>
          <div style={{ flex: 1 }}>
            <Progress value={summary.rate} label="Fee collection rate" />
          </div>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#09090b" }}>{summary.rate.toFixed(1)}%</span>
        </div>
      </div>

      {/* 4. Table Panel */}
      <div style={{ padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", overflow: "hidden" }}>
          <div className="campus-table-container">
            <FeeTable rows={visible.records} onAction={onAction} />
          </div>

          <div className="campus-footer" style={{ borderTop: "1px solid #e4e4e7" }}>
            <div className="footer-info">
              {notice && <span style={{ color: "#16a34a", marginRight: "12px", fontWeight: "600" }}>{notice}</span>}
              Showing {filtered.length > 0 ? (visible.currentPage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(visible.currentPage * pageSize, filtered.length)} of {filtered.length} fee vouchers
            </div>

            <Pagination
              total={filtered.length}
              page={visible.currentPage}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              label="vouchers"
            />
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Panel */}
      <div style={{ padding: "0 20px 20px 20px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} />
              Recent Payment Activity
            </span>
            <Button
              variant="ghost"
              style={{ fontSize: "11px", height: "26px" }}
              disabled={recent.length <= 4}
              onClick={() => setAllActivity(!allActivity)}
            >
              {allActivity ? "Show Less" : "View All"}
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
            {recent.slice(0, allActivity ? recent.length : 4).map((voucher) => (
              <button
                key={voucher.id}
                type="button"
                className="fee-activity-item"
                onClick={() => onAction("view", voucher.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "10px 12px",
                  border: "1px solid #e4e4e7",
                  borderRadius: "6px",
                  background: "#fafafa",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar style={{ width: "28px", height: "28px", fontSize: "10px", background: "#f4f4f5", color: "#09090b" }}>
                    <AvatarFallback>{voucher.student.initials}</AvatarFallback>
                  </Avatar>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong style={{ fontSize: "12px", color: "#09090b" }}>{voucher.student.name}</strong>
                    <span style={{ fontSize: "11px", color: "#71717a" }}>{voucher.feeCategory} · {formatPKR(voucher.amount)}</span>
                  </div>
                </div>
                <FeeStatusBadge status={voucher.paymentStatus} />
              </button>
            ))}
          </div>
        </div>
      </div>

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
        <VoucherDetails voucher={selected} onClose={close} />
      )}
      {modal?.mode === "paid" && selected && (
        <MarkPaidDialog
          voucher={selected}
          onClose={close}
          onConfirm={async (paymentDate) => {
            try {
              await dispatch(
                updateFeeVoucher({
                  _id: selected._id || selected.id,
                  paymentStatus: "Paid",
                  status: "paid",
                  paymentDate,
                }),
              ).unwrap();
              setNotice(`${selected.voucherNo} marked Paid.`);
            } catch (err) {
              dispatch(voucherMarkedPaid({ id: selected.id, paymentDate }));
              setNotice(`${selected.voucherNo} marked Paid.`);
            }
            close();
          }}
        />
      )}
    </section>
  );
}

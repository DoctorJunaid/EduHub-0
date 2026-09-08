import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChartNoAxesCombined,
  ChevronDown,
  CircleAlert,
  Clock,
  Coins,
  Download,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import SummaryCard from "@/components/common/SummaryCard";
import Progress from "@/components/common/Progress";
import Pagination from "@/components/common/Pagination";
import { selectStudents } from "@/store/Slices/studentsSlice.js";
import {
  selectFees,
  selectJoinedFees,
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
  const students = useSelector(selectStudents),
    records = useSelector(selectFees),
    joined = useSelector(selectJoinedFees);
  const [draft, setDraft] = useState(defaultFilters),
    [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(""),
    [allActivity, setAllActivity] = useState(false);
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
  const onAction = (mode, id) => setModal({ mode, id });
  const reset = () => {
    setDraft(defaultFilters);
    setFilters(defaultFilters);
    setPage(1);
    setNotice("");
  };
  const change = (key, value) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const save = (values) => {
    dispatch(voucherSaved(values));
    reset();
    setPage(
      Math.floor(
        (selectedRecord
          ? records.findIndex((record) => record.id === selectedRecord.id)
          : records.length) / pageSize,
      ) + 1,
    );
    setNotice("Voucher saved.");
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
  const filterPending = Object.keys(defaultFilters).some(
    (key) => draft[key] !== filters[key],
  );
  return (
    <section
      className="class-timetable fee-management"
      aria-labelledby="fee-title"
    >
      <div className="tt-page-heading">
        <div>
          <h1 id="fee-title">Fee Management</h1>
          <p>
            Manage tuition fees, vouchers, payments and outstanding balances.
          </p>
        </div>
        <div className="fee-header-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download size={16} />
                Export
                <ChevronDown size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={exportFees}>
                Export filtered CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="tt-primary"
            disabled={!students.length}
            onClick={() => onAction("add")}
          >
            <Plus size={17} />
            Add Fee Voucher
          </Button>
        </div>
      </div>
      <div className="fee-summary">
        {[
          [Coins, formatPKR(summary.Paid), "Total Collected", "fee-collected"],
          [
            Clock,
            formatPKR(summary.Pending),
            "Outstanding / Pending",
            "fee-pending-card",
          ],
          [
            CircleAlert,
            formatPKR(summary.Overdue),
            "Overdue",
            "fee-overdue-card",
          ],
          [
            ChartNoAxesCombined,
            `${summary.rate.toFixed(1)}%`,
            "Collection Rate",
            "fee-rate-card",
          ],
        ].map(([Icon, value, label, className]) => (
          <SummaryCard
            key={label}
            icon={Icon}
            value={value}
            label={label}
            className={className}
          />
        ))}
      </div>
      <Card className="tt-card fee-progress-panel">
        <div className="fee-progress-title">
          <span>
            <ChartNoAxesCombined size={23} />
          </span>
          <div>
            <h2>Collection Progress</h2>
            <p>
              <strong>{formatPKR(summary.Paid)}</strong> collected of{" "}
              {formatPKR(summary.total)}
            </p>
          </div>
        </div>
        <div className="fee-progress">
          <Progress value={summary.rate} label="Fee collection rate" />
          <span>{summary.rate.toFixed(1)}%</span>
        </div>
        <div className="fee-legend">
          {[
            ["Paid", "Collected"],
            ["Pending", "Pending"],
            ["Overdue", "Overdue"],
          ].map(([key, label]) => (
            <span key={key}>
              <i className={`fee-dot-${key.toLowerCase()}`} />
              {label}
              <strong>{formatPKR(summary[key])}</strong>
            </span>
          ))}
        </div>
      </Card>
      <Card className="tt-card fee-filter-panel">
        <form
          className="fee-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters(draft);
            setPage(1);
            setNotice("Filters applied.");
          }}
        >
          <div className="fee-search">
            <Search size={15} />
            <Input
              aria-label="Search student, voucher or fee"
              placeholder="Search student, voucher or fee..."
              value={draft.search}
              onChange={(event) => change("search", event.target.value)}
            />
          </div>
          {[
            [
              "feeCategory",
              "Fee Category",
              "All Categories",
              options.feeCategory,
            ],
            [
              "paymentStatus",
              "Payment Status",
              "All Statuses",
              paymentStatuses,
            ],
            ["semester", "Semester", "All Semesters", options.semester],
          ].map(([key, label, placeholder, choices]) => (
            <label key={key}>
              {label}
              <select
                value={draft[key]}
                onChange={(event) => change(key, event.target.value)}
              >
                <option value="">{placeholder}</option>
                {choices.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Due Date
            <Input
              type="date"
              aria-label="Filter by due date"
              value={draft.dueDate}
              onChange={(event) => change("dueDate", event.target.value)}
            />
          </label>
          <Button type="button" variant="outline" onClick={reset}>
            Reset
          </Button>
          <Button type="submit">
            <Filter size={15} />
            Filter
          </Button>
        </form>
        {filterPending && (
          <p className="fee-filter-note">
            Select Filter to apply your changes. Export uses the currently
            applied filters.
          </p>
        )}
      </Card>
      <Card className="tt-card fee-table-panel">
        <div className="fee-table-count">{filtered.length} vouchers logged</div>
        <FeeTable rows={visible.records} onAction={onAction} />
        <div className="fee-footer">
          <span role="status">{notice}</span>
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
      </Card>
      <Card className="tt-card fee-activity">
        <div className="fee-activity-heading">
          <h2>
            <Clock size={16} />
            Recent Payment Activity
          </h2>
          <Button
            variant="ghost"
            disabled={recent.length <= 4}
            onClick={() => setAllActivity(!allActivity)}
          >
            {allActivity ? "Show Recent" : "View All"}
          </Button>
        </div>
        <div className="fee-activity-grid">
          {recent.slice(0, allActivity ? recent.length : 4).map((voucher) => (
            <button
              className="fee-activity-item"
              key={voucher.id}
              onClick={() => onAction("view", voucher.id)}
            >
              <Avatar>
                <AvatarFallback>{voucher.student.initials}</AvatarFallback>
              </Avatar>
              <div>
                <strong>{voucher.student.name}</strong>
                <span>{voucher.feeCategory}</span>
                <strong>{formatPKR(voucher.amount)}</strong>
                <small>
                  {voucher.createdAt === voucher.updatedAt
                    ? "Created"
                    : "Updated"}{" "}
                  {new Date(voucher.updatedAt).toLocaleString()}
                </small>
              </div>
              <FeeStatusBadge status={voucher.paymentStatus} />
            </button>
          ))}
        </div>
        {!recent.length && (
          <p className="tt-empty">
            No voucher activity in the current selection.
          </p>
        )}
      </Card>
      {(modal?.mode === "add" ||
        (modal?.mode === "edit" && selectedRecord)) && (
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
          onConfirm={(paymentDate) => {
            dispatch(voucherMarkedPaid({ id: selected.id, paymentDate }));
            setNotice(`${selected.voucherNo} marked Paid.`);
            close();
          }}
        />
      )}
    </section>
  );
}

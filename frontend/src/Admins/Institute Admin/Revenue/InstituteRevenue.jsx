import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  TrendingUp,
  CreditCard,
  Building2,
  Users,
  Search,
  Download,
  Printer,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Layers,
  ChevronRight,
  Receipt,
  GraduationCap,
  Percent,
  Banknote,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/spinner";
import PageLoader from "@/components/shared/PageLoader";
import DataPagination from "@/components/shared/DataPagination";
import instituteRevenueApi from "@/api/instituteRevenue.api";
import ReceiptModal from "./ReceiptModal";
import toast from "react-hot-toast";
import "./InstituteRevenue.css";

export default function InstituteRevenue() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | transactions | invoices | structures
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Data states
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Transactions Tab State
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("all");
  const [txMethod, setTxMethod] = useState("all");

  // Invoices Tab State
  const [invoices, setInvoices] = useState([]);
  const [invTotal, setInvTotal] = useState(0);
  const [invPage, setInvPage] = useState(1);
  const [invLoading, setInvLoading] = useState(false);
  const [invSearch, setInvSearch] = useState("");
  const [invStatus, setInvStatus] = useState("all");

  // Structures Tab State
  const [structures, setStructures] = useState([]);
  const [structuresLoading, setStructuresLoading] = useState(false);

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Fetch Analytics & KPIs
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const params = {};
      if (selectedCampus !== "all") params.campusId = selectedCampus;
      if (selectedMonth) params.month = selectedMonth;

      const res = await instituteRevenueApi.getAnalytics(params);
      if (res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch revenue analytics:", err);
      toast.error("Failed to load revenue analytics.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedCampus, selectedMonth]);

  // 2. Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = {
        page: txPage,
        limit: 15,
      };
      if (selectedCampus !== "all") params.campusId = selectedCampus;
      if (txStatus !== "all") params.status = txStatus;
      if (txMethod !== "all") params.paymentMethod = txMethod;
      if (txSearch.trim()) params.search = txSearch.trim();
      if (selectedMonth) params.month = selectedMonth;

      const res = await instituteRevenueApi.getTransactions(params);
      if (res.data) {
        setTransactions(res.data);
        setTxTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, [selectedCampus, txPage, txStatus, txMethod, txSearch, selectedMonth]);

  // 3. Fetch Invoices / FeeRecords
  const fetchInvoices = useCallback(async () => {
    setInvLoading(true);
    try {
      const params = {
        page: invPage,
        limit: 15,
      };
      if (selectedCampus !== "all") params.campusId = selectedCampus;
      if (invStatus !== "all") params.status = invStatus;
      if (invSearch.trim()) params.search = invSearch.trim();
      if (selectedMonth) params.month = selectedMonth;

      const res = await instituteRevenueApi.getFeeRecords(params);
      if (res.data) {
        setInvoices(res.data);
        setInvTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setInvLoading(false);
    }
  }, [selectedCampus, invPage, invStatus, invSearch, selectedMonth]);

  // 4. Fetch Fee Structures
  const fetchStructures = useCallback(async () => {
    setStructuresLoading(true);
    try {
      const params = {};
      if (selectedCampus !== "all") params.campusId = selectedCampus;

      const res = await instituteRevenueApi.getFeeStructures(params);
      if (res.data) {
        setStructures(res.data);
      }
    } catch (err) {
      console.error("Failed to load fee structures:", err);
    } finally {
      setStructuresLoading(false);
    }
  }, [selectedCampus]);

  // Load analytics when campus or month changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Load active tab data
  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    } else if (activeTab === "invoices") {
      fetchInvoices();
    } else if (activeTab === "structures") {
      fetchStructures();
    }
  }, [activeTab, fetchTransactions, fetchInvoices, fetchStructures]);

  // Export CSV handler
  const handleExportCSV = async () => {
    const toastId = toast.loading("Generating revenue export...");
    try {
      const params = {};
      if (selectedCampus !== "all") params.campusId = selectedCampus;
      const res = await instituteRevenueApi.exportData(params);
      const rows = res.data || [];

      if (!rows.length) {
        toast.dismiss(toastId);
        toast.error("No transaction records found to export.");
        return;
      }

      const headers = [
        "Receipt #",
        "Challan #",
        "Date",
        "Student Name",
        "Roll No",
        "Grade/Class",
        "Campus Branch",
        "Fee Type",
        "Month",
        "Amount Paid (PKR)",
        "Payment Method",
        "Reference No",
        "Status",
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          [
            `"${r.receiptNo}"`,
            `"${r.challanNo}"`,
            `"${r.date}"`,
            `"${r.studentName}"`,
            `"${r.studentRoll}"`,
            `"${r.gradeOrClass}"`,
            `"${r.campus}"`,
            `"${r.feeType}"`,
            `"${r.month}"`,
            r.amountPaid,
            `"${r.paymentMethod}"`,
            `"${r.referenceNo}"`,
            `"${r.status}"`,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `EduHub_Revenue_Report_${selectedCampus === "all" ? "All_Campuses" : "Campus"}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss(toastId);
      toast.success("Revenue report downloaded successfully!");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Failed to generate export.");
    }
  };

  const kpis = analytics?.kpis || {
    totalRevenue: 0,
    totalBilled: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    totalWaived: 0,
    activePayingStudents: 0,
  };

  const campuses = analytics?.campuses || [];
  const campusBreakdown = analytics?.campusBreakdown || [];

  return (
    <div className="ir-container">
      {/* ── HEADER BANNER ── */}
      <header className="ir-header">
        <div className="ir-header-left">
          <div className="ir-icon-circle">
            <Coins size={26} />
          </div>
          <div className="ir-title-wrap">
            <h1>Multi-Campus Revenue & Collections</h1>
            <p>
              Consolidated financial monitoring, revenue collection efficiency, and multi-branch fee ledgers
            </p>
          </div>
        </div>

        <div className="ir-header-actions">
          {/* Campus Selector */}
          <select
            className="ir-select"
            value={selectedCampus}
            onChange={(e) => {
              setSelectedCampus(e.target.value);
              setTxPage(1);
              setInvPage(1);
            }}
            aria-label="Select Campus Branch"
          >
            <option value="all">🏢 All Campuses (Consolidated)</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                📍 {c.name} {c.city ? `(${c.city})` : ""}
              </option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            className="ir-select"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setTxPage(1);
              setInvPage(1);
            }}
            aria-label="Filter by Billing Month"
          >
            <option value="">📅 All Billing Cycles</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
          </select>

          <button
            className="ir-btn-outline"
            onClick={() => {
              fetchAnalytics();
              if (activeTab === "transactions") fetchTransactions();
              if (activeTab === "invoices") fetchInvoices();
              if (activeTab === "structures") fetchStructures();
            }}
            title="Refresh Financial Records"
            type="button"
          >
            <RefreshCw size={14} className={loadingAnalytics ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            className="ir-btn-outline"
            onClick={handleExportCSV}
            title="Export CSV Financial Report"
            type="button"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            className="ir-btn-primary"
            onClick={() => window.print()}
            title="Print Executive Financial Summary"
            type="button"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </header>

      {/* ── TOP KPI METRIC CARDS ── */}
      <section className="ir-kpi-grid" aria-label="Revenue KPIs">
        {/* Total Collected */}
        <div className="ir-kpi-card">
          <div className="ir-kpi-top">
            <span className="ir-kpi-label">Revenue Collected</span>
            <div className="ir-kpi-icon-wrap emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <h2 className="ir-kpi-val">Rs. {kpis.totalRevenue.toLocaleString()}</h2>
          <div className="ir-kpi-sub">
            <span className="ir-kpi-pill emerald">{kpis.collectionRate}%</span>
            <span>of total billed invoiced</span>
          </div>
        </div>

        {/* Total Billed */}
        <div className="ir-kpi-card">
          <div className="ir-kpi-top">
            <span className="ir-kpi-label">Total Invoiced / Billed</span>
            <div className="ir-kpi-icon-wrap blue">
              <FileText size={18} />
            </div>
          </div>
          <h2 className="ir-kpi-val">Rs. {kpis.totalBilled.toLocaleString()}</h2>
          <div className="ir-kpi-sub">
            <span>{kpis.totalVouchers || 0} student vouchers</span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="ir-kpi-card">
          <div className="ir-kpi-top">
            <span className="ir-kpi-label">Pending / Outstanding</span>
            <div className="ir-kpi-icon-wrap amber">
              <Clock size={18} />
            </div>
          </div>
          <h2 className="ir-kpi-val" style={{ color: "#b45309" }}>
            Rs. {kpis.totalOutstanding.toLocaleString()}
          </h2>
          <div className="ir-kpi-sub">
            <span>{kpis.unpaidVouchersCount || 0} unpaid • {kpis.overdueVouchersCount || 0} overdue</span>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="ir-kpi-card">
          <div className="ir-kpi-top">
            <span className="ir-kpi-label">Collection Efficiency</span>
            <div className="ir-kpi-icon-wrap indigo">
              <TrendingUp size={18} />
            </div>
          </div>
          <h2 className="ir-kpi-val">{kpis.collectionRate}%</h2>
          <div className="ir-kpi-sub">
            <span>{kpis.paidVouchersCount || 0} paid in full</span>
          </div>
        </div>

        {/* Waivers & Discounts */}
        <div className="ir-kpi-card">
          <div className="ir-kpi-top">
            <span className="ir-kpi-label">Waivers & Discounts</span>
            <div className="ir-kpi-icon-wrap purple">
              <Percent size={18} />
            </div>
          </div>
          <h2 className="ir-kpi-val">Rs. {(kpis.totalWaived || 0).toLocaleString()}</h2>
          <div className="ir-kpi-sub">
            <span>Approved concessions</span>
          </div>
        </div>

        {/* Enrolled Paying Students */}
        <div className="ir-kpi-card">
          <div className="ir-kpi-top">
            <span className="ir-kpi-label">Paying Students</span>
            <div className="ir-kpi-icon-wrap cyan">
              <Users size={18} />
            </div>
          </div>
          <h2 className="ir-kpi-val">{kpis.activePayingStudents || 0}</h2>
          <div className="ir-kpi-sub">
            <span>Active student accounts</span>
          </div>
        </div>
      </section>

      {/* ── TABS NAVIGATION ── */}
      <nav className="ir-tabs-bar" aria-label="Revenue sections">
        <button
          className={`ir-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
          type="button"
        >
          <Building2 size={16} />
          Campuses Breakdown & Comparison
        </button>
        <button
          className={`ir-tab-btn ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => setActiveTab("transactions")}
          type="button"
        >
          <CreditCard size={16} />
          Confirmed Receipts Ledger ({txTotal || kpis.totalTransactionsCount || 0})
        </button>
        <button
          className={`ir-tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
          type="button"
        >
          <FileText size={16} />
          Student Vouchers / Invoices ({kpis.totalVouchers || 0})
        </button>
        <button
          className={`ir-tab-btn ${activeTab === "structures" ? "active" : ""}`}
          onClick={() => setActiveTab("structures")}
          type="button"
        >
          <Layers size={16} />
          Campus Fee Structures
        </button>
      </nav>

      {/* ── TAB CONTENT ── */}
      {loadingAnalytics ? (
        <PageLoader message="Loading multi-campus financial data..." className="py-12" />
      ) : activeTab === "overview" ? (
        /* ═════════ TAB 1: CAMPUSES BREAKDOWN & COMPARISON ═════════ */
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section Heading */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#09090b" }}>
                Branch-by-Branch Performance
              </h2>
              <p style={{ fontSize: "13px", color: "#71717a", margin: "2px 0 0 0" }}>
                Real-time collection efficiency and revenue comparison across all campuses
              </p>
            </div>
            {selectedCampus !== "all" && (
              <button
                className="ir-btn-outline"
                onClick={() => setSelectedCampus("all")}
                style={{ height: "32px", fontSize: "12px" }}
              >
                Clear Branch Filter (Show All)
              </button>
            )}
          </div>

          {/* Campus Cards Grid */}
          <div className="ir-campus-grid">
            {campusBreakdown.map((campus) => {
              const rate = campus.collectionRate || 0;
              const rateClass = rate >= 75 ? "high" : rate >= 40 ? "mid" : "low";

              return (
                <div key={campus.id} className="ir-campus-card">
                  <div>
                    {/* Top Row */}
                    <div className="ir-campus-top">
                      <div className="ir-campus-name-wrap">
                        <div className="ir-campus-icon">
                          <Building2 size={20} />
                        </div>
                        <div className="ir-campus-title">
                          <h3>{campus.name}</h3>
                          <p>
                            {campus.city || "Main City"} {campus.code ? `• Code: ${campus.code}` : ""}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        style={{
                          background: rate >= 75 ? "#ecfdf5" : rate >= 40 ? "#fffbeb" : "#fef2f2",
                          color: rate >= 75 ? "#065f46" : rate >= 40 ? "#92400e" : "#991b1b",
                          border: `1px solid ${rate >= 75 ? "#a7f3d0" : rate >= 40 ? "#fde68a" : "#fecaca"}`,
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        {rate}% Collected
                      </Badge>
                    </div>

                    {/* Manager Row */}
                    <div className="ir-campus-manager-row" style={{ marginTop: "14px" }}>
                      <span>Campus Manager:</span>
                      <strong>{campus.manager?.name || "Unassigned"}</strong>
                    </div>

                    {/* Collection Progress */}
                    <div className="ir-progress-wrap" style={{ marginTop: "14px" }}>
                      <div className="ir-progress-meta">
                        <span>Collection Rate</span>
                        <span>{rate}%</span>
                      </div>
                      <div className="ir-progress-track">
                        <div
                          className={`ir-progress-fill ${rateClass}`}
                          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Stats Grid */}
                    <div className="ir-campus-financial-grid" style={{ marginTop: "14px" }}>
                      <div className="ir-cfg-item">
                        <span>Total Invoiced</span>
                        <p>Rs. {campus.totalBilled.toLocaleString()}</p>
                      </div>
                      <div className="ir-cfg-item collected">
                        <span>Collected</span>
                        <p>Rs. {campus.totalCollected.toLocaleString()}</p>
                      </div>
                      <div className="ir-cfg-item outstanding">
                        <span>Outstanding</span>
                        <p>Rs. {campus.totalOutstanding.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="ir-campus-bottom-actions">
                    <span style={{ fontSize: "12px", color: "#71717a" }}>
                      <strong>{campus.studentsCount}</strong> enrolled students
                    </span>
                    <button
                      className="ir-btn-outline"
                      style={{ height: "30px", fontSize: "11px", padding: "0 10px" }}
                      onClick={() => {
                        setSelectedCampus(campus.id);
                        setActiveTab("transactions");
                      }}
                    >
                      View Branch Ledger <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytics Row: Monthly Trend & Revenue Streams */}
          <div className="ir-analytics-row">
            {/* Monthly Trend Visualizer */}
            <div className="ir-analytics-card">
              <h3>
                <TrendingUp size={16} />
                Monthly Revenue Collection Trajectory
              </h3>

              {analytics?.monthlyTrend?.length ? (
                <div className="ir-monthly-list">
                  {analytics.monthlyTrend.map((m) => (
                    <div key={m.month} className="ir-monthly-item">
                      <div className="ir-monthly-header">
                        <span>
                          <strong>{m.month}</strong> ({m.vouchers} vouchers)
                        </span>
                        <span>
                          <strong style={{ color: "#059669" }}>Rs. {m.collected.toLocaleString()}</strong> of Rs.{" "}
                          {m.billed.toLocaleString()} ({m.collectionRate}%)
                        </span>
                      </div>
                      <div className="ir-monthly-bars">
                        <div
                          className="ir-monthly-bar-collected"
                          style={{ width: `${Math.min(100, m.collectionRate)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ir-empty-state" style={{ padding: "24px 0" }}>
                  <p>No monthly billing records found for this period.</p>
                </div>
              )}
            </div>

            {/* Revenue Streams Distribution */}
            <div className="ir-analytics-card">
              <h3>
                <Banknote size={16} />
                Revenue Streams & Categories
              </h3>

              {analytics?.feeTypeBreakdown?.length ? (
                <div className="ir-dist-list">
                  {analytics.feeTypeBreakdown.map((item, idx) => (
                    <div key={idx} className="ir-dist-item">
                      <div className="ir-dist-name">
                        <span
                          className="ir-dist-dot"
                          style={{
                            background:
                              idx === 0 ? "#059669" : idx === 1 ? "#2563eb" : idx === 2 ? "#7c3aed" : "#f59e0b",
                          }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="ir-dist-numbers">
                        <strong>Rs. {item.collected.toLocaleString()}</strong>
                        <small>{item.percentage}% share</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ir-empty-state" style={{ padding: "24px 0" }}>
                  <p>No fee breakdown categories recorded yet.</p>
                </div>
              )}

              <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #f4f4f5" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 10px 0" }}>
                  Payment Methods Utilized:
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {analytics?.paymentMethodBreakdown?.map((pm, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 600 }}
                    >
                      {pm.method}: Rs. {pm.totalAmount.toLocaleString()} ({pm.count} txns)
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "transactions" ? (
        /* ═════════ TAB 2: CONFIRMED TRANSACTIONS LEDGER ═════════ */
        <div className="ir-table-card">
          <div className="ir-table-controls">
            <div className="ir-search-box">
              <Search size={15} style={{ color: "#a1a1aa" }} />
              <input
                type="text"
                placeholder="Search by student, roll, receipt #..."
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
              />
            </div>

            <div className="ir-table-filters">
              <select
                className="ir-select"
                value={txMethod}
                onChange={(e) => {
                  setTxMethod(e.target.value);
                  setTxPage(1);
                }}
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Online">Online Payment</option>
                <option value="Cheque">Cheque</option>
              </select>

              <select
                className="ir-select"
                value={txStatus}
                onChange={(e) => {
                  setTxStatus(e.target.value);
                  setTxPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending Verification</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="ir-table-wrapper">
            {txLoading ? (
              <PageLoader message="Loading transaction records..." className="py-12" />
            ) : transactions.length > 0 ? (
              <table className="ir-data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Student Details</th>
                    <th>Campus Branch</th>
                    <th>Fee Category</th>
                    <th>Amount Paid</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const st = t.studentId || {};
                    const cp = t.campusId || {};
                    const fr = t.feeRecordId || {};

                    return (
                      <tr key={t._id}>
                        <td>
                          <strong style={{ fontFamily: "monospace", color: "#09090b" }}>
                            {t.receiptNo || fr.receiptNo || "—"}
                          </strong>
                        </td>
                        <td>
                          <div className="ir-student-cell">
                            <div className="ir-student-avatar">
                              {(st.name || "S").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="ir-student-meta">
                              <strong>{st.name || "Student"}</strong>
                              <span>Roll: {st.roll || st.rollNo || "N/A"} • {st.gradeOrClass || "General"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ir-branch-badge">
                            <Building2 size={12} />
                            {cp.name || "Branch"}
                          </span>
                        </td>
                        <td>{fr.feeType || "Tuition Fee"}</td>
                        <td>
                          <strong style={{ color: "#059669" }}>Rs. {(t.amount || 0).toLocaleString()}</strong>
                        </td>
                        <td>
                          <Badge variant="outline" style={{ fontSize: "11px", fontWeight: 600 }}>
                            {t.paymentMethod || "Cash"}
                          </Badge>
                        </td>
                        <td>
                          {t.paymentDate
                            ? new Date(t.paymentDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>
                          <Badge
                            variant="secondary"
                            style={{
                              background: t.status === "CONFIRMED" ? "#ecfdf5" : "#fef3c7",
                              color: t.status === "CONFIRMED" ? "#065f46" : "#92400e",
                              fontWeight: 700,
                            }}
                          >
                            {t.status || "CONFIRMED"}
                          </Badge>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="ir-action-btn"
                            type="button"
                            onClick={() => {
                              setSelectedItem(t);
                              setModalOpen(true);
                            }}
                          >
                            <Eye size={12} /> Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="ir-empty-state">
                <div className="ir-empty-icon">
                  <Receipt size={24} />
                </div>
                <h4>No transactions found</h4>
                <p>Try adjusting your campus filter or search keywords.</p>
              </div>
            )}
          </div>

          {txTotal > 15 && (
            <div style={{ marginTop: "16px" }}>
              <DataPagination
                page={txPage}
                pageSize={15}
                total={txTotal}
                onPageChange={setTxPage}
                showPageSize={false}
                itemLabel="transactions"
              />
            </div>
          )}
        </div>
      ) : activeTab === "invoices" ? (
        /* ═════════ TAB 3: STUDENT INVOICES & VOUCHERS LEDGER ═════════ */
        <div className="ir-table-card">
          <div className="ir-table-controls">
            <div className="ir-search-box">
              <Search size={15} style={{ color: "#a1a1aa" }} />
              <input
                type="text"
                placeholder="Search by student, roll, challan #..."
                value={invSearch}
                onChange={(e) => {
                  setInvSearch(e.target.value);
                  setInvPage(1);
                }}
              />
            </div>

            <div className="ir-table-filters">
              <select
                className="ir-select"
                value={invStatus}
                onChange={(e) => {
                  setInvStatus(e.target.value);
                  setInvPage(1);
                }}
              >
                <option value="all">All Invoice Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>

          <div className="ir-table-wrapper">
            {invLoading ? (
              <PageLoader message="Loading student invoices..." className="py-12" />
            ) : invoices.length > 0 ? (
              <table className="ir-data-table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Student</th>
                    <th>Campus</th>
                    <th>Billing Cycle</th>
                    <th>Total Billed</th>
                    <th>Paid Amount</th>
                    <th>Balance Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const st = inv.studentId || {};
                    const cp = inv.campusId || {};
                    const billed = inv.totalPayable || inv.amount || 0;
                    const paid = inv.paidAmount || 0;
                    const due = Math.max(0, billed - paid);

                    return (
                      <tr key={inv._id}>
                        <td>
                          <strong style={{ fontFamily: "monospace", color: "#09090b" }}>
                            {inv.challanNo || "—"}
                          </strong>
                        </td>
                        <td>
                          <div className="ir-student-cell">
                            <div className="ir-student-avatar">
                              {(st.name || "S").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="ir-student-meta">
                              <strong>{st.name || "Student"}</strong>
                              <span>Roll: {st.roll || st.rollNo || "N/A"} • {inv.gradeOrClass || "General"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ir-branch-badge">
                            <Building2 size={12} />
                            {cp.name || "Branch"}
                          </span>
                        </td>
                        <td>{inv.month || "Current"}</td>
                        <td>Rs. {billed.toLocaleString()}</td>
                        <td>
                          <strong style={{ color: "#059669" }}>Rs. {paid.toLocaleString()}</strong>
                        </td>
                        <td>
                          <strong style={{ color: due > 0 ? "#b45309" : "#71717a" }}>
                            Rs. {due.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td>
                          <Badge
                            variant="secondary"
                            style={{
                              background:
                                inv.status === "PAID"
                                  ? "#ecfdf5"
                                  : inv.status === "PARTIALLY_PAID"
                                  ? "#fef3c7"
                                  : inv.status === "OVERDUE"
                                  ? "#fef2f2"
                                  : "#f4f4f5",
                              color:
                                inv.status === "PAID"
                                  ? "#065f46"
                                  : inv.status === "PARTIALLY_PAID"
                                  ? "#92400e"
                                  : inv.status === "OVERDUE"
                                  ? "#991b1b"
                                  : "#3f3f46",
                              fontWeight: 700,
                            }}
                          >
                            {inv.status || "UNPAID"}
                          </Badge>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="ir-action-btn"
                            type="button"
                            onClick={() => {
                              setSelectedItem(inv);
                              setModalOpen(true);
                            }}
                          >
                            <Eye size={12} /> Challan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="ir-empty-state">
                <div className="ir-empty-icon">
                  <FileText size={24} />
                </div>
                <h4>No invoices found</h4>
                <p>No billing vouchers match your current filters.</p>
              </div>
            )}
          </div>

          {invTotal > 15 && (
            <div style={{ marginTop: "16px" }}>
              <DataPagination
                page={invPage}
                pageSize={15}
                total={invTotal}
                onPageChange={setInvPage}
                showPageSize={false}
                itemLabel="invoices"
              />
            </div>
          )}
        </div>
      ) : (
        /* ═════════ TAB 4: CAMPUS FEE STRUCTURES ═════════ */
        <div className="ir-table-card">
          <div style={{ marginBottom: "18px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
              Campus Fee Structure Configurations
            </h3>
            <p style={{ fontSize: "12px", color: "#71717a", margin: "4px 0 0 0" }}>
              Comparative overview of tuition fees, admission fees, and lab rates configured by each campus branch
            </p>
          </div>

          {structuresLoading ? (
            <PageLoader message="Loading fee structures..." className="py-12" />
          ) : structures.length > 0 ? (
            <div className="ir-table-wrapper">
              <table className="ir-data-table">
                <thead>
                  <tr>
                    <th>Campus Branch</th>
                    <th>Grade / Class</th>
                    <th>Monthly Tuition</th>
                    <th>Admission Fee</th>
                    <th>Lab Fee</th>
                    <th>Computer Fee</th>
                    <th>Late Fine Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {structures.map((fs) => (
                    <tr key={fs._id}>
                      <td>
                        <strong style={{ color: "#09090b" }}>{fs.campusId?.name || "Campus"}</strong>
                        <span style={{ display: "block", fontSize: "11px", color: "#71717a" }}>
                          {fs.campusId?.city || "Branch"}
                        </span>
                      </td>
                      <td>
                        <Badge variant="outline" style={{ fontWeight: 700 }}>
                          {fs.gradeOrClass}
                        </Badge>
                      </td>
                      <td>
                        <strong style={{ color: "#059669" }}>
                          Rs. {(fs.tuitionFee || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>Rs. {(fs.admissionFee || 0).toLocaleString()}</td>
                      <td>Rs. {(fs.labFee || 0).toLocaleString()}</td>
                      <td>Rs. {(fs.computerFee || 0).toLocaleString()}</td>
                      <td>Rs. {(fs.lateFeeFine || 0).toLocaleString()}</td>
                      <td>
                        <Badge
                          variant="secondary"
                          style={{
                            background: fs.isActive ? "#ecfdf5" : "#f4f4f5",
                            color: fs.isActive ? "#065f46" : "#71717a",
                            fontWeight: 700,
                          }}
                        >
                          {fs.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ir-empty-state">
              <div className="ir-empty-icon">
                <Layers size={24} />
              </div>
              <h4>No fee structures configured yet</h4>
              <p>Campus managers configure fee structures for their respective class grades.</p>
            </div>
          )}
        </div>
      )}

      {/* ── DIGITAL RECEIPT / CHALLAN MODAL ── */}
      <ReceiptModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        instituteName={analytics?.campuses?.[0]?.name ? "EduHub Multi-Campus Network" : "EduHub Institution"}
      />
    </div>
  );
}

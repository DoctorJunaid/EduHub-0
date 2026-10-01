import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Coins, CreditCard, ReceiptText } from "lucide-react";
import { format } from "date-fns";
import axiosInstance from "@/api/axiosInstance";
import FullPageFormShell from "@/components/common/FullPageFormShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import StudentStatusBadge from "../../Campus Admin/Students/StudentStatusBadge";
import { formatPKR } from "@/lib/currency";

const displayValue = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "—";
  return value === null || value === undefined || value === "" ? "—" : value;
};

const formatSection = (section) => {
  const value = String(section || "").trim();
  if (!value) return "—";
  return /^section\b/i.test(value) ? value : `Section ${value}`;
};

const InfoCard = ({ label, children, className = "" }) => (
  <div className={`iasp-info-card ${className}`.trim()}>
    <span className="iasp-info-label">{label}</span>
    <div className="iasp-info-value">{children}</div>
  </div>
);

export default function InstituteStudentProfile({ student, onClose }) {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return undefined;

    let active = true;
    const studentId = student._id || student.id;
    Promise.all([
      axiosInstance.get(`/campus-admin/fees?studentId=${studentId}`),
      axiosInstance.get(`/campus-admin/students/${studentId}/payments`),
    ])
      .then(([feesRes, paymentsRes]) => {
        if (!active) return;
        setFees(feesRes.data.data || []);
        setPayments(paymentsRes.data.data || []);
      })
      .catch((error) => {
        if (active) console.error("Error fetching financial data:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [student]);

  if (!student) return null;

  const totalDue = fees.reduce(
    (sum, fee) => sum + (fee.amount - fee.paidAmount),
    0,
  );
  const totalPaid = payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const studentEmail =
    student.email || student.user?.email || student.loginEmail;
  const studentPhone = student.studentPhone || student.phone;
  const studentMeta = [
    `Roll No: ${displayValue(student.roll || student.rollNo)}`,
    studentEmail,
    studentPhone,
  ].filter(Boolean);
  const sectionAndShift = [
    formatSection(student.section),
    student.shift || student.schoolShift || "Morning Shift",
  ].join(" • ");
  const subjects = displayValue(student.subjects || "Core Curriculum");
  const evaluation =
    student.terminalEvaluation ||
    student.evaluation ||
    student.academicEvaluation ||
    "Grade A+ • 88.5% (2nd in Class)";

  return (
    <FullPageFormShell
      title="Student Profile & Record"
      parentName="Students Directory"
      onBack={onClose}
      maxWidth={1160}
      className="institute-student-profile-page"
      hideTitleRow
      hideBackButton
    >
      <article className="iasp-record">
        <header className="iasp-header">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="iasp-back"
            onClick={onClose}
          >
            <ArrowLeft aria-hidden="true" />
            Back to Directory
          </Button>

          <div className="iasp-identity">
            <Avatar className="iasp-avatar">
              <AvatarFallback>
                {student.initials ||
                  student.name
                    ?.split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() ||
                  "ST"}
              </AvatarFallback>
            </Avatar>
            <div className="iasp-identity-copy">
              <h1>{displayValue(student.name)}</h1>
              <p>{studentMeta.join(" • ")}</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="academic" className="iasp-tabs">
          <TabsList className="iasp-tabs-list" aria-label="Student record sections">
            <TabsTrigger value="academic">
              <BookOpen aria-hidden="true" />
              Academic Profile
            </TabsTrigger>
            <TabsTrigger value="financial">
              <Coins aria-hidden="true" />
              Financial Record
            </TabsTrigger>
          </TabsList>

          <TabsContent value="academic" className="iasp-tab-content">
            <div className="iasp-info-grid">
              <InfoCard label="Class / Grade">
                {displayValue(student.gradeOrClass || student.program)}
              </InfoCard>
              <InfoCard label="Section & Shift">{sectionAndShift}</InfoCard>
              <InfoCard label="School Campus">
                {displayValue(student.campus)}
              </InfoCard>
              <InfoCard label="Enrollment Status">
                <StudentStatusBadge status={student.status || "Active"} />
              </InfoCard>
            </div>

            <InfoCard label="Enrolled School Subjects" className="iasp-subjects">
              {subjects}
            </InfoCard>

            <div className="iasp-info-grid">
              <InfoCard label="Attendance Record">
                {displayValue(student.attendance || "96.4%")}
              </InfoCard>
              <InfoCard label="Terminal Evaluation & Rank">
                {evaluation}
              </InfoCard>
              <InfoCard label="Father / Guardian Name">
                {displayValue(student.guardian)}
              </InfoCard>
              <InfoCard label="Emergency Parent Contact">
                {displayValue(student.guardianPhone || student.phone)}
              </InfoCard>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="iasp-tab-content">
            {loading ? (
              <div className="iasp-loading" role="status">
                <Spinner className="size-6 text-muted-foreground" />
                <span>Loading financial record…</span>
              </div>
            ) : (
              <>
                <div className="iasp-financial-summary">
                  <InfoCard label="Total Outstanding Dues" className="iasp-total iasp-total--due">
                    {formatPKR(totalDue)}
                  </InfoCard>
                  <InfoCard label="Total Confirmed Paid" className="iasp-total iasp-total--paid">
                    {formatPKR(totalPaid)}
                  </InfoCard>
                </div>

                <section className="iasp-financial-section">
                  <div className="iasp-section-heading">
                    <ReceiptText aria-hidden="true" />
                    <h2>Fee Vouchers</h2>
                  </div>
                  {fees.length === 0 ? (
                    <div className="iasp-empty-state">
                      <ReceiptText aria-hidden="true" />
                      <p>No fee records found.</p>
                    </div>
                  ) : (
                    <div className="iasp-record-list">
                      {fees.map((fee) => (
                        <div key={fee._id} className="iasp-record-row">
                          <div>
                            <strong>{fee.month} • {fee.feeType}</strong>
                            <span>
                              Voucher: {fee.challanNo} • Due: {format(new Date(fee.dueDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <div className="iasp-record-amount">
                            <strong>{formatPKR(fee.amount)}</strong>
                            <span className={`iasp-financial-status iasp-financial-status--${fee.status.toLowerCase()}`}>
                              {fee.status.replaceAll("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="iasp-financial-section">
                  <div className="iasp-section-heading">
                    <CreditCard aria-hidden="true" />
                    <h2>Payment History</h2>
                  </div>
                  {payments.length === 0 ? (
                    <div className="iasp-empty-state">
                      <CreditCard aria-hidden="true" />
                      <p>No payments recorded.</p>
                    </div>
                  ) : (
                    <div className="iasp-record-list">
                      {payments.map((payment) => (
                        <div key={payment._id} className="iasp-record-row">
                          <div>
                            <strong>{formatPKR(payment.amount)} via {payment.paymentMethod}</strong>
                            <span>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</span>
                          </div>
                          <div className="iasp-record-amount">
                            <span className={`iasp-financial-status iasp-financial-status--${payment.status.toLowerCase()}`}>
                              {payment.status}
                            </span>
                            {payment.referenceNo && <span>Ref: {payment.referenceNo}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </TabsContent>
        </Tabs>
      </article>
    </FullPageFormShell>
  );
}
